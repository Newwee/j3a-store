import { Order, PaymentMethod } from '@/types/order';

export interface PaymentInitiationResult {
  success: boolean;
  requiresAction: boolean;
  paymentMethod: PaymentMethod;
  instructions?: string;
  qrPayload?: string;
  accountDetails?: {
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
    promptpayId?: string;
  };
  redirectUrl?: string;
  transactionRef?: string;
}

export interface PaymentProvider {
  id: PaymentMethod;
  name: string;
  description: string;
  iconName: string;
  isAvailable: boolean;
  initiate(order: Order): Promise<PaymentInitiationResult>;
  verify?(ref: string): Promise<boolean>;
}

/**
 * PromptPay QR Provider
 * Generates promptpay payment payload and instructions
 */
export class PromptPayProvider implements PaymentProvider {
  id: PaymentMethod = 'promptpay';
  name = 'พร้อมเพย์ (PromptPay QR)';
  description = 'สแกน QR Code จ่ายเงินได้ทันทีผ่านทุกแอปธนาคาร';
  iconName = 'QrCode';
  isAvailable = true;

  async initiate(order: Order): Promise<PaymentInitiationResult> {
    const promptpayNumber = process.env.NEXT_PUBLIC_PROMPTPAY_NUMBER || '0812345678';
    
    return {
      success: true,
      requiresAction: true,
      paymentMethod: this.id,
      instructions: `กรุณาสแกน QR Code ด้วยแอปธนาคารของท่าน จำนวนเงิน ${order.total} บาท พร้อมแนบหลักฐานการโอนเงิน`,
      accountDetails: {
        promptpayId: promptpayNumber,
        accountName: 'J3A STORE Co., Ltd.',
      },
      transactionRef: `PP-${order.orderNumber}`,
    };
  }
}

/**
 * Bank Transfer Provider
 */
export class BankTransferProvider implements PaymentProvider {
  id: PaymentMethod = 'bank_transfer';
  name = 'โอนผ่านบัญชีธนาคาร (Bank Transfer)';
  description = 'โอนเงินเข้าบัญชีธนาคารกสิกรไทย / ไทยพาณิชย์';
  iconName = 'Building2';
  isAvailable = true;

  async initiate(order: Order): Promise<PaymentInitiationResult> {
    return {
      success: true,
      requiresAction: true,
      paymentMethod: this.id,
      instructions: `โอนเงินเข้าบัญชี ธ.กสิกรไทย 123-4-56789-0 ชื่อบัญชี J3A STORE แล้วส่งสลิปการโอน`,
      accountDetails: {
        bankName: 'ธนาคารกสิกรไทย (Kasikornbank)',
        accountNumber: '123-4-56789-0',
        accountName: 'J3A STORE Official',
      },
      transactionRef: `BT-${order.orderNumber}`,
    };
  }
}

/**
 * User Wallet Credit Provider
 * Allows spending internal credits if user has enough balance
 */
export class WalletCreditProvider implements PaymentProvider {
  id: PaymentMethod = 'wallet';
  name = 'เครดิตสะสมในบัญชี (Store Credits)';
  description = 'ชำระด้วยยอดเครดิตคงเหลือในกระเป๋าของคุณทันที';
  iconName = 'Wallet';
  isAvailable = true;

  async initiate(order: Order): Promise<PaymentInitiationResult> {
    return {
      success: true,
      requiresAction: false,
      paymentMethod: this.id,
      instructions: 'หักจากยอดเครดิตคงเหลือในบัญชีของคุณเรียบร้อยแล้ว',
      transactionRef: `WAL-${order.orderNumber}`,
    };
  }
}

/**
 * Credit Card / Stripe Provider Stub
 * Architecture ready for plugging in Stripe API key when configured
 */
export class CreditCardProvider implements PaymentProvider {
  id: PaymentMethod = 'credit_card';
  name = 'บัตรเครดิต / เดบิต (Stripe / VISA / Mastercard)';
  description = 'ชำระผ่านบัตรเครดิตและเดบิตอย่างปลอดภัย';
  iconName = 'CreditCard';
  isAvailable = false; // Toggle to true once STRIPE_SECRET_KEY is provided

  async initiate(order: Order): Promise<PaymentInitiationResult> {
    return {
      success: false,
      requiresAction: true,
      paymentMethod: this.id,
      instructions: 'ระบบบัตรเครดิตอยู่ระหว่างเปิดใช้งาน ติดต่อแอดมินสำหรับช่องทางพิเศษ',
      transactionRef: `CC-${order.orderNumber}`,
    };
  }
}

/**
 * Central Payment Service Registry
 */
export class PaymentService {
  private static providers: Map<PaymentMethod, PaymentProvider> = new Map([
    ['promptpay', new PromptPayProvider()],
    ['bank_transfer', new BankTransferProvider()],
    ['wallet', new WalletCreditProvider()],
    ['credit_card', new CreditCardProvider()],
  ]);

  public static getAvailableMethods(): PaymentProvider[] {
    return Array.from(this.providers.values()).filter((p) => p.isAvailable);
  }

  public static getProvider(method: PaymentMethod): PaymentProvider | undefined {
    return this.providers.get(method);
  }

  public static async processPayment(method: PaymentMethod, order: Order): Promise<PaymentInitiationResult> {
    const provider = this.getProvider(method);
    if (!provider) {
      throw new Error(`ไม่พบช่องทางการชำระเงิน: ${method}`);
    }
    return provider.initiate(order);
  }
}
