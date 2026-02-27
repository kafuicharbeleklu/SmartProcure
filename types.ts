
export interface SupplierOffer {
  supplierName: string;
  nif?: string; // Tax Identification Number
  totalPriceHT: number; // Normalized to target currency
  totalPriceTTC: number; // Normalized to target currency
  currency: string; // The target currency code (e.g. XOF, EUR)
  
  // New optional fields for original currency data
  originalTotalPriceHT?: number;
  originalTotalPriceTTC?: number;
  originalCurrency?: string; // e.g., 'EUR', 'USD'

  // Contact Info Extracted from Offer
  email?: string;
  phone?: string;
  address?: string;

  warrantyMonths: number; // Normalized to number of months
  deliveryDays: number; // Normalized to number of days
  technicalScore: number; // 0-100
  complianceScore: number; // 0-100
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
  mainSpecs: string; // Summary of key technical specs (e.g. "Core i5, 16GB RAM")
}

export interface AnalysisResult {
  id: string;
  title: string;
  date: string;
  needsSummary: string;
  offers: SupplierOffer[];
  bestOption: string;
  marketAnalysis: string;
  status?: 'pending' | 'completed'; // New field to track if analysis is closed/evaluated
  winningSupplier?: string; // New field to store the chosen supplier
  evaluation?: SupplierEvaluation; // Persisted final evaluation details
}

export interface AnalysisRequest {
  title: string;
  description: string;
  constraints: string; // Budget, deadlines, etc.
  files: File[];
}

export interface Supplier {
  id: string;
  name: string;
  nif?: string; // Tax Identification Number
  category: string;
  email?: string;
  phone?: string;
  address?: string;
  rating: number; // 0 to 5
  ratingCount?: number; // Number of evaluations
  status: 'active' | 'inactive';
  lastActiveDate?: string;
}

export interface SupplierEvaluation {
  analysisId?: string; // Link to specific analysis
  supplierName: string;
  criteria: {
    technical: number; // 15%
    quality: number;   // 20%
    cost: number;      // 35%
    deadlines: number; // 15%
    innovation: number;// 5%
    management: number;// 10%
  };
  globalScore: number;
  comment: string;
}

export enum AppState {
  DASHBOARD = 'DASHBOARD',
  HISTORY = 'HISTORY',
  CREATE_ANALYSIS = 'CREATE_ANALYSIS',
  VIEW_RESULT = 'VIEW_RESULT',
  SUPPLIERS = 'SUPPLIERS',
  SETTINGS = 'SETTINGS'
}

export interface GlobalSettings {
  organizationName: string;
  baseCurrency: string;
  exchangeRates: { EUR: number; USD: number };
  scoringWeights: { price: number; technical: number; delivery: number };
  
  // Appearance Settings
  language: 'fr' | 'en';
  theme: 'light' | 'dark' | 'system';
}
