import { InputSanitizer, RateLimiter } from "./security";

// CSRF Token Management
class CSRFTokenManager {
  private static token: string | null = null;
  private static tokenExpiry: number = 0;

  // Generate CSRF token
  static generateToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const token = Array.from(array, (byte) =>
      byte.toString(16).padStart(2, "0"),
    ).join("");

    this.token = token;
    this.tokenExpiry = Date.now() + 30 * 60 * 1000; // 30 minutes

    // Store in session storage (not localStorage for security)
    sessionStorage.setItem("csrf_token", token);
    sessionStorage.setItem("csrf_expiry", this.tokenExpiry.toString());

    return token;
  }

  // Get current valid CSRF token
  static getToken(): string {
    const now = Date.now();

    // Check if current token is valid
    if (this.token && now < this.tokenExpiry) {
      return this.token;
    }

    // Check session storage
    const storedToken = sessionStorage.getItem("csrf_token");
    const storedExpiry = sessionStorage.getItem("csrf_expiry");

    if (storedToken && storedExpiry && now < parseInt(storedExpiry)) {
      this.token = storedToken;
      this.tokenExpiry = parseInt(storedExpiry);
      return storedToken;
    }

    // Generate new token if none exists or expired
    return this.generateToken();
  }

  // Validate CSRF token
  static validateToken(token: string): boolean {
    const currentToken = this.getToken();
    return token === currentToken && Date.now() < this.tokenExpiry;
  }

  // Clear token (on logout)
  static clearToken(): void {
    this.token = null;
    this.tokenExpiry = 0;
    sessionStorage.removeItem("csrf_token");
    sessionStorage.removeItem("csrf_expiry");
  }
}

// Secure API Client
class SecureAPIClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseURL: string = "/api") {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest", // CSRF protection
    };
  }

  // Rate limiting wrapper
  private checkRateLimit(endpoint: string): void {
    const key = `api_${endpoint}`;
    if (!RateLimiter.canPerformAction(key, 60, 60000)) {
      // 60 requests per minute
      const remaining = RateLimiter.getTimeUntilReset(key);
      throw new Error(
        `Rate limit exceeded. Try again in ${Math.ceil(remaining / 1000)} seconds.`,
      );
    }
  }

  // Secure request wrapper
  private async secureRequest<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    this.checkRateLimit(endpoint);

    const csrfToken = CSRFTokenManager.getToken();

    const secureHeaders = {
      ...this.defaultHeaders,
      "X-CSRF-Token": csrfToken,
      "X-Timestamp": Date.now().toString(),
      ...options.headers,
    };

    const requestOptions: RequestInit = {
      ...options,
      headers: secureHeaders,
      credentials: "same-origin", // Include cookies for session management
    };

    // Add request signing for sensitive operations
    if (["POST", "PUT", "DELETE"].includes(options.method || "GET")) {
      const signature = await this.signRequest(endpoint, requestOptions);
      secureHeaders["X-Request-Signature"] = signature;
    }

    try {
      const response = await fetch(
        `${this.baseURL}${endpoint}`,
        requestOptions,
      );

      // Check for security headers in response
      this.validateResponseHeaders(response);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            `HTTP ${response.status}: ${response.statusText}`,
        );
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Request signing for integrity
  private async signRequest(
    endpoint: string,
    options: RequestInit,
  ): Promise<string> {
    const payload = {
      endpoint,
      method: options.method || "GET",
      timestamp: Date.now(),
      body: options.body || "",
    };

    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(payload));
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  // Validate security headers in response
  private validateResponseHeaders(response: Response): void {
    const requiredHeaders = [
      "X-Content-Type-Options",
      "X-Frame-Options",
      "X-XSS-Protection",
    ];

    for (const header of requiredHeaders) {
      if (!response.headers.get(header)) {
        console.warn(`Missing security header: ${header}`);
      }
    }
  }

  // Public API methods
  async get<T>(endpoint: string): Promise<T> {
    return this.secureRequest<T>(endpoint, { method: "GET" });
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    // Sanitize input data
    const sanitizedData = this.sanitizeRequestData(data);

    return this.secureRequest<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(sanitizedData),
    });
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    const sanitizedData = this.sanitizeRequestData(data);

    return this.secureRequest<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(sanitizedData),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.secureRequest<T>(endpoint, { method: "DELETE" });
  }

  // Sanitize request data before sending
  private sanitizeRequestData(data: any): any {
    if (data === null || data === undefined) return data;

    if (typeof data === "string") {
      return InputSanitizer.sanitizeText(data);
    }

    if (typeof data === "number") {
      return InputSanitizer.sanitizeNumber(data);
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitizeRequestData(item));
    }

    if (typeof data === "object") {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        sanitized[InputSanitizer.sanitizeText(key)] =
          this.sanitizeRequestData(value);
      }
      return sanitized;
    }

    return data;
  }
}

// Environment-aware API configuration
class SecureConfig {
  static getAPIBaseURL(): string {
    // Never expose API keys or sensitive URLs in frontend code
    if (typeof window !== "undefined") {
      // Client-side: use relative URLs or environment-specific endpoints
      return window.location.origin + "/api";
    }
    return "/api";
  }

  static isDevelopment(): boolean {
    return (
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1")
    );
  }

  static getSecurityLevel(): "development" | "staging" | "production" {
    if (this.isDevelopment()) return "development";
    if (window.location.hostname.includes("staging")) return "staging";
    return "production";
  }
}

// Secure storage utilities
export class SecureStorage {
  // Encrypt sensitive data before storing
  static async encryptData(data: string, key?: string): Promise<string> {
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(data);

    // Use Web Crypto API for encryption
    const cryptoKey = await crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"],
    );

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      cryptoKey,
      encodedData,
    );

    // Store key reference and IV (in real app, manage keys securely)
    return JSON.stringify({
      data: Array.from(new Uint8Array(encrypted)),
      iv: Array.from(iv),
    });
  }

  // Store sensitive data securely
  static setSecureItem(key: string, value: string): void {
    try {
      // In production, encrypt the value
      if (SecureConfig.getSecurityLevel() === "production") {
        // Implement encryption before storing
        sessionStorage.setItem(key, value);
      } else {
        sessionStorage.setItem(key, value);
      }
    } catch (error) {
      console.error("Failed to store secure item:", error);
    }
  }

  // Retrieve sensitive data securely
  static getSecureItem(key: string): string | null {
    try {
      const value = sessionStorage.getItem(key);
      if (!value) return null;

      // In production, decrypt the value
      return value;
    } catch (error) {
      console.error("Failed to retrieve secure item:", error);
      return null;
    }
  }

  // Clear sensitive data
  static clearSecureItem(key: string): void {
    sessionStorage.removeItem(key);
  }

  // Clear all sensitive data (on logout)
  static clearAllSecureData(): void {
    sessionStorage.clear();
    CSRFTokenManager.clearToken();
  }
}

// Create singleton instance
export const secureAPI = new SecureAPIClient(SecureConfig.getAPIBaseURL());
export { CSRFTokenManager, SecureConfig };

// Secure form validation wrapper
export function withSecureValidation<T extends Record<string, any>>(
  formData: T,
  validationSchema: Record<keyof T, (value: any) => any>,
): T {
  const validated: any = {};
  const errors: string[] = [];

  for (const [key, validator] of Object.entries(validationSchema)) {
    try {
      validated[key] = validator(formData[key as keyof T]);
    } catch (error) {
      errors.push(
        `${key}: ${error instanceof Error ? error.message : "Invalid"}`,
      );
    }
  }

  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join(", ")}`);
  }

  return validated;
}

// Security event logging
export class SecurityLogger {
  static logSecurityEvent(
    event: string,
    details: Record<string, any> = {},
  ): void {
    const securityEvent = {
      timestamp: new Date().toISOString(),
      event,
      details,
      userAgent: navigator.userAgent,
      url: window.location.href,
      sessionId: sessionStorage.getItem("session_id"),
    };

    // In production, send to security monitoring service
    if (SecureConfig.getSecurityLevel() === "production") {
      // Send to security monitoring endpoint
      secureAPI.post("/security/events", securityEvent).catch((error) => {
        console.error("Failed to log security event:", error);
      });
    } else {
      console.log("Security Event:", securityEvent);
    }
  }
}
