import axios from "axios";

export class NownodesService {
  private apiKey: string;
  private baseUrl: string;
  private isDevelopment: boolean;

  constructor() {
    this.apiKey = process.env.NOWNODES_API_KEY || "mock_api_key";
    this.baseUrl = process.env.NOWNODES_BASE_URL || "https://api.nownodes.io";
    this.isDevelopment = process.env.NODE_ENV === "development";
  }

  // Generate Bitcoin address for payments
  async generateBitcoinAddress(): Promise<string> {
    if (this.isDevelopment) {
      // Mock address for development
      return "bc1q" + Math.random().toString(36).substring(2, 34);
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/btc/address`,
        {},
        {
          headers: {
            "api-key": this.apiKey,
            "Content-Type": "application/json",
          },
        },
      );

      return response.data.address;
    } catch (error) {
      console.error("Error generating Bitcoin address:", error);
      throw new Error("Failed to generate Bitcoin address");
    }
  }

  // Generate USDT address for payments
  async generateUSDTAddress(): Promise<string> {
    if (this.isDevelopment) {
      // Mock address for development
      return "0x" + Math.random().toString(16).substring(2, 42);
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/eth/address`,
        {},
        {
          headers: {
            "api-key": this.apiKey,
            "Content-Type": "application/json",
          },
        },
      );

      return response.data.address;
    } catch (error) {
      console.error("Error generating USDT address:", error);
      throw new Error("Failed to generate USDT address");
    }
  }

  // Monitor Bitcoin transaction
  async monitorBitcoinTransaction(
    address: string,
    expectedAmount: number,
  ): Promise<{
    txHash: string;
    amount: number;
    confirmations: number;
    status: "pending" | "confirmed";
  }> {
    if (this.isDevelopment) {
      // Mock transaction monitoring
      return {
        txHash:
          "0x" + Math.random().toString(16).substring(2, 66).padStart(64, "0"),
        amount: expectedAmount,
        confirmations: Math.floor(Math.random() * 6),
        status: Math.random() > 0.3 ? "confirmed" : "pending",
      };
    }

    try {
      const response = await axios.get(
        `${this.baseUrl}/btc/address/${address}/transactions`,
        {
          headers: {
            "api-key": this.apiKey,
          },
        },
      );

      const transactions = response.data.transactions;
      const relevantTx = transactions.find(
        (tx: any) => tx.value >= expectedAmount * 100000000, // Convert to satoshis
      );

      if (!relevantTx) {
        return {
          txHash: "",
          amount: 0,
          confirmations: 0,
          status: "pending",
        };
      }

      return {
        txHash: relevantTx.hash,
        amount: relevantTx.value / 100000000, // Convert from satoshis
        confirmations: relevantTx.confirmations || 0,
        status: relevantTx.confirmations >= 1 ? "confirmed" : "pending",
      };
    } catch (error) {
      console.error("Error monitoring Bitcoin transaction:", error);
      throw new Error("Failed to monitor Bitcoin transaction");
    }
  }

  // Monitor USDT transaction
  async monitorUSDTTransaction(
    address: string,
    expectedAmount: number,
  ): Promise<{
    txHash: string;
    amount: number;
    confirmations: number;
    status: "pending" | "confirmed";
  }> {
    if (this.isDevelopment) {
      // Mock transaction monitoring
      return {
        txHash:
          "0x" + Math.random().toString(16).substring(2, 66).padStart(64, "0"),
        amount: expectedAmount,
        confirmations: Math.floor(Math.random() * 12),
        status: Math.random() > 0.3 ? "confirmed" : "pending",
      };
    }

    try {
      const response = await axios.get(
        `${this.baseUrl}/eth/address/${address}/transactions`,
        {
          headers: {
            "api-key": this.apiKey,
          },
        },
      );

      const transactions = response.data.transactions;
      // USDT contract address on Ethereum
      const usdtContractAddress = "0xdAC17F958D2ee523a2206206994597C13D831ec7";

      const relevantTx = transactions.find(
        (tx: any) =>
          tx.to?.toLowerCase() === usdtContractAddress.toLowerCase() &&
          parseFloat(tx.value) >= expectedAmount,
      );

      if (!relevantTx) {
        return {
          txHash: "",
          amount: 0,
          confirmations: 0,
          status: "pending",
        };
      }

      return {
        txHash: relevantTx.hash,
        amount: parseFloat(relevantTx.value),
        confirmations: relevantTx.confirmations || 0,
        status: relevantTx.confirmations >= 6 ? "confirmed" : "pending",
      };
    } catch (error) {
      console.error("Error monitoring USDT transaction:", error);
      throw new Error("Failed to monitor USDT transaction");
    }
  }

  // Get current Bitcoin price
  async getBitcoinPrice(): Promise<number> {
    if (this.isDevelopment) {
      // Mock price with some variation
      return 45000 + Math.random() * 10000;
    }

    try {
      const response = await axios.get(`${this.baseUrl}/btc/price`, {
        headers: {
          "api-key": this.apiKey,
        },
      });

      return response.data.price_usd;
    } catch (error) {
      console.error("Error getting Bitcoin price:", error);
      throw new Error("Failed to get Bitcoin price");
    }
  }

  // Get current USDT price (should be ~$1)
  async getUSDTPrice(): Promise<number> {
    if (this.isDevelopment) {
      // Mock USDT price (usually around $1)
      return 0.998 + Math.random() * 0.004;
    }

    try {
      const response = await axios.get(`${this.baseUrl}/usdt/price`, {
        headers: {
          "api-key": this.apiKey,
        },
      });

      return response.data.price_usd;
    } catch (error) {
      console.error("Error getting USDT price:", error);
      return 1.0; // Fallback to $1 for USDT
    }
  }
}

export const nownodesService = new NownodesService();
