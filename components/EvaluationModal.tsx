import React, { useState, useEffect } from 'react';
import { X, Star, Save, Info, AlertTriangle, CheckCircle, ChevronDown, Award } from 'lucide-react';
import { SupplierEvaluation } from '../types';
import { TRANSLATIONS } from '../utils/translations';

interface EvaluationModalProps {
  candidates: string[]; // List of available suppliers
  preSelectedSupplier?: string | null;
  onClose: () => void;
  onSubmit: (evaluation: SupplierEvaluation) => void;
  language?: 'fr' | 'en';
}

const CRITERIA_CONFIG = [
  { 
    id: 'cost', 
    label: 'Coût', 
    weight: 0.35, 
    description: 'Compétitivité des prix, ouverture à la négociation, respect du budget.' 
  },
  { 
    id: 'quality', 
    label: 'Qualité', 
    weight: 0.20, 
    description: 'Adéquation avec les exigences, respect des normes SSE, fiabilité.' 
  },
  { 
    id: 'deadlines', 
    label: 'Service & Délais', 
    weight: 0.15, 
    description: 'Respect des délais, réactivité, communication proactive.' 
  },
  { 
    id: 'technical', 
    label: 'Capacité Technique & Financière', 
    weight: 0.15, 
    description: 'Ressources humaines/financières, respect des normes documentaires.' 
  },
  { 
    id: 'management', 
    label: 'Management', 
    weight: 0.10, 
    description: 'Facilité de communication, gestion relationnelle, écoute.' 
  },
  { 
    id: 'innovation', 
    label: 'Innovation', 
    weight: 0.05, 
    description: 'Proposition de nouveautés, force de proposition, conseil.' 
  },
];

const EvaluationModal: React.FC<EvaluationModalProps> = ({ candidates, preSelectedSupplier, onClose, onSubmit, language = 'fr' }) => {
  const [selectedSupplier, setSelectedSupplier] = useState<string>(preSelectedSupplier || '');
  const [scores, setScores] = useState<Record<string, number>>({
    cost: 3,
    quality: 3,
    deadlines: 3,
    technical: 3,
    management: 3,
    innovation: 3
  });
  const [comment, setComment] = useState('');
  const [globalScore, setGlobalScore] = useState(0);
  const [step, setStep] = useState<'form' | 'confirm'>('form');

  const t = TRANSLATIONS[language]?.evaluation || TRANSLATIONS.fr.evaluation;

  // Recalculate global score based on weights
  useEffect(() => {
    let total = 0;
    CRITERIA_CONFIG.forEach(c => {
      total += (scores[c.id] || 0) * c.weight;
    });
    setGlobalScore(parseFloat(total.toFixed(2)));
  }, [scores]);

  const handleScoreChange = (id: string, value: number) => {
    setScores(prev => ({ ...prev, [id]: value }));
  };

  const handleValidationClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier) return;
    setStep('confirm');
  };

  const handleFinalSubmit = () => {
    onSubmit({
      supplierName: selectedSupplier,
      criteria: scores as any,
      globalScore,
      comment
    });
  };

  // Helper to get formatted string
  const formatString = (str: string, ...args: any[]) => {
      return str.replace(/{(\d+)}/g, (match, number) => { 
        return typeof args[number] != 'undefined' ? args[number] : match;
      });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--cds-overlay)] p-4 animate-fade-in duration-200">
      <div className="bg-[var(--cds-ui-02)] rounded-none w-full max-w-2xl overflow-hidden animate-zoom-in duration-200 flex flex-col max-h-[90vh] border border-[var(--cds-border-subtle-01)]">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-[var(--cds-border-subtle-01)] flex justify-between items-start bg-[var(--cds-ui-01)] shrink-0">
          <div className="min-w-0">
            <span className="text-[12px] font-bold tracking-wide uppercase text-[var(--cds-interactive-01)] mb-1 block whitespace-nowrap">{t.subtitle}</span>
            <h3 className="text-[24px] font-light text-[var(--cds-text-01)]">{t.title}</h3>
          </div>
          <button onClick={onClose} className="cds-icon-btn -mr-2 mt-0.5 text-[var(--cds-icon-02)]">
            <X size={24} />
          </button>
        </div>

        {step === 'form' ? (
          /* --- FORM STEP --- */
          <form onSubmit={handleValidationClick} className="flex-1 overflow-y-auto cds-scroll px-8 py-6 space-y-8 bg-[var(--cds-ui-02)]">
            
            {/* Supplier Selection */}
            <div className="space-y-3">
               <label className="block text-[14px] font-bold text-[var(--cds-text-01)] uppercase tracking-wide">{t.selectLabel}</label>
               <div className="relative">
                  <select 
                    value={selectedSupplier}
                    onChange={(e) => setSelectedSupplier(e.target.value)}
                    className="w-full appearance-none px-5 py-4 bg-[var(--cds-field-01)] border-b border-[var(--cds-border-strong-01)] rounded-none text-[var(--cds-text-01)] font-medium focus:ring-2 focus:ring-[var(--cds-focus)] focus:ring-inset outline-none transition-all cursor-pointer"
                    required
                  >
                    <option value="" disabled>{t.selectPlaceholder}</option>
                    {candidates.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-[var(--cds-icon-02)] pointer-events-none" size={20} />
               </div>
               <p className="text-[12px] text-[var(--cds-text-02)] px-1">{t.selectHelp}</p>
            </div>

            <div className="w-full h-px bg-[var(--cds-border-subtle-01)]"></div>

            {/* Criteria */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <label className="block text-[14px] font-bold text-[var(--cds-text-01)] uppercase tracking-wide">{t.scoringTitle}</label>
                {selectedSupplier && (
                  <span className="text-[12px] font-medium px-3 py-1 bg-[var(--cds-interactive-01)]/10 text-[var(--cds-interactive-01)] rounded-none">{selectedSupplier}</span>
                )}
              </div>
              
              <div className="bg-[var(--cds-interactive-01)]/10 border border-[var(--cds-interactive-01)]/20 rounded-none p-4 flex gap-3 text-[14px] text-[var(--cds-text-02)]">
                 <Info className="shrink-0 text-[var(--cds-interactive-01)]" size={20} />
                 <p>{t.scoringHelp}</p>
              </div>

              {CRITERIA_CONFIG.map((criterion) => (
                <div key={criterion.id} className="bg-[var(--cds-ui-01)] rounded-none p-4 border border-[var(--cds-border-subtle-01)] hover:border-[var(--cds-border-strong-01)] transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                     <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-[var(--cds-text-01)] text-[16px]">{criterion.label}</h4>
                          <span className="text-[10px] font-bold bg-[var(--cds-field-01)] text-[var(--cds-text-02)] px-2 py-0.5 rounded-none border border-[var(--cds-border-subtle-01)]">
                            {(criterion.weight * 100).toFixed(0)}%
                          </span>
                        </div>
                        <p className="text-[12px] text-[var(--cds-text-02)] mt-1 max-w-sm">{criterion.description}</p>
                     </div>
                     
                     <div className="flex items-center gap-1 shrink-0 bg-[var(--cds-ui-02)] p-1 border border-[var(--cds-border-subtle-01)]">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => handleScoreChange(criterion.id, star)}
                            className={`p-2 transition-colors ${
                              (scores[criterion.id] || 0) >= star 
                                ? 'text-[var(--cds-support-warning)] scale-110' 
                                : 'text-[var(--cds-icon-03)] hover:text-[var(--cds-icon-02)]'
                            }`}
                          >
                            <Star size={20} fill={(scores[criterion.id] || 0) >= star ? "currentColor" : "none"} />
                          </button>
                        ))}
                     </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
               <label className="block text-[14px] font-medium text-[var(--cds-text-01)]">{t.commentLabel}</label>
               <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-[var(--cds-field-01)] border-b border-[var(--cds-border-strong-01)] rounded-none text-[var(--cds-text-01)] placeholder:text-[var(--cds-text-03)] focus:ring-2 focus:ring-[var(--cds-focus)] focus:ring-inset outline-none transition-all resize-none"
                  placeholder={t.commentPlaceholder}
               />
            </div>
            
             {/* Footer Form */}
            <div className="pt-4 flex justify-between items-center">
               <div className="flex flex-col">
                  <span className="text-[12px] font-bold text-[var(--cds-text-02)] uppercase">{t.globalScore}</span>
                  <div className="flex items-baseline gap-2">
                     <span className={`text-[32px] font-light ${globalScore >= 4 ? 'text-[var(--cds-support-success)]' : globalScore >= 2.5 ? 'text-[var(--cds-support-warning)]' : 'text-[var(--cds-support-error)]'}`}>
                        {globalScore}/5
                     </span>
                  </div>
               </div>
               
               <button 
                  type="submit"
                  disabled={!selectedSupplier}
                  className="cds-btn cds-btn--primary disabled:opacity-50 disabled:cursor-not-allowed"
               >
                  {t.validateBtn}
               </button>
            </div>
          </form>
        ) : (
          /* --- CONFIRMATION STEP --- */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-slide-in-right duration-300 bg-[var(--cds-ui-02)]">
             <div className="w-20 h-20 bg-[var(--cds-support-warning)]/10 text-[var(--cds-support-warning)] flex items-center justify-center mb-6">
                <AlertTriangle size={40} />
             </div>
             
             <h3 className="text-[24px] font-light text-[var(--cds-text-01)] mb-2">{t.confirmTitle}</h3>
             <p className="text-[var(--cds-text-02)] max-w-md mb-8 text-[14px]">
               {formatString(t.confirmBody as string, <span className="font-bold text-[var(--cds-text-01)]">{selectedSupplier}</span>, <span className="font-bold">{globalScore}</span>)}
               <br/><br/>
               <span className="text-[var(--cds-support-error)] font-medium">{t.confirmWarning}</span>
             </p>

             <div className="flex gap-4 w-full max-w-sm">
                <button 
                  onClick={() => setStep('form')}
                  className="cds-btn cds-btn--tertiary flex-1 justify-center"
                >
                   {t.back}
                </button>
                <button 
                  onClick={handleFinalSubmit}
                  className="cds-btn cds-btn--primary flex-1 justify-center gap-2"
                >
                   <CheckCircle size={18} /> {t.confirm}
                </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EvaluationModal;
