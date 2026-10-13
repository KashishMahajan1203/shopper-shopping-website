const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ORDER_STATUSES = ['pending', 'placed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'failed'];

const OrderItemSchema = new Schema({
    productId: { type: Number, required: true },
    name: { type: String, required: true },
    image: { type: String },
    size: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true }
}, { _id: false });

const ShippingAddressSchema = new Schema({
    fullName: String,
    phone: String,
    line1: String,
    line2: String,
    city: String,
    state: String,
    pincode: String
}, { _id: false });

const StatusEventSchema = new Schema({
    status: { type: String, enum: ORDER_STATUSES, required: true },
    at: { type: Date, default: Date.now },
    note: String
}, { _id: false });

const OrderSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'users', required: true, index: true },
    items: { type: [OrderItemSchema], required: true },
    shippingAddress: { type: ShippingAddressSchema, required: true },
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    couponCode: { type: String },
    amount: { type: Number, required: true }, // amount actually charged
    currency: { type: String, default: 'INR' },
    // pending = waiting for payment, placed = paid; later steps are shipping progress.
    status: { type: String, enum: ORDER_STATUSES, default: 'pending', index: true },
    statusHistory: { type: [StatusEventSchema], default: [] },
    razorpayOrderId: { type: String, required: true, unique: true },
    razorpayPaymentId: { type: String },
    razorpayRefundId: { type: String },
    paidAt: { type: Date }
}, { timestamps: true });

const OrderModel = mongoose.model('orders', OrderSchema);
module.exports = OrderModel;
module.exports.ORDER_STATUSES = ORDER_STATUSES;
