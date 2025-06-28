# Qpay Payment System Integration

## Overview

This document outlines the complete integration architecture for Qpay's cryptocurrency payment processing system that enables merchants to accept Bitcoin (BTC) and USDT payments while receiving automatic settlements in Kenyan Shillings (KES) through M-Pesa.

## Architecture Components

### 1. Backend Services

#### Supabase (Database & Auth)

- **Purpose**: Primary database, authentication, real-time subscriptions
- **Tables**: merchants, invoices, transactions, stores
- **Features**: Row Level Security (RLS), real-time updates, edge functions

#### Nownodes (Blockchain Infrastructure)

- **Purpose**: Bitcoin and USDT transaction monitoring and processing
- **Features**:
  - Address generation for payments
  - Transaction monitoring with confirmations
  - Real-time blockchain data
  - Webhook notifications for confirmed transactions

#### Yellowcard (Crypto-to-Fiat Conversion)

- **Purpose**: Convert cryptocurrency to Kenyan Shillings
- **Features**:
  - Real-time exchange rates
  - Crypto-to-KES conversion
  - Fee calculation and optimization
  - Status tracking for conversions

#### M-Pesa (Local Currency Settlement)

- **Purpose**: Final settlement to merchant M-Pesa accounts
- **Features**:
  - B2C payments to merchants
  - Transaction status monitoring
  - Phone number validation
  - Account balance checking

## Payment Flow

### 1. Invoice Creation

```
Merchant → Qpay API → Create Invoice → Generate Payment Address
```

### 2. Customer Payment

```
Customer → Scan QR/Enter Details → Send Crypto → Blockchain Confirmation
```

### 3. Settlement Processing

```
Blockchain Confirmation → Yellowcard Conversion → M-Pesa Settlement → Merchant Notification
```

## API Endpoints

### Invoice Management

- `POST /api/invoices` - Create new invoice
- `GET /api/invoices/:invoiceId` - Get invoice details
- `POST /api/invoices/:invoiceId/address` - Generate payment address
- `POST /api/invoices/:invoiceId/monitor` - Start payment monitoring

### Crypto & Exchange

- `GET /api/crypto/prices` - Current BTC/USDT prices
- `GET /api/exchange/rates` - Yellowcard exchange rates
- `POST /api/exchange/calculate` - Calculate KES amount

### Analytics

- `GET /api/merchants/:merchantId/analytics` - Merchant analytics

### Webhooks

- `POST /api/webhooks/mpesa` - M-Pesa transaction callbacks
- `POST /api/webhooks/yellowcard` - Conversion status updates
- `POST /api/webhooks/nownodes` - Blockchain confirmations

## Environment Configuration

### Required Environment Variables

```bash
# Supabase
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Nownodes
NOWNODES_API_KEY=your_nownodes_api_key
NOWNODES_BASE_URL=https://api.nownodes.io

# Yellowcard
YELLOWCARD_API_KEY=your_yellowcard_api_key
YELLOWCARD_BASE_URL=https://api.yellowcard.io
YELLOWCARD_ENVIRONMENT=sandbox

# M-Pesa
MPESA_CONSUMER_KEY=your_mpesa_consumer_key
MPESA_CONSUMER_SECRET=your_mpesa_consumer_secret
MPESA_SHORTCODE=your_mpesa_business_shortcode
MPESA_PASSKEY=your_mpesa_passkey
MPESA_ENVIRONMENT=sandbox
```

## Database Schema

### Merchants Table

```sql
CREATE TABLE merchants (
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
```

### Invoices Table

```sql
CREATE TABLE invoices (
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
```

### Transactions Table

```sql
CREATE TABLE transactions (
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
```

## Security Implementation

### API Security

- JWT token authentication for merchant access
- Rate limiting on all endpoints
- Webhook signature verification
- Input validation and sanitization

### Blockchain Security

- Address validation before payment generation
- Multiple confirmation requirements (BTC: 1+, USDT: 6+)
- Transaction amount verification
- Double-spend protection

### Financial Security

- Escrow system for payment processing
- Real-time fraud detection
- Transaction monitoring and alerts
- Secure key management for all APIs

## Deployment Steps

### 1. Environment Setup

1. Copy `.env.example` to `.env`
2. Fill in all required API credentials
3. Set up Supabase project and database
4. Configure webhook URLs in external services

### 2. Database Initialization

1. Run SQL schema creation in Supabase
2. Set up Row Level Security policies
3. Configure real-time subscriptions
4. Create database indexes for performance

### 3. Service Configuration

1. Configure Nownodes webhook endpoints
2. Set up Yellowcard webhook notifications
3. Configure M-Pesa callback URLs
4. Test all service connections

### 4. Production Deployment

1. Deploy to production environment
2. Configure SSL certificates
3. Set up monitoring and logging
4. Configure backup and recovery

## Testing Strategy

### Development Mode

- All services include mock implementations
- No real API calls or transactions
- Simulated blockchain confirmations
- Mock M-Pesa and Yellowcard responses

### Staging Environment

- Use sandbox/testnet environments
- Real API integration testing
- End-to-end payment flow testing
- Webhook testing and validation

### Production Testing

- Small test transactions
- Monitor all integration points
- Validate settlement flows
- Performance and load testing

## Monitoring & Alerts

### Key Metrics

- Transaction success/failure rates
- Settlement processing times
- API response times and errors
- Blockchain confirmation delays

### Alert Triggers

- Failed payment processing
- Webhook delivery failures
- High transaction failure rates
- Service downtime or errors

## Support & Maintenance

### Regular Tasks

- Monitor service health
- Update exchange rates
- Review transaction logs
- Backup database regularly

### Troubleshooting

- Check service API status
- Verify webhook deliveries
- Monitor blockchain confirmations
- Validate M-Pesa connectivity

## Cost Structure

### Service Fees

- **Qpay Service Fee**: 2.5% per transaction
- **Nownodes**: Based on API usage
- **Yellowcard**: Conversion fees (~1-1.5%)
- **M-Pesa**: Transaction fees (~KES 20-50)

### Revenue Model

- Service fees collected on successful transactions
- No fees on failed or cancelled transactions
- Additional fees for premium features

## Compliance & Regulations

### Kenya Financial Regulations

- Money service provider licensing
- KYC/AML compliance for merchants
- Transaction reporting requirements
- Tax compliance for cryptocurrency

### Data Protection

- GDPR compliance for data handling
- Local data residency requirements
- Secure data transmission
- User consent management

## Future Enhancements

### Planned Features

- Additional cryptocurrency support (ETH, USDC)
- Multi-country expansion
- Advanced analytics and reporting
- Mobile money integration beyond M-Pesa
- AI-powered fraud detection
- Smart contract automation

### Scalability Considerations

- Microservices architecture
- Load balancing and auto-scaling
- Database sharding for high volume
- CDN for global performance

This integration provides a complete, production-ready cryptocurrency payment processing solution with robust security, compliance, and scalability features.
