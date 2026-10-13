const Joi = require('joi');
const ReviewModel = require('../Models/Review');
const ProductModel = require('../Models/Product');
const OrderModel = require('../Models/Order');
const UserModel = require('../Models/User');

const PURCHASED_STATUSES = ['placed', 'shipped', 'out_for_delivery', 'delivered'];

const reviewSchema = Joi.object({
    rating: Joi.number().integer().min(1).max(5).required(),
    comment: Joi.string().trim().min(3).max(1000).required()
});

const updateProductRating = async (productId) => {
    const [stats] = await ReviewModel.aggregate([
        { $match: { productId } },
        { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);
    const rating = stats ? Math.round(stats.avg * 10) / 10 : 0;
    const numReviews = stats ? stats.count : 0;
    await ProductModel.updateOne({ id: productId }, { rating, numReviews });
    return { rating, numReviews };
};

const listReviews = async (req, res) => {
    try {
        const reviews = await ReviewModel
            .find({ productId: Number(req.params.id) }, 'name rating comment createdAt user')
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();
        res.status(200).json({ success: true, reviews });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error', success: false });
    }
}

// Only customers who bought the product can review it ("verified purchase").
const addReview = async (req, res) => {
    try {
        const productId = Number(req.params.id);
        const { error, value } = reviewSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message.replace(/"/g, ''), success: false });
        }
        const product = await ProductModel.exists({ id: productId });
        if (!product) {
            return res.status(404).json({ message: 'Product not found', success: false });
        }
        const purchased = await OrderModel.exists({
            user: req.user._id,
            status: { $in: PURCHASED_STATUSES },
            'items.productId': productId
        });
        if (!purchased) {
            return res.status(403).json({ message: 'Only customers who bought this product can review it', success: false });
        }

        const user = await UserModel.findById(req.user._id, 'name');
        const review = await ReviewModel.findOneAndUpdate(
            { productId, user: req.user._id },
            { name: user.name, rating: value.rating, comment: value.comment },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );
        const stats = await updateProductRating(productId);

        res.status(201).json({ success: true, message: 'Thanks for your review!', review, ...stats });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error', success: false });
    }
}

module.exports = {
    listReviews,
    addReview
}
