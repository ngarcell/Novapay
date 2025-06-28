import { QpayButton } from "./ui/qpay-button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { X, Copy, Download, Share } from "lucide-react";

interface QRModalProps {
  invoice: {
    id: string;
    amount: number;
    currency: string;
    description: string;
    customerName?: string;
    settlementPreference: "mpesa" | "btc";
  };
  onClose: () => void;
}

const QRModal = ({ invoice, onClose }: QRModalProps) => {
  const paymentUrl = `${window.location.origin}/pay/${invoice.id}`;

  const copyLink = () => {
    navigator.clipboard.writeText(paymentUrl);
    // You could add a toast notification here
  };

  const shareInvoice = () => {
    if (navigator.share) {
      navigator.share({
        title: `Payment Request - ${invoice.currency} ${invoice.amount}`,
        text: `Please pay your invoice: ${invoice.description}`,
        url: paymentUrl,
      });
    } else {
      copyLink();
    }
  };

  const downloadQR = () => {
    // In a real implementation, you would generate and download a QR code image
    console.log("Download QR code for:", invoice.id);
  };

  // Simple QR code placeholder (in production, use a QR code library like qrcode.js)
  const QRCodePlaceholder = () => (
    <div className="w-64 h-64 bg-white rounded-lg p-4 mx-auto">
      <div className="w-full h-full bg-black rounded-lg flex items-center justify-center relative">
        <div className="grid grid-cols-8 gap-1 w-full h-full p-4">
          {Array.from({ length: 64 }, (_, i) => (
            <div
              key={i}
              className={`rounded-sm ${
                Math.random() > 0.5 ? "bg-white" : "bg-black"
              }`}
            />
          ))}
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white rounded-lg p-2">
            <div className="text-black text-xs font-bold">QPAY</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="glass-card border-white/10 w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl">Payment QR Code</CardTitle>
          <QpayButton variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </QpayButton>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* QR Code */}
          <div className="text-center">
            <QRCodePlaceholder />
            <p className="text-sm text-muted-foreground mt-4">
              Scan to pay with crypto wallet
            </p>
          </div>

          {/* Invoice Details */}
          <div className="space-y-3 p-4 rounded-lg bg-muted/5 border border-white/5">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Invoice ID:</span>
              <span className="font-medium text-foreground">{invoice.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount:</span>
              <span className="font-semibold text-foreground">
                {invoice.currency} {invoice.amount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Settlement:</span>
              <span className="font-medium text-foreground">
                {invoice.settlementPreference === "mpesa"
                  ? "M-Pesa (KES)"
                  : "Bitcoin"}
              </span>
            </div>
            {invoice.customerName && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Customer:</span>
                <span className="font-medium text-foreground">
                  {invoice.customerName}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Description:</span>
              <span className="font-medium text-foreground text-right max-w-48 truncate">
                {invoice.description}
              </span>
            </div>
          </div>

          {/* Payment URL */}
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Payment Link
            </label>
            <div className="flex mt-2">
              <input
                type="text"
                value={paymentUrl}
                readOnly
                className="flex-1 p-2 rounded-l-lg border border-input bg-background text-sm"
              />
              <QpayButton
                variant="outline"
                size="sm"
                onClick={copyLink}
                className="rounded-l-none border-l-0"
              >
                <Copy className="w-4 h-4" />
              </QpayButton>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <QpayButton
              variant="outline"
              onClick={downloadQR}
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </QpayButton>
            <QpayButton
              variant="primary"
              onClick={shareInvoice}
              className="w-full"
            >
              <Share className="w-4 h-4 mr-2" />
              Share
            </QpayButton>
          </div>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              QR code expires when the invoice expires
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QRModal;
