const router = require("express").Router();
const Product = require("../models/Product");

/**
 * GET /api/products
 * Query params: category, color, price_max, price_min
 * Returns: { products: [], total: number }
 */
router.get("/", async (req, res) => {
  try {
    const { category, color, price_max, price_min } = req.query;
    const query = {};

    if (category) query.category = category.toLowerCase();
    if (color) query.color = { $regex: new RegExp(color, "i") };
    if (price_max || price_min) {
      query.price = {};
      if (price_max) query.price.$lte = Number(price_max);
      if (price_min) query.price.$gte = Number(price_min);
    }

    const products = await Product.find(query).sort({ price: 1 }).lean();

    res.json({ products, total: products.length });
  } catch (err) {
    console.error("[products] GET error:", err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

/**
 * GET /api/products/:id
 */
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

module.exports = router;
