import { useState } from "react";
import { QpayButton } from "./ui/qpay-button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  X,
  AlertTriangle,
  Clock,
  Shield,
  Bitcoin,
  Smartphone,
  ArrowRight,
  Copy,
  ExternalLink,
} from "lucide-react";

interface PaymentConfirmationProps {
  invoice: {
    id: string;
    amount: number;
    currency: string;
    description: string;
    merchantName: string;
    settlementPreference: "mpesa" | "btc";
    expiresAt: string;
  };
  onConfirm: () => void;
  onCancel: () => void;
}

const PaymentConfirmation = ({
  invoice,
  onConfirm,
  onCancel,
}: PaymentConfirmationProps) => {
  const [selectedWallet, setSelectedWallet] = useState<"btc" | "usdt">("btc");
  const [loading, setLoading] = useState(false);

  const expiryTime = new Date(invoice.expiresAt);
  const timeRemaining = Math.max(0, expiryTime.getTime() - Date.now());
  const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
  const minutesRemaining = Math.floor(
    (timeRemaining % (1000 * 60 * 60)) / (1000 * 60),
  );

  const handleConfirm = async () => {
    setLoading(true);
    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 1500));
    onConfirm();
  };

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    // Toast notification could be added here
  };

  const walletAddresses = {
    btc: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    usdt: "0x742d35Cc6634C0532925a3b8D493C7A5C4E7EbC8",
  };

  const networkFees = {
    btc: "$2.50",
    usdt: "$1.20",
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="glass-card border-white/10 w-full max-w-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl">Confirm Payment</CardTitle>
          <QpayButton variant="ghost" size="sm" onClick={onCancel}>
            <X className="w-4 h-4" />
          </QpayButton>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Payment Details */}
          <div className="space-y-4 p-4 rounded-lg bg-muted/5 border border-white/5">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Invoice ID:</span>
              <span className="font-medium text-foreground">{invoice.id}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Merchant:</span>
              <span className="font-medium text-foreground">
                {invoice.merchantName}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Description:</span>
              <span className="font-medium text-foreground text-right max-w-48 truncate">
                {invoice.description}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Amount:</span>
              <span className="font-bold text-foreground text-lg">
                {invoice.currency} {invoice.amount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Settlement:</span>
              <div className="flex items-center space-x-2">
                {invoice.settlementPreference === "mpesa" ? (
                  <Smartphone className="w-4 h-4 text-qpay-success" />
                ) : (
                  <Bitcoin className="w-4 h-4 text-qpay-warning" />
                )}
                <span className="font-medium text-foreground">
                  {invoice.settlementPreference === "mpesa"
                    ? "M-Pesa"
                    : "Bitcoin"}
                </span>
              </div>
            </div>
          </div>

          {/* Expiry Warning */}
          {timeRemaining > 0 && (
            <div className="flex items-center space-x-2 p-3 rounded-lg bg-qpay-warning/10 border border-qpay-warning/20">
              <Clock className="w-4 h-4 text-qpay-warning" />
              <span className="text-sm text-qpay-warning">
                Expires in {hoursRemaining}h {minutesRemaining}m
              </span>
            </div>
          )}

          {/* Currency Selection */}
          <div>
            <h3 className="font-semibold text-foreground mb-3">
              Choose Payment Currency
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedWallet === "btc"
                    ? "border-primary bg-primary/10"
                    : "border-muted"
                }`}
                onClick={() => setSelectedWallet("btc")}
              >
                <div className="flex items-center space-x-3">
                  <Bitcoin className="w-6 h-6 text-qpay-warning" />
                  <div>
                    <h4 className="font-semibold">Bitcoin</h4>
                    <p className="text-xs text-muted-foreground">
                      Fee: {networkFees.btc}
                    </p>
                  </div>
                </div>
              </div>
              <div
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedWallet === "usdt"
                    ? "border-primary bg-primary/10"
                    : "border-muted"
                }`}
                onClick={() => setSelectedWallet("usdt")}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 rounded-full bg-qpay-success flex items-center justify-center text-white text-xs font-bold">
                    T
                  </div>
                  <div>
                    <h4 className="font-semibold">USDT</h4>
                    <p className="text-xs text-muted-foreground">
                      Fee: {networkFees.usdt}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Address */}
          <div>
            <h3 className="font-semibold text-foreground mb-3">
              Payment Address
            </h3>
            <div className="p-3 rounded-lg bg-muted/5 border border-white/5">
              <div className="flex justify-between items-center">
                <span className="font-mono text-sm text-foreground break-all">
                  {walletAddresses[selectedWallet]}
                </span>
                <QpayButton
                  variant="ghost"
                  size="sm"
                  onClick={() => copyAddress(walletAddresses[selectedWallet])}
                >
                  <Copy className="w-4 h-4" />
                </QpayButton>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Send the exact amount to this address. Do not send from an
              exchange.
            </p>
          </div>

          {/* Security Notice */}
          <div className="flex items-start space-x-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <Shield className="w-4 h-4 text-blue-400 mt-0.5" />
            <div className="text-sm">
              <p className="text-blue-400 font-medium">Secure Payment</p>
              <p className="text-muted-foreground">
                This payment is protected by blockchain verification and Qpay's
                escrow system.
              </p>
            </div>
          </div>

          {/* Warning */}
          <div className="flex items-start space-x-2 p-3 rounded-lg bg-qpay-warning/10 border border-qpay-warning/20">
            <AlertTriangle className="w-4 h-4 text-qpay-warning mt-0.5" />
            <div className="text-sm">
              <p className="text-qpay-warning font-medium">Important</p>
              <p className="text-muted-foreground">
                Double-check the payment address and amount. Cryptocurrency
                transactions cannot be reversed.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <QpayButton variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </QpayButton>
            <QpayButton
              variant="primary"
              onClick={handleConfirm}
              loading={loading}
              className="flex-1"
              glow
            >
              {loading ? "Processing..." : "Send Payment"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </QpayButton>
          </div>

          <div className="text-center">
            <a
              href="#"
              className="text-xs text-primary hover:text-primary/80 transition-colors inline-flex items-center"
            >
              Need help with crypto payments?
              <ExternalLink className="w-3 h-3 ml-1" />
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentConfirmation;
