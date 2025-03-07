import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '../../ui/dialog';
import WidgetHeader from '../common/WidgetHeader';
import { CurrencyConverterWidgetProps, CurrencyConverterWidgetConfig } from './types';

// Comprehensive currency database
// This includes all currencies supported by Open Exchange Rates
const CURRENCIES: Record<string, { name: string; symbol: string }> = {
  AED: { name: 'United Arab Emirates Dirham', symbol: 'د.إ' },
  AFN: { name: 'Afghan Afghani', symbol: '؋' },
  ALL: { name: 'Albanian Lek', symbol: 'L' },
  AMD: { name: 'Armenian Dram', symbol: '֏' },
  ANG: { name: 'Netherlands Antillean Guilder', symbol: 'ƒ' },
  AOA: { name: 'Angolan Kwanza', symbol: 'Kz' },
  ARS: { name: 'Argentine Peso', symbol: '$' },
  AUD: { name: 'Australian Dollar', symbol: 'A$' },
  AWG: { name: 'Aruban Florin', symbol: 'ƒ' },
  AZN: { name: 'Azerbaijani Manat', symbol: '₼' },
  BAM: { name: 'Bosnia-Herzegovina Convertible Mark', symbol: 'KM' },
  BBD: { name: 'Barbadian Dollar', symbol: '$' },
  BDT: { name: 'Bangladeshi Taka', symbol: '৳' },
  BGN: { name: 'Bulgarian Lev', symbol: 'лв' },
  BHD: { name: 'Bahraini Dinar', symbol: '.د.ب' },
  BIF: { name: 'Burundian Franc', symbol: 'FBu' },
  BMD: { name: 'Bermudan Dollar', symbol: '$' },
  BND: { name: 'Brunei Dollar', symbol: '$' },
  BOB: { name: 'Bolivian Boliviano', symbol: 'Bs.' },
  BRL: { name: 'Brazilian Real', symbol: 'R$' },
  BSD: { name: 'Bahamian Dollar', symbol: '$' },
  BTC: { name: 'Bitcoin', symbol: '₿' },
  BTN: { name: 'Bhutanese Ngultrum', symbol: 'Nu.' },
  BWP: { name: 'Botswanan Pula', symbol: 'P' },
  BYN: { name: 'Belarusian Ruble', symbol: 'Br' },
  BZD: { name: 'Belize Dollar', symbol: 'BZ$' },
  CAD: { name: 'Canadian Dollar', symbol: 'C$' },
  CDF: { name: 'Congolese Franc', symbol: 'FC' },
  CHF: { name: 'Swiss Franc', symbol: 'Fr' },
  CLF: { name: 'Chilean Unit of Account (UF)', symbol: 'UF' },
  CLP: { name: 'Chilean Peso', symbol: '$' },
  CNH: { name: 'Chinese Yuan (Offshore)', symbol: '¥' },
  CNY: { name: 'Chinese Yuan', symbol: '¥' },
  COP: { name: 'Colombian Peso', symbol: '$' },
  CRC: { name: 'Costa Rican Colón', symbol: '₡' },
  CUC: { name: 'Cuban Convertible Peso', symbol: '$' },
  CUP: { name: 'Cuban Peso', symbol: '₱' },
  CVE: { name: 'Cape Verdean Escudo', symbol: '$' },
  CZK: { name: 'Czech Republic Koruna', symbol: 'Kč' },
  DJF: { name: 'Djiboutian Franc', symbol: 'Fdj' },
  DKK: { name: 'Danish Krone', symbol: 'kr' },
  DOP: { name: 'Dominican Peso', symbol: 'RD$' },
  DZD: { name: 'Algerian Dinar', symbol: 'د.ج' },
  EGP: { name: 'Egyptian Pound', symbol: 'E£' },
  ERN: { name: 'Eritrean Nakfa', symbol: 'Nfk' },
  ETB: { name: 'Ethiopian Birr', symbol: 'Br' },
  EUR: { name: 'Euro', symbol: '€' },
  FJD: { name: 'Fijian Dollar', symbol: '$' },
  FKP: { name: 'Falkland Islands Pound', symbol: '£' },
  GBP: { name: 'British Pound Sterling', symbol: '£' },
  GEL: { name: 'Georgian Lari', symbol: '₾' },
  GGP: { name: 'Guernsey Pound', symbol: '£' },
  GHS: { name: 'Ghanaian Cedi', symbol: '₵' },
  GIP: { name: 'Gibraltar Pound', symbol: '£' },
  GMD: { name: 'Gambian Dalasi', symbol: 'D' },
  GNF: { name: 'Guinean Franc', symbol: 'FG' },
  GTQ: { name: 'Guatemalan Quetzal', symbol: 'Q' },
  GYD: { name: 'Guyanaese Dollar', symbol: '$' },
  HKD: { name: 'Hong Kong Dollar', symbol: 'HK$' },
  HNL: { name: 'Honduran Lempira', symbol: 'L' },
  HRK: { name: 'Croatian Kuna', symbol: 'kn' },
  HTG: { name: 'Haitian Gourde', symbol: 'G' },
  HUF: { name: 'Hungarian Forint', symbol: 'Ft' },
  IDR: { name: 'Indonesian Rupiah', symbol: 'Rp' },
  ILS: { name: 'Israeli New Sheqel', symbol: '₪' },
  IMP: { name: 'Manx pound', symbol: '£' },
  INR: { name: 'Indian Rupee', symbol: '₹' },
  IQD: { name: 'Iraqi Dinar', symbol: 'ع.د' },
  IRR: { name: 'Iranian Rial', symbol: '﷼' },
  ISK: { name: 'Icelandic Króna', symbol: 'kr' },
  JEP: { name: 'Jersey Pound', symbol: '£' },
  JMD: { name: 'Jamaican Dollar', symbol: 'J$' },
  JOD: { name: 'Jordanian Dinar', symbol: 'د.ا' },
  JPY: { name: 'Japanese Yen', symbol: '¥' },
  KES: { name: 'Kenyan Shilling', symbol: 'KSh' },
  KGS: { name: 'Kyrgystani Som', symbol: 'с' },
  KHR: { name: 'Cambodian Riel', symbol: '៛' },
  KMF: { name: 'Comorian Franc', symbol: 'CF' },
  KPW: { name: 'North Korean Won', symbol: '₩' },
  KRW: { name: 'South Korean Won', symbol: '₩' },
  KWD: { name: 'Kuwaiti Dinar', symbol: 'د.ك' },
  KYD: { name: 'Cayman Islands Dollar', symbol: '$' },
  KZT: { name: 'Kazakhstani Tenge', symbol: '₸' },
  LAK: { name: 'Laotian Kip', symbol: '₭' },
  LBP: { name: 'Lebanese Pound', symbol: 'ل.ل' },
  LKR: { name: 'Sri Lankan Rupee', symbol: 'Rs' },
  LRD: { name: 'Liberian Dollar', symbol: '$' },
  LSL: { name: 'Lesotho Loti', symbol: 'L' },
  LYD: { name: 'Libyan Dinar', symbol: 'ل.د' },
  MAD: { name: 'Moroccan Dirham', symbol: 'د.م.' },
  MDL: { name: 'Moldovan Leu', symbol: 'L' },
  MGA: { name: 'Malagasy Ariary', symbol: 'Ar' },
  MKD: { name: 'Macedonian Denar', symbol: 'ден' },
  MMK: { name: 'Myanma Kyat', symbol: 'K' },
  MNT: { name: 'Mongolian Tugrik', symbol: '₮' },
  MOP: { name: 'Macanese Pataca', symbol: 'MOP$' },
  MRU: { name: 'Mauritanian Ouguiya', symbol: 'UM' },
  MUR: { name: 'Mauritian Rupee', symbol: '₨' },
  MVR: { name: 'Maldivian Rufiyaa', symbol: 'Rf' },
  MWK: { name: 'Malawian Kwacha', symbol: 'MK' },
  MXN: { name: 'Mexican Peso', symbol: 'Mex$' },
  MYR: { name: 'Malaysian Ringgit', symbol: 'RM' },
  MZN: { name: 'Mozambican Metical', symbol: 'MT' },
  NAD: { name: 'Namibian Dollar', symbol: '$' },
  NGN: { name: 'Nigerian Naira', symbol: '₦' },
  NIO: { name: 'Nicaraguan Córdoba', symbol: 'C$' },
  NOK: { name: 'Norwegian Krone', symbol: 'kr' },
  NPR: { name: 'Nepalese Rupee', symbol: 'रू' },
  NZD: { name: 'New Zealand Dollar', symbol: 'NZ$' },
  OMR: { name: 'Omani Rial', symbol: 'ر.ع.' },
  PAB: { name: 'Panamanian Balboa', symbol: 'B/.' },
  PEN: { name: 'Peruvian Nuevo Sol', symbol: 'S/' },
  PGK: { name: 'Papua New Guinean Kina', symbol: 'K' },
  PHP: { name: 'Philippine Peso', symbol: '₱' },
  PKR: { name: 'Pakistani Rupee', symbol: '₨' },
  PLN: { name: 'Polish Zloty', symbol: 'zł' },
  PYG: { name: 'Paraguayan Guarani', symbol: '₲' },
  QAR: { name: 'Qatari Rial', symbol: 'ر.ق' },
  RON: { name: 'Romanian Leu', symbol: 'lei' },
  RSD: { name: 'Serbian Dinar', symbol: 'дин' },
  RUB: { name: 'Russian Ruble', symbol: '₽' },
  RWF: { name: 'Rwandan Franc', symbol: 'RF' },
  SAR: { name: 'Saudi Riyal', symbol: 'ر.س' },
  SBD: { name: 'Solomon Islands Dollar', symbol: '$' },
  SCR: { name: 'Seychellois Rupee', symbol: '₨' },
  SDG: { name: 'Sudanese Pound', symbol: 'ج.س.' },
  SEK: { name: 'Swedish Krona', symbol: 'kr' },
  SGD: { name: 'Singapore Dollar', symbol: 'S$' },
  SHP: { name: 'Saint Helena Pound', symbol: '£' },
  SLL: { name: 'Sierra Leonean Leone', symbol: 'Le' },
  SOS: { name: 'Somali Shilling', symbol: 'S' },
  SRD: { name: 'Surinamese Dollar', symbol: '$' },
  SSP: { name: 'South Sudanese Pound', symbol: '£' },
  STN: { name: 'São Tomé and Príncipe Dobra', symbol: 'Db' },
  SVC: { name: 'Salvadoran Colón', symbol: '₡' },
  SYP: { name: 'Syrian Pound', symbol: 'LS' },
  SZL: { name: 'Swazi Lilangeni', symbol: 'L' },
  THB: { name: 'Thai Baht', symbol: '฿' },
  TJS: { name: 'Tajikistani Somoni', symbol: 'ЅМ' },
  TMT: { name: 'Turkmenistani Manat', symbol: 'm' },
  TND: { name: 'Tunisian Dinar', symbol: 'د.ت' },
  TOP: { name: 'Tongan Pa\'anga', symbol: 'T$' },
  TRY: { name: 'Turkish Lira', symbol: '₺' },
  TTD: { name: 'Trinidad and Tobago Dollar', symbol: 'TT$' },
  TWD: { name: 'New Taiwan Dollar', symbol: 'NT$' },
  TZS: { name: 'Tanzanian Shilling', symbol: 'TSh' },
  UAH: { name: 'Ukrainian Hryvnia', symbol: '₴' },
  UGX: { name: 'Ugandan Shilling', symbol: 'USh' },
  USD: { name: 'United States Dollar', symbol: '$' },
  UYU: { name: 'Uruguayan Peso', symbol: '$U' },
  UZS: { name: 'Uzbekistan Som', symbol: 'so\'m' },
  VES: { name: 'Venezuelan Bolívar Soberano', symbol: 'Bs.S' },
  VND: { name: 'Vietnamese Dong', symbol: '₫' },
  VUV: { name: 'Vanuatu Vatu', symbol: 'VT' },
  WST: { name: 'Samoan Tala', symbol: 'WS$' },
  XAF: { name: 'CFA Franc BEAC', symbol: 'FCFA' },
  XAG: { name: 'Silver Ounce', symbol: 'XAG' },
  XAU: { name: 'Gold Ounce', symbol: 'XAU' },
  XCD: { name: 'East Caribbean Dollar', symbol: 'EC$' },
  XDR: { name: 'Special Drawing Rights', symbol: 'XDR' },
  XOF: { name: 'CFA Franc BCEAO', symbol: 'CFA' },
  XPD: { name: 'Palladium Ounce', symbol: 'XPD' },
  XPF: { name: 'CFP Franc', symbol: '₣' },
  XPT: { name: 'Platinum Ounce', symbol: 'XPT' },
  YER: { name: 'Yemeni Rial', symbol: '﷼' },
  ZAR: { name: 'South African Rand', symbol: 'R' },
  ZMW: { name: 'Zambian Kwacha', symbol: 'ZK' },
  ZWL: { name: 'Zimbabwean Dollar', symbol: 'Z$' }
};

// Common currencies to show at the top of selection lists
const POPULAR_CURRENCIES = [
  'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'HKD', 'NZD', 'SEK',
  'KRW', 'SGD', 'NOK', 'MXN', 'INR', 'RUB', 'ZAR', 'TRY', 'BRL', 'TWD'
];

// Type for conversion result
interface ConversionResult {
  code: string;
  name: string;
  symbol: string;
  rate: number;
  value: string;
}

// Custom hook for fetching exchange rates
const useExchangeRates = (apiKey?: string, baseCurrency: string = 'USD', autoRefresh: boolean = false, refreshInterval: number = 60) => {
  const [rates, setRates] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const fetchRates = async () => {
    if (!apiKey) {
      setError('API key is required');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`https://openexchangerates.org/api/latest.json?app_id=${apiKey}&base=${baseCurrency}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      setRates(data.rates);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch exchange rates');
    } finally {
      setLoading(false);
    }
  };
  
  // Initial fetch
  useEffect(() => {
    if (apiKey) {
      fetchRates();
    }
  }, [apiKey, baseCurrency]);
  
  // Set up auto-refresh if enabled
  useEffect(() => {
    if (autoRefresh && apiKey) {
      const intervalId = setInterval(() => {
        fetchRates();
      }, refreshInterval * 60 * 1000);
      
      return () => clearInterval(intervalId);
    }
  }, [autoRefresh, refreshInterval, apiKey, baseCurrency]);
  
  return { rates, loading, error, lastUpdated, refetch: fetchRates };
};

/**
 * Currency Converter Widget Component
 * 
 * A widget that allows users to convert between currencies using Open Exchange Rates API.
 * 
 * @param {CurrencyConverterWidgetProps} props - Component props
 * @returns {JSX.Element} Widget component
 */
const CurrencyConverterWidget: React.FC<CurrencyConverterWidgetProps> = ({ width, height, config }) => {
  // Default configuration
  const defaultConfig: CurrencyConverterWidgetConfig = {
    title: 'Currency Converter',
    baseCurrency: 'USD',
    targetCurrencies: ['EUR', 'GBP', 'JPY'],
    autoRefresh: false,
    refreshInterval: 60, // 1 hour
  };

  // Component state
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [localConfig, setLocalConfig] = useState<CurrencyConverterWidgetConfig>({
    ...defaultConfig,
    ...config,
  });
  const [amount, setAmount] = useState<string>('100');
  const [selectedCurrency, setSelectedCurrency] = useState<string>(
    localConfig.targetCurrencies?.[0] || 'EUR'
  );
  
  // Ref for the widget container
  const widgetRef = useRef<HTMLDivElement | null>(null);
  
  // Update local config when props config changes
  useEffect(() => {
    setLocalConfig((prevConfig) => ({
      ...prevConfig,
      ...config,
    }));
  }, [config]);
  
  // Fetch exchange rates
  const { 
    rates, 
    loading, 
    error, 
    lastUpdated, 
    refetch 
  } = useExchangeRates(
    localConfig.apiKey,
    localConfig.baseCurrency,
    localConfig.autoRefresh,
    localConfig.refreshInterval
  );
  
  // Calculate conversions for all target currencies
  const conversions = React.useMemo(() => {
    if (!rates || !localConfig.targetCurrencies) return [];
    
    const numericAmount = parseFloat(amount) || 0;
    
    return localConfig.targetCurrencies.map(currency => ({
      code: currency,
      name: CURRENCIES[currency as keyof typeof CURRENCIES]?.name || currency,
      symbol: CURRENCIES[currency as keyof typeof CURRENCIES]?.symbol || '',
      rate: rates[currency] || 0,
      value: (numericAmount * (rates[currency] || 0)).toFixed(2),
    }));
  }, [rates, amount, localConfig.targetCurrencies]);
  
  // Handle amount input change
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only numbers and decimals
    const value = e.target.value.replace(/[^0-9.]/g, '');
    setAmount(value);
  };
  
  // Render content based on widget size
  const renderContent = () => {
    // Adapt content based on widget dimensions
    if (width >= 4 && height >= 4) {
      return renderLargeView();
    } else if (width >= 4) {
      return renderWideView();
    } else if (height >= 4) {
      return renderTallView();
    } else {
      return renderDefaultView();
    }
  };
  
  // Default view (2x2)
  const renderDefaultView = () => {
    // In the small view, only show one conversion
    const conversion = conversions.find((c: ConversionResult) => c.code === selectedCurrency) || conversions[0];
    
    return (
      <div className="flex flex-col h-full justify-between">
        {!localConfig.apiKey ? (
          <div className="text-center text-gray-500 dark:text-gray-400 h-full flex items-center justify-center">
            <p>Please add an API key in settings</p>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 h-full flex items-center justify-center">
            <p>{error}</p>
          </div>
        ) : loading && !rates ? (
          <div className="text-center text-gray-500 dark:text-gray-400 h-full flex items-center justify-center">
            <p>Loading rates...</p>
          </div>
        ) : (
          <>
            {/* Input amount */}
            <div className="flex items-center mb-2">
              <input
                type="text"
                value={amount}
                onChange={handleAmountChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                aria-label={`Amount in ${localConfig.baseCurrency}`}
                placeholder={localConfig.baseCurrency}
              />
            </div>
            
            {/* Result */}
            {conversion && (
              <div className="flex-grow flex flex-col items-center justify-center">
                {/* Currency selector */}
                <select 
                  value={selectedCurrency}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedCurrency(e.target.value)}
                  className="mb-2 px-2 py-1 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium"
                  aria-label="Select target currency"
                >
                  {conversions.map((c: ConversionResult) => (
                    <option key={c.code} value={c.code}>
                      {c.code}
                    </option>
                  ))}
                </select>
                
                {/* Conversion result - large and prominent */}
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {conversion.symbol}{conversion.value}
                  </p>
                </div>
              </div>
            )}
            
            {/* Last updated footer */}
            {lastUpdated && (
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Updated: {lastUpdated.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </div>
            )}
          </>
        )}
      </div>
    );
  };
  
  // Wide view (4x2 or larger width)
  const renderWideView = () => {
    return (
      <div className="flex flex-col h-full">
        {!localConfig.apiKey ? (
          <div className="text-center text-gray-500 dark:text-gray-400 h-full flex items-center justify-center">
            <p>Please add an API key in settings</p>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 h-full flex items-center justify-center">
            <p>{error}</p>
          </div>
        ) : loading && !rates ? (
          <div className="text-center text-gray-500 dark:text-gray-400 h-full flex items-center justify-center">
            <p>Loading rates...</p>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <div className="flex items-center">
                <label htmlFor="amount-input" className="block text-sm font-medium mr-2">
                  {localConfig.baseCurrency}
                </label>
                <input
                  id="amount-input"
                  type="text"
                  value={amount}
                  onChange={handleAmountChange}
                  className="w-40 px-3 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                  aria-label={`Amount in ${localConfig.baseCurrency}`}
                />
                <button
                  onClick={refetch}
                  className="ml-2 p-1 text-gray-500 hover:text-blue-500"
                  aria-label="Refresh rates"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 overflow-y-auto">
              {conversions.map((conversion: ConversionResult) => (
                <div key={conversion.code} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-md">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{conversion.code}</span>
                    <span className="text-lg font-bold">{conversion.symbol}{conversion.value}</span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    1 {localConfig.baseCurrency} = {conversion.rate.toFixed(4)} {conversion.code}
                  </div>
                </div>
              ))}
            </div>
            
            {lastUpdated && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Updated: {lastUpdated.toLocaleTimeString()}
              </div>
            )}
          </>
        )}
      </div>
    );
  };
  
  // Tall view (2x4 or larger height)
  const renderTallView = () => {
    return (
      <div className="flex flex-col h-full">
        {!localConfig.apiKey ? (
          <div className="text-center text-gray-500 dark:text-gray-400 h-full flex items-center justify-center">
            <p>Please add an API key in settings</p>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 h-full flex items-center justify-center">
            <p>{error}</p>
          </div>
        ) : loading && !rates ? (
          <div className="text-center text-gray-500 dark:text-gray-400 h-full flex items-center justify-center">
            <p>Loading rates...</p>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <div className="flex items-center">
                <label htmlFor="amount-input-tall" className="block text-sm font-medium mr-2">
                  {localConfig.baseCurrency}
                </label>
                <input
                  id="amount-input-tall"
                  type="text"
                  value={amount}
                  onChange={handleAmountChange}
                  className="w-full px-3 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                  aria-label={`Amount in ${localConfig.baseCurrency}`}
                />
              </div>
            </div>
            
            <div className="space-y-2 overflow-y-auto flex-grow">
              {conversions.map((conversion: ConversionResult) => (
                <div key={conversion.code} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-md">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{conversion.code}</span>
                    <span className="text-lg font-bold">{conversion.symbol}{conversion.value}</span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    1 {localConfig.baseCurrency} = {conversion.rate.toFixed(4)} {conversion.code}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-2 flex justify-between items-center">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {lastUpdated && `Updated: ${lastUpdated.toLocaleTimeString()}`}
              </div>
              <button
                onClick={refetch}
                className="p-1 text-gray-500 hover:text-blue-500"
                aria-label="Refresh rates"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </>
        )}
      </div>
    );
  };
  
  // Large view (4x4 or larger)
  const renderLargeView = () => {
    return (
      <div className="flex flex-col h-full">
        {!localConfig.apiKey ? (
          <div className="text-center text-gray-500 dark:text-gray-400 h-full flex items-center justify-center">
            <p>Please add an API key in settings</p>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 h-full flex items-center justify-center">
            <p>{error}</p>
          </div>
        ) : loading && !rates ? (
          <div className="text-center text-gray-500 dark:text-gray-400 h-full flex items-center justify-center">
            <p>Loading rates...</p>
          </div>
        ) : (
          <>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex-1 relative">
                <input
                  id="amount-input-large"
                  type="text"
                  value={amount}
                  onChange={handleAmountChange}
                  className="w-full pl-3 pr-12 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  aria-label={`Amount in ${localConfig.baseCurrency}`}
                  placeholder="Amount"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium">
                  {localConfig.baseCurrency}
                </div>
              </div>
              
              <button
                onClick={refetch}
                className="ml-2 p-2 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-full transition-colors"
                aria-label="Refresh rates"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-2 overflow-y-auto flex-1">
              {conversions.slice(0, 4).map((conversion: ConversionResult) => (
                <div 
                  key={conversion.code} 
                  className="p-3 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-850 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow transition-all"
                >
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="flex items-center">
                      <span className="w-6 h-6 flex items-center justify-center bg-blue-50 dark:bg-gray-700 rounded-full mr-1.5">
                        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">{conversion.code.slice(0, 1)}</span>
                      </span>
                      <span className="text-sm font-medium truncate">{conversion.name}</span>
                    </span>
                    <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-1.5 py-0.5 rounded-md font-medium">
                      {conversion.code}
                    </span>
                  </div>
                  <div className="text-xl font-bold">
                    {conversion.symbol}{conversion.value}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    1 {localConfig.baseCurrency} = {conversion.rate.toFixed(4)} {conversion.code}
                  </div>
                </div>
              ))}
            </div>
            
            {lastUpdated && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-right">
                Updated: {lastUpdated.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </div>
            )}
          </>
        )}
      </div>
    );
  };
  
  // Save settings
  const saveSettings = () => {
    if (config?.onUpdate) {
      config.onUpdate(localConfig);
    }
    setShowSettings(false);
  };
  
  // Settings dialog
  const renderSettings = () => {
    // Get all currency codes
    const allCurrencyCodes = Object.keys(CURRENCIES);
    
    // Organize currencies with popular ones first
    const organizedCurrencyCodes = [
      ...POPULAR_CURRENCIES,
      ...allCurrencyCodes.filter(code => !POPULAR_CURRENCIES.includes(code))
    ];
    
    // Filter function for search
    const [searchQuery, setSearchQuery] = useState('');
    const filteredCurrencies = organizedCurrencyCodes.filter(code => {
      const currencyName = CURRENCIES[code as keyof typeof CURRENCIES]?.name || '';
      return code.toLowerCase().includes(searchQuery.toLowerCase()) || 
             currencyName.toLowerCase().includes(searchQuery.toLowerCase());
    });
    
    return (
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Currency Converter Settings</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            {/* Title setting */}
            <div>
              <label htmlFor="title-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Widget Title
              </label>
              <input
                id="title-input"
                type="text"
                value={localConfig.title || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  setLocalConfig({...localConfig, title: e.target.value})
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* API Key setting */}
            <div>
              <label htmlFor="api-key-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Open Exchange Rates API Key
              </label>
              <input
                id="api-key-input"
                type="text"
                value={localConfig.apiKey || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  setLocalConfig({...localConfig, apiKey: e.target.value})
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your API key"
              />
              <p className="text-xs text-gray-500 mt-1">
                Get an API key at <a href="https://openexchangerates.org/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">openexchangerates.org</a>
              </p>
            </div>
            
            {/* Base Currency setting */}
            <div>
              <label htmlFor="base-currency-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Base Currency
              </label>
              <select
                id="base-currency-select"
                value={localConfig.baseCurrency || 'USD'}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => 
                  setLocalConfig({...localConfig, baseCurrency: e.target.value})
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {/* Show popular currencies first */}
                <optgroup label="Popular Currencies">
                  {POPULAR_CURRENCIES.map(code => (
                    <option key={code} value={code}>
                      {code} - {CURRENCIES[code as keyof typeof CURRENCIES]?.name}
                    </option>
                  ))}
                </optgroup>
                
                {/* Then show all other currencies */}
                <optgroup label="All Currencies">
                  {allCurrencyCodes
                    .filter(code => !POPULAR_CURRENCIES.includes(code))
                    .map(code => (
                      <option key={code} value={code}>
                        {code} - {CURRENCIES[code as keyof typeof CURRENCIES]?.name}
                      </option>
                    ))
                  }
                </optgroup>
              </select>
            </div>
            
            {/* Target Currencies setting */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Target Currencies
              </label>
              
              {/* Search box */}
              <div className="mb-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  placeholder="Search currencies..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                />
              </div>
              
              <div className="max-h-40 overflow-y-auto p-2 border border-gray-300 dark:border-gray-600 rounded-md">
                {filteredCurrencies.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                    No currencies match your search
                  </p>
                ) : (
                  filteredCurrencies.map(code => (
                    <div key={code} className="flex items-center mb-1">
                      <input
                        type="checkbox"
                        id={`currency-${code}`}
                        checked={localConfig.targetCurrencies?.includes(code) || false}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const currentTargets = localConfig.targetCurrencies || [];
                          if (e.target.checked) {
                            setLocalConfig({
                              ...localConfig, 
                              targetCurrencies: [...currentTargets, code]
                            });
                          } else {
                            setLocalConfig({
                              ...localConfig, 
                              targetCurrencies: currentTargets.filter(c => c !== code)
                            });
                          }
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`currency-${code}`} className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        {code} - {CURRENCIES[code as keyof typeof CURRENCIES]?.name}
                      </label>
                    </div>
                  ))
                )}
              </div>
              
              <div className="mt-2 text-sm text-gray-500">
                Selected: {localConfig.targetCurrencies?.length || 0} currencies
              </div>
            </div>
            
            {/* Auto Refresh setting */}
            <div>
              <div className="flex items-center">
                <input
                  id="auto-refresh-checkbox"
                  type="checkbox"
                  checked={localConfig.autoRefresh || false}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    setLocalConfig({...localConfig, autoRefresh: e.target.checked})
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="auto-refresh-checkbox" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Auto Refresh
                </label>
              </div>
            </div>
            
            {/* Refresh Interval setting (only shown if autoRefresh is enabled) */}
            {localConfig.autoRefresh && (
              <div>
                <label htmlFor="refresh-interval-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Refresh Interval (minutes)
                </label>
                <input
                  id="refresh-interval-input"
                  type="number"
                  min="1"
                  max="1440"
                  value={localConfig.refreshInterval || 60}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    setLocalConfig({...localConfig, refreshInterval: parseInt(e.target.value) || 60})
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}
          </div>
          
          <DialogFooter>
            {config?.onDelete && (
              <button
                className="px-4 py-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border border-transparent hover:border-red-200 dark:hover:border-red-800 rounded-lg text-sm font-medium transition-colors"
                onClick={() => {
                  if (config.onDelete) {
                    config.onDelete();
                  }
                }}
                aria-label="Delete this widget"
              >
                Delete Widget
              </button>
            )}
            <button
              type="button"
              onClick={saveSettings}
              className="ml-2 py-2 px-4 rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Save
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  // Main render
  return (
    <div ref={widgetRef} className="widget-container h-full flex flex-col">
      <WidgetHeader 
        title={localConfig.title || defaultConfig.title} 
        onSettingsClick={() => setShowSettings(true)}
      />
      
      <div className="flex-grow p-4 overflow-hidden">
        {renderContent()}
      </div>
      
      {renderSettings()}
    </div>
  );
};

export default CurrencyConverterWidget; 