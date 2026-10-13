const Joi = require('joi');
const UserModel = require('../Models/User');
const ProductModel = require('../Models/Product');
const { SIZES } = require('../Data/products');

// Keep only items for existing products/sizes and merge duplicate product+size entries.
const cleanCart = async (items) => {
    const merged = new Map();
    for (const item of Array.isArray(items) ? items : []) {
        const productId = Number(item?.productId);
        const quantity = Math.floor(Number(item?.quantity));
        const size = item?.size;
        if (!Number.isInteger(productId) || !SIZES.includes(size) || !(quantity > 0)) continue;
        const key = `${productId}_${size}`;
        const qty = Math.min((merged.get(key)?.quantity || 0) + quantity, 99);
        merged.set(key, { productId, size, quantity: qty });
    }
    const ids = [...new Set([...merged.values()].map((i) => i.productId))];
    const existing = new Set(
        (await ProductModel.find({ id: { $in: ids } }, 'id').lean()).map((p) => p.id)
    );
    return [...merged.values()].filter((i) => existing.has(i.productId));
}

const cleanWishlist = async (ids) => {
    const unique = [...new Set((Array.isArray(ids) ? ids : []).map(Number))].filter(Number.isInteger);
    const existing = new Set(
        (await ProductModel.find({ id: { $in: unique } }, 'id').lean()).map((p) => p.id)
    );
    return unique.filter((id) => existing.has(id));
}

const getUserData = async (req, res) => {
    try {
        const user = await UserModel.findById(req.user._id, 'name email cart wishlist addresses');
        if (!user) {
            return res.status(404).json({ message: 'User not found', success: false });
        }
        res.status(200).json({
            success: true,
            name: user.name,
            email: user.email,
            cart: user.cart,
            wishlist: user.wishlist,
            addresses: user.addresses
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error', success: false });
    }
}

const updateCart = async (req, res) => {
    try {
        const cart = await cleanCart(req.body.cart);
        await UserModel.updateOne({ _id: req.user._id }, { cart });
        res.status(200).json({ success: true, cart });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error', success: false });
    }
}

const updateWishlist = async (req, res) => {
    try {
        const wishlist = await cleanWishlist(req.body.wishlist);
        await UserModel.updateOne({ _id: req.user._id }, { wishlist });
        res.status(200).json({ success: true, wishlist });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error', success: false });
    }
}

// ---------- Addresses ----------
const addressSchema = Joi.object({
    fullName: Joi.string().trim().min(2).max(80).required(),
    phone: Joi.string().trim().pattern(/^[6-9]\d{9}$/).required()
        .messages({ 'string.pattern.base': 'Enter a valid 10-digit mobile number' }),
    line1: Joi.string().trim().min(3).max(150).required(),
    line2: Joi.string().trim().max(150).allow(''),
    city: Joi.string().trim().min(2).max(60).required(),
    state: Joi.string().trim().min(2).max(60).required(),
    pincode: Joi.string().trim().pattern(/^\d{6}$/).required()
        .messages({ 'string.pattern.base': 'Enter a valid 6-digit pincode' }),
    isDefault: Joi.boolean()
});

const validateAddress = (body) => {
    const { error, value } = addressSchema.validate(body, { stripUnknown: true });
    return error
        ? { error: error.details[0].message.replace(/"/g, '') }
        : { value };
};

const addAddress = async (req, res) => {
    try {
        const { error, value } = validateAddress(req.body);
        if (error) return res.status(400).json({ message: error, success: false });

        const user = await UserModel.findById(req.user._id);
        if (user.addresses.length >= 10) {
            return res.status(400).json({ message: 'You can save up to 10 addresses', success: false });
        }
        const makeDefault = value.isDefault || user.addresses.length === 0;
        if (makeDefault) user.addresses.forEach((a) => { a.isDefault = false; });
        user.addresses.push({ ...value, isDefault: makeDefault });
        await user.save();
        res.status(201).json({
            success: true,
            message: 'Address saved',
            address: user.addresses[user.addresses.length - 1],
            addresses: user.addresses
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error', success: false });
    }
}

const updateAddress = async (req, res) => {
    try {
        const { error, value } = validateAddress(req.body);
        if (error) return res.status(400).json({ message: error, success: false });

        const user = await UserModel.findById(req.user._id);
        const address = user.addresses.id(req.params.addressId);
        if (!address) return res.status(404).json({ message: 'Address not found', success: false });
        if (value.isDefault) user.addresses.forEach((a) => { a.isDefault = false; });
        address.set({ ...value, isDefault: value.isDefault || address.isDefault });
        await user.save();
        res.status(200).json({ success: true, message: 'Address updated', addresses: user.addresses });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error', success: false });
    }
}

const deleteAddress = async (req, res) => {
    try {
        const user = await UserModel.findById(req.user._id);
        const address = user.addresses.id(req.params.addressId);
        if (!address) return res.status(404).json({ message: 'Address not found', success: false });
        const wasDefault = address.isDefault;
        address.deleteOne();
        if (wasDefault && user.addresses.length > 0) user.addresses[0].isDefault = true;
        await user.save();
        res.status(200).json({ success: true, message: 'Address removed', addresses: user.addresses });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error', success: false });
    }
}

module.exports = {
    getUserData,
    updateCart,
    updateWishlist,
    addAddress,
    updateAddress,
    deleteAddress,
    cleanCart
}
