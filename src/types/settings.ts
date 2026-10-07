export interface StoreSettings {
  storeName: string;
  promptpay: string;
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
  updatedAt?: string;
}
