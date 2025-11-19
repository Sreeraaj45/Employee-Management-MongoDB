// COMMENTED OUT - Currency Context
// This context has been disabled as per user request

/*
import React, { createContext, useContext, useState, useEffect } from 'react';
import { CurrencySettings, getCurrencyConverter, setGlobalCurrencySettings } from '../lib/currencyUtils';

interface CurrencyContextType {
  settings: CurrencySettings;
  updateSettings: (settings: CurrencySettings) => void;
  converter: any; // CurrencyConverter instance
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

interface CurrencyProviderProps {
  children: React.ReactNode;
}

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<CurrencySettings>(() => {
    // Load from localStorage or use default
    const saved = localStorage.getItem('currencySettings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.error('Failed to parse saved currency settings:', error);
      }
    }
    return {
      baseCurrency: 'INR',
      exchangeRates: {
        USD: 83.0,
        EUR: 90.0,
        INR: 1.0
      },
      lastUpdated: new Date().toISOString()
    };
  });

  const converter = getCurrencyConverter();

  // Update global converter when settings change
  useEffect(() => {
    converter.setSettings(settings);
    setGlobalCurrencySettings(settings);
  }, [settings, converter]);

  const updateSettings = (newSettings: CurrencySettings) => {
    setSettings(newSettings);
    localStorage.setItem('currencySettings', JSON.stringify(newSettings));
  };

  return (
    <CurrencyContext.Provider value={{ settings, updateSettings, converter }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
*/

// Placeholder exports to prevent import errors
export const CurrencyProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export const useCurrency = () => {
  return {
    settings: {
      baseCurrency: 'INR' as const,
      exchangeRates: { USD: 83.0, EUR: 90.0, INR: 1.0 },
      lastUpdated: new Date().toISOString()
    },
    updateSettings: () => {},
    converter: {
      convert: (amount: number, from: string, to: string) => amount,
      format: (amount: number, currency: string) => `${currency} ${amount}`
    }
  };
};