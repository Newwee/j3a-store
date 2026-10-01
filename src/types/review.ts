export interface Review {
  id: string;
  productId: string;
  productSlug?: string;
  productName: string;
  orderId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  rating: number; // 1 to 5
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export type ReviewReason =
  | 'not_logged_in'
  | 'no_purchase'
  | 'order_pending_admin'
  | 'already_reviewed'
  | 'eligible';

export interface ReviewEligibility {
  canReview: boolean;
  reason: ReviewReason;
  message: string;
  orderId?: string;
  existingReview?: Review;
}
