// COMMENTED OUT - Currency Utils
// This file has been disabled as per user request

/*
export interface CurrencySettings {
  baseCurrency: 'INR' | 'USD' | 'EUR';
  exchangeRates: {
    USD: number; // 1 USD = X INR
    EUR: number; // 1 EUR = X INR
    INR: number; // 1 INR = 1 INR
  };
  lastUpdated: string;
}

export const defaultCurrencySettings: CurrencySettings = {
  baseCurrency: 'INR',
  exchangeRates: {
    USD: 83.0, // Default rate: 1 USD = 83 INR
    EUR: 90.0, // Default rate: 1 EUR = 90 INR
    INR: 1.0
  },
  lastUpdated: new Date().toISOString()
};

export class CurrencyConverter {
  private settings: CurrencySettings;

  constructor(settings: CurrencySettings = defaultCurrencySettings) {
    this.settings = settings;
  }

  setSettings(settings: CurrencySettings) {
    this.settings = settings;
  }

  convert(amount: number, fromCurrency: string, toCurrency: string): number {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    // Convert to INR first (base currency)
    let amountInINR = amount;
    if (fromCurrency !== 'INR') {
      amountInINR = amount * this.settings.exchangeRates[fromCurrency as keyof typeof this.settings.exchangeRates];
    }

    // Convert from INR to target currency
    if (toCurrency === 'INR') {
      return amountInINR;
    } else {
      return amountInINR / this.settings.exchangeRates[toCurrency as keyof typeof this.settings.exchangeRates];
    }
  }

  format(amount: number, currency: string): string {
    const formatters: { [key: string]: Intl.NumberFormat } = {
      INR: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }),
      USD: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
      EUR: new Intl.NumberFormat('en-EU', { style: 'currency', currency: 'EUR' })
    };

    const formatter = formatters[currency];
    if (formatter) {
      return formatter.format(amount);
    }

    // Fallback formatting
    return `${currency} ${amount.toFixed(2)}`;
  }

  formatWithConversion(amount: number, fromCurrency: string, toCurrency: string): string {
    const convertedAmount = this.convert(amount, fromCurrency, toCurrency);
    return this.format(convertedAmount, toCurrency);
  }
}

// Global converter instance
let globalConverter: CurrencyConverter | null = null;
let globalSettings: CurrencySettings | null = null;

export const getCurrencyConverter = (): CurrencyConverter => {
  if (!globalConverter) {
    globalConverter = new CurrencyConverter(globalSettings || defaultCurrencySettings);
  }
  return globalConverter;
};

export const setGlobalCurrencySettings = (settings: CurrencySettings) => {
  globalSettings = settings;
  if (globalConverter) {
    globalConverter.setSettings(settings);
  }
};
*/

// Placeholder exports to prevent import errors
export interface CurrencySettings {
  baseCurrency: 'INR' | 'USD' | 'EUR';
  exchangeRates: {
    USD: number;
    EUR: number;
    INR: number;
  };
  lastUpdated: string;
}

export const defaultCurrencySettings: CurrencySettings = {
  baseCurrency: 'INR',
  exchangeRates: {
    USD: 83.0,
    EUR: 90.0,
    INR: 1.0
  },
  lastUpdated: new Date().toISOString()
};

export class CurrencyConverter {
  private settings: CurrencySettings;

  constructor(settings: CurrencySettings = defaultCurrencySettings) {
    this.settings = settings;
  }

  setSettings(settings: CurrencySettings) {
    this.settings = settings;
  }

  convert(amount: number, fromCurrency: string, toCurrency: string): number {
    return amount; // Disabled - always return original amount
  }

  format(amount: number, currency: string): string {
    return `${currency} ${amount.toFixed(2)}`; // Simple formatting
  }

  formatWithConversion(amount: number, fromCurrency: string, toCurrency: string): string {
    return this.format(amount, toCurrency); // No conversion
  }
}

let globalConverter: CurrencyConverter | null = null;
let globalSettings: CurrencySettings | null = null;

export const getCurrencyConverter = (): CurrencyConverter => {
  if (!globalConverter) {
    globalConverter = new CurrencyConverter(globalSettings || defaultCurrencySettings);
  }
  return globalConverter;
};

export const setGlobalCurrencySettings = (settings: CurrencySettings) => {
  globalSettings = settings;
  if (globalConverter) {
    globalConverter.setSettings(settings);
  }
};