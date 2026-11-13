# TheSteps — Modern E-Commerce & Business Management Platform (Bangladesh)

> **The Ultimate Online Shopping BD Experience** · Full-featured multi-department marketplace storefront, EPS digital checkout, local-drive media optimizer, real-time inventory ledger, and role-based ERP dashboard built with **React 19**, **TypeScript**, **Tailwind CSS v4**, and **Firebase / Cloud Firestore**.

---

## Live Environments & Metadata

| Item | Details |
| --- | --- |
| **Brand Name** | **TheSteps** (`thesteps.com.bd`) |
| **Development URL** | https://ais-dev-o65z4twbgppluzgf3ks6gh-135013076922.asia-southeast1.run.app |
| **Shared Preview URL** | https://ais-pre-o65z4twbgppluzgf3ks6gh-135013076922.asia-southeast1.run.app |
| **Currency & Localization** | Bangladeshi Taka (`৳` BDT) · Bilingual **English (`en`)** & **Bengali (`bn`)** |
| **Database Engine** | Cloud Firestore (`ai-studio-1a418eef-cb15-4548-9402-e9592242d773`) with `localStorage` offline persistence |
| **Platform Contact** | `support@thesteps.com.bd` · `01326052866 (9am–6pm)` |
| **Operations Hubs** | Horogram Bazar, Rajpara, Rajshahi · Dhaka Hub: Uttara Sector-11 |
| **Platform Owner Email** | `faruk017@gmail.com` |

---

## Key Capabilities & Features

### 1. Customer Storefront & Discovery
- **12+ Product Departments** (with English & Bengali labels):
  - Mobile & Gadgets (`mobile-gadgets`), Audio & Headphones (`audio-headphones`), Computer & Office (`computer-office`), Home Appliances (`home-appliances`), Health & Beauty (`health-beauty`), Fashion (`fashion`), Furniture & Decor (`furniture-decor`), Household & Kitchenware (`household-kitchenware`), Electronics Accessories (`electronics-accessories`), Baby & Kids (`baby-kids`), Daily Needs (`daily-needs`), and Sports & Fitness (`sports-fitness`).
- **Flash Sale Engine**: Live countdown timer (`tabular-nums`), discount percentage badges, stock-sold progress bars, and remaining flash inventory counter.
- **Catalog Filtering & Sorting**: Real-time keyword search (name, brand, shop, fabric/material, SKU, category), popular keyword chips, "In Stock Only" toggle, and sorting by Featured Deals, New Arrivals, Price (Low→High / High→Low), and Top Rated.
- **Interactive Product Details**: Multi-image gallery, color & size/edition variant selector with live stock calculation (`stock - reservedStock`), garment size & measurement guide modal, verified customer reviews & submission, and **Customer Price Bidding** (`BidModal`) on bid-eligible items.
- **Voucher Center & Coupons**: Built-in promo vouchers (`SMART10`, `DEAL250`, `BEAUTY150`), collect-to-account workflow, minimum-spend validation, and percentage/fixed cap calculations.
- **Order Tracking & Invoices**: Instant tracking modal (`TrackOrderModal`) and print-ready invoice view (`InvoiceModal`).

### 2. Multi-Step Checkout & Easy Payment System (EPS)
- **Bangladesh 8-Division & District Matrix**: Full coverage across **Dhaka, Chittagong, Sylhet, Rajshahi, Khulna, Barisal, Rangpur, and Mymensingh** with mapped districts/cities and Upazila/Thana entry.
- **Smart Delivery Fee Engine**:
  - **Free Shipping** automatically applied on orders **৳2,500+**.
  - **Inside Dhaka**: `৳60`
  - **Outside Dhaka**: `৳120`
- **EPS Integrated Payment Channels (21 Methods across 4 Categories)**:
  - **Cards (5)**: VISA, Master Card, American Express, Dutch Bangla VISA Card, Dutch Bangla Master Card (EMI-supported).
  - **Internet Banking (4)**: Southeast Bank, Meghna Bank LTD, Islami Bank, Al-Arafah Islami Bank *(plus legacy `sonali` / `card` channel mappings)*.
  - **Mobile Banking / MFS (10)**: bKash, Nagad, Rocket, Ok Wallet, Meghna pay, Sheba pay, Islamic Wallet, Upay, Tap, MCash.
  - **Offline / Legacy (2)**: Cash on Delivery (COD) and Corporate Bank Deposit (deposit slip / routing reference).
- **Interactive Payment Gateway Simulation** (`PaymentGatewayModal` & `EpsPaymentOptionsModal`) with transaction ID recording, stock deduction/reservation, and instant order confirmation (`OrderSuccessModal`).

### 3. Local Drive Image Upload & Optimization
- **Zero-External-Upload Client Pipeline** (`LocalImageUploader.tsx` & `src/utils/imageUtils.ts`):
  - Drag-and-drop or file picker directly from the user's local drive (`PNG`, `JPEG`, `WebP`, `AVIF`, `SVG`, `GIF`).
  - Automatic aspect-ratio-preserving resize (default product cap `960×1200`, profile avatars `256×256`), high-quality smoothing, and WebP/JPEG compression (`quality: 0.78`–`0.80`) with real-time payload byte estimation and savings stats.
  - Integrated into both **Product Create/Edit** (`ProductFormModal`) and **User Profile Avatar** (`AuthModal`).

### 4. Authentication, RBAC & Multi-Factor Security
- **Three Sign-In Paths** (`AuthContext.tsx` & `AuthModal.tsx`):
  1. **Google OAuth** via Firebase Authentication (`signInWithPopup`).
  2. **Quick Mobile + 4-Digit PIN/OTP Login** for 11-digit Bangladeshi mobile numbers (`01XXX-XXXXXX`).
  3. **Role Switcher (Demo / Operational Profiles)** for testing RBAC permissions across roles.
- **8 Role-Based Access Control (RBAC) Roles**:
  - `superadmin`, `admin`, `seller`, `product_manager`, `inventory_manager`, `order_manager`, `accountant`, `customer`.
- **Multi-Factor Authentication (MFA)**: Configurable `sms`, `email`, or `totp` verification toggle per user profile.
- **Customer Portal** (`CustomerPortalModal.tsx`): Saved shipping addresses, wishlist management, collected vouchers, order history, cancellation requests, and invoice printing.

### 5. Admin & Seller ERP Dashboard (`AdminDashboard.tsx`)
8 dedicated operational tabs:
1. **Analytics**: Date-range filtering (`today`, `7days`, `month`, `year`, `all`), KPI cards, sales performance, and low-stock alerts.
2. **Products**: Full Create, Read, Update, and Delete (`ProductFormModal`, `DeleteProductModal`), multi-variant SKU/stock/COGS pricing matrix, flash deal flags, bidding toggles, and local-drive image uploads.
3. **Inventory**: Variant-level stock adjustments (`stock_adjustment`, `damaged_stock`) and immutable `InventoryTransaction` ledger (`opening_stock`, `purchase`, `sales`, `sales_return`, `purchase_return`, `stock_adjustment`, `damaged_stock`, `cancellation`).
4. **Orders**: End-to-end fulfillment pipeline (`pending_payment` → `paid` → `confirmed` → `processing` → `packed` → `shipped` → `delivered` / `cancelled` / `returned` / `refunded`) with automatic stock restoration on cancellation.
5. **Bids & Vouchers**: Accept, counter-offer, or decline customer bids; create and toggle storewide promotional coupons.
6. **Suppliers & Purchase Orders**: Manage vendor directory (`Supplier`), issue purchase orders (`PurchaseOrder`), and receive shipments to auto-replenish variant stock and log purchase expenses.
7. **Finance (P&L)**: Automated **Gross Sales**, **Discounts**, **Returns & Refunds**, **Net Sales**, **COGS**, **Gross Profit**, **Operating Expenses**, **EPS Payment Gateway Fees (1.5% on digital payments)**, **Net Profit**, **Profit Margin %**, and **Inventory Asset Valuation**.
8. **Audit, Backups & Exports**:
   - **CSV Reports**: Sales CSV, Inventory Valuation CSV, Financial P&L CSV.
   - **JSON Snapshots**: Full cluster database backup download (`runManualBackup`).
   - **GDPR & SOC2 Compliance** (`GdprModal.tsx`): Article 20 data portability export (`gdprExportUserData`), Article 17 PII anonymization/erasure (`gdprEraseUserData`), and append-only audit logs.

### 6. In-App Developer & Skill Documentation
- **Architecture & Docs Modal** (`DevDocsModal.tsx`): System clean-architecture diagram, PostgreSQL ER schema reference, REST API endpoints, atomic stock concurrency protocol, deployment guide, and an embedded **Prisma Composer Skill (`SKILL.md`, `@prisma/composer` v0.38.0)** viewer/downloader sourced from `/assets/aistudio/SKILL_b9444db2.md`.
- **Workspace Skill File**: Stored at `/skills/prisma-composer-core-concepts/SKILL.md`.

---

## Tech Stack

- **Frontend**: React `^19.0.1`, TypeScript `^7.0.2`, Vite `^8.3.0`
- **Styling & Animation**: Tailwind CSS `^4.3.3` (`@tailwindcss/vite`), `lucide-react` `^0.546.0`, `motion` `^12.23.24`
- **Backend / Database / Auth**: Firebase `^13.3.0` (Cloud Firestore + Firebase Auth), Express `^4.21.2` (available for server extensions), `@google/genai` `^2.4.0`, `dotenv` `^17.2.3`
- **Typography**: Google Fonts (`Poppins`, `Hind Siliguri` for Bengali script, `JetBrains Mono` for SKUs/prices/codes)

---

## Project Structure

```text
/
├── index.html                        # HTML entry point, SEO/OG metadata, Google Fonts
├── metadata.json                     # App capability & metadata manifest
├── package.json                      # Dependencies and npm scripts
├── vite.config.ts                    # Vite + React + Tailwind v4 configuration
├── tsconfig.json                     # TypeScript compiler configuration
├── .env.example                      # Environment variable template (no secrets)
├── firebase-applet-config.json       # Firebase project & Firestore database binding
├── firebase-blueprint.json           # Firestore entity & collection schema blueprint
├── firestore.rules                   # Hardened Firestore security rules (RBAC & validation)
├── public/
│   └── assets/aistudio/
│       └── SKILL_b9444db2.md         # Prisma Composer core concepts skill asset
├── skills/
│   └── prisma-composer-core-concepts/
│       └── SKILL.md                  # Canonical workspace copy of Prisma Composer skill
└── src/
    ├── App.tsx                       # Root storefront layout, filters, flash sale, modal wiring
    ├── main.tsx                      # React DOM mount
    ├── index.css                     # Tailwind CSS v4 entry & custom design tokens
    ├── assets/images/                # Local bundled campaign & product photography
    ├── config/
    │   ├── constants.ts              # BD divisions/districts, categories, seed catalog/orders
    │   ├── epsPaymentOptions.ts      # EPS payment gateway channels & helper resolvers
    │   ├── firebase.ts               # Firebase app, Auth, Firestore initialization & health check
    │   └── mediaAssets.ts            # Static media asset exports
    ├── context/
    │   ├── AuthContext.tsx           # Google OAuth, Mobile+PIN login, RBAC roles, MFA, wishlist
    │   ├── CartContext.tsx           # Variant stock checks, coupon validation, division shipping
    │   ├── LanguageContext.tsx       # EN / BN bilingual dictionary & ৳ price formatting
    │   ├── NotificationContext.tsx   # Real-time toasts & persistent notification drawer state
    │   └── StoreContext.tsx          # Catalog, orders, ledger, POs, P&L, GDPR, CSV/JSON exports
    ├── types/
    │   └── index.ts                  # Shared TypeScript interfaces and domain types
    ├── utils/
    │   ├── firestoreError.ts         # Structured Firestore error reporting
    │   └── imageUtils.ts             # Client-side image resize, WebP/JPEG compression & sizing
    └── components/
        ├── auth/
        │   ├── AuthModal.tsx         # Sign-in, mobile+PIN, role switcher, avatar upload, MFA
        │   └── CustomerPortalModal.tsx # Orders, wishlist, saved addresses, collected vouchers
        ├── checkout/
        │   ├── CheckoutModal.tsx     # 3-step shipping, review, and EPS payment selector
        │   ├── EpsPaymentBadge.tsx   # SVG/vector payment brand badges
        │   ├── EpsPaymentOptionsModal.tsx # Full EPS channel directory modal
        │   ├── OrderSuccessModal.tsx # Post-order confirmation & tracking summary
        │   └── PaymentGatewayModal.tsx # Interactive gateway authorization flow
        ├── common/
        │   ├── DevDocsModal.tsx      # Architecture, ER SQL, API, concurrency & SKILL.md viewer
        │   ├── Footer.tsx            # Brand info, compliance links & mobile quick nav
        │   ├── GdprModal.tsx         # GDPR Article 17 erasure & Article 20 export tools
        │   ├── Header.tsx            # Sticky header, search, category nav, cart/user triggers
        │   ├── InvoiceModal.tsx      # Printable order invoice
        │   ├── LocalImageUploader.tsx # Drag-and-drop local drive image optimizer
        │   ├── NotificationDrawer.tsx # Real-time order, stock & security alerts drawer
        │   └── SizeGuideModal.tsx    # Garment sizing & measurement chart
        ├── dashboard/
        │   ├── AdminDashboard.tsx    # 8-tab ERP & seller management console
        │   ├── DeleteProductModal.tsx # Product deletion confirmation dialog
        │   └── ProductFormModal.tsx  # Product create/edit, variants matrix & image uploader
        └── storefront/
            ├── BidModal.tsx          # Customer price-offer modal
            ├── CartDrawer.tsx        # Slide-over shopping cart & voucher applier
            ├── HeroBanner.tsx        # Department sidebar, campaign hero & 4-pillar trust strip
            ├── ProductCard.tsx       # Product tile with flash badge, quick add & bid button
            ├── ProductDetailModal.tsx # Variant selector, specs, reviews & instant checkout
            ├── TrackOrderModal.tsx   # Live order status & courier tracking lookup
            └── VoucherCenterModal.tsx # Active promo codes & one-click voucher collection
```

---

## Firestore Database Architecture & Security Rules

Defined in `firebase-blueprint.json` and enforced in `firestore.rules` (default-deny global fallback):

| Collection | Access Policy | Purpose |
| --- | --- | --- |
| `/users/{userId}` | Owner read/limited update; Admin full access; no self role escalation | User profiles, roles, MFA config, addresses, wishlist, vouchers |
| `/admins/{adminId}` | Owner/Admin read; Admin write | Fast admin role registry (`faruk017@gmail.com` bootstrapper) |
| `/products/{productId}` | Public read; Verified Seller/Admin create/update; Admin delete | Product catalog, variants, stock, flash deals |
| `/orders/{orderId}` | Customer read/create own; Customer cancel early status; Admin full | Customer orders, EPS payment status, status history |
| `/bids/{bidId}` | Customer read/create own (`pending`); Seller/Admin respond | Price negotiation offers |
| `/coupons/{couponId}` | Public read; Admin write | Storewide & shop promo vouchers |
| `/inventory_transactions/{txId}` | Admin only | Traceable stock movement ledger |
| `/suppliers/{supplierId}` | Admin only | Vendor & distributor directory |
| `/expenses/{expenseId}` | Admin only | Operating & purchase order expenses |
| `/notifications/{notifId}` | Scoped to recipient `userId` or Admin | Order, inventory & system notifications |
| `/audit_logs/{logId}` | Verified user create; Admin read; **updates & deletes forbidden** | Immutable compliance & security audit trail |

---

## Environment Variables

Configure runtime variables using `.env.example` as your template (never commit `.env` or secrets):

```env
GEMINI_API_KEY="MY_GEMINI_API_KEY"
APP_URL="MY_APP_URL"
```

---

## Local Development & Verification

### Prerequisites
- Node.js `v22+` and `npm`

### Commands

```bash
# 1. Install dependencies
npm install

# 2. Start development server on port 3000
npm run dev

# 3. Typecheck (TypeScript strict check)
npm run lint

# 4. Build production bundle
npm run build

# 5. Preview production build
npm run preview
```

---

## Offline Persistence & Data Portability

- All store entities (`sd_products`, `sd_orders`, `sd_transactions`, `sd_suppliers`, `sd_pos`, `sd_expenses`, `sd_coupons`, `sd_bids`, `sd_audit_logs`, `sd_cart`, `sd_auth_user`) sync transparently with `localStorage` so the storefront and dashboard remain functional even when Firestore is offline or in local demo mode.
- Full cluster backups (`TheSteps_Database_Backup_YYYY-MM-DD.json`) and CSV financial/sales/inventory exports can be generated directly from the Admin Dashboard.
