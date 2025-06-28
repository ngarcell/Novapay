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
} from "./routes/payments";

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

  // Webhook endpoints
  app.post("/api/webhooks/mpesa", mpesaWebhook);
  app.post("/api/webhooks/yellowcard", yellowcardWebhook);
  app.post("/api/webhooks/nownodes", nownodesWebhook);

  return app;
}
