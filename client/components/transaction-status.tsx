import { useState, useEffect } from "react";
import { QpayButton } from "./ui/qpay-button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  ArrowRight,
  Copy,
  ExternalLink,
  RefreshCw,
  Zap,
} from "lucide-react";

interface TransactionStatusProps {
  transactionId: string;
  onClose: () => void;
  onComplete?: () => void;
}

type TransactionStep = {
  id: string;
  title: string;
  description: string;
  status: "pending" | "processing" | "completed" | "failed";
  timestamp?: string;
};

const TransactionStatus = ({
  transactionId,
  onClose,
  onComplete,
}: TransactionStatusProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isFailed, setIsFailed] = useState(false);
  const [steps, setSteps] = useState<TransactionStep[]>([
    {
      id: "broadcast",
      title: "Transaction Broadcast",
      description: "Broadcasting transaction to blockchain network",
      status: "processing",
    },
    {
      id: "confirmation",
      title: "Network Confirmation",
      description: "Waiting for blockchain confirmations (1/3)",
      status: "pending",
    },
    {
      id: "validation",
      title: "Payment Validation",
      description: "Validating payment amount and recipient",
      status: "pending",
    },
    {
      id: "settlement",
      title: "Settlement Processing",
      description: "Converting to KES and initiating M-Pesa transfer",
      status: "pending",
    },
    {
      id: "complete",
      title: "Payment Complete",
      description: "Funds delivered to merchant account",
      status: "pending",
    },
  ]);

  // Simulate WebSocket updates
  useEffect(() => {
    const interval = setInterval(() => {
      setSteps((prevSteps) => {
        const newSteps = [...prevSteps];
        const nextStepIndex = newSteps.findIndex(
          (step) => step.status === "pending",
        );

        if (nextStepIndex !== -1 && nextStepIndex <= currentStep + 1) {
          // Update current step to completed
          if (currentStep < newSteps.length - 1) {
            newSteps[currentStep].status = "completed";
            newSteps[currentStep].timestamp = new Date().toLocaleTimeString();

            // Start next step
            if (nextStepIndex < newSteps.length) {
              newSteps[nextStepIndex].status = "processing";
              setCurrentStep(nextStepIndex);
            }
          }

          // Check if all steps are completed
          if (nextStepIndex === newSteps.length - 1) {
            newSteps[nextStepIndex].status = "completed";
            newSteps[nextStepIndex].timestamp = new Date().toLocaleTimeString();
            setIsComplete(true);
            setCurrentStep(newSteps.length);

            // Call completion callback
            setTimeout(() => {
              onComplete?.();
            }, 2000);
          }
        }

        return newSteps;
      });
    }, 3000); // Update every 3 seconds

    // Simulate random failure (5% chance)
    const failureTimeout = setTimeout(() => {
      if (Math.random() < 0.05) {
        setIsFailed(true);
        setSteps((prevSteps) => {
          const newSteps = [...prevSteps];
          newSteps[currentStep].status = "failed";
          return newSteps;
        });
      }
    }, 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(failureTimeout);
    };
  }, [currentStep, onComplete]);

  const getStepIcon = (step: TransactionStep, index: number) => {
    switch (step.status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-qpay-success" />;
      case "processing":
        return (
          <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        );
      case "failed":
        return <AlertCircle className="w-5 h-5 text-qpay-error" />;
      default:
        return (
          <div className="w-5 h-5 rounded-full border-2 border-muted text-muted-foreground flex items-center justify-center text-xs">
            {index + 1}
          </div>
        );
    }
  };

  const getStepColor = (step: TransactionStep) => {
    switch (step.status) {
      case "completed":
        return "text-qpay-success";
      case "processing":
        return "text-primary";
      case "failed":
        return "text-qpay-error";
      default:
        return "text-muted-foreground";
    }
  };

  const retryTransaction = () => {
    setIsFailed(false);
    setCurrentStep(0);
    setSteps((prevSteps) =>
      prevSteps.map((step, index) => ({
        ...step,
        status: index === 0 ? "processing" : "pending",
        timestamp: undefined,
      })),
    );
  };

  const copyTransactionId = () => {
    navigator.clipboard.writeText(transactionId);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="glass-card border-white/10 w-full max-w-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl">
            {isComplete
              ? "Payment Successful"
              : isFailed
                ? "Payment Failed"
                : "Processing Payment"}
          </CardTitle>
          <QpayButton variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </QpayButton>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Transaction ID */}
          <div className="p-3 rounded-lg bg-muted/5 border border-white/5">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Transaction ID:
              </span>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-sm text-foreground">
                  {transactionId}
                </span>
                <QpayButton
                  variant="ghost"
                  size="sm"
                  onClick={copyTransactionId}
                >
                  <Copy className="w-3 h-3" />
                </QpayButton>
              </div>
            </div>
          </div>

          {/* Success Animation */}
          {isComplete && (
            <div className="text-center py-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-qpay-success/10 mb-4 animate-bounce">
                <CheckCircle className="w-8 h-8 text-qpay-success" />
              </div>
              <h3 className="text-lg font-semibold text-qpay-success mb-2">
                Payment Completed Successfully!
              </h3>
              <p className="text-sm text-muted-foreground">
                The merchant has been notified and will process your order.
              </p>
            </div>
          )}

          {/* Failure Animation */}
          {isFailed && (
            <div className="text-center py-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-qpay-error/10 mb-4">
                <AlertCircle className="w-8 h-8 text-qpay-error" />
              </div>
              <h3 className="text-lg font-semibold text-qpay-error mb-2">
                Payment Failed
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                The transaction could not be processed. Please try again.
              </p>
              <QpayButton variant="primary" onClick={retryTransaction} glow>
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry Payment
              </QpayButton>
            </div>
          )}

          {/* Progress Steps */}
          {!isComplete && !isFailed && (
            <div className="space-y-4">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {getStepIcon(step, index)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className={`font-medium ${getStepColor(step)} transition-colors`}
                    >
                      {step.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {step.description}
                    </p>
                    {step.timestamp && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Completed at {step.timestamp}
                      </p>
                    )}
                  </div>
                  {step.status === "processing" && (
                    <Zap className="w-4 h-4 text-primary animate-pulse" />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Real-time Updates Indicator */}
          {!isComplete && !isFailed && (
            <div className="flex items-center justify-center space-x-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span className="text-sm text-primary">
                Real-time updates active
              </span>
            </div>
          )}

          {/* Estimated Time */}
          {!isComplete && !isFailed && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                <Clock className="w-4 h-4 inline mr-1" />
                Estimated completion: 2-5 minutes
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            {isComplete ? (
              <QpayButton
                variant="primary"
                onClick={onClose}
                className="flex-1"
              >
                Done
              </QpayButton>
            ) : (
              <>
                <QpayButton
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  Close
                </QpayButton>
                <QpayButton variant="ghost" className="flex-1">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View on Explorer
                </QpayButton>
              </>
            )}
          </div>

          {/* Help Link */}
          <div className="text-center">
            <a
              href="#"
              className="text-xs text-primary hover:text-primary/80 transition-colors inline-flex items-center"
            >
              Having issues? Contact support
              <ArrowRight className="w-3 h-3 ml-1" />
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionStatus;
