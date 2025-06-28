interface BlockchainTransaction {
  hash: string;
  fromAddress: string;
  toAddress: string;
  amount: number;
  currency: "BTC" | "USDT";
  blockHeight?: number;
  confirmations: number;
  timestamp: string;
  gasPrice?: number;
  nonce?: number;
}

interface DoubleSpendAlert {
  severity: "low" | "medium" | "high" | "critical";
  confidence: number; // 0-100
  alertType:
    | "mempool_conflict"
    | "chain_reorg"
    | "rbf_detected"
    | "suspicious_pattern"
    | "confirmed_double_spend";
  details: string;
  recommendedAction: string;
  relatedTransactions: string[];
  estimatedRisk: number;
}

interface TransactionMonitoring {
  transactionHash: string;
  invoiceId: string;
  expectedAmount: number;
  receivingAddress: string;
  currency: "BTC" | "USDT";
  status: "pending" | "confirmed" | "suspicious" | "double_spent";
  alerts: DoubleSpendAlert[];
  mempoolEntryTime: string;
  lastUpdateTime: string;
}

export class AIDoubleSpendDetectionService {
  private monitoredTransactions: Map<string, TransactionMonitoring> = new Map();
  private mempoolTransactions: Map<string, BlockchainTransaction[]> = new Map();
  private confirmedTransactions: Map<string, BlockchainTransaction> = new Map();
  private suspiciousAddresses: Set<string> = new Set();
  private rbfTransactions: Set<string> = new Set(); // Replace-by-Fee transactions

  constructor() {
    // Initialize with some mock suspicious addresses
    this.suspiciousAddresses.add("bc1qsuspicious123");
    this.initializeMockData();
  }

  // Start monitoring a transaction for double-spend attempts
  async startMonitoring(
    transactionHash: string,
    invoiceId: string,
    expectedAmount: number,
    receivingAddress: string,
    currency: "BTC" | "USDT",
  ): Promise<void> {
    const monitoring: TransactionMonitoring = {
      transactionHash,
      invoiceId,
      expectedAmount,
      receivingAddress,
      currency,
      status: "pending",
      alerts: [],
      mempoolEntryTime: new Date().toISOString(),
      lastUpdateTime: new Date().toISOString(),
    };

    this.monitoredTransactions.set(transactionHash, monitoring);
    await this.analyzeTransaction(transactionHash);
  }

  // Main analysis function for double-spend detection
  async analyzeTransaction(
    transactionHash: string,
  ): Promise<DoubleSpendAlert[]> {
    const monitoring = this.monitoredTransactions.get(transactionHash);
    if (!monitoring) return [];

    const alerts: DoubleSpendAlert[] = [];

    // Get transaction from blockchain/mempool
    const transaction = await this.getTransactionData(transactionHash);
    if (!transaction) {
      alerts.push({
        severity: "medium",
        confidence: 70,
        alertType: "suspicious_pattern",
        details: "Transaction not found in mempool or blockchain",
        recommendedAction:
          "Wait for transaction to appear or request new payment",
        relatedTransactions: [],
        estimatedRisk: 60,
      });
      return alerts;
    }

    // Check for mempool conflicts
    const mempoolConflicts = await this.detectMempoolConflicts(transaction);
    alerts.push(...mempoolConflicts);

    // Check for Replace-by-Fee (RBF) indicators
    const rbfAlerts = await this.detectRBFAttempts(transaction);
    alerts.push(...rbfAlerts);

    // Analyze spending patterns
    const patternAlerts = await this.analyzeSpendingPatterns(transaction);
    alerts.push(...patternAlerts);

    // Check for chain reorganization risks
    const reorgAlerts = await this.detectChainReorgRisks(transaction);
    alerts.push(...reorgAlerts);

    // Update monitoring data
    monitoring.alerts = alerts;
    monitoring.lastUpdateTime = new Date().toISOString();
    monitoring.status = this.determineTransactionStatus(alerts, transaction);

    return alerts;
  }

  // Detect conflicting transactions in mempool
  private async detectMempoolConflicts(
    transaction: BlockchainTransaction,
  ): Promise<DoubleSpendAlert[]> {
    const alerts: DoubleSpendAlert[] = [];
    const addressTransactions =
      this.mempoolTransactions.get(transaction.fromAddress) || [];

    // Look for transactions with same inputs (UTXO conflicts for Bitcoin)
    const conflictingTxs = addressTransactions.filter(
      (tx) =>
        tx.hash !== transaction.hash &&
        tx.fromAddress === transaction.fromAddress &&
        Math.abs(
          new Date(tx.timestamp).getTime() -
            new Date(transaction.timestamp).getTime(),
        ) <
          5 * 60 * 1000, // Within 5 minutes
    );

    if (conflictingTxs.length > 0) {
      alerts.push({
        severity: "high",
        confidence: 85,
        alertType: "mempool_conflict",
        details: `Detected ${conflictingTxs.length} conflicting transactions in mempool from same address`,
        recommendedAction:
          "Wait for blockchain confirmation before accepting payment",
        relatedTransactions: conflictingTxs.map((tx) => tx.hash),
        estimatedRisk: 75,
      });
    }

    // Check for rapid successive transactions (potential double-spend attempt)
    const rapidTransactions = addressTransactions.filter(
      (tx) =>
        Math.abs(
          new Date(tx.timestamp).getTime() -
            new Date(transaction.timestamp).getTime(),
        ) < 30000, // Within 30 seconds
    );

    if (rapidTransactions.length > 2) {
      alerts.push({
        severity: "medium",
        confidence: 70,
        alertType: "suspicious_pattern",
        details: "Multiple rapid transactions detected from same address",
        recommendedAction:
          "Monitor for confirmation and verify transaction uniqueness",
        relatedTransactions: rapidTransactions.map((tx) => tx.hash),
        estimatedRisk: 60,
      });
    }

    return alerts;
  }

  // Detect Replace-by-Fee (RBF) attempts
  private async detectRBFAttempts(
    transaction: BlockchainTransaction,
  ): Promise<DoubleSpendAlert[]> {
    const alerts: DoubleSpendAlert[] = [];

    // Check if transaction is marked as RBF-enabled (sequence number < 0xfffffffe for Bitcoin)
    const isRBFEnabled = Math.random() > 0.8; // Mock RBF detection

    if (isRBFEnabled) {
      this.rbfTransactions.add(transaction.hash);
      alerts.push({
        severity: "medium",
        confidence: 80,
        alertType: "rbf_detected",
        details: "Transaction is marked as Replace-by-Fee enabled",
        recommendedAction:
          "Wait for at least 1 confirmation before accepting payment",
        relatedTransactions: [],
        estimatedRisk: 55,
      });
    }

    // Check for actual RBF replacement
    const originalTx = Array.from(this.rbfTransactions).find(
      (txHash) =>
        txHash !== transaction.hash &&
        this.getTransactionData(txHash).then(
          (tx) => tx?.fromAddress === transaction.fromAddress,
        ),
    );

    if (originalTx) {
      alerts.push({
        severity: "high",
        confidence: 90,
        alertType: "rbf_detected",
        details:
          "Transaction appears to be an RBF replacement of earlier transaction",
        recommendedAction:
          "Verify which transaction is valid and wait for confirmation",
        relatedTransactions: [originalTx],
        estimatedRisk: 80,
      });
    }

    return alerts;
  }

  // Analyze suspicious spending patterns
  private async analyzeSpendingPatterns(
    transaction: BlockchainTransaction,
  ): Promise<DoubleSpendAlert[]> {
    const alerts: DoubleSpendAlert[] = [];

    // Check if sending address is known to be suspicious
    if (this.suspiciousAddresses.has(transaction.fromAddress)) {
      alerts.push({
        severity: "high",
        confidence: 85,
        alertType: "suspicious_pattern",
        details:
          "Transaction from address with history of double-spend attempts",
        recommendedAction:
          "Require multiple confirmations before accepting payment",
        relatedTransactions: [],
        estimatedRisk: 75,
      });
    }

    // Analyze transaction fees (low fees might indicate double-spend attempt)
    const isLowFee = transaction.gasPrice
      ? transaction.gasPrice < 20
      : Math.random() > 0.7;

    if (isLowFee && transaction.currency === "BTC") {
      alerts.push({
        severity: "medium",
        confidence: 65,
        alertType: "suspicious_pattern",
        details: "Transaction has unusually low network fees",
        recommendedAction:
          "Monitor for confirmation delays and potential replacement",
        relatedTransactions: [],
        estimatedRisk: 45,
      });
    }

    // Check for outputs to multiple addresses (potential attempt to complicate tracking)
    const hasMultipleOutputs = Math.random() > 0.6; // Mock detection

    if (hasMultipleOutputs) {
      alerts.push({
        severity: "low",
        confidence: 50,
        alertType: "suspicious_pattern",
        details: "Transaction sends to multiple addresses simultaneously",
        recommendedAction:
          "Standard monitoring, verify expected amount received",
        relatedTransactions: [],
        estimatedRisk: 30,
      });
    }

    return alerts;
  }

  // Detect blockchain reorganization risks
  private async detectChainReorgRisks(
    transaction: BlockchainTransaction,
  ): Promise<DoubleSpendAlert[]> {
    const alerts: DoubleSpendAlert[] = [];

    // For very recent blocks, there's always some reorg risk
    if (transaction.blockHeight && transaction.confirmations < 6) {
      const reorgRisk = Math.max(0, 25 - transaction.confirmations * 4);

      if (reorgRisk > 10) {
        alerts.push({
          severity: transaction.confirmations < 3 ? "medium" : "low",
          confidence: 60 + transaction.confirmations * 10,
          alertType: "chain_reorg",
          details: `Transaction has only ${transaction.confirmations} confirmations - reorg risk exists`,
          recommendedAction: `Wait for ${6 - transaction.confirmations} more confirmations for full security`,
          relatedTransactions: [],
          estimatedRisk: reorgRisk,
        });
      }
    }

    return alerts;
  }

  // Get comprehensive transaction status
  async getTransactionStatus(transactionHash: string): Promise<{
    status: "pending" | "confirmed" | "suspicious" | "double_spent";
    confirmations: number;
    riskLevel: "low" | "medium" | "high" | "critical";
    alerts: DoubleSpendAlert[];
    recommendations: string[];
    safeToAccept: boolean;
  }> {
    const monitoring = this.monitoredTransactions.get(transactionHash);
    if (!monitoring) {
      throw new Error("Transaction not being monitored");
    }

    const transaction = await this.getTransactionData(transactionHash);
    const confirmations = transaction?.confirmations || 0;
    const alerts = await this.analyzeTransaction(transactionHash);

    const highSeverityAlerts = alerts.filter(
      (alert) => alert.severity === "high" || alert.severity === "critical",
    );
    const riskLevel = this.calculateOverallRiskLevel(alerts);

    const recommendations = this.generateRecommendations(alerts, confirmations);
    const safeToAccept = this.isSafeToAccept(alerts, confirmations);

    return {
      status: monitoring.status,
      confirmations,
      riskLevel,
      alerts,
      recommendations,
      safeToAccept,
    };
  }

  // Determine if transaction is safe to accept
  private isSafeToAccept(
    alerts: DoubleSpendAlert[],
    confirmations: number,
  ): boolean {
    // Critical alerts always block acceptance
    const criticalAlerts = alerts.filter(
      (alert) => alert.severity === "critical",
    );
    if (criticalAlerts.length > 0) return false;

    // High severity alerts require more confirmations
    const highSeverityAlerts = alerts.filter(
      (alert) => alert.severity === "high",
    );
    if (highSeverityAlerts.length > 0 && confirmations < 3) return false;

    // Medium alerts require at least 1 confirmation
    const mediumSeverityAlerts = alerts.filter(
      (alert) => alert.severity === "medium",
    );
    if (mediumSeverityAlerts.length > 0 && confirmations < 1) return false;

    return true;
  }

  // Calculate overall risk level
  private calculateOverallRiskLevel(
    alerts: DoubleSpendAlert[],
  ): "low" | "medium" | "high" | "critical" {
    if (alerts.some((alert) => alert.severity === "critical"))
      return "critical";
    if (alerts.some((alert) => alert.severity === "high")) return "high";
    if (alerts.some((alert) => alert.severity === "medium")) return "medium";
    return "low";
  }

  // Generate actionable recommendations
  private generateRecommendations(
    alerts: DoubleSpendAlert[],
    confirmations: number,
  ): string[] {
    const recommendations: string[] = [];

    if (alerts.length === 0) {
      recommendations.push("Transaction appears safe to accept");
      return recommendations;
    }

    // Sort alerts by severity and add specific recommendations
    const sortedAlerts = alerts.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });

    for (const alert of sortedAlerts) {
      recommendations.push(alert.recommendedAction);
    }

    // Add confirmation-based recommendations
    if (confirmations === 0) {
      recommendations.push("Wait for at least 1 blockchain confirmation");
    } else if (confirmations < 6) {
      recommendations.push(
        `Consider waiting for ${6 - confirmations} additional confirmations for maximum security`,
      );
    }

    return [...new Set(recommendations)]; // Remove duplicates
  }

  // Determine transaction status based on alerts and confirmations
  private determineTransactionStatus(
    alerts: DoubleSpendAlert[],
    transaction: BlockchainTransaction,
  ): "pending" | "confirmed" | "suspicious" | "double_spent" {
    // Check for confirmed double-spend
    const doubleSpendAlert = alerts.find(
      (alert) => alert.alertType === "confirmed_double_spend",
    );
    if (doubleSpendAlert) return "double_spent";

    // Check for high-risk alerts
    const highRiskAlerts = alerts.filter(
      (alert) => alert.severity === "high" || alert.severity === "critical",
    );
    if (highRiskAlerts.length > 0) return "suspicious";

    // Check confirmations
    if (transaction.confirmations >= 6) return "confirmed";
    if (transaction.confirmations >= 1) return "confirmed";

    return "pending";
  }

  // Mock function to get transaction data
  private async getTransactionData(
    transactionHash: string,
  ): Promise<BlockchainTransaction | null> {
    // Mock transaction data - in real implementation, this would query blockchain APIs
    return {
      hash: transactionHash,
      fromAddress: "bc1qsender123",
      toAddress: "bc1qreceiver456",
      amount: 0.001,
      currency: "BTC",
      blockHeight: 800000 + Math.floor(Math.random() * 1000),
      confirmations: Math.floor(Math.random() * 10),
      timestamp: new Date().toISOString(),
      gasPrice: 50 + Math.random() * 100,
      nonce: Math.floor(Math.random() * 1000),
    };
  }

  // Initialize mock data for demonstration
  private initializeMockData(): void {
    // Add some mock mempool transactions
    const mockAddress = "bc1qsender123";
    this.mempoolTransactions.set(mockAddress, [
      {
        hash: "mock_tx_1",
        fromAddress: mockAddress,
        toAddress: "bc1qreceiver456",
        amount: 0.001,
        currency: "BTC",
        confirmations: 0,
        timestamp: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
      },
    ]);
  }

  // Real-time monitoring dashboard data
  async getMonitoringDashboard(): Promise<{
    activeMonitoring: number;
    totalAlerts: number;
    riskDistribution: {
      low: number;
      medium: number;
      high: number;
      critical: number;
    };
    recentAlerts: Array<{
      transactionHash: string;
      severity: string;
      timestamp: string;
      details: string;
    }>;
  }> {
    const activeTransactions = Array.from(this.monitoredTransactions.values());
    const allAlerts = activeTransactions.flatMap((tx) => tx.alerts);

    const riskDistribution = {
      low: allAlerts.filter((alert) => alert.severity === "low").length,
      medium: allAlerts.filter((alert) => alert.severity === "medium").length,
      high: allAlerts.filter((alert) => alert.severity === "high").length,
      critical: allAlerts.filter((alert) => alert.severity === "critical")
        .length,
    };

    const recentAlerts = activeTransactions
      .flatMap((tx) =>
        tx.alerts.map((alert) => ({
          transactionHash: tx.transactionHash,
          severity: alert.severity,
          timestamp: tx.lastUpdateTime,
          details: alert.details,
        })),
      )
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      .slice(0, 10);

    return {
      activeMonitoring: activeTransactions.length,
      totalAlerts: allAlerts.length,
      riskDistribution,
      recentAlerts,
    };
  }
}

export const aiDoubleSpendDetection = new AIDoubleSpendDetectionService();
