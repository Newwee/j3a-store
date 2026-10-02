'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { LicenseAgreementCard } from './LicenseAgreementCard';

interface LicenseAgreementModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAgreed: boolean;
  onAgreementChange: (agreed: boolean) => void;
  onConfirm: () => void;
  isProcessing?: boolean;
}

export function LicenseAgreementModal({
  isOpen,
  onClose,
  isAgreed,
  onAgreementChange,
  onConfirm,
  isProcessing = false,
}: LicenseAgreementModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="ข้อตกลงการสั่งซื้อ License Key"
      maxWidth="md"
    >
      <div className="pt-2">
        <LicenseAgreementCard
          isAgreed={isAgreed}
          onAgreementChange={onAgreementChange}
          showPaymentButton={true}
          onProceedToPayment={onConfirm}
          isProcessing={isProcessing}
        />
      </div>
    </Modal>
  );
}

export default LicenseAgreementModal;
