const ProductModel = require('../Models/Product');
const OrderModel = require('../Models/Order');
const { products } = require('../Data/products');

// Inserts any products that are missing. With { reset: true } it also
// resets name/price/stock of existing products to the seed values.
const seedProducts = async ({ reset = false } = {}) => {
    let created = 0;
    for (const p of products) {
        if (reset) {
            const r = await ProductModel.updateOne({ id: p.id }, { $set: p }, { upsert: true });
            created += r.upsertedCount;
        } else {
            const r = await ProductModel.updateOne({ id: p.id }, { $setOnInsert: p }, { upsert: true });
            created += r.upsertedCount;
        }
    }
    return created;
};

// Orders created before order tracking existed used "created"/"paid".
const migrateOldOrders = async () => {
    const col = OrderModel.collection;
    await col.updateMany({ status: 'created' }, { $set: { status: 'pending' } });
    const old = await col.find({ status: 'paid' }).toArray();
    for (const o of old) {
        await col.updateOne({ _id: o._id }, {
            $set: {
                status: 'placed',
                subtotal: o.subtotal ?? o.amount,
                discount: o.discount ?? 0,
                shippingAddress: o.shippingAddress ?? {},
                statusHistory: [{ status: 'placed', at: o.paidAt || o.createdAt }]
            }
        });
    }
    return old.length;
};

module.exports = { seedProducts, migrateOldOrders };
