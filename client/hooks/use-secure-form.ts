import { useState, useCallback, useEffect } from "react";
import {
  InputSanitizer,
  XSSProtection,
  RateLimiter,
  ValidationSchemas,
} from "@/lib/security";
import { withSecureValidation, SecurityLogger } from "@/lib/secure-api";

interface FormField {
  value: string;
  error: string | null;
  touched: boolean;
  sanitized: boolean;
}

interface SecureFormOptions<T> {
  initialValues: T;
  validationSchema?: Partial<Record<keyof T, (value: any) => any>>;
  onSubmit?: (values: T) => Promise<void> | void;
  sanitizeOnChange?: boolean;
  rateLimitKey?: string;
  maxSubmissions?: number;
  submissionWindow?: number;
}

interface SecureFormState<T> {
  fields: Record<keyof T, FormField>;
  isSubmitting: boolean;
  submitError: string | null;
  submitCount: number;
  isValid: boolean;
}

export function useSecureForm<T extends Record<string, any>>(
  options: SecureFormOptions<T>,
) {
  const {
    initialValues,
    validationSchema,
    onSubmit,
    sanitizeOnChange = true,
    rateLimitKey = "form_submission",
    maxSubmissions = 5,
    submissionWindow = 60000, // 1 minute
  } = options;

  // Initialize form state
  const [state, setState] = useState<SecureFormState<T>>(() => {
    const fields = {} as Record<keyof T, FormField>;
    for (const key in initialValues) {
      fields[key] = {
        value: initialValues[key],
        error: null,
        touched: false,
        sanitized: false,
      };
    }
    return {
      fields,
      isSubmitting: false,
      submitError: null,
      submitCount: 0,
      isValid: false,
    };
  });

  // Validate individual field
  const validateField = useCallback(
    (name: keyof T, value: any): string | null => {
      if (!validationSchema || !validationSchema[name]) return null;

      try {
        validationSchema[name]!(value);
        return null;
      } catch (error) {
        return error instanceof Error ? error.message : "Invalid input";
      }
    },
    [validationSchema],
  );

  // Sanitize field value
  const sanitizeField = useCallback((name: keyof T, value: string): string => {
    // Apply appropriate sanitization based on field name
    if (name.toString().includes("email")) {
      try {
        return InputSanitizer.sanitizeEmail(value);
      } catch {
        return InputSanitizer.sanitizeText(value);
      }
    }

    if (name.toString().includes("phone")) {
      try {
        return InputSanitizer.sanitizePhoneNumber(value);
      } catch {
        return InputSanitizer.sanitizeText(value);
      }
    }

    if (
      name.toString().includes("amount") ||
      name.toString().includes("price")
    ) {
      try {
        return InputSanitizer.sanitizeNumber(value).toString();
      } catch {
        return value;
      }
    }

    if (
      name.toString().includes("html") ||
      name.toString().includes("content")
    ) {
      return XSSProtection.createSafeHTML(value);
    }

    return InputSanitizer.sanitizeText(value);
  }, []);

  // Update field value
  const setFieldValue = useCallback(
    (name: keyof T, value: string) => {
      setState((prev) => {
        const sanitizedValue = sanitizeOnChange
          ? sanitizeField(name, value)
          : value;
        const error = validateField(name, sanitizedValue);

        const newFields = {
          ...prev.fields,
          [name]: {
            value: sanitizedValue,
            error,
            touched: true,
            sanitized: sanitizeOnChange,
          },
        };

        // Check if form is valid
        const isValid = Object.values(newFields).every((field) => !field.error);

        // Log suspicious input patterns
        if (value !== sanitizedValue) {
          SecurityLogger.logSecurityEvent("input_sanitized", {
            field: name.toString(),
            originalValue: value.substring(0, 100), // Limit for privacy
            sanitizedValue: sanitizedValue.substring(0, 100),
          });
        }

        return {
          ...prev,
          fields: newFields,
          isValid,
        };
      });
    },
    [sanitizeField, validateField, sanitizeOnChange],
  );

  // Touch field (mark as interacted)
  const setFieldTouched = useCallback((name: keyof T) => {
    setState((prev) => ({
      ...prev,
      fields: {
        ...prev.fields,
        [name]: {
          ...prev.fields[name],
          touched: true,
        },
      },
    }));
  }, []);

  // Get field props for form inputs
  const getFieldProps = useCallback(
    (name: keyof T) => ({
      value: state.fields[name]?.value || "",
      onChange: (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
      ) => setFieldValue(name, e.target.value),
      onBlur: () => setFieldTouched(name),
      error: state.fields[name]?.touched ? state.fields[name]?.error : null,
      "data-field": name.toString(),
      "data-sanitized": state.fields[name]?.sanitized,
    }),
    [state.fields, setFieldValue, setFieldTouched],
  );

  // Validate all fields
  const validateForm = useCallback((): boolean => {
    if (!validationSchema) return true;

    setState((prev) => {
      const newFields = { ...prev.fields };
      let isValid = true;

      for (const name in newFields) {
        const field = newFields[name];
        const error = validateField(name, field.value);
        newFields[name] = {
          ...field,
          error,
          touched: true,
        };
        if (error) isValid = false;
      }

      return {
        ...prev,
        fields: newFields,
        isValid,
      };
    });

    return state.isValid;
  }, [validateField, validationSchema, state.isValid]);

  // Submit form securely
  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();

      // Rate limiting check
      if (
        !RateLimiter.canPerformAction(
          rateLimitKey,
          maxSubmissions,
          submissionWindow,
        )
      ) {
        const remaining = RateLimiter.getTimeUntilReset(rateLimitKey);
        setState((prev) => ({
          ...prev,
          submitError: `Too many submissions. Try again in ${Math.ceil(
            remaining / 1000,
          )} seconds.`,
        }));
        return;
      }

      // Validate form
      if (!validateForm()) {
        setState((prev) => ({
          ...prev,
          submitError: "Please fix the errors above",
        }));
        return;
      }

      setState((prev) => ({
        ...prev,
        isSubmitting: true,
        submitError: null,
      }));

      try {
        // Sanitize all values before submission
        const values = {} as T;
        for (const name in state.fields) {
          const field = state.fields[name];
          values[name] = field.sanitized
            ? field.value
            : sanitizeField(name, field.value);
        }

        // Additional validation with schema
        if (validationSchema) {
          withSecureValidation(values, validationSchema);
        }

        // Log successful form submission
        SecurityLogger.logSecurityEvent("form_submitted", {
          formType: rateLimitKey,
          fieldCount: Object.keys(values).length,
        });

        // Call submit handler
        if (onSubmit) {
          await onSubmit(values);
        }

        setState((prev) => ({
          ...prev,
          submitCount: prev.submitCount + 1,
        }));
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Submission failed";

        setState((prev) => ({
          ...prev,
          submitError: errorMessage,
        }));

        // Log submission error for security monitoring
        SecurityLogger.logSecurityEvent("form_submission_failed", {
          formType: rateLimitKey,
          error: errorMessage,
        });
      } finally {
        setState((prev) => ({
          ...prev,
          isSubmitting: false,
        }));
      }
    },
    [
      rateLimitKey,
      maxSubmissions,
      submissionWindow,
      validateForm,
      state.fields,
      sanitizeField,
      validationSchema,
      onSubmit,
    ],
  );

  // Reset form
  const resetForm = useCallback(() => {
    const fields = {} as Record<keyof T, FormField>;
    for (const key in initialValues) {
      fields[key] = {
        value: initialValues[key],
        error: null,
        touched: false,
        sanitized: false,
      };
    }
    setState({
      fields,
      isSubmitting: false,
      submitError: null,
      submitCount: 0,
      isValid: false,
    });
  }, [initialValues]);

  // Get current form values
  const getValues = useCallback((): T => {
    const values = {} as T;
    for (const name in state.fields) {
      values[name] = state.fields[name].value;
    }
    return values;
  }, [state.fields]);

  // Security monitoring for suspicious activity
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Detect potential script injection attempts
      if (e.ctrlKey && e.shiftKey && e.key === "I") {
        SecurityLogger.logSecurityEvent("devtools_access_attempt", {
          formType: rateLimitKey,
        });
      }
    };

    const handlePaste = (e: ClipboardEvent) => {
      const pastedText = e.clipboardData?.getData("text") || "";
      if (
        pastedText.includes("<script") ||
        pastedText.includes("javascript:")
      ) {
        SecurityLogger.logSecurityEvent("suspicious_paste_detected", {
          formType: rateLimitKey,
          contentPreview: pastedText.substring(0, 100),
        });
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("paste", handlePaste);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("paste", handlePaste);
    };
  }, [rateLimitKey]);

  return {
    // Field utilities
    getFieldProps,
    setFieldValue,
    setFieldTouched,

    // Form state
    values: getValues(),
    errors: Object.fromEntries(
      Object.entries(state.fields).map(([key, field]) => [key, field.error]),
    ) as Record<keyof T, string | null>,
    touched: Object.fromEntries(
      Object.entries(state.fields).map(([key, field]) => [key, field.touched]),
    ) as Record<keyof T, boolean>,

    // Form actions
    handleSubmit,
    resetForm,
    validateForm,

    // Form status
    isSubmitting: state.isSubmitting,
    isValid: state.isValid,
    submitError: state.submitError,
    submitCount: state.submitCount,

    // Rate limiting info
    remainingSubmissions: RateLimiter.getRemainingAttempts(
      rateLimitKey,
      maxSubmissions,
    ),
    timeUntilReset: RateLimiter.getTimeUntilReset(rateLimitKey),
  };
}

// Preset validation schemas for common forms
export const SecureFormSchemas = {
  invoiceForm: ValidationSchemas.invoice,
  merchantForm: ValidationSchemas.merchant,
  paymentForm: ValidationSchemas.payment,
};
