const router = require("express").Router();
const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");

/**
 * POST /api/orders/checkout
 * Creates an order from the authenticated user's current cart,
 * then clears the cart.
 */
router.post("/checkout", async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).populate("cart");
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.cart || user.cart.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    // Aggregate cart items: count qty for each productId
    const qtyMap = new Map();
    for (const product of user.cart) {
      const id = product._id.toString();
      qtyMap.set(id, { product, qty: (qtyMap.get(id)?.qty || 0) + 1 });
    }

    const items = Array.from(qtyMap.values()).map(({ product, qty }) => ({
      productId: product._id,
      qty,
      price: product.price,
    }));

    const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);

    // Create order
    const order = await Order.create({
      userId: user._id,
      items,
      total,
      status: "confirmed",
    });

    // Clear cart
    user.cart = [];
    await user.save();

    res.status(201).json({
      message: "Order placed successfully",
      order: {
        id: order._id,
        total: order.total,
        status: order.status,
        itemCount: items.reduce((s, i) => s + i.qty, 0),
        createdAt: order.createdAt,
      },
    });
  } catch (err) {
    console.error("[orders] checkout error:", err);
    res.status(500).json({ error: "Checkout failed" });
  }
});

/**
 * GET /api/orders
 * Returns all orders for the authenticated user
 */
router.get("/", async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.userId })
      .populate("items.productId")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

module.exports = router;
