import DOMPurify from "isomorphic-dompurify";

// Input sanitization utilities
export class InputSanitizer {
  // Sanitize text input to prevent XSS
  static sanitizeText(input: string): string {
    if (!input || typeof input !== "string") return "";

    // Remove potentially dangerous characters and patterns
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // Remove script tags
      .replace(/javascript:/gi, "") // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, "") // Remove event handlers
      .replace(/data:/gi, "") // Remove data: protocol
      .replace(/vbscript:/gi, "") // Remove vbscript: protocol
      .trim()
      .slice(0, 10000); // Limit length to prevent DoS
  }

  // Sanitize HTML content
  static sanitizeHTML(input: string): string {
    if (!input || typeof input !== "string") return "";

    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ["b", "i", "em", "strong", "p", "br"],
      ALLOWED_ATTR: [],
      FORBID_SCRIPTS: true,
      FORBID_TAGS: ["script", "object", "embed", "form", "input"],
    });
  }

  // Sanitize email input
  static sanitizeEmail(email: string): string {
    if (!email || typeof email !== "string") return "";

    const sanitized = this.sanitizeText(email);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(sanitized)) {
      throw new Error("Invalid email format");
    }

    return sanitized.toLowerCase();
  }

  // Sanitize phone number
  static sanitizePhoneNumber(phone: string): string {
    if (!phone || typeof phone !== "string") return "";

    // Remove all non-digit characters except +
    const cleaned = phone.replace(/[^\d+]/g, "");

    // Validate phone number format
    if (cleaned.length < 10 || cleaned.length > 15) {
      throw new Error("Invalid phone number length");
    }

    return cleaned;
  }

  // Sanitize numeric input
  static sanitizeNumber(
    input: string | number,
    min?: number,
    max?: number,
  ): number {
    let num: number;

    if (typeof input === "string") {
      // Remove non-numeric characters except decimal point and minus
      const cleaned = input.replace(/[^\d.-]/g, "");
      num = parseFloat(cleaned);
    } else {
      num = input;
    }

    if (isNaN(num) || !isFinite(num)) {
      throw new Error("Invalid number format");
    }

    if (min !== undefined && num < min) {
      throw new Error(`Number must be at least ${min}`);
    }

    if (max !== undefined && num > max) {
      throw new Error(`Number must be at most ${max}`);
    }

    return num;
  }

  // Sanitize invoice ID
  static sanitizeInvoiceId(invoiceId: string): string {
    if (!invoiceId || typeof invoiceId !== "string") return "";

    // Only allow alphanumeric, hyphens, and underscores
    const sanitized = invoiceId.replace(/[^a-zA-Z0-9\-_]/g, "");

    if (sanitized.length < 3 || sanitized.length > 50) {
      throw new Error("Invalid invoice ID format");
    }

    return sanitized;
  }

  // Sanitize cryptocurrency address
  static sanitizeCryptoAddress(
    address: string,
    currency: "BTC" | "USDT",
  ): string {
    if (!address || typeof address !== "string") return "";

    const sanitized = this.sanitizeText(address);

    if (currency === "BTC") {
      // Bitcoin address validation (simplified)
      const btcRegex = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/;
      if (!btcRegex.test(sanitized)) {
        throw new Error("Invalid Bitcoin address format");
      }
    } else if (currency === "USDT") {
      // Ethereum address validation for USDT
      const ethRegex = /^0x[a-fA-F0-9]{40}$/;
      if (!ethRegex.test(sanitized)) {
        throw new Error("Invalid USDT address format");
      }
    }

    return sanitized;
  }

  // Sanitize file upload
  static validateFile(
    file: File,
    allowedTypes: string[],
    maxSize: number,
  ): void {
    if (!file) {
      throw new Error("No file provided");
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`Invalid file type. Allowed: ${allowedTypes.join(", ")}`);
    }

    // Check file size
    if (file.size > maxSize) {
      throw new Error(
        `File too large. Maximum size: ${maxSize / 1024 / 1024}MB`,
      );
    }

    // Check for potentially dangerous file names
    const dangerousPatterns = [
      /\.exe$/i,
      /\.bat$/i,
      /\.cmd$/i,
      /\.scr$/i,
      /\.js$/i,
    ];
    if (dangerousPatterns.some((pattern) => pattern.test(file.name))) {
      throw new Error("File type not allowed for security reasons");
    }
  }
}

// XSS Protection utilities
export class XSSProtection {
  // Escape HTML entities
  static escapeHTML(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // Create safe HTML content
  static createSafeHTML(content: string): string {
    return DOMPurify.sanitize(content, {
      USE_PROFILES: { html: true },
      FORBID_SCRIPTS: true,
      FORBID_TAGS: ["script", "object", "embed", "form", "meta", "link"],
      FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover"],
    });
  }

  // Validate URL to prevent XSS via href attributes
  static validateURL(url: string): boolean {
    try {
      const urlObj = new URL(url);
      // Only allow http, https, and mailto protocols
      const allowedProtocols = ["http:", "https:", "mailto:"];
      return allowedProtocols.includes(urlObj.protocol);
    } catch {
      return false;
    }
  }

  // Content Security Policy helpers
  static generateNonce(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
      "",
    );
  }
}

// Rate limiting for frontend
export class RateLimiter {
  private static attempts: Map<string, { count: number; resetTime: number }> =
    new Map();

  static canPerformAction(
    key: string,
    maxAttempts: number,
    windowMs: number,
  ): boolean {
    const now = Date.now();
    const attempt = this.attempts.get(key);

    if (!attempt || now > attempt.resetTime) {
      // Reset or create new attempt record
      this.attempts.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (attempt.count >= maxAttempts) {
      return false;
    }

    attempt.count++;
    return true;
  }

  static getRemainingAttempts(key: string, maxAttempts: number): number {
    const attempt = this.attempts.get(key);
    if (!attempt || Date.now() > attempt.resetTime) {
      return maxAttempts;
    }
    return Math.max(0, maxAttempts - attempt.count);
  }

  static getTimeUntilReset(key: string): number {
    const attempt = this.attempts.get(key);
    if (!attempt) return 0;
    return Math.max(0, attempt.resetTime - Date.now());
  }
}

// Input validation schemas
export const ValidationSchemas = {
  invoice: {
    amount: (value: string) =>
      InputSanitizer.sanitizeNumber(value, 0.01, 1000000),
    description: (value: string) => {
      const sanitized = InputSanitizer.sanitizeText(value);
      if (sanitized.length < 3 || sanitized.length > 500) {
        throw new Error("Description must be between 3 and 500 characters");
      }
      return sanitized;
    },
    customerEmail: (value: string) => InputSanitizer.sanitizeEmail(value),
    customerName: (value: string) => {
      const sanitized = InputSanitizer.sanitizeText(value);
      if (sanitized.length > 100) {
        throw new Error("Name must be less than 100 characters");
      }
      return sanitized;
    },
  },
  merchant: {
    businessName: (value: string) => {
      const sanitized = InputSanitizer.sanitizeText(value);
      if (sanitized.length < 2 || sanitized.length > 100) {
        throw new Error("Business name must be between 2 and 100 characters");
      }
      return sanitized;
    },
    mpesaNumber: (value: string) => InputSanitizer.sanitizePhoneNumber(value),
    kraPin: (value: string) => {
      const sanitized = InputSanitizer.sanitizeText(value);
      const kraRegex = /^[A-Z]\d{9}[A-Z]$/;
      if (!kraRegex.test(sanitized)) {
        throw new Error("Invalid KRA PIN format");
      }
      return sanitized;
    },
  },
  payment: {
    cryptoAddress: (value: string, currency: "BTC" | "USDT") =>
      InputSanitizer.sanitizeCryptoAddress(value, currency),
    invoiceId: (value: string) => InputSanitizer.sanitizeInvoiceId(value),
  },
};

// Security headers and CSP
export const SecurityConfig = {
  // Content Security Policy
  CSP: {
    "default-src": ["'self'"],
    "script-src": ["'self'", "'unsafe-inline'"], // Note: In production, use nonces instead of unsafe-inline
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "https:"],
    "font-src": ["'self'", "data:"],
    "connect-src": [
      "'self'",
      "https://api.nownodes.io",
      "https://api.yellowcard.io",
    ],
    "frame-ancestors": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
  },

  // Security headers
  headers: {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), location=()",
  },
};
