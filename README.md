# Supermarket Electricity Billing System (Single Shop)

A dedicated, high-performance electricity billing management system designed for a single supermarket entity to track monthly energy consumption and generate invoices.

## 🚀 Features
- **Shop Setup (One-Time)**: Register your supermarket details, including owner name, address, meter number, and starting reading.
- **Monthly Meter Entry**: Simple interface to input current meter readings.
- **Automated Calculations**: 
  - Automatically fetches the previous reading from storage.
  - Calculates units used and applies the tiered tariff.
- **Tiered Tariff Logic**:
  - 0–100 units → ₹2 per unit
  - 101–300 units → ₹4 per unit
  - Above 300 units → ₹6 per unit
  - Fixed monthly charge → ₹50
- **Billing History**: View a complete chronological record of past bills.
- **Responsive Design**: Works perfectly on mobile phones, tablets, and laptops.
- **Persistent Storage**:
  - **Web Version**: Uses LocalStorage for seamless browser persistence.
  - **C Backend**: Stores data in binary files (`.dat`) for CLI use.

## 📂 File Structure
```text
electricity-billing/
├── index.html          # Main Dashboard
├── style.css           # Premium Styling
├── script.js           # Automated Logic
├── backend/
│   ├── billing_system.c    # core C logic
│   └── data/               # binary data storage
└── README.md
```

## ⚙️ Deployment & Running

### 1. Deploying to Netlify (Recommended)
This system is ready for one-click deployment to Netlify:
1. **Upload**: Drag and drop this entire project folder into the Netlify "Drop" zone.
2. **Publish**: Netlify will automatically use `index.html` as the entry point.
3. **Storage**: Data is stored securely in the local browser storage.

### 2. Local Terminal (C Engine)
To run the management system via CLI:
1. Navigate to the `backend/` directory.
2. Compile: `gcc billing_system.c -o billing_system`
3. Run: `./billing_system.exe`

---
*Optimized for standalone supermarket energy management.*
