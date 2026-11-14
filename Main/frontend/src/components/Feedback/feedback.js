import React, { useState } from "react";
import { FaStar } from "react-icons/fa";
import { feedback as feedbackAxios } from "../AxiosCreate.jsx";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "./Feedback.css";

export default function Feedback() {
  const [serviceRating, setServiceRating] = useState(0);
  const [serviceHover, setServiceHover] = useState(0);
  const [foodRating, setFoodRating] = useState(0);
  const [foodHover, setFoodHover] = useState(0);
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    let submitted = false;
    try {
      await feedbackAxios.post("/", {
        starate1: serviceRating,
        starate2: foodRating,
        comments,
        date_time: new Date(),
      });
      setComments("");
      setServiceRating(0);
      setFoodRating(0);
      toast.success("Thank you for sharing your feedback.");
      submitted = true;
    } catch (error) {
      console.error("Unable to submit feedback:", error);
      toast.error(error.response?.data?.message || "Feedback could not be submitted. Please try again.");
    } finally {
      setSubmitting(false);
    }
    if (submitted) {
      navigate("/");
    }
  };

  const renderRating = (label, rating, hover, setRating, setHover) => (
    <fieldset className="feedback-rating">
      <legend>{label}</legend>
      <div className="feedback-stars" role="group" aria-label={`${label} rating`}>
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            className="feedback-star"
            type="button"
            aria-label={`${value} out of 5 stars`}
            aria-pressed={rating === value}
            onMouseEnter={() => setHover(value)}
            onMouseLeave={() => setHover(0)}
            onFocus={() => setHover(value)}
            onBlur={() => setHover(0)}
            onClick={() => setRating(value)}
          >
            <FaStar
              aria-hidden="true"
              color={(hover || rating) >= value ? "#942d2d" : "#c5c5b8"}
            />
          </button>
        ))}
      </div>
    </fieldset>
  );

  return (
    <main className="feedback-page">
      <section className="feedback-card">
        <p className="feedback-eyebrow">Thank you for dining with us</p>
        <h1>How was your experience?</h1>
        <p className="feedback-intro">
          Your table is released. A few quick notes help us make your next visit even better.
        </p>
        <form className="feedback-form" onSubmit={handleSubmit}>
          <div className="feedback-ratings">
            {renderRating(
              "Our service",
              serviceRating,
              serviceHover,
              setServiceRating,
              setServiceHover
            )}
            {renderRating(
              "Our food",
              foodRating,
              foodHover,
              setFoodRating,
              setFoodHover
            )}
          </div>
          <label className="feedback-comment-label" htmlFor="feedback-comments">
            Anything else you would like us to know?
          </label>
          <textarea
            id="feedback-comments"
            value={comments}
            placeholder="Share your thoughts with us..."
            onChange={(event) => setComments(event.target.value)}
          />
          <div className="feedback-actions">
            <button type="submit" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit feedback"}
            </button>
            <button type="button" className="feedback-back" onClick={() => navigate("/")}>
              Back to home
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
