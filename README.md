# 🛍️ VoiceShop — Voice-Powered E-Commerce

A full-stack voice-driven e-commerce app for India. Speak your shopping commands in Indian English and the app filters products, manages your cart, and places orders — hands-free.

---

## 🗂️ Project Structure

```
voice-shop/
  client/          ← Vite + React + TailwindCSS
  server/          ← Node.js + Express + MongoDB
```

---

## 🚀 Quick Start

### 1. Start the Frontend (Client)

```bash
cd client
npm install
npm run dev
```
Open: **http://localhost:5173**

### 2. Start the Backend (Server)

```bash
cd server
npm install
node index.js
```
API runs at: **http://localhost:5000**

### 3. Seed the Database (requires MongoDB running)

```bash
# Make sure MongoDB is running first
cd server
node seed.js
```

---

## 🎙️ Voice Commands

| Say this… | What happens |
|---|---|
| "show me red shirts" | Filters ProductGrid to red shirts |
| "jeans under 2000" | Shows jeans below ₹2000 |
| "blue shoes above 3000" | Color + price + category filter |
| "add to cart" | Adds first filtered product to cart |
| "remove from cart" | Removes last cart item |
| "checkout" / "place order" | Opens cart + places order |
| "next page" | (Pagination hook ready) |

**Keyboard shortcut:** Press `Space` to toggle the microphone.

---

## ⚙️ Environment Variables

### `client/.env`
```env
VITE_USE_AI=false            # Set true to enable OpenAI fallback
VITE_API_URL=http://localhost:5000
VITE_OPENAI_API_KEY=         # Only needed if VITE_USE_AI=true
```

### `server/.env`
```env
MONGODB_URI=mongodb://localhost:27017/voiceshop
JWT_SECRET=your_secret_here
PORT=5000
```

---

## 🏗️ Architecture

```
Voice Input (SpeechRecognition)
    ↓
useVoiceCommands.js   → transcript string
    ↓
parseIntent.js        → { action, category, color, priceMax, priceMin }
    ↓
App.jsx dispatcher
    ├── "search"       → filter ProductGrid + GET /api/products
    ├── "addToCart"    → CartSidebar + POST /api/cart/add
    ├── "removeFromCart" → CartSidebar + DELETE /api/cart/last
    └── "checkout"     → POST /api/orders/checkout
```

---

## 🗃️ API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | — | Login, returns JWT |
| POST | `/api/auth/register` | — | Register new user |
| GET | `/api/products` | — | List products (query: category, color, price_max, price_min) |
| GET | `/api/products/:id` | — | Single product |
| GET | `/api/cart` | JWT | Get user's cart |
| POST | `/api/cart/add` | JWT | Add product to cart |
| DELETE | `/api/cart/last` | JWT | Remove last cart item |
| POST | `/api/orders/checkout` | JWT | Create order from cart |
| GET | `/api/orders` | JWT | Order history |
| GET | `/health` | — | Server health check |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TailwindCSS 3 |
| Voice | Web Speech API (`SpeechRecognition`, en-IN) |
| HTTP Client | Axios |
| Backend | Node.js, Express 4 |
| Database | MongoDB, Mongoose 8 |
| Auth | JWT (jsonwebtoken), bcryptjs |
| AI (optional) | OpenAI `gpt-4o-mini` |

---

## 📦 Guest Account

The seed script creates a guest user automatically:
- **Email:** `guest@voiceshop.in`
- **Password:** `guest123`
