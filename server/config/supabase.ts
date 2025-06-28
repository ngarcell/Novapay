import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Admin client for server-side operations
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Database types and interfaces
export interface Merchant {
  id: string;
  email: string;
  business_name: string;
  business_type: string;
  kra_pin: string;
  mpesa_number: string;
  bitcoin_address?: string;
  default_settlement: "mpesa" | "btc";
  auto_settlement: boolean;
  settlement_threshold: number;
  status: "pending" | "verified" | "suspended";
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  merchant_id: string;
  amount: number;
  currency: string;
  description: string;
  customer_email?: string;
  customer_name?: string;
  store_id?: string;
  settlement_preference: "mpesa" | "btc";
  status: "pending" | "paid" | "expired" | "cancelled";
  expires_at: string;
  payment_address?: string;
  transaction_hash?: string;
  settlement_tx_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  invoice_id: string;
  merchant_id: string;
  type: "payment" | "settlement";
  crypto_currency: "BTC" | "USDT";
  crypto_amount: number;
  fiat_amount: number;
  exchange_rate: number;
  network_fee: number;
  service_fee: number;
  status: "pending" | "processing" | "completed" | "failed";
  blockchain_confirmations: number;
  transaction_hash?: string;
  mpesa_reference?: string;
  created_at: string;
  updated_at: string;
}

export interface Store {
  id: string;
  merchant_id: string;
  name: string;
  description?: string;
  webhook_url?: string;
  api_key: string;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

// Database initialization (run this to create tables)
export const initializeDatabase = async () => {
  // This would typically be handled by Supabase migrations
  // For now, we'll define the schema here for reference

  const merchantsTable = `
    CREATE TABLE IF NOT EXISTS merchants (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR UNIQUE NOT NULL,
      business_name VARCHAR NOT NULL,
      business_type VARCHAR NOT NULL,
      kra_pin VARCHAR NOT NULL,
      mpesa_number VARCHAR NOT NULL,
      bitcoin_address VARCHAR,
      default_settlement VARCHAR DEFAULT 'mpesa',
      auto_settlement BOOLEAN DEFAULT true,
      settlement_threshold DECIMAL DEFAULT 100,
      status VARCHAR DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;

  const invoicesTable = `
    CREATE TABLE IF NOT EXISTS invoices (
      id VARCHAR PRIMARY KEY,
      merchant_id UUID REFERENCES merchants(id),
      amount DECIMAL NOT NULL,
      currency VARCHAR DEFAULT 'USD',
      description TEXT NOT NULL,
      customer_email VARCHAR,
      customer_name VARCHAR,
      store_id UUID,
      settlement_preference VARCHAR DEFAULT 'mpesa',
      status VARCHAR DEFAULT 'pending',
      expires_at TIMESTAMP NOT NULL,
      payment_address VARCHAR,
      transaction_hash VARCHAR,
      settlement_tx_id VARCHAR,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;

  const transactionsTable = `
    CREATE TABLE IF NOT EXISTS transactions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      invoice_id VARCHAR REFERENCES invoices(id),
      merchant_id UUID REFERENCES merchants(id),
      type VARCHAR NOT NULL,
      crypto_currency VARCHAR NOT NULL,
      crypto_amount DECIMAL NOT NULL,
      fiat_amount DECIMAL NOT NULL,
      exchange_rate DECIMAL NOT NULL,
      network_fee DECIMAL DEFAULT 0,
      service_fee DECIMAL DEFAULT 0,
      status VARCHAR DEFAULT 'pending',
      blockchain_confirmations INTEGER DEFAULT 0,
      transaction_hash VARCHAR,
      mpesa_reference VARCHAR,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;

  const storesTable = `
    CREATE TABLE IF NOT EXISTS stores (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      merchant_id UUID REFERENCES merchants(id),
      name VARCHAR NOT NULL,
      description TEXT,
      webhook_url VARCHAR,
      api_key VARCHAR UNIQUE NOT NULL,
      status VARCHAR DEFAULT 'active',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;

  console.log("Database schema defined. Run these in Supabase SQL editor:");
  console.log(merchantsTable);
  console.log(invoicesTable);
  console.log(transactionsTable);
  console.log(storesTable);
};
