const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: ["shirts", "jeans", "kurtas", "shoes", "phones"],
      lowercase: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    color: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
    images: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

// Index for fast filtering
productSchema.index({ category: 1, color: 1, price: 1 });

module.exports = mongoose.model("Product", productSchema);
