import React, { useState, useEffect } from 'react';
import { ArrowRight, CheckSquare, ArrowLeft, Send, Eye, EyeOff } from 'lucide-react';
import { TRANSLATIONS } from '../utils/translations';

interface LoginProps {
  onLogin: () => void;
  language?: 'fr' | 'en';
  organizationName?: string;
}

const Login: React.FC<LoginProps> = ({ onLogin, language = 'fr', organizationName = 'Mon Entreprise' }) => {
  const [view, setView] = useState<'login' | 'forgot' | 'reset-success'>('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [resetEmail, setResetEmail] = useState('');

  const t = TRANSLATIONS[language]?.login || TRANSLATIONS.fr.login;
  const commonT = TRANSLATIONS[language]?.common || TRANSLATIONS.fr.common;
  const companyName = organizationName.trim() || (language === 'fr' ? 'Mon Entreprise' : 'My Company');

  useEffect(() => {
    const savedEmail = localStorage.getItem('smartprocure_saved_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    } else {
      setEmail('demo@smartprocure.ai');
      setPassword('password');
    }
  }, []);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (rememberMe) {
      localStorage.setItem('smartprocure_saved_email', email);
    } else {
      localStorage.removeItem('smartprocure_saved_email');
    }

    setTimeout(() => {
      setIsLoading(false);
      onLogin();
    }, 1200);
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setView('reset-success');
    }, 1000);
  };

  return (
    <div className="min-h-screen w-full flex bg-[var(--cds-ui-background)] text-[var(--cds-text-01)] font-sans overflow-hidden">
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-16 bg-[var(--cds-layer-02)] border-r border-[var(--cds-border-subtle-01)] relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute -top-24 -left-24 w-[420px] h-[420px] animate-float"
            style={{
              background: 'radial-gradient(circle, rgba(15,98,254,0.26) 0%, rgba(15,98,254,0) 72%)'
            }}
          />
          <div
            className="absolute top-[22%] -right-24 w-[360px] h-[360px] animate-float"
            style={{
              animationDelay: '1.1s',
              background: 'radial-gradient(circle, rgba(36,161,72,0.2) 0%, rgba(36,161,72,0) 72%)'
            }}
          />
          <div
            className="absolute -bottom-32 left-[20%] w-[520px] h-[520px]"
            style={{
              background: 'radial-gradient(circle, rgba(241,194,27,0.18) 0%, rgba(241,194,27,0) 74%)'
            }}
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(130deg, rgba(255,255,255,0.68) 0%, rgba(244,244,244,0.84) 48%, rgba(229,246,255,0.7) 100%)' }} />
        </div>

        <div className="relative z-10">
          <p className="text-xs uppercase tracking-widest text-[var(--cds-text-02)] mb-2">Nom de l'entreprise</p>
          <p className="text-2xl font-semibold text-[var(--cds-text-01)] mb-10">{companyName}</p>

          <h1 className="text-5xl font-light leading-tight mb-6 text-[var(--cds-text-01)]">{commonT.appName}</h1>
          <p className="text-xl leading-relaxed text-[var(--cds-text-02)] max-w-lg">
            Plateforme d'analyse fournisseurs alignee IBM Carbon. Comparez les offres, reduisez le risque et accelerez la decision.
          </p>
        </div>

        <div className="space-y-3 max-w-xl relative z-10">
          <div className="flex items-center gap-3 text-sm text-[var(--cds-text-01)]">
            <span className="w-2 h-2 bg-[var(--cds-interactive-01)]" />
            Analyse financiere HT/TTC normalisee
          </div>
          <div className="flex items-center gap-3 text-sm text-[var(--cds-text-01)]">
            <span className="w-2 h-2 bg-[var(--cds-interactive-01)]" />
            Evaluation technique et conformite des offres
          </div>
          <div className="flex items-center gap-3 text-sm text-[var(--cds-text-01)]">
            <span className="w-2 h-2 bg-[var(--cds-interactive-01)]" />
            Decision tracable avec historique des analyses
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-[var(--cds-ui-background)]">
        <div className="w-full max-w-[460px] bg-[var(--cds-layer-01)] p-8 border border-[var(--cds-border-subtle-01)] shadow-sm">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-[var(--cds-text-02)]">Entreprise</p>
              <p className="text-sm font-semibold text-[var(--cds-text-01)]">{companyName}</p>
            </div>
            <span className="cds-tag cds-tag--gray">{commonT.appName}</span>
          </div>

          {view === 'login' && (
            <div className="w-full animate-fade-in">
              <div className="mb-10">
                <h2 className="text-3xl font-light text-[var(--cds-text-01)] mb-2">{t.welcome}</h2>
                <p className="text-[var(--cds-text-02)] text-sm">{t.subtitle}</p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-6">
                <div className="flex flex-col">
                  <label className="text-xs text-[var(--cds-text-02)] mb-2 font-medium">{t.emailLabel}</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="cds-text-input"
                    placeholder="Email"
                    required
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-xs text-[var(--cds-text-02)] mb-2 font-medium">{t.passwordLabel}</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="cds-text-input pr-10"
                      placeholder="Mot de passe"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="cds-icon-btn absolute right-0 top-0"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <div className="flex justify-end mt-2">
                    <button type="button" onClick={() => setView('forgot')} className="text-xs text-[var(--cds-link-primary)] hover:underline">
                      {t.forgotPassword}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setRememberMe(!rememberMe)}>
                  <div className={`w-4 h-4 border flex items-center justify-center transition-colors ${rememberMe ? 'bg-[var(--cds-interactive-01)] border-[var(--cds-interactive-01)]' : 'border-[var(--cds-text-01)] bg-transparent'}`}>
                    {rememberMe && <CheckSquare size={12} className="text-white" />}
                  </div>
                  <span className="text-sm text-[var(--cds-text-01)] select-none">{t.rememberMe}</span>
                </div>

                <button type="submit" disabled={isLoading} className="cds-btn cds-btn--primary w-full">
                  <span>{isLoading ? t.loading : t.loginBtn}</span>
                  {!isLoading && <ArrowRight size={16} />}
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-[var(--cds-border-subtle-01)]">
                <div className="flex items-center gap-2 text-xs text-[var(--cds-text-02)]">
                  <span className="w-2 h-2 bg-[var(--cds-interactive-01)]" />
                  {t.demoHint}
                </div>
              </div>
            </div>
          )}

          {view === 'forgot' && (
            <div className="w-full animate-fade-in">
              <button onClick={() => setView('login')} className="flex items-center gap-2 text-[var(--cds-link-primary)] text-sm mb-8 hover:underline">
                <ArrowLeft size={16} /> {t.backToLogin}
              </button>

              <div className="mb-8">
                <h2 className="text-2xl font-light text-[var(--cds-text-01)] mb-2">{t.resetTitle}</h2>
                <p className="text-[var(--cds-text-02)] text-sm">{t.resetSubtitle}</p>
              </div>

              <form onSubmit={handleForgotSubmit} className="space-y-6">
                <div className="flex flex-col">
                  <label className="text-xs text-[var(--cds-text-02)] mb-2 font-medium">{t.emailLabel}</label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="cds-text-input"
                    placeholder="Email"
                    required
                  />
                </div>

                <button type="submit" disabled={isLoading} className="cds-btn cds-btn--primary w-full">
                  <span>{t.sendLinkBtn}</span>
                  <Send size={16} />
                </button>
              </form>
            </div>
          )}

          {view === 'reset-success' && (
            <div className="w-full animate-fade-in flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-[var(--cds-layer-03)] flex items-center justify-center mb-6 text-[var(--cds-link-primary)]">
                <Send size={24} />
              </div>

              <h2 className="text-2xl font-light text-[var(--cds-text-01)] mb-3">{t.linkSentTitle}</h2>
              <p className="text-[var(--cds-text-02)] text-sm mb-8 max-w-xs">{t.linkSentBody}</p>

              <button onClick={() => setView('login')} className="cds-btn cds-btn--secondary w-full justify-center">
                {t.backToLogin}
              </button>
            </div>
          )}

          <div className="mt-8 pt-5 border-t border-[var(--cds-border-subtle-01)]">
            <p className="text-xs uppercase tracking-wider text-[var(--cds-text-02)] mb-1">Developpe par</p>
            <p className="text-lg font-semibold text-[var(--cds-text-01)]">Kafui Charbel EKLU</p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <a
                href="https://github.com/kafuicharbeleklu"
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1 border border-[var(--cds-border-subtle-01)] text-[var(--cds-link-primary)] hover:bg-[var(--cds-layer-02)]"
              >
                GitHub
              </a>
              <a
                href="https://www.linkedin.com/in/kafui-charbel-eklu"
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1 border border-[var(--cds-border-subtle-01)] text-[var(--cds-link-primary)] hover:bg-[var(--cds-layer-02)]"
              >
                LinkedIn
              </a>
              <a
                href="mailto:charbelkafuieklu@gmail.com"
                className="px-2.5 py-1 border border-[var(--cds-border-subtle-01)] text-[var(--cds-link-primary)] hover:bg-[var(--cds-layer-02)]"
              >
                Gmail
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
