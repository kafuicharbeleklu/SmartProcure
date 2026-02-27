import React, { useState, useEffect } from 'react';
import { AnalysisResult } from '../types';
import { FileText, TrendingUp, CheckCircle, Plus, Search, ChevronLeft, ChevronRight, Activity } from 'lucide-react';
import { TRANSLATIONS } from '../utils/translations';

interface DashboardProps {
  history: AnalysisResult[];
  onViewResult: (result: AnalysisResult) => void;
  onCreateNew: () => void;
  onOpenHistory?: (analysisId: string) => void;
  language?: 'fr' | 'en';
  currency?: string;
}

const Dashboard: React.FC<DashboardProps> = ({ history, onViewResult, onCreateNew, onOpenHistory, language = 'fr', currency = 'XOF' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const t = TRANSLATIONS[language]?.dashboard || TRANSLATIONS.fr.dashboard;
  const isFrench = language === 'fr';

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const filteredHistory = history.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.date.includes(searchQuery) ||
    item.bestOption.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.offers.some(o => o.supplierName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / itemsPerPage));
  const paginatedHistory = filteredHistory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const resolveCurrencyLabel = (curr: string) => {
    const upper = (curr || '').toUpperCase();
    if (upper === 'XOF' || upper === 'FCFA' || upper === 'CFA') return 'F CFA';
    if (upper === 'EUR') return 'EUR';
    if (upper === 'USD') return 'USD';
    return upper || currency;
  };

  const formatCurrency = (value: number) => {
    return `${new Intl.NumberFormat(isFrench ? 'fr-FR' : 'en-US', {
      maximumFractionDigits: 0
    }).format(value)} ${resolveCurrencyLabel(currency)}`;
  };

  const getReferenceOffer = (item: AnalysisResult) => {
    if (!item.offers.length) return null;
    if (item.winningSupplier) {
      const winning = item.offers.find(o => o.supplierName.toLowerCase() === item.winningSupplier?.toLowerCase());
      if (winning) return winning;
    }
    const best = item.offers.find(o => o.supplierName.toLowerCase() === item.bestOption.toLowerCase());
    if (best) return best;
    return item.offers.reduce((acc, offer) => offer.totalPriceTTC < acc.totalPriceTTC ? offer : acc, item.offers[0]);
  };

  const totalEngagement = history.reduce((sum, item) => {
    const refOffer = getReferenceOffer(item);
    return sum + (refOffer?.totalPriceTTC || 0);
  }, 0);

  const closedCount = history.filter(item => item.status === 'completed').length;

  const recentActivities = history.slice(0, 6).map(item => {
    const isClosed = item.status === 'completed' && !!item.winningSupplier;
    return {
      id: `${item.id}-${isClosed ? 'closed' : 'created'}`,
      title: isClosed ? (isFrench ? 'Dossier cloture' : 'Case closed') : (isFrench ? 'Analyse creee' : 'Analysis created'),
      description: isClosed
        ? `${item.winningSupplier} ${isFrench ? 'retenu' : 'selected'}`
        : `${item.offers.length} ${isFrench ? 'offres comparees' : 'offers compared'}`,
      date: item.date,
      type: isClosed ? 'closed' as const : 'created' as const,
      result: item
    };
  });

  const handleActivityClick = (item: AnalysisResult) => {
    if (onOpenHistory) {
      onOpenHistory(item.id);
      return;
    }
    onViewResult(item);
  };

  return (
    <div className="h-full max-w-[1600px] mx-auto flex flex-col font-sans text-[var(--cds-text-01)]">
      <header className="page-header pb-6 border-b border-[var(--cds-border-subtle-01)]">
        <div className="page-header-main">
          <p className="page-eyebrow">{isFrench ? 'Tableau de bord' : 'Dashboard'}</p>
          <h1 className="page-title">{t.title}</h1>
          <p className="page-subtitle">{t.subtitle}</p>
        </div>

        <button onClick={onCreateNew} className="hidden md:inline-flex cds-btn cds-btn--primary">
          <span className="text-sm font-medium">{t.newAnalysisBtn}</span>
          <Plus size={20} />
        </button>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto cds-scroll pr-2 pt-6 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[var(--cds-layer-01)] p-4 border border-[var(--cds-border-subtle-01)] h-40 flex flex-col justify-between hover:border-[var(--cds-border-strong-01)] transition-colors">
            <div className="flex items-start justify-between">
              <h3 className="text-[var(--cds-text-02)] font-medium text-xs uppercase tracking-wide">{t.stats.analysisMonth}</h3>
              <Activity size={20} className="text-[var(--cds-text-02)]" />
            </div>
            <div>
              <p className="text-4xl font-light text-[var(--cds-text-01)]">{history.length}</p>
              <p className="text-xs text-[var(--cds-text-02)] mt-1">{isFrench ? 'Total des analyses enregistrees' : 'Total saved analyses'}</p>
            </div>
          </div>

          <div className="bg-[var(--cds-layer-01)] p-4 border border-[var(--cds-border-subtle-01)] h-40 flex flex-col justify-between hover:border-[var(--cds-border-strong-01)] transition-colors">
            <div className="flex items-start justify-between">
              <h3 className="text-[var(--cds-text-02)] font-medium text-xs uppercase tracking-wide">{isFrench ? 'Dossiers clotures' : 'Closed cases'}</h3>
              <CheckCircle size={20} className="text-[var(--cds-text-02)]" />
            </div>
            <div>
              <p className="text-4xl font-light text-[var(--cds-text-01)]">{closedCount}</p>
              <p className="text-xs text-[var(--cds-text-02)] mt-1">{isFrench ? 'Evaluations validees' : 'Validated evaluations'}</p>
            </div>
          </div>

          <div className="bg-[var(--cds-layer-01)] p-4 border border-[var(--cds-border-subtle-01)] h-40 flex flex-col justify-between hover:border-[var(--cds-border-strong-01)] transition-colors">
            <div className="flex items-start justify-between">
              <h3 className="text-[var(--cds-text-02)] font-medium text-xs uppercase tracking-wide">{isFrench ? 'Montant engage' : 'Committed amount'}</h3>
              <TrendingUp size={20} className="text-[var(--cds-text-02)]" />
            </div>
            <div>
              <p className="text-2xl lg:text-3xl font-light text-[var(--cds-text-01)] leading-tight">{formatCurrency(totalEngagement)}</p>
              <p className="text-xs text-[var(--cds-text-02)] mt-1">
                {history.reduce((acc, curr) => acc + curr.offers.length, 0)} {isFrench ? 'offres traitees' : 'processed offers'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[var(--cds-layer-01)] border border-[var(--cds-border-subtle-01)] flex flex-col min-h-[420px]">
          <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--cds-border-subtle-01)]">
            <h2 className="text-lg font-normal text-[var(--cds-text-01)]">{t.recentList.title}</h2>

            <div className="flex items-center w-full sm:w-auto">
              <div className="relative flex-1 sm:w-80 group">
                <input
                  type="text"
                  placeholder={t.recentList.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 bg-[var(--cds-field-01)] border-b border-[var(--cds-border-strong-01)] pl-4 pr-10 text-sm text-[var(--cds-text-01)] focus:outline-none focus:ring-2 focus:ring-[var(--cds-focus)] transition-all"
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--cds-text-01)]" size={16} />
              </div>
              <button onClick={onCreateNew} className="md:hidden ml-4 w-10 h-10 flex items-center justify-center bg-[var(--cds-interactive-01)] text-white hover:bg-[var(--cds-interactive-01-hover)]">
                <Plus size={20} />
              </button>
            </div>
          </div>

          {history.length === 0 ? (
            <div className="p-12 text-center text-[var(--cds-text-02)] flex-1 flex flex-col justify-center items-center">
              <FileText size={48} className="opacity-20 mb-4" />
              <p className="text-lg mb-6">{t.recentList.empty}</p>
              <button onClick={onCreateNew} className="px-4 h-10 bg-[var(--cds-interactive-01)] text-white font-medium hover:bg-[var(--cds-interactive-01-hover)] transition-colors flex items-center gap-2">
                {t.recentList.startAnalysis} <Plus size={16} />
              </button>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="p-12 text-center text-[var(--cds-text-02)] flex-1 flex flex-col justify-center items-center">
              <Search size={48} className="opacity-20 mb-4" />
              <p>{t.recentList.emptySearch} "{searchQuery}".</p>
              <button onClick={() => setSearchQuery('')} className="mt-4 text-[var(--cds-link-primary)] hover:underline text-sm">
                {t.recentList.clearSearch}
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead className="bg-[var(--cds-layer-02)]">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold text-[var(--cds-text-01)] uppercase tracking-wider">{t.recentList.columns.project}</th>
                    <th className="px-4 py-3 text-xs font-semibold text-[var(--cds-text-01)] uppercase tracking-wider">{t.recentList.columns.date}</th>
                    <th className="px-4 py-3 text-xs font-semibold text-[var(--cds-text-01)] uppercase tracking-wider">{t.recentList.columns.suppliers}</th>
                    <th className="px-4 py-3 text-xs font-semibold text-[var(--cds-text-01)] uppercase tracking-wider">{t.recentList.columns.recommendation}</th>
                    <th className="px-4 py-3 text-xs font-semibold text-[var(--cds-text-01)] uppercase tracking-wider text-right">{t.recentList.columns.action}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--cds-border-subtle-01)]">
                  {paginatedHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-[var(--cds-layer-hover-01)] transition-colors bg-[var(--cds-layer-01)]">
                      <td className="px-4 py-3 font-medium text-[var(--cds-text-01)] text-sm">{item.title}</td>
                      <td className="px-4 py-3 text-[var(--cds-text-02)] text-sm">{item.date}</td>
                      <td className="px-4 py-3 text-[var(--cds-text-02)]">
                        <div className="flex -space-x-2 overflow-hidden">
                          {item.offers.slice(0, 3).map((o, idx) => (
                            <div key={idx} className="inline-flex h-6 w-6 bg-[var(--cds-layer-03)] border border-white items-center justify-center text-[10px] font-bold text-[var(--cds-text-01)]">
                              {o.supplierName.charAt(0)}
                            </div>
                          ))}
                          {item.offers.length > 3 && (
                            <div className="inline-flex h-6 w-6 bg-[var(--cds-layer-03)] border border-white items-center justify-center text-[10px] font-bold text-[var(--cds-text-01)]">
                              +{item.offers.length - 3}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-[var(--cds-background-success-subtle)] text-[var(--cds-support-success)]">
                          {item.bestOption}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => onViewResult(item)} className="text-[var(--cds-link-primary)] hover:text-[var(--cds-link-primary-hover)] font-medium text-sm hover:underline">
                          {t.recentList.columns.open}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 mt-auto border-t border-[var(--cds-border-subtle-01)] bg-[var(--cds-layer-01)]">
                  <div className="text-xs text-[var(--cds-text-02)]">
                    {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredHistory.length)} sur {filteredHistory.length}
                  </div>
                  <div className="flex items-center gap-px bg-[var(--cds-layer-02)]">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 text-[var(--cds-text-01)] hover:bg-[var(--cds-layer-hover-01)] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <div className="flex items-center">
                      <span className="text-xs px-2 text-[var(--cds-text-01)]">Page {currentPage} sur {totalPages}</span>
                    </div>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 text-[var(--cds-text-01)] hover:bg-[var(--cds-layer-hover-01)] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-[var(--cds-layer-01)] border border-[var(--cds-border-subtle-01)]">
          <div className="px-4 py-3 border-b border-[var(--cds-border-subtle-01)]">
            <h2 className="text-lg font-normal text-[var(--cds-text-01)]">{isFrench ? 'Activites recentes' : 'Recent activities'}</h2>
          </div>

          {recentActivities.length === 0 ? (
            <div className="px-4 py-6 text-sm text-[var(--cds-text-02)]">{isFrench ? 'Aucune activite pour le moment.' : 'No activity yet.'}</div>
          ) : (
            <div className="divide-y divide-[var(--cds-border-subtle-01)]">
              {recentActivities.map(activity => (
                <button
                  key={activity.id}
                  onClick={() => handleActivityClick(activity.result)}
                  className="w-full text-left px-4 py-3 hover:bg-[var(--cds-layer-hover-01)] transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`mt-0.5 ${activity.type === 'closed' ? 'text-[var(--cds-support-success)]' : 'text-[var(--cds-interactive-01)]'}`}>
                        {activity.type === 'closed' ? <CheckCircle size={16} /> : <FileText size={16} />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[var(--cds-text-01)] truncate">{activity.title}</p>
                        <p className="text-xs text-[var(--cds-text-02)] truncate">{activity.result.title} - {activity.description}</p>
                      </div>
                    </div>
                    <span className="text-xs text-[var(--cds-text-02)] shrink-0">{activity.date}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
