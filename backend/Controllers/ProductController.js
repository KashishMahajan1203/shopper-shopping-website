const ProductModel = require('../Models/Product');
const { SIZES } = require('../Data/products');

const PUBLIC_FIELDS = '-_id -__v';
const SORTS = {
    featured: { id: 1 },
    'price-asc': { new_price: 1, id: 1 },
    'price-desc': { new_price: -1, id: 1 },
    rating: { rating: -1, numReviews: -1, id: 1 },
    newest: { createdAt: -1, id: -1 },
    discount: { discountPct: -1, id: 1 }
};

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /products?category=&search=&minPrice=&maxPrice=&size=&inStock=&sort=&page=&limit=
const listProducts = async (req, res) => {
    try {
        const { category, search, minPrice, maxPrice, size, inStock, sort = 'featured' } = req.query;
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(48, Math.max(1, parseInt(req.query.limit, 10) || 12));

        const filter = {};
        if (category) filter.category = category;
        if (search && search.trim()) {
            filter.name = { $regex: escapeRegex(search.trim().slice(0, 100)), $options: 'i' };
        }
        const min = Number(minPrice);
        const max = Number(maxPrice);
        if (minPrice !== undefined && !Number.isNaN(min)) filter.new_price = { ...filter.new_price, $gte: min };
        if (maxPrice !== undefined && !Number.isNaN(max)) filter.new_price = { ...filter.new_price, $lte: max };
        if (size && SIZES.includes(size)) {
            filter[`stock.${size}`] = { $gt: 0 };
        } else if (inStock === 'true') {
            filter.$or = SIZES.map((s) => ({ [`stock.${s}`]: { $gt: 0 } }));
        }

        const sortKey = SORTS[sort] ? sort : 'featured';
        const [products, total] = await Promise.all([
            ProductModel.aggregate([
                { $match: filter },
                { $addFields: { discountPct: { $divide: [{ $subtract: ['$old_price', '$new_price'] }, '$old_price'] } } },
                { $sort: SORTS[sortKey] },
                { $skip: (page - 1) * limit },
                { $limit: limit },
                { $project: { _id: 0, __v: 0, discountPct: 0 } }
            ]),
            ProductModel.countDocuments(filter)
        ]);

        res.status(200).json({
            success: true,
            products,
            total,
            page,
            pages: Math.max(1, Math.ceil(total / limit))
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error', success: false });
    }
}

// GET /products/by-ids?ids=1,2,3 (for cart, wishlist, recently viewed)
const getProductsByIds = async (req, res) => {
    try {
        const ids = String(req.query.ids || '')
            .split(',')
            .map(Number)
            .filter((n) => Number.isInteger(n) && n > 0)
            .slice(0, 100);
        const products = ids.length
            ? await ProductModel.find({ id: { $in: ids } }, PUBLIC_FIELDS).lean()
            : [];
        res.status(200).json({ success: true, products });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error', success: false });
    }
}

const getProduct = async (req, res) => {
    try {
        const product = await ProductModel.findOne({ id: Number(req.params.id) }, PUBLIC_FIELDS).lean();
        if (!product) {
            return res.status(404).json({ message: 'Product not found', success: false });
        }
        res.status(200).json({ success: true, product });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error', success: false });
    }
}

// Same category, best rated first.
const getRelatedProducts = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const product = await ProductModel.findOne({ id }, 'category').lean();
        if (!product) {
            return res.status(404).json({ message: 'Product not found', success: false });
        }
        const products = await ProductModel
            .find({ category: product.category, id: { $ne: id } }, PUBLIC_FIELDS)
            .sort({ rating: -1, numReviews: -1, id: 1 })
            .limit(4)
            .lean();
        res.status(200).json({ success: true, products });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error', success: false });
    }
}

module.exports = {
    listProducts,
    getProductsByIds,
    getProduct,
    getRelatedProducts
}
