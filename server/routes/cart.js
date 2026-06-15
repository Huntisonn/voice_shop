const router = require("express").Router();
const User = require("../models/User");
const Product = require("../models/Product");

/**
 * POST /api/cart/add
 * Body: { productId }
 * Adds product to the authenticated user's cart array
 */
router.post("/add", async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ error: "productId is required" });
    }

    // Verify product exists
    const product = await Product.findById(productId).lean();
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Push to cart
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $push: { cart: productId } },
      { new: true }
    ).populate("cart");

    res.json({ message: "Added to cart", cart: user.cart });
  } catch (err) {
    console.error("[cart] add error:", err);
    res.status(500).json({ error: "Failed to add to cart" });
  }
});

/**
 * DELETE /api/cart/last
 * Removes the most recently added product from cart
 */
router.delete("/last", async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.cart.length === 0) {
      return res.status(400).json({ error: "Cart is already empty" });
    }

    // Remove last element
    user.cart.pop();
    await user.save();

    const populated = await user.populate("cart");
    res.json({ message: "Removed last item", cart: populated.cart });
  } catch (err) {
    console.error("[cart] remove error:", err);
    res.status(500).json({ error: "Failed to remove from cart" });
  }
});

/**
 * GET /api/cart
 * Returns the current user's populated cart
 */
router.get("/", async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).populate("cart").lean();
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ cart: user.cart });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch cart" });
  }
});

module.exports = router;
