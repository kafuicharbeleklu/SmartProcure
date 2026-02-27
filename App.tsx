import React, { useState, useEffect, useCallback } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import History from './components/History';
import AnalysisWizard from './components/AnalysisWizard';
import AnalysisResultView from './components/AnalysisResultView';
import Settings from './components/Settings';
import Suppliers from './components/Suppliers';
import Login from './components/Login';
import { AnalysisResult, AppState, GlobalSettings, Supplier, SupplierEvaluation } from './types';

// --- DONNÉES DE SIMULATION ---
const MOCK_SUPPLIERS: Supplier[] = [
  {
    id: '1',
    name: 'MIKEM TECHNOLOGIE',
    nif: '1001548790',
    category: 'Matériel Informatique',
    email: 'contact@mikem-tech.tg',
    phone: '22 20 77 74',
    address: '16 rue de France, Lomé',
    rating: 4.2,
    ratingCount: 15,
    status: 'active',
    lastActiveDate: '08/04/2025'
  },
  {
    id: '2',
    name: 'NEEMBA TOGO',
    nif: '1002654321',
    category: 'Équipement & Infrastructure',
    email: 'info.togo@neemba.com',
    phone: '22 82 22 64',
    address: '1393 Bd de la Victoire, Lomé',
    rating: 4.8,
    ratingCount: 8,
    status: 'active',
    lastActiveDate: '09/04/2025'
  },
  {
    id: '3',
    name: 'SMOOTH COMPUTER',
    nif: '1003987654',
    category: 'Matériel Informatique',
    email: 'info@smoothcomputer7.com',
    phone: '+228 93 21 32 37',
    address: 'Rue de l\'Aéroport, Hountigomé',
    rating: 3.5,
    ratingCount: 4,
    status: 'active',
    lastActiveDate: '24/04/2025'
  },
  {
    id: '4',
    name: 'AFRIQUE INFORMATIQUE SARL',
    nif: '1004123456',
    category: 'Services & Bureautique',
    email: 'info@afriqueinformatique.net',
    phone: '(00228) 91 99 47 31',
    address: 'Bd de l\'Oti, Bè Kpota, Lomé',
    rating: 4.0,
    ratingCount: 10,
    status: 'active',
    lastActiveDate: '09/04/2025'
  },
  {
    id: '5',
    name: 'COMPUTER PLUS',
    nif: '1005678901',
    category: 'Matériel Informatique',
    email: 'vente@computerplusafrique.com',
    phone: '22 20 97 70',
    address: '1393 Bd de la Victoire, Lomé',
    rating: 3.8,
    ratingCount: 6,
    status: 'active',
    lastActiveDate: '09/04/2025'
  }
];

const MOCK_HISTORY: AnalysisResult[] = [
  {
    id: 'analysis-001',
    title: 'Renouvellement Parc PC Portables (Lot 5 unités)',
    date: '10/05/2025',
    needsSummary: 'Acquisition de 5 ordinateurs portables professionnels. Préférence pour Lenovo ThinkPad série E ou équivalent. Processeur i5 min, 16Go RAM, 512Go SSD. Windows Pro requis.',
    marketAnalysis: 'Le marché est compétitif avec trois offres solides sur la gamme ThinkPad. MIKEM TECHNOLOGIE se distingue nettement grâce à une remise commerciale de 10% appliquée sur le tarif unitaire, rendant l\'offre Gen6 plus accessible que prévu. SMOOTH COMPUTER propose un modèle plus performant (i7/Ultra 7) mais plus cher. COMPUTER PLUS est pénalisé par une génération antérieure (Gen5) malgré un prix facial bas.',
    bestOption: 'MIKEM TECHNOLOGIE',
    status: 'completed',
    winningSupplier: 'MIKEM TECHNOLOGIE',
    offers: [
      {
        supplierName: 'MIKEM TECHNOLOGIE',
        totalPriceHT: 3399750, 
        totalPriceTTC: 4011705,
        currency: 'XOF',
        warrantyMonths: 12,
        deliveryDays: 30,
        technicalScore: 92,
        complianceScore: 85,
        mainSpecs: 'Lenovo ThinkPad E14 Gen6, Core Ultra 5 125U, 16GB RAM, 512GB SSD',
        strengths: ['Dernière génération (Gen6)', 'Remise de 10% appliquée', 'Licence Windows 11 Pro incluse'],
        weaknesses: ['Délai de livraison long (30 jours)'],
        recommendation: 'Meilleur rapport qualité/prix après application de la remise.'
      },
      {
        supplierName: 'SMOOTH COMPUTER',
        totalPriceHT: 3750000,
        totalPriceTTC: 3750000,
        currency: 'XOF',
        warrantyMonths: 12,
        deliveryDays: 14,
        technicalScore: 95,
        complianceScore: 90,
        mainSpecs: 'Lenovo ThinkPad E16 G2, Core Ultra 7 155H, 16GB RAM, 512GB SSD',
        strengths: ['Performance CPU supérieure (Ultra 7)', 'Livraison rapide (14j)', 'Écran plus grand (16")'],
        weaknesses: ['Encombrement (16 pouces vs 14 demandé)', 'Risque de régularisation TVA ultérieure'],
        recommendation: 'Excellent choix pour les profils "Power Users", attention à la TVA.'
      },
      {
        supplierName: 'COMPUTER PLUS',
        totalPriceHT: 2875000,
        totalPriceTTC: 3392500,
        currency: 'XOF',
        warrantyMonths: 12,
        deliveryDays: 12,
        technicalScore: 80,
        complianceScore: 95,
        mainSpecs: 'Lenovo ThinkPad E14 Gen5, i5-1335U, 16GB RAM, 512GB SSD',
        strengths: ['Livraison la plus rapide (7-12j)', 'Prix facial attractif'],
        weaknesses: ['Génération précédente (Gen5)', 'Windows 10 Pro (OS vieillissant)'],
        recommendation: 'Solution de repli idéale en cas d\'urgence absolue.'
      }
    ]
  },
  {
    id: 'analysis-002',
    title: 'Acquisition Solution d\'Impression Centrale',
    date: '12/05/2025',
    needsSummary: 'Photocopieur multifonction couleur A3 haute capacité pour le siège. Vitesse > 30ppm. Recto-verso automatique, scan réseau.',
    marketAnalysis: 'AFRIQUE INFORMATIQUE propose une solution Canon haut de gamme très complète mais onéreuse. NEEMBA positionne une offre Xerox compétitive. L\'analyse du coût à la page (TCO) favoriserait Canon sur le long terme malgré l\'investissement initial.',
    bestOption: 'AFRIQUE INFORMATIQUE SARL',
    offers: [
      {
        supplierName: 'AFRIQUE INFORMATIQUE SARL',
        totalPriceHT: 4500000,
        totalPriceTTC: 5310000,
        currency: 'XOF',
        warrantyMonths: 24,
        deliveryDays: 45,
        technicalScore: 98,
        complianceScore: 80,
        mainSpecs: 'Canon imageRUNNER ADVANCE DX C359i, Multifonction Couleur A3/A4, ADF + Socle',
        strengths: ['Modèle très robuste', 'Fonctionnalités avancées (ADF, Socle inclus)', 'SAV local réputé'],
        weaknesses: ['Budget élevé', 'Délai de livraison important'],
        recommendation: 'Choix stratégique pour réduire les coûts de maintenance sur 5 ans.'
      },
      {
        supplierName: 'NEEMBA TOGO',
        totalPriceHT: 3200000,
        totalPriceTTC: 3776000,
        currency: 'XOF',
        warrantyMonths: 12,
        deliveryDays: 10,
        technicalScore: 85,
        complianceScore: 95,
        mainSpecs: 'Xerox VersaLink C7130, 30ppm, A3 Couleur',
        strengths: ['Disponibilité quasi-immédiate', 'Prix d\'achat attractif'],
        weaknesses: ['Moins d\'options incluses de base', 'Durée de vie théorique inférieure'],
        recommendation: 'Alternative budgétaire viable.'
      }
    ]
  },
  {
    id: 'analysis-003',
    title: 'Licences Microsoft Office & Cloud (Comparatif Devise)',
    date: '14/05/2025',
    needsSummary: 'Renouvellement de 50 licences Microsoft 365 Business Standard. Comparaison fournisseurs locaux vs internationaux.',
    marketAnalysis: 'L\'offre en Euros de TECH GLOBAL (France) reste compétitive malgré le taux de change, grâce à un prix unitaire volume. Cependant, MIKEM s\'aligne presque en local, offrant l\'avantage de la facturation TVA locale récupérable.',
    bestOption: 'TECH GLOBAL SERVICES',
    offers: [
      {
        supplierName: 'TECH GLOBAL SERVICES',
        totalPriceHT: 6559570,
        totalPriceTTC: 7871484,
        currency: 'XOF',
        originalTotalPriceHT: 10000,
        originalTotalPriceTTC: 12000,
        originalCurrency: 'EUR',
        warrantyMonths: 12,
        deliveryDays: 1,
        technicalScore: 100,
        complianceScore: 90,
        mainSpecs: '50x Microsoft 365 Business Standard (1 Year)',
        strengths: ['Livraison instantanée', 'Gestion centralisée portail CSP'],
        weaknesses: ['Paiement international requis', 'Risque de change'],
        recommendation: 'Offre la plus flexible techniquement.'
      },
      {
        supplierName: 'MIKEM TECHNOLOGIE',
        totalPriceHT: 7000000,
        totalPriceTTC: 8260000,
        currency: 'XOF',
        warrantyMonths: 12,
        deliveryDays: 3,
        technicalScore: 100,
        complianceScore: 100,
        mainSpecs: '50x Microsoft 365 Business Standard (Annuel)',
        strengths: ['Facturation locale simple', 'Support niveau 1 local'],
        weaknesses: ['Prix légèrement supérieur (~6%)'],
        recommendation: 'À privilégier si la simplicité administrative est prioritaire.'
      }
    ]
  }
];

const DEFAULT_SETTINGS: GlobalSettings = {
  organizationName: 'Mon Entreprise',
  baseCurrency: 'XOF',
  exchangeRates: { EUR: 655.957, USD: 600 },
  scoringWeights: { price: 40, technical: 40, delivery: 20 },
  language: 'fr',
  theme: 'light'
};

const STORAGE_KEYS = {
  auth: 'smartprocure_auth',
  history: 'smartprocure_history',
  suppliers: 'smartprocure_suppliers',
  settings: 'smartprocure_settings'
} as const;

const getStoredValue = <T,>(key: string): T | null => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as T;
  } catch (error) {
    console.warn(`Storage read failed for ${key}`, error);
    return null;
  }
};

const getStoredArray = <T,>(key: string, fallback: T[]): T[] => {
  const parsed = getStoredValue<T[]>(key);
  return Array.isArray(parsed) ? parsed : fallback;
};

const getStoredSettings = (): GlobalSettings => {
  const parsed = getStoredValue<Partial<GlobalSettings>>(STORAGE_KEYS.settings);
  if (!parsed) {
    return DEFAULT_SETTINGS;
  }

  return {
    ...DEFAULT_SETTINGS,
    ...parsed,
    exchangeRates: {
      ...DEFAULT_SETTINGS.exchangeRates,
      ...(parsed.exchangeRates || {})
    },
    scoringWeights: {
      ...DEFAULT_SETTINGS.scoringWeights,
      ...(parsed.scoringWeights || {})
    }
  };
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const persisted = localStorage.getItem(STORAGE_KEYS.auth);
      const legacy = localStorage.getItem('isAuthenticated');
      return persisted === 'true' || (persisted === null && legacy === 'true');
    } catch {
      return false;
    }
  });
  const [currentTab, setCurrentTab] = useState<AppState>(AppState.DASHBOARD);
  const [history, setHistory] = useState<AnalysisResult[]>(() => getStoredArray(STORAGE_KEYS.history, MOCK_HISTORY));
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => getStoredArray(STORAGE_KEYS.suppliers, MOCK_SUPPLIERS));
  const [selectedResult, setSelectedResult] = useState<AnalysisResult | null>(null);
  const [historyFocusId, setHistoryFocusId] = useState<string | null>(null);
  
  // State for persisted settings (Saved on disk/db)
  const [settings, setSettings] = useState<GlobalSettings>(() => getStoredSettings());
  
  // State for visual preview (What the user sees right now)
  const [appearance, setAppearance] = useState<GlobalSettings>(() => getStoredSettings());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.auth, isAuthenticated ? 'true' : 'false');
      localStorage.removeItem('isAuthenticated');
    } catch (error) {
      console.warn('Failed to persist auth state', error);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(history));
    } catch (error) {
      console.warn('Failed to persist history', error);
    }
  }, [history]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.suppliers, JSON.stringify(suppliers));
    } catch (error) {
      console.warn('Failed to persist suppliers', error);
    }
  }, [suppliers]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
    } catch (error) {
      console.warn('Failed to persist settings', error);
    }
  }, [settings]);

  // --- THEME & APPEARANCE ENGINE ---
  useEffect(() => {
    const body = document.body;
    let isDark = false;

    // 1. Determine Dark/Light Mode
    if (appearance.theme === 'dark') {
      isDark = true;
    } else if (appearance.theme === 'system') {
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    // Apply Tailwind Dark Mode class
    if (isDark) {
      body.classList.add('dark');
    } else {
      body.classList.remove('dark');
    }

  }, [appearance.theme]);

  // Handlers
  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentTab(AppState.DASHBOARD);
  };

  const handleAnalysisComplete = (result: AnalysisResult) => {
    setHistory((prev) => [result, ...prev]);
    // Logic to add suppliers...
    const newSuppliers = [...suppliers];
    let hasNew = false;
    result.offers.forEach(offer => {
       const index = newSuppliers.findIndex(s => s.name.toLowerCase() === offer.supplierName.toLowerCase());
       if (index === -1) {
          hasNew = true;
          newSuppliers.push({
             id: Date.now().toString() + Math.random().toString(),
             name: offer.supplierName,
             category: 'Général',
             status: 'active',
             rating: 3,
             ratingCount: 0,
             lastActiveDate: result.date,
             email: offer.email,
             phone: offer.phone,
             address: offer.address
          });
       }
    });
    if (hasNew) setSuppliers(newSuppliers);
    setSelectedResult(result);
    setCurrentTab(AppState.VIEW_RESULT);
  };

  const handleViewResult = (result: AnalysisResult) => {
    setSelectedResult(result);
    setCurrentTab(AppState.VIEW_RESULT);
  };

  const handleOpenHistory = (analysisId: string) => {
    setHistoryFocusId(analysisId);
    setCurrentTab(AppState.HISTORY);
  };

  const handleSaveSettings = useCallback((newSettings: GlobalSettings) => {
    setSettings(newSettings);
    setAppearance(newSettings);
  }, []);

  // Called when user modifies form in Settings (Live Preview)
  const handlePreviewSettings = useCallback((tempSettings: GlobalSettings) => {
    setAppearance(tempSettings);
  }, []);

  const handleAddSupplier = (newSupplier: Supplier) => {
    setSuppliers(prev => [...prev, newSupplier]);
  };

  const handleUpdateSupplier = (updatedSupplier: Supplier) => {
    setSuppliers(prev => prev.map(s => s.id === updatedSupplier.id ? updatedSupplier : s));
  };

  const handleDeleteSupplier = (ids: string[]) => {
    setSuppliers(prev => prev.filter(s => !ids.includes(s.id)));
  };

  const handleSupplierEvaluation = (evaluation: SupplierEvaluation) => {
    if (evaluation.analysisId) {
      setHistory(prev => prev.map(item => {
        if (item.id === evaluation.analysisId) {
           const updated = {
             ...item,
             status: 'completed' as const,
             winningSupplier: evaluation.supplierName,
             evaluation
           };
           if (selectedResult?.id === item.id) setSelectedResult(updated);
           return updated;
        }
        return item;
      }));
    }
  };

  const renderContent = () => {
    switch (currentTab) {
      case AppState.DASHBOARD:
        return (
          <Dashboard 
            history={history} 
            onViewResult={handleViewResult} 
            onOpenHistory={handleOpenHistory}
            onCreateNew={() => setCurrentTab(AppState.CREATE_ANALYSIS)}
            language={appearance.language}
            currency={appearance.baseCurrency}
          />
        );
      case AppState.HISTORY:
        return (
          <History
            history={history}
            onViewResult={handleViewResult}
            focusAnalysisId={historyFocusId}
            onFocusHandled={() => setHistoryFocusId(null)}
            language={appearance.language}
          />
        );
      case AppState.CREATE_ANALYSIS:
        return (
          <AnalysisWizard 
            onAnalysisComplete={handleAnalysisComplete}
            onCancel={() => setCurrentTab(AppState.DASHBOARD)}
            defaultRates={settings.exchangeRates}
            baseCurrency={settings.baseCurrency}
            language={appearance.language}
          />
        );
      case AppState.VIEW_RESULT:
        return selectedResult ? (
          <AnalysisResultView 
            result={selectedResult} 
            onBack={() => setCurrentTab(AppState.DASHBOARD)} 
            onEvaluateSupplier={handleSupplierEvaluation}
            language={appearance.language}
          />
        ) : (
          <div>Erreur</div>
        );
      case AppState.SUPPLIERS:
        return (
          <Suppliers 
            suppliers={suppliers} 
            onAddSupplier={handleAddSupplier}
            onUpdateSupplier={handleUpdateSupplier}
            onDeleteSupplier={handleDeleteSupplier}
            language={appearance.language}
          />
        );
      case AppState.SETTINGS:
        return (
          <Settings 
            settings={settings}
            onSave={handleSaveSettings}
            onPreview={handlePreviewSettings}
            language={appearance.language}
          />
        );
      default:
        return <div>Page introuvable</div>;
    }
  };

  // If not authenticated, show login
  if (!isAuthenticated) {
    return (
      <Login
        onLogin={handleLogin}
        language={appearance.language}
        organizationName={settings.organizationName}
      />
    );
  }

  return (
    <Layout 
       activeTab={currentTab} 
       onNavigate={(tab) => {
         // If leaving settings without saving, revert appearance
         if (currentTab === AppState.SETTINGS && tab !== AppState.SETTINGS) {
             setAppearance(settings);
         }
         if (Object.values(AppState).includes(tab)) setCurrentTab(tab);
       }}
       onLogout={handleLogout}
       language={appearance.language}
       organizationName={settings.organizationName}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;
