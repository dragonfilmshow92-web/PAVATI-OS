# Tioras Fashions Studio - Retail POS & Inventory Suite

A modern, high-performance Retail Point of Sale (POS), Inventory, and Business Management system built for apparel, boutiques, and retail stores.

---

## 🌟 Key Features

- **⚡ Fast Touch POS & Barcode Checkout**: Instant barcode scanning, keyboard shortcuts (`F1`-`F9`), quick item lookup, price overrides, held carts, and instant thermal receipt printing.
- **💳 Dynamic UPI QR Code Engine**: Automated payment QR codes for Google Pay, PhonePe, Paytm, and BHIM UPI with exact bill amounts.
- **📦 Real-Time Inventory & Barcode Labels**: Track stock levels, variants, low stock alerts, supplier Goods Received Notes (GRN), and print custom barcode price stickers.
- **📊 Analytics & Business Reports**: Daily sales, profit margins, sales by payment mode, expense tracking, customer ledger, and shift register closure reports.
- **🔄 Sales Returns & Credit Notes**: Fast exchange/returns workflow with auto-generated credit notes and ledger updates.
- **🎟️ Coupons & Promotions Engine**: Percentage and flat discount promo codes with min-spend and validity limits.
- **👥 Customer CRM & Loyalty**: Track customer purchase history, loyalty points, store credit balance, and service reminders.
- **☁️ Cloud & Local Hybrid**: Powered by MongoDB Atlas with full offline resilience, Electron standalone desktop app, supermarket kiosk mode, and Vercel cloud deployment.

---

## 🚀 Quick Start

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MongoDB Atlas](https://www.mongodb.com/atlas) or a local MongoDB instance

### 2. Setup Environment Variables
Copy `.env.example` to `.env` in the root folder and configure your MongoDB connection:
```bash
cp .env.example .env
```
Edit `.env`:
```env
PORT=3000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
POS_API_KEY=your-secure-pos-key
```

### 3. Install Dependencies & Build
```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..

# Build frontend production bundle
npm run build
```

### 4. Run the Application

#### Option A: Web Mode
```bash
npm start
```
Access the application at [http://localhost:3000](http://localhost:3000).

#### Option B: Standalone Desktop Mode (Windows)
Double-click `start-pos.bat` or run:
```bash
npm run desktop
```

#### Option C: Fullscreen Kiosk Mode (Cash Register)
```bash
npm run kiosk
```

---

## 📁 Project Structure

```
retail-pos/
├── api/                    # Serverless entry point for Vercel deployment
├── client/                 # Production static build served by Node / Desktop
├── desktop/                # Electron standalone desktop & kiosk launcher
├── frontend/               # Modern React + Vite frontend source code
│   ├── src/
│   │   ├── components/     # UI modals, header, sidebar, barcode stickers
│   │   ├── context/        # Global POS application state
│   │   ├── pages/          # POS, Inventory, Reports, Returns, Coupons, etc.
│   │   └── utils/          # Thermal printing, formatters
├── server/                 # Express-free lightweight high-throughput Node.js backend
│   ├── models/             # Mongoose schemas (Item, Invoice, Shift, Customer, etc.)
│   ├── db-mongo.js         # MongoDB connection & CRUD service layer
│   └── server.js           # HTTP server, REST endpoints, static file handler
├── launch-desktop-app.bat  # Fast desktop launcher
├── launch-kiosk-app.bat    # Fullscreen kiosk launcher
└── vercel.json             # Vercel deployment configuration
```

---

## 🌐 Deploy to Vercel

1. Push this repository to your GitHub account.
2. Import the repository into [Vercel](https://vercel.com).
3. Set the following Environment Variables in the Vercel project settings:
   - `MONGODB_URI`: Your MongoDB Atlas connection string.
   - `POS_API_KEY`: Your POS API key.
4. Deploy! Vercel will automatically build the React frontend and deploy the serverless API.

---

## 📄 License

MIT © [Tioras Fashions Studio](https://github.com/tyoras9686-ui/Tioras-Fashions-Studio)
