import React, { createContext, useContext, useState, useEffect } from 'react';

export const CURRENCIES = [
  { code: 'ZAR', symbol: 'R', name: 'South African Rand', flag: '🇿🇦' },
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', flag: '🇨🇦' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc', flag: '🇨🇭' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', flag: '🇨🇳' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', flag: '🇸🇬' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', flag: '🇦🇪' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', flag: '🇳🇬' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', flag: '🇰🇪' },
  { code: 'GHS', symbol: '₵', name: 'Ghanaian Cedi', flag: '🇬🇭' },
  { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound', flag: '🇪🇬' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', flag: '🇧🇷' },
  { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso', flag: '🇲🇽' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', flag: '🇳🇿' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', flag: '🇭🇰' },
];

// Approximate rates relative to ZAR (base currency)
const ZAR_RATES = {
  ZAR: 1, USD: 0.054, EUR: 0.050, GBP: 0.042, AUD: 0.084,
  CAD: 0.074, CHF: 0.047, JPY: 8.1, CNY: 0.39, INR: 4.5,
  SGD: 0.072, AED: 0.20, NGN: 86, KES: 7.1, GHS: 0.82,
  EGP: 2.65, BRL: 0.31, MXN: 1.07, NZD: 0.091, HKD: 0.42,
};

const CurrencyContext = createContext(null);

export function CurrencyProvider({ children }) {
  const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('escropay_currency') : null;
  const initial = CURRENCIES.find(c => c.code === stored) || CURRENCIES[0];
  const [currency, setCurrencyState] = useState(initial);

  const setCurrency = (cur) => {
    setCurrencyState(cur);
    localStorage.setItem('escropay_currency', cur.code);
  };

  // Convert an amount from ZAR to the selected currency
  const convert = (zarAmount) => {
    if (zarAmount == null) return 0;
    const rate = ZAR_RATES[currency.code] || 1;
    return Number(zarAmount) * rate;
  };

  // Convert an amount from the selected currency back to ZAR
  const convertToZAR = (amount) => {
    if (amount == null) return 0;
    const rate = ZAR_RATES[currency.code] || 1;
    return Number(amount) / rate;
  };

  const format = (zarAmount) => {
    const converted = convert(zarAmount);
    if (converted == null) return `${currency.symbol}0.00`;
    return `${currency.symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, format, convert, currencies: CURRENCIES }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
}