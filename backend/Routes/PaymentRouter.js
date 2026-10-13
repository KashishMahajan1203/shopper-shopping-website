const ensureAuthenticated = require("../Middlewares/Auth");
const { createOrder, verifyPayment, previewCoupon } = require("../Controllers/PaymentController");

const router = require("express").Router();

router.use(ensureAuthenticated);

router.post("/apply-coupon", previewCoupon);
router.post("/create-order", createOrder);
router.post("/verify", verifyPayment);

module.exports = router;
