import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import {
  createInvoice,
  getInvoice,
  generatePaymentAddress,
  monitorPayment,
  getCryptoPrices,
  getExchangeRates,
  calculateKESAmount,
  getMerchantAnalytics,
  validateMpesaNumber,
  mpesaWebhook,
  yellowcardWebhook,
  nownodesWebhook,
  createLightningInvoice,
  getLightningInvoiceStatus,
  sendLightningPayment,
  getLightningNodeInfo,
  getLightningNetworkStats,
} from "./routes/payments";
import {
  analyzeFraudRisk,
  getFraudInsights,
  monitorDoubleSpend,
  getDoubleSpendStatus,
  getDoubleSpendDashboard,
  optimizeExchangeRate,
  predictExchangeRates,
  scheduleOptimalConversion,
  getExchangeMonitoring,
  getAIDashboardData,
} from "./routes/ai-services";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    res.json({ message: "Hello from Express server v2!" });
  });

  app.get("/api/demo", handleDemo);

  // Payment API routes
  app.post("/api/invoices", createInvoice);
  app.get("/api/invoices/:invoiceId", getInvoice);
  app.post("/api/invoices/:invoiceId/address", generatePaymentAddress);
  app.post("/api/invoices/:invoiceId/monitor", monitorPayment);

  // Crypto and exchange rate APIs
  app.get("/api/crypto/prices", getCryptoPrices);
  app.get("/api/exchange/rates", getExchangeRates);
  app.post("/api/exchange/calculate", calculateKESAmount);

  // Merchant analytics
  app.get("/api/merchants/:merchantId/analytics", getMerchantAnalytics);

  // Utility APIs
  app.post("/api/mpesa/validate", validateMpesaNumber);

  // AI Services endpoints
  app.post("/api/ai/fraud/analyze", analyzeFraudRisk);
  app.get("/api/ai/fraud/insights/:merchantId", getFraudInsights);
  app.post("/api/ai/double-spend/monitor", monitorDoubleSpend);
  app.get("/api/ai/double-spend/status/:transactionHash", getDoubleSpendStatus);
  app.get("/api/ai/double-spend/dashboard", getDoubleSpendDashboard);
  app.post("/api/ai/exchange/optimize", optimizeExchangeRate);
  app.get("/api/ai/exchange/predict/:currency", predictExchangeRates);
  app.post("/api/ai/exchange/schedule", scheduleOptimalConversion);
  app.get("/api/ai/exchange/monitoring", getExchangeMonitoring);
  app.get("/api/ai/dashboard/:merchantId", getAIDashboardData);

  // Lightning Network endpoints
  app.post("/api/lightning/invoices", createLightningInvoice);
  app.get("/api/lightning/invoices/:payment_hash", getLightningInvoiceStatus);
  app.post("/api/lightning/payments", sendLightningPayment);
  app.get("/api/lightning/node-info", getLightningNodeInfo);
  app.get("/api/lightning/network-stats", getLightningNetworkStats);

  // Webhook endpoints
  app.post("/api/webhooks/mpesa", mpesaWebhook);
  app.post("/api/webhooks/yellowcard", yellowcardWebhook);
  app.post("/api/webhooks/nownodes", nownodesWebhook);

  return app;
}
