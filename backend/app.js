const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const AuthRouter = require('./Routes/AuthRouter');
const UserRouter = require('./Routes/UserRouter');
const PaymentRouter = require('./Routes/PaymentRouter');
const ProductRouter = require('./Routes/ProductRouter');
const { razorpayWebhook, getCoupons } = require('./Controllers/PaymentController');

const app = express();

// Security headers. Product images are loaded by the frontend from another
// origin (port 3000 -> 8080), so allow cross-origin use of resources.
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// CORS_ORIGINS="https://my-shop.vercel.app,http://localhost:3000" limits who can call the API.
const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').map((o) => o.trim()).filter(Boolean);
app.use(cors(allowedOrigins.length ? { origin: allowedOrigins } : {}));

// Razorpay webhook needs the raw body to check its signature, so it comes before express.json().
app.post('/payment/webhook', express.raw({ type: 'application/json' }), razorpayWebhook);

app.use(express.json({ limit: '100kb' }));

// Slow down password guessing / signup spam.
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: Number(process.env.AUTH_RATE_LIMIT) || 30,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === 'test',
    message: { success: false, message: 'Too many attempts. Please try again after some time.' }
});

app.get('/ping', (req, res) => {
    res.send('PONG');
});

app.use('/images', express.static(path.join(__dirname, 'public', 'images'), { maxAge: '7d' }));

app.use('/auth', authLimiter, AuthRouter);
app.use('/products', ProductRouter);
app.get('/coupons', getCoupons);
app.use('/user', UserRouter);
app.use('/payment', PaymentRouter);

app.use((req, res) => {
    res.status(404).json({ message: 'Not found', success: false });
});

// Malformed JSON bodies and any other unhandled errors return JSON, not HTML.
app.use((err, req, res, next) => {
    const status = err.status || 500;
    if (status >= 500) console.error(err);
    res.status(status).json({
        message: status === 400 ? 'Invalid request body' : 'Internal server error',
        success: false
    });
});

module.exports = app;
