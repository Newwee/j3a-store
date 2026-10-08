export type TopupStatus = 'pending' | 'approved' | 'rejected';

export interface TopupRequest {
  id: string;
  topupNumber: string;
  userId: string;
  userEmail: string;
  userName: string;
  amount: number;
  paymentSlipUrl: string;
  status: TopupStatus;
  paymentMethod?: 'slip' | 'truemoney_angpao';
  voucherHash?: string;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTopupInput {
  userId: string;
  userEmail: string;
  userName: string;
  amount: number;
  paymentSlipUrl: string;
}
