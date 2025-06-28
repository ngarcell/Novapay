import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { QpayButton } from "./ui/qpay-button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Zap,
  Copy,
  QrCode,
  CheckCircle,
  Clock,
  ExternalLink,
  AlertCircle,
  Timer,
} from "lucide-react";
import { QRModal } from "./qr-modal";
import { Alert, AlertDescription } from "./ui/alert";

interface LightningInvoiceProps {
  invoice: {
    payment_request: string;
    payment_hash: string;
    amount_msat: number;
    description: string;
    expires_at: string;
    status: "pending" | "paid" | "expired";
  };
  onPaymentConfirmed?: () => void;
  showPaymentForm?: boolean;
}

const LightningInvoice = ({
  invoice,
  onPaymentConfirmed,
  showPaymentForm = false,
}: LightningInvoiceProps) => {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState("");
  const [paymentRequest, setPaymentRequest] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Calculate time remaining until expiry
  useEffect(() => {
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
        setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
      } else if (minutes > 0) {
        setTimeRemaining(`${minutes}m ${seconds}s`);
      } else {
        setTimeRemaining(`${seconds}s`);
      }
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [invoice.expires_at]);

  // Monitor payment status
  useEffect(() => {
    if (invoice.status === "pending") {
      const checkPaymentStatus = async () => {
        try {
          const response = await fetch(
            `/api/lightning/invoices/${invoice.payment_hash}`,
          );
          const data = await response.json();

          if (data.success && data.invoice.status === "paid") {
            onPaymentConfirmed?.();
          }
        } catch (error) {
          console.error("Error checking payment status:", error);
        }
      };

      const interval = setInterval(checkPaymentStatus, 3000); // Check every 3 seconds
      return () => clearInterval(interval);
    }
  }, [invoice.payment_hash, invoice.status, onPaymentConfirmed]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(invoice.payment_request);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handlePayment = async () => {
    if (!paymentRequest.trim()) return;

    setIsProcessing(true);
    try {
      const response = await fetch("/api/lightning/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payment_request: paymentRequest.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        onPaymentConfirmed?.();
      } else {
        throw new Error(data.error || "Payment failed");
      }
    } catch (error) {
      console.error("Payment error:", error);
      alert(
        `Payment failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const formatAmount = (amountMsat: number) => {
    const sats = Math.floor(amountMsat / 1000);
    if (sats >= 100000000) {
      return `${(sats / 100000000).toFixed(8)} BTC`;
    } else if (sats >= 1000) {
      return `${(sats / 1000).toFixed(0)}k sats`;
    } else {
      return `${sats} sats`;
    }
  };

  const getStatusIcon = () => {
    switch (invoice.status) {
      case "paid":
        return <CheckCircle className="w-5 h-5 text-qpay-success" />;
      case "expired":
        return <AlertCircle className="w-5 h-5 text-qpay-danger" />;
      default:
        return <Clock className="w-5 h-5 text-qpay-warning" />;
    }
  };

  const getStatusText = () => {
    switch (invoice.status) {
      case "paid":
        return "Payment Confirmed";
      case "expired":
        return "Invoice Expired";
      default:
        return "Awaiting Payment";
    }
  };

  return (
    <>
      <Card className="glass-card border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-qpay-primary to-qpay-secondary rounded-lg">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl">Lightning Invoice</h3>
              <div className="flex items-center gap-2 mt-1">
                {getStatusIcon()}
                <span className="text-sm text-muted-foreground">
                  {getStatusText()}
                </span>
              </div>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Invoice Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Amount</Label>
              <div className="text-2xl font-bold text-qpay-primary">
                {formatAmount(invoice.amount_msat)}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Time Remaining</Label>
              <div className="flex items-center gap-2 text-lg">
                <Timer className="w-4 h-4" />
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
          </div>

          {/* Description */}
          <div>
            <Label className="text-sm font-medium">Description</Label>
            <p className="text-muted-foreground mt-1">{invoice.description}</p>
          </div>

          {/* Payment Request */}
          <div>
            <Label className="text-sm font-medium">BOLT11 Invoice</Label>
            <div className="flex gap-2 mt-2">
              <Input
                value={invoice.payment_request}
                readOnly
                className="font-mono text-xs"
                onClick={(e) => e.currentTarget.select()}
              />
              <QpayButton
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                className="shrink-0"
              >
                {copied ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </QpayButton>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <QpayButton
              variant="primary"
              onClick={() => setShowQR(true)}
              className="flex-1"
              disabled={invoice.status !== "pending"}
              glow
            >
              <QrCode className="w-4 h-4 mr-2" />
              Show QR Code
            </QpayButton>

            <QpayButton
              variant="outline"
              onClick={() =>
                window.open(`lightning:${invoice.payment_request}`, "_blank")
              }
              disabled={invoice.status !== "pending"}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open in Wallet
            </QpayButton>
          </div>

          {/* Payment Status */}
          {invoice.status === "paid" && (
            <Alert className="border-qpay-success/20 bg-qpay-success/5">
              <CheckCircle className="h-4 w-4 text-qpay-success" />
              <AlertDescription className="text-qpay-success">
                Payment confirmed! Your Lightning payment has been received
                successfully.
              </AlertDescription>
            </Alert>
          )}

          {invoice.status === "expired" && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This Lightning invoice has expired. Please request a new invoice
                to make a payment.
              </AlertDescription>
            </Alert>
          )}

          {/* Payment Form for Testing */}
          {showPaymentForm && invoice.status === "pending" && (
            <div className="border-t border-white/10 pt-6 mt-6">
              <Label className="text-sm font-medium">
                Test Payment (Demo Only)
              </Label>
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Paste BOLT11 invoice to pay..."
                  value={paymentRequest}
                  onChange={(e) => setPaymentRequest(e.target.value)}
                  className="font-mono text-xs"
                />
                <QpayButton
                  variant="secondary"
                  onClick={handlePayment}
                  disabled={!paymentRequest.trim() || isProcessing}
                  loading={isProcessing}
                >
                  {isProcessing ? "Processing..." : "Pay"}
                </QpayButton>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                In a real implementation, this would open your Lightning wallet
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* QR Code Modal */}
      {showQR && (
        <QRModal
          isOpen={showQR}
          onClose={() => setShowQR(false)}
          qrData={invoice.payment_request}
          title="Lightning Invoice QR Code"
          subtitle={`Amount: ${formatAmount(invoice.amount_msat)}`}
          copyText={invoice.payment_request}
          lightningInvoice={true}
        />
      )}
    </>
  );
};

export default LightningInvoice;
