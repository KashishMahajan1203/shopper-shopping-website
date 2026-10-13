const crypto = require('crypto');
const Razorpay = require('razorpay');
const OrderModel = require('../Models/Order');
const UserModel = require('../Models/User');
const ProductModel = require('../Models/Product');
const { cleanCart } = require('./UserController');
const { applyCoupon, listCoupons, CouponError } = require('../Utils/coupons');
const { sendOrderConfirmationEmail, sendOrderCancelledEmail } = require('../Utils/mailer');

const ACTIVE_STATUSES = ['placed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];

const getRazorpay = () => {
    const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) return null;
    return new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
}

const safeEqual = (a, b) => {
    const x = Buffer.from(String(a));
    const y = Buffer.from(String(b));
    return x.length === y.length && crypto.timingSafeEqual(x, y);
};

class CheckoutError extends Error {
    constructor(message, status = 400) {
        super(message);
        this.status = status;
    }
}

// Prices the cart from the database and checks stock. Shared by checkout and coupon preview.
const priceCart = async (rawCart) => {
    const cart = await cleanCart(rawCart);
    if (cart.length === 0) throw new CheckoutError('Your cart is empty');
    const products = await ProductModel.find({ id: { $in: cart.map((i) => i.productId) } }).lean();
    const byId = new Map(products.map((p) => [p.id, p]));
    const items = cart.map(({ productId, size, quantity }) => {
        const p = byId.get(productId);
        const available = p.stock?.[size] || 0;
        if (available < quantity) {
            throw new CheckoutError(available === 0
                ? `${p.name} (Size ${size}) is out of stock`
                : `Only ${available} left of ${p.name} (Size ${size})`, 409);
        }
        return { productId, name: p.name, image: p.image, size, quantity, price: p.new_price };
    });
    const subtotal = items.reduce((total, i) => total + i.price * i.quantity, 0);
    return { cart, items, subtotal };
};

const handleError = (res, err, fallback = 'Internal server error') => {
    if (err instanceof CheckoutError || err instanceof CouponError) {
        return res.status(err.status || 400).json({ message: err.message, success: false });
    }
    console.error(err);
    return res.status(500).json({ message: fallback, success: false });
};

// GET /coupons - list of available offers
const getCoupons = (req, res) => {
    res.status(200).json({ success: true, coupons: listCoupons() });
}

// POST /payment/apply-coupon { code, cart } - preview the discount
const previewCoupon = async (req, res) => {
    try {
        const { subtotal } = await priceCart(req.body.cart);
        const coupon = await applyCoupon({ code: req.body.code, subtotal, userId: req.user._id });
        res.status(200).json({ success: true, ...coupon, subtotal, total: subtotal - coupon.discount });
    } catch (err) {
        handleError(res, err);
    }
}

// Step 1: create a Razorpay order. Amount, stock, address and coupon are all
// checked here on the server, so nothing can be changed from the browser.
const createOrder = async (req, res) => {
    try {
        const razorpay = getRazorpay();
        if (!razorpay) {
            return res.status(503)
                .json({ message: 'Online payment is not configured yet. Please try again later.', success: false });
        }

        const { items, subtotal } = await priceCart(req.body.cart);

        const user = await UserModel.findById(req.user._id);
        const address = req.body.addressId && user.addresses.id(req.body.addressId);
        if (!address) throw new CheckoutError('Please select a delivery address');

        let discount = 0;
        let couponCode;
        if (req.body.couponCode) {
            const coupon = await applyCoupon({ code: req.body.couponCode, subtotal, userId: req.user._id });
            discount = coupon.discount;
            couponCode = coupon.code;
        }
        const amount = subtotal - discount;
        if (amount < 1) throw new CheckoutError('Order total must be at least ₹1');

        const rpOrder = await razorpay.orders.create({
            amount: Math.round(amount * 100), // in paise
            currency: 'INR',
            receipt: `rcpt_${Date.now()}`,
            notes: { userId: String(req.user._id) }
        });

        const { fullName, phone, line1, line2, city, state, pincode } = address;
        const order = await OrderModel.create({
            user: req.user._id,
            items,
            shippingAddress: { fullName, phone, line1, line2, city, state, pincode },
            subtotal,
            discount,
            couponCode,
            amount,
            currency: 'INR',
            status: 'pending',
            razorpayOrderId: rpOrder.id
        });
        res.status(201).json({
            success: true,
            orderId: rpOrder.id,
            dbOrderId: order._id,
            amount: rpOrder.amount,
            currency: rpOrder.currency,
            keyId: process.env.RAZORPAY_KEY_ID
        });
    } catch (err) {
        if (err?.statusCode === 401) {
            console.error(err);
            return res.status(500).json({ message: 'Payment gateway authentication failed. Check the Razorpay keys.', success: false });
        }
        handleError(res, err, 'Could not start the payment. Please try again.');
    }
}

// Marks a pending order as paid exactly once (called by /verify and by the webhook).
const markOrderPaid = async (razorpayOrderId, razorpayPaymentId) => {
    const order = await OrderModel.findOneAndUpdate(
        { razorpayOrderId, status: 'pending' },
        {
            status: 'placed',
            razorpayPaymentId,
            paidAt: new Date(),
            $push: { statusHistory: { status: 'placed' } }
        },
        { new: true }
    );
    if (!order) return null; // already processed (or unknown order)

    for (const item of order.items) {
        const field = `stock.${item.size}`;
        await ProductModel.updateOne({ id: item.productId }, { $inc: { [field]: -item.quantity } });
        await ProductModel.updateOne({ id: item.productId, [field]: { $lt: 0 } }, { $set: { [field]: 0 } });
    }

    // Remove the purchased items from the user's saved cart.
    const user = await UserModel.findById(order.user);
    if (user) {
        const bought = new Set(order.items.map((i) => `${i.productId}_${i.size}`));
        user.cart = user.cart.filter((i) => !bought.has(`${i.productId}_${i.size}`));
        await user.save();
        sendOrderConfirmationEmail(user, order);
    }
    return order;
};

// Step 2: after Razorpay checkout succeeds, verify the payment signature.
const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ message: 'Missing payment details', success: false });
        }

        const order = await OrderModel.findOne({ razorpayOrderId: razorpay_order_id, user: req.user._id });
        if (!order) {
            return res.status(404).json({ message: 'Order not found', success: false });
        }

        const expected = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');
        if (!safeEqual(expected, razorpay_signature)) {
            if (order.status === 'pending') {
                order.status = 'failed';
                order.statusHistory.push({ status: 'failed', note: 'Signature verification failed' });
                await order.save();
            }
            return res.status(400).json({ message: 'Payment verification failed', success: false });
        }

        const paid = (await markOrderPaid(razorpay_order_id, razorpay_payment_id)) ||
            (await OrderModel.findById(order._id));
        res.status(200).json({ success: true, message: 'Payment successful', order: paid });
    } catch (err) {
        handleError(res, err);
    }
}

// POST /payment/webhook - Razorpay calls this directly, so a payment is recorded
// even if the customer closes the browser before /verify runs.
const razorpayWebhook = async (req, res) => {
    try {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
        if (!secret) return res.status(503).json({ success: false, message: 'Webhook not configured' });

        const signature = req.headers['x-razorpay-signature'] || '';
        const expected = crypto.createHmac('sha256', secret).update(req.body).digest('hex');
        if (!safeEqual(expected, signature)) {
            return res.status(400).json({ success: false, message: 'Invalid signature' });
        }

        const event = JSON.parse(req.body.toString('utf8'));
        const payment = event.payload?.payment?.entity;
        if ((event.event === 'payment.captured' || event.event === 'order.paid') && payment?.order_id) {
            await markOrderPaid(payment.order_id, payment.id);
        } else if (event.event === 'payment.failed' && payment?.order_id) {
            await OrderModel.updateOne(
                { razorpayOrderId: payment.order_id, status: 'pending' },
                { status: 'failed', $push: { statusHistory: { status: 'failed', note: payment.error_description } } }
            );
        }
        res.status(200).json({ success: true });
    } catch (err) {
        handleError(res, err);
    }
}

// ---------- Orders ----------
const getOrders = async (req, res) => {
    try {
        const orders = await OrderModel
            .find({ user: req.user._id, status: { $in: ACTIVE_STATUSES } })
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, orders });
    } catch (err) {
        handleError(res, err);
    }
}

const getOrder = async (req, res) => {
    try {
        const order = /^[a-f0-9]{24}$/i.test(req.params.orderId)
            ? await OrderModel.findOne({ _id: req.params.orderId, user: req.user._id, status: { $in: ACTIVE_STATUSES } })
            : null;
        if (!order) return res.status(404).json({ message: 'Order not found', success: false });
        res.status(200).json({ success: true, order });
    } catch (err) {
        handleError(res, err);
    }
}

// Customers can cancel until the order is shipped; the payment is refunded.
const cancelOrder = async (req, res) => {
    try {
        const order = /^[a-f0-9]{24}$/i.test(req.params.orderId)
            ? await OrderModel.findOne({ _id: req.params.orderId, user: req.user._id })
            : null;
        if (!order) return res.status(404).json({ message: 'Order not found', success: false });
        if (order.status !== 'placed') {
            return res.status(400).json({ message: 'This order can no longer be cancelled', success: false });
        }

        const razorpay = getRazorpay();
        if (razorpay && order.razorpayPaymentId) {
            try {
                const refund = await razorpay.payments.refund(order.razorpayPaymentId, {
                    amount: Math.round(order.amount * 100)
                });
                order.razorpayRefundId = refund.id;
            } catch (err) {
                console.error('Refund failed:', err?.error?.description || err.message);
                return res.status(502).json({ message: 'Refund could not be started. Please try again later.', success: false });
            }
        }

        order.status = 'cancelled';
        order.statusHistory.push({ status: 'cancelled', note: 'Cancelled by customer' });
        await order.save();
        for (const item of order.items) {
            await ProductModel.updateOne({ id: item.productId }, { $inc: { [`stock.${item.size}`]: item.quantity } });
        }
        const user = await UserModel.findById(order.user, 'name email');
        if (user) sendOrderCancelledEmail(user, order);

        res.status(200).json({ success: true, message: 'Order cancelled. Your refund has been initiated.', order });
    } catch (err) {
        handleError(res, err);
    }
}

module.exports = {
    getCoupons,
    previewCoupon,
    createOrder,
    verifyPayment,
    razorpayWebhook,
    getOrders,
    getOrder,
    cancelOrder,
    markOrderPaid
}
