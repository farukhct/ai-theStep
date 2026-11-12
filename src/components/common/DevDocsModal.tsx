import React, { useState } from 'react';
import { 
  X, 
  Database, 
  Server, 
  Terminal, 
  ShieldCheck, 
  FileCode, 
  Workflow, 
  Copy, 
  Check, 
  ExternalLink 
} from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

interface DevDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DevDocsModal: React.FC<DevDocsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'architecture' | 'schema' | 'api' | 'concurrency' | 'deployment'>('architecture');
  const { addToast } = useNotification();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    addToast('Copied to Clipboard', 'Code snippet copied.', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden my-8 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-neutral-200 flex items-center justify-between bg-neutral-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-neutral-800 rounded-lg text-emerald-400 border border-neutral-700">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">AURA Architecture, ER Models & API Reference</h3>
              <p className="text-xs text-neutral-400">Complete Clean Architecture & PostgreSQL / Cloud DB Documentation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-200 bg-neutral-50 px-5 pt-3 gap-6 text-xs font-bold shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('architecture')}
            className={`pb-3 border-b-2 cursor-pointer transition-colors flex items-center gap-2 ${
              activeTab === 'architecture' ? 'border-neutral-900 text-neutral-950' : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Workflow className="w-4 h-4" />
            <span>System Architecture</span>
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`pb-3 border-b-2 cursor-pointer transition-colors flex items-center gap-2 ${
              activeTab === 'schema' ? 'border-neutral-900 text-neutral-950' : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Database ER Diagram</span>
          </button>
          <button
            onClick={() => setActiveTab('api')}
            className={`pb-3 border-b-2 cursor-pointer transition-colors flex items-center gap-2 ${
              activeTab === 'api' ? 'border-neutral-900 text-neutral-950' : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>REST API Endpoints</span>
          </button>
          <button
            onClick={() => setActiveTab('concurrency')}
            className={`pb-3 border-b-2 cursor-pointer transition-colors flex items-center gap-2 ${
              activeTab === 'concurrency' ? 'border-neutral-900 text-neutral-950' : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Atomic Stock & Concurrency</span>
          </button>
          <button
            onClick={() => setActiveTab('deployment')}
            className={`pb-3 border-b-2 cursor-pointer transition-colors flex items-center gap-2 ${
              activeTab === 'deployment' ? 'border-neutral-900 text-neutral-950' : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Deployment Guide</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-neutral-800 text-xs">
          {activeTab === 'architecture' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider text-neutral-950 mb-2">High-Level Clean Architecture</h4>
                <p className="text-neutral-600 leading-relaxed">
                  The application adheres to clean architecture principles with strict isolation between presentation, domain entities, transaction handling, and cloud persistence.
                </p>
              </div>

              {/* ASCII Diagram */}
              <div className="bg-neutral-950 text-neutral-200 p-5 rounded-xl font-mono text-[11px] leading-relaxed border border-neutral-800 overflow-x-auto relative">
                <button
                  onClick={() => handleCopy(`+-----------------------------------------------------------------------------------+
|                        CUSTOMER CLIENT & SARTORIAL STOREFRONT                     |
|    React 19 + Tailwind CSS + TanStack Query + Motion + Responsive Mega-Menu       |
+-----------------------------------------------------------------------------------+
                                          |  (HTTPS / REST / WebSocket)
                                          v
+-----------------------------------------------------------------------------------+
|                 EXPRESS & NODE.JS BUSINESS ENGINE (API GATEWAY)                  |
|    - RBAC & Role Permission Firewall (Superadmin, Product Mgr, Inventory Mgr)     |
|    - Multi-Factor Auth (MFA SMS / TOTP) Challenge Handler                         |
|    - Payment Gateway Adapters (bKash Tokenized, Nagad Direct, Sonali Bank SPG)    |
|    - Real-time Inventory Concurrency & Stock Reservation Mutex                    |
|    - Accurate COGS & Financial Calculation Engine                                 |
+-----------------------------------------------------------------------------------+
                                          |
                +-------------------------+-------------------------+
                |                                                   |
                v                                                   v
+-------------------------------+               +-----------------------------------+
|  PRIMARY POSTGRESQL / CLOUD   |               |   AUDIT LOGS & EVENT STREAM       |
|  - Users & Roles (RBAC)       |               |   - SOC2 Compliance Action Trails |
|  - Products & Variants Matrix |               |   - Nightly Automated Snapshots   |
|  - Inventory Ledger & Stocks  |               |   - Courier Webhook Settlements   |
|  - Orders & BD Shipments      |               |   - GDPR Right to Erasure Records |
+-------------------------------+               +-----------------------------------+`)}
                  className="absolute right-3 top-3 p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded cursor-pointer"
                  title="Copy Diagram"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <pre>{`+-----------------------------------------------------------------------------------+
|                        CUSTOMER CLIENT & SARTORIAL STOREFRONT                     |
|    React 19 + Tailwind CSS + TanStack Query + Motion + Responsive Mega-Menu       |
+-----------------------------------------------------------------------------------+
                                          |  (HTTPS / REST / WebSocket)
                                          v
+-----------------------------------------------------------------------------------+
|                 EXPRESS & NODE.JS BUSINESS ENGINE (API GATEWAY)                  |
|    - RBAC & Role Permission Firewall (Superadmin, Product Mgr, Inventory Mgr)     |
|    - Multi-Factor Auth (MFA SMS / TOTP) Challenge Handler                         |
|    - Payment Gateway Adapters (bKash Tokenized, Nagad Direct, Sonali Bank SPG)    |
|    - Real-time Inventory Concurrency & Stock Reservation Mutex                    |
|    - Accurate COGS & Financial Calculation Engine                                 |
+-----------------------------------------------------------------------------------+
                                          |
                +-------------------------+-------------------------+
                |                                                   |
                v                                                   v
+-------------------------------+               +-----------------------------------+
|  PRIMARY POSTGRESQL / CLOUD   |               |   AUDIT LOGS & EVENT STREAM       |
|  - Users & Roles (RBAC)       |               |   - SOC2 Compliance Action Trails |
|  - Products & Variants Matrix |               |   - Nightly Automated Snapshots   |
|  - Inventory Ledger & Stocks  |               |   - Courier Webhook Settlements   |
|  - Orders & BD Shipments      |               |   - GDPR Right to Erasure Records |
+-------------------------------+               +-----------------------------------+`}</pre>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                  <h5 className="font-bold text-neutral-900 mb-1">Storefront Subsystem</h5>
                  <p className="text-neutral-600 text-xs leading-relaxed">
                    Ultra-fast server-driven garment catalog discovery with instant variant selection, size chart modal, cart drawer, and multi-step checkout.
                  </p>
                </div>
                <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                  <h5 className="font-bold text-neutral-900 mb-1">Business Management Subsystem</h5>
                  <p className="text-neutral-600 text-xs leading-relaxed">
                    Role-based operational dashboard for stock adjustments, packing slip generation, supplier purchase orders, and accurate profit/loss tracking.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'schema' && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold uppercase tracking-wider text-neutral-950">Relational Database Entity Relationship (ER) Model</h4>
              <p className="text-neutral-600 leading-relaxed">
                PostgreSQL normalized schema with primary keys, composite variant indexes, foreign key constraints, and numeric precision for currency.
              </p>

              <div className="bg-neutral-900 text-neutral-200 p-4 rounded-xl font-mono text-[11px] leading-relaxed border border-neutral-800 overflow-x-auto">
                <pre>{`-- 1. USERS & RBAC TABLE
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uid VARCHAR(128) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(150),
  phone_number VARCHAR(30),
  role VARCHAR(50) DEFAULT 'customer' CHECK (role IN ('superadmin','admin','product_manager','inventory_manager','order_manager','accountant','customer')),
  mfa_enabled BOOLEAN DEFAULT FALSE,
  mfa_method VARCHAR(20) DEFAULT 'none',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. PRODUCTS & MULTI-VARIANTS TABLE
CREATE TABLE products (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  sku VARCHAR(100) UNIQUE NOT NULL,
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100),
  brand VARCHAR(100),
  regular_price NUMERIC(12,2) NOT NULL,
  discounted_price NUMERIC(12,2) NOT NULL,
  fabric VARCHAR(150),
  gsm INTEGER,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE product_variants (
  id VARCHAR(64) PRIMARY KEY,
  product_id VARCHAR(64) REFERENCES products(id) ON DELETE CASCADE,
  sku VARCHAR(100) UNIQUE NOT NULL,
  size VARCHAR(20) NOT NULL,
  color VARCHAR(100) NOT NULL,
  purchase_price NUMERIC(12,2) NOT NULL, -- Used for COGS
  stock INTEGER NOT NULL DEFAULT 0,
  reserved_stock INTEGER NOT NULL DEFAULT 0,
  min_stock_alert INTEGER DEFAULT 5,
  CONSTRAINT positive_stock CHECK (stock >= 0)
);

-- 3. INVENTORY TRANSACTION LEDGER
CREATE TABLE inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id VARCHAR(64) REFERENCES products(id),
  variant_sku VARCHAR(100) NOT NULL,
  transaction_type VARCHAR(50) NOT NULL, -- opening_stock, purchase, sales, sales_return, stock_adjustment, damaged_stock
  quantity_in INTEGER DEFAULT 0,
  quantity_out INTEGER DEFAULT 0,
  previous_quantity INTEGER NOT NULL,
  new_quantity INTEGER NOT NULL,
  reference_number VARCHAR(100),
  remarks TEXT,
  transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id VARCHAR(255)
);

-- 4. ORDERS & FULFILLMENT
CREATE TABLE orders (
  id VARCHAR(64) PRIMARY KEY,
  order_number VARCHAR(64) UNIQUE NOT NULL,
  customer_id VARCHAR(128) NOT NULL,
  customer_name VARCHAR(150) NOT NULL,
  contact_number VARCHAR(30) NOT NULL,
  shipping_address JSONB NOT NULL,
  subtotal NUMERIC(12,2) NOT NULL,
  discount NUMERIC(12,2) DEFAULT 0,
  shipping_fee NUMERIC(12,2) DEFAULT 0,
  grand_total NUMERIC(12,2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL, -- bkash, nagad, sonali, card, bank_transfer, cod
  payment_status VARCHAR(50) DEFAULT 'pending',
  order_status VARCHAR(50) DEFAULT 'pending_payment',
  transaction_id VARCHAR(100),
  tracking_number VARCHAR(100),
  order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`}</pre>
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold uppercase tracking-wider text-neutral-950">REST API Architecture & Endpoints</h4>
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px]">GET</span>
                    <span className="font-bold text-neutral-950">/api/products</span>
                  </div>
                  <p className="text-neutral-600 font-sans text-xs">Retrieve paginated catalog with category, price range, and size filters.</p>
                </div>

                <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">POST</span>
                    <span className="font-bold text-neutral-950">/api/orders/checkout</span>
                  </div>
                  <p className="text-neutral-600 font-sans text-xs">
                    Place order with atomic variant stock lock, division-based delivery calculation, and bKash/Nagad gateway tokenization.
                  </p>
                </div>

                <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">POST</span>
                    <span className="font-bold text-neutral-950">/api/payments/bkash/callback</span>
                  </div>
                  <p className="text-neutral-600 font-sans text-xs">
                    Idempotent webhook callback for bKash merchant payment verification and status transition to 'paid'.
                  </p>
                </div>

                <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-bold text-[10px]">PATCH</span>
                    <span className="font-bold text-neutral-950">/api/inventory/adjust</span>
                  </div>
                  <p className="text-neutral-600 font-sans text-xs">
                    Adjust variant stock with recorded transaction type, reason, and auditor signature.
                  </p>
                </div>

                <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px]">GET</span>
                    <span className="font-bold text-neutral-950">/api/finance/profit-and-loss</span>
                  </div>
                  <p className="text-neutral-600 font-sans text-xs">
                    Computes Gross Sales, Discounts, Net Sales, exact FIFO/weighted COGS, Operating Expenses, and Net Profit.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'concurrency' && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold uppercase tracking-wider text-neutral-950">High-Concurrency Stock Locking & Concurrency Control</h4>
              <p className="text-neutral-600 leading-relaxed">
                Garments sales experience massive surges during Eid and seasonal drops. The platform implements an atomic reservation protocol to prevent overselling or race conditions.
              </p>

              <div className="bg-neutral-950 text-neutral-200 p-4 rounded-xl font-mono text-[11px] leading-relaxed border border-neutral-800">
                <pre>{`-- ATOMIC STOCK RESERVATION PROTOCOL:
BEGIN TRANSACTION;

-- 1. Acquire row-level lock on specific garment variant
SELECT stock, reserved_stock 
FROM product_variants 
WHERE id = :variantId 
FOR UPDATE;

-- 2. Verify stock availability (excluding existing reservations)
IF (stock - reserved_stock) >= :orderQty THEN
    -- Reserve the quantity atomically
    UPDATE product_variants
    SET reserved_stock = reserved_stock + :orderQty
    WHERE id = :variantId;

    -- Create pending order with 15-minute checkout timer
    INSERT INTO orders (...) VALUES (...);

    COMMIT;
ELSE
    -- Stock exhausted by concurrent customer
    ROLLBACK;
    RAISE EXCEPTION 'OUT_OF_STOCK_RACE_PREVENTED';
END IF;`}</pre>
              </div>

              <div className="p-4 bg-emerald-50 text-emerald-950 rounded-xl border border-emerald-200">
                <h5 className="font-bold text-xs mb-1">Stock Release on Payment Timeout / Cancellation</h5>
                <p className="text-neutral-600 text-xs">
                  If the bKash or Nagad payment window expires or the order is cancelled, the reserved stock is instantly returned to available inventory and an audit log event is recorded.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'deployment' && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold uppercase tracking-wider text-neutral-950">CI/CD & Production Deployment</h4>
              <p className="text-neutral-600 leading-relaxed">
                Configured for containerized cloud deployment with automated building, testing, and zero-downtime releases.
              </p>

              <div className="bg-neutral-950 text-neutral-200 p-4 rounded-xl font-mono text-[11px] leading-relaxed border border-neutral-800">
                <pre>{`# 1. Install locked dependencies
npm install

# 2. Run TypeScript check & linter
npm run lint

# 3. Production build
npm run build

# 4. Preview / Launch server
npm run preview

# Docker Deployment:
docker build -t aura-garments:latest .
docker run -p 3000:3000 -e PORT=3000 aura-garments:latest`}</pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-50 border-t border-neutral-200 text-right shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-900 text-white rounded-lg font-bold text-xs hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            Close Documentation
          </button>
        </div>
      </div>
    </div>
  );
};
