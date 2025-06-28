import { RequestHandler } from "express";
import { paymentOrchestrator } from "../services/payment-orchestrator";
import { nownodesService } from "../services/nownodes";
import { yellowcardService } from "../services/yellowcard";
import { mpesaService } from "../services/mpesa";
import { lightningService } from "../services/lightning";

// Create new invoice
export const createInvoice: RequestHandler = async (req, res) => {
  try {
    const {
      merchant_id,
      amount,
      currency = "USD",
      description,
      customer_email,
      customer_name,
      store_id,
      settlement_preference = "mpesa",
      expires_in_hours = 24,
    } = req.body;

    // Validate required fields
    if (!merchant_id || !amount || !description) {
      return res.status(400).json({
        error: "Missing required fields: merchant_id, amount, description",
      });
    }

    const invoice = await paymentOrchestrator.createInvoice({
      merchant_id,
      amount,
      currency,
      description,
      customer_email,
      customer_name,
      store_id,
      settlement_preference,
      expires_in_hours,
    });

    res.json({
      success: true,
      invoice,
      payment_url: `${req.protocol}://${req.get("host")}/pay/${invoice.id}`,
    });
  } catch (error) {
    console.error("Error creating invoice:", error);
    res.status(500).json({
      error: "Failed to create invoice",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get invoice details
export const getInvoice: RequestHandler = async (req, res) => {
  try {
    const { invoiceId } = req.params;

    const result = await paymentOrchestrator.getTransactionStatus(invoiceId);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error getting invoice:", error);
    res.status(404).json({
      error: "Invoice not found",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Generate payment address for invoice
export const generatePaymentAddress: RequestHandler = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const { crypto_currency } = req.body;

    if (
      !crypto_currency ||
      !["BTC", "USDT", "LIGHTNING"].includes(crypto_currency)
    ) {
      return res.status(400).json({
        error: "Invalid crypto_currency. Must be BTC, USDT, or LIGHTNING",
      });
    }

    const paymentAddress = await paymentOrchestrator.generatePaymentAddress(
      invoiceId,
      crypto_currency as "BTC" | "USDT" | "LIGHTNING",
    );

    res.json({
      success: true,
      payment_address: paymentAddress,
      crypto_currency,
      is_lightning: crypto_currency === "LIGHTNING",
    });
  } catch (error) {
    console.error("Error generating payment address:", error);
    res.status(500).json({
      error: "Failed to generate payment address",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Monitor payment for invoice
export const monitorPayment: RequestHandler = async (req, res) => {
  try {
    const { invoiceId } = req.params;

    await paymentOrchestrator.monitorPayment(invoiceId);

    res.json({
      success: true,
      message: "Payment monitoring initiated",
    });
  } catch (error) {
    console.error("Error monitoring payment:", error);
    res.status(500).json({
      error: "Failed to monitor payment",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get crypto prices
export const getCryptoPrices: RequestHandler = async (req, res) => {
  try {
    const [btcPrice, usdtPrice] = await Promise.all([
      nownodesService.getBitcoinPrice(),
      nownodesService.getUSDTPrice(),
    ]);

    res.json({
      success: true,
      prices: {
        BTC: btcPrice,
        USDT: usdtPrice,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error getting crypto prices:", error);
    res.status(500).json({
      error: "Failed to get crypto prices",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get exchange rates
export const getExchangeRates: RequestHandler = async (req, res) => {
  try {
    const rates = await yellowcardService.getExchangeRates();

    res.json({
      success: true,
      rates,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error getting exchange rates:", error);
    res.status(500).json({
      error: "Failed to get exchange rates",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Calculate KES amount
export const calculateKESAmount: RequestHandler = async (req, res) => {
  try {
    const { crypto_amount, crypto_currency } = req.body;

    if (!crypto_amount || !crypto_currency) {
      return res.status(400).json({
        error: "Missing required fields: crypto_amount, crypto_currency",
      });
    }

    if (!["BTC", "USDT"].includes(crypto_currency)) {
      return res.status(400).json({
        error: "Invalid crypto_currency. Must be BTC or USDT",
      });
    }

    const calculation = await yellowcardService.calculateKESAmount(
      crypto_amount,
      crypto_currency,
    );

    res.json({
      success: true,
      calculation,
    });
  } catch (error) {
    console.error("Error calculating KES amount:", error);
    res.status(500).json({
      error: "Failed to calculate KES amount",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get merchant analytics
export const getMerchantAnalytics: RequestHandler = async (req, res) => {
  try {
    const { merchantId } = req.params;
    const { period = "7d" } = req.query;

    if (!["24h", "7d", "30d", "90d"].includes(period as string)) {
      return res.status(400).json({
        error: "Invalid period. Must be 24h, 7d, 30d, or 90d",
      });
    }

    const analytics = await paymentOrchestrator.getMerchantAnalytics(
      merchantId,
      period as "24h" | "7d" | "30d" | "90d",
    );

    res.json({
      success: true,
      analytics,
      period,
    });
  } catch (error) {
    console.error("Error getting merchant analytics:", error);
    res.status(500).json({
      error: "Failed to get merchant analytics",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Validate Mpesa phone number
export const validateMpesaNumber: RequestHandler = async (req, res) => {
  try {
    const { phone_number } = req.body;

    if (!phone_number) {
      return res.status(400).json({
        error: "Missing required field: phone_number",
      });
    }

    const isValid = mpesaService.validatePhoneNumber(phone_number);
    const formatted = isValid
      ? mpesaService.formatPhoneNumber(phone_number)
      : null;

    res.json({
      success: true,
      is_valid: isValid,
      formatted_number: formatted,
    });
  } catch (error) {
    console.error("Error validating Mpesa number:", error);
    res.status(500).json({
      error: "Failed to validate Mpesa number",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Webhook endpoints for external services
export const mpesaWebhook: RequestHandler = async (req, res) => {
  try {
    console.log("Mpesa webhook received:", req.body);

    // Process Mpesa callback
    const { ResultCode, ResultDesc, CallBackMetadata } =
      req.body.Body.stkCallback;

    if (ResultCode === 0) {
      // Payment successful
      console.log("Mpesa payment successful:", ResultDesc);
      // Update transaction status in database
    } else {
      // Payment failed
      console.log("Mpesa payment failed:", ResultDesc);
      // Update transaction status in database
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error processing Mpesa webhook:", error);
    res.status(500).json({ error: "Failed to process webhook" });
  }
};

export const yellowcardWebhook: RequestHandler = async (req, res) => {
  try {
    console.log("Yellowcard webhook received:", req.body);

    // Process Yellowcard callback for conversion status updates
    const { conversion_id, status, kes_amount } = req.body;

    // Update conversion status in database
    console.log(`Conversion ${conversion_id} status: ${status}`);

    res.json({ success: true });
  } catch (error) {
    console.error("Error processing Yellowcard webhook:", error);
    res.status(500).json({ error: "Failed to process webhook" });
  }
};

export const nownodesWebhook: RequestHandler = async (req, res) => {
  try {
    console.log("Nownodes webhook received:", req.body);

    // Process blockchain transaction notifications
    const { transaction_hash, confirmations, address, amount } = req.body;

    if (confirmations >= 1) {
      // Transaction confirmed, process payment
      console.log(`Transaction confirmed: ${transaction_hash}`);
      // Find invoice by address and process payment
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error processing Nownodes webhook:", error);
    res.status(500).json({ error: "Failed to process webhook" });
  }
};

// Create Lightning invoice
export const createLightningInvoice: RequestHandler = async (req, res) => {
  try {
    const { amount, description, expiry } = req.body;

    if (!amount || !description) {
      return res.status(400).json({
        error: "Missing required fields: amount, description",
      });
    }

    const invoice = await lightningService.createInvoice({
      amount_msat: lightningService.constructor.satToMsat(
        Math.floor(amount * 100000000),
      ),
      description,
      expiry: expiry || 3600,
    });

    res.json({
      success: true,
      invoice,
    });
  } catch (error) {
    console.error("Error creating Lightning invoice:", error);
    res.status(500).json({
      error: "Failed to create Lightning invoice",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get Lightning invoice status
export const getLightningInvoiceStatus: RequestHandler = async (req, res) => {
  try {
    const { payment_hash } = req.params;

    const invoice = await lightningService.getInvoiceStatus(payment_hash);

    if (!invoice) {
      return res.status(404).json({
        error: "Lightning invoice not found",
      });
    }

    res.json({
      success: true,
      invoice,
    });
  } catch (error) {
    console.error("Error getting Lightning invoice status:", error);
    res.status(500).json({
      error: "Failed to get Lightning invoice status",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Send Lightning payment
export const sendLightningPayment: RequestHandler = async (req, res) => {
  try {
    const { payment_request } = req.body;

    if (!payment_request) {
      return res.status(400).json({
        error: "Missing required field: payment_request",
      });
    }

    const payment = await lightningService.sendPayment(payment_request);

    res.json({
      success: true,
      payment,
    });
  } catch (error) {
    console.error("Error sending Lightning payment:", error);
    res.status(500).json({
      error: "Failed to send Lightning payment",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get Lightning node info
export const getLightningNodeInfo: RequestHandler = async (req, res) => {
  try {
    const nodeInfo = await lightningService.getNodeInfo();

    res.json({
      success: true,
      node_info: nodeInfo,
    });
  } catch (error) {
    console.error("Error getting Lightning node info:", error);
    res.status(500).json({
      error: "Failed to get Lightning node info",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get Lightning network stats
export const getLightningNetworkStats: RequestHandler = async (req, res) => {
  try {
    const stats = await lightningService.getNetworkStats();

    res.json({
      success: true,
      network_stats: stats,
    });
  } catch (error) {
    console.error("Error getting Lightning network stats:", error);
    res.status(500).json({
      error: "Failed to get Lightning network stats",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
