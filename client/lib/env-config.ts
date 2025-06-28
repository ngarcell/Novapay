// Environment configuration with security best practices

interface AppConfig {
  apiBaseUrl: string;
  environment: "development" | "staging" | "production";
  features: {
    devTools: boolean;
    logging: boolean;
    analytics: boolean;
    debugMode: boolean;
  };
  security: {
    csrfEnabled: boolean;
    httpsOnly: boolean;
    secureHeaders: boolean;
    rateLimiting: boolean;
  };
  limits: {
    maxFileSize: number;
    maxRequestSize: number;
    sessionTimeout: number;
    apiTimeout: number;
  };
}

class EnvironmentConfig {
  private static instance: EnvironmentConfig;
  private config: AppConfig;

  private constructor() {
    this.config = this.loadConfiguration();
    this.validateConfiguration();
    this.setupSecurityMeasures();
  }

  public static getInstance(): EnvironmentConfig {
    if (!EnvironmentConfig.instance) {
      EnvironmentConfig.instance = new EnvironmentConfig();
    }
    return EnvironmentConfig.instance;
  }

  private loadConfiguration(): AppConfig {
    // Detect environment based on URL and build context
    const hostname =
      typeof window !== "undefined" ? window.location.hostname : "localhost";
    const isLocal = hostname === "localhost" || hostname === "127.0.0.1";
    const isStaging = hostname.includes("staging") || hostname.includes("dev");
    const isProduction = !isLocal && !isStaging;

    const environment = isProduction
      ? "production"
      : isStaging
        ? "staging"
        : "development";

    // Base configuration
    const baseConfig: AppConfig = {
      apiBaseUrl: this.getApiBaseUrl(environment),
      environment,
      features: {
        devTools: environment === "development",
        logging: environment !== "production",
        analytics: environment === "production",
        debugMode: environment === "development",
      },
      security: {
        csrfEnabled: true,
        httpsOnly: environment === "production",
        secureHeaders: true,
        rateLimiting: true,
      },
      limits: {
        maxFileSize: 10 * 1024 * 1024, // 10MB
        maxRequestSize: 5 * 1024 * 1024, // 5MB
        sessionTimeout: 30 * 60 * 1000, // 30 minutes
        apiTimeout: 30 * 1000, // 30 seconds
      },
    };

    // Environment-specific overrides
    if (environment === "production") {
      baseConfig.features.devTools = false;
      baseConfig.features.logging = false;
      baseConfig.features.debugMode = false;
      baseConfig.security.httpsOnly = true;
      baseConfig.limits.sessionTimeout = 15 * 60 * 1000; // 15 minutes in production
    }

    return baseConfig;
  }

  private getApiBaseUrl(environment: string): string {
    if (typeof window === "undefined") return "/api";

    // Never hardcode API endpoints - use relative URLs or environment detection
    switch (environment) {
      case "production":
        return window.location.origin + "/api";
      case "staging":
        return window.location.origin + "/api";
      case "development":
      default:
        return window.location.origin + "/api";
    }
  }

  private validateConfiguration(): void {
    // Validate required configuration
    if (!this.config.apiBaseUrl) {
      throw new Error("API base URL is required");
    }

    // Security validations
    if (this.config.environment === "production") {
      if (!this.config.security.httpsOnly) {
        console.error("HTTPS should be enforced in production");
      }
      if (this.config.features.devTools) {
        console.error("Development tools should be disabled in production");
      }
    }

    // Log configuration (exclude sensitive data)
    if (this.config.features.logging) {
      console.log("App configuration loaded:", {
        environment: this.config.environment,
        features: this.config.features,
        security: this.config.security,
      });
    }
  }

  private setupSecurityMeasures(): void {
    if (typeof window === "undefined") return;

    // Disable right-click context menu in production
    if (this.config.environment === "production") {
      document.addEventListener("contextmenu", (e) => e.preventDefault());
    }

    // Disable F12 and other dev shortcuts in production
    if (this.config.environment === "production") {
      document.addEventListener("keydown", (e) => {
        // Disable F12, Ctrl+Shift+I, Ctrl+Shift+C, Ctrl+U
        if (
          e.key === "F12" ||
          (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "C")) ||
          (e.ctrlKey && e.key === "u")
        ) {
          e.preventDefault();
          console.warn("Developer tools access blocked");
        }
      });
    }

    // Setup Content Security Policy
    if (this.config.security.secureHeaders) {
      this.setupCSP();
    }

    // Monitor for suspicious activity
    this.setupSecurityMonitoring();
  }

  private setupCSP(): void {
    // Content Security Policy headers (would be set by server in production)
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'", // Note: In production, use nonces
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://api.nownodes.io https://api.yellowcard.io",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ");

    // Create meta tag for CSP (development only - use HTTP headers in production)
    if (this.config.environment === "development") {
      const metaCSP = document.createElement("meta");
      metaCSP.httpEquiv = "Content-Security-Policy";
      metaCSP.content = csp;
      document.head.appendChild(metaCSP);
    }
  }

  private setupSecurityMonitoring(): void {
    // Monitor for console access
    if (this.config.environment === "production") {
      const originalConsole = { ...console };
      console.log = () => {};
      console.warn = () => {};
      console.error = () => {};
      console.info = () => {};

      // Keep only essential console methods for security logging
      console.error = originalConsole.error;
    }

    // Monitor for suspicious DOM manipulation
    if (typeof MutationObserver !== "undefined") {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === "childList") {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node as Element;
                // Check for suspicious script injections
                if (
                  element.tagName === "SCRIPT" ||
                  element.innerHTML?.includes("<script")
                ) {
                  console.error("Suspicious script injection detected");
                  element.remove();
                }
              }
            });
          }
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }
  }

  // Public getters
  public get apiBaseUrl(): string {
    return this.config.apiBaseUrl;
  }

  public get environment(): string {
    return this.config.environment;
  }

  public get features(): AppConfig["features"] {
    return { ...this.config.features };
  }

  public get security(): AppConfig["security"] {
    return { ...this.config.security };
  }

  public get limits(): AppConfig["limits"] {
    return { ...this.config.limits };
  }

  // Utility methods
  public isDevelopment(): boolean {
    return this.config.environment === "development";
  }

  public isProduction(): boolean {
    return this.config.environment === "production";
  }

  public isFeatureEnabled(feature: keyof AppConfig["features"]): boolean {
    return this.config.features[feature];
  }

  public isSecurityEnabled(security: keyof AppConfig["security"]): boolean {
    return this.config.security[security];
  }

  // Secure configuration access
  public getSecureConfig(): Partial<AppConfig> {
    // Return only non-sensitive configuration
    return {
      environment: this.config.environment,
      features: this.config.features,
      limits: this.config.limits,
    };
  }
}

// API Key Management (for frontend-safe API keys only)
class APIKeyManager {
  private static readonly SAFE_KEYS = [
    "SUPABASE_ANON_KEY", // Safe to expose (has RLS protection)
  ];

  // Get safe API keys that can be exposed to frontend
  static getSafeAPIKey(keyName: string): string | null {
    if (!this.SAFE_KEYS.includes(keyName)) {
      console.error(`API key ${keyName} is not safe for frontend use`);
      return null;
    }

    // In a real app, these would come from build-time environment variables
    // Never put secret keys in frontend code
    const keys: Record<string, string> = {
      SUPABASE_ANON_KEY: "mock_anon_key", // This would be injected at build time
    };

    return keys[keyName] || null;
  }

  // Validate API key format
  static validateAPIKeyFormat(key: string, keyType: string): boolean {
    const patterns: Record<string, RegExp> = {
      supabase: /^[a-zA-Z0-9._-]+$/,
      jwt: /^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/,
    };

    const pattern = patterns[keyType.toLowerCase()];
    return pattern ? pattern.test(key) : true;
  }
}

// Secure Headers Management
export class SecureHeaders {
  private static headers: Record<string, string> = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), location=()",
  };

  static getSecurityHeaders(): Record<string, string> {
    return { ...this.headers };
  }

  static addCustomHeader(name: string, value: string): void {
    if (name.startsWith("X-") || name.startsWith("Content-Security-Policy")) {
      this.headers[name] = value;
    } else {
      console.warn(`Header ${name} may not be a security header`);
    }
  }
}

// Initialize environment configuration
export const envConfig = EnvironmentConfig.getInstance();
export { APIKeyManager };

// Utility functions
export function isSecureContext(): boolean {
  return (
    typeof window !== "undefined" &&
    (window.location.protocol === "https:" ||
      window.location.hostname === "localhost")
  );
}

export function requireSecureContext(): void {
  if (!isSecureContext()) {
    throw new Error("This feature requires a secure context (HTTPS)");
  }
}

// Environment-aware logging
export function secureLog(
  level: "info" | "warn" | "error",
  message: string,
  data?: any,
): void {
  if (!envConfig.isFeatureEnabled("logging")) return;

  const logData = {
    timestamp: new Date().toISOString(),
    level,
    message,
    environment: envConfig.environment,
    ...(data && { data }),
  };

  switch (level) {
    case "error":
      console.error("[SECURE]", logData);
      break;
    case "warn":
      console.warn("[SECURE]", logData);
      break;
    case "info":
    default:
      console.log("[SECURE]", logData);
      break;
  }
}
