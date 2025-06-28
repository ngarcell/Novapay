import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QpayButton } from "@/components/ui/qpay-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Store,
  Calendar,
  DollarSign,
  Bitcoin,
  Zap,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  QrCode,
  Copy,
  Smartphone,
  CreditCard,
} from "lucide-react";
import LightningInvoice from "@/components/lightning-invoice";
import PaymentRequestShare from "@/components/payment-request-share";
import { QRModal } from "@/components/qr-modal";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface InvoiceData {
  id: string;
  amount: number;
  currency: string;
  description: string;
  customer_email?: string;
  customer_name?: string;
  store_id?: string;
  settlement_preference: "mpesa" | "btc" | "lightning";
  payment_method?: "btc" | "usdt" | "lightning";
  status: "pending" | "paid" | "expired" | "cancelled";
  created_at: string;
  expires_at: string;
  lightning_payment_request?: string;
  lightning_payment_hash?: string;
  merchant: {
    business_name: string;
    logo_url?: string;
  };
}

const PaymentRequest = () => {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    "btc" | "usdt" | "lightning"
  >("btc");
  const [paymentAddress, setPaymentAddress] = useState<string>("");
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isGeneratingAddress, setIsGeneratingAddress] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState("");

  // Fetch invoice data
  useEffect(() => {
    const fetchInvoice = async () => {
      if (!invoiceId) {
        setError("Invalid invoice ID");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/invoices/${invoiceId}`);
        const data = await response.json();

        if (data.success) {
          setInvoice(data.invoice);

          // Auto-select Lightning if it's a Lightning invoice
          if (
            data.invoice.payment_method === "lightning" &&
            data.invoice.lightning_payment_request
          ) {
            setSelectedPaymentMethod("lightning");
            setPaymentAddress(data.invoice.lightning_payment_request);
          }
        } else {
          setError(data.error || "Invoice not found");
        }
      } catch (err) {
        setError("Failed to load invoice");
        console.error("Error fetching invoice:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [invoiceId]);

  // Calculate time remaining
  useEffect(() => {
    if (!invoice) return;

    const updateTimeRemaining = () => {
      const now = new Date().getTime();
      const expiry = new Date(invoice.expires_at).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeRemaining("Expired");
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m`);
      } else if (minutes > 0) {
        setTimeRemaining(`${minutes}m ${seconds}s`);
      } else {
        setTimeRemaining(`${seconds}s`);
      }
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [invoice]);

  // Generate payment address
  const generatePaymentAddress = async () => {
    if (!invoice) return;

    setIsGeneratingAddress(true);
    try {
      const response = await fetch(`/api/invoices/${invoice.id}/address`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          crypto_currency: selectedPaymentMethod.toUpperCase(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setPaymentAddress(data.payment_address);
      } else {
        throw new Error(data.error || "Failed to generate address");
      }
    } catch (err) {
      console.error("Error generating address:", err);
      alert("Failed to generate payment address. Please try again.");
    } finally {
      setIsGeneratingAddress(false);
    }
  };

  const copyToClipboard = async (text: string = paymentAddress) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return `${amount.toFixed(2)} ${currency}`;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "secondary",
      paid: "default",
      expired: "destructive",
      cancelled: "outline",
    } as const;

    const colors = {
      pending: "text-qpay-warning",
      paid: "text-qpay-success",
      expired: "text-qpay-danger",
      cancelled: "text-muted-foreground",
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || "outline"}>
        <span className={colors[status as keyof typeof colors] || ""}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-qpay-dark via-qpay-darker to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-qpay-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading payment request...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-qpay-dark via-qpay-darker to-black flex items-center justify-center p-4">
        <Card className="glass-card border-white/10 max-w-md w-full">
          <CardContent className="text-center p-8">
            <AlertTriangle className="w-12 h-12 text-qpay-danger mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              Payment Request Not Found
            </h2>
            <p className="text-muted-foreground mb-6">
              {error ||
                "The payment request you're looking for doesn't exist or has been removed."}
            </p>
            <QpayButton variant="primary" onClick={() => navigate("/")} glow>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Home
            </QpayButton>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-qpay-dark via-qpay-darker to-black">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <QpayButton
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </QpayButton>

          <div className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-qpay-primary to-qpay-secondary bg-clip-text text-transparent mb-2">
              Payment Request
            </h1>
            <p className="text-muted-foreground">
              Secure cryptocurrency payment powered by Qpay
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Invoice Details */}
          <div className="space-y-6">
            <Card className="glass-card border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Store className="w-6 h-6 text-qpay-primary" />
                    <div>
                      <h3 className="text-xl">
                        {invoice.merchant.business_name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Payment Request
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(invoice.status)}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Amount */}
                <div className="text-center p-6 bg-gradient-to-r from-qpay-primary/10 to-qpay-secondary/10 rounded-lg border border-qpay-primary/20">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <DollarSign className="w-8 h-8 text-qpay-primary" />
                    <span className="text-4xl font-bold text-qpay-primary">
                      {formatAmount(invoice.amount, invoice.currency)}
                    </span>
                  </div>
                  <p className="text-muted-foreground">{invoice.description}</p>
                </div>

                {/* Invoice Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-muted-foreground">Invoice ID</Label>
                    <p className="font-mono">{invoice.id}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">
                      Time Remaining
                    </Label>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span
                        className={
                          timeRemaining === "Expired"
                            ? "text-qpay-danger"
                            : "text-qpay-warning"
                        }
                      >
                        {timeRemaining}
                      </span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Created</Label>
                    <p>{new Date(invoice.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Expires</Label>
                    <p>{new Date(invoice.expires_at).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Customer Info */}
                {(invoice.customer_name || invoice.customer_email) && (
                  <div className="border-t border-white/10 pt-4">
                    <Label className="text-muted-foreground">
                      Customer Information
                    </Label>
                    {invoice.customer_name && <p>{invoice.customer_name}</p>}
                    {invoice.customer_email && (
                      <p className="text-sm text-muted-foreground">
                        {invoice.customer_email}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Status */}
            {invoice.status === "paid" && (
              <Alert className="border-qpay-success/20 bg-qpay-success/5">
                <CheckCircle className="h-4 w-4 text-qpay-success" />
                <AlertDescription className="text-qpay-success">
                  Payment confirmed! This invoice has been paid successfully.
                </AlertDescription>
              </Alert>
            )}

            {invoice.status === "expired" && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This payment request has expired. Please contact the merchant
                  for a new invoice.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Payment Methods */}
          <div className="space-y-6">
            {invoice.status === "pending" && (
              <>
                {/* Lightning Invoice (if available) */}
                {invoice.lightning_payment_request && (
                  <LightningInvoice
                    invoice={{
                      payment_request: invoice.lightning_payment_request,
                      payment_hash: invoice.lightning_payment_hash || "",
                      amount_msat: Math.floor(
                        invoice.amount * 100000000 * 1000,
                      ), // Convert USD to msat
                      description: invoice.description,
                      expires_at: invoice.expires_at,
                      status: invoice.status as "pending" | "paid" | "expired",
                    }}
                    onPaymentConfirmed={() => {
                      setInvoice((prev) =>
                        prev ? { ...prev, status: "paid" } : null,
                      );
                    }}
                    showPaymentForm={true}
                  />
                )}

                {/* Traditional Crypto Payment */}
                {(!invoice.payment_method ||
                  invoice.payment_method !== "lightning") && (
                  <Card className="glass-card border-white/10">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <Bitcoin className="w-6 h-6 text-qpay-warning" />
                        <div>
                          <h3 className="text-xl">Crypto Payment</h3>
                          <p className="text-sm text-muted-foreground">
                            Pay with Bitcoin or USDT
                          </p>
                        </div>
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Payment Method Selection */}
                      <div>
                        <Label className="text-sm font-medium mb-2 block">
                          Select Cryptocurrency
                        </Label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => setSelectedPaymentMethod("btc")}
                            className={`p-3 rounded-lg border text-left transition-all ${
                              selectedPaymentMethod === "btc"
                                ? "border-qpay-warning bg-qpay-warning/10"
                                : "border-white/10 hover:border-white/20"
                            }`}
                          >
                            <Bitcoin className="w-5 h-5 mb-1 text-qpay-warning" />
                            <div className="text-sm font-medium">Bitcoin</div>
                          </button>

                          <button
                            onClick={() => setSelectedPaymentMethod("usdt")}
                            className={`p-3 rounded-lg border text-left transition-all ${
                              selectedPaymentMethod === "usdt"
                                ? "border-qpay-success bg-qpay-success/10"
                                : "border-white/10 hover:border-white/20"
                            }`}
                          >
                            <CreditCard className="w-5 h-5 mb-1 text-qpay-success" />
                            <div className="text-sm font-medium">USDT</div>
                          </button>
                        </div>
                      </div>

                      {/* Generate Address */}
                      {!paymentAddress && (
                        <QpayButton
                          variant="primary"
                          onClick={generatePaymentAddress}
                          loading={isGeneratingAddress}
                          disabled={isGeneratingAddress}
                          className="w-full"
                          glow
                        >
                          {isGeneratingAddress
                            ? "Generating Address..."
                            : `Generate ${selectedPaymentMethod.toUpperCase()} Address`}
                        </QpayButton>
                      )}

                      {/* Payment Address */}
                      {paymentAddress &&
                        selectedPaymentMethod !== "lightning" && (
                          <div>
                            <Label className="text-sm font-medium">
                              Payment Address
                            </Label>
                            <div className="flex gap-2 mt-2">
                              <Input
                                value={paymentAddress}
                                readOnly
                                className="font-mono text-sm"
                                onClick={(e) => e.currentTarget.select()}
                              />
                              <QpayButton
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard()}
                                className="shrink-0"
                              >
                                {copied ? (
                                  <CheckCircle className="w-4 h-4" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </QpayButton>
                            </div>

                            <div className="flex gap-2 mt-2">
                              <QpayButton
                                variant="secondary"
                                onClick={() => setShowQR(true)}
                                className="flex-1"
                              >
                                <QrCode className="w-4 h-4 mr-2" />
                                Show QR Code
                              </QpayButton>
                            </div>
                          </div>
                        )}
                    </CardContent>
                  </Card>
                )}

                {/* Share Component */}
                <PaymentRequestShare
                  invoice={{
                    id: invoice.id,
                    amount: invoice.amount,
                    currency: invoice.currency,
                    description: invoice.description,
                    payment_method: invoice.payment_method,
                    lightning_payment_request:
                      invoice.lightning_payment_request,
                  }}
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQR && (
        <QRModal
          isOpen={showQR}
          onClose={() => setShowQR(false)}
          qrData={paymentAddress}
          title={`${selectedPaymentMethod.toUpperCase()} Payment Address`}
          subtitle={`Amount: ${formatAmount(invoice.amount, invoice.currency)}`}
          copyText={paymentAddress}
        />
      )}
    </div>
  );
};

export default PaymentRequest;
