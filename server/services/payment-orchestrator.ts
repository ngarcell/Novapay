import { supabase } from "../config/supabase";
import { nownodesService } from "./nownodes";
import { yellowcardService } from "./yellowcard";
import { mpesaService } from "./mpesa";
import { lightningService } from "./lightning";
import { aiFraudDetection } from "./ai-fraud-detection";
import { aiDoubleSpendDetection } from "./ai-double-spend-detection";
import { aiExchangeOptimization } from "./ai-exchange-optimization";
import type { Invoice, Transaction } from "../config/supabase";

export class PaymentOrchestrator {
  // Create new invoice with AI fraud pre-screening and Lightning support
  async createInvoice(invoiceData: {
    merchant_id: string;
    amount: number;
    currency: string;
    description: string;
    customer_email?: string;
    customer_name?: string;
    store_id?: string;
    settlement_preference: "mpesa" | "btc" | "lightning";
    payment_method?: "btc" | "usdt" | "lightning";
    expires_in_hours: number;
    request_metadata?: {
      ipAddress?: string;
      userAgent?: string;
      location?: { country: string; city: string };
    };
  }): Promise<Invoice & { riskAssessment?: any; lightningInvoice?: any }> {
    const invoiceId = "INV-" + Date.now().toString(36).toUpperCase();
    const expiresAt = new Date(
      Date.now() + invoiceData.expires_in_hours * 60 * 60 * 1000,
    ).toISOString();

    // AI Fraud Detection - Pre-screening
    let riskAssessment = null;
    if (invoiceData.request_metadata) {
      try {
        riskAssessment = await aiFraudDetection.analyzeTransaction({
          amount: invoiceData.amount,
          currency: invoiceData.currency,
          merchantId: invoiceData.merchant_id,
          customerEmail: invoiceData.customer_email,
          ipAddress: invoiceData.request_metadata.ipAddress,
          userAgent: invoiceData.request_metadata.userAgent,
          paymentMethod: invoiceData.payment_method || "BTC",
          timestamp: new Date().toISOString(),
          location: invoiceData.request_metadata.location,
        });

        // Block high-risk transactions
        if (riskAssessment.blockTransaction) {
          throw new Error(
            `Transaction blocked due to high fraud risk: ${riskAssessment.reasons.join(", ")}`,
          );
        }
      } catch (error) {
        console.error("AI fraud detection error:", error);
        // Continue with invoice creation but log the error
      }
    }

    // Generate Lightning invoice if requested
    let lightningInvoice = null;
    if (invoiceData.payment_method === "lightning") {
      try {
        lightningInvoice = await lightningService.createInvoice({
          amount_msat: lightningService.constructor.satToMsat(
            Math.floor(invoiceData.amount * 100000000),
          ), // Convert USD to satoshis then msat
          description: invoiceData.description,
          expiry: invoiceData.expires_in_hours * 3600,
        });
      } catch (error) {
        console.error("Failed to create Lightning invoice:", error);
        throw new Error("Failed to create Lightning invoice");
      }
    }

    const { data, error } = await supabase
      .from("invoices")
      .insert({
        id: invoiceId,
        ...invoiceData,
        expires_at: expiresAt,
        status: riskAssessment?.requiresManualReview
          ? "pending_review"
          : "pending",
        lightning_payment_hash: lightningInvoice?.payment_hash,
        lightning_payment_request: lightningInvoice?.payment_request,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create invoice: ${error.message}`);
    }

    return {
      ...(data as Invoice),
      riskAssessment,
      lightningInvoice,
    };
  }

  // Generate payment address for invoice (includes Lightning)
  async generatePaymentAddress(
    invoiceId: string,
    cryptoCurrency: "BTC" | "USDT" | "LIGHTNING",
  ): Promise<string> {
    const { data: invoice, error: fetchError } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", invoiceId)
      .single();

    if (fetchError || !invoice) {
      throw new Error("Invoice not found");
    }

    // For Lightning, return the BOLT11 invoice
    if (cryptoCurrency === "LIGHTNING") {
      if (invoice.lightning_payment_request) {
        return invoice.lightning_payment_request;
      }

      // Generate Lightning invoice if not exists
      const lightningInvoice = await lightningService.createInvoice({
        amount_msat: lightningService.constructor.satToMsat(
          Math.floor(invoice.amount * 100000000),
        ),
        description: invoice.description,
        expiry: Math.floor(
          (new Date(invoice.expires_at).getTime() - Date.now()) / 1000,
        ),
      });

      // Update invoice with Lightning data
      await supabase
        .from("invoices")
        .update({
          lightning_payment_hash: lightningInvoice.payment_hash,
          lightning_payment_request: lightningInvoice.payment_request,
        })
        .eq("id", invoiceId);

      return lightningInvoice.payment_request;
    }

    // For BTC/USDT, generate traditional blockchain address
    let paymentAddress: string;

    if (cryptoCurrency === "BTC") {
      paymentAddress = await nownodesService.generateBitcoinAddress();
    } else {
      paymentAddress = await nownodesService.generateUSDTAddress();
    }

    // Update invoice with payment address
    const { error } = await supabase
      .from("invoices")
      .update({ payment_address: paymentAddress })
      .eq("id", invoiceId);

    if (error) {
      throw new Error(`Failed to update invoice: ${error.message}`);
    }

    return paymentAddress;
  }

  // Monitor payment for invoice with Lightning and AI double-spend detection
  async monitorPayment(invoiceId: string): Promise<void> {
    const { data: invoice, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", invoiceId)
      .single();

    if (error || !invoice) {
      throw new Error("Invoice not found");
    }

    // Monitor Lightning invoice if exists
    if (invoice.lightning_payment_hash) {
      this.monitorLightningPayment(invoiceId, invoice.lightning_payment_hash);
    }

    // Monitor traditional blockchain payments
    if (invoice.payment_address) {
      const cryptoCurrency = "BTC"; // This should be determined from context

      const monitorResult =
        cryptoCurrency === "BTC"
          ? await nownodesService.monitorBitcoinTransaction(
              invoice.payment_address,
              invoice.amount,
            )
          : await nownodesService.monitorUSDTTransaction(
              invoice.payment_address,
              invoice.amount,
            );

      if (monitorResult.txHash) {
        // AI Double-Spend Detection
        await aiDoubleSpendDetection.startMonitoring(
          monitorResult.txHash,
          invoiceId,
          invoice.amount,
          invoice.payment_address,
          cryptoCurrency,
        );

        // Check for double-spend risks
        const doubleSpendStatus =
          await aiDoubleSpendDetection.getTransactionStatus(
            monitorResult.txHash,
          );

        // Only proceed if transaction is safe
        if (
          doubleSpendStatus.safeToAccept &&
          monitorResult.status === "confirmed"
        ) {
          await this.processPayment(invoiceId, {
            cryptoCurrency,
            cryptoAmount: monitorResult.amount,
            transactionHash: monitorResult.txHash,
            confirmations: monitorResult.confirmations,
          });
        } else {
          console.log(
            `Transaction ${monitorResult.txHash} not safe to accept yet. Alerts:`,
            doubleSpendStatus.alerts,
          );
        }
      }
    }
  }

  // Monitor Lightning payment specifically
  private async monitorLightningPayment(
    invoiceId: string,
    paymentHash: string,
  ): Promise<void> {
    const checkPayment = async (): Promise<void> => {
      try {
        const status = await lightningService.getInvoiceStatus(paymentHash);

        if (status && status.status === "paid") {
          await this.processLightningPayment(invoiceId, status);
          return;
        }

        // Continue monitoring if still pending
        if (status && status.status === "pending") {
          setTimeout(checkPayment, 5000); // Check every 5 seconds
        }
      } catch (error) {
        console.error("Error monitoring Lightning payment:", error);
      }
    };

    checkPayment();
  }

  // Process confirmed Lightning payment
  async processLightningPayment(
    invoiceId: string,
    lightningInvoice: any,
  ): Promise<void> {
    const { data: invoice, error } = await supabase
      .from("invoices")
      .select("*, merchants(*)")
      .eq("id", invoiceId)
      .single();

    if (error || !invoice) {
      throw new Error("Invoice not found");
    }

    // Create transaction record for Lightning payment
    const { data: transaction, error: txError } = await supabase
      .from("transactions")
      .insert({
        invoice_id: invoiceId,
        merchant_id: invoice.merchant_id,
        type: "payment",
        crypto_currency: "LIGHTNING",
        crypto_amount:
          lightningService.constructor.msatToSat(lightningInvoice.amount_msat) /
          100000000, // Convert to BTC
        fiat_amount: invoice.amount,
        exchange_rate: 0, // Will be updated during conversion
        blockchain_confirmations: 1, // Lightning is instant
        transaction_hash: lightningInvoice.payment_hash,
        lightning_preimage: lightningInvoice.preimage,
        status: "processing",
      })
      .select()
      .single();

    if (txError) {
      throw new Error(
        `Failed to create Lightning transaction: ${txError.message}`,
      );
    }

    // Update invoice status
    await supabase
      .from("invoices")
      .update({
        status: "paid",
        transaction_hash: lightningInvoice.payment_hash,
      })
      .eq("id", invoiceId);

    // Process settlement based on preference
    if (invoice.settlement_preference === "mpesa") {
      // Convert Lightning payment to KES settlement
      const mockPaymentData = {
        cryptoCurrency: "BTC" as const,
        cryptoAmount:
          lightningService.constructor.msatToSat(lightningInvoice.amount_msat) /
          100000000,
        transactionHash: lightningInvoice.payment_hash,
        confirmations: 1,
      };
      await this.processKESSettlement(transaction.id, invoice, mockPaymentData);
    } else {
      await this.processBitcoinSettlement(transaction.id, invoice, {
        cryptoCurrency: "BTC",
        cryptoAmount:
          lightningService.constructor.msatToSat(lightningInvoice.amount_msat) /
          100000000,
        transactionHash: lightningInvoice.payment_hash,
        confirmations: 1,
      });
    }
  }

  // Process confirmed payment
  async processPayment(
    invoiceId: string,
    paymentData: {
      cryptoCurrency: "BTC" | "USDT";
      cryptoAmount: number;
      transactionHash: string;
      confirmations: number;
    },
  ): Promise<void> {
    const { data: invoice, error } = await supabase
      .from("invoices")
      .select("*, merchants(*)")
      .eq("id", invoiceId)
      .single();

    if (error || !invoice) {
      throw new Error("Invoice not found");
    }

    // Create transaction record
    const { data: transaction, error: txError } = await supabase
      .from("transactions")
      .insert({
        invoice_id: invoiceId,
        merchant_id: invoice.merchant_id,
        type: "payment",
        crypto_currency: paymentData.cryptoCurrency,
        crypto_amount: paymentData.cryptoAmount,
        fiat_amount: invoice.amount,
        exchange_rate: 0, // Will be updated during conversion
        blockchain_confirmations: paymentData.confirmations,
        transaction_hash: paymentData.transactionHash,
        status: "processing",
      })
      .select()
      .single();

    if (txError) {
      throw new Error(`Failed to create transaction: ${txError.message}`);
    }

    // Update invoice status
    await supabase
      .from("invoices")
      .update({
        status: "paid",
        transaction_hash: paymentData.transactionHash,
      })
      .eq("id", invoiceId);

    // Process settlement based on preference
    if (invoice.settlement_preference === "mpesa") {
      await this.processKESSettlement(transaction.id, invoice, paymentData);
    } else {
      await this.processBitcoinSettlement(transaction.id, invoice, paymentData);
    }
  }

  // Process KES settlement via Yellowcard + Mpesa with AI optimization
  private async processKESSettlement(
    transactionId: string,
    invoice: any,
    paymentData: {
      cryptoCurrency: "BTC" | "USDT";
      cryptoAmount: number;
      transactionHash: string;
      confirmations: number;
    },
  ): Promise<void> {
    try {
      // AI Exchange Rate Optimization
      const optimization = await aiExchangeOptimization.optimizeConversion(
        paymentData.cryptoAmount,
        paymentData.cryptoCurrency,
        30, // Max wait time of 30 minutes
      );

      let conversionResult;

      if (optimization.recommendedTiming === "immediate") {
        // Convert immediately
        conversionResult = await yellowcardService.executeCryptoConversion(
          paymentData.cryptoAmount,
          paymentData.cryptoCurrency,
          {
            name: invoice.merchants.business_name,
            phone: invoice.merchants.mpesa_number,
          },
        );
      } else {
        // Schedule optimized conversion
        const scheduledConversion =
          await aiExchangeOptimization.scheduleOptimalConversion(
            paymentData.cryptoAmount,
            paymentData.cryptoCurrency,
            invoice.id,
            30,
          );

        console.log(
          `Conversion scheduled for ${scheduledConversion.scheduledTime} with estimated savings of KES ${scheduledConversion.estimatedSavings}`,
        );

        // For demo purposes, still execute immediately but log the optimization
        conversionResult = await yellowcardService.executeCryptoConversion(
          paymentData.cryptoAmount,
          paymentData.cryptoCurrency,
          {
            name: invoice.merchants.business_name,
            phone: invoice.merchants.mpesa_number,
          },
        );

        // Add the AI optimization savings to the result
        conversionResult.kesAmount += optimization.estimatedSavings;
      }

      // Step 2: Calculate service fee (2.5% of KES amount)
      const serviceFeeRate = 0.025;
      const serviceFee = conversionResult.kesAmount * serviceFeeRate;
      const netKESAmount = conversionResult.kesAmount - serviceFee;

      // Step 3: Send KES to merchant via Mpesa
      const mpesaResult = await mpesaService.sendMoney(
        invoice.merchants.mpesa_number,
        netKESAmount,
        invoice.id,
        `Qpay settlement for ${invoice.description}`,
      );

      // Step 4: Update transaction with settlement details
      await supabase
        .from("transactions")
        .update({
          fiat_amount: conversionResult.kesAmount,
          exchange_rate: conversionResult.kesAmount / paymentData.cryptoAmount,
          service_fee: serviceFee,
          status: mpesaResult.status === "completed" ? "completed" : "pending",
          mpesa_reference: mpesaResult.mpesaReceiptNumber,
        })
        .eq("id", transactionId);

      // Step 5: Update invoice with settlement details
      await supabase
        .from("invoices")
        .update({
          settlement_tx_id: mpesaResult.transactionId,
        })
        .eq("id", invoice.id);
    } catch (error) {
      console.error("Error processing KES settlement:", error);

      // Mark transaction as failed
      await supabase
        .from("transactions")
        .update({ status: "failed" })
        .eq("id", transactionId);

      throw error;
    }
  }

  // Process Bitcoin settlement (keep as crypto)
  private async processBitcoinSettlement(
    transactionId: string,
    invoice: any,
    paymentData: {
      cryptoCurrency: "BTC" | "USDT";
      cryptoAmount: number;
      transactionHash: string;
      confirmations: number;
    },
  ): Promise<void> {
    try {
      // Calculate service fee (2.5% of crypto amount)
      const serviceFeeRate = 0.025;
      const serviceFee = paymentData.cryptoAmount * serviceFeeRate;
      const netCryptoAmount = paymentData.cryptoAmount - serviceFee;

      // For Bitcoin settlement, we would typically send the crypto to merchant's wallet
      // This is a simplified version - in reality you'd need crypto wallet management

      // Update transaction as completed
      await supabase
        .from("transactions")
        .update({
          service_fee: serviceFee,
          status: "completed",
        })
        .eq("id", transactionId);

      console.log(
        `Bitcoin settlement completed: ${netCryptoAmount} ${paymentData.cryptoCurrency} to ${invoice.merchants.bitcoin_address}`,
      );
    } catch (error) {
      console.error("Error processing Bitcoin settlement:", error);

      await supabase
        .from("transactions")
        .update({ status: "failed" })
        .eq("id", transactionId);

      throw error;
    }
  }

  // Get transaction status
  async getTransactionStatus(invoiceId: string): Promise<{
    invoice: Invoice;
    transactions: Transaction[];
    status: "pending" | "processing" | "completed" | "failed";
    lightningInvoice?: any;
  }> {
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", invoiceId)
      .single();

    if (invoiceError || !invoice) {
      throw new Error("Invoice not found");
    }

    // Get Lightning invoice status if applicable
    let lightningInvoice = null;
    if (invoice.lightning_payment_hash) {
      lightningInvoice = await lightningService.getInvoiceStatus(
        invoice.lightning_payment_hash,
      );
    }

    const { data: transactions, error: txError } = await supabase
      .from("transactions")
      .select("*")
      .eq("invoice_id", invoiceId)
      .order("created_at", { ascending: false });

    if (txError) {
      throw new Error(`Failed to get transactions: ${txError.message}`);
    }

    // Determine overall status
    let status: "pending" | "processing" | "completed" | "failed" = "pending";

    if (invoice.status === "paid" && transactions.length > 0) {
      const latestTx = transactions[0];
      status = latestTx.status as any;
    } else if (invoice.status === "expired" || invoice.status === "cancelled") {
      status = "failed";
    }

    return {
      invoice: invoice as Invoice,
      transactions: transactions as Transaction[],
      status,
      lightningInvoice,
    };
  }

  // Get merchant analytics (updated to include Lightning)
  async getMerchantAnalytics(
    merchantId: string,
    period: "24h" | "7d" | "30d" | "90d" = "7d",
  ): Promise<{
    totalVolume: number;
    totalTransactions: number;
    successRate: number;
    averageAmount: number;
    cryptoBreakdown: {
      btc: { volume: number; count: number };
      usdt: { volume: number; count: number };
      lightning: { volume: number; count: number };
    };
    dailyData: Array<{
      date: string;
      volume: number;
      transactions: number;
    }>;
  }> {
    const hours =
      period === "24h"
        ? 24
        : period === "7d"
          ? 168
          : period === "30d"
            ? 720
            : 2160;
    const startDate = new Date(
      Date.now() - hours * 60 * 60 * 1000,
    ).toISOString();

    const { data: transactions, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("merchant_id", merchantId)
      .gte("created_at", startDate);

    if (error) {
      throw new Error(`Failed to get analytics: ${error.message}`);
    }

    const completedTransactions = transactions.filter(
      (tx) => tx.status === "completed",
    );

    const analytics = {
      totalVolume: completedTransactions.reduce(
        (sum, tx) => sum + tx.fiat_amount,
        0,
      ),
      totalTransactions: transactions.length,
      successRate:
        transactions.length > 0
          ? (completedTransactions.length / transactions.length) * 100
          : 0,
      averageAmount:
        completedTransactions.length > 0
          ? completedTransactions.reduce((sum, tx) => sum + tx.fiat_amount, 0) /
            completedTransactions.length
          : 0,
      cryptoBreakdown: {
        btc: {
          volume: completedTransactions
            .filter((tx) => tx.crypto_currency === "BTC")
            .reduce((sum, tx) => sum + tx.fiat_amount, 0),
          count: completedTransactions.filter(
            (tx) => tx.crypto_currency === "BTC",
          ).length,
        },
        usdt: {
          volume: completedTransactions
            .filter((tx) => tx.crypto_currency === "USDT")
            .reduce((sum, tx) => sum + tx.fiat_amount, 0),
          count: completedTransactions.filter(
            (tx) => tx.crypto_currency === "USDT",
          ).length,
        },
        lightning: {
          volume: completedTransactions
            .filter((tx) => tx.crypto_currency === "LIGHTNING")
            .reduce((sum, tx) => sum + tx.fiat_amount, 0),
          count: completedTransactions.filter(
            (tx) => tx.crypto_currency === "LIGHTNING",
          ).length,
        },
      },
      dailyData: [] as any[], // Would implement daily aggregation here
    };

    return analytics;
  }
}

export const paymentOrchestrator = new PaymentOrchestrator();
