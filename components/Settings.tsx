import React, { useState, useEffect, useMemo } from 'react';
import { GlobalSettings } from '../types';
import { Save, Building, Coins, Sliders, Check, ChevronDown, Palette, Moon, Sun, Monitor, Globe, Lock, KeyRound, Eye, EyeOff, RefreshCcw } from 'lucide-react';
import { TRANSLATIONS } from '../utils/translations';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

interface SettingsProps {
  settings: GlobalSettings;
  onSave: (newSettings: GlobalSettings) => void;
  onPreview: (tempSettings: GlobalSettings) => void;
  language: 'fr' | 'en';
}

// --- Composant Select Personnalisé (Carbon Style) ---
const CustomSelect = ({ 
  value, 
  onChange, 
  options, 
  placeholder 
}: { 
  value: string; 
  onChange: (val: string) => void; 
  options: { value: string; label: string }[];
  placeholder?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(o => o.value === value);

  return (
    <div className="relative group">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-[40px] px-4 bg-[var(--cds-field-01)] border-b border-[var(--cds-border-strong-01)] hover:bg-[var(--cds-field-02)] text-left text-[var(--cds-text-01)] focus:outline-none focus:ring-2 focus:ring-[var(--cds-focus)] focus:ring-inset transition-colors duration-70 flex items-center justify-between ${isOpen ? 'ring-2 ring-[var(--cds-focus)] ring-inset' : ''}`}
      >
        <span className={`truncate text-[14px] ${!selectedOption ? 'text-[var(--cds-text-03)]' : ''}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown 
          size={16} 
          className={`text-[var(--cds-icon-01)] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          <ul className="absolute z-40 w-full bg-[var(--cds-layer-01)] shadow-lg max-h-60 overflow-y-auto cds-scroll border border-[var(--cds-border-subtle-01)] border-t-0">
            {options.map((opt) => (
              <li
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`px-4 py-3 cursor-pointer transition-colors duration-70 flex items-center justify-between text-[14px] hover:bg-[var(--cds-field-01)] hover:text-[var(--cds-text-01)] ${
                  opt.value === value 
                    ? 'bg-[var(--cds-interactive-01)] text-white hover:bg-[var(--cds-interactive-01-hover)] hover:text-white' 
                    : 'text-[var(--cds-text-01)]'
                }`}
              >
                <span>{opt.label}</span>
                {opt.value === value && <Check size={16} className="text-white" />}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

const DEFAULT_AUTO_RATES = {
  EUR: 655.957,
  USD: 600,
};

const DEFAULT_SCORING_WEIGHTS: GlobalSettings['scoringWeights'] = {
  price: 40,
  technical: 40,
  delivery: 20
};

const WEIGHT_KEYS: (keyof GlobalSettings['scoringWeights'])[] = ['price', 'technical', 'delivery'];

const clampNumber = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const normalizeScoringWeights = (
  weights: GlobalSettings['scoringWeights']
): GlobalSettings['scoringWeights'] => {
  const clamped: GlobalSettings['scoringWeights'] = {
    price: clampNumber(Math.round(weights.price), 0, 100),
    technical: clampNumber(Math.round(weights.technical), 0, 100),
    delivery: clampNumber(Math.round(weights.delivery), 0, 100)
  };

  const total = clamped.price + clamped.technical + clamped.delivery;
  if (total === 100) {
    return clamped;
  }
  if (total <= 0) {
    return { ...DEFAULT_SCORING_WEIGHTS };
  }

  const raw = WEIGHT_KEYS.map((key) => ({
    key,
    value: (clamped[key] / total) * 100
  }));

  const normalized: GlobalSettings['scoringWeights'] = {
    price: Math.floor(raw.find((item) => item.key === 'price')?.value || 0),
    technical: Math.floor(raw.find((item) => item.key === 'technical')?.value || 0),
    delivery: Math.floor(raw.find((item) => item.key === 'delivery')?.value || 0)
  };

  let remainder = 100 - (normalized.price + normalized.technical + normalized.delivery);
  const ranked = raw
    .map((item) => ({ ...item, fraction: item.value - Math.floor(item.value) }))
    .sort((a, b) => b.fraction - a.fraction);

  let cursor = 0;
  while (remainder > 0 && ranked.length > 0) {
    const key = ranked[cursor % ranked.length].key;
    normalized[key] += 1;
    remainder -= 1;
    cursor += 1;
  }

  return normalized;
};

const rebalanceWeights = (
  current: GlobalSettings['scoringWeights'],
  changed: keyof GlobalSettings['scoringWeights'],
  rawValue: number
): GlobalSettings['scoringWeights'] => {
  const nextValue = clampNumber(Math.round(rawValue), 0, 100);
  const otherKeys = WEIGHT_KEYS.filter((k) => k !== changed);
  const remaining = 100 - nextValue;
  const baseTotal = otherKeys.reduce((acc, key) => acc + current[key], 0);

  if (baseTotal <= 0) {
    const firstShare = Math.round(remaining / 2);
    return {
      ...current,
      [changed]: nextValue,
      [otherKeys[0]]: firstShare,
      [otherKeys[1]]: remaining - firstShare
    };
  }

  const first = otherKeys[0];
  const second = otherKeys[1];
  const firstValue = Math.round((current[first] / baseTotal) * remaining);
  const secondValue = remaining - firstValue;

  return {
    ...current,
    [changed]: nextValue,
    [first]: firstValue,
    [second]: secondValue
  };
};

const Settings: React.FC<SettingsProps> = ({ settings, onSave, onPreview, language }) => {
  const [formData, setFormData] = useState<GlobalSettings>({
    ...settings,
    scoringWeights: normalizeScoringWeights(settings.scoringWeights)
  });
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);
  
  // Password Visibility State
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  
  const t = TRANSLATIONS[language]?.settings || TRANSLATIONS.fr.settings;
  const commonT = TRANSLATIONS[language]?.common || TRANSLATIONS.fr.common;
  const isFrench = language === 'fr';

  const scoringPresets: { id: string; label: string; weights: GlobalSettings['scoringWeights'] }[] = [
    { id: 'balanced', label: isFrench ? 'Equilibre' : 'Balanced', weights: { price: 40, technical: 40, delivery: 20 } },
    { id: 'price', label: isFrench ? 'Priorite prix' : 'Price first', weights: { price: 55, technical: 30, delivery: 15 } },
    { id: 'technical', label: isFrench ? 'Priorite technique' : 'Technical first', weights: { price: 30, technical: 55, delivery: 15 } },
    { id: 'delivery', label: isFrench ? 'Priorite delai' : 'Delivery first', weights: { price: 30, technical: 30, delivery: 40 } }
  ];

  const scoringCriteria = [
    { key: 'price' as const, label: isFrench ? 'Prix (Budget)' : 'Price (Budget)', accent: 'var(--cds-support-warning)' },
    { key: 'technical' as const, label: isFrench ? 'Technique (Qualite)' : 'Technical (Quality)', accent: 'var(--cds-support-success)' },
    { key: 'delivery' as const, label: isFrench ? 'Delai (Rapidite)' : 'Delivery (Speed)', accent: 'var(--cds-support-info)' }
  ];

  const scoringTotal = formData.scoringWeights.price + formData.scoringWeights.technical + formData.scoringWeights.delivery;
  const normalizedSettingsWeights = useMemo(
    () => normalizeScoringWeights(settings.scoringWeights),
    [settings.scoringWeights]
  );
  const hasValidRates = [formData.exchangeRates.EUR, formData.exchangeRates.USD].every(v => Number.isFinite(v) && v > 0);
  const hasValidOrg = formData.organizationName.trim().length > 1;
  const isFormValid = hasValidOrg && hasValidRates && scoringTotal === 100;
  const hasUnsavedChanges = useMemo(() => (
    formData.organizationName !== settings.organizationName ||
    formData.baseCurrency !== settings.baseCurrency ||
    formData.exchangeRates.EUR !== settings.exchangeRates.EUR ||
    formData.exchangeRates.USD !== settings.exchangeRates.USD ||
    formData.scoringWeights.price !== normalizedSettingsWeights.price ||
    formData.scoringWeights.technical !== normalizedSettingsWeights.technical ||
    formData.scoringWeights.delivery !== normalizedSettingsWeights.delivery ||
    formData.language !== settings.language ||
    formData.theme !== settings.theme
  ), [formData, settings, normalizedSettingsWeights]);
  const isSaveEnabled = hasUnsavedChanges && isFormValid;

  const pushToast = (message: string, tone: 'success' | 'error' = 'success') => {
    setToast({ message, tone });
    setTimeout(() => setToast(null), 3000);
  };

  // Sync local form when persisted settings change
  useEffect(() => {
    setFormData({
      ...settings,
      scoringWeights: normalizeScoringWeights(settings.scoringWeights)
    });
  }, [settings]);

  // Whenever formData changes, trigger the preview
  useEffect(() => {
    onPreview(formData);
  }, [formData, onPreview]);

  const handleChange = (field: keyof GlobalSettings, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRateChange = (currency: 'EUR' | 'USD', value: string) => {
    const parsed = Number(value);
    const safeRate = Number.isFinite(parsed) ? Math.max(parsed, 0) : 0;
    setFormData(prev => ({
      ...prev,
      exchangeRates: {
        ...prev.exchangeRates,
        [currency]: safeRate
      }
    }));
  };

  const handleWeightChange = (criteria: 'price' | 'technical' | 'delivery', value: string) => {
    if (value.trim() === '') return;
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return;
    setFormData(prev => ({
      ...prev,
      scoringWeights: normalizeScoringWeights(rebalanceWeights(prev.scoringWeights, criteria, parsed))
    }));
  };

  const handleApplyScoringPreset = (weights: GlobalSettings['scoringWeights']) => {
    setFormData(prev => ({
      ...prev,
      scoringWeights: normalizeScoringWeights(weights)
    }));
  };

  const handleResetScoring = () => {
    setFormData(prev => ({
      ...prev,
      scoringWeights: { ...DEFAULT_SCORING_WEIGHTS }
    }));
  };

  const handlePasswordChange = (field: 'current' | 'new' | 'confirm', value: string) => {
    setPasswords(prev => ({ ...prev, [field]: value }));
  };

  const handleCancel = () => {
    setFormData({
      ...settings,
      scoringWeights: normalizeScoringWeights(settings.scoringWeights)
    });
    setPasswords({ current: '', new: '', confirm: '' });
    setShowCurrentPass(false);
    setShowNewPass(false);
  };

  const handleSave = () => {
    if (!hasUnsavedChanges) {
      pushToast(language === 'fr' ? 'Aucune modification à enregistrer.' : 'No changes to save.', 'error');
      return;
    }
    if (!isSaveEnabled) {
      pushToast(language === 'fr'
        ? 'Vérifiez le nom, les taux de change et la pondération (total = 100%).'
        : 'Please verify organization name, exchange rates and weight total (100%).', 'error');
      return;
    }
    onSave({
      ...formData,
      scoringWeights: normalizeScoringWeights(formData.scoringWeights)
    });
    pushToast(t.toast, 'success');
  };

  const handleRestoreAutoRates = () => {
    setFormData(prev => ({
      ...prev,
      exchangeRates: { ...DEFAULT_AUTO_RATES }
    }));
    pushToast(language === 'fr' ? 'Taux réinitialisés.' : 'Rates reset.', 'success');
  };

  const handlePasswordUpdate = () => {
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      pushToast(language === 'fr' ? 'Tous les champs mot de passe sont requis.' : 'All password fields are required.', 'error');
      return;
    }
    if (passwords.new.length < 8) {
      pushToast(language === 'fr' ? 'Le nouveau mot de passe doit contenir au moins 8 caractères.' : 'New password must be at least 8 characters.', 'error');
      return;
    }
    if (passwords.new !== passwords.confirm) {
      pushToast(language === 'fr' ? 'La confirmation du mot de passe ne correspond pas.' : 'Password confirmation does not match.', 'error');
      return;
    }

    // No backend in this project: simulate successful update.
    setPasswords({ current: '', new: '', confirm: '' });
    setShowCurrentPass(false);
    setShowNewPass(false);
    pushToast(language === 'fr' ? 'Mot de passe mis à jour (simulation locale).' : 'Password updated (local simulation).', 'success');
  };

  // Chart Data for Scoring
    const scoringData = useMemo(() => [
    { name: isFrench ? 'Prix' : 'Price', value: formData.scoringWeights.price, color: 'var(--cds-support-warning)' },
    { name: isFrench ? 'Technique' : 'Technical', value: formData.scoringWeights.technical, color: 'var(--cds-support-success)' },
    { name: isFrench ? 'Delai' : 'Delivery', value: formData.scoringWeights.delivery, color: 'var(--cds-support-info)' },
  ], [formData.scoringWeights, isFrench]);

  // Shared Action Buttons Component
  const ActionButtons = () => (
    <div className="flex items-center gap-2">
        <button 
           onClick={handleCancel}
           disabled={!hasUnsavedChanges}
           className="cds-btn cds-btn--ghost h-10 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
           {commonT.cancel}
        </button>
       <button 
           onClick={handleSave}
           disabled={!isSaveEnabled}
           className="cds-btn cds-btn--primary h-10 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
       >
           <Save size={16} /> {commonT.save}
       </button>
   </div>
  );

  return (
    <div className="max-w-[1200px] mx-auto font-sans relative h-full flex flex-col text-[var(--cds-text-01)]">
      
      {/* Header */}
      <header className="page-header pb-6 border-b border-[var(--cds-border-subtle-01)]">
        <div className="page-header-main">
           <p className="page-eyebrow">{language === 'fr' ? 'Parametres' : 'Settings'}</p>
           <h1 className="page-title mt-0">{t.title}</h1>
           <p className="page-subtitle">{t.subtitle}</p>
           <div className="mt-2 flex flex-wrap items-center gap-2">
             {hasUnsavedChanges && (
               <span className="cds-tag cds-tag--gray">Modifications non enregistrées</span>
             )}
             {!isFormValid && (
               <span className="cds-tag cds-tag--blue">Vérifiez nom, taux et total des pondérations (100%)</span>
             )}
           </div>
        </div>
        <ActionButtons />
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto cds-scroll pr-2 pt-6 pb-6">
      <div className="grid grid-cols-1 gap-6">
        
        {/* ROW 1: Appearance & General */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* CARD: Appearance */}
            <div className="bg-[var(--cds-layer-01)] p-4 border border-[var(--cds-border-subtle-01)] flex flex-col h-full">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[var(--cds-border-subtle-01)]">
                    <Palette size={20} className="text-[var(--cds-icon-01)]" />
                    <h2 className="text-[20px] font-normal text-[var(--cds-text-01)]">{t.appearance}</h2>
                </div>

                <div className="space-y-6 flex-1">
                    {/* Language */}
                    <div>
                        <label className="block text-[12px] font-normal text-[var(--cds-text-02)] mb-2 flex items-center gap-2">
                        <Globe size={14} /> {t.language}
                        </label>
                        <CustomSelect 
                        value={formData.language}
                        onChange={(val) => handleChange('language', val)}
                        options={[
                            { value: 'fr', label: 'Français' },
                            { value: 'en', label: 'English' }
                        ]}
                        />
                    </div>

                    {/* Theme */}
                    <div>
                        <label className="block text-[12px] font-normal text-[var(--cds-text-02)] mb-3">{t.theme}</label>
                        <div className="grid grid-cols-3 gap-0 border border-[var(--cds-border-subtle-01)]">
                        {[
                            { val: 'light', label: t.themes.light, icon: Sun },
                            { val: 'dark', label: t.themes.dark, icon: Moon },
                            { val: 'system', label: t.themes.system, icon: Monitor }
                        ].map((item) => (
                            <button
                                key={item.val}
                                onClick={() => handleChange('theme', item.val)}
                                className={`flex flex-col items-center justify-center gap-2 py-4 text-[12px] transition-all duration-70 border-r border-[var(--cds-border-subtle-01)] last:border-r-0 ${
                                formData.theme === item.val 
                                ? 'bg-[var(--cds-field-01)] text-[var(--cds-text-01)] shadow-inner' 
                                : 'bg-[var(--cds-layer-01)] text-[var(--cds-text-02)] hover:bg-[var(--cds-field-01)]'
                                }`}
                            >
                                <item.icon size={20} className={`${formData.theme === item.val ? 'text-[var(--cds-interactive-01)]' : ''}`} /> 
                                <span>{item.label}</span>
                            </button>
                        ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* CARD: Organization & Rates */}
            <div className="flex flex-col gap-6">
                {/* Org & Currency */}
                <div className="bg-[var(--cds-layer-01)] p-4 border border-[var(--cds-border-subtle-01)]">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[var(--cds-border-subtle-01)]">
                        <Building size={20} className="text-[var(--cds-icon-01)]" />
                        <h2 className="text-[20px] font-normal text-[var(--cds-text-01)]">{t.general}</h2>
                    </div>
                    
                    <div className="space-y-5">
                        <div>
                            <label className="block text-[12px] font-normal text-[var(--cds-text-02)] mb-2">{t.orgName}</label>
                            <input 
                                type="text" 
                                value={formData.organizationName}
                                onChange={(e) => handleChange('organizationName', e.target.value)}
                                className="w-full h-[40px] px-4 bg-[var(--cds-field-01)] border-b border-[var(--cds-border-strong-01)] text-[var(--cds-text-01)] placeholder:text-[var(--cds-text-03)] focus:outline-none focus:ring-2 focus:ring-[var(--cds-focus)] focus:ring-inset transition-colors duration-70 text-[14px]"
                                placeholder="Ex: Ma Société SA"
                            />
                        </div>

                        <div>
                            <label className="block text-[12px] font-normal text-[var(--cds-text-02)] mb-2">{t.baseCurrency}</label>
                            <CustomSelect
                                value={formData.baseCurrency}
                                onChange={(val) => handleChange('baseCurrency', val)}
                                options={[
                                { value: "XOF", label: "XOF (FCFA)" },
                                { value: "EUR", label: "EUR (€)" },
                                { value: "USD", label: "USD ($)" },
                                { value: "CAD", label: "CAD ($)" },
                                { value: "MAD", label: "MAD (Dirham)" }
                                ]}
                            />
                        </div>
                    </div>
                </div>

                {/* Rates */}
                <div className="bg-[var(--cds-layer-01)] p-4 border border-[var(--cds-border-subtle-01)] flex-1">
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-[var(--cds-border-subtle-01)]">
                        <div className="flex items-center gap-3">
                            <Coins size={20} className="text-[var(--cds-icon-01)]" />
                            <h2 className="text-[20px] font-normal text-[var(--cds-text-01)]">{t.rates}</h2>
                        </div>
                        <button onClick={handleRestoreAutoRates} className="text-[12px] font-normal text-[var(--cds-interactive-01)] flex items-center gap-1 hover:underline">
                            <RefreshCcw size={12} /> Auto
                        </button>
                    </div>
                    
                    <div className="space-y-4">
                        {/* EUR */}
                        <div className="flex items-center justify-between p-3 bg-[var(--cds-field-01)] border-b border-[var(--cds-border-strong-01)]">
                            <div className="flex items-center gap-3">
                                <span className="w-6 h-6 flex items-center justify-center text-[14px] font-bold text-[var(--cds-text-01)]">€</span>
                                <span className="text-[14px] font-normal text-[var(--cds-text-01)]">1 EUR</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[var(--cds-text-02)] text-[14px]">=</span>
                                <input 
                                    type="number" 
                                    min="0"
                                    step="0.001"
                                    value={formData.exchangeRates.EUR}
                                    onChange={(e) => handleRateChange('EUR', e.target.value)}
                                    className="w-24 text-right bg-transparent text-[var(--cds-text-01)] font-bold outline-none border-b border-transparent focus:border-[var(--cds-focus)] transition-colors"
                                />
                                <span className="text-[12px] font-normal text-[var(--cds-text-02)]">XOF</span>
                            </div>
                        </div>

                        {/* USD */}
                        <div className="flex items-center justify-between p-3 bg-[var(--cds-field-01)] border-b border-[var(--cds-border-strong-01)]">
                            <div className="flex items-center gap-3">
                                <span className="w-6 h-6 flex items-center justify-center text-[14px] font-bold text-[var(--cds-text-01)]">$</span>
                                <span className="text-[14px] font-normal text-[var(--cds-text-01)]">1 USD</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[var(--cds-text-02)] text-[14px]">=</span>
                                <input 
                                    type="number" 
                                    min="0"
                                    step="0.001"
                                    value={formData.exchangeRates.USD}
                                    onChange={(e) => handleRateChange('USD', e.target.value)}
                                    className="w-24 text-right bg-transparent text-[var(--cds-text-01)] font-bold outline-none border-b border-transparent focus:border-[var(--cds-focus)] transition-colors"
                                />
                                <span className="text-[12px] font-normal text-[var(--cds-text-02)]">XOF</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* ROW 2: Scoring */}
        <div className="bg-[var(--cds-layer-01)] p-4 border border-[var(--cds-border-subtle-01)]">
           <div className="flex flex-col md:flex-row gap-8 items-start">
              
              <div className="flex-1 w-full">
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[var(--cds-border-subtle-01)]">
                    <Sliders size={20} className="text-[var(--cds-icon-01)]" />
                    <div>
                        <h2 className="text-[20px] font-normal text-[var(--cds-text-01)]">{t.scoring}</h2>
                        <p className="text-[12px] text-[var(--cds-text-02)] mt-0.5">{t.scoringDesc}</p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {scoringPresets.map((preset) => (
                        <button
                          key={preset.id}
                          onClick={() => handleApplyScoringPreset(preset.weights)}
                          className="h-8 px-3 text-xs font-medium border border-[var(--cds-border-subtle-01)] text-[var(--cds-text-01)] hover:bg-[var(--cds-layer-02)] transition-colors"
                        >
                          {preset.label}
                        </button>
                      ))}
                      <button
                        onClick={handleResetScoring}
                        className="h-8 px-3 text-xs font-medium border border-[var(--cds-border-subtle-01)] text-[var(--cds-interactive-01)] hover:bg-[var(--cds-background-info-subtle)] transition-colors"
                      >
                        {isFrench ? 'Reinitialiser' : 'Reset'}
                      </button>
                    </div>

                    <p className="text-xs text-[var(--cds-text-02)]">
                      {isFrench
                        ? 'Chaque ajustement redistribue automatiquement les autres criteres pour garder un total exact de 100%.'
                        : 'Each change automatically redistributes other criteria to keep an exact 100% total.'}
                    </p>

                    <div className="space-y-4">
                      {scoringCriteria.map((criterion) => (
                        <div key={criterion.key} className="p-3 bg-[var(--cds-field-01)] border border-[var(--cds-border-subtle-01)]">
                          <div className="flex items-center justify-between gap-4 mb-3">
                            <label className="text-[13px] font-medium text-[var(--cds-text-01)]">{criterion.label}</label>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min={0}
                                max={100}
                                step={1}
                                value={formData.scoringWeights[criterion.key]}
                                onChange={(e) => handleWeightChange(criterion.key, e.target.value)}
                                className="w-16 h-8 px-2 text-right text-sm font-semibold bg-[var(--cds-layer-01)] border border-[var(--cds-border-subtle-01)]"
                              />
                              <span className="text-xs text-[var(--cds-text-02)]">%</span>
                            </div>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={formData.scoringWeights[criterion.key]}
                            onChange={(e) => handleWeightChange(criterion.key, e.target.value)}
                            className="w-full h-1 bg-[var(--cds-border-subtle-01)] appearance-none cursor-pointer hover:h-1.5 transition-all duration-200"
                            style={{ accentColor: criterion.accent }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
              </div>
              {/* Visualization Chart */}
              <div className="w-full md:w-80 h-64 bg-[var(--cds-field-01)] flex items-center justify-center relative border border-[var(--cds-border-subtle-01)]">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={scoringData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={2}
                            dataKey="value"
                            stroke="none"
                        >
                            {scoringData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <RechartsTooltip 
                           contentStyle={{ borderRadius: '0', border: '1px solid var(--cds-border-subtle-01)', boxShadow: '0 2px 6px rgba(0,0,0,0.2)', backgroundColor: 'var(--cds-ui-02)' }}
                           itemStyle={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--cds-text-01)' }}
                        />
                    </PieChart>
                 </ResponsiveContainer>
                 {/* Center Text */}
                 <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                     <span className="text-[12px] text-[var(--cds-text-02)] font-normal uppercase">Total</span>
                     <span className="text-[24px] font-light text-[var(--cds-text-01)]">
                        {scoringTotal}%
                     </span>
                 </div>
              </div>

           </div>
        </div>

        {/* Section 4: Security */}
        <div className="bg-[var(--cds-layer-01)] p-4 border border-[var(--cds-border-subtle-01)]">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[var(--cds-border-subtle-01)]">
            <Lock size={20} className="text-[var(--cds-icon-01)]" />
            <h2 className="text-[20px] font-normal text-[var(--cds-text-01)]">{t.security}</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-[12px] font-normal text-[var(--cds-text-02)] mb-2">{t.password.current}</label>
              <div className="relative group">
                <input 
                  type={showCurrentPass ? "text" : "password"}
                  value={passwords.current}
                  onChange={(e) => handlePasswordChange('current', e.target.value)}
                  className="w-full h-[40px] pl-10 pr-10 bg-[var(--cds-field-01)] border-b border-[var(--cds-border-strong-01)] text-[var(--cds-text-01)] placeholder:text-[var(--cds-text-03)] focus:outline-none focus:ring-2 focus:ring-[var(--cds-focus)] focus:ring-inset transition-colors duration-70 text-[14px]"
                  placeholder="••••••••"
                />
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--cds-icon-02)]" size={16} />
                <button 
                  type="button"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--cds-icon-02)] hover:text-[var(--cds-text-01)]"
                >
                    {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-[12px] font-normal text-[var(--cds-text-02)] mb-2">{t.password.new}</label>
              <div className="relative group">
                <input 
                  type={showNewPass ? "text" : "password"}
                  value={passwords.new}
                  onChange={(e) => handlePasswordChange('new', e.target.value)}
                  className="w-full h-[40px] pl-10 pr-10 bg-[var(--cds-field-01)] border-b border-[var(--cds-border-strong-01)] text-[var(--cds-text-01)] placeholder:text-[var(--cds-text-03)] focus:outline-none focus:ring-2 focus:ring-[var(--cds-focus)] focus:ring-inset transition-colors duration-70 text-[14px]"
                  placeholder="••••••••"
                />
                 <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--cds-icon-02)]" size={16} />
                 <button 
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--cds-icon-02)] hover:text-[var(--cds-text-01)]"
                >
                    {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-normal text-[var(--cds-text-02)] mb-2">{t.password.confirm}</label>
              <div className="relative group">
                <input 
                  type={showNewPass ? "text" : "password"}
                  value={passwords.confirm}
                  onChange={(e) => handlePasswordChange('confirm', e.target.value)}
                  className="w-full h-[40px] pl-10 pr-10 bg-[var(--cds-field-01)] border-b border-[var(--cds-border-strong-01)] text-[var(--cds-text-01)] placeholder:text-[var(--cds-text-03)] focus:outline-none focus:ring-2 focus:ring-[var(--cds-focus)] focus:ring-inset transition-colors duration-70 text-[14px]"
                  placeholder="••••••••"
                />
                <Check className={`absolute left-3 top-1/2 -translate-y-1/2 transition-all duration-200 ${passwords.confirm && passwords.new === passwords.confirm ? 'text-[var(--cds-support-success)]' : 'text-[var(--cds-icon-02)]'}`} size={16} />
              </div>
            </div>
            
             <div className="md:col-span-2 flex justify-end">
               <button 
                  onClick={handlePasswordUpdate}
                  disabled={!passwords.current || !passwords.new || passwords.new !== passwords.confirm}
                  className="cds-btn cds-btn--secondary h-10 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
               >
                  {t.password.updateBtn}
               </button>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-8 left-1/2 -translate-x-1/2 bg-[var(--cds-layer-01)] text-[var(--cds-text-01)] border border-[var(--cds-border-subtle-01)] px-4 py-3 shadow-md flex items-center gap-3 z-50 border-l-4 ${
          toast.tone === 'success' ? 'border-l-[var(--cds-support-success)]' : 'border-l-[var(--cds-support-error)]'
        }`}>
          <Check size={16} className={toast.tone === 'success' ? 'text-[var(--cds-support-success)]' : 'text-[var(--cds-support-error)]'} />
          <span className="text-[14px] font-normal">{toast.message}</span>
        </div>
      )}
    </div>
  );
};

export default Settings;


