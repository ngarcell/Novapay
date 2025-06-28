import { useState, useEffect } from "react";
import { QpayButton } from "./ui/qpay-button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import {
  QrCode,
  Copy,
  X,
  CheckCircle,
  Download,
  Share2,
  Zap,
  ExternalLink,
} from "lucide-react";

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrData: string;
  title?: string;
  subtitle?: string;
  copyText?: string;
  lightningInvoice?: boolean;
}

export const QRModal = ({
  isOpen,
  onClose,
  qrData,
  title = "QR Code",
  subtitle,
  copyText,
  lightningInvoice = false,
}: QRModalProps) => {
  const [copied, setCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");

  // Generate QR code URL using a QR service
  useEffect(() => {
    if (qrData) {
      // Using QR Server API for generating QR codes
      const encodedData = encodeURIComponent(qrData);
      const size = 400;
      const errorCorrection = "M";
      const margin = 1;

      // Use a public QR code API service
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedData}&ecc=${errorCorrection}&margin=${margin}&format=png`;
      setQrCodeUrl(qrUrl);
    }
  }, [qrData]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(copyText || qrData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const shareData = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: subtitle || "Payment Request",
          url: qrData.startsWith("http") ? qrData : undefined,
        });
      } catch (error) {
        console.error("Failed to share:", error);
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  const downloadQR = () => {
    if (qrCodeUrl) {
      const link = document.createElement("a");
      link.href = qrCodeUrl;
      link.download = `qpay-${lightningInvoice ? "lightning" : "payment"}-qr.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const openInWallet = () => {
    if (lightningInvoice) {
      window.open(`lightning:${qrData}`, "_blank");
    } else if (qrData.startsWith("bitcoin:")) {
      window.open(qrData, "_blank");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="glass-card border-white/10 w-full max-w-lg">
        <CardHeader>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              {lightningInvoice && (
                <div className="p-2 bg-qpay-warning/10 rounded-lg">
                  <Zap className="w-6 h-6 text-qpay-warning" />
                </div>
              )}
              <div>
                <h2 className="text-2xl font-bold">{title}</h2>
                {subtitle && (
                  <p className="text-muted-foreground mt-1">{subtitle}</p>
                )}
              </div>
            </div>
            <QpayButton variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </QpayButton>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* QR Code Display */}
          <div className="text-center">
            <div className="relative inline-block">
              {qrCodeUrl ? (
                <img
                  src={qrCodeUrl}
                  alt="QR Code"
                  className="w-80 h-80 border border-white/10 rounded-lg bg-white p-4"
                  onError={() => {
                    // Fallback to text representation if image fails
                    setQrCodeUrl("");
                  }}
                />
              ) : (
                <div className="w-80 h-80 border border-white/10 rounded-lg bg-white/5 flex items-center justify-center">
                  <div className="text-center">
                    <QrCode className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {lightningInvoice
                        ? "Lightning Invoice QR Code"
                        : "Payment QR Code"}
                    </p>
                  </div>
                </div>
              )}

              {lightningInvoice && (
                <div className="absolute top-2 right-2 bg-qpay-warning/90 backdrop-blur-sm rounded-full p-2">
                  <Zap className="w-4 h-4 text-white" />
                </div>
              )}
            </div>

            <p className="text-sm text-muted-foreground mt-4">
              {lightningInvoice
                ? "Scan with Lightning wallet to pay instantly"
                : "Scan with crypto wallet or QR scanner"}
            </p>
          </div>

          {/* Data Display */}
          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-2">
              {lightningInvoice ? "Lightning Invoice (BOLT11)" : "Payment Data"}
            </label>
            <div className="flex gap-2">
              <Input
                value={qrData}
                readOnly
                className={`font-mono ${lightningInvoice ? "text-xs" : "text-sm"} cursor-pointer`}
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
          <div className="grid grid-cols-2 gap-3">
            <QpayButton
              variant="outline"
              onClick={downloadQR}
              disabled={!qrCodeUrl}
              className="flex-1"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </QpayButton>

            <QpayButton
              variant="secondary"
              onClick={shareData}
              className="flex-1"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </QpayButton>
          </div>

          {/* Lightning-specific actions */}
          {lightningInvoice && (
            <QpayButton
              variant="primary"
              onClick={openInWallet}
              className="w-full"
              glow
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open in Lightning Wallet
            </QpayButton>
          )}

          {/* Instructions */}
          <div className="text-xs text-muted-foreground bg-white/5 p-3 rounded-lg">
            <strong>Instructions:</strong>
            <ul className="mt-1 space-y-1 list-disc list-inside">
              {lightningInvoice ? (
                <>
                  <li>Scan with any Lightning Network wallet</li>
                  <li>Payment is instant and low-cost</li>
                  <li>Invoice expires automatically</li>
                </>
              ) : (
                <>
                  <li>Scan with crypto wallet or QR scanner</li>
                  <li>Follow wallet instructions to complete payment</li>
                  <li>Transaction will be confirmed on blockchain</li>
                </>
              )}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QRModal;
