export interface StoreSettings {
  storeName: string;
  promptpay: string;
  /** เบอร์ TrueMoney Wallet สำหรับรับเงินซองของขวัญ (Angpao Voucher) */
  truemoneyPhone?: string;
  lineContact: string;
  discordContact: string;
  announcement: string;
  /** ค่าจัดส่งมาตรฐาน (บาท) — ตั้ง 0 = ฟรีเสมอ */
  shippingFee: number;
  /** ยอดซื้อขั้นต่ำที่จะได้ฟรีค่าจัดส่ง (บาท) — ตั้ง 0 = ฟรีเสมอ */
  freeShippingThreshold: number;
  /** ลิงก์วิดีโอ YouTube Showcase สำหรับหน้าแรก (วิธีใช้งานร้านค้า) */
  showcaseYoutubeUrl?: string;
  /** หัวข้อ Showcase */
  showcaseTitle?: string;
  /** คำอธิบายย่อย Showcase */
  showcaseSubtitle?: string;
  /** รูป 1: แท็กหัวข้อ Hero Section (เช่น NEXT-GEN E-COMMERCE & DIGITAL STORE) */
  heroTagline?: string;
  /** รูป 1: คำอธิบายร้านค้าใน Hero Section */
  heroDescription?: string;
  /** รูป 2: นโยบายความเป็นส่วนตัว (Privacy Policy) */
  privacyPolicy?: string;
  /** รูป 3: คำอธิบายร้านค้าท้ายเว็บ (Footer Description) */
  footerDescription?: string;
  updatedAt?: string;
}
