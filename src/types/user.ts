export type UserRole = 'customer' | 'admin';

export type UserTier = 'Bronze' | 'Silver' | 'Gold' | 'VIP';

export interface SocialLinks {
  discord?: string;
  facebook?: string;
  twitter?: string;
  instagram?: string;
  youtube?: string;
  github?: string;
  website?: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  credits: number; // Balance in THB
  tier: UserTier;
  phone?: string;
  bio?: string;
  socialLinks?: SocialLinks;
  reviewBannedUntil?: string | null;
  reviewBanReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type DeletionRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface DeletionRequest {
  id: string;
  userId: string;
  email: string | null;
  displayName: string | null;
  credits: number;
  status: DeletionRequestStatus;
  userReason?: string;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
}

export interface PublicUserReview {
  id: string;
  productId: string;
  productName: string;
  productSlug?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface PublicUserProfile {
  uid: string;
  displayName: string;
  photoURL: string | null;
  role: UserRole;
  tier: UserTier;
  bio?: string;
  socialLinks?: SocialLinks;
  createdAt: string;
  reviewCount: number;
  averageRating: number;
  reviews: PublicUserReview[];
}
