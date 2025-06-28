import axios from "axios";

export class YellowcardService {
  private apiKey: string;
  private baseUrl: string;
  private environment: string;
  private isDevelopment: boolean;

  constructor() {
    this.apiKey = process.env.YELLOWCARD_API_KEY || "mock_api_key";
    this.baseUrl =
      process.env.YELLOWCARD_BASE_URL || "https://api.yellowcard.io";
    this.environment = process.env.YELLOWCARD_ENVIRONMENT || "sandbox";
    this.isDevelopment = process.env.NODE_ENV === "development";
  }

  // Get exchange rates for crypto to KES
  async getExchangeRates(): Promise<{
    btc_to_kes: number;
    usdt_to_kes: number;
    fees: {
      btc_conversion_fee: number;
      usdt_conversion_fee: number;
    };
  }> {
    if (this.isDevelopment) {
      // Mock exchange rates
      return {
        btc_to_kes: 5500000 + Math.random() * 1000000, // ~5.5M KES per BTC
        usdt_to_kes: 140 + Math.random() * 10, // ~140 KES per USDT
        fees: {
          btc_conversion_fee: 0.015, // 1.5%
          usdt_conversion_fee: 0.01, // 1%
        },
      };
    }

    try {
      const response = await axios.get(`${this.baseUrl}/v1/rates`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        params: {
          from: "BTC,USDT",
          to: "KES",
        },
      });

      return {
        btc_to_kes: response.data.rates.BTC_KES.rate,
        usdt_to_kes: response.data.rates.USDT_KES.rate,
        fees: {
          btc_conversion_fee: response.data.rates.BTC_KES.fee,
          usdt_conversion_fee: response.data.rates.USDT_KES.fee,
        },
      };
    } catch (error) {
      console.error("Error getting exchange rates:", error);
      throw new Error("Failed to get exchange rates");
    }
  }

  // Calculate KES amount from crypto
  async calculateKESAmount(
    cryptoAmount: number,
    cryptoCurrency: "BTC" | "USDT",
  ): Promise<{
    kesAmount: number;
    exchangeRate: number;
    conversionFee: number;
    netAmount: number;
  }> {
    const rates = await this.getExchangeRates();

    const exchangeRate =
      cryptoCurrency === "BTC" ? rates.btc_to_kes : rates.usdt_to_kes;
    const feeRate =
      cryptoCurrency === "BTC"
        ? rates.fees.btc_conversion_fee
        : rates.fees.usdt_conversion_fee;

    const grossKesAmount = cryptoAmount * exchangeRate;
    const conversionFee = grossKesAmount * feeRate;
    const netAmount = grossKesAmount - conversionFee;

    return {
      kesAmount: grossKesAmount,
      exchangeRate,
      conversionFee,
      netAmount,
    };
  }

  // Execute crypto to KES conversion
  async executeCryptoConversion(
    cryptoAmount: number,
    cryptoCurrency: "BTC" | "USDT",
    recipientDetails: {
      name: string;
      phone: string;
      accountNumber?: string;
    },
  ): Promise<{
    conversionId: string;
    status: "pending" | "processing" | "completed" | "failed";
    kesAmount: number;
    estimatedCompletionTime: string;
  }> {
    if (this.isDevelopment) {
      // Mock conversion execution
      const calculation = await this.calculateKESAmount(
        cryptoAmount,
        cryptoCurrency,
      );

      return {
        conversionId: "YC_" + Math.random().toString(36).substring(2, 12),
        status: Math.random() > 0.1 ? "processing" : "failed",
        kesAmount: calculation.netAmount,
        estimatedCompletionTime: new Date(
          Date.now() + 5 * 60 * 1000,
        ).toISOString(), // 5 minutes
      };
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/v1/conversions`,
        {
          amount: cryptoAmount,
          from_currency: cryptoCurrency,
          to_currency: "KES",
          recipient: recipientDetails,
          environment: this.environment,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        },
      );

      return {
        conversionId: response.data.conversion_id,
        status: response.data.status,
        kesAmount: response.data.kes_amount,
        estimatedCompletionTime: response.data.estimated_completion,
      };
    } catch (error) {
      console.error("Error executing crypto conversion:", error);
      throw new Error("Failed to execute crypto conversion");
    }
  }

  // Check conversion status
  async checkConversionStatus(conversionId: string): Promise<{
    status: "pending" | "processing" | "completed" | "failed";
    kesAmount?: number;
    completedAt?: string;
    failureReason?: string;
  }> {
    if (this.isDevelopment) {
      // Mock status check with progression
      const statuses = ["pending", "processing", "completed"];
      const randomStatus =
        statuses[Math.floor(Math.random() * statuses.length)];

      return {
        status: randomStatus as any,
        kesAmount: randomStatus === "completed" ? 50000 : undefined,
        completedAt:
          randomStatus === "completed" ? new Date().toISOString() : undefined,
        failureReason:
          randomStatus === "failed" ? "Insufficient liquidity" : undefined,
      };
    }

    try {
      const response = await axios.get(
        `${this.baseUrl}/v1/conversions/${conversionId}`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        },
      );

      return {
        status: response.data.status,
        kesAmount: response.data.kes_amount,
        completedAt: response.data.completed_at,
        failureReason: response.data.failure_reason,
      };
    } catch (error) {
      console.error("Error checking conversion status:", error);
      throw new Error("Failed to check conversion status");
    }
  }

  // Get supported countries and currencies
  async getSupportedRegions(): Promise<{
    countries: string[];
    currencies: {
      crypto: string[];
      fiat: string[];
    };
  }> {
    if (this.isDevelopment) {
      return {
        countries: ["Kenya", "Nigeria", "Ghana", "Uganda", "Tanzania"],
        currencies: {
          crypto: ["BTC", "USDT", "ETH"],
          fiat: ["KES", "NGN", "GHS", "UGX", "TZS"],
        },
      };
    }

    try {
      const response = await axios.get(`${this.baseUrl}/v1/regions`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      return response.data;
    } catch (error) {
      console.error("Error getting supported regions:", error);
      throw new Error("Failed to get supported regions");
    }
  }
}

export const yellowcardService = new YellowcardService();
