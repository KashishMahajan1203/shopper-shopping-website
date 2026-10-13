import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./DescriptionBox.css";
import { ShopContext } from "../../Context/ShopContext";
import Stars from "../Stars/Stars";
import { apiFetch, getErrorMessage, handleError, handleSuccess } from "../../utils";

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const DescriptionBox = ({ product, onReviewed }) => {
  const { user } = useContext(ShopContext);
  const [reviews, setReviews] = useState(null);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setReviews(null);
    apiFetch(`/products/${product.id}/reviews`)
      .then((data) => !cancelled && setReviews(data.reviews))
      .catch(() => !cancelled && setReviews([]));
    return () => {
      cancelled = true;
    };
  }, [product.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) return handleError("Please choose a star rating");
    setSubmitting(true);
    try {
      const data = await apiFetch(`/products/${product.id}/reviews`, {
        method: "POST",
        body: { rating, comment },
      });
      setReviews((prev) => [data.review, ...(prev || []).filter((r) => r._id !== data.review._id)]);
      onReviewed?.({ rating: data.rating, numReviews: data.numReviews });
      setRating(0);
      setComment("");
      handleSuccess(data.message);
    } catch (err) {
      handleError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="descriptionbox">
      <section>
        <h2>Description</h2>
        <p className="descriptionbox-text">{product.description}</p>
      </section>

      <section id="reviews" className="descriptionbox-reviews">
        <div className="descriptionbox-reviews-head">
          <h2>Customer Reviews</h2>
          {product.numReviews > 0 && (
            <p>
              <Stars rating={product.rating} /> {product.rating.toFixed(1)} out of 5 ·{" "}
              {product.numReviews} review{product.numReviews === 1 ? "" : "s"}
            </p>
          )}
        </div>

        {user ? (
          <form className="review-form" onSubmit={handleSubmit}>
            <p className="review-form-title">Write a review</p>
            <div className="review-stars-input" onMouseLeave={() => setHover(0)}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  type="button"
                  key={n}
                  className={n <= (hover || rating) ? "on" : ""}
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHover(n)}
                  aria-label={`${n} star${n > 1 ? "s" : ""}`}
                >
                  ★
                </button>
              ))}
            </div>
            <textarea
              className="input review-textarea"
              placeholder="What did you like or dislike? (only buyers of this product can review)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={1000}
              required
              minLength={3}
            />
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? "Posting…" : "Post review"}
            </button>
          </form>
        ) : (
          <p className="review-login">
            <Link to="/login">Log in</Link> to review this product.
          </p>
        )}

        {reviews === null ? (
          <p className="review-empty">Loading reviews…</p>
        ) : reviews.length === 0 ? (
          <p className="review-empty">No reviews yet. Bought this product? Be the first to review it!</p>
        ) : (
          <ul className="review-list">
            {reviews.map((r) => (
              <li key={r._id}>
                <div className="review-meta">
                  <Stars rating={r.rating} size={14} />
                  <strong>{r.name}</strong>
                  <span className="review-verified">✓ Verified purchase</span>
                  <span className="review-date">{formatDate(r.createdAt)}</span>
                </div>
                <p>{r.comment}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};
export default DescriptionBox;
