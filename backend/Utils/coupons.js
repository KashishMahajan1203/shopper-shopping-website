const coupons = require('../Data/coupons');
const OrderModel = require('../Models/Order');

class CouponError extends Error {}

// Returns { code, discount, description } or throws CouponError with a user-facing message.
const applyCoupon = async ({ code, subtotal, userId }) => {
    const key = String(code || '').trim().toUpperCase();
    const coupon = coupons[key];
    if (!coupon) throw new CouponError('Invalid coupon code');
    if (subtotal < coupon.minAmount) {
        throw new CouponError(`Add items worth ₹${coupon.minAmount - subtotal} more to use ${key}`);
    }
    if (coupon.firstOrderOnly) {
        const hasOrdered = await OrderModel.exists({
            user: userId,
            status: { $nin: ['pending', 'failed'] }
        });
        if (hasOrdered) throw new CouponError(`${key} is only valid on your first order`);
    }
    let discount = coupon.type === 'percent'
        ? Math.floor((subtotal * coupon.value) / 100)
        : coupon.value;
    if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
    discount = Math.min(discount, subtotal);
    return { code: key, discount, description: coupon.description };
};

const listCoupons = () =>
    Object.entries(coupons).map(([code, c]) => ({ code, description: c.description }));

module.exports = { applyCoupon, listCoupons, CouponError };
