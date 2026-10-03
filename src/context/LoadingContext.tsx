'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';

interface LoadingContextType {
  isLoading: boolean;
  loadingText: string;
  showLoading: (text?: string) => void;
  hideLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('กำลังประมวลผล กรุณารอสักครู่...');

  const showLoading = useCallback((text?: string) => {
    setLoadingText(text || 'กำลังประมวลผล กรุณารอสักครู่...');
    setIsLoading(true);
  }, []);

  const hideLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  const value = useMemo(
    () => ({
      isLoading,
      loadingText,
      showLoading,
      hideLoading,
    }),
    [isLoading, loadingText, showLoading, hideLoading]
  );

  return (
    <LoadingContext.Provider value={value}>
      {children}
      <LoadingOverlay isOpen={isLoading} message={loadingText} />
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}
