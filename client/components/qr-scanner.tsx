import { useState, useEffect } from "react";
import { QpayButton } from "./ui/qpay-button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Camera,
  X,
  Upload,
  QrCode,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

interface QRScannerProps {
  onScanResult: (result: string) => void;
  onClose: () => void;
}

const QRScanner = ({ onScanResult, onClose }: QRScannerProps) => {
  const [scanning, setScanning] = useState(false);
  const [manualEntry, setManualEntry] = useState("");
  const [error, setError] = useState("");
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    // Simulate camera permission request
    const requestPermission = async () => {
      try {
        // In a real app, you'd use navigator.mediaDevices.getUserMedia
        setPermissionGranted(true);
      } catch (err) {
        setError("Camera permission denied");
      }
    };

    if (scanning) {
      requestPermission();
    }
  }, [scanning]);

  const startScanning = () => {
    setScanning(true);
    setError("");

    // Simulate QR code detection after 3 seconds
    setTimeout(() => {
      const mockInvoiceId = "INV-" + Math.random().toString(36).substr(2, 9);
      const mockPaymentUrl = `${window.location.origin}/pay/${mockInvoiceId}`;
      onScanResult(mockPaymentUrl);
    }, 3000);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualEntry.trim()) {
      onScanResult(manualEntry.trim());
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Simulate QR code reading from image
      setTimeout(() => {
        const mockInvoiceId = "INV-" + Math.random().toString(36).substr(2, 9);
        const mockPaymentUrl = `${window.location.origin}/pay/${mockInvoiceId}`;
        onScanResult(mockPaymentUrl);
      }, 1500);
    }
  };

  // Mock camera view component
  const CameraView = () => (
    <div className="relative w-full h-64 bg-black rounded-lg overflow-hidden">
      {scanning && permissionGranted ? (
        <div className="relative w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
          {/* Simulated camera feed */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/20 animate-pulse" />

          {/* QR scanner overlay */}
          <div className="relative z-10">
            <div className="w-48 h-48 border-2 border-white rounded-lg relative">
              {/* Corner brackets */}
              <div className="absolute -top-1 -left-1 w-6 h-6 border-l-4 border-t-4 border-primary rounded-tl-lg" />
              <div className="absolute -top-1 -right-1 w-6 h-6 border-r-4 border-t-4 border-primary rounded-tr-lg" />
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-l-4 border-b-4 border-primary rounded-bl-lg" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-r-4 border-b-4 border-primary rounded-br-lg" />

              {/* Scanning line */}
              <div className="absolute top-0 left-0 w-full h-1 bg-primary animate-bounce" />
            </div>
          </div>

          <div className="absolute bottom-4 left-4 right-4 text-center">
            <p className="text-white text-sm">
              Position QR code within the frame
            </p>
            <div className="flex items-center justify-center mt-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
              <span className="ml-2 text-xs text-white">Scanning...</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full h-full bg-muted/10 rounded-lg flex items-center justify-center border-2 border-dashed border-muted">
          <div className="text-center">
            <Camera className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">Camera not active</p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="glass-card border-white/10 w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl flex items-center">
            <QrCode className="w-5 h-5 mr-2" />
            Scan QR Code
          </CardTitle>
          <QpayButton variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </QpayButton>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Camera View */}
          <div>
            <CameraView />
            {error && (
              <div className="flex items-center space-x-2 mt-2 text-red-400">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}
          </div>

          {/* Camera Controls */}
          <div className="flex gap-3">
            <QpayButton
              variant={scanning ? "outline" : "primary"}
              onClick={scanning ? () => setScanning(false) : startScanning}
              className="flex-1"
              disabled={scanning && !permissionGranted}
            >
              <Camera className="w-4 h-4 mr-2" />
              {scanning ? "Stop" : "Start"} Camera
            </QpayButton>

            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <QpayButton variant="outline" className="w-full">
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </QpayButton>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-muted" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or enter manually
              </span>
            </div>
          </div>

          {/* Manual Entry */}
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <Label htmlFor="manual-entry">Payment Link or Invoice ID</Label>
              <Input
                id="manual-entry"
                placeholder="INV-123456 or payment URL"
                value={manualEntry}
                onChange={(e) => setManualEntry(e.target.value)}
              />
            </div>
            <QpayButton
              type="submit"
              variant="outline"
              className="w-full"
              disabled={!manualEntry.trim()}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Process Payment
            </QpayButton>
          </form>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Scan the QR code provided by the merchant or enter the payment
              details manually
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QRScanner;
