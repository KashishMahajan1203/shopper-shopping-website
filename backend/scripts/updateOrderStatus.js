// Moves an order along its delivery steps (there is no admin panel).
// Usage: npm run order:status -- <orderId> <shipped|out_for_delivery|delivered>
require('dotenv').config();
const mongoose = require('mongoose');
const OrderModel = require('../Models/Order');
const connectDB = require('../Models/db');
connectDB().catch(() => process.exit(1));

const STEPS = ['placed', 'shipped', 'out_for_delivery', 'delivered'];
const [orderId, status] = process.argv.slice(2);

mongoose.connection.once('open', async () => {
    try {
        if (!orderId || !STEPS.slice(1).includes(status)) {
            throw new Error('Usage: npm run order:status -- <orderId> <shipped|out_for_delivery|delivered>');
        }
        const order = await OrderModel.findById(orderId);
        if (!order) throw new Error('Order not found');
        if (!STEPS.includes(order.status) || STEPS.indexOf(status) <= STEPS.indexOf(order.status)) {
            throw new Error(`Cannot move order from "${order.status}" to "${status}"`);
        }
        order.status = status;
        order.statusHistory.push({ status });
        await order.save();
        console.log(`Order ${orderId} is now "${status}".`);
    } catch (err) {
        console.error(err.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
});
