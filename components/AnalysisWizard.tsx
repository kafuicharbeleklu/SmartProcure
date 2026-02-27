import React, { useState, useEffect, useRef } from 'react';
import { Upload, X, FileType, Check, AlertCircle, FileText, ChevronRight, ArrowRight, PenTool, Coins, History, Save, ChevronDown, ChevronUp, ArrowLeft, LayoutTemplate, ScanEye, Database, Calculator, Scale, FileCheck, Target, Briefcase, Paperclip, CloudUpload, Sparkles, RotateCcw, Trash2 } from 'lucide-react';
import { analyzeSupplierOffers, AnalysisStage } from '../services/geminiService';
import { AnalysisResult } from '../types';
import { TRANSLATIONS } from '../utils/translations';

interface AnalysisWizardProps {
  onAnalysisComplete: (result: AnalysisResult) => void;
  onCancel: () => void;
  defaultRates: { EUR: number; USD: number };
  baseCurrency: string;
  language?: 'fr' | 'en';
}

const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const DRAFT_STORAGE_KEY = 'smartprocure_analysis_draft';

// --- Carbon-style Select Component ---
const CustomSelect = ({ 
  value, 
  onChange, 
  options, 
  label,
  placeholder
}: { 
  value: string; 
  onChange: (val: string) => void; 
  options: { value: string; label: string }[];
  label: string;
  placeholder?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(o => o.value === value);

  return (
    <div className="relative mb-6">
      <label className="block text-xs text-[var(--cds-text-02)] mb-2 font-normal">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-4 h-10 bg-[var(--cds-field-01)] border-b border-[var(--cds-border-strong-01)] text-left text-sm text-[var(--cds-text-01)] hover:bg-[var(--cds-layer-hover-01)] focus:outline-none focus:ring-2 focus:ring-[var(--cds-focus)] transition-colors ${isOpen ? 'bg-[var(--cds-layer-hover-01)]' : ''}`}
      >
        <span className={`truncate ${!selectedOption ? 'text-[var(--cds-text-02)]' : ''}`}>
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
          <ul className="absolute z-40 w-full bg-[var(--cds-layer-01)] border border-[var(--cds-border-subtle-01)] max-h-60 overflow-y-auto cds-scroll">
            {options.map((opt) => (
              <li
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`px-4 py-3 cursor-pointer text-sm hover:bg-[var(--cds-layer-hover-01)] text-[var(--cds-text-01)] ${
                  opt.value === value ? 'bg-[var(--cds-layer-selected-01)] font-semibold' : ''
                }`}
              >
                {opt.label}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

const AnalysisWizard: React.FC<AnalysisWizardProps> = ({ onAnalysisComplete, onCancel, defaultRates, baseCurrency, language = 'fr' }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const t = TRANSLATIONS[language]?.wizard || TRANSLATIONS.fr.wizard;
  const commonT = TRANSLATIONS[language]?.common || TRANSLATIONS.fr.common;
  const isFrench = language === 'fr';

  // Analysis Steps
  const ANALYSIS_STEPS = [
    { id: 1, label: t.step3.loading1, icon: FileText },
    { id: 2, label: t.step3.loading2, icon: ScanEye },
    { id: 3, label: t.step3.loading3, icon: Database },
    { id: 4, label: t.step3.loading4, icon: Calculator },
    { id: 5, label: t.step3.loading5, icon: Scale },
    { id: 6, label: t.step3.loading6, icon: FileCheck }
  ];

  // Form State
  const [title, setTitle] = useState('');
  const [needs, setNeeds] = useState('');
  const [category, setCategory] = useState('material');
  const [priority, setPriority] = useState('price');
  const [specMode, setSpecMode] = useState<'upload' | 'manual'>('upload');
  const [manualSpecs, setManualSpecs] = useState('');
  
  // Validation State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const [showRatesModal, setShowRatesModal] = useState(false);
  const [exchangeRates, setExchangeRates] = useState(defaultRates);
  const [tempRates, setTempRates] = useState({ ...exchangeRates });
  const [rateHistory, setRateHistory] = useState([
    { date: '12/05/2025', currency: 'EUR', rate: defaultRates.EUR, source: 'Paramètres' },
    { date: '12/05/2025', currency: 'USD', rate: defaultRates.USD, source: 'Paramètres' },
  ]);

  const [requestFiles, setRequestFiles] = useState<File[]>([]);
  const [offerFiles, setOfferFiles] = useState<File[]>([]);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  // Draft State
  const [hasDraft, setHasDraft] = useState(false);
  const [draftTimestamp, setDraftTimestamp] = useState<number | null>(null);

  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  // --- AUTO SAVE LOGIC ---
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed.title || parsed.needs) {
            setHasDraft(true);
            setDraftTimestamp(parsed.timestamp);
        }
      }
    } catch (e) {
      console.error("Error reading draft:", e);
    }
  }, []);

  useEffect(() => {
    if (!title && !needs) return;
    if (step === 3) return;

    const draftData = {
      timestamp: Date.now(),
      step: step === 3 ? 1 : step,
      title,
      needs,
      category,
      priority,
      specMode,
      manualSpecs,
      exchangeRates
    };
    
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftData));
  }, [title, needs, category, priority, specMode, manualSpecs, exchangeRates, step]);

  const restoreDraft = () => {
    try {
      const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (savedDraft) {
        const data = JSON.parse(savedDraft);
        setTitle(data.title || '');
        setNeeds(data.needs || '');
        setCategory(data.category || 'material');
        setPriority(data.priority || 'price');
        setSpecMode(data.specMode || 'upload');
        setManualSpecs(data.manualSpecs || '');
        if (data.exchangeRates) setExchangeRates(data.exchangeRates);
        
        if (data.step === 2) {
             setStep(2);
             setWarning("Brouillon restauré. Veuillez réimporter vos fichiers (sécurité navigateur).");
        } else {
             setStep(1);
        }
        
        setHasDraft(false);
      }
    } catch (e) {
      console.error("Error restoring draft:", e);
    }
  };

  const discardDraft = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setHasDraft(false);
  };

  // Validation Logic
  const validateField = (name: string, value: any) => {
    let error = '';
    switch (name) {
      case 'title':
        if (!value.trim()) error = "Le titre du projet est requis.";
        else if (value.length < 3) error = "Le titre doit contenir au moins 3 caractères.";
        break;
      case 'offerFiles':
        if (value.length === 0) error = t.step2.warningFiles;
        break;
      default:
        break;
    }
    return error;
  };

  const handleBlur = (field: string, value: any) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, value);
    setErrors(prev => ({
      ...prev,
      [field]: error
    }));
  };

  const handleChangeField = (field: string, value: any) => {
    if (field === 'title') setTitle(value);
    if (field === 'needs') setNeeds(value);
    
    if (touched[field] || errors[field]) {
       const error = validateField(field, value);
       setErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  const isStep1Valid = () => {
    const titleError = validateField('title', title);
    return !titleError;
  };

  const handleNextStep = () => {
    const titleError = validateField('title', title);
    setTouched({ title: true, needs: true });
    setErrors({ title: titleError });

    if (!titleError) {
      setStep(2);
    }
  };

  const validateAndAddFiles = (newFiles: FileList | null, target: 'request' | 'offer') => {
    setGlobalError(null);
    setWarning(null);

    if (newFiles) {
      const selectedFiles = Array.from(newFiles);
      const validFiles: File[] = [];
      const rejectedFiles: string[] = [];
      const currentFiles = target === 'request' ? requestFiles : offerFiles;

      selectedFiles.forEach(file => {
        if (!ALLOWED_TYPES.includes(file.type)) {
          rejectedFiles.push(`${file.name}`);
          return;
        }
        if (file.size > MAX_FILE_SIZE) {
          rejectedFiles.push(`${file.name}`);
          return;
        }
        if (currentFiles.some(f => f.name === file.name && f.size === file.size)) {
          rejectedFiles.push(`${file.name}`);
          return;
        }
        validFiles.push(file);
      });

      if (rejectedFiles.length > 0) {
        setWarning(`Ignorés : ${rejectedFiles.join(', ')}`);
      }

      if (target === 'request') {
        setRequestFiles(prev => [...prev, ...validFiles]);
      } else {
        const updated = [...offerFiles, ...validFiles];
        setOfferFiles(updated);
        if (updated.length > 0) {
          setErrors(prev => ({ ...prev, offerFiles: '' }));
        }
      }
    }
  };

  const removeFile = (index: number, target: 'request' | 'offer') => {
    if (target === 'request') {
      setRequestFiles(requestFiles.filter((_, i) => i !== index));
    } else {
      const updated = offerFiles.filter((_, i) => i !== index);
      setOfferFiles(updated);
      if (updated.length === 0 && touched.offerFiles) {
        setErrors(prev => ({ ...prev, offerFiles: t.step2.warningFiles }));
      }
    }
    setWarning(null);
  };

  const saveRates = () => {
    const today = new Date().toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US');
    const newHistory = [...rateHistory];
    
    if (tempRates.EUR !== exchangeRates.EUR) {
        newHistory.unshift({ date: today, currency: 'EUR', rate: tempRates.EUR, source: 'Manuel' });
    }
    if (tempRates.USD !== exchangeRates.USD) {
        newHistory.unshift({ date: today, currency: 'USD', rate: tempRates.USD, source: 'Manuel' });
    }

    setExchangeRates(tempRates);
    setRateHistory(newHistory);
    setShowRatesModal(false);
  };

  const sanitizeAndReconstructText = (text: string): string => {
    if (!text) return "";
    const lines = text.split('\n');
    let reconstructed = '';
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) {
        reconstructed += '\n\n';
        continue;
      }
      if (i < lines.length - 1) {
        const nextLine = lines[i+1].trim();
        const seemsBroken = /[a-zA-Z0-9à-ÿ]$/.test(line) && /^[a-zà-ÿ]/.test(nextLine);
        if (seemsBroken) {
          reconstructed += line + ' ';
          continue;
        }
      }
      reconstructed += line + '\n';
    }
    return reconstructed.replace(/[ \t]{2,}/g, ' ').trim();
  };

  const handleAnalyze = async () => {
    const filesError = validateField('offerFiles', offerFiles);
    if (filesError) {
      setErrors(prev => ({ ...prev, offerFiles: filesError }));
      setTouched(prev => ({ ...prev, offerFiles: true }));
      return;
    }

    if (!title || offerFiles.length === 0) return;

    setIsProcessing(true);
    setStep(3);
    setGlobalError(null);
    setWarning(null);
    setLoadingStepIndex(0);

    const cleanedNeeds = sanitizeAndReconstructText(needs) || "Aucune contrainte spécifique mentionnée.";
    const cleanedManualSpecs = sanitizeAndReconstructText(manualSpecs);

    const enrichedNeeds = `
      [CONTEXTE ACHAT]
      Type d'achat: ${category}
      Priorité Principale: ${priority === 'price' ? 'Prix bas' : priority === 'quality' ? 'Qualité technique' : 'Délai rapide'}
      Devise de référence demandée: ${baseCurrency}
      
      [CONTRAINTES SUPPLÉMENTAIRES]
      ${cleanedNeeds}
    `;

    try {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

      const result = await analyzeSupplierOffers(
        title, 
        enrichedNeeds, 
        requestFiles, 
        cleanedManualSpecs,
        offerFiles,
        exchangeRates,
        baseCurrency,
        language as 'fr' | 'en',
        priority as 'price' | 'quality' | 'deadline',
        (stage: AnalysisStage) => {
             if (stage === 'READING_FILES') {
                 setLoadingStepIndex(1);
             } 
             else if (stage === 'SENDING_REQUEST') {
                 setLoadingStepIndex(2);
                 progressIntervalRef.current = setInterval(() => {
                     setLoadingStepIndex(prev => {
                         if (prev < 4) return prev + 1;
                         return prev;
                     });
                 }, 1500);
             } 
             else if (stage === 'PROCESSING_RESPONSE') {
                 if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
                 setLoadingStepIndex(5);
             }
        }
      );
      
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      onAnalysisComplete(result);

    } catch (err: any) {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      console.error(err);
      setGlobalError(err.message || commonT.error);
      setStep(2); 
    } finally {
      setIsProcessing(false);
    }
  };

  const activeStep = ANALYSIS_STEPS[loadingStepIndex];

  return (
    <div className="max-w-[1200px] mx-auto h-full flex flex-col font-sans text-[var(--cds-text-01)]">
      
      {/* Draft Notification Banner */}
      {hasDraft && step !== 3 && (
        <div className="mb-6 bg-[#e5f6ff] border-l-4 border-[#0f62fe] p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <History size={20} className="text-[#0f62fe]" />
                <div>
                    <p className="font-semibold text-[#161616] text-sm">Brouillon non enregistré détecté</p>
                    <p className="text-xs text-[#525252]">
                        Dernière modification : {draftTimestamp ? new Date(draftTimestamp).toLocaleTimeString() : 'Inconnue'}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <button 
                  onClick={discardDraft}
                  className="text-[#da1e28] hover:underline text-sm font-medium flex items-center gap-1"
                >
                  <Trash2 size={14} /> Supprimer
                </button>
                <button 
                  onClick={restoreDraft}
                  className="text-[#0f62fe] hover:underline text-sm font-medium flex items-center gap-1"
                >
                  <RotateCcw size={14} /> Restaurer
                </button>
            </div>
        </div>
      )}

      {/* Header Area */}
      <header className="page-header pb-6 border-b border-[var(--cds-border-subtle-01)]">
          <div className="flex items-center gap-4">
            <button 
              onClick={onCancel}
              disabled={isProcessing}
              className="cds-icon-btn disabled:opacity-30"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="page-header-main">
               <p className="page-eyebrow">{isFrench ? 'Nouvelle analyse' : 'New analysis'}</p>
               <h1 className="page-title mt-0">{t.title}</h1>
               <div className="flex items-center gap-2 mt-1">
                  <p className="page-subtitle mt-0">{t.subtitle}</p>
                  {step !== 3 && (title || needs) && (
                      <span className="flex items-center gap-1 text-[10px] bg-[#e0e0e0] px-2 py-0.5 text-[#525252]">
                          <Save size={10} /> Auto-save
                      </span>
                  )}
               </div>
            </div>
          </div>
          
          {/* Carbon Progress Indicator */}
          <div className="flex items-center">
              {[1, 2, 3].map((s, idx) => (
                <div key={s} className="flex items-center">
                   <div className={`flex flex-col items-center gap-1 relative ${step === s ? 'text-[#0f62fe]' : step > s ? 'text-[#0f62fe]' : 'text-[#8d8d8d]'}`}>
                      <div className="flex items-center gap-2">
                         <div className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] font-bold ${
                            step === s ? 'border-[#0f62fe] text-[#0f62fe]' : 
                            step > s ? 'bg-[#0f62fe] border-[#0f62fe] text-white' : 
                            'border-[#8d8d8d] text-[#8d8d8d]'
                         }`}>
                            {step > s ? <Check size={10} /> : s}
                         </div>
                         <span className={`text-xs font-medium ${step === s ? 'text-[#161616]' : 'text-[#525252]'}`}>
                            {s === 1 && t.steps.needs}
                            {s === 2 && t.steps.offers}
                            {s === 3 && t.steps.analysis}
                         </span>
                      </div>
                      {step === s && <div className="absolute -bottom-2 w-full h-0.5 bg-[#0f62fe]"></div>}
                   </div>
                   {idx < 2 && <div className="w-8 h-px bg-[#e0e0e0] mx-2"></div>}
                </div>
              ))}
          </div>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto cds-scroll pr-2 pt-6">
      {/* Main Content */}
      <div className="bg-[var(--cds-layer-01)] p-8 border border-[var(--cds-border-subtle-01)] min-h-[500px] flex flex-col">
          
          {/* STEP 1: DEFINITION DU BESOIN */}
          {step === 1 && (
            <div className="flex flex-col flex-1 max-w-4xl mx-auto w-full">
              <div className="mb-8">
                 <label className="block text-xs text-[#525252] mb-2 font-normal">{t.step1.projectTitle}</label>
                 <input 
                   type="text" 
                   value={title}
                   autoFocus
                   onChange={(e) => handleChangeField('title', e.target.value)}
                   onBlur={(e) => handleBlur('title', e.target.value)}
                   className={`cds-text-input h-12 text-lg ${
                      errors.title ? 'ring-2 ring-[#da1e28]' : ''
                   }`}
                   placeholder={t.step1.projectPlaceholder}
                 />
                 {errors.title && (
                   <div className="mt-1 text-[#da1e28] text-xs flex items-center gap-1">
                     <AlertCircle size={12}/> {errors.title}
                   </div>
                 )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                 <div>
                    <CustomSelect
                      label={t.step1.purchaseType}
                      value={category}
                      onChange={setCategory}
                      options={[
                        { value: "material", label: t.options.material },
                        { value: "service", label: t.options.service },
                        { value: "software", label: t.options.software }
                      ]}
                    />
                    
                    <CustomSelect
                      label={t.step1.priority}
                      value={priority}
                      onChange={setPriority}
                      options={[
                        { value: "price", label: t.options.price },
                        { value: "quality", label: t.options.quality },
                        { value: "deadline", label: t.options.deadline }
                      ]}
                    />

                    <div className="mt-6">
                       <label className="block text-xs text-[#525252] mb-2 font-normal">{t.step1.constraints}</label>
                       <textarea 
                          value={needs}
                          onChange={(e) => handleChangeField('needs', e.target.value)}
                          className="cds-textarea min-h-[120px] text-sm resize-none"
                          placeholder={t.step1.constraintsPlaceholder}
                        />
                    </div>
                 </div>

                 <div className="bg-[#f4f4f4] p-6 border border-[#e0e0e0]">
                   <div className="flex items-center justify-between mb-4">
                      <label className="text-xs font-bold text-[#161616] uppercase tracking-wide flex items-center gap-2">
                         <Paperclip size={14}/> {t.step1.specs}
                      </label>
                   </div>
                   
                   <div className="flex mb-4 border-b border-[#e0e0e0]">
                     <button 
                       onClick={() => setSpecMode('upload')}
                       className={`flex-1 py-2 text-sm font-medium transition-colors border-b-2 ${
                         specMode === 'upload' ? 'border-[#0f62fe] text-[#0f62fe]' : 'border-transparent text-[#525252] hover:text-[#161616]'
                       }`}
                     >
                       {t.step1.uploadBtn}
                     </button>
                     <button 
                       onClick={() => setSpecMode('manual')}
                       className={`flex-1 py-2 text-sm font-medium transition-colors border-b-2 ${
                         specMode === 'manual' ? 'border-[#0f62fe] text-[#0f62fe]' : 'border-transparent text-[#525252] hover:text-[#161616]'
                       }`}
                     >
                       {t.step1.manualBtn}
                     </button>
                   </div>

                   <div className="flex-1 flex flex-col">
                     {specMode === 'upload' && (
                       <div className="h-full flex flex-col">
                         <div className="flex-1 border-2 border-dashed border-[#8d8d8d] bg-white hover:bg-[#f4f4f4] transition-all relative flex flex-col justify-center items-center cursor-pointer min-h-[120px] p-4 text-center">
                           <input 
                             type="file" 
                             multiple
                             accept=".pdf, .png, .jpg, .jpeg, .webp"
                             onChange={(e) => {
                               validateAndAddFiles(e.target.files, 'request');
                               e.target.value = '';
                             }}
                             className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                           />
                           <Upload size={24} className="text-[#0f62fe] mb-2" />
                           <p className="text-sm text-[#161616] font-medium">{t.step1.dropzone}</p>
                           <p className="text-xs text-[#525252] mt-1">PDF, JPG, PNG (Max 10MB)</p>
                         </div>

                         {requestFiles.length > 0 && (
                           <div className="mt-4 space-y-2">
                               {requestFiles.map((file, idx) => (
                                 <div key={idx} className="flex items-center justify-between p-2 bg-white border border-[#e0e0e0]">
                                   <div className="flex items-center gap-2 overflow-hidden">
                                     <FileText size={14} className="text-[#525252]" />
                                     <span className="text-xs text-[#161616] truncate max-w-[150px]">{file.name}</span>
                                   </div>
                                   <button onClick={() => removeFile(idx, 'request')} className="text-[#525252] hover:text-[#da1e28]">
                                     <X size={14} />
                                   </button>
                                 </div>
                               ))}
                           </div>
                         )}
                       </div>
                     )}

                     {specMode === 'manual' && (
                       <textarea 
                         value={manualSpecs}
                         onChange={(e) => setManualSpecs(e.target.value)}
                         className="cds-textarea flex-1 h-full min-h-[150px] bg-[var(--cds-layer-01)] border border-[var(--cds-border-strong-01)]"
                         placeholder={t.step1.manualPlaceholder}
                       />
                     )}
                   </div>
                 </div>
              </div>

              <div className="flex justify-end pt-8 mt-auto">
                <button 
                  onClick={handleNextStep}
                  className={`cds-btn cds-btn--primary ${!isStep1Valid() && touched.title ? 'opacity-50' : ''}`}
                >
                  {commonT.next} <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: IMPORT DES OFFRES */}
          {step === 2 && (
            <div className="flex flex-col flex-1 max-w-4xl mx-auto w-full">
              <div className="mb-6">
                <h2 className="text-xl font-light text-[#161616] mb-1">{t.step2.title}</h2>
                <p className="text-sm text-[#525252]">
                   Projet: <span className="font-semibold text-[#161616]">{title}</span>
                </p>
              </div>
              
              {warning && (
                <div className="mb-6 p-4 bg-[#fff4e5] border-l-4 border-[#f1c21b] text-[#161616] text-sm flex items-start gap-2">
                  <AlertCircle size={18} className="text-[#f1c21b] mt-0.5 shrink-0" />
                  <span>{warning}</span>
                </div>
              )}

              <div className="flex-1 flex flex-col">
                 {/* BIG DROPZONE */}
                 <div className={`relative flex-1 min-h-[200px] border-2 border-dashed flex flex-col items-center justify-center text-center transition-all cursor-pointer p-8 ${
                    errors.offerFiles 
                    ? 'border-[#da1e28] bg-[#fff1f1]' 
                    : 'border-[#8d8d8d] bg-[#f4f4f4] hover:bg-[#e0e0e0]'
                 }`}>
                     <input 
                        type="file" 
                        multiple
                        accept=".pdf, .png, .jpg, .jpeg, .webp"
                        onChange={(e) => {
                           validateAndAddFiles(e.target.files, 'offer');
                           e.target.value = '';
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                     />
                     <CloudUpload size={48} className={`mb-4 ${errors.offerFiles ? 'text-[#da1e28]' : 'text-[#0f62fe]'}`} />
                     <h3 className="text-lg font-medium text-[#161616]">{t.step2.dropTitle}</h3>
                     <p className="text-sm text-[#525252] mt-1">{t.step2.dropSubtitle}</p>
                 </div>

                 {/* FILE LIST GRID */}
                 {offerFiles.length > 0 && (
                    <div className="mt-6">
                       <h4 className="text-xs font-bold text-[#525252] uppercase tracking-wider mb-3">Fichiers sélectionnés ({offerFiles.length})</h4>
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[200px] overflow-y-auto cds-scroll pr-2">
                        {offerFiles.map((file, idx) => (
                           <div key={idx} className="flex items-center gap-3 p-3 bg-white border border-[#e0e0e0]">
                              <div className="w-8 h-8 bg-[#f4f4f4] flex items-center justify-center text-[#161616] shrink-0">
                                 <FileType size={16} />
                              </div>
                              <div className="min-w-0 flex-1">
                                 <p className="text-sm font-medium text-[#161616] truncate">{file.name}</p>
                                 <p className="text-[10px] text-[#525252] uppercase">{(file.size / 1024).toFixed(0)} KB</p>
                              </div>
                              <button onClick={() => removeFile(idx, 'offer')} className="text-[#525252] hover:text-[#da1e28] transition-colors">
                                 <X size={16} />
                              </button>
                           </div>
                        ))}
                       </div>
                    </div>
                 )}
              </div>
               
              {globalError && (
                <div className="mt-6 p-4 bg-[#fff1f1] border-l-4 border-[#da1e28] text-[#161616] text-sm flex items-center gap-2">
                  <AlertCircle size={18} className="text-[#da1e28]" />
                  {globalError}
                </div>
              )}

              <div className="flex justify-between pt-8 mt-6 border-t border-[#e0e0e0]">
                <button 
                  onClick={() => setStep(1)}
                  className="cds-btn cds-btn--secondary"
                >
                  {commonT.back}
                </button>
                
                <div className="flex items-center gap-4">
                   <button 
                     onClick={() => setShowRatesModal(true)}
                     className="text-xs font-bold text-[#0f62fe] bg-[#edf5ff] px-3 py-2 hover:bg-[#d0e2ff] transition-colors"
                   >
                      1€ = {exchangeRates.EUR} XOF
                   </button>
                   <button 
                     onClick={handleAnalyze}
                     disabled={offerFiles.length === 0}
                     className={`cds-btn cds-btn--primary ${offerFiles.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                   >
                     {t.step2.launchBtn} <Sparkles size={18} />
                   </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: ANALYSE EN COURS */}
          {step === 3 && (
            <div className="py-12 text-center h-full flex flex-col items-center justify-center">
               
               {/* Carbon Loading Spinner */}
               <div className="relative w-24 h-24 mb-8">
                  <svg className="animate-spin w-full h-full text-[#0f62fe]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
               </div>
               
               {/* Text Feedback */}
               <div className="max-w-md mx-auto space-y-4">
                  <h3 className="text-2xl font-light text-[#161616]">
                    {activeStep.label}
                  </h3>
                  <div className="w-full bg-[#e0e0e0] h-1">
                     <div 
                        className="bg-[#0f62fe] h-1 transition-all duration-500"
                        style={{ width: `${((loadingStepIndex + 1) / ANALYSIS_STEPS.length) * 100}%` }}
                     />
                  </div>
                  <p className="text-sm text-[#525252]">
                    Étape {loadingStepIndex + 1} sur {ANALYSIS_STEPS.length}
                  </p>
               </div>
            </div>
          )}
      </div>
      </div>

      {/* RATES MODAL */}
      {showRatesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--cds-overlay)] p-4">
           <div className="bg-[var(--cds-layer-01)] w-full max-w-md border border-[var(--cds-border-subtle-01)]">
              <div className="p-4 bg-[#f4f4f4] flex justify-between items-center">
                 <h3 className="text-lg font-medium text-[#161616] flex items-center gap-2">
                    <Coins size={20} /> 
                    {language === 'fr' ? 'Taux de change' : 'Exchange Rates'}
                 </h3>
                 <button onClick={() => setShowRatesModal(false)} className="cds-icon-btn text-[#525252] hover:text-[#da1e28]">
                    <X size={20} />
                 </button>
              </div>
              
              <div className="p-6 space-y-6">
                 <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white border border-[#e0e0e0]">
                        <div className="flex items-center gap-3">
                           <span className="w-8 h-8 bg-[#f4f4f4] flex items-center justify-center text-sm font-bold">€</span>
                           <span className="font-medium text-[#161616]">1 EUR =</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <input 
                              type="number" 
                              value={tempRates.EUR}
                              onChange={(e) => setTempRates({...tempRates, EUR: parseFloat(e.target.value)})}
                              className="cds-text-input w-24 text-right font-medium px-2"
                            />
                            <span className="text-xs font-bold text-[#525252]">XOF</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white border border-[#e0e0e0]">
                        <div className="flex items-center gap-3">
                           <span className="w-8 h-8 bg-[#f4f4f4] flex items-center justify-center text-sm font-bold">$</span>
                           <span className="font-medium text-[#161616]">1 USD =</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <input 
                              type="number" 
                              value={tempRates.USD}
                              onChange={(e) => setTempRates({...tempRates, USD: parseFloat(e.target.value)})}
                              className="cds-text-input w-24 text-right font-medium px-2"
                            />
                            <span className="text-xs font-bold text-[#525252]">XOF</span>
                        </div>
                    </div>
                 </div>

                 {/* History Table */}
                 <div>
                    <h4 className="text-xs font-bold text-[#525252] uppercase tracking-wide flex items-center gap-2 mb-3">
                       <History size={14}/> {language === 'fr' ? 'Historique' : 'History'}
                    </h4>
                    <div className="border border-[#e0e0e0]">
                       <table className="w-full text-xs text-left">
                          <tbody className="divide-y divide-[#e0e0e0]">
                             {rateHistory.slice(0, 3).map((h, idx) => (
                                <tr key={idx} className="bg-white hover:bg-[#f4f4f4]">
                                   <td className="px-3 py-2 text-[#525252]">{h.date}</td>
                                   <td className="px-3 py-2 font-bold text-[#161616]">{h.currency}</td>
                                   <td className="px-3 py-2 text-[#161616]">{h.rate}</td>
                                   <td className="px-3 py-2 text-right">
                                     <span className="px-1.5 py-0.5 bg-[#e0e0e0] text-[#161616] font-medium uppercase">{h.source}</span>
                                   </td>
                                </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                 </div>
              </div>

              <div className="p-4 bg-[#f4f4f4] flex justify-end gap-3">
                 <button 
                   onClick={() => setShowRatesModal(false)}
                   className="cds-btn cds-btn--secondary h-10"
                 >
                   {commonT.cancel}
                 </button>
                 <button 
                   onClick={saveRates}
                   className="cds-btn cds-btn--primary h-10"
                 >
                   <Save size={16} /> {commonT.save}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisWizard;
