// // COMMENTED OUT - Currency Settings Component
// // This component has been disabled as per user request

// /*
// import React, { useState, useEffect } from 'react';
// import { CurrencySettings, getCurrencyConverter, setGlobalCurrencySettings } from '../../lib/currencyUtils';
// import { useCurrency } from '../../contexts/CurrencyContext';
// import { ArrowUpDown, RefreshCw, Save, AlertCircle } from 'lucide-react';

// interface CurrencySettingsProps {
//   onSave: (settings: CurrencySettings) => void;
//   initialSettings?: CurrencySettings;
// }

// export const CurrencySettingsComponent: React.FC<CurrencySettingsProps> = ({ 
//   onSave, 
//   initialSettings 
// }) => {
//   const { settings, updateSettings } = useCurrency();
//   const [localSettings, setLocalSettings] = useState<CurrencySettings>(settings);

//   const [isLoading, setIsLoading] = useState(false);
//   const [lastFetched, setLastFetched] = useState<string>('');

//   // Fetch current exchange rates from a free API
//   const fetchExchangeRates = async () => {
//     setIsLoading(true);
//     try {
//       // Using exchangerate-api.com (free tier)
//       const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
//       const data = await response.json();
      
//       if (data.rates) {
//         const newRates = {
//           USD: data.rates.INR || 83.0,
//           EUR: (data.rates.INR / data.rates.EUR) || 90.0,
//           INR: 1.0
//         };
        
//         setLocalSettings(prev => ({
//           ...prev,
//           exchangeRates: newRates,
//           lastUpdated: new Date().toISOString()
//         }));
        
//         setLastFetched(new Date().toLocaleString());
//       }
//     } catch (error) {
//       console.error('Failed to fetch exchange rates:', error);
//       // Keep existing rates if fetch fails
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleRateChange = (currency: 'USD' | 'EUR', value: string) => {
//     const numericValue = parseFloat(value) || 0;
//     setLocalSettings(prev => ({
//       ...prev,
//       exchangeRates: {
//         ...prev.exchangeRates,
//         [currency]: numericValue
//       }
//     }));
//   };

//   const handleSave = () => {
//     updateSettings(localSettings);
//     onSave(localSettings);
//   };

//   const handleBaseCurrencyChange = (currency: 'INR' | 'USD' | 'EUR') => {
//     setLocalSettings(prev => ({
//       ...prev,
//       baseCurrency: currency
//     }));
//   };

//   return (
//     <div className="space-y-6">
//       <div className="bg-white rounded-xl shadow-sm border p-6">
//         <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
//           <ArrowUpDown className="h-5 w-5 mr-2 text-blue-600" />
//           Currency Settings
//         </h3>
        
//         <div className="space-y-6">
//           {/* Base Currency Selection */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Base Currency for Financial Analysis
//             </label>
//             <div className="grid grid-cols-3 gap-3">
//               {(['INR', 'USD', 'EUR'] as const).map((currency) => (
//                 <button
//                   key={currency}
//                   onClick={() => handleBaseCurrencyChange(currency)}
//                   className={`p-3 rounded-lg border text-center transition-colors ${
//                     localSettings.baseCurrency === currency
//                       ? 'border-blue-500 bg-blue-50 text-blue-700'
//                       : 'border-gray-200 hover:border-gray-300'
//                   }`}
//                 >
//                   <div className="font-medium">{currency}</div>
//                   <div className="text-xs text-gray-500">
//                     {currency === 'INR' ? '₹ Indian Rupee' : 
//                      currency === 'USD' ? '$ US Dollar' : 
//                      '€ Euro'}
//                   </div>
//                 </button>
//               ))}
//             </div>
//           </div>

//           {/* Exchange Rates */}
//           <div>
//             <div className="flex items-center justify-between mb-4">
//               <label className="block text-sm font-medium text-gray-700">
//                 Exchange Rates (to INR)
//               </label>
//               <button
//                 onClick={fetchExchangeRates}
//                 disabled={isLoading}
//                 className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
//               >
//                 <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
//                 {isLoading ? 'Fetching...' : 'Fetch Latest'}
//               </button>
//             </div>

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   USD to INR Rate
//                 </label>
//                 <div className="relative">
//                   <input
//                     type="number"
//                     step="0.01"
//                     value={localSettings.exchangeRates.USD}
//                     onChange={(e) => handleRateChange('USD', e.target.value)}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                     placeholder="83.00"
//                   />
//                   <div className="absolute right-3 top-2 text-sm text-gray-500">
//                     1 USD = ₹{localSettings.exchangeRates.USD}
//                   </div>
//                 </div>
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   EUR to INR Rate
//                 </label>
//                 <div className="relative">
//                   <input
//                     type="number"
//                     step="0.01"
//                     value={localSettings.exchangeRates.EUR}
//                     onChange={(e) => handleRateChange('EUR', e.target.value)}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                     placeholder="90.00"
//                   />
//                   <div className="absolute right-3 top-2 text-sm text-gray-500">
//                     1 EUR = ₹{localSettings.exchangeRates.EUR}
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {lastFetched && (
//               <p className="text-xs text-gray-500 mt-2">
//                 Last fetched: {lastFetched}
//               </p>
//             )}
//           </div>

//           {/* Currency Preview */}
//           <div className="bg-gray-50 rounded-lg p-4">
//             <h4 className="font-medium text-gray-900 mb-3">Currency Preview</h4>
//             <div className="grid grid-cols-3 gap-4 text-sm">
//               <div className="text-center">
//                 <div className="font-medium text-gray-700">Sample Amount</div>
//                 <div className="text-lg font-bold text-gray-900">₹1,00,000</div>
//                 <div className="text-xs text-gray-500">INR</div>
//               </div>
//               <div className="text-center">
//                 <div className="font-medium text-gray-700">In USD</div>
//                 <div className="text-lg font-bold text-gray-900">
//                   ${(100000 / localSettings.exchangeRates.USD).toFixed(0)}
//                 </div>
//                 <div className="text-xs text-gray-500">USD</div>
//               </div>
//               <div className="text-center">
//                 <div className="font-medium text-gray-700">In EUR</div>
//                 <div className="text-lg font-bold text-gray-900">
//                   €{(100000 / localSettings.exchangeRates.EUR).toFixed(0)}
//                 </div>
//                 <div className="text-xs text-gray-500">EUR</div>
//               </div>
//             </div>
//           </div>

//           {/* Warning */}
//           <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
//             <div className="flex items-start">
//               <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
//               <div>
//                 <h4 className="font-medium text-yellow-800">Important Note</h4>
//                 <p className="text-sm text-yellow-700 mt-1">
//                   Exchange rates change daily. Update rates regularly for accurate financial analysis. 
//                   The "Fetch Latest" button uses a free API and may have limitations.
//                 </p>
//               </div>
//             </div>
//           </div>

//           {/* Save Button */}
//           <div className="flex justify-end">
//             <button
//               onClick={handleSave}
//               className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
//             >
//               <Save className="h-4 w-4 mr-2" />
//               Save Currency Settings
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };
// */

// // Placeholder component to prevent import errors
// export const CurrencySettingsComponent = () => {
//   return (
//     <div className="bg-white rounded-xl shadow-sm border p-6">
//       <h3 className="text-lg font-semibold text-gray-900 mb-4">
//         Currency Settings (Disabled)
//       </h3>
//       <p className="text-gray-600">
//         Currency settings have been temporarily disabled.
//       </p>
//     </div>
//   );
// };