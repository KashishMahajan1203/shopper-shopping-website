const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CartItemSchema = new Schema({
    productId: { type: Number, required: true },
    size: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 }
}, { _id: false });

const AddressSchema = new Schema({
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    line1: { type: String, required: true, trim: true },
    line2: { type: String, default: '', trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    isDefault: { type: Boolean, default: false }
});

const UserSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
    },
    // Saved so the user gets their shopping list back on every login/device.
    cart: {
        type: [CartItemSchema],
        default: []
    },
    wishlist: {
        type: [Number],
        default: []
    },
    addresses: {
        type: [AddressSchema],
        default: []
    },
    // Password reset: only a hash of the emailed token is stored.
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date }
});

const UserModel = mongoose.model('users', UserSchema);
module.exports = UserModel;
