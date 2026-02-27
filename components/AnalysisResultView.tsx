import React, { useState, useMemo, useRef, useEffect } from 'react';
import { AnalysisResult, SupplierOffer, SupplierEvaluation } from '../types';
import { ArrowLeft, CheckCircle, AlertTriangle, TrendingUp, Award, Cpu, X, Coins, ChevronRight, ChevronLeft, Star, Sparkles, FileCheck, Lock, FolderCheck, MapPin, Phone, Mail, Download, FileSpreadsheet, FileCheck2, CalendarDays } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, LabelList } from 'recharts';
import EvaluationModal from './EvaluationModal';
import { TRANSLATIONS } from '../utils/translations';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface AnalysisResultViewProps {
  result: AnalysisResult;
  onBack: () => void;
  onEvaluateSupplier?: (evaluation: SupplierEvaluation) => void;
  language?: 'fr' | 'en';
}

// Carbon Design System Data Viz Palette
const COLORS = ['#6929c4', '#1192e8', '#005d5d', '#9f1853', '#fa4d56', '#570408', '#198038', '#002d9c', '#ee538b', '#b28600'];

const AnalysisResultView: React.FC<AnalysisResultViewProps> = ({ result, onBack, onEvaluateSupplier, language = 'fr' }) => {
  const [selectedOffer, setSelectedOffer] = useState<SupplierOffer | null>(null);
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  
  const [financialMetric, setFinancialMetric] = useState<'ttc' | 'ht' | 'tva'>('ttc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [hiddenSuppliers, setHiddenSuppliers] = useState<string[]>([]);
  const [evaluationCandidate, setEvaluationCandidate] = useState<string | null>(null);
  const [offerStatusFilter, setOfferStatusFilter] = useState<'all' | 'recommended' | 'winner'>('all');
  const [offerSort, setOfferSort] = useState<'price_asc' | 'price_desc' | 'delivery_asc' | 'technical_desc' | 'compliance_desc'>('price_asc');
  const [detailsTab, setDetailsTab] = useState<'summary' | 'technical' | 'risks'>('summary');

  const t = TRANSLATIONS[language]?.common || TRANSLATIONS.fr.common;
  const baseCurrency = result.offers.length > 0 ? result.offers[0].currency : 'XOF';
  const locale = language === 'fr' ? 'fr-FR' : 'en-US';
  
  useEffect(() => {
    setCurrentPage(1);
    setHiddenSuppliers([]);
    setSelectedOffer(null);
    setEvaluationCandidate(null);
    setOfferStatusFilter('all');
    setOfferSort('price_asc');
    setDetailsTab('summary');
  }, [result.id]);

  useEffect(() => {
    if (!selectedOffer) return;
    const previousOverflow = document.body.style.overflow;
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedOffer(null);
      }
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleEsc);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleEsc);
    };
  }, [selectedOffer]);

  useEffect(() => {
    if (selectedOffer) {
      setDetailsTab('summary');
    }
  }, [selectedOffer]);

  const cleanText = (text: string) => {
    if (!text) return '';
    return text.replace(/\*\*/g, '').replace(/\*/g, '').replace(/__/g, '').replace(/_/g, '').trim();
  };

  const formatBestOption = (text: string) => {
    const cleaned = cleanText(text);
    if (cleaned.includes(" est ")) return cleaned.split(" est ")[0];
    if (cleaned.includes(" is ")) return cleaned.split(" is ")[0];
    if (cleaned.length > 40 && (cleaned.includes('.') || cleaned.includes(','))) {
        return cleaned.split(/[,.]/)[0];
    }
    return cleaned;
  };

  const bestOptionCleaned = cleanText(result.bestOption).toLowerCase();
  const isCompleted = result.status === 'completed';

  const normalizeSupplierName = (name: string) => cleanText(name).toLowerCase();

  const isOfferRecommended = (offer: SupplierOffer) => {
    const offerNameCleaned = normalizeSupplierName(offer.supplierName);
    return (
      offerNameCleaned === bestOptionCleaned ||
      (bestOptionCleaned.length > 3 && offerNameCleaned.includes(bestOptionCleaned)) ||
      (offerNameCleaned.length > 3 && bestOptionCleaned.includes(offerNameCleaned))
    );
  };

  const isOfferWinner = (offer: SupplierOffer) => {
    if (!result.winningSupplier) return false;
    return normalizeSupplierName(result.winningSupplier) === normalizeSupplierName(offer.supplierName);
  };

  const formatCurrency = (val: number, currency: string = baseCurrency) => {
    if (!val && val !== 0) return '-';
    let curr = currency?.toUpperCase();
    let displayCurr = curr;
    if (curr === 'XOF' || curr === 'FCFA' || curr === 'CFA') {
       displayCurr = 'F CFA';
    } else if (curr === 'EUR') {
       displayCurr = '€';
    } else if (curr === 'USD') {
       displayCurr = '$';
    }

    try {
      const formattedNum = new Intl.NumberFormat(locale, {
        maximumFractionDigits: 0,
        minimumFractionDigits: 0
      }).format(val);
      return `${formattedNum} ${displayCurr}`;
    } catch (e) {
      return `${val} ${displayCurr}`;
    }
  };

  const formatCompactMetric = (val: number) => {
    if (!Number.isFinite(val)) return '-';
    if (Math.abs(val) >= 1_000_000) {
      return `${new Intl.NumberFormat(locale, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      }).format(val / 1_000_000)} M`;
    }
    return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(val);
  };

  const isCurrencyDifferent = (offer: SupplierOffer) => {
    return offer.originalCurrency && 
           offer.originalCurrency !== baseCurrency && 
           offer.originalCurrency !== 'FCFA' && 
           offer.originalCurrency !== 'CFA' &&
           offer.originalCurrency !== offer.currency;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  const getSupplierColor = (name: string) => {
    const index = result.offers.findIndex(o => o.supplierName === name);
    return COLORS[index >= 0 ? index % COLORS.length : 0];
  };

  const toggleSupplier = (name: string) => {
    setHiddenSuppliers(prev => 
      prev.includes(name) 
        ? prev.filter(s => s !== name) 
        : [...prev, name]
    );
  };

  const visibleOffers = useMemo(
    () => result.offers.filter(o => !hiddenSuppliers.includes(o.supplierName)),
    [result.offers, hiddenSuppliers]
  );

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);

    try {
        const element = reportRef.current;
        const canvas = await html2canvas(element, {
            scale: 2,
            backgroundColor: '#FFFFFF',
            useCORS: true
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
        const printHeight = (imgHeight * pdfWidth) / imgWidth;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, printHeight);
        pdf.save(`SmartProcure_Report_${result.title.substring(0, 10)}.pdf`);

    } catch (error) {
        console.error("PDF Export failed", error);
    } finally {
        setIsExporting(false);
    }
  };

  const handleDownloadCSV = () => {
    const headers = [
      'Fournisseur',
      'NIF',
      'Prix HT',
      'TVA (Estimée)',
      'Prix TTC',
      'Devise',
      'Score Technique /100',
      'Score Conformité /100',
      'Garantie (mois)',
      'Livraison (jours)',
      'Recommandation'
    ];

    const rows = result.offers.map(o => {
      const cleanName = o.supplierName.replace(/,/g, ' ');
      const cleanNif = o.nif ? o.nif.replace(/,/g, ' ') : '-';
      const cleanRec = o.recommendation.replace(/,/g, ' ');
      const tva = o.totalPriceTTC - o.totalPriceHT;

      return [
        cleanName,
        cleanNif,
        o.totalPriceHT,
        tva,
        o.totalPriceTTC,
        o.currency,
        o.technicalScore,
        o.complianceScore,
        o.warrantyMonths,
        o.deliveryDays,
        cleanRec
      ].join(',');
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `analyse_finance_${result.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const CustomAxisTick = (props: any) => {
    const { x, y, payload } = props;
    const name = payload.value;
    const color = getSupplierColor(name);
    const initials = getInitials(name);

    return (
      <g transform={`translate(${x},${y})`}>
        <circle cx={0} cy={12} r={14} fill={color} />
        <text 
          x={0} y={12} dy={4} textAnchor="middle" fill="#FFFFFF" fontSize={10} fontWeight="bold" style={{ pointerEvents: 'none' }}
        >
          {initials}
        </text>
      </g>
    );
  };

  const radarData = useMemo(() => {
    const axes = [
      { key: 'technicalScore', label: 'Technique' },
      { key: 'complianceScore', label: 'Conformité' },
      { key: 'priceScore', label: 'Prix' },
      { key: 'deliveryScore', label: 'Rapidité' },
    ];

    if (visibleOffers.length === 0) {
      return axes.map(axis => ({ subject: axis.label }));
    }

    const allOffers = result.offers;
    const minPrice = Math.min(...allOffers.map(o => o.totalPriceTTC));
    const minDel = Math.min(...allOffers.map(o => o.deliveryDays));

    return axes.map(axis => {
      const dataPoint: any = { subject: axis.label };
      visibleOffers.forEach(offer => {
        let val = 0;
        if (axis.key === 'priceScore') {
          val = minPrice > 0 && offer.totalPriceTTC > 0 ? Math.round((minPrice / offer.totalPriceTTC) * 100) : 0;
        } else if (axis.key === 'deliveryScore') {
           val = offer.deliveryDays === 0 ? 100 : Math.round((minDel / Math.max(offer.deliveryDays, 1)) * 100);
        } else {
          val = (offer as any)[axis.key];
        }
        dataPoint[offer.supplierName] = val;
      });
      return dataPoint;
    });
  }, [visibleOffers, result.offers]);

  const priceData = useMemo(() => {
    return visibleOffers.map(offer => {
      const tva = Math.max(0, offer.totalPriceTTC - offer.totalPriceHT);
      return {
        name: offer.supplierName,
        ttc: offer.totalPriceTTC,
        ht: offer.totalPriceHT,
        tva: tva
      };
    });
  }, [visibleOffers]);

  const sortedAndFilteredOffers = useMemo(() => {
    const filtered = result.offers.filter((offer) => {
      if (offerStatusFilter === 'winner') return isOfferWinner(offer);
      if (offerStatusFilter === 'recommended') return isOfferRecommended(offer);
      return true;
    });

    const sorted = [...filtered];
    sorted.sort((a, b) => {
      switch (offerSort) {
        case 'price_desc':
          return b.totalPriceTTC - a.totalPriceTTC;
        case 'delivery_asc':
          return a.deliveryDays - b.deliveryDays;
        case 'technical_desc':
          return b.technicalScore - a.technicalScore;
        case 'compliance_desc':
          return b.complianceScore - a.complianceScore;
        case 'price_asc':
        default:
          return a.totalPriceTTC - b.totalPriceTTC;
      }
    });

    return sorted;
  }, [result.offers, offerStatusFilter, offerSort, result.winningSupplier, bestOptionCleaned]);

  useEffect(() => {
    setCurrentPage(1);
  }, [offerStatusFilter, offerSort, result.id]);

  const totalPages = Math.max(1, Math.ceil(sortedAndFilteredOffers.length / itemsPerPage));
  const displayedOffers = sortedAndFilteredOffers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const hiddenCount = result.offers.length - visibleOffers.length;

  const referenceOfferForDelta = useMemo(() => {
    if (!result.offers.length) return null;
    const winnerOffer = result.offers.find((offer) => isOfferWinner(offer));
    if (winnerOffer) return winnerOffer;
    const recommendedOffer = result.offers.find((offer) => isOfferRecommended(offer));
    if (recommendedOffer) return recommendedOffer;
    return result.offers.reduce((minOffer, offer) => (
      offer.totalPriceTTC < minOffer.totalPriceTTC ? offer : minOffer
    ), result.offers[0]);
  }, [result.offers, result.winningSupplier, bestOptionCleaned]);

  const formatSignedValue = (value: number, suffix = '') => {
    const formatted = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value);
    const sign = value > 0 ? '+' : '';
    return `${sign}${formatted}${suffix}`;
  };

  const getOfferDeltas = (offer: SupplierOffer) => {
    if (!referenceOfferForDelta) return null;
    if (normalizeSupplierName(referenceOfferForDelta.supplierName) === normalizeSupplierName(offer.supplierName)) return null;
    const basePrice = referenceOfferForDelta.totalPriceTTC;
    const priceDeltaPct = basePrice > 0 ? ((offer.totalPriceTTC - basePrice) / basePrice) * 100 : 0;
    const deliveryDeltaDays = offer.deliveryDays - referenceOfferForDelta.deliveryDays;
    return {
      priceDeltaPct,
      deliveryDeltaDays,
      referenceName: cleanText(referenceOfferForDelta.supplierName)
    };
  };

  const selectedOfferDeltas = selectedOffer ? getOfferDeltas(selectedOffer) : null;
  const selectedOfferTva = selectedOffer ? Math.max(0, selectedOffer.totalPriceTTC - selectedOffer.totalPriceHT) : 0;
  const selectedOfferRisks = selectedOffer ? {
    budget: !!selectedOfferDeltas && selectedOfferDeltas.priceDeltaPct > 10,
    delivery: selectedOffer.deliveryDays > 30 || (!!selectedOfferDeltas && selectedOfferDeltas.deliveryDeltaDays > 7),
    compliance: selectedOffer.complianceScore < 70
  } : { budget: false, delivery: false, compliance: false };

  const handleEvaluateFromDetails = () => {
    if (!selectedOffer) return;
    setEvaluationCandidate(cleanText(selectedOffer.supplierName));
    setShowEvaluationModal(true);
    setSelectedOffer(null);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      if (financialMetric === 'ttc') {
         return (
            <div className="bg-[var(--cds-text-01)] p-3 text-[var(--cds-inverse-01)] text-xs shadow-lg">
               <p className="font-bold mb-2">{label}</p>
               <div className="space-y-1">
                  <div className="flex justify-between gap-4">
                     <span className="text-[var(--cds-text-03)]">Prix HT:</span>
                     <span className="font-mono">{formatCurrency(data.ht, baseCurrency)}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                     <span className="text-[var(--cds-text-03)]">TVA:</span>
                     <span className="font-mono">{formatCurrency(data.tva, baseCurrency)}</span>
                  </div>
                  <div className="w-full h-px bg-[var(--cds-interactive-02)] my-1"></div>
                  <div className="flex justify-between gap-4">
                     <span className="font-bold">Total TTC:</span>
                     <span className="font-bold font-mono">{formatCurrency(data.ttc, baseCurrency)}</span>
                  </div>
               </div>
            </div>
         );
      } else {
         const value = financialMetric === 'ht' ? data.ht : data.tva;
         const title = financialMetric === 'ht' ? 'Prix HT' : 'Montant TVA';
         const color = financialMetric === 'ht' ? COLORS[0] : COLORS[1];
         return (
            <div className="bg-[var(--cds-text-01)] p-3 text-[var(--cds-inverse-01)] text-xs shadow-lg">
               <p className="font-bold mb-1">{label}</p>
               <div className="flex justify-between gap-4">
                  <span style={{ color: color }}>{title}:</span>
                  <span className="font-mono">{formatCurrency(value, baseCurrency)}</span>
               </div>
            </div>
         );
      }
    }
    return null;
  };

  return (
    <div className="h-full max-w-[1600px] mx-auto font-sans text-[var(--cds-text-01)] relative flex flex-col">
      
      {/* EVALUATION MODAL */}
      {showEvaluationModal && (
        <EvaluationModal 
          candidates={result.offers.map(o => o.supplierName)}
          preSelectedSupplier={evaluationCandidate || cleanText(result.bestOption)}
          onClose={() => {
            setShowEvaluationModal(false);
            setEvaluationCandidate(null);
          }}
          onSubmit={(evaluation) => {
            if (onEvaluateSupplier) {
                onEvaluateSupplier({...evaluation, analysisId: result.id});
            }
            setShowEvaluationModal(false);
            setEvaluationCandidate(null);
          }}
          language={language}
        />
      )}

      {/* App Bar */}
      <header className="page-header pb-6 border-b border-[var(--cds-border-subtle-01)]">
        <div className="flex items-start gap-4 min-w-0">
          <button onClick={onBack} className="cds-icon-btn w-12 h-12 shrink-0 mt-1">
            <ArrowLeft size={24} />
          </button>
          <div className="page-header-main min-w-0">
            <p className="page-eyebrow">Analyse détaillée</p>
            <h1 className="page-title mt-0 truncate">
              {result.title}
            </h1>
            <p className="page-subtitle truncate">
              {cleanText(result.needsSummary) || 'Comparatif des offres fournisseurs'}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="cds-tag cds-tag--gray">
                <CalendarDays size={12} />
                {result.date}
              </span>
              <span className="cds-tag cds-tag--gray">{result.offers.length} offres</span>
              {isCompleted && (
                <span className="cds-tag cds-tag--blue">
                  <Lock size={12} />
                  Clôturé
                </span>
              )}
              {hiddenCount > 0 && (
                <span className="cds-tag cds-tag--green">
                  Filtre actif: {hiddenCount} masqué{hiddenCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start md:self-end lg:self-auto">
            <button
              onClick={handleDownloadCSV}
              disabled={isExporting}
              className="cds-btn cds-btn--ghost h-10 text-sm font-medium"
              title="Exporter pour Excel"
            >
              <FileSpreadsheet size={18} />
              <span className="hidden sm:inline">Export Excel</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              disabled={isExporting}
              className="cds-btn cds-btn--secondary h-10 text-sm font-medium"
            >
              {isExporting ? <div className="w-4 h-4 rounded-full border-2 border-[var(--cds-inverse-01)] border-t-transparent animate-spin" /> : <Download size={18} />}
              <span className="hidden sm:inline">{t.downloadPdf}</span>
            </button>

            {isCompleted ? (
              <div className="flex items-center gap-3 pl-0 lg:pl-4 lg:border-l border-[var(--cds-border-subtle-01)]">
                <div className="text-right hidden sm:block">
                  <p className="text-xs text-[var(--cds-text-02)] font-bold uppercase">Fournisseur Retenu</p>
                  <p className="text-lg font-bold text-[var(--cds-interactive-01)]">{result.winningSupplier || "Non spécifié"}</p>
                  {result.evaluation?.globalScore !== undefined && (
                    <p className="text-xs text-[var(--cds-text-02)] mt-0.5">Score final: {Math.round(result.evaluation.globalScore)}/100</p>
                  )}
                </div>
                <div className="h-10 w-10 bg-[var(--cds-background-brand-subtle)] flex items-center justify-center text-[var(--cds-interactive-01)]">
                  <FolderCheck size={20} />
                </div>
              </div>
            ) : (
              <button onClick={() => { setEvaluationCandidate(null); setShowEvaluationModal(true); }} className="cds-btn cds-btn--primary h-10 font-medium text-sm">
                <FileCheck size={18} />
                Clôturer & Évaluer
              </button>
            )}
        </div>
      </header>

      {/* RESULT CONTENT */}
      <div className="flex-1 min-h-0 overflow-y-auto cds-scroll pr-2 pt-6">
        <div ref={reportRef} className="space-y-8 pb-6">
          {/* --- SUMMARY SECTION --- */}
          <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* Recommendation Card */}
            <div className="bg-[var(--cds-layer-02)] border border-[var(--cds-border-subtle-01)] p-8 relative overflow-hidden h-auto flex flex-col justify-between min-h-[250px]">
               <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                  <Award size={180} />
               </div>
               
               <div className="relative z-10 flex flex-col justify-between h-full">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-[var(--cds-border-subtle-01)]">
                       <Award size={24} className="text-[var(--cds-text-01)]" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest text-[var(--cds-text-02)]">Recommandation IA</span>
                  </div>
                  
                  <div>
                    <div className="text-4xl font-light mb-3 leading-none line-clamp-2 text-[var(--cds-text-01)]">
                      {formatBestOption(result.bestOption)}
                    </div>
                    <p className="text-[var(--cds-text-02)] text-sm leading-relaxed max-w-sm">
                      Meilleur compromis identifié selon vos critères pondérés.
                    </p>
                  </div>
               </div>
            </div>

            {/* Market Analysis */}
            <div className="bg-[var(--cds-layer-01)] border border-[var(--cds-border-subtle-01)] p-8 col-span-2 relative overflow-hidden h-auto">
               <h3 className="text-lg font-medium text-[var(--cds-text-01)] mb-6 flex items-center gap-3 relative z-10">
                 <div className="p-2 bg-[var(--cds-border-subtle-01)]">
                   <TrendingUp size={20} />
                 </div>
                 Synthèse du Marché
               </h3>
               <div className="relative z-10">
                 <p className="text-[var(--cds-text-01)] leading-loose text-base whitespace-pre-line">
                   {cleanText(result.marketAnalysis)}
                 </p>
                 <div className="mt-6 flex items-center gap-2 text-xs font-medium text-[var(--cds-interactive-01)] uppercase tracking-wider">
                   <Sparkles size={14} /> Analyse générée par IA
                 </div>
               </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[var(--cds-layer-01)] p-8 border border-[var(--cds-border-subtle-01)] flex flex-col min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                  <h3 className="font-medium text-[var(--cds-text-01)]">Analyse Financière</h3>
                  <div className="flex bg-[var(--cds-layer-02)] p-1 self-start sm:self-auto">
                     <button 
                        onClick={() => setFinancialMetric('ttc')}
                        className={`px-3 py-1.5 text-xs font-medium transition-colors ${financialMetric === 'ttc' ? 'bg-[var(--cds-interactive-02)] text-[var(--cds-inverse-01)]' : 'text-[var(--cds-text-02)] hover:bg-[var(--cds-border-subtle-01)]'}`}
                     >
                        Total TTC
                     </button>
                     <button 
                        onClick={() => setFinancialMetric('ht')}
                        className={`px-3 py-1.5 text-xs font-medium transition-colors ${financialMetric === 'ht' ? 'bg-[var(--cds-interactive-02)] text-[var(--cds-inverse-01)]' : 'text-[var(--cds-text-02)] hover:bg-[var(--cds-border-subtle-01)]'}`}
                     >
                        Prix HT
                     </button>
                     <button 
                        onClick={() => setFinancialMetric('tva')}
                        className={`px-3 py-1.5 text-xs font-medium transition-colors ${financialMetric === 'tva' ? 'bg-[var(--cds-interactive-02)] text-[var(--cds-inverse-01)]' : 'text-[var(--cds-text-02)] hover:bg-[var(--cds-border-subtle-01)]'}`}
                     >
                        TVA
                     </button>
                  </div>
              </div>

              <div className="w-full h-[350px] mt-2">
                {visibleOffers.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-[var(--cds-text-02)] text-sm border border-dashed border-[var(--cds-border-subtle-01)]">
                    Aucun fournisseur visible. Réactivez au moins une puce dans le Radar.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={priceData} margin={{ top: 30, right: 30, left: 20, bottom: 80 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--cds-border-subtle-01)" />
                      <XAxis dataKey="name" interval={0} tick={<CustomAxisTick />} height={60} tickMargin={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fill: 'var(--cds-text-02)'}} tickFormatter={(value) => formatCompactMetric(value)} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--cds-layer-02)' }} />
                      <Legend verticalAlign="top" align="left" height={36} iconType="circle" wrapperStyle={{ top: -20, left: 0 }} />
                      
                      {financialMetric === 'ttc' ? (
                         <>
                             <Bar name="Prix HT" dataKey="ht" stackId="finance" fill={COLORS[0]} barSize={48} animationDuration={1000} />
                             <Bar name="TVA" dataKey="tva" stackId="finance" fill={COLORS[1]} barSize={48} animationDuration={1000}>
                                 <LabelList dataKey="ttc" position="top" formatter={(val: number) => formatCompactMetric(val)} style={{ fill: 'var(--cds-text-02)', fontSize: 11, fontWeight: 600 }} />
                             </Bar>
                         </>
                      ) : (
                          <Bar name={financialMetric === 'ht' ? "Prix HT" : "TVA"} dataKey={financialMetric} fill={financialMetric === 'ht' ? COLORS[0] : COLORS[1]} barSize={48} animationDuration={1000}>
                             <LabelList dataKey={financialMetric} position="top" formatter={(val: number) => formatCompactMetric(val)} style={{ fill: 'var(--cds-text-02)', fontSize: 11, fontWeight: 600 }} />
                          </Bar>
                      )}
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="bg-[var(--cds-layer-01)] p-8 border border-[var(--cds-border-subtle-01)] flex flex-col min-w-0">
               <div className="flex items-center justify-between mb-4">
                 <h3 className="font-medium text-[var(--cds-text-01)]">Radar de Performance</h3>
                 {hiddenCount > 0 && (
                   <button onClick={() => setHiddenSuppliers([])} className="text-xs text-[var(--cds-link-primary)] hover:underline">
                     Réinitialiser le filtre
                   </button>
                 )}
               </div>
               
               <div className="flex flex-wrap gap-2 mb-4">
                  {result.offers.map((offer) => {
                    const isHidden = hiddenSuppliers.includes(offer.supplierName);
                    const color = getSupplierColor(offer.supplierName);
                    return (
                      <button
                        key={offer.supplierName}
                        onClick={() => toggleSupplier(offer.supplierName)}
                        className={`px-3 py-1 text-xs font-medium border transition-colors flex items-center gap-2 ${
                          isHidden ? 'bg-transparent border-[var(--cds-border-subtle-01)] text-[var(--cds-text-03)]' : 'bg-[var(--cds-layer-01)] border-transparent'
                        }`}
                        style={{
                           borderColor: isHidden ? undefined : color,
                           color: isHidden ? undefined : color,
                           backgroundColor: isHidden ? undefined : `${color}10`
                        }}
                      >
                        <div className={`w-2 h-2 ${isHidden ? 'bg-[var(--cds-border-subtle-01)]' : ''}`} style={{ backgroundColor: isHidden ? undefined : color }} />
                        <span>{offer.supplierName}</span>
                      </button>
                    )
                  })}
               </div>

               <div className="w-full h-[350px] mt-4">
                 {visibleOffers.length === 0 ? (
                   <div className="h-full flex items-center justify-center text-[var(--cds-text-02)] text-sm border border-dashed border-[var(--cds-border-subtle-01)]">
                     Aucun fournisseur visible sur le radar.
                   </div>
                 ) : (
                   <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                        <PolarGrid stroke="var(--cds-border-subtle-01)" />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fontWeight: 600, fill: 'var(--cds-text-02)' }} />
                        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                        {visibleOffers.map((offer) => (
                          <Radar
                            key={offer.supplierName}
                            name={offer.supplierName}
                            dataKey={offer.supplierName}
                            stroke={getSupplierColor(offer.supplierName)}
                            fill={getSupplierColor(offer.supplierName)}
                            fillOpacity={0.1}
                            animationDuration={1000}
                          />
                        ))}
                        <Tooltip />
                      </RadarChart>
                   </ResponsiveContainer>
                 )}
               </div>
            </div>
          </div>
        </div>

        {/* --- LIST VIEW (DETAILS DES OFFRES) --- */}
        <div className="space-y-4">
          <div className="px-2 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div>
              <h3 className="text-xl font-light text-[var(--cds-text-01)]">Détails des Offres</h3>
              <p className="text-xs text-[var(--cds-text-02)] mt-1">{sortedAndFilteredOffers.length} offre(s) affichée(s)</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setOfferStatusFilter('all')}
                className={`px-3 h-8 text-xs font-medium border transition-colors ${
                  offerStatusFilter === 'all'
                    ? 'bg-[var(--cds-interactive-01)] text-[var(--cds-inverse-01)] border-[var(--cds-interactive-01)]'
                    : 'bg-[var(--cds-layer-01)] text-[var(--cds-text-02)] border-[var(--cds-border-subtle-01)] hover:border-[var(--cds-border-strong-01)]'
                }`}
              >
                Toutes
              </button>
              <button
                onClick={() => setOfferStatusFilter('recommended')}
                className={`px-3 h-8 text-xs font-medium border transition-colors ${
                  offerStatusFilter === 'recommended'
                    ? 'bg-[var(--cds-support-success)] text-[var(--cds-inverse-01)] border-[var(--cds-support-success)]'
                    : 'bg-[var(--cds-layer-01)] text-[var(--cds-text-02)] border-[var(--cds-border-subtle-01)] hover:border-[var(--cds-border-strong-01)]'
                }`}
              >
                Recommandées
              </button>
              <button
                onClick={() => setOfferStatusFilter('winner')}
                className={`px-3 h-8 text-xs font-medium border transition-colors ${
                  offerStatusFilter === 'winner'
                    ? 'bg-[var(--cds-interactive-01)] text-[var(--cds-inverse-01)] border-[var(--cds-interactive-01)]'
                    : 'bg-[var(--cds-layer-01)] text-[var(--cds-text-02)] border-[var(--cds-border-subtle-01)] hover:border-[var(--cds-border-strong-01)]'
                }`}
              >
                Retenue
              </button>

              <select
                value={offerSort}
                onChange={(e) => setOfferSort(e.target.value as 'price_asc' | 'price_desc' | 'delivery_asc' | 'technical_desc' | 'compliance_desc')}
                className="h-8 px-2 text-xs bg-[var(--cds-field-01)] border border-[var(--cds-border-subtle-01)] text-[var(--cds-text-01)] focus:outline-none focus:ring-2 focus:ring-[var(--cds-focus)]"
                title="Trier les offres"
              >
                <option value="price_asc">Trier: Prix croissant</option>
                <option value="price_desc">Trier: Prix décroissant</option>
                <option value="delivery_asc">Trier: Délai le plus court</option>
                <option value="technical_desc">Trier: Score technique</option>
                <option value="compliance_desc">Trier: Score conformité</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
              {displayedOffers.length === 0 ? (
                <div className="bg-[var(--cds-layer-01)] border border-dashed border-[var(--cds-border-subtle-01)] px-6 py-10 text-center text-sm text-[var(--cds-text-02)]">
                  Aucune offre ne correspond au filtre sélectionné.
                </div>
              ) : displayedOffers.map((offer, idx) => {
                const isBestOption = isOfferRecommended(offer);
                const isWinner = isOfferWinner(offer);
                const avatarColor = getSupplierColor(offer.supplierName);
                const deltas = getOfferDeltas(offer);

                return (
                  <div 
                    key={`${offer.supplierName}-${idx}`}
                    onClick={() => setSelectedOffer(offer)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelectedOffer(offer);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`Voir les détails du fournisseur ${cleanText(offer.supplierName)}`}
                    className={`group cursor-pointer transition-all duration-200 relative p-5 flex flex-col sm:flex-row sm:items-center gap-4 border ${
                        isWinner
                        ? 'bg-[var(--cds-background-brand-subtle)] border-[var(--cds-interactive-01)] hover:bg-[var(--cds-background-brand-subtle)]'
                        : isBestOption 
                        ? 'bg-[var(--cds-background-success-subtle)] border-[var(--cds-support-success)] hover:bg-[var(--cds-background-success-subtle-hover)]' 
                        : 'bg-[var(--cds-layer-01)] border-[var(--cds-border-subtle-01)] hover:border-[var(--cds-border-strong-01)]'
                    }`}
                  >
                     {/* 1. Supplier Info */}
                     <div className="flex items-center gap-4 flex-[2] min-w-0">
                        {/* Avatar */}
                        <div className="w-12 h-12 flex items-center justify-center text-[var(--cds-inverse-01)] text-sm font-bold shrink-0" style={{ backgroundColor: avatarColor }}>
                            {getInitials(offer.supplierName)}
                         </div>
                         
                         <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h4 className={`font-bold text-base truncate ${isWinner ? 'text-[var(--cds-interactive-01)]' : 'text-[var(--cds-text-01)]'}`}>
                                    {cleanText(offer.supplierName)}
                                </h4>
                                
                                {/* Badges */}
                                {isWinner && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[var(--cds-interactive-01)] text-[var(--cds-inverse-01)] text-[10px] font-bold uppercase tracking-wide">
                                       <CheckCircle size={10} strokeWidth={3} /> Retenu
                                    </span>
                                )}
                                {!isWinner && isBestOption && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[var(--cds-support-success)] text-[var(--cds-inverse-01)] text-[10px] font-bold uppercase tracking-wide">
                                       <Star size={10} strokeWidth={3} /> Recommandé
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-[var(--cds-text-02)] truncate mt-0.5">
                               {cleanText(offer.mainSpecs)}
                            </p>
                         </div>
                     </div>

                     {/* 2. Price Section */}
                     <div className="flex items-center justify-between sm:justify-end gap-6 sm:flex-1">
                        <div className="text-right">
                           <div className="text-xl font-bold text-[var(--cds-text-01)] tabular-nums tracking-tight">
                              {formatCurrency(offer.totalPriceTTC, baseCurrency)}
                           </div>
                           <div className="text-[10px] font-medium text-[var(--cds-text-02)] uppercase tracking-wider">
                              TTC
                           </div>
                           {deltas && (
                             <p className="text-[11px] text-[var(--cds-text-02)] mt-1 whitespace-nowrap">
                               {formatSignedValue(deltas.priceDeltaPct, '%')} prix · {formatSignedValue(deltas.deliveryDeltaDays, ' j')} délai vs {deltas.referenceName}
                             </p>
                           )}
                        </div>
                     </div>

                     {/* 3. Scores & Chevron */}
                     <div className="flex items-center justify-between sm:justify-end gap-4 sm:w-auto sm:border-l sm:border-[var(--cds-border-subtle-01)] sm:pl-6">
                        <div className="flex gap-4">
                             <div className="flex flex-col items-center">
                                <span className={`text-sm font-bold ${offer.technicalScore >= 80 ? 'text-[var(--cds-support-success)]' : 'text-[var(--cds-text-01)]'}`}>{offer.technicalScore}</span>
                                <span className="text-sm uppercase font-bold text-[var(--cds-text-02)]">Tech</span>
                             </div>
                             <div className="flex flex-col items-center">
                                <span className={`text-sm font-bold ${offer.complianceScore >= 80 ? 'text-[var(--cds-interactive-01)]' : 'text-[var(--cds-text-01)]'}`}>{offer.complianceScore}</span>
                                <span className="text-sm uppercase font-bold text-[var(--cds-text-02)]">Conf</span>
                             </div>
                        </div>
                        
                        <div className={`w-8 h-8 flex items-center justify-center transition-colors ${
                            isWinner ? 'bg-[var(--cds-interactive-01)] text-[var(--cds-inverse-01)]' : 'bg-[var(--cds-layer-02)] text-[var(--cds-text-02)] group-hover:bg-[var(--cds-interactive-02)] group-hover:text-[var(--cds-inverse-01)]'
                        }`}>
                           <ChevronRight size={18} />
                        </div>
                     </div>
                  </div>
                );
              })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8">
               <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="cds-icon-btn w-10 h-10 disabled:opacity-30">
                  <ChevronLeft size={20} />
               </button>
               <span className="text-sm font-medium text-[var(--cds-text-02)]">{currentPage} / {totalPages}</span>
               <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="cds-icon-btn w-10 h-10 disabled:opacity-30">
                  <ChevronRight size={20} />
               </button>
            </div>
          )}
          </div>
        </div>
      </div>

      {/* --- SUPPLIER DETAILS (RIGHT OVERLAY) --- */}
      {selectedOffer && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-[var(--cds-overlay)] transition-opacity" onClick={() => setSelectedOffer(null)} />
          
          <aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="supplier-details-title"
            className="bg-[var(--cds-layer-01)] h-full w-full max-w-[680px] flex flex-col relative z-10 overflow-hidden border-l border-[var(--cds-border-subtle-01)] animate-slide-in-right"
          >
             
             {/* Modal Header */}
             <div className="px-6 py-4 flex items-center justify-between bg-[var(--cds-layer-01)] border-b border-[var(--cds-border-subtle-01)] shrink-0">
                <div className="flex items-center gap-3">
                   <div className="flex flex-col">
                      <span className="text-[10px] font-bold tracking-wider uppercase text-[var(--cds-text-02)]">Détails Fournisseur</span>
                      <h2 id="supplier-details-title" className="text-xl font-bold text-[var(--cds-text-01)] truncate max-w-sm">{cleanText(selectedOffer.supplierName)}</h2>
                   </div>
                </div>
                <div className="flex items-center gap-2">
                  {!isCompleted && (
                    <button onClick={handleEvaluateFromDetails} className="cds-btn cds-btn--primary h-10 text-sm">
                      <FileCheck size={16} />
                      Retenir ce fournisseur
                    </button>
                  )}
                  <button onClick={() => setSelectedOffer(null)} className="cds-icon-btn -mr-2 text-[var(--cds-text-02)]" aria-label="Fermer les détails fournisseur">
                    <X size={20} />
                  </button>
                </div>
             </div>

             <div className="px-6 py-3 border-b border-[var(--cds-border-subtle-01)] bg-[var(--cds-layer-01)] shrink-0">
               <div className="grid grid-cols-3 gap-2">
                 {[
                   { id: 'summary', label: 'Synthèse' },
                   { id: 'technical', label: 'Technique' },
                   { id: 'risks', label: 'Risques' }
                 ].map((tab) => (
                   <button
                     key={tab.id}
                     onClick={() => setDetailsTab(tab.id as 'summary' | 'technical' | 'risks')}
                     className={`h-8 px-3 text-xs font-medium border transition-colors ${
                       detailsTab === tab.id
                         ? 'bg-[var(--cds-interactive-01)] text-[var(--cds-inverse-01)] border-[var(--cds-interactive-01)]'
                         : 'bg-[var(--cds-layer-01)] text-[var(--cds-text-02)] border-[var(--cds-border-subtle-01)] hover:border-[var(--cds-border-strong-01)]'
                     }`}
                   >
                     {tab.label}
                   </button>
                 ))}
               </div>
             </div>

             <div className="flex-1 overflow-y-auto cds-scroll px-6 py-6 bg-[var(--cds-layer-01)]">
               {detailsTab === 'summary' && (
                 <div className="space-y-5">
                   {(selectedOffer.email || selectedOffer.phone || selectedOffer.address || selectedOffer.nif) && (
                      <div className="flex flex-wrap gap-3">
                          {selectedOffer.nif && (
                              <div className="flex items-center gap-2 px-4 py-2 bg-[var(--cds-background-info-subtle)] text-[var(--cds-link-primary-hover)] text-sm font-medium border border-[var(--cds-border-info-subtle)]">
                                  <FileCheck2 size={16} />
                                  <span className="font-mono">{selectedOffer.nif}</span>
                              </div>
                          )}
                          {selectedOffer.email && (
                              <a href={`mailto:${selectedOffer.email}`} className="flex items-center gap-2 px-4 py-2 bg-[var(--cds-layer-02)] text-[var(--cds-interactive-01)] hover:bg-[var(--cds-border-subtle-01)] transition-colors text-sm font-medium">
                                  <Mail size={16} />
                                  {selectedOffer.email}
                              </a>
                          )}
                          {selectedOffer.phone && (
                              <div className="flex items-center gap-2 px-4 py-2 bg-[var(--cds-layer-02)] text-[var(--cds-text-02)] text-sm font-medium">
                                  <Phone size={16} />
                                  {selectedOffer.phone}
                              </div>
                          )}
                          {selectedOffer.address && (
                              <div className="flex items-center gap-2 px-4 py-2 bg-[var(--cds-layer-02)] text-[var(--cds-text-02)] text-sm font-medium">
                                  <MapPin size={16} />
                                  {selectedOffer.address}
                              </div>
                          )}
                      </div>
                   )}

                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div className="relative overflow-hidden p-4 bg-[var(--cds-layer-02)] border border-[var(--cds-border-subtle-01)]">
                        <div className="absolute top-0 right-0 p-3 opacity-5"><Coins size={72} /></div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--cds-text-02)] mb-1">Prix HT</p>
                        <p className="text-2xl font-bold text-[var(--cds-text-01)]">{formatCurrency(selectedOffer.totalPriceHT, baseCurrency)}</p>
                     </div>
                     <div className="p-4 bg-[var(--cds-layer-02)] border border-[var(--cds-border-subtle-01)]">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--cds-text-02)] mb-1">TVA estimée</p>
                        <p className="text-2xl font-bold text-[var(--cds-text-01)]">{formatCurrency(selectedOfferTva, baseCurrency)}</p>
                     </div>
                     <div className="p-4 bg-[var(--cds-layer-02)] border border-[var(--cds-border-subtle-01)]">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--cds-text-02)] mb-1">Coût TTC</p>
                        <p className="text-2xl font-bold text-[var(--cds-text-01)]">{formatCurrency(selectedOffer.totalPriceTTC, baseCurrency)}</p>
                     </div>
                   </div>

                   {isCurrencyDifferent(selectedOffer) && (
                     <div className="p-4 bg-[var(--cds-layer-01)] border border-[var(--cds-border-subtle-01)] text-sm text-[var(--cds-text-02)]">
                       <p className="font-medium text-[var(--cds-text-01)] mb-1">Montant d’origine</p>
                       <p>{formatCurrency(selectedOffer.originalTotalPriceTTC || 0, selectedOffer.originalCurrency)}</p>
                     </div>
                   )}

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="p-4 bg-[var(--cds-layer-02)] border border-[var(--cds-border-subtle-01)]">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--cds-text-02)] mb-1">Livraison</p>
                        <p className="text-2xl font-bold text-[var(--cds-text-01)]">{selectedOffer.deliveryDays} <span className="text-xs text-[var(--cds-text-02)] font-medium">jours</span></p>
                     </div>
                     <div className="p-4 bg-[var(--cds-layer-02)] border border-[var(--cds-border-subtle-01)]">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--cds-text-02)] mb-1">Conformité</p>
                        <p className="text-2xl font-bold text-[var(--cds-text-01)]">{selectedOffer.complianceScore}<span className="text-xs text-[var(--cds-text-02)] font-medium">/100</span></p>
                     </div>
                   </div>

                   <div className="p-4 bg-[var(--cds-layer-01)] border border-[var(--cds-border-subtle-01)]">
                     <h3 className="text-xs font-bold text-[var(--cds-text-02)] uppercase tracking-wider mb-3">Écarts comparatifs</h3>
                     {selectedOfferDeltas ? (
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                         <div className="p-3 bg-[var(--cds-layer-02)] border border-[var(--cds-border-subtle-01)]">
                           <p className="text-[var(--cds-text-02)] mb-1">Écart de prix vs {selectedOfferDeltas.referenceName}</p>
                           <p className={`font-bold ${selectedOfferDeltas.priceDeltaPct <= 0 ? 'text-[var(--cds-support-success)]' : 'text-[var(--cds-support-error)]'}`}>
                             {formatSignedValue(selectedOfferDeltas.priceDeltaPct, '%')}
                           </p>
                         </div>
                         <div className="p-3 bg-[var(--cds-layer-02)] border border-[var(--cds-border-subtle-01)]">
                           <p className="text-[var(--cds-text-02)] mb-1">Écart de délai vs {selectedOfferDeltas.referenceName}</p>
                           <p className={`font-bold ${selectedOfferDeltas.deliveryDeltaDays <= 0 ? 'text-[var(--cds-support-success)]' : 'text-[var(--cds-support-error)]'}`}>
                             {formatSignedValue(selectedOfferDeltas.deliveryDeltaDays, ' jours')}
                           </p>
                         </div>
                       </div>
                     ) : (
                       <p className="text-sm text-[var(--cds-text-02)]">Cette offre sert déjà de référence de comparaison.</p>
                     )}
                   </div>

                   <div className="p-5 bg-[var(--cds-layer-01)] border border-[var(--cds-border-subtle-01)]">
                     <h3 className="text-xs font-bold text-[var(--cds-text-02)] uppercase tracking-wider mb-2 flex items-center gap-2">
                       <Sparkles size={16} /> Recommandation IA
                     </h3>
                     <p className="text-sm text-[var(--cds-text-01)] leading-relaxed">
                       {cleanText(selectedOffer.recommendation) || 'Aucune recommandation fournie pour cette offre.'}
                     </p>
                   </div>
                 </div>
               )}

               {detailsTab === 'technical' && (
                 <div className="space-y-5">
                   <div className="p-5 bg-[var(--cds-layer-02)] border border-[var(--cds-border-subtle-01)]">
                     <h3 className="text-xs font-bold text-[var(--cds-text-02)] uppercase tracking-wider mb-2 flex items-center gap-2">
                       <Cpu size={16} /> Configuration
                     </h3>
                     <p className="text-sm text-[var(--cds-text-01)] leading-relaxed">{cleanText(selectedOffer.mainSpecs)}</p>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="p-4 bg-[var(--cds-layer-01)] border border-[var(--cds-border-subtle-01)]">
                       <p className="text-xs font-bold text-[var(--cds-text-02)] uppercase tracking-wider mb-2">Score technique</p>
                       <p className="text-3xl font-bold text-[var(--cds-text-01)]">{selectedOffer.technicalScore}<span className="text-xs font-medium text-[var(--cds-text-02)]">/100</span></p>
                       <div className="mt-3 h-2 bg-[var(--cds-layer-03)]">
                         <div className="h-full bg-[var(--cds-support-success)]" style={{ width: `${Math.min(100, Math.max(0, selectedOffer.technicalScore))}%` }} />
                       </div>
                     </div>
                     <div className="p-4 bg-[var(--cds-layer-01)] border border-[var(--cds-border-subtle-01)]">
                       <p className="text-xs font-bold text-[var(--cds-text-02)] uppercase tracking-wider mb-2">Score conformité</p>
                       <p className="text-3xl font-bold text-[var(--cds-text-01)]">{selectedOffer.complianceScore}<span className="text-xs font-medium text-[var(--cds-text-02)]">/100</span></p>
                       <div className="mt-3 h-2 bg-[var(--cds-layer-03)]">
                         <div className="h-full bg-[var(--cds-interactive-01)]" style={{ width: `${Math.min(100, Math.max(0, selectedOffer.complianceScore))}%` }} />
                       </div>
                     </div>
                   </div>

                   <div className="p-6 bg-[var(--cds-background-success-subtle)] border border-[var(--cds-support-success)]">
                     <h3 className="text-sm font-bold text-[var(--cds-text-success-strong)] uppercase tracking-wide mb-4">Points forts</h3>
                     <ul className="space-y-3">
                       {selectedOffer.strengths.slice(0, 6).map((s, i) => (
                         <li key={i} className="flex items-start gap-3 text-sm text-[var(--cds-text-success)]">
                           <CheckCircle size={18} className="shrink-0 text-[var(--cds-support-success)] mt-0.5" />
                           <span className="font-medium leading-relaxed">{cleanText(s)}</span>
                         </li>
                       ))}
                       {selectedOffer.strengths.length === 0 && (
                         <li className="text-sm text-[var(--cds-text-success)]/60 italic px-2 py-2">Aucun point fort spécifique détecté.</li>
                       )}
                     </ul>
                   </div>
                 </div>
               )}

               {detailsTab === 'risks' && (
                 <div className="space-y-5">
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div className={`p-4 border ${selectedOfferRisks.budget ? 'bg-[var(--cds-background-danger-subtle)] border-[var(--cds-support-error)]' : 'bg-[var(--cds-background-success-subtle)] border-[var(--cds-support-success)]'}`}>
                       <p className="text-xs uppercase tracking-wider font-bold mb-1">Risque coût</p>
                       <p className="text-sm font-medium">{selectedOfferRisks.budget ? 'Élevé' : 'Maîtrisé'}</p>
                     </div>
                     <div className={`p-4 border ${selectedOfferRisks.delivery ? 'bg-[var(--cds-background-danger-subtle)] border-[var(--cds-support-error)]' : 'bg-[var(--cds-background-success-subtle)] border-[var(--cds-support-success)]'}`}>
                       <p className="text-xs uppercase tracking-wider font-bold mb-1">Risque délai</p>
                       <p className="text-sm font-medium">{selectedOfferRisks.delivery ? 'Élevé' : 'Maîtrisé'}</p>
                     </div>
                     <div className={`p-4 border ${selectedOfferRisks.compliance ? 'bg-[var(--cds-background-danger-subtle)] border-[var(--cds-support-error)]' : 'bg-[var(--cds-background-success-subtle)] border-[var(--cds-support-success)]'}`}>
                       <p className="text-xs uppercase tracking-wider font-bold mb-1">Risque conformité</p>
                       <p className="text-sm font-medium">{selectedOfferRisks.compliance ? 'Élevé' : 'Maîtrisé'}</p>
                     </div>
                   </div>

                   <div className="p-6 bg-[var(--cds-background-danger-subtle)] border border-[var(--cds-support-error)]">
                     <h3 className="text-sm font-bold text-[var(--cds-text-danger-strong)] uppercase tracking-wide mb-4">Points de vigilance</h3>
                     <ul className="space-y-3">
                       {selectedOffer.weaknesses.slice(0, 6).map((w, i) => (
                         <li key={i} className="flex items-start gap-3 text-sm text-[var(--cds-text-danger)]">
                           <AlertTriangle size={18} className="shrink-0 text-[var(--cds-support-error)] mt-0.5" />
                           <span className="font-medium leading-relaxed">{cleanText(w)}</span>
                         </li>
                       ))}
                       {selectedOffer.weaknesses.length === 0 && (
                         <li className="text-sm text-[var(--cds-text-danger)]/60 italic px-2 py-2">Aucun point de vigilance majeur.</li>
                       )}
                     </ul>
                   </div>
                 </div>
               )}
             </div>
          </aside>
        </div>
      )}
    </div>
  );
};

export default AnalysisResultView;




