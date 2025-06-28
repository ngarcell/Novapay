import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { QpayButton } from "./ui/qpay-button";
import {
  Shield,
  TrendingUp,
  AlertTriangle,
  Brain,
  Activity,
  Eye,
  Zap,
  BarChart3,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
} from "lucide-react";

interface FraudAlert {
  id: string;
  severity: "low" | "medium" | "high" | "critical";
  type: string;
  message: string;
  timestamp: string;
  transactionId?: string;
}

interface DoubleSpendAlert {
  transactionHash: string;
  severity: "low" | "medium" | "high" | "critical";
  alertType: string;
  details: string;
  confidence: number;
}

interface ExchangeOptimization {
  currency: "BTC" | "USDT";
  currentRate: number;
  recommendedAction: string;
  potentialSavings: number;
  confidence: number;
}

const AIDashboard = () => {
  const [fraudAlerts, setFraudAlerts] = useState<FraudAlert[]>([]);
  const [doubleSpendAlerts, setDoubleSpendAlerts] = useState<
    DoubleSpendAlert[]
  >([]);
  const [exchangeOptimizations, setExchangeOptimizations] = useState<
    ExchangeOptimization[]
  >([]);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Mock AI analysis data
  const [aiStats] = useState({
    fraudDetectionAccuracy: 94.7,
    doubleSpendsPrevented: 23,
    optimizationSavings: 12847.5,
    transactionsAnalyzed: 1247,
    riskLevel: "low" as const,
    systemHealth: 98.2,
  });

  // Simulate real-time AI updates
  useEffect(() => {
    const interval = setInterval(() => {
      updateAIData();
      setLastUpdate(new Date());
    }, 5000); // Update every 5 seconds

    // Initial data load
    updateAIData();

    return () => clearInterval(interval);
  }, []);

  const updateAIData = () => {
    // Mock fraud alerts
    const mockFraudAlerts: FraudAlert[] = [
      {
        id: "FA001",
        severity: "medium",
        type: "Velocity Risk",
        message: "High transaction frequency detected from merchant ID: M123",
        timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
        transactionId: "TX-001",
      },
      {
        id: "FA002",
        severity: "low",
        type: "Location Risk",
        message: "Transaction from new geographic location",
        timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
        transactionId: "TX-002",
      },
    ];

    // Mock double spend alerts
    const mockDoubleSpendAlerts: DoubleSpendAlert[] = [
      {
        transactionHash: "0x1234567890abcdef",
        severity: "high",
        alertType: "mempool_conflict",
        details: "Conflicting transaction detected in mempool",
        confidence: 87,
      },
      {
        transactionHash: "0xabcdef1234567890",
        severity: "medium",
        alertType: "rbf_detected",
        details: "Replace-by-Fee transaction identified",
        confidence: 72,
      },
    ];

    // Mock exchange optimizations
    const mockExchangeOptimizations: ExchangeOptimization[] = [
      {
        currency: "BTC",
        currentRate: 5650000,
        recommendedAction: "Wait 15 minutes",
        potentialSavings: 2450.5,
        confidence: 83,
      },
      {
        currency: "USDT",
        currentRate: 142.5,
        recommendedAction: "Convert immediately",
        potentialSavings: 150.25,
        confidence: 91,
      },
    ];

    setFraudAlerts(mockFraudAlerts);
    setDoubleSpendAlerts(mockDoubleSpendAlerts);
    setExchangeOptimizations(mockExchangeOptimizations);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "text-red-500 bg-red-500/10 border-red-500/20";
      case "high":
        return "text-orange-500 bg-orange-500/10 border-orange-500/20";
      case "medium":
        return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
      case "low":
        return "text-blue-500 bg-blue-500/10 border-blue-500/20";
      default:
        return "text-gray-500 bg-gray-500/10 border-gray-500/20";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <XCircle className="w-4 h-4" />;
      case "high":
        return <AlertTriangle className="w-4 h-4" />;
      case "medium":
        return <Clock className="w-4 h-4" />;
      case "low":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* AI System Overview */}
      <Card className="glass-card border-white/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl flex items-center">
              <Brain className="w-5 h-5 mr-2 text-primary" />
              AI Security & Optimization Center
            </CardTitle>
            <div className="flex items-center space-x-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  isMonitoring ? "bg-green-500 animate-pulse" : "bg-gray-500"
                }`}
              />
              <span className="text-sm text-muted-foreground">
                {isMonitoring ? "Active" : "Inactive"}
              </span>
              <QpayButton
                variant="ghost"
                size="sm"
                onClick={() => updateAIData()}
              >
                <RefreshCw className="w-4 h-4" />
              </QpayButton>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center p-4 rounded-lg bg-primary/5 border border-primary/20">
              <Shield className="w-6 h-6 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-foreground">
                {aiStats.fraudDetectionAccuracy}%
              </div>
              <div className="text-xs text-muted-foreground">
                Fraud Detection
              </div>
            </div>
            <div className="text-center p-4 rounded-lg bg-qpay-success/5 border border-qpay-success/20">
              <Eye className="w-6 h-6 text-qpay-success mx-auto mb-2" />
              <div className="text-2xl font-bold text-foreground">
                {aiStats.doubleSpendsPrevented}
              </div>
              <div className="text-xs text-muted-foreground">Prevented</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-qpay-warning/5 border border-qpay-warning/20">
              <TrendingUp className="w-6 h-6 text-qpay-warning mx-auto mb-2" />
              <div className="text-2xl font-bold text-foreground">
                KES {aiStats.optimizationSavings.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">
                Optimization Savings
              </div>
            </div>
            <div className="text-center p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
              <BarChart3 className="w-6 h-6 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-foreground">
                {aiStats.transactionsAnalyzed.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">Analyzed</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-purple-500/5 border border-purple-500/20">
              <Activity className="w-6 h-6 text-purple-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-foreground">
                {aiStats.systemHealth}%
              </div>
              <div className="text-xs text-muted-foreground">System Health</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-green-500/5 border border-green-500/20">
              <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-foreground capitalize">
                {aiStats.riskLevel}
              </div>
              <div className="text-xs text-muted-foreground">Risk Level</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fraud Detection Alerts */}
        <Card className="glass-card border-white/10">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Shield className="w-5 h-5 mr-2 text-qpay-error" />
              Fraud Detection Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {fraudAlerts.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                  No fraud alerts detected
                </div>
              ) : (
                fraudAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-lg border ${getSeverityColor(
                      alert.severity,
                    )}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-2">
                        {getSeverityIcon(alert.severity)}
                        <div>
                          <div className="font-medium text-sm">
                            {alert.type}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {alert.message}
                          </div>
                          {alert.transactionId && (
                            <div className="text-xs text-primary mt-1">
                              TX: {alert.transactionId}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Double Spend Detection */}
        <Card className="glass-card border-white/10">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Eye className="w-5 h-5 mr-2 text-qpay-warning" />
              Double Spend Monitoring
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {doubleSpendAlerts.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                  No double spend attempts detected
                </div>
              ) : (
                doubleSpendAlerts.map((alert, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${getSeverityColor(
                      alert.severity,
                    )}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-2">
                        {getSeverityIcon(alert.severity)}
                        <div>
                          <div className="font-medium text-sm">
                            {alert.alertType.replace("_", " ").toUpperCase()}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {alert.details}
                          </div>
                          <div className="text-xs text-primary mt-1 font-mono">
                            {alert.transactionHash.substring(0, 16)}...
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {alert.confidence}% confidence
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Exchange Rate Optimization */}
      <Card className="glass-card border-white/10">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-qpay-success" />
            AI Exchange Rate Optimization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exchangeOptimizations.map((optimization, index) => (
              <div
                key={index}
                className="p-4 rounded-lg bg-muted/5 border border-white/5"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-qpay-warning/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-qpay-warning">
                        {optimization.currency}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-foreground">
                        {optimization.currency}/KES
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Rate: {optimization.currentRate.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-qpay-success">
                      +KES {optimization.potentialSavings.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Potential savings
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      AI Recommendation:
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      {optimization.recommendedAction}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Confidence:
                    </span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 h-2 bg-muted rounded-full">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-300"
                          style={{
                            width: `${optimization.confidence}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium text-foreground">
                        {optimization.confidence}%
                      </span>
                    </div>
                  </div>
                </div>

                <QpayButton variant="outline" size="sm" className="w-full mt-3">
                  <Zap className="w-4 h-4 mr-2" />
                  Apply Optimization
                </QpayButton>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Model Performance */}
      <Card className="glass-card border-white/10">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-primary" />
            AI Model Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-foreground">
                Fraud Detection Model
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Accuracy
                  </span>
                  <span className="text-sm font-medium">94.7%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Precision
                  </span>
                  <span className="text-sm font-medium">92.3%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Recall</span>
                  <span className="text-sm font-medium">96.1%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    F1 Score
                  </span>
                  <span className="text-sm font-medium">94.2%</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-foreground">
                Double Spend Detection
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Detection Rate
                  </span>
                  <span className="text-sm font-medium">99.2%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    False Positives
                  </span>
                  <span className="text-sm font-medium">0.8%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Response Time
                  </span>
                  <span className="text-sm font-medium">&lt;2s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Confidence Avg
                  </span>
                  <span className="text-sm font-medium">87.4%</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-foreground">Rate Optimization</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Prediction Accuracy
                  </span>
                  <span className="text-sm font-medium">89.6%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Avg Savings
                  </span>
                  <span className="text-sm font-medium">2.3%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Success Rate
                  </span>
                  <span className="text-sm font-medium">91.8%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Model Uptime
                  </span>
                  <span className="text-sm font-medium">99.9%</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIDashboard;
