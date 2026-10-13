const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ReviewSchema = new Schema({
    productId: { type: Number, required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'users', required: true },
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true, maxlength: 1000 }
}, { timestamps: true });

// One review per user per product (posting again updates it).
ReviewSchema.index({ productId: 1, user: 1 }, { unique: true });

const ReviewModel = mongoose.model('reviews', ReviewSchema);
module.exports = ReviewModel;
