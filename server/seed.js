/**
 * seed.js — Populates the database with 20 sample products and a guest user
 * Run: node seed.js  (from server/ directory)
 */

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Product = require("./models/Product");
const User = require("./models/User");

const PRODUCTS = [
  // ── SHIRTS (5) ──────────────────────────────────────────────────────────────
  {
    title: "Classic White Linen Shirt",
    category: "shirts",
    price: 799,
    color: "white",
    stock: 50,
    images: ["https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&q=80"],
  },
  {
    title: "Slim Fit Blue Oxford Shirt",
    category: "shirts",
    price: 1199,
    color: "blue",
    stock: 30,
    images: ["https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=400&q=80"],
  },
  {
    title: "Casual Black Check Shirt",
    category: "shirts",
    price: 999,
    color: "black",
    stock: 25,
    images: ["https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400&q=80"],
  },
  {
    title: "Floral Print Red Shirt",
    category: "shirts",
    price: 1499,
    color: "red",
    stock: 15,
    images: ["https://images.unsplash.com/photo-1604695573706-53170668f6a6?w=400&q=80"],
  },
  {
    title: "Mandarin Collar Green Shirt",
    category: "shirts",
    price: 1299,
    color: "green",
    stock: 20,
    images: ["https://images.unsplash.com/photo-1607345366928-199ea26cfe3e?w=400&q=80"],
  },

  // ── JEANS (4) ───────────────────────────────────────────────────────────────
  {
    title: "Slim Fit Dark Blue Jeans",
    category: "jeans",
    price: 1899,
    color: "blue",
    stock: 40,
    images: ["https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&q=80"],
  },
  {
    title: "Straight Cut Black Jeans",
    category: "jeans",
    price: 2199,
    color: "black",
    stock: 35,
    images: ["https://images.unsplash.com/photo-1604176354204-9268737828e4?w=400&q=80"],
  },
  {
    title: "Relaxed Fit Grey Jeans",
    category: "jeans",
    price: 1599,
    color: "grey",
    stock: 22,
    images: ["https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400&q=80"],
  },
  {
    title: "Distressed White Jeans",
    category: "jeans",
    price: 2499,
    color: "white",
    stock: 18,
    images: ["https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&q=80"],
  },

  // ── KURTAS (4) ──────────────────────────────────────────────────────────────
  {
    title: "Festive Yellow Silk Kurta",
    category: "kurtas",
    price: 2999,
    color: "yellow",
    stock: 12,
    images: ["https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400&q=80"],
  },
  {
    title: "Embroidered White Cotton Kurta",
    category: "kurtas",
    price: 1799,
    color: "white",
    stock: 28,
    images: ["https://images.unsplash.com/photo-1594938298603-c8148c4b2f04?w=400&q=80"],
  },
  {
    title: "Block Print Blue Kurta",
    category: "kurtas",
    price: 2299,
    color: "blue",
    stock: 16,
    images: ["https://images.unsplash.com/photo-1575428652377-a2d80e2277fc?w=400&q=80"],
  },
  {
    title: "Nehru Collar Maroon Kurta",
    category: "kurtas",
    price: 3499,
    color: "maroon",
    stock: 10,
    images: ["https://images.unsplash.com/photo-1568252542512-9fe8fe9c87bb?w=400&q=80"],
  },

  // ── SHOES (4) ───────────────────────────────────────────────────────────────
  {
    title: "Running White Sneakers",
    category: "shoes",
    price: 3999,
    color: "white",
    stock: 45,
    images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80"],
  },
  {
    title: "Classic Black Leather Oxford",
    category: "shoes",
    price: 5499,
    color: "black",
    stock: 20,
    images: ["https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=400&q=80"],
  },
  {
    title: "Casual Brown Loafers",
    category: "shoes",
    price: 2999,
    color: "brown",
    stock: 30,
    images: ["https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=400&q=80"],
  },
  {
    title: "Sport Blue Running Shoes",
    category: "shoes",
    price: 4799,
    color: "blue",
    stock: 25,
    images: ["https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&q=80"],
  },

  // ── PHONES (3) ──────────────────────────────────────────────────────────────
  {
    title: "ProMax Smartphone 256GB Black",
    category: "phones",
    price: 79999,
    color: "black",
    stock: 8,
    images: ["https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&q=80"],
  },
  {
    title: "Galaxy S Ultra Silver 5G",
    category: "phones",
    price: 89999,
    color: "silver",
    stock: 5,
    images: ["https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&q=80"],
  },
  {
    title: "Budget 5G Phone Blue 128GB",
    category: "phones",
    price: 14999,
    color: "blue",
    stock: 50,
    images: ["https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400&q=80"],
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Clear existing data
    await Product.deleteMany({});
    await User.deleteMany({});
    console.log("🗑️  Cleared existing products and users");

    // Insert products
    const inserted = await Product.insertMany(PRODUCTS);
    console.log(`✅ Inserted ${inserted.length} products`);

    // Create guest user
    const passwordHash = await bcrypt.hash("guest123", 12);
    await User.create({
      name: "Guest User",
      email: "guest@voiceshop.in",
      passwordHash,
      cart: [],
    });
    console.log("✅ Created guest user (email: guest@voiceshop.in, password: guest123)");

    console.log("\n🎉 Seeding complete!");
  } catch (err) {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

seed();
