import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnalysisResult } from '../types';
import { Search, FolderOpen, CheckCircle2, Clock3 } from 'lucide-react';
import { TRANSLATIONS } from '../utils/translations';

interface HistoryProps {
  history: AnalysisResult[];
  onViewResult: (result: AnalysisResult) => void;
  focusAnalysisId?: string | null;
  onFocusHandled?: () => void;
  language?: 'fr' | 'en';
}

const History: React.FC<HistoryProps> = ({
  history,
  onViewResult,
  focusAnalysisId = null,
  onFocusHandled,
  language = 'fr'
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const t = TRANSLATIONS[language]?.history || TRANSLATIONS.fr.history;
  const isFrench = language === 'fr';
  const focusRowRef = useRef<HTMLTableRowElement | null>(null);

  const filteredHistory = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return history;
    return history.filter((item) => (
      item.title.toLowerCase().includes(query) ||
      item.date.toLowerCase().includes(query) ||
      item.bestOption.toLowerCase().includes(query) ||
      item.offers.some((offer) => offer.supplierName.toLowerCase().includes(query))
    ));
  }, [history, searchQuery]);

  useEffect(() => {
    if (!focusAnalysisId || !focusRowRef.current) return;
    focusRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    onFocusHandled?.();
  }, [focusAnalysisId, onFocusHandled]);

  return (
    <div className="h-full max-w-[1600px] mx-auto flex flex-col font-sans text-[var(--cds-text-01)]">
      <header className="page-header pb-6 border-b border-[var(--cds-border-subtle-01)]">
        <div className="page-header-main">
          <p className="page-eyebrow">{isFrench ? 'Historique' : 'History'}</p>
          <h1 className="page-title">{t.title}</h1>
          <p className="page-subtitle">{t.subtitle}</p>
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto cds-scroll pr-2 pt-6">
        <div className="bg-[var(--cds-layer-01)] border border-[var(--cds-border-subtle-01)] flex flex-col min-h-[520px]">
          <div className="p-4 border-b border-[var(--cds-border-subtle-01)]">
            <div className="relative max-w-xl">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full h-10 bg-[var(--cds-field-01)] border-b border-[var(--cds-border-strong-01)] pl-4 pr-10 text-sm text-[var(--cds-text-01)] focus:outline-none focus:ring-2 focus:ring-[var(--cds-focus)]"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--cds-text-02)]" size={16} />
            </div>
          </div>

          {filteredHistory.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-[var(--cds-text-02)]">
              <FolderOpen size={42} className="opacity-40 mb-3" />
              <p className="text-sm">{t.empty}</p>
            </div>
          ) : (
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[860px]">
                <thead className="bg-[var(--cds-layer-02)]">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">{t.columns.project}</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">{t.columns.date}</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">{t.columns.suppliers}</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">{t.columns.status}</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-right">{t.columns.action}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--cds-border-subtle-01)]">
                  {filteredHistory.map((item) => {
                    const isClosed = item.status === 'completed';
                    const isFocused = focusAnalysisId === item.id;
                    return (
                      <tr
                        key={item.id}
                        ref={isFocused ? focusRowRef : null}
                        className={`transition-colors ${
                          isFocused
                            ? 'bg-[var(--cds-background-info-subtle)]'
                            : 'bg-[var(--cds-layer-01)] hover:bg-[var(--cds-layer-hover-01)]'
                        }`}
                      >
                        <td className="px-4 py-3 text-sm font-medium">{item.title}</td>
                        <td className="px-4 py-3 text-sm text-[var(--cds-text-02)]">{item.date}</td>
                        <td className="px-4 py-3 text-sm text-[var(--cds-text-02)]">{item.offers.length}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${
                            isClosed
                              ? 'bg-[var(--cds-background-success-subtle)] text-[var(--cds-support-success)]'
                              : 'bg-[var(--cds-layer-03)] text-[var(--cds-text-02)]'
                          }`}>
                            {isClosed ? <CheckCircle2 size={12} /> : <Clock3 size={12} />}
                            {isClosed ? t.statusClosed : t.statusOpen}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => onViewResult(item)}
                            className="text-sm font-medium text-[var(--cds-link-primary)] hover:underline"
                          >
                            {t.columns.open}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default History;
