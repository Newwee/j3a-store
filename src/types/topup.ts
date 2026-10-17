export type TopupStatus = 'pending' | 'approved' | 'rejected' | 'test';

export interface TopupRequest {
  id: string;
  topupNumber: string;
  userId: string;
  userEmail: string;
  userName: string;
  amount: number;
  paymentSlipUrl: string;
  status: TopupStatus;
  paymentMethod?: 'slip' | 'truemoney_angpao' | 'truemoney_angpao_test';
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
