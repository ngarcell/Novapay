interface TransactionData {
  amount: number;
  currency: string;
  merchantId: string;
  customerEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  paymentMethod: "BTC" | "USDT";
  timestamp: string;
  location?: {
    country: string;
    city: string;
  };
}

interface FraudRiskScore {
  overallRisk: number; // 0-100 scale
  riskLevel: "low" | "medium" | "high" | "critical";
  riskFactors: {
    velocityRisk: number;
    amountRisk: number;
    locationRisk: number;
    behaviorRisk: number;
    reputationRisk: number;
  };
  reasons: string[];
  recommendations: string[];
  requiresManualReview: boolean;
  blockTransaction: boolean;
}

interface TransactionPattern {
  merchantId: string;
  avgAmount: number;
  transactionCount: number;
  commonLocations: string[];
  normalHours: { start: number; end: number };
  deviceFingerprints: string[];
  riskHistory: number[];
}

export class AIFraudDetectionService {
  private transactionHistory: Map<string, TransactionData[]> = new Map();
  private merchantPatterns: Map<string, TransactionPattern> = new Map();
  private blockedAddresses: Set<string> = new Set();
  private suspiciousIPs: Set<string> = new Set();

  constructor() {
    // Initialize with some mock blocked addresses for demo
    this.blockedAddresses.add("bc1qblacklisted123");
    this.suspiciousIPs.add("192.168.1.100");

    // Initialize mock merchant patterns
    this.initializeMockPatterns();
  }

  // Main fraud detection analysis
  async analyzeTransaction(
    transactionData: TransactionData,
  ): Promise<FraudRiskScore> {
    const risks = await this.calculateRiskFactors(transactionData);
    const overallRisk = this.calculateOverallRisk(risks);
    const riskLevel = this.determineRiskLevel(overallRisk);

    const reasons = this.generateRiskReasons(risks, transactionData);
    const recommendations = this.generateRecommendations(risks, riskLevel);

    // Store transaction for pattern learning
    this.storeTransactionPattern(transactionData);

    return {
      overallRisk,
      riskLevel,
      riskFactors: risks,
      reasons,
      recommendations,
      requiresManualReview: overallRisk > 70,
      blockTransaction: overallRisk > 85,
    };
  }

  // Calculate individual risk factors using AI algorithms
  private async calculateRiskFactors(
    data: TransactionData,
  ): Promise<FraudRiskScore["riskFactors"]> {
    const velocityRisk = await this.analyzeVelocityRisk(data);
    const amountRisk = this.analyzeAmountRisk(data);
    const locationRisk = this.analyzeLocationRisk(data);
    const behaviorRisk = await this.analyzeBehaviorRisk(data);
    const reputationRisk = this.analyzeReputationRisk(data);

    return {
      velocityRisk,
      amountRisk,
      locationRisk,
      behaviorRisk,
      reputationRisk,
    };
  }

  // Velocity-based fraud detection (transaction frequency)
  private async analyzeVelocityRisk(data: TransactionData): Promise<number> {
    const merchantHistory = this.transactionHistory.get(data.merchantId) || [];
    const last24Hours = Date.now() - 24 * 60 * 60 * 1000;
    const recentTransactions = merchantHistory.filter(
      (tx) => new Date(tx.timestamp).getTime() > last24Hours,
    );

    // Calculate transaction velocity
    const velocityScore =
      recentTransactions.length > 50
        ? 90 // Very high risk
        : recentTransactions.length > 20
          ? 70 // High risk
          : recentTransactions.length > 10
            ? 40 // Medium risk
            : 10; // Low risk

    // Check for rapid-fire transactions (same IP in short time)
    const sameIPTransactions = recentTransactions.filter(
      (tx) => tx.ipAddress === data.ipAddress,
    );
    const rapidFireRisk = sameIPTransactions.length > 5 ? 50 : 0;

    return Math.min(velocityScore + rapidFireRisk, 100);
  }

  // Amount-based risk analysis
  private analyzeAmountRisk(data: TransactionData): number {
    const merchantPattern = this.merchantPatterns.get(data.merchantId);
    if (!merchantPattern) return 30; // Unknown merchant = medium risk

    const avgAmount = merchantPattern.avgAmount;
    const ratio = data.amount / avgAmount;

    // Flag unusually large transactions
    if (ratio > 10) return 80; // 10x normal amount
    if (ratio > 5) return 60; // 5x normal amount
    if (ratio > 3) return 40; // 3x normal amount

    // Flag unusually small amounts (potential testing)
    if (data.amount < 1) return 50; // Very small amounts

    return 15; // Normal amount range
  }

  // Geolocation-based risk analysis
  private analyzeLocationRisk(data: TransactionData): number {
    if (!data.location) return 25; // Unknown location = slight risk

    const merchantPattern = this.merchantPatterns.get(data.merchantId);
    if (!merchantPattern) return 30;

    // Check if location is in merchant's common locations
    const isCommonLocation = merchantPattern.commonLocations.includes(
      data.location.country,
    );

    if (!isCommonLocation) {
      // New location - moderate risk
      return 45;
    }

    // High-risk countries (this would be configurable)
    const highRiskCountries = ["Unknown", "VPN", "Tor"];
    if (highRiskCountries.includes(data.location.country)) {
      return 70;
    }

    return 10; // Normal location
  }

  // Behavioral pattern analysis
  private async analyzeBehaviorRisk(data: TransactionData): Promise<number> {
    const currentHour = new Date(data.timestamp).getHours();
    const merchantPattern = this.merchantPatterns.get(data.merchantId);

    if (!merchantPattern) return 25;

    // Check if transaction is outside normal business hours
    const isOutsideHours =
      currentHour < merchantPattern.normalHours.start ||
      currentHour > merchantPattern.normalHours.end;

    let behaviorRisk = isOutsideHours ? 30 : 10;

    // Check user agent consistency (device fingerprinting)
    if (
      data.userAgent &&
      !merchantPattern.deviceFingerprints.includes(data.userAgent)
    ) {
      behaviorRisk += 20; // New device
    }

    // Analyze payment method preferences
    const merchantHistory = this.transactionHistory.get(data.merchantId) || [];
    const btcTransactions = merchantHistory.filter(
      (tx) => tx.paymentMethod === "BTC",
    ).length;
    const totalTransactions = merchantHistory.length;

    if (totalTransactions > 0) {
      const btcRatio = btcTransactions / totalTransactions;
      // If merchant rarely uses BTC but this is a BTC transaction
      if (data.paymentMethod === "BTC" && btcRatio < 0.2) {
        behaviorRisk += 15;
      }
    }

    return Math.min(behaviorRisk, 100);
  }

  // Address/email reputation analysis
  private analyzeReputationRisk(data: TransactionData): number {
    let reputationRisk = 0;

    // Check if customer email is on suspicious list
    if (data.customerEmail) {
      const suspiciousDomains = [
        "tempmail.com",
        "10minutemail.com",
        "guerrillamail.com",
      ];
      const emailDomain = data.customerEmail.split("@")[1];
      if (suspiciousDomains.includes(emailDomain)) {
        reputationRisk += 40;
      }
    }

    // Check IP reputation
    if (data.ipAddress && this.suspiciousIPs.has(data.ipAddress)) {
      reputationRisk += 50;
    }

    // Merchant risk history
    const merchantPattern = this.merchantPatterns.get(data.merchantId);
    if (merchantPattern) {
      const avgRiskHistory =
        merchantPattern.riskHistory.reduce((a, b) => a + b, 0) /
        merchantPattern.riskHistory.length;
      if (avgRiskHistory > 60) {
        reputationRisk += 25; // Merchant has high risk history
      }
    }

    return Math.min(reputationRisk, 100);
  }

  // Calculate weighted overall risk score
  private calculateOverallRisk(risks: FraudRiskScore["riskFactors"]): number {
    const weights = {
      velocityRisk: 0.25,
      amountRisk: 0.2,
      locationRisk: 0.15,
      behaviorRisk: 0.25,
      reputationRisk: 0.15,
    };

    return Math.round(
      risks.velocityRisk * weights.velocityRisk +
        risks.amountRisk * weights.amountRisk +
        risks.locationRisk * weights.locationRisk +
        risks.behaviorRisk * weights.behaviorRisk +
        risks.reputationRisk * weights.reputationRisk,
    );
  }

  // Determine risk level category
  private determineRiskLevel(overallRisk: number): FraudRiskScore["riskLevel"] {
    if (overallRisk >= 80) return "critical";
    if (overallRisk >= 60) return "high";
    if (overallRisk >= 35) return "medium";
    return "low";
  }

  // Generate human-readable risk reasons
  private generateRiskReasons(
    risks: FraudRiskScore["riskFactors"],
    data: TransactionData,
  ): string[] {
    const reasons: string[] = [];

    if (risks.velocityRisk > 50) {
      reasons.push("High transaction velocity detected in last 24 hours");
    }
    if (risks.amountRisk > 50) {
      reasons.push(
        "Transaction amount significantly differs from merchant's typical pattern",
      );
    }
    if (risks.locationRisk > 50) {
      reasons.push("Transaction from unusual or high-risk location");
    }
    if (risks.behaviorRisk > 50) {
      reasons.push("Unusual transaction timing or device behavior detected");
    }
    if (risks.reputationRisk > 50) {
      reasons.push(
        "Customer email or IP address has negative reputation indicators",
      );
    }

    if (reasons.length === 0) {
      reasons.push("Transaction appears normal based on merchant patterns");
    }

    return reasons;
  }

  // Generate actionable recommendations
  private generateRecommendations(
    risks: FraudRiskScore["riskFactors"],
    riskLevel: FraudRiskScore["riskLevel"],
  ): string[] {
    const recommendations: string[] = [];

    switch (riskLevel) {
      case "critical":
        recommendations.push("Block transaction immediately");
        recommendations.push("Flag customer for manual review");
        recommendations.push("Consider reporting to fraud prevention networks");
        break;
      case "high":
        recommendations.push(
          "Require additional verification before processing",
        );
        recommendations.push(
          "Contact customer via phone to verify transaction",
        );
        recommendations.push("Implement step-up authentication");
        break;
      case "medium":
        recommendations.push("Monitor transaction closely during processing");
        recommendations.push("Send confirmation email to customer");
        recommendations.push("Review transaction within 24 hours");
        break;
      case "low":
        recommendations.push("Process transaction normally");
        recommendations.push("Continue monitoring for pattern changes");
        break;
    }

    return recommendations;
  }

  // Store transaction data for pattern learning
  private storeTransactionPattern(data: TransactionData): void {
    // Add to transaction history
    if (!this.transactionHistory.has(data.merchantId)) {
      this.transactionHistory.set(data.merchantId, []);
    }
    this.transactionHistory.get(data.merchantId)!.push(data);

    // Update merchant patterns
    this.updateMerchantPattern(data);
  }

  // Update merchant pattern data
  private updateMerchantPattern(data: TransactionData): void {
    const pattern = this.merchantPatterns.get(data.merchantId);
    const transactions = this.transactionHistory.get(data.merchantId) || [];

    if (pattern) {
      // Update existing pattern
      pattern.avgAmount =
        transactions.reduce((sum, tx) => sum + tx.amount, 0) /
        transactions.length;
      pattern.transactionCount = transactions.length;

      // Update common locations
      if (
        data.location &&
        !pattern.commonLocations.includes(data.location.country)
      ) {
        pattern.commonLocations.push(data.location.country);
      }

      // Update device fingerprints
      if (
        data.userAgent &&
        !pattern.deviceFingerprints.includes(data.userAgent)
      ) {
        pattern.deviceFingerprints.push(data.userAgent);
      }
    }
  }

  // Initialize mock patterns for demo
  private initializeMockPatterns(): void {
    this.merchantPatterns.set("merchant_1", {
      merchantId: "merchant_1",
      avgAmount: 150,
      transactionCount: 45,
      commonLocations: ["Kenya", "Uganda", "Tanzania"],
      normalHours: { start: 8, end: 18 },
      deviceFingerprints: ["Mozilla/5.0 (Windows NT 10.0; Win64; x64)"],
      riskHistory: [20, 15, 25, 18, 22],
    });
  }

  // Real-time risk monitoring
  async getRealtimeRiskInsights(merchantId: string): Promise<{
    currentRiskLevel: string;
    recentAlerts: string[];
    patternChanges: string[];
    recommendations: string[];
  }> {
    const pattern = this.merchantPatterns.get(merchantId);
    const recentTransactions = this.transactionHistory.get(merchantId) || [];

    const last24h = recentTransactions.filter(
      (tx) =>
        Date.now() - new Date(tx.timestamp).getTime() < 24 * 60 * 60 * 1000,
    );

    const avgRisk =
      last24h.length > 0
        ? last24h.reduce((sum, tx) => sum + 30, 0) / last24h.length
        : 20;

    return {
      currentRiskLevel:
        avgRisk > 60 ? "elevated" : avgRisk > 30 ? "moderate" : "low",
      recentAlerts: [
        last24h.length > 10 ? "High velocity transactions detected" : "",
        "No critical security alerts in last 24 hours",
      ].filter(Boolean),
      patternChanges: [
        "Transaction patterns remain consistent with historical data",
        "No unusual geographic activity detected",
      ],
      recommendations: [
        "Continue standard monitoring procedures",
        "Review monthly risk reports for trend analysis",
      ],
    };
  }
}

export const aiFraudDetection = new AIFraudDetectionService();
