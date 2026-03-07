import React from 'react';
import { CurrencyProvider } from '@/components/common/CurrencyContext';

export default function Layout({ children }) {
  return (
    <CurrencyProvider>
      {children}
    </CurrencyProvider>
  );
}