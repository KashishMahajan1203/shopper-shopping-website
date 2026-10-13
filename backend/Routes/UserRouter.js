const ensureAuthenticated = require("../Middlewares/Auth");
const {
    getUserData,
    updateCart,
    updateWishlist,
    addAddress,
    updateAddress,
    deleteAddress
} = require("../Controllers/UserController");
const { getOrders, getOrder, cancelOrder } = require("../Controllers/PaymentController");

const router = require("express").Router();

router.use(ensureAuthenticated);

router.get("/data", getUserData);
router.put("/cart", updateCart);
router.put("/wishlist", updateWishlist);

router.post("/addresses", addAddress);
router.put("/addresses/:addressId", updateAddress);
router.delete("/addresses/:addressId", deleteAddress);

router.get("/orders", getOrders);
router.get("/orders/:orderId", getOrder);
router.post("/orders/:orderId/cancel", cancelOrder);

module.exports = router;
