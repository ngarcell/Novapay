import { RequestHandler } from "express";
import { aiFraudDetection } from "../services/ai-fraud-detection";
import { aiDoubleSpendDetection } from "../services/ai-double-spend-detection";
import { aiExchangeOptimization } from "../services/ai-exchange-optimization";

// AI Fraud Detection endpoints
export const analyzeFraudRisk: RequestHandler = async (req, res) => {
  try {
    const {
      amount,
      currency,
      merchantId,
      customerEmail,
      ipAddress,
      userAgent,
      paymentMethod,
      location,
    } = req.body;

    if (!amount || !currency || !merchantId || !paymentMethod) {
      return res.status(400).json({
        error:
          "Missing required fields: amount, currency, merchantId, paymentMethod",
      });
    }

    const riskAssessment = await aiFraudDetection.analyzeTransaction({
      amount,
      currency,
      merchantId,
      customerEmail,
      ipAddress,
      userAgent,
      paymentMethod,
      timestamp: new Date().toISOString(),
      location,
    });

    res.json({
      success: true,
      riskAssessment,
    });
  } catch (error) {
    console.error("Error analyzing fraud risk:", error);
    res.status(500).json({
      error: "Failed to analyze fraud risk",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getFraudInsights: RequestHandler = async (req, res) => {
  try {
    const { merchantId } = req.params;

    const insights = await aiFraudDetection.getRealtimeRiskInsights(merchantId);

    res.json({
      success: true,
      insights,
    });
  } catch (error) {
    console.error("Error getting fraud insights:", error);
    res.status(500).json({
      error: "Failed to get fraud insights",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// AI Double Spend Detection endpoints
export const monitorDoubleSpend: RequestHandler = async (req, res) => {
  try {
    const {
      transactionHash,
      invoiceId,
      expectedAmount,
      receivingAddress,
      currency,
    } = req.body;

    if (
      !transactionHash ||
      !invoiceId ||
      !expectedAmount ||
      !receivingAddress ||
      !currency
    ) {
      return res.status(400).json({
        error:
          "Missing required fields: transactionHash, invoiceId, expectedAmount, receivingAddress, currency",
      });
    }

    await aiDoubleSpendDetection.startMonitoring(
      transactionHash,
      invoiceId,
      expectedAmount,
      receivingAddress,
      currency,
    );

    res.json({
      success: true,
      message: "Double spend monitoring started",
    });
  } catch (error) {
    console.error("Error starting double spend monitoring:", error);
    res.status(500).json({
      error: "Failed to start double spend monitoring",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getDoubleSpendStatus: RequestHandler = async (req, res) => {
  try {
    const { transactionHash } = req.params;

    const status =
      await aiDoubleSpendDetection.getTransactionStatus(transactionHash);

    res.json({
      success: true,
      status,
    });
  } catch (error) {
    console.error("Error getting double spend status:", error);
    res.status(500).json({
      error: "Failed to get double spend status",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getDoubleSpendDashboard: RequestHandler = async (req, res) => {
  try {
    const dashboard = await aiDoubleSpendDetection.getMonitoringDashboard();

    res.json({
      success: true,
      dashboard,
    });
  } catch (error) {
    console.error("Error getting double spend dashboard:", error);
    res.status(500).json({
      error: "Failed to get monitoring dashboard",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// AI Exchange Rate Optimization endpoints
export const optimizeExchangeRate: RequestHandler = async (req, res) => {
  try {
    const { amount, currency, maxWaitTime } = req.body;

    if (!amount || !currency) {
      return res.status(400).json({
        error: "Missing required fields: amount, currency",
      });
    }

    if (!["BTC", "USDT"].includes(currency)) {
      return res.status(400).json({
        error: "Invalid currency. Must be BTC or USDT",
      });
    }

    const optimization = await aiExchangeOptimization.optimizeConversion(
      amount,
      currency,
      maxWaitTime || 30,
    );

    res.json({
      success: true,
      optimization,
    });
  } catch (error) {
    console.error("Error optimizing exchange rate:", error);
    res.status(500).json({
      error: "Failed to optimize exchange rate",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const predictExchangeRates: RequestHandler = async (req, res) => {
  try {
    const { currency } = req.params;

    if (!["BTC", "USDT"].includes(currency)) {
      return res.status(400).json({
        error: "Invalid currency. Must be BTC or USDT",
      });
    }

    const prediction = await aiExchangeOptimization.predictRates(
      currency as "BTC" | "USDT",
    );

    res.json({
      success: true,
      prediction,
    });
  } catch (error) {
    console.error("Error predicting exchange rates:", error);
    res.status(500).json({
      error: "Failed to predict exchange rates",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const scheduleOptimalConversion: RequestHandler = async (req, res) => {
  try {
    const { amount, currency, invoiceId, maxDelay } = req.body;

    if (!amount || !currency || !invoiceId) {
      return res.status(400).json({
        error: "Missing required fields: amount, currency, invoiceId",
      });
    }

    const schedule = await aiExchangeOptimization.scheduleOptimalConversion(
      amount,
      currency,
      invoiceId,
      maxDelay || 60,
    );

    res.json({
      success: true,
      schedule,
    });
  } catch (error) {
    console.error("Error scheduling optimal conversion:", error);
    res.status(500).json({
      error: "Failed to schedule optimal conversion",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getExchangeMonitoring: RequestHandler = async (req, res) => {
  try {
    const monitoring = await aiExchangeOptimization.monitorRates();

    res.json({
      success: true,
      monitoring,
    });
  } catch (error) {
    console.error("Error getting exchange monitoring:", error);
    res.status(500).json({
      error: "Failed to get exchange monitoring",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Combined AI dashboard data
export const getAIDashboardData: RequestHandler = async (req, res) => {
  try {
    const { merchantId } = req.params;

    // Get data from all AI services
    const [fraudInsights, doubleSpendDashboard, exchangeMonitoring] =
      await Promise.all([
        aiFraudDetection.getRealtimeRiskInsights(merchantId),
        aiDoubleSpendDetection.getMonitoringDashboard(),
        aiExchangeOptimization.monitorRates(),
      ]);

    // Get recent predictions for both currencies
    const [btcPrediction, usdtPrediction] = await Promise.all([
      aiExchangeOptimization.predictRates("BTC"),
      aiExchangeOptimization.predictRates("USDT"),
    ]);

    res.json({
      success: true,
      aiDashboard: {
        fraudDetection: fraudInsights,
        doubleSpendMonitoring: doubleSpendDashboard,
        exchangeOptimization: exchangeMonitoring,
        ratePredictions: {
          BTC: btcPrediction,
          USDT: usdtPrediction,
        },
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error getting AI dashboard data:", error);
    res.status(500).json({
      error: "Failed to get AI dashboard data",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
