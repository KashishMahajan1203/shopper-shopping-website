const ensureAuthenticated = require("../Middlewares/Auth");
const { listProducts, getProductsByIds, getProduct, getRelatedProducts } = require("../Controllers/ProductController");
const { listReviews, addReview } = require("../Controllers/ReviewController");

const router = require("express").Router();

router.get("/", listProducts);
router.get("/by-ids", getProductsByIds);
router.get("/:id", getProduct);
router.get("/:id/related", getRelatedProducts);
router.get("/:id/reviews", listReviews);
router.post("/:id/reviews", ensureAuthenticated, addReview);

module.exports = router;
