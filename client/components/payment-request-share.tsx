import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { QpayButton } from "./ui/qpay-button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Share2,
  Copy,
  QrCode,
  Mail,
  MessageCircle,
  Twitter,
  Facebook,
  Link2,
  CheckCircle,
  Zap,
  DollarSign,
} from "lucide-react";
import { QRModal } from "./qr-modal";

interface PaymentRequestShareProps {
  invoice: {
    id: string;
    amount: number;
    currency: string;
    description: string;
    payment_method?: "btc" | "usdt" | "lightning";
    lightning_payment_request?: string;
  };
  baseUrl?: string;
}

const PaymentRequestShare = ({
  invoice,
  baseUrl = window.location.origin,
}: PaymentRequestShareProps) => {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<
    "link" | "lightning" | "both"
  >("both");

  // Generate shareable payment URL
  const paymentUrl = `${baseUrl}/pay/${invoice.id}`;

  // Determine what to share based on selected method
  const getShareData = () => {
    switch (selectedMethod) {
      case "lightning":
        return {
          url: invoice.lightning_payment_request || paymentUrl,
          title: `Lightning Payment Request - ${invoice.description}`,
          text: `Pay ${invoice.amount} ${invoice.currency} via Lightning Network`,
          isLightning: true,
        };
      case "link":
        return {
          url: paymentUrl,
          title: `Payment Request - ${invoice.description}`,
          text: `Pay ${invoice.amount} ${invoice.currency} securely with Qpay`,
          isLightning: false,
        };
      default:
        return {
          url: paymentUrl,
          title: `Payment Request - ${invoice.description}`,
          text: `Pay ${invoice.amount} ${invoice.currency} via crypto or Lightning Network`,
          isLightning: false,
        };
    }
  };

  const shareData = getShareData();

  const copyToClipboard = async (text: string = shareData.url) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(shareData.title);
    const body = encodeURIComponent(
      `${shareData.text}\n\nPayment Link: ${shareData.url}\n\nSecure payments powered by Qpay`,
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
  };

  const shareViaWhatsApp = () => {
    const text = encodeURIComponent(`${shareData.text}\n${shareData.url}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const shareViaTwitter = () => {
    const text = encodeURIComponent(`${shareData.text} ${shareData.url}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
  };

  const shareViaFacebook = () => {
    const url = encodeURIComponent(shareData.url);
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      "_blank",
    );
  };

  const shareViaNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareData.title,
          text: shareData.text,
          url: shareData.url,
        });
      } catch (error) {
        console.error("Native sharing failed:", error);
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    if (currency === "BTC") {
      return `${amount.toFixed(8)} BTC`;
    } else if (currency === "sats" || currency === "SATS") {
      return `${amount.toLocaleString()} sats`;
    } else {
      return `${amount.toFixed(2)} ${currency}`;
    }
  };

  return (
    <>
      <Card className="glass-card border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-qpay-primary to-qpay-secondary rounded-lg">
              <Share2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl">Share Payment Request</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Send this payment request to receive funds
              </p>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Payment Details */}
          <div className="p-4 bg-qpay-primary/5 rounded-lg border border-qpay-primary/10">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-qpay-primary" />
                  <span className="text-2xl font-bold text-qpay-primary">
                    {formatAmount(invoice.amount, invoice.currency)}
                  </span>
                </div>
                <p className="text-muted-foreground">{invoice.description}</p>
              </div>
              {invoice.payment_method === "lightning" && (
                <div className="p-2 bg-qpay-warning/10 rounded-lg">
                  <Zap className="w-6 h-6 text-qpay-warning" />
                </div>
              )}
            </div>
          </div>

          {/* Sharing Method Selection */}
          <div>
            <Label className="text-sm font-medium mb-3 block">
              Choose Sharing Method
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={() => setSelectedMethod("link")}
                className={`p-3 rounded-lg border text-left transition-all ${
                  selectedMethod === "link"
                    ? "border-qpay-primary bg-qpay-primary/10"
                    : "border-white/10 hover:border-white/20"
                }`}
              >
                <Link2 className="w-5 h-5 mb-2 text-qpay-primary" />
                <div className="text-sm font-medium">Payment Link</div>
                <div className="text-xs text-muted-foreground">
                  Web page with payment options
                </div>
              </button>

              {invoice.lightning_payment_request && (
                <button
                  onClick={() => setSelectedMethod("lightning")}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    selectedMethod === "lightning"
                      ? "border-qpay-warning bg-qpay-warning/10"
                      : "border-white/10 hover:border-white/20"
                  }`}
                >
                  <Zap className="w-5 h-5 mb-2 text-qpay-warning" />
                  <div className="text-sm font-medium">Lightning Invoice</div>
                  <div className="text-xs text-muted-foreground">
                    Direct BOLT11 invoice
                  </div>
                </button>
              )}

              <button
                onClick={() => setSelectedMethod("both")}
                className={`p-3 rounded-lg border text-left transition-all ${
                  selectedMethod === "both"
                    ? "border-qpay-secondary bg-qpay-secondary/10"
                    : "border-white/10 hover:border-white/20"
                }`}
              >
                <Share2 className="w-5 h-5 mb-2 text-qpay-secondary" />
                <div className="text-sm font-medium">Both Options</div>
                <div className="text-xs text-muted-foreground">
                  Let payer choose method
                </div>
              </button>
            </div>
          </div>

          {/* Share URL Display */}
          <div>
            <Label className="text-sm font-medium">
              {shareData.isLightning ? "Lightning Invoice" : "Payment Link"}
            </Label>
            <div className="flex gap-2 mt-2">
              <Input
                value={shareData.url}
                readOnly
                className={`font-mono ${shareData.isLightning ? "text-xs" : "text-sm"}`}
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
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <QpayButton
              variant="primary"
              onClick={() => setShowQR(true)}
              className="flex-1"
              glow
            >
              <QrCode className="w-4 h-4 mr-2" />
              Show QR Code
            </QpayButton>

            <QpayButton
              variant="outline"
              onClick={shareViaNative}
              className="flex-1"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </QpayButton>
          </div>

          {/* Social Sharing */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Share Via</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <QpayButton
                variant="ghost"
                size="sm"
                onClick={shareViaEmail}
                className="justify-start"
              >
                <Mail className="w-4 h-4 mr-2" />
                Email
              </QpayButton>

              <QpayButton
                variant="ghost"
                size="sm"
                onClick={shareViaWhatsApp}
                className="justify-start"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                WhatsApp
              </QpayButton>

              <QpayButton
                variant="ghost"
                size="sm"
                onClick={shareViaTwitter}
                className="justify-start"
              >
                <Twitter className="w-4 h-4 mr-2" />
                Twitter
              </QpayButton>

              <QpayButton
                variant="ghost"
                size="sm"
                onClick={shareViaFacebook}
                className="justify-start"
              >
                <Facebook className="w-4 h-4 mr-2" />
                Facebook
              </QpayButton>
            </div>
          </div>

          {/* Usage Instructions */}
          <div className="text-xs text-muted-foreground bg-white/5 p-3 rounded-lg">
            <strong>How it works:</strong>
            <ul className="mt-1 space-y-1 list-disc list-inside">
              <li>
                Share the link or QR code with the person who needs to pay you
              </li>
              {invoice.payment_method === "lightning" ? (
                <li>
                  They can scan the QR code with any Lightning wallet to pay
                  instantly
                </li>
              ) : (
                <li>They can pay with Bitcoin, USDT, or Lightning Network</li>
              )}
              <li>
                You'll receive automatic settlement in your preferred currency
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* QR Code Modal */}
      {showQR && (
        <QRModal
          isOpen={showQR}
          onClose={() => setShowQR(false)}
          qrData={shareData.url}
          title={
            shareData.isLightning
              ? "Lightning Invoice QR"
              : "Payment Request QR"
          }
          subtitle={shareData.text}
          copyText={shareData.url}
          lightningInvoice={shareData.isLightning}
        />
      )}
    </>
  );
};

export default PaymentRequestShare;
