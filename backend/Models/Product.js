const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const StockSchema = new Schema({
    S: { type: Number, default: 0, min: 0 },
    M: { type: Number, default: 0, min: 0 },
    L: { type: Number, default: 0, min: 0 },
    XL: { type: Number, default: 0, min: 0 },
    XXL: { type: Number, default: 0, min: 0 }
}, { _id: false });

const ProductSchema = new Schema({
    // Numeric id kept stable so carts, wishlists and orders can reference it.
    id: { type: Number, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, enum: ['men', 'women', 'kid'], index: true },
    image: { type: String, required: true },
    new_price: { type: Number, required: true, min: 0 },
    old_price: { type: Number, required: true, min: 0 },
    description: { type: String, default: '' },
    stock: { type: StockSchema, default: () => ({}) },
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 }
}, { timestamps: true });

ProductSchema.index({ name: 'text' });

const ProductModel = mongoose.model('products', ProductSchema);
module.exports = ProductModel;
