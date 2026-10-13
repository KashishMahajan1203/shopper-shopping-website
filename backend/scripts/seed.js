// Usage: npm run seed            -> add missing products
//        npm run seed -- --reset -> also reset prices/stock of existing products
require('dotenv').config();
const mongoose = require('mongoose');
const { seedProducts } = require('../Utils/seed');
const connectDB = require('../Models/db');
connectDB().catch(() => process.exit(1));

mongoose.connection.once('open', async () => {
    try {
        const reset = process.argv.includes('--reset');
        const created = await seedProducts({ reset });
        console.log(`Seed done: ${created} new product(s)${reset ? ', existing products reset' : ''}.`);
    } catch (err) {
        console.error(err);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
});
