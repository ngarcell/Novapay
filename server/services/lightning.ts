import * as bolt11 from "bolt11";
import crypto from "crypto";

interface LightningInvoiceRequest {
  amount_msat: number;
  description: string;
  expiry?: number;
  payment_hash?: string;
  preimage?: string;
}

interface LightningInvoice {
  payment_request: string;
  payment_hash: string;
  preimage: string;
  amount_msat: number;
  expiry_time: number;
  description: string;
  created_at: string;
  expires_at: string;
  status: "pending" | "paid" | "expired";
}

interface LightningPayment {
  payment_hash: string;
  payment_preimage?: string;
  status: "pending" | "succeeded" | "failed";
  amount_msat: number;
  fee_msat?: number;
  created_at: string;
  settled_at?: string;
}

class LightningService {
  private readonly nodeUrl: string;
  private readonly apiKey: string;
  private readonly invoiceStore: Map<string, LightningInvoice> = new Map();
  private readonly paymentStore: Map<string, LightningPayment> = new Map();

  constructor() {
    this.nodeUrl =
      process.env.LIGHTNING_NODE_URL || "https://demo-lightning-node.qpay.com";
    this.apiKey = process.env.LIGHTNING_API_KEY || "demo-api-key";
  }

  /**
   * Generate a new BOLT11 Lightning invoice
   */
  async createInvoice(
    request: LightningInvoiceRequest,
  ): Promise<LightningInvoice> {
    try {
      // Generate payment preimage and hash
      const preimage = request.preimage || crypto.randomBytes(32);
      const payment_hash =
        request.payment_hash ||
        crypto.createHash("sha256").update(preimage).digest();

      const expiry = request.expiry || 3600; // 1 hour default
      const now = Math.floor(Date.now() / 1000);
      const expiry_time = now + expiry;

      // Create BOLT11 invoice
      const invoiceData = {
        satoshis: Math.floor(request.amount_msat / 1000),
        timestamp: now,
        timestampString: new Date(now * 1000).toISOString(),
        paymentHash: payment_hash,
        description: request.description,
        expiry: expiry,
        // Mock node public key and other required fields
        destination: "03" + crypto.randomBytes(32).toString("hex"),
        recoveryFlag: 1,
        signature: {
          r: crypto.randomBytes(32),
          s: crypto.randomBytes(32),
          recoveryFlag: 1,
        },
      };

      // For demo purposes, we'll create a mock BOLT11 invoice
      // In production, this would connect to a real Lightning node
      const payment_request = this.generateMockBolt11Invoice({
        amount_msat: request.amount_msat,
        description: request.description,
        payment_hash: payment_hash.toString("hex"),
        expiry,
      });

      const invoice: LightningInvoice = {
        payment_request,
        payment_hash: payment_hash.toString("hex"),
        preimage: preimage.toString("hex"),
        amount_msat: request.amount_msat,
        expiry_time,
        description: request.description,
        created_at: new Date().toISOString(),
        expires_at: new Date(expiry_time * 1000).toISOString(),
        status: "pending",
      };

      // Store invoice for tracking
      this.invoiceStore.set(payment_hash.toString("hex"), invoice);

      return invoice;
    } catch (error) {
      console.error("Error creating Lightning invoice:", error);
      throw new Error(
        `Failed to create Lightning invoice: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Generate mock BOLT11 invoice for demo purposes
   */
  private generateMockBolt11Invoice(data: {
    amount_msat: number;
    description: string;
    payment_hash: string;
    expiry: number;
  }): string {
    // Create a realistic-looking BOLT11 invoice string
    const hrp = "lnbc"; // Lightning Network Bitcoin mainnet
    const amount = Math.floor(data.amount_msat / 1000); // Convert msat to sat
    const timestamp = Math.floor(Date.now() / 1000);

    // Base58 encode the payment hash and other data
    const encodedData = Buffer.concat([
      Buffer.from([1]), // Version
      Buffer.from(timestamp.toString(16).padStart(8, "0"), "hex"),
      Buffer.from(data.payment_hash, "hex"),
      Buffer.from(data.description, "utf8"),
      Buffer.from(data.expiry.toString(16).padStart(8, "0"), "hex"),
    ])
      .toString("base64")
      .replace(/[+/=]/g, (m) => ({ "+": "-", "/": "_", "=": "" })[m] || m);

    return `${hrp}${amount}u1${encodedData}`;
  }

  /**
   * Check invoice status
   */
  async getInvoiceStatus(
    payment_hash: string,
  ): Promise<LightningInvoice | null> {
    const invoice = this.invoiceStore.get(payment_hash);
    if (!invoice) {
      return null;
    }

    // Check if invoice has expired
    const now = Math.floor(Date.now() / 1000);
    if (invoice.status === "pending" && now > invoice.expiry_time) {
      invoice.status = "expired";
      this.invoiceStore.set(payment_hash, invoice);
    }

    return invoice;
  }

  /**
   * Mark invoice as paid (for demo/testing)
   */
  async markInvoiceAsPaid(
    payment_hash: string,
    preimage?: string,
  ): Promise<boolean> {
    const invoice = this.invoiceStore.get(payment_hash);
    if (!invoice || invoice.status !== "pending") {
      return false;
    }

    // Verify preimage if provided
    if (preimage) {
      const hash = crypto
        .createHash("sha256")
        .update(Buffer.from(preimage, "hex"))
        .digest("hex");
      if (hash !== payment_hash) {
        throw new Error("Invalid preimage for payment hash");
      }
    }

    invoice.status = "paid";
    this.invoiceStore.set(payment_hash, invoice);

    // Create payment record
    const payment: LightningPayment = {
      payment_hash,
      payment_preimage: preimage || invoice.preimage,
      status: "succeeded",
      amount_msat: invoice.amount_msat,
      fee_msat: 1000, // Mock fee
      created_at: invoice.created_at,
      settled_at: new Date().toISOString(),
    };

    this.paymentStore.set(payment_hash, payment);
    return true;
  }

  /**
   * Send Lightning payment
   */
  async sendPayment(payment_request: string): Promise<LightningPayment> {
    try {
      // Decode BOLT11 invoice
      const decoded = bolt11.decode(payment_request);
      const payment_hash = decoded.tags.find(
        (tag) => tag.tagName === "payment_hash",
      )?.data as string;

      if (!payment_hash) {
        throw new Error("Invalid payment request: missing payment hash");
      }

      // For demo, simulate payment processing
      const payment: LightningPayment = {
        payment_hash,
        status: "pending",
        amount_msat: decoded.millisatoshis || 0,
        created_at: new Date().toISOString(),
      };

      this.paymentStore.set(payment_hash, payment);

      // Simulate async payment processing
      setTimeout(() => {
        payment.status = "succeeded";
        payment.payment_preimage = crypto.randomBytes(32).toString("hex");
        payment.fee_msat = 500; // Mock fee
        payment.settled_at = new Date().toISOString();
        this.paymentStore.set(payment_hash, payment);
      }, 2000);

      return payment;
    } catch (error) {
      console.error("Error sending Lightning payment:", error);
      throw new Error(
        `Failed to send Lightning payment: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(
    payment_hash: string,
  ): Promise<LightningPayment | null> {
    return this.paymentStore.get(payment_hash) || null;
  }

  /**
   * List all invoices for a merchant
   */
  async listInvoices(limit: number = 100): Promise<LightningInvoice[]> {
    const invoices = Array.from(this.invoiceStore.values())
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
      .slice(0, limit);

    return invoices;
  }

  /**
   * Get Lightning node info
   */
  async getNodeInfo() {
    return {
      node_id: "03" + crypto.randomBytes(32).toString("hex"),
      alias: "Qpay Lightning Node",
      color: "#4F46E5",
      num_peers: 42,
      num_active_channels: 15,
      num_pending_channels: 2,
      block_height: 850000,
      synced_to_chain: true,
      synced_to_graph: true,
      version: "0.17.0-beta",
      chains: ["bitcoin"],
    };
  }

  /**
   * Calculate Lightning routing fee estimate
   */
  async estimateRoutingFee(
    amount_msat: number,
    destination?: string,
  ): Promise<number> {
    // Simple fee estimation based on amount
    // In production, this would query actual routing data
    const baseFee = 1000; // 1 sat base fee
    const feeRate = Math.max(1, Math.floor(amount_msat * 0.0001)); // 0.01% fee rate
    return baseFee + feeRate;
  }

  /**
   * Get Lightning network statistics
   */
  async getNetworkStats() {
    return {
      num_nodes: 16523,
      num_channels: 83541,
      total_network_capacity: "5247.82 BTC",
      avg_channel_size: "0.0628 BTC",
      median_channel_size: "0.0234 BTC",
      avg_fee_rate: "0.0001%",
      median_fee_rate: "0.0001%",
    };
  }

  /**
   * Convert satoshis to millisatoshis
   */
  static satToMsat(satoshis: number): number {
    return satoshis * 1000;
  }

  /**
   * Convert millisatoshis to satoshis
   */
  static msatToSat(msat: number): number {
    return Math.floor(msat / 1000);
  }
}

export const lightningService = new LightningService();
export { LightningService, LightningInvoice, LightningPayment };
