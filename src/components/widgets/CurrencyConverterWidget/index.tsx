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
import { useSharedCredential } from '@/lib/sharedCredentials';
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Switch } from "../../ui/switch";
import { Checkbox } from "../../ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";

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
  const [rates, setRates] = useState<{[key: string]: number}>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // More robust fetchRates function with better error handling and debugging
  const fetchRates = async () => {
    // Clear previous errors when starting a new fetch
    setError(null);
    setLoading(true);
    
    // Debug: Log fetch attempt with API key (masked for security)
    console.log(`[CurrencyConverter] Fetching rates with API key: ${apiKey ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}` : 'none'}`);
    
    if (!apiKey) {
      console.error('[CurrencyConverter] No API key provided');
      setError('API key is required');
      setLoading(false);
      return;
    }
    
    try {
      // Use the app ID and base currency to construct the URL
      const url = `https://openexchangerates.org/api/latest.json?app_id=${apiKey || ''}`;
      
      // Log the URL without exposing the API key
      console.log('[CurrencyConverter] Fetching from: https://openexchangerates.org/api/latest.json?app_id=API_KEY_HIDDEN');
      
      const response = await fetch(url);
      
      // Check if the response is OK
      if (!response.ok) {
        // Try to get more specific error information from response
        const errorData = await response.json().catch(() => null);
        console.error(`[CurrencyConverter] API returned ${response.status}: `, errorData);
        
        if (response.status === 401 || response.status === 403) {
          setError('Invalid API key. Please check your API key and try again.');
        } else if (response.status === 429) {
          setError('Rate limit exceeded. Please try again later.');
        } else {
          setError(`API error: ${response.status} ${response.statusText}`);
        }
        setLoading(false);
        return;
      }
      
      const data = await response.json();
      
      // Check if we have rates in the response
      if (!data.rates) {
        console.error('[CurrencyConverter] No rates found in response:', data);
        setError('Invalid response from API. Please try again.');
        setLoading(false);
        return;
      }
      
      console.log('[CurrencyConverter] Rates fetched successfully:', Object.keys(data.rates).length, 'currencies');
      setRates(data.rates);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('[CurrencyConverter] Error fetching rates:', err);
      setError('Failed to fetch rates. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Initial fetch and when api key or base currency changes
  useEffect(() => {
    console.log('[CurrencyConverter] API key or base currency changed:', { 
      hasApiKey: !!apiKey,
      baseCurrency 
    });
    
    if (apiKey) {
      console.log('[CurrencyConverter] Fetching rates with API key');
      fetchRates();
    } else {
      console.log('[CurrencyConverter] No API key available, skipping fetch');
      setError('API key is required');
    }
  }, [apiKey, baseCurrency]);
  
  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || !apiKey) return;
    
    const intervalId = setInterval(() => {
      console.log('[CurrencyConverter] Auto-refreshing rates');
      fetchRates();
    }, refreshInterval * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [autoRefresh, refreshInterval, fetchRates, baseCurrency]);
  
  return { 
    rates, 
    loading, 
    error, 
    lastUpdated,
    refetch: fetchRates
  };
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

  // Access shared credentials first to ensure it's available before other hooks
  const { credential: sharedApiKey, updateCredential: updateSharedApiKey, hasCredential: hasSharedApiKey } = useSharedCredential('openexchangerates-api');
  
  // Component state
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [localConfig, setLocalConfig] = useState<CurrencyConverterWidgetConfig>({
    ...defaultConfig,
    ...config,
    useSharedCredential: config?.useSharedCredential || false
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
  
  // Determine which API key to use
  // Add console log to debug the API key situation
  console.log('[CurrencyConverter] API Key Debug:', {
    useShared: localConfig.useSharedCredential,
    sharedApiKey: sharedApiKey,
    localApiKey: localConfig.apiKey,
    hasSharedApiKey: hasSharedApiKey
  });
  const apiKey = localConfig.useSharedCredential ? sharedApiKey : localConfig.apiKey;
  
  // Fetch exchange rates
  const { 
    rates, 
    loading, 
    error, 
    lastUpdated, 
    refetch 
  } = useExchangeRates(
    apiKey as string | undefined, // Explicit type assertion to handle null
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
    // Only allow numbers and decimal points
    const value = e.target.value.replace(/[^0-9.]/g, '');
    setAmount(value);
  };
  
  // Update the renderContent function to properly handle successful API responses
  const renderContent = () => {
    // Track if we're fetching data for the first time
    const isInitialLoad = loading && !rates;
    
    // Check if we have rates data to determine if we should show content
    const hasRatesData = rates && Object.keys(rates).length > 0;
    
    console.log('[CurrencyConverter] Render state:', { 
      loading, 
      hasRatesData, 
      error,
      ratesCount: rates ? Object.keys(rates).length : 0
    });

    // If we have rates data, show the content regardless of API key presence
    if (hasRatesData) {
      // Determine which view to render based on available space
      // Using a more nuanced approach similar to other widgets
      if (width >= 4 && height >= 4) {
        return renderLargeView();
      } else if (width >= 4 && height >= 2) {
        return renderWideView();
      } else if (width >= 2 && height >= 3) {
        return renderTallView();
      } else if (width >= 3 && height >= 2) {
        return renderWideView();
      } else if (width === 2 && height === 2) {
        return renderDefaultView();
      } else if (width === 2 && height === 1) {
        return renderWideView();
      } else if (width === 1 && height === 2) {
        return renderTallView();
      } else {
        return renderDefaultView();
      }
    }
    
    // Show loading state
    if (isInitialLoad) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Loading exchange rates...</div>
        </div>
      );
    }
    
    // If we have an error and it's about the API key, show API key notice
    if (error && (error.includes('API key') || error.includes('401') || error.includes('403'))) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-4">
          <div className="text-amber-500 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-sm text-center mb-2">API key required</div>
          <button
            onClick={() => setShowSettings(true)}
            className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded-md transition-colors"
          >
            Add API Key
          </button>
        </div>
      );
    }

    // For other errors
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-4 text-red-500">
          <div className="mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-sm text-center">{error}</div>
        </div>
      );
    }

    // Default - should never reach here but shows a gentle reminder to configure
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <div className="text-gray-500 dark:text-gray-400 mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <div className="text-sm text-center mb-2">Configure your currency converter</div>
        <button
          onClick={() => setShowSettings(true)}
          className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded-md transition-colors"
        >
          Settings
        </button>
      </div>
    );
  };
  
  // Default view (2x2)
  const renderDefaultView = () => {
    // In the small view, prioritize the most important currency
    const primaryConversion = conversions[0]; // Show just the primary currency by default
    
    return (
      <div className="flex flex-col h-full p-2.5 gap-1">
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
            {/* Input with proper currency indication */}
            <div className="mb-2">
              <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                <input
                  type="text"
                  value={amount}
                  onChange={handleAmountChange}
                  className="flex-grow w-full px-3 py-2 text-base border-0 dark:bg-gray-700 dark:text-white focus:ring-0 focus:outline-none"
                  aria-label={`Amount in ${localConfig.baseCurrency}`}
                />
                <div className="flex items-center px-3 text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 border-l border-gray-300 dark:border-gray-600">
                  {localConfig.baseCurrency}
                </div>
              </div>
            </div>
            
            {/* Target currency and exchange rate */}
            <div className="text-center">
              <div className="text-gray-500 dark:text-gray-400 text-sm">
                {primaryConversion.code}
              </div>
            </div>
            
            {/* Conversion result */}
            <div className="flex-grow flex items-center justify-center">
              <div className="text-2xl font-bold">
                {primaryConversion.symbol}
                {parseFloat(primaryConversion.value).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </div>
            </div>
            
            {/* Footer with exchange rate and timestamp in compact form */}
            <div className="text-xs text-center text-gray-500 dark:text-gray-400">
              1 {localConfig.baseCurrency} = {primaryConversion.rate.toFixed(4)}
            </div>
            {lastUpdated && (
              <div className="text-xs text-center text-gray-400 dark:text-gray-500">
                {lastUpdated.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </div>
            )}
          </>
        )}
      </div>
    );
  };
  
  // Wide view (3x2 or larger width)
  const renderWideView = () => {
    // For wider views, show 3-4 most important currencies in a row
    const wideConversions = conversions.slice(0, 3);
    
    return (
      <div className="flex flex-col h-full p-3">
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
            {/* Input with currency indicator - same style as 2x2 */}
            <div className="mb-3">
              <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                <input
                  id="amount-input-wide"
                  type="text"
                  value={amount}
                  onChange={handleAmountChange}
                  className="flex-grow w-full px-3 py-2 text-base border-0 dark:bg-gray-700 dark:text-white focus:ring-0 focus:outline-none"
                  aria-label={`Amount in ${localConfig.baseCurrency}`}
                />
                <div className="flex items-center px-3 text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 border-l border-gray-300 dark:border-gray-600">
                  {localConfig.baseCurrency}
                </div>
                <button
                  onClick={refetch}
                  className="p-2 text-gray-500 hover:text-blue-500 bg-gray-100 dark:bg-gray-800 border-l border-gray-300 dark:border-gray-600"
                  aria-label="Refresh rates"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Grid of conversion cards */}
            <div className="flex-grow grid grid-cols-3 gap-2">
              {wideConversions.map((conversion) => (
                <div 
                  key={conversion.code}
                  className="flex flex-col p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="mb-1 flex justify-between items-center">
                    <span className="font-medium">{conversion.code}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{conversion.rate.toFixed(4)}</span>
                  </div>
                  <div className="text-xl font-bold mt-auto">
                    {conversion.symbol}
                    {parseFloat(conversion.value).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Simple timestamp footer */}
            {lastUpdated && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Updated: {lastUpdated.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </div>
            )}
          </>
        )}
      </div>
    );
  };
  
  // Tall view (2x3 or larger height)
  const renderTallView = () => {
    // For tall views, show 3 currencies
    const displayConversions = conversions.slice(0, 3);
    
    return (
      <div className="flex flex-col h-full p-3">
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
            {/* Input with currency indicator - same style as 2x2 */}
            <div className="mb-3">
              <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                <input
                  type="text"
                  value={amount}
                  onChange={handleAmountChange}
                  className="flex-grow w-full px-3 py-2 text-base border-0 dark:bg-gray-700 dark:text-white focus:ring-0 focus:outline-none"
                  aria-label={`Amount in ${localConfig.baseCurrency}`}
                />
                <div className="flex items-center px-3 text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 border-l border-gray-300 dark:border-gray-600">
                  {localConfig.baseCurrency}
                </div>
              </div>
            </div>
            
            {/* Currency conversion cards */}
            <div className="flex-grow overflow-y-auto">
              <div className="space-y-2">
                {displayConversions.map((conversion) => (
                  <div 
                    key={conversion.code}
                    className="flex items-center justify-between p-2.5 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div>
                      <div className="font-medium">{conversion.code}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {CURRENCIES[conversion.code as keyof typeof CURRENCIES]?.name}
                      </div>
                    </div>
                    <div className="text-xl font-bold">
                      {conversion.symbol}
                      {parseFloat(conversion.value).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Footer with rate and refresh */}
            <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Updated: {lastUpdated ? lastUpdated.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Never'}
              </div>
              <button
                onClick={refetch}
                className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full"
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
    // For large view, show 4 currencies in 2 columns like in the screenshot
    const displayConversions = conversions.slice(0, 4);
    
    return (
      <div className="flex flex-col h-full p-4">
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
            {/* Top input section */}
            <div className="mb-5 flex gap-2">
              <div className="flex-1 flex overflow-hidden rounded-lg border border-gray-300 dark:border-gray-600">
                <input
                  type="text"
                  value={amount}
                  onChange={handleAmountChange}
                  className="flex-1 px-4 py-3 text-lg border-0 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-0"
                />
                <div className="flex items-center px-5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                  {localConfig.baseCurrency}
                </div>
              </div>
              
              <button
                onClick={refetch}
                className="p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center"
                aria-label="Refresh rates"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
            
            {/* Currency cards with detailed conversion info */}
            <div className="flex-grow overflow-auto">
              <div className="grid grid-cols-2 gap-4">
                {displayConversions.map((conversion) => (
                  <div 
                    key={conversion.code}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                  >
                    {/* Currency info section */}
                    <div className="p-4">
                      <div className="flex flex-col">
                        <div className="flex items-baseline">
                          <span className="text-2xl font-bold mr-2">{conversion.code}</span>
                          <span className="text-gray-500 dark:text-gray-400">({conversion.rate.toFixed(4)})</span>
                        </div>
                        <div className="text-gray-500 dark:text-gray-400 mb-3">
                          {CURRENCIES[conversion.code as keyof typeof CURRENCIES]?.name}
                        </div>
                        <div className="text-3xl font-bold truncate">
                          {conversion.symbol}{conversion.value.split('.')[0]}
                        </div>
                      </div>
                    </div>
                    
                    {/* Conversion rates in detail */}
                    <div className="flex border-t border-gray-200 dark:border-gray-700 text-sm">
                      <div className="flex-1 p-3 border-r border-gray-200 dark:border-gray-700">
                        <div className="text-gray-500 dark:text-gray-400">1 {localConfig.baseCurrency} =</div>
                        <div className="font-medium">{conversion.rate.toFixed(4)} {conversion.code}</div>
                      </div>
                      <div className="flex-1 p-3">
                        <div className="text-gray-500 dark:text-gray-400">1 {conversion.code} =</div>
                        <div className="font-medium">{(1 / conversion.rate).toFixed(4)} {localConfig.baseCurrency}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Footer with update info */}
            <div className="mt-5 pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between">
              <div className="text-gray-500 dark:text-gray-400">
                Last Updated: {lastUpdated ? lastUpdated.toLocaleTimeString([], {
                  year: 'numeric',
                  month: 'numeric',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : 'Never'}
              </div>
              <div>
                <a 
                  href="https://openexchangerates.org" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  Data by Open Exchange Rates
                </a>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };
  
  // Save settings with improved handling and debugging
  const saveSettings = () => {
    console.log('[CurrencyConverter] Saving settings with current state:', {
      useSharedCredential: localConfig.useSharedCredential,
      hasSharedApiKey: !!sharedApiKey,
      hasWidgetApiKey: !!localConfig.apiKey
    });
    
    // Make sure shared API key is saved properly
    if (localConfig.useSharedCredential && sharedApiKey) {
      console.log('[CurrencyConverter] Saving shared API key on settings close');
      updateSharedApiKey(sharedApiKey);
    }
    
    // Save the local config
    if (config?.onUpdate) {
      console.log('[CurrencyConverter] Saving local config to parent component');
      config.onUpdate(localConfig);
    }
    
    setShowSettings(false);
    
    // Give more time for state updates to propagate
    setTimeout(() => {
      // Re-check the API key status after state updates
      const effectiveApiKey = localConfig.useSharedCredential ? sharedApiKey : localConfig.apiKey;
      console.log('[CurrencyConverter] Ready to refetch with:', {
        usingSharedKey: localConfig.useSharedCredential,
        effectiveApiKey: effectiveApiKey ? '[PRESENT]' : '[MISSING]'
      });
      
      if (effectiveApiKey) {
        console.log('[CurrencyConverter] Executing refetch with valid API key');
        refetch();
      } else {
        console.error('[CurrencyConverter] Cannot refetch: No valid API key available');
      }
    }, 1500); // Increased timeout to ensure state updates complete
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
    const [activeTab, setActiveTab] = useState('general'); // Tabs: general, currencies, advanced
    
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
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="currencies">Currencies</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>
            
            <TabsContent value="general" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title-input">Widget Title</Label>
                <Input
                  id="title-input"
                  value={localConfig.title || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    setLocalConfig({...localConfig, title: e.target.value})
                  }
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="base-currency-select">Base Currency</Label>
                <Select
                  value={localConfig.baseCurrency || 'USD'}
                  onValueChange={(value) => setLocalConfig({...localConfig, baseCurrency: value})}
                >
                  <SelectTrigger id="base-currency-select">
                    <SelectValue placeholder="Select base currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {POPULAR_CURRENCIES.map(code => (
                      <SelectItem key={code} value={code}>
                        {code} - {CURRENCIES[code as keyof typeof CURRENCIES]?.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
            
            <TabsContent value="currencies" className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Target Currencies</Label>
                  <span className="text-xs text-muted-foreground">
                    Selected: {localConfig.targetCurrencies?.length || 0}
                  </span>
                </div>
                
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  placeholder="Search currencies..."
                  className="mb-2"
                />
                
                {(localConfig.targetCurrencies?.length || 0) > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {localConfig.targetCurrencies?.map(code => (
                      <div key={`selected-${code}`} className="flex items-center bg-secondary text-secondary-foreground rounded-full px-2 py-1 text-xs">
                        <span>{code}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 ml-1 hover:bg-secondary/80"
                          onClick={() => {
                            setLocalConfig({
                              ...localConfig, 
                              targetCurrencies: (localConfig.targetCurrencies || []).filter(c => c !== code)
                            });
                          }}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="h-36 overflow-y-auto border rounded-md">
                  {filteredCurrencies.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      No currencies match your search
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-1 p-2">
                      {filteredCurrencies.map(code => (
                        <div key={code} className="flex items-center space-x-2">
                          <Checkbox
                            id={`currency-${code}`}
                            checked={localConfig.targetCurrencies?.includes(code) || false}
                            onCheckedChange={(checked: boolean) => {
                              const currentTargets = localConfig.targetCurrencies || [];
                              if (checked) {
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
                          />
                          <Label htmlFor={`currency-${code}`} className="text-sm">
                            {code}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="advanced" className="space-y-4">
              <div className="space-y-2">
                <Label>API Key Settings</Label>
                
                <div className="mb-2">
                  <div className="flex items-center space-x-2 mb-2 p-2 bg-secondary rounded-lg">
                    <Switch
                      id="useSharedCredential"
                      checked={localConfig.useSharedCredential}
                      onCheckedChange={(checked: boolean) => setLocalConfig({...localConfig, useSharedCredential: checked})}
                    />
                    <div>
                      <Label htmlFor="useSharedCredential">Use shared API key</Label>
                      <p className="text-xs text-muted-foreground">
                        {hasSharedApiKey ? "✓ Shared key available" : "No shared key set yet"}
                      </p>
                    </div>
                  </div>
                  
                  <Input
                    type="text"
                    placeholder={localConfig.useSharedCredential ? "Open Exchange Rates shared API Key" : "Widget-specific API Key"}
                    value={localConfig.useSharedCredential ? (sharedApiKey || '') : (localConfig.apiKey || '')}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      if (localConfig.useSharedCredential) {
                        console.log('[CurrencyConverter] Updating shared API key:', e.target.value);
                        updateSharedApiKey(e.target.value);
                      } else {
                        setLocalConfig({...localConfig, apiKey: e.target.value});
                      }
                    }}
                  />
                  
                  <p className="text-xs text-muted-foreground mt-1">
                    <a href="https://openexchangerates.org/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Get API key</a>
                  </p>
                </div>
              </div>
              
              <div className="flex justify-between items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="auto-refresh-checkbox"
                    checked={localConfig.autoRefresh || false}
                    onCheckedChange={(checked: boolean) => setLocalConfig({...localConfig, autoRefresh: checked})}
                  />
                  <Label htmlFor="auto-refresh-checkbox">Auto Refresh</Label>
                </div>
                
                {localConfig.autoRefresh && (
                  <div className="flex items-center space-x-2">
                    <Label>Every</Label>
                    <Input
                      type="number"
                      min="1"
                      max="1440"
                      value={localConfig.refreshInterval || 60}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                        setLocalConfig({...localConfig, refreshInterval: parseInt(e.target.value) || 60})
                      }
                      className="w-20"
                    />
                    <span className="text-sm">min</span>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <div className="flex justify-between w-full">
              {config?.onDelete && (
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (config.onDelete) {
                      config.onDelete();
                    }
                  }}
                  aria-label="Delete this widget"
                >
                  Delete Widget
                </Button>
              )}
              <Button
                type="submit"
                onClick={saveSettings}
              >
                Save Changes
              </Button>
            </div>
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