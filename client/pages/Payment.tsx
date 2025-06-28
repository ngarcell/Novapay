import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import QRScanner from "../components/qr-scanner";
import PaymentConfirmation from "../components/payment-confirmation";
import TransactionStatus from "../components/transaction-status";
import { QpayButton } from "../components/ui/qpay-button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  QrCode,
  AlertCircle,
  Smartphone,
  Bitcoin,
  ArrowLeft,
  Shield,
  Clock,
} from "lucide-react";

const Payment = () => {
  const { invoiceId } = useParams();
  const [showScanner, setShowScanner] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Mock invoice data - in real app, fetch from API
  useEffect(() => {
    const fetchInvoice = async () => {
      setLoading(true);
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Mock invoice data
        const mockInvoice = {
          id: invoiceId || "INV-123456",
          amount: 150.0,
          currency: "USD",
          description: "Website development services",
          merchantName: "Acme Corp Ltd",
          settlementPreference: "mpesa" as const,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
          status: "pending",
          createdAt: new Date().toISOString(),
        };

        setInvoice(mockInvoice);
      } catch (err) {
        setError("Failed to load invoice");
      } finally {
        setLoading(false);
      }
    };

    if (invoiceId) {
      fetchInvoice();
    } else {
      // If no invoice ID, show scanner
      setShowScanner(true);
      setLoading(false);
    }
  }, [invoiceId]);

  const handleScanResult = (result: string) => {
    setShowScanner(false);
    // Extract invoice ID from scanned URL or use result directly
    const invoiceIdFromScan = result.includes("/pay/")
      ? result.split("/pay/")[1]
      : result;

    // Simulate loading invoice data
    setLoading(true);
    setTimeout(() => {
      const mockInvoice = {
        id: invoiceIdFromScan,
        amount: 75.5,
        currency: "USD",
        description: "Product consultation",
        merchantName: "Tech Solutions Inc",
        settlementPreference: "btc" as const,
        expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // 6 hours from now
        status: "pending",
        createdAt: new Date().toISOString(),
      };
      setInvoice(mockInvoice);
      setLoading(false);
    }, 1500);
  };

  const handlePaymentConfirm = () => {
    setShowConfirmation(false);
    // Generate transaction ID
    const txId = "TX-" + Math.random().toString(36).substr(2, 9).toUpperCase();
    setTransactionId(txId);
    setShowStatus(true);
  };

  const handlePaymentComplete = () => {
    // Payment completed successfully
    console.log("Payment completed:", transactionId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="glass-card border-white/10 w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-4" />
            <p className="text-muted-foreground">Loading payment details...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="glass-card border-white/10 w-full max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-qpay-error mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Payment Error
            </h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <QpayButton
              variant="outline"
              onClick={() => setShowScanner(true)}
              className="w-full"
            >
              Scan Different Invoice
            </QpayButton>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invoice && !showScanner) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="glass-card border-white/10 w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              Qpay Payment Portal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <QrCode className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Scan to Pay
              </h2>
              <p className="text-muted-foreground mb-6">
                Scan the QR code provided by the merchant to start your crypto
                payment
              </p>
              <QpayButton
                variant="primary"
                onClick={() => setShowScanner(true)}
                glow
                className="w-full"
              >
                <QrCode className="w-4 h-4 mr-2" />
                Scan QR Code
              </QpayButton>
            </div>

            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Secure payments powered by blockchain technology
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const expiryTime = invoice ? new Date(invoice.expiresAt) : null;
  const timeRemaining = expiryTime
    ? Math.max(0, expiryTime.getTime() - Date.now())
    : 0;
  const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
  const minutesRemaining = Math.floor(
    (timeRemaining % (1000 * 60 * 60)) / (1000 * 60),
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-lg mx-auto">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-primary">
                <span className="text-lg font-bold text-white">Q</span>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Qpay Payment
            </h1>
            <p className="text-muted-foreground">
              Secure cryptocurrency payment processing
            </p>
          </div>

          {invoice && (
            <Card className="glass-card border-white/10 mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Payment Request</CardTitle>
                  <QpayButton
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowScanner(true)}
                  >
                    <QrCode className="w-4 h-4" />
                  </QpayButton>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Invoice Details */}
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Merchant:</span>
                    <span className="font-medium text-foreground">
                      {invoice.merchantName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Invoice ID:</span>
                    <span className="font-medium text-foreground">
                      {invoice.id}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Description:</span>
                    <span className="font-medium text-foreground text-right max-w-48 truncate">
                      {invoice.description}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="font-bold text-foreground text-xl">
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

                {/* Expiry Notice */}
                {timeRemaining > 0 && (
                  <div className="flex items-center space-x-2 p-3 rounded-lg bg-qpay-warning/10 border border-qpay-warning/20">
                    <Clock className="w-4 h-4 text-qpay-warning" />
                    <span className="text-sm text-qpay-warning">
                      Expires in {hoursRemaining}h {minutesRemaining}m
                    </span>
                  </div>
                )}

                {/* Security Badge */}
                <div className="flex items-center space-x-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <Shield className="w-4 h-4 text-primary" />
                  <span className="text-sm text-primary">
                    Secured by blockchain technology
                  </span>
                </div>

                {/* Pay Button */}
                <QpayButton
                  variant="primary"
                  size="lg"
                  onClick={() => setShowConfirmation(true)}
                  className="w-full"
                  glow
                  disabled={timeRemaining <= 0}
                >
                  {timeRemaining <= 0 ? "Invoice Expired" : "Pay with Crypto"}
                </QpayButton>

                {/* Alternative Actions */}
                <div className="grid grid-cols-2 gap-3">
                  <QpayButton
                    variant="outline"
                    onClick={() => setShowScanner(true)}
                    className="w-full"
                  >
                    <QrCode className="w-4 h-4 mr-2" />
                    Scan New
                  </QpayButton>
                  <QpayButton variant="ghost" className="w-full">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </QpayButton>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Footer */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Powered by Qpay • Instant crypto-to-fiat settlements
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showScanner && (
        <QRScanner
          onScanResult={handleScanResult}
          onClose={() => setShowScanner(false)}
        />
      )}

      {showConfirmation && invoice && (
        <PaymentConfirmation
          invoice={invoice}
          onConfirm={handlePaymentConfirm}
          onCancel={() => setShowConfirmation(false)}
        />
      )}

      {showStatus && (
        <TransactionStatus
          transactionId={transactionId}
          onClose={() => setShowStatus(false)}
          onComplete={handlePaymentComplete}
        />
      )}
    </div>
  );
};

export default Payment;
