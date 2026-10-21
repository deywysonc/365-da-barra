import React from 'react';
import { Menu, Wallet } from 'lucide-react';
import { ClientAccount } from '../types/sportsbook';
import { formatCurrencyBR } from '../utils/bettingRules';

interface HeaderProps {
  activeView: 'matches' | 'match-center' | 'news' | 'rules';
  currentFilter: string;
  activeClient: ClientAccount;
  isLightMode: boolean;
  onNavigate: (view: 'matches' | 'match-center' | 'news' | 'rules', filter?: string) => void;
  onOpenAccountModal: (tab: 'profile' | 'register' | 'switch') => void;
  onToggleMobileSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  currentFilter,
  activeClient,
  isLightMode,
  onNavigate,
  onOpenAccountModal,
  onToggleMobileSidebar,
}) => {
  const navLinks = [
    {
      id: 'matches-all',
      label: 'Jogos do Dia',
      active: activeView === 'matches' && currentFilter !== 'live',
      onClick: () => onNavigate('matches', 'all'),
    },
    {
      id: 'matches-live',
      label: 'Ao Vivo',
      active: (activeView === 'matches' && currentFilter === 'live') || activeView === 'match-center',
      onClick: () => onNavigate('matches', 'live'),
    },
    {
      id: 'news',
      label: 'Notícias & Vídeos',
      active: activeView === 'news',
      onClick: () => onNavigate('news'),
    },
    {
      id: 'rules',
      label: 'Conferir PIN & Regras',
      active: activeView === 'rules',
      onClick: () => onNavigate('rules'),
    },
  ];

  return (
    <header
      className={`sticky top-0 z-30 flex items-center justify-between gap-2 sm:gap-6 px-3 sm:px-6 h-14 border-b transition-colors ${
        isLightMode
          ? 'bg-white/95 border-slate-200 text-slate-900 backdrop-blur-md'
          : 'bg-[#121626]/95 border-slate-800/80 text-white backdrop-blur-md'
      }`}
    >
      {/* Zone 1: Brand Title */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          aria-label="Abrir menu de campeonatos"
          className={`lg:hidden min-w-[40px] min-h-[40px] -ml-1 flex items-center justify-center rounded-lg transition-colors ${
            isLightMode ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-slate-800 text-slate-200'
          }`}
        >
          <Menu className="w-5 h-5" />
        </button>

        <a
          href="#jogos"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('matches', 'all');
          }}
          className="font-display text-base sm:text-lg font-extrabold tracking-tight whitespace-nowrap shrink-0 flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-md"
        >
          <img
            src="/logo-365dabarra.png"
            alt="365 DA BARRA"
            className="w-8 h-8 rounded-md object-contain bg-white p-0.5 shadow-xs"
          />
          <span>365 DA BARRA</span>
        </a>
      </div>

      {/* Zone 2: Clean Single-Line Navigation Links */}
      <nav aria-label="Navegação Principal" className="hidden md:flex items-center gap-7 text-sm font-medium">
        {navLinks.map((link) => (
          <a
            key={link.id}
            href={`#${link.id}`}
            onClick={(e) => {
              e.preventDefault();
              link.onClick();
            }}
            className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors ${
              link.active
                ? isLightMode
                  ? 'border-indigo-700 text-indigo-950 font-semibold'
                  : 'border-amber-400 text-amber-400 font-semibold'
                : isLightMode
                ? 'border-transparent text-slate-600 hover:text-slate-950 hover:border-slate-300'
                : 'border-transparent text-slate-300 hover:text-white hover:border-slate-600'
            }`}
          >
            {link.label}
          </a>
        ))}
      </nav>

      {/* Zone 3: Single Primary Action */}
      <div className="flex items-center shrink-0">
        <button
          type="button"
          onClick={() => onOpenAccountModal('profile')}
          className="px-3 sm:px-4 py-2 min-h-[38px] sm:min-h-[40px] text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 sm:gap-2 shadow-xs cursor-pointer"
        >
          <Wallet className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">{activeClient.name.split(' ')[0]}</span>
          <span className="hidden sm:inline" aria-hidden="true">·</span>
          <span className="font-mono font-extrabold tabular-nums">
            R$ {formatCurrencyBR(activeClient.balance)}
          </span>
        </button>
      </div>
    </header>
  );
};
