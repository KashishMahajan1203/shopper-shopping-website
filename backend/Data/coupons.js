// Available coupon codes. Discounts are always calculated on the server.
const coupons = {
    WELCOME10: {
        description: '10% off on orders above ₹100 (max ₹100)',
        type: 'percent',
        value: 10,
        minAmount: 100,
        maxDiscount: 100
    },
    FLAT50: {
        description: '₹50 off on orders above ₹300',
        type: 'flat',
        value: 50,
        minAmount: 300
    },
    FIRST20: {
        description: '20% off on your first order (max ₹200)',
        type: 'percent',
        value: 20,
        minAmount: 0,
        maxDiscount: 200,
        firstOrderOnly: true
    }
};

module.exports = coupons;
