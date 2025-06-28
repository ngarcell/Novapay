interface ExchangeRate {
  fromCurrency: "BTC" | "USDT";
  toCurrency: "KES" | "USD";
  rate: number;
  timestamp: string;
  source: "yellowcard" | "binance" | "coinbase" | "aggregated";
  spread: number;
  volume24h: number;
}

interface RatePrediction {
  currency: "BTC" | "USDT";
  currentRate: number;
  predictedRates: {
    in5min: number;
    in15min: number;
    in30min: number;
    in1hour: number;
    in4hours: number;
  };
  confidence: {
    in5min: number;
    in15min: number;
    in30min: number;
    in1hour: number;
    in4hours: number;
  };
  trend: "bullish" | "bearish" | "neutral";
  volatility: "low" | "medium" | "high";
  recommendation: "convert_now" | "wait_short" | "wait_long" | "hold";
}

interface OptimizedConversion {
  originalAmount: number;
  currency: "BTC" | "USDT";
  recommendedTiming: "immediate" | "wait_5min" | "wait_15min" | "wait_30min";
  estimatedSavings: number;
  confidenceLevel: number;
  riskFactor: number;
  maxWaitTime: number; // minutes
  alternativeStrategy?: string;
}

interface MarketConditions {
  overallSentiment: "bullish" | "bearish" | "neutral";
  volatilityIndex: number; // 0-100
  tradingVolume: "low" | "medium" | "high";
  liquidityScore: number; // 0-100
  marketEvents: string[];
  riskLevel: "low" | "medium" | "high";
}

export class AIExchangeOptimizationService {
  private rateHistory: Map<string, ExchangeRate[]> = new Map();
  private marketIndicators: Map<string, number[]> = new Map();
  private conversionQueue: Array<{
    amount: number;
    currency: "BTC" | "USDT";
    targetTime: Date;
    invoiceId: string;
  }> = [];

  constructor() {
    this.initializeHistoricalData();
    this.startMarketAnalysis();
  }

  // Main optimization function for conversion timing
  async optimizeConversion(
    amount: number,
    currency: "BTC" | "USDT",
    maxWaitTime: number = 30, // minutes
  ): Promise<OptimizedConversion> {
    const currentRate = await this.getCurrentRate(currency, "KES");
    const prediction = await this.predictRates(currency);
    const marketConditions = await this.analyzeMarketConditions();

    const optimization = this.calculateOptimalTiming(
      amount,
      currency,
      currentRate,
      prediction,
      marketConditions,
      maxWaitTime,
    );

    return optimization;
  }

  // AI-powered rate prediction using multiple indicators
  async predictRates(currency: "BTC" | "USDT"): Promise<RatePrediction> {
    const currentRate = await this.getCurrentRate(currency, "KES");
    const historicalRates = this.getRateHistory(currency, 24); // Last 24 hours

    // Technical indicators
    const sma5 = this.calculateSMA(historicalRates, 5);
    const sma15 = this.calculateSMA(historicalRates, 15);
    const rsi = this.calculateRSI(historicalRates, 14);
    const macd = this.calculateMACD(historicalRates);

    // Machine learning prediction (simplified)
    const trend = this.predictTrend(sma5, sma15, rsi, macd);
    const volatility = this.calculateVolatility(historicalRates);

    // Generate predictions with confidence intervals
    const baseVolatility =
      volatility === "high" ? 0.03 : volatility === "medium" ? 0.015 : 0.005;

    const predictions = {
      in5min: this.generatePrediction(currentRate, trend, baseVolatility * 0.2),
      in15min: this.generatePrediction(
        currentRate,
        trend,
        baseVolatility * 0.5,
      ),
      in30min: this.generatePrediction(
        currentRate,
        trend,
        baseVolatility * 0.8,
      ),
      in1hour: this.generatePrediction(
        currentRate,
        trend,
        baseVolatility * 1.2,
      ),
      in4hours: this.generatePrediction(
        currentRate,
        trend,
        baseVolatility * 2.0,
      ),
    };

    const confidence = {
      in5min: this.calculateConfidence(5, volatility, trend),
      in15min: this.calculateConfidence(15, volatility, trend),
      in30min: this.calculateConfidence(30, volatility, trend),
      in1hour: this.calculateConfidence(60, volatility, trend),
      in4hours: this.calculateConfidence(240, volatility, trend),
    };

    const recommendation = this.generateRecommendation(
      predictions,
      confidence,
      trend,
      volatility,
    );

    return {
      currency,
      currentRate,
      predictedRates: predictions,
      confidence,
      trend,
      volatility,
      recommendation,
    };
  }

  // Calculate optimal timing for conversion
  private calculateOptimalTiming(
    amount: number,
    currency: "BTC" | "USDT",
    currentRate: number,
    prediction: RatePrediction,
    marketConditions: MarketConditions,
    maxWaitTime: number,
  ): OptimizedConversion {
    const currentValue = amount * currentRate;

    // Calculate potential values at different times
    const potentialValues = {
      immediate: currentValue,
      wait_5min: amount * prediction.predictedRates.in5min,
      wait_15min: amount * prediction.predictedRates.in15min,
      wait_30min: amount * prediction.predictedRates.in30min,
    };

    // Apply confidence weighting
    const weightedValues = {
      immediate: potentialValues.immediate,
      wait_5min:
        potentialValues.wait_5min * (prediction.confidence.in5min / 100),
      wait_15min:
        potentialValues.wait_15min * (prediction.confidence.in15min / 100),
      wait_30min:
        potentialValues.wait_30min * (prediction.confidence.in30min / 100),
    };

    // Factor in market conditions and risk
    const riskAdjustment = this.calculateRiskAdjustment(marketConditions);

    // Find optimal timing
    let bestTiming: keyof typeof weightedValues = "immediate";
    let bestValue = weightedValues.immediate;

    for (const [timing, value] of Object.entries(weightedValues)) {
      const adjustedValue = value * riskAdjustment;
      const waitMinutes =
        timing === "immediate"
          ? 0
          : timing === "wait_5min"
            ? 5
            : timing === "wait_15min"
              ? 15
              : 30;

      if (waitMinutes <= maxWaitTime && adjustedValue > bestValue) {
        bestTiming = timing as keyof typeof weightedValues;
        bestValue = adjustedValue;
      }
    }

    const estimatedSavings = bestValue - currentValue;
    const confidenceLevel =
      bestTiming === "immediate"
        ? 100
        : prediction.confidence[
            bestTiming.replace(
              "wait_",
              "in",
            ) as keyof typeof prediction.confidence
          ];

    return {
      originalAmount: amount,
      currency,
      recommendedTiming: bestTiming,
      estimatedSavings,
      confidenceLevel,
      riskFactor: this.calculateRiskFactor(
        marketConditions,
        prediction.volatility,
      ),
      maxWaitTime,
      alternativeStrategy: this.generateAlternativeStrategy(
        prediction,
        marketConditions,
      ),
    };
  }

  // Analyze current market conditions
  async analyzeMarketConditions(): Promise<MarketConditions> {
    // Aggregate multiple market indicators
    const sentimentScore = this.calculateSentimentScore();
    const volatilityIndex = this.calculateMarketVolatility();
    const volumeLevel = this.analyzeVolume();
    const liquidityScore = this.calculateLiquidity();

    const overallSentiment =
      sentimentScore > 60
        ? "bullish"
        : sentimentScore < 40
          ? "bearish"
          : "neutral";

    const riskLevel =
      volatilityIndex > 70 ? "high" : volatilityIndex > 40 ? "medium" : "low";

    return {
      overallSentiment,
      volatilityIndex,
      tradingVolume: volumeLevel,
      liquidityScore,
      marketEvents: this.detectMarketEvents(),
      riskLevel,
    };
  }

  // Smart conversion scheduling
  async scheduleOptimalConversion(
    amount: number,
    currency: "BTC" | "USDT",
    invoiceId: string,
    maxDelay: number = 60, // minutes
  ): Promise<{
    scheduledTime: Date;
    expectedRate: number;
    estimatedSavings: number;
    monitoringActive: boolean;
  }> {
    const optimization = await this.optimizeConversion(
      amount,
      currency,
      maxDelay,
    );

    const delayMinutes =
      optimization.recommendedTiming === "immediate"
        ? 0
        : optimization.recommendedTiming === "wait_5min"
          ? 5
          : optimization.recommendedTiming === "wait_15min"
            ? 15
            : 30;

    const scheduledTime = new Date(Date.now() + delayMinutes * 60 * 1000);

    // Add to conversion queue for monitoring
    this.conversionQueue.push({
      amount,
      currency,
      targetTime: scheduledTime,
      invoiceId,
    });

    const prediction = await this.predictRates(currency);
    const expectedRate =
      optimization.recommendedTiming === "immediate"
        ? prediction.currentRate
        : prediction.predictedRates[
            optimization.recommendedTiming.replace(
              "wait_",
              "in",
            ) as keyof typeof prediction.predictedRates
          ];

    return {
      scheduledTime,
      expectedRate,
      estimatedSavings: optimization.estimatedSavings,
      monitoringActive: true,
    };
  }

  // Real-time rate monitoring and alerts
  async monitorRates(): Promise<{
    alerts: Array<{
      currency: "BTC" | "USDT";
      alertType: "price_spike" | "optimal_timing" | "volatility_warning";
      message: string;
      urgency: "low" | "medium" | "high";
      actionRequired: boolean;
    }>;
    queuedConversions: number;
    potentialSavings: number;
  }> {
    const alerts = [];
    let totalPotentialSavings = 0;

    // Check for price spikes
    for (const currency of ["BTC", "USDT"] as const) {
      const currentRate = await this.getCurrentRate(currency, "KES");
      const historicalRates = this.getRateHistory(currency, 1);

      if (historicalRates.length > 0) {
        const rateChange =
          (currentRate - historicalRates[0].rate) / historicalRates[0].rate;

        if (Math.abs(rateChange) > 0.05) {
          // 5% change
          alerts.push({
            currency,
            alertType: "price_spike",
            message: `${currency} rate changed by ${(rateChange * 100).toFixed(2)}% in the last hour`,
            urgency: Math.abs(rateChange) > 0.1 ? "high" : "medium",
            actionRequired: true,
          });
        }
      }
    }

    // Check queued conversions for optimal timing
    for (const conversion of this.conversionQueue) {
      const optimization = await this.optimizeConversion(
        conversion.amount,
        conversion.currency,
        5, // Check if immediate conversion is better
      );

      if (
        optimization.recommendedTiming === "immediate" &&
        optimization.estimatedSavings > 0
      ) {
        alerts.push({
          currency: conversion.currency,
          alertType: "optimal_timing",
          message: `Optimal time to convert ${conversion.currency} - potential savings detected`,
          urgency: "medium",
          actionRequired: true,
        });

        totalPotentialSavings += optimization.estimatedSavings;
      }
    }

    // Check for high volatility periods
    for (const currency of ["BTC", "USDT"] as const) {
      const prediction = await this.predictRates(currency);
      if (prediction.volatility === "high") {
        alerts.push({
          currency,
          alertType: "volatility_warning",
          message: `High volatility detected for ${currency} - consider immediate conversion`,
          urgency: "medium",
          actionRequired: false,
        });
      }
    }

    return {
      alerts,
      queuedConversions: this.conversionQueue.length,
      potentialSavings: totalPotentialSavings,
    };
  }

  // Technical analysis helper functions
  private calculateSMA(rates: ExchangeRate[], period: number): number {
    if (rates.length < period) return rates[0]?.rate || 0;
    const sum = rates
      .slice(0, period)
      .reduce((acc, rate) => acc + rate.rate, 0);
    return sum / period;
  }

  private calculateRSI(rates: ExchangeRate[], period: number): number {
    if (rates.length < period + 1) return 50; // Neutral RSI

    let gains = 0;
    let losses = 0;

    for (let i = 0; i < period; i++) {
      const change = rates[i].rate - rates[i + 1].rate;
      if (change > 0) gains += change;
      else losses -= change;
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;
    const rs = avgGain / avgLoss;

    return 100 - 100 / (1 + rs);
  }

  private calculateMACD(rates: ExchangeRate[]): {
    macd: number;
    signal: number;
  } {
    const ema12 = this.calculateEMA(rates, 12);
    const ema26 = this.calculateEMA(rates, 26);
    const macd = ema12 - ema26;

    // Simplified signal line (9-period EMA of MACD)
    const signal = macd * 0.8; // Simplified calculation

    return { macd, signal };
  }

  private calculateEMA(rates: ExchangeRate[], period: number): number {
    if (rates.length === 0) return 0;

    const multiplier = 2 / (period + 1);
    let ema = rates[rates.length - 1].rate;

    for (let i = rates.length - 2; i >= 0; i--) {
      ema = rates[i].rate * multiplier + ema * (1 - multiplier);
    }

    return ema;
  }

  // Market analysis helper functions
  private predictTrend(
    sma5: number,
    sma15: number,
    rsi: number,
    macd: { macd: number; signal: number },
  ): "bullish" | "bearish" | "neutral" {
    let bullishSignals = 0;
    let bearishSignals = 0;

    if (sma5 > sma15) bullishSignals++;
    else bearishSignals++;

    if (rsi < 30)
      bullishSignals++; // Oversold
    else if (rsi > 70) bearishSignals++; // Overbought

    if (macd.macd > macd.signal) bullishSignals++;
    else bearishSignals++;

    if (bullishSignals > bearishSignals) return "bullish";
    if (bearishSignals > bullishSignals) return "bearish";
    return "neutral";
  }

  private calculateVolatility(
    rates: ExchangeRate[],
  ): "low" | "medium" | "high" {
    if (rates.length < 2) return "medium";

    const returns = [];
    for (let i = 0; i < rates.length - 1; i++) {
      returns.push((rates[i].rate - rates[i + 1].rate) / rates[i + 1].rate);
    }

    const variance =
      returns.reduce((acc, ret) => acc + ret * ret, 0) / returns.length;
    const volatility = Math.sqrt(variance);

    if (volatility > 0.05) return "high";
    if (volatility > 0.02) return "medium";
    return "low";
  }

  private generatePrediction(
    currentRate: number,
    trend: string,
    volatility: number,
  ): number {
    const trendMultiplier =
      trend === "bullish" ? 1.02 : trend === "bearish" ? 0.98 : 1.0;
    const randomFactor = (Math.random() - 0.5) * volatility * 2;
    return currentRate * trendMultiplier * (1 + randomFactor);
  }

  private calculateConfidence(
    minutes: number,
    volatility: string,
    trend: string,
  ): number {
    let baseConfidence = 90;

    // Reduce confidence over time
    baseConfidence -= minutes / 10;

    // Reduce confidence for high volatility
    if (volatility === "high") baseConfidence -= 20;
    else if (volatility === "medium") baseConfidence -= 10;

    // Increase confidence for strong trends
    if (trend !== "neutral") baseConfidence += 5;

    return Math.max(30, Math.min(95, baseConfidence));
  }

  private generateRecommendation(
    predictions: RatePrediction["predictedRates"],
    confidence: RatePrediction["confidence"],
    trend: string,
    volatility: string,
  ): RatePrediction["recommendation"] {
    if (volatility === "high") return "convert_now";

    if (trend === "bullish" && confidence.in15min > 70) return "wait_short";
    if (trend === "bearish") return "convert_now";
    if (confidence.in30min > 80) return "wait_long";

    return "convert_now";
  }

  // Mock data and initialization
  private async getCurrentRate(
    currency: "BTC" | "USDT",
    toCurrency: "KES" | "USD",
  ): Promise<number> {
    // Mock current rates
    if (currency === "BTC" && toCurrency === "KES") {
      return 5500000 + (Math.random() - 0.5) * 200000; // ~5.5M KES ± 100K
    }
    if (currency === "USDT" && toCurrency === "KES") {
      return 140 + (Math.random() - 0.5) * 5; // ~140 KES ± 2.5
    }
    return 1;
  }

  private getRateHistory(
    currency: "BTC" | "USDT",
    hours: number,
  ): ExchangeRate[] {
    const key = `${currency}_KES`;
    let history = this.rateHistory.get(key) || [];

    // Generate mock historical data if not exists
    if (history.length === 0) {
      history = this.generateMockHistory(currency, hours);
      this.rateHistory.set(key, history);
    }

    return history.slice(0, hours);
  }

  private generateMockHistory(
    currency: "BTC" | "USDT",
    hours: number,
  ): ExchangeRate[] {
    const baseRate = currency === "BTC" ? 5500000 : 140;
    const history: ExchangeRate[] = [];

    for (let i = hours; i >= 0; i--) {
      const timestamp = new Date(Date.now() - i * 60 * 60 * 1000);
      const rate = baseRate + (Math.random() - 0.5) * baseRate * 0.1;

      history.push({
        fromCurrency: currency,
        toCurrency: "KES",
        rate,
        timestamp: timestamp.toISOString(),
        source: "yellowcard",
        spread: Math.random() * 0.02,
        volume24h: Math.random() * 1000000,
      });
    }

    return history;
  }

  private initializeHistoricalData(): void {
    // Initialize with some mock data
    this.generateMockHistory("BTC", 24);
    this.generateMockHistory("USDT", 24);
  }

  private startMarketAnalysis(): void {
    // Simulate continuous market analysis
    setInterval(async () => {
      await this.monitorRates();
    }, 60000); // Every minute
  }

  // Additional helper methods
  private calculateSentimentScore(): number {
    return 40 + Math.random() * 20; // Random sentiment between 40-60
  }

  private calculateMarketVolatility(): number {
    return Math.random() * 100;
  }

  private analyzeVolume(): "low" | "medium" | "high" {
    const rand = Math.random();
    return rand > 0.66 ? "high" : rand > 0.33 ? "medium" : "low";
  }

  private calculateLiquidity(): number {
    return 60 + Math.random() * 30; // Random liquidity between 60-90
  }

  private detectMarketEvents(): string[] {
    const events = [
      "High trading volume detected",
      "Whale transaction alert",
      "Exchange rate arbitrage opportunity",
      "Market sentiment shift detected",
    ];

    return Math.random() > 0.7
      ? [events[Math.floor(Math.random() * events.length)]]
      : [];
  }

  private calculateRiskAdjustment(conditions: MarketConditions): number {
    let adjustment = 1.0;

    if (conditions.riskLevel === "high") adjustment *= 0.9;
    else if (conditions.riskLevel === "medium") adjustment *= 0.95;

    if (conditions.volatilityIndex > 80) adjustment *= 0.85;

    return adjustment;
  }

  private calculateRiskFactor(
    conditions: MarketConditions,
    volatility: string,
  ): number {
    let risk = 20; // Base risk

    if (conditions.riskLevel === "high") risk += 30;
    else if (conditions.riskLevel === "medium") risk += 15;

    if (volatility === "high") risk += 25;
    else if (volatility === "medium") risk += 10;

    return Math.min(100, risk);
  }

  private generateAlternativeStrategy(
    prediction: RatePrediction,
    conditions: MarketConditions,
  ): string {
    if (conditions.riskLevel === "high") {
      return "Consider splitting conversion into smaller amounts over time";
    }

    if (prediction.volatility === "high") {
      return "Monitor for volatility decrease before converting";
    }

    return "Standard conversion timing appears optimal";
  }
}

export const aiExchangeOptimization = new AIExchangeOptimizationService();
