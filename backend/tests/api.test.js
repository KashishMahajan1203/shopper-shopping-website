const crypto = require('crypto');
const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.RAZORPAY_KEY_ID = 'rzp_test_key';
process.env.RAZORPAY_KEY_SECRET = 'rzp_test_secret';
process.env.RAZORPAY_WEBHOOK_SECRET = 'whsec_test';

// Fake Razorpay SDK: no network calls.
const mockRefund = jest.fn(async () => ({ id: 'rfnd_1' }));
let mockOrderCounter = 0;
jest.mock('razorpay', () => jest.fn().mockImplementation(() => ({
    orders: { create: jest.fn(async ({ amount }) => ({ id: `order_${++mockOrderCounter}`, amount, currency: 'INR' })) },
    payments: { refund: mockRefund }
})));

// Capture emails instead of sending them.
const mockMails = [];
jest.mock('../Utils/mailer', () => ({
    sendWelcomeEmail: jest.fn(async (user) => mockMails.push({ type: 'welcome', to: user.email })),
    sendPasswordResetEmail: jest.fn(async (user, link) => mockMails.push({ type: 'reset', to: user.email, link })),
    sendOrderConfirmationEmail: jest.fn(async (user) => mockMails.push({ type: 'order', to: user.email })),
    sendOrderCancelledEmail: jest.fn(async (user) => mockMails.push({ type: 'cancelled', to: user.email }))
}));

const app = require('../app');
const { seedProducts } = require('../Utils/seed');
const ProductModel = require('../Models/Product');

let mongo;
beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
    await seedProducts();
});
afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
});

const sign = (orderId, paymentId) => crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

const signup = async (email = `u${Date.now()}${Math.random()}@test.com`) => {
    const res = await request(app).post('/auth/signup').send({ name: 'Test User', email, password: 'pass1234' });
    return { email, token: res.body.jwtToken, res };
};

const ADDRESS = {
    fullName: 'Riya Sharma', phone: '9876543210', line1: '12 MG Road',
    city: 'Pune', state: 'Maharashtra', pincode: '411001'
};

describe('auth', () => {
    test('signup logs the user in and sends a welcome email', async () => {
        const { res, email } = await signup();
        expect(res.status).toBe(201);
        expect(res.body.jwtToken).toBeTruthy();
        expect(mockMails).toContainEqual({ type: 'welcome', to: email });
    });

    test('duplicate signup and wrong password are rejected', async () => {
        const { email } = await signup();
        const dup = await request(app).post('/auth/signup').send({ name: 'Test User', email, password: 'pass1234' });
        expect(dup.status).toBe(409);
        const bad = await request(app).post('/auth/login').send({ email, password: 'wrong123' });
        expect(bad.status).toBe(403);
    });

    test('forgot + reset password flow', async () => {
        const { email } = await signup();
        const unknown = await request(app).post('/auth/forgot-password').send({ email: 'nobody@test.com' });
        const known = await request(app).post('/auth/forgot-password').send({ email });
        expect(unknown.body.message).toBe(known.body.message); // no account enumeration

        const token = mockMails.filter((m) => m.type === 'reset' && m.to === email).pop().link.split('/').pop();
        const reset = await request(app).post('/auth/reset-password').send({ token, password: 'newpass99' });
        expect(reset.status).toBe(200);
        expect(reset.body.jwtToken).toBeTruthy();

        const reuse = await request(app).post('/auth/reset-password').send({ token, password: 'again123' });
        expect(reuse.status).toBe(400);
        const login = await request(app).post('/auth/login').send({ email, password: 'newpass99' });
        expect(login.status).toBe(200);
    });

    test('protected routes need a valid token', async () => {
        expect((await request(app).get('/user/data')).status).toBe(401);
        expect((await request(app).get('/user/data').set('Authorization', 'Bearer junk')).status).toBe(401);
    });
});

describe('products', () => {
    test('filters by category, search, price and size with pagination', async () => {
        const res = await request(app).get('/products?category=men&limit=5&page=2');
        expect(res.body.total).toBe(12);
        expect(res.body.pages).toBe(3);
        expect(res.body.products).toHaveLength(5);
        expect(res.body.products.every((p) => p.category === 'men')).toBe(true);

        const search = await request(app).get('/products?search=hooded');
        expect(search.body.total).toBeGreaterThan(0);
        expect(search.body.products.every((p) => /hooded/i.test(p.name))).toBe(true);

        const price = await request(app).get('/products?minPrice=60&maxPrice=85&sort=price-asc&limit=48');
        const prices = price.body.products.map((p) => p.new_price);
        expect(prices.every((p) => p >= 60 && p <= 85)).toBe(true);
        expect(prices).toEqual([...prices].sort((a, b) => a - b));

        const sized = await request(app).get('/products?size=XL&limit=48');
        expect(sized.body.products.every((p) => p.stock.XL > 0)).toBe(true);
    });

    test('single product, related products and by-ids', async () => {
        expect((await request(app).get('/products/999')).status).toBe(404);
        const one = await request(app).get('/products/1');
        expect(one.body.product.name).toBeTruthy();
        expect(one.body.product._id).toBeUndefined();
        const related = await request(app).get('/products/1/related');
        expect(related.body.products).toHaveLength(4);
        expect(related.body.products.every((p) => p.category === 'women' && p.id !== 1)).toBe(true);
        const byIds = await request(app).get('/products/by-ids?ids=3,5,999');
        expect(byIds.body.products.map((p) => p.id).sort()).toEqual([3, 5]);
    });

    test('product images are served', async () => {
        const res = await request(app).get('/images/products/product_1.png');
        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toBe('image/png');
    });
});

describe('cart, wishlist and addresses', () => {
    test('cart and wishlist drop invalid items', async () => {
        const { token } = await signup();
        const cart = await request(app).put('/user/cart').set('Authorization', `Bearer ${token}`)
            .send({ cart: [{ productId: 1, size: 'M', quantity: 1 }, { productId: 1, size: 'M', quantity: 2 },
                { productId: 999, size: 'M', quantity: 1 }, { productId: 2, size: 'HUGE', quantity: 1 }] });
        expect(cart.body.cart).toEqual([{ productId: 1, size: 'M', quantity: 3 }]);
        const wish = await request(app).put('/user/wishlist').set('Authorization', `Bearer ${token}`)
            .send({ wishlist: [5, 5, 999] });
        expect(wish.body.wishlist).toEqual([5]);
    });

    test('addresses are validated; first one becomes default', async () => {
        const { token } = await signup();
        const auth = { Authorization: `Bearer ${token}` };
        const bad = await request(app).post('/user/addresses').set(auth).send({ ...ADDRESS, pincode: '12' });
        expect(bad.status).toBe(400);
        expect(bad.body.message).toMatch(/pincode/);
        const first = await request(app).post('/user/addresses').set(auth).send(ADDRESS);
        expect(first.body.address.isDefault).toBe(true);
        const second = await request(app).post('/user/addresses').set(auth).send({ ...ADDRESS, city: 'Mumbai', isDefault: true });
        expect(second.body.addresses.filter((a) => a.isDefault)).toHaveLength(1);
        expect(second.body.addresses.find((a) => a.isDefault).city).toBe('Mumbai');
        const del = await request(app).delete(`/user/addresses/${second.body.address._id}`).set(auth);
        expect(del.body.addresses).toHaveLength(1);
        expect(del.body.addresses[0].isDefault).toBe(true);
    });
});

describe('checkout, payment, orders and reviews', () => {
    let auth;
    let addressId;
    const cart = [{ productId: 1, size: 'M', quantity: 2 }];

    beforeAll(async () => {
        await ProductModel.updateOne({ id: 1 }, { $set: { 'stock.M': 5, 'stock.XL': 0 } });
        const { token } = await signup();
        auth = { Authorization: `Bearer ${token}` };
        const res = await request(app).post('/user/addresses').set(auth).send(ADDRESS);
        addressId = res.body.address._id;
    });

    test('coupons are validated on the server', async () => {
        const list = await request(app).get('/coupons');
        expect(list.body.coupons.map((c) => c.code)).toContain('WELCOME10');
        const ok = await request(app).post('/payment/apply-coupon').set(auth)
            .send({ code: 'welcome10', cart: [{ productId: 1, size: 'M', quantity: 3 }] });
        expect(ok.body).toMatchObject({ code: 'WELCOME10', subtotal: 150, discount: 15, total: 135 });
        const min = await request(app).post('/payment/apply-coupon').set(auth).send({ code: 'FLAT50', cart });
        expect(min.status).toBe(400);
        expect(min.body.message).toMatch(/more to use FLAT50/);
        const bad = await request(app).post('/payment/apply-coupon').set(auth).send({ code: 'NOPE', cart });
        expect(bad.body.message).toBe('Invalid coupon code');
    });

    test('checkout needs an address and enough stock', async () => {
        const noAddr = await request(app).post('/payment/create-order').set(auth).send({ cart });
        expect(noAddr.body.message).toBe('Please select a delivery address');
        const soldOut = await request(app).post('/payment/create-order').set(auth)
            .send({ cart: [{ productId: 1, size: 'XL', quantity: 1 }], addressId });
        expect(soldOut.status).toBe(409);
        expect(soldOut.body.message).toMatch(/out of stock/);
        const tooMany = await request(app).post('/payment/create-order').set(auth)
            .send({ cart: [{ productId: 1, size: 'M', quantity: 9 }], addressId });
        expect(tooMany.body.message).toMatch(/Only 5 left/);
    });

    let orderId;
    let dbOrderId;
    test('pay -> verify -> order placed, stock reduced, cart cleared', async () => {
        await request(app).put('/user/cart').set(auth).send({ cart: [...cart, { productId: 2, size: 'S', quantity: 1 }] });
        const created = await request(app).post('/payment/create-order').set(auth)
            .send({ cart, addressId, couponCode: 'FIRST20' });
        expect(created.status).toBe(201);
        expect(created.body.amount).toBe(8000); // ₹100 - 20% = ₹80, in paise
        orderId = created.body.orderId;
        dbOrderId = created.body.dbOrderId;

        const tampered = await request(app).post('/payment/verify').set(auth).send({
            razorpay_order_id: orderId, razorpay_payment_id: 'pay_1', razorpay_signature: sign(orderId, 'pay_OTHER')
        });
        expect(tampered.status).toBe(400);
    });

    test('a valid signature on a fresh order marks it paid', async () => {
        const created = await request(app).post('/payment/create-order').set(auth)
            .send({ cart, addressId, couponCode: 'FIRST20' });
        orderId = created.body.orderId;
        dbOrderId = created.body.dbOrderId;
        const verify = await request(app).post('/payment/verify').set(auth).send({
            razorpay_order_id: orderId, razorpay_payment_id: 'pay_2', razorpay_signature: sign(orderId, 'pay_2')
        });
        expect(verify.status).toBe(200);
        expect(verify.body.order.status).toBe('placed');
        expect(verify.body.order.shippingAddress.city).toBe('Pune');

        expect((await ProductModel.findOne({ id: 1 })).stock.M).toBe(3);
        const data = await request(app).get('/user/data').set(auth);
        expect(data.body.cart).toEqual([{ productId: 2, size: 'S', quantity: 1 }]); // only bought items removed

        // FIRST20 cannot be used twice
        const again = await request(app).post('/payment/apply-coupon').set(auth).send({ code: 'FIRST20', cart });
        expect(again.body.message).toMatch(/first order/);
    });

    test('webhook: bad signature rejected; duplicate event does not double-count', async () => {
        const body = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { id: 'pay_2', order_id: orderId } } } });
        const bad = await request(app).post('/payment/webhook').set('Content-Type', 'application/json')
            .set('X-Razorpay-Signature', 'nope').send(body);
        expect(bad.status).toBe(400);
        const sig = crypto.createHmac('sha256', 'whsec_test').update(body).digest('hex');
        const ok = await request(app).post('/payment/webhook').set('Content-Type', 'application/json')
            .set('X-Razorpay-Signature', sig).send(body);
        expect(ok.status).toBe(200);
        expect((await ProductModel.findOne({ id: 1 })).stock.M).toBe(3);
    });

    test('webhook alone can complete a payment (browser closed)', async () => {
        const created = await request(app).post('/payment/create-order').set(auth).send({ cart: [{ productId: 3, size: 'S', quantity: 1 }], addressId });
        const body = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { id: 'pay_3', order_id: created.body.orderId } } } });
        const sig = crypto.createHmac('sha256', 'whsec_test').update(body).digest('hex');
        await request(app).post('/payment/webhook').set('Content-Type', 'application/json').set('X-Razorpay-Signature', sig).send(body);
        const order = await request(app).get(`/user/orders/${created.body.dbOrderId}`).set(auth);
        expect(order.body.order.status).toBe('placed');
    });

    test('order history and details', async () => {
        const list = await request(app).get('/user/orders').set(auth);
        expect(list.body.orders.length).toBe(2); // pending/failed orders are hidden
        const one = await request(app).get(`/user/orders/${dbOrderId}`).set(auth);
        expect(one.body.order.statusHistory.map((s) => s.status)).toEqual(['placed']);
        const { token: other } = await signup();
        const notMine = await request(app).get(`/user/orders/${dbOrderId}`).set('Authorization', `Bearer ${other}`);
        expect(notMine.status).toBe(404);
    });

    test('reviews: only buyers can review; rating is averaged', async () => {
        const { token: stranger } = await signup();
        const blocked = await request(app).post('/products/1/reviews').set('Authorization', `Bearer ${stranger}`)
            .send({ rating: 5, comment: 'Great!' });
        expect(blocked.status).toBe(403);

        const invalid = await request(app).post('/products/1/reviews').set(auth).send({ rating: 9, comment: 'x' });
        expect(invalid.status).toBe(400);
        const ok = await request(app).post('/products/1/reviews').set(auth).send({ rating: 4, comment: 'Nice fabric' });
        expect(ok.status).toBe(201);
        expect(ok.body).toMatchObject({ rating: 4, numReviews: 1 });
        const updated = await request(app).post('/products/1/reviews').set(auth).send({ rating: 2, comment: 'Shrunk after wash' });
        expect(updated.body).toMatchObject({ rating: 2, numReviews: 1 }); // one review per user
        const list = await request(app).get('/products/1/reviews');
        expect(list.body.reviews[0].comment).toBe('Shrunk after wash');
    });

    test('cancel refunds the payment and restores stock', async () => {
        const res = await request(app).post(`/user/orders/${dbOrderId}/cancel`).set(auth);
        expect(res.status).toBe(200);
        expect(res.body.order.status).toBe('cancelled');
        expect(mockRefund).toHaveBeenCalledWith('pay_2', { amount: 8000 });
        expect((await ProductModel.findOne({ id: 1 })).stock.M).toBe(5);
        const again = await request(app).post(`/user/orders/${dbOrderId}/cancel`).set(auth);
        expect(again.status).toBe(400);
    });
});
