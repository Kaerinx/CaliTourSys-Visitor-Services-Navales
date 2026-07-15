import { getPublicReviews, submitPublicReview } from "./promotionApi";

const VALID_TARGET_TYPES = new Set([
  "product",
  "destination",
  "business",
  "tourism_asset",
]);

function normalizeTargetType(targetType) {
  const value = String(targetType || "").toLowerCase();
  if (!VALID_TARGET_TYPES.has(value)) {
    throw new Error("This listing cannot be reviewed.");
  }
  return value;
}

function normalizeSummary(data = {}) {
  return {
    average: Number(data.average || 0),
    count: Number(data.count || 0),
    distribution: {
      1: Number(data.distribution?.[1] || 0),
      2: Number(data.distribution?.[2] || 0),
      3: Number(data.distribution?.[3] || 0),
      4: Number(data.distribution?.[4] || 0),
      5: Number(data.distribution?.[5] || 0),
    },
    reviews: Array.isArray(data.reviews) ? data.reviews : [],
  };
}

export async function getReviews(targetType, targetId) {
  const response = await getPublicReviews({
    targetType: normalizeTargetType(targetType),
    targetId: String(targetId),
  });
  return normalizeSummary(response.data);
}

export async function submitReview(targetType, targetId, { rating, comment }) {
  const response = await submitPublicReview({
    targetType: normalizeTargetType(targetType),
    targetId: String(targetId),
    rating: Number(rating),
    comment: String(comment || "").trim() || undefined,
  });
  return response.data;
}
