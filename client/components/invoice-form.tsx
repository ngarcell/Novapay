import { useState } from "react";
import { QpayButton } from "./ui/qpay-button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  DollarSign,
  Store,
  Calendar,
  Smartphone,
  Bitcoin,
  X,
  Shield,
  AlertTriangle,
} from "lucide-react";
import { useSecureForm, SecureFormSchemas } from "@/hooks/use-secure-form";
import { secureAPI, SecurityLogger } from "@/lib/secure-api";
import { Alert, AlertDescription } from "./ui/alert";

interface InvoiceFormProps {
  onClose?: () => void;
  onSubmit?: (invoice: any) => void;
}

const InvoiceForm = ({ onClose, onSubmit }: InvoiceFormProps) => {
  const [selectedStore, setSelectedStore] = useState("");
  const [selectedSettlement, setSelectedSettlement] = useState("mpesa");
  const [selectedExpiry, setSelectedExpiry] = useState("24");

  // Initialize secure form with validation
  const {
    getFieldProps,
    handleSubmit,
    isSubmitting,
    isValid,
    submitError,
    errors,
    touched,
    values,
    remainingSubmissions,
  } = useSecureForm({
    initialValues: {
      amount: "",
      currency: "USD",
      description: "",
      customerEmail: "",
      customerName: "",
      reference: "",
    },
    validationSchema: {
      amount: SecureFormSchemas.invoiceForm.amount,
      description: SecureFormSchemas.invoiceForm.description,
      customerEmail: (value: string) =>
        value ? SecureFormSchemas.invoiceForm.customerEmail(value) : value,
      customerName: (value: string) =>
        value ? SecureFormSchemas.invoiceForm.customerName(value) : value,
    },
    onSubmit: async (secureValues) => {
      try {
        // Log security event
        SecurityLogger.logSecurityEvent("invoice_creation_attempt", {
          amount: secureValues.amount,
          hasCustomerInfo: !!(
            secureValues.customerEmail || secureValues.customerName
          ),
        });

        const invoiceData = {
          ...secureValues,
          amount: parseFloat(secureValues.amount),
          store: selectedStore,
          settlementPreference: selectedSettlement,
          expiryDuration: selectedExpiry,
        };

        // Create invoice through secure API
        const response = await secureAPI.post("/invoices", {
          merchant_id: "merchant_1", // This would come from auth context
          ...invoiceData,
          expires_in_hours: parseInt(selectedExpiry),
        });

        const newInvoice = {
          id: response.invoice?.id || `INV-${Date.now()}`,
          ...invoiceData,
          status: "pending",
          createdAt: new Date().toISOString(),
          expiresAt: new Date(
            Date.now() + parseInt(selectedExpiry) * 60 * 60 * 1000,
          ).toISOString(),
        };

        onSubmit?.(newInvoice);
        onClose?.();

        SecurityLogger.logSecurityEvent("invoice_created_successfully", {
          invoiceId: newInvoice.id,
        });
      } catch (error) {
        SecurityLogger.logSecurityEvent("invoice_creation_failed", {
          error: error instanceof Error ? error.message : "Unknown error",
        });
        throw error;
      }
    },
    rateLimitKey: "invoice_creation",
    maxSubmissions: 10,
    submissionWindow: 300000, // 5 minutes
  });

  const stores = [
    { id: "store1", name: "Main Store" },
    { id: "store2", name: "Online Shop" },
    { id: "store3", name: "Mobile Store" },
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const newInvoice = {
      id: `INV-${Date.now()}`,
      ...formData,
      amount: parseFloat(formData.amount),
      status: "pending",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(
        Date.now() + parseInt(formData.expiryDuration) * 60 * 60 * 1000,
      ).toISOString(),
    };

    setLoading(false);
    onSubmit?.(newInvoice);
    onClose?.();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="glass-card border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl">Create New Invoice</CardTitle>
          <QpayButton variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </QpayButton>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Security Notice */}
            {submitError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}

            {remainingSubmissions < 5 && (
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Rate limit warning: {remainingSubmissions} submissions
                  remaining
                </AlertDescription>
              </Alert>
            )}

            {/* Amount and Currency */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="amount">
                  Amount <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="100.00"
                    {...getFieldProps("amount")}
                    className={`pl-10 ${
                      errors.amount && touched.amount
                        ? "border-red-500"
                        : "border-input"
                    }`}
                    required
                  />
                </div>
                {errors.amount && touched.amount && (
                  <p className="text-red-500 text-sm mt-1">{errors.amount}</p>
                )}
              </div>
              <div>
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) =>
                    handleInputChange("currency", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="KES">KES</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">
                Description <span className="text-red-500">*</span>
              </Label>
              <textarea
                id="description"
                className={`w-full p-3 rounded-lg border bg-background min-h-[80px] ${
                  errors.description && touched.description
                    ? "border-red-500"
                    : "border-input"
                }`}
                placeholder="Payment for products/services..."
                {...getFieldProps("description")}
                maxLength={500}
                required
              />
              <div className="flex justify-between mt-1">
                {errors.description && touched.description && (
                  <p className="text-red-500 text-sm">{errors.description}</p>
                )}
                <p className="text-muted-foreground text-xs ml-auto">
                  {values.description.length}/500 characters
                </p>
              </div>
            </div>

            {/* Customer Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerName">Customer Name</Label>
                <Input
                  id="customerName"
                  placeholder="John Doe"
                  {...getFieldProps("customerName")}
                  className={
                    errors.customerName && touched.customerName
                      ? "border-red-500"
                      : "border-input"
                  }
                  maxLength={100}
                />
                {errors.customerName && touched.customerName && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.customerName}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="customerEmail">Customer Email</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  placeholder="customer@example.com"
                  {...getFieldProps("customerEmail")}
                  className={
                    errors.customerEmail && touched.customerEmail
                      ? "border-red-500"
                      : "border-input"
                  }
                />
                {errors.customerEmail && touched.customerEmail && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.customerEmail}
                  </p>
                )}
              </div>
            </div>

            {/* Store Selection */}
            <div>
              <Label htmlFor="store">Store</Label>
              <Select
                value={formData.store}
                onValueChange={(value) => handleInputChange("store", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a store" />
                </SelectTrigger>
                <SelectContent>
                  {stores.map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Settlement Preference */}
            <div>
              <Label>Settlement Preference</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    formData.settlementPreference === "mpesa"
                      ? "border-primary bg-primary/10"
                      : "border-muted"
                  }`}
                  onClick={() =>
                    handleInputChange("settlementPreference", "mpesa")
                  }
                >
                  <div className="flex items-center space-x-3">
                    <Smartphone className="w-6 h-6 text-qpay-success" />
                    <div>
                      <h3 className="font-semibold">M-Pesa (KES)</h3>
                      <p className="text-sm text-muted-foreground">
                        Instant settlement
                      </p>
                    </div>
                  </div>
                </div>
                <div
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    formData.settlementPreference === "btc"
                      ? "border-primary bg-primary/10"
                      : "border-muted"
                  }`}
                  onClick={() =>
                    handleInputChange("settlementPreference", "btc")
                  }
                >
                  <div className="flex items-center space-x-3">
                    <Bitcoin className="w-6 h-6 text-qpay-warning" />
                    <div>
                      <h3 className="font-semibold">Bitcoin</h3>
                      <p className="text-sm text-muted-foreground">
                        Keep as crypto
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expiryDuration">Expires In (Hours)</Label>
                <Select
                  value={formData.expiryDuration}
                  onValueChange={(value) =>
                    handleInputChange("expiryDuration", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Hour</SelectItem>
                    <SelectItem value="6">6 Hours</SelectItem>
                    <SelectItem value="24">24 Hours</SelectItem>
                    <SelectItem value="72">3 Days</SelectItem>
                    <SelectItem value="168">1 Week</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="reference">Reference (Optional)</Label>
                <Input
                  id="reference"
                  placeholder="Order #12345"
                  value={formData.reference}
                  onChange={(e) =>
                    handleInputChange("reference", e.target.value)
                  }
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-4">
              <QpayButton variant="outline" type="button" onClick={onClose}>
                Cancel
              </QpayButton>
              <QpayButton
                variant="primary"
                type="submit"
                loading={loading}
                glow
              >
                Create Invoice
              </QpayButton>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceForm;
