import axios from "axios";

export class MpesaService {
  private consumerKey: string;
  private consumerSecret: string;
  private shortcode: string;
  private environment: string;
  private passkey: string;
  private isDevelopment: boolean;
  private baseUrl: string;

  constructor() {
    this.consumerKey = process.env.MPESA_CONSUMER_KEY || "mock_consumer_key";
    this.consumerSecret =
      process.env.MPESA_CONSUMER_SECRET || "mock_consumer_secret";
    this.shortcode = process.env.MPESA_SHORTCODE || "174379";
    this.environment = process.env.MPESA_ENVIRONMENT || "sandbox";
    this.passkey = process.env.MPESA_PASSKEY || "mock_passkey";
    this.isDevelopment = process.env.NODE_ENV === "development";
    this.baseUrl =
      this.environment === "production"
        ? "https://api.safaricom.co.ke"
        : "https://sandbox.safaricom.co.ke";
  }

  // Generate OAuth token
  private async getAccessToken(): Promise<string> {
    if (this.isDevelopment) {
      return "mock_access_token_" + Date.now();
    }

    try {
      const auth = Buffer.from(
        `${this.consumerKey}:${this.consumerSecret}`,
      ).toString("base64");

      const response = await axios.get(
        `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
        {
          headers: {
            Authorization: `Basic ${auth}`,
          },
        },
      );

      return response.data.access_token;
    } catch (error) {
      console.error("Error getting Mpesa access token:", error);
      throw new Error("Failed to get Mpesa access token");
    }
  }

  // Generate timestamp for Mpesa API
  private generateTimestamp(): string {
    const now = new Date();
    return (
      now.getFullYear() +
      ("0" + (now.getMonth() + 1)).slice(-2) +
      ("0" + now.getDate()).slice(-2) +
      ("0" + now.getHours()).slice(-2) +
      ("0" + now.getMinutes()).slice(-2) +
      ("0" + now.getSeconds()).slice(-2)
    );
  }

  // Generate password for Mpesa API
  private generatePassword(timestamp: string): string {
    return Buffer.from(`${this.shortcode}${this.passkey}${timestamp}`).toString(
      "base64",
    );
  }

  // Send money to customer (B2C)
  async sendMoney(
    phoneNumber: string,
    amount: number,
    reference: string,
    remarks?: string,
  ): Promise<{
    transactionId: string;
    status: "pending" | "completed" | "failed";
    mpesaReceiptNumber?: string;
    responseDescription: string;
  }> {
    if (this.isDevelopment) {
      // Mock Mpesa transaction
      const success = Math.random() > 0.1; // 90% success rate
      return {
        transactionId: "MP_" + Math.random().toString(36).substring(2, 12),
        status: success ? "completed" : "failed",
        mpesaReceiptNumber: success
          ? "MP" + Math.random().toString(36).substring(2, 10).toUpperCase()
          : undefined,
        responseDescription: success
          ? "Payment sent successfully"
          : "Transaction failed - insufficient funds",
      };
    }

    try {
      const accessToken = await this.getAccessToken();
      const timestamp = this.generateTimestamp();
      const password = this.generatePassword(timestamp);

      // Format phone number (remove +254, add 254)
      const formattedPhone = phoneNumber.startsWith("+254")
        ? phoneNumber.replace("+254", "254")
        : phoneNumber.startsWith("0")
          ? phoneNumber.replace("0", "254")
          : phoneNumber;

      const response = await axios.post(
        `${this.baseUrl}/mpesa/b2c/v1/paymentrequest`,
        {
          InitiatorName: "Qpay",
          SecurityCredential: password,
          CommandID: "BusinessPayment",
          Amount: Math.round(amount),
          PartyA: this.shortcode,
          PartyB: formattedPhone,
          Remarks: remarks || "Qpay settlement",
          QueueTimeOutURL: `${process.env.BASE_URL}/api/mpesa/timeout`,
          ResultURL: `${process.env.BASE_URL}/api/mpesa/result`,
          Occasion: reference,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      return {
        transactionId: response.data.ConversationID,
        status: "pending",
        responseDescription: response.data.ResponseDescription,
      };
    } catch (error) {
      console.error("Error sending Mpesa payment:", error);
      throw new Error("Failed to send Mpesa payment");
    }
  }

  // Check transaction status
  async checkTransactionStatus(transactionId: string): Promise<{
    status: "pending" | "completed" | "failed";
    mpesaReceiptNumber?: string;
    amount?: number;
    phoneNumber?: string;
    completedAt?: string;
    failureReason?: string;
  }> {
    if (this.isDevelopment) {
      // Mock status check
      const statuses = ["pending", "completed", "failed"];
      const randomStatus =
        statuses[Math.floor(Math.random() * statuses.length)];

      return {
        status: randomStatus as any,
        mpesaReceiptNumber:
          randomStatus === "completed"
            ? "MP" + Math.random().toString(36).substring(2, 10).toUpperCase()
            : undefined,
        amount: randomStatus === "completed" ? 50000 : undefined,
        phoneNumber: randomStatus === "completed" ? "254700000000" : undefined,
        completedAt:
          randomStatus === "completed" ? new Date().toISOString() : undefined,
        failureReason:
          randomStatus === "failed" ? "Customer phone unreachable" : undefined,
      };
    }

    try {
      const accessToken = await this.getAccessToken();

      const response = await axios.post(
        `${this.baseUrl}/mpesa/transactionstatus/v1/query`,
        {
          Initiator: "Qpay",
          SecurityCredential: this.generatePassword(this.generateTimestamp()),
          CommandID: "TransactionStatusQuery",
          TransactionID: transactionId,
          PartyA: this.shortcode,
          IdentifierType: "4",
          ResultURL: `${process.env.BASE_URL}/api/mpesa/status-result`,
          QueueTimeOutURL: `${process.env.BASE_URL}/api/mpesa/status-timeout`,
          Remarks: "Status check",
          Occasion: "Transaction status query",
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      // This would typically be handled via webhook
      return {
        status: "pending",
      };
    } catch (error) {
      console.error("Error checking Mpesa transaction status:", error);
      throw new Error("Failed to check transaction status");
    }
  }

  // Validate phone number format
  validatePhoneNumber(phoneNumber: string): boolean {
    // Kenyan phone number validation
    const kenyaRegex = /^(?:\+254|254|0)?([17]\d{8})$/;
    return kenyaRegex.test(phoneNumber);
  }

  // Format phone number to standard format
  formatPhoneNumber(phoneNumber: string): string {
    if (phoneNumber.startsWith("+254")) {
      return phoneNumber.replace("+254", "254");
    }
    if (phoneNumber.startsWith("0")) {
      return phoneNumber.replace("0", "254");
    }
    if (!phoneNumber.startsWith("254")) {
      return "254" + phoneNumber;
    }
    return phoneNumber;
  }

  // Get account balance
  async getAccountBalance(): Promise<{
    workingBalance: number;
    unavailableBalance: number;
    currency: string;
  }> {
    if (this.isDevelopment) {
      return {
        workingBalance: Math.random() * 1000000,
        unavailableBalance: Math.random() * 100000,
        currency: "KES",
      };
    }

    try {
      const accessToken = await this.getAccessToken();
      const timestamp = this.generateTimestamp();

      const response = await axios.post(
        `${this.baseUrl}/mpesa/accountbalance/v1/query`,
        {
          Initiator: "Qpay",
          SecurityCredential: this.generatePassword(timestamp),
          CommandID: "AccountBalance",
          PartyA: this.shortcode,
          IdentifierType: "4",
          Remarks: "Account balance query",
          QueueTimeOutURL: `${process.env.BASE_URL}/api/mpesa/balance-timeout`,
          ResultURL: `${process.env.BASE_URL}/api/mpesa/balance-result`,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      return {
        workingBalance: 0, // This comes via webhook
        unavailableBalance: 0,
        currency: "KES",
      };
    } catch (error) {
      console.error("Error getting account balance:", error);
      throw new Error("Failed to get account balance");
    }
  }
}

export const mpesaService = new MpesaService();
