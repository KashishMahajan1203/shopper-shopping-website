require('dotenv').config();
const app = require('./app');
const connectDB = require('./Models/db');
const { seedProducts, migrateOldOrders } = require('./Utils/seed');

const PORT = process.env.PORT || 8080;

const start = async () => {
    try {
        await connectDB();
        // First run on a new database: add the product catalogue automatically.
        const added = await seedProducts();
        if (added) console.log(`Added ${added} products to the database`);
        const migrated = await migrateOldOrders();
        if (migrated) console.log(`Updated ${migrated} old order(s) for order tracking`);
    } catch (err) {
        console.error('Startup failed:', err.message);
        process.exit(1);
    }

    app.listen(PORT, (err) => {
        if (err) {
            // e.g. EADDRINUSE: another backend is already running on this port.
            console.error(`Could not start server on port ${PORT}: ${err.message}`);
            process.exit(1);
        }
        console.log(`Server is running on ${PORT}`)
        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            console.warn('Razorpay keys are missing in .env - online payment is disabled.');
        }
        if (!process.env.SMTP_HOST) {
            console.warn('SMTP is not configured in .env - emails will be printed to the console.');
        }
    })
};

start();
