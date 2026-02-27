import React, { useState } from 'react';
import { LayoutDashboard, History as HistoryIcon, FileText, Settings, LogOut, Users, Menu, X } from 'lucide-react';
import { AppState } from '../types';
import { TRANSLATIONS } from '../utils/translations';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onNavigate: (tab: any) => void;
  onLogout?: () => void;
  language?: 'fr' | 'en';
  organizationName?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onNavigate, onLogout, language = 'fr', organizationName = 'Mon Entreprise' }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const t = TRANSLATIONS[language]?.layout || TRANSLATIONS.fr.layout;
  const commonT = TRANSLATIONS[language]?.common || TRANSLATIONS.fr.common;
  const companyLabel = organizationName.trim() || (language === 'fr' ? 'Mon Entreprise' : 'My Company');

  const handleNavigate = (id: string) => {
    onNavigate(id);
    setIsMobileMenuOpen(false); // Close menu on navigation
  };

  const navItems = [
    { id: 'DASHBOARD', icon: LayoutDashboard, label: t.dashboard },
    { id: 'HISTORY', icon: HistoryIcon, label: t.history },
    { id: 'CREATE_ANALYSIS', icon: FileText, label: t.newAnalysis },
    { id: 'SUPPLIERS', icon: Users, label: t.suppliers },
    { id: 'SETTINGS', icon: Settings, label: t.settings },
  ];

  return (
    <div className="flex h-screen bg-[var(--cds-ui-background)] font-sans overflow-hidden">
      
      {/* MOBILE HEADER (Visible only on small screens) */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-12 bg-[var(--cds-text-01)] z-50 px-4 flex items-center justify-between text-[var(--cds-inverse-01)]">
         <div className="flex items-center gap-3">
             <span className="font-semibold text-base tracking-tight">{commonT.appName}</span>
             <span className="text-[10px] text-[var(--cds-text-04)] truncate max-w-[120px]">{companyLabel}</span>
         </div>
         <button 
           onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
           className="p-2 text-[var(--cds-inverse-01)] hover:bg-[var(--cds-interactive-02)]"
         >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
         </button>
      </div>

      {/* OVERLAY FOR MOBILE */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-[var(--cds-overlay)] z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar (Carbon UI Shell - SideNav) */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-[var(--cds-text-01)] flex flex-col border-r border-[var(--cds-interactive-02)]
        transform transition-transform duration-200 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Sidebar Header */}
        <div className="h-12 flex items-center px-4 bg-[var(--cds-text-01)] border-b border-[var(--cds-interactive-02)] mt-12 lg:mt-0">
          <div className="flex flex-col min-w-0">
             <span className="text-base font-semibold text-[var(--cds-inverse-01)] tracking-tight leading-tight">{commonT.appName}</span>
             <span className="text-[10px] text-[var(--cds-text-04)] truncate">{companyLabel}</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto cds-scroll mt-4">
          <ul className="space-y-0">
            {navItems.map((item, idx) => (
              <React.Fragment key={item.id}>
                {idx === 4 && <li className="my-4 mx-4 h-px bg-[var(--cds-interactive-02)]" />}
                <li>
                  <button
                    onClick={() => handleNavigate(item.id)}
                    className={`w-full flex items-center gap-3 px-4 h-12 text-sm transition-colors relative group ${
                      activeTab === item.id 
                        ? 'bg-[var(--cds-interactive-02)] text-[var(--cds-inverse-01)]' 
                        : 'text-[var(--cds-text-04)] hover:bg-[var(--cds-interactive-02)] hover:text-[var(--cds-inverse-01)]'
                    }`}
                  >
                    {activeTab === item.id && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--cds-interactive-01)]"></div>
                    )}
                    <span className="w-5 h-5 flex items-center justify-center shrink-0">
                      <item.icon size={20} />
                    </span>
                    <span className="font-medium whitespace-nowrap">{item.label}</span>
                  </button>
                </li>
              </React.Fragment>
            ))}
          </ul>
        </nav>

        <div className="p-0">
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 h-12 text-[var(--cds-text-04)] hover:bg-[var(--cds-support-error)] hover:text-[var(--cds-inverse-01)] transition-colors text-sm font-medium"
          >
            <LogOut size={20} />
            <span>{t.logout}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 bg-[var(--cds-ui-background)] overflow-hidden relative mt-12 lg:mt-0">
        <div className="h-full overflow-hidden overflow-x-hidden p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
