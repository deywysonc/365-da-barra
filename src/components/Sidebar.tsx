import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Flame,
  Globe,
  Home,
  MessageCircle,
  Moon,
  Newspaper,
  PlusCircle,
  ShieldCheck,
  Sun,
  Ticket,
  Trophy,
  UserPlus,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { LEAGUE_CATALOG, CAMBISTA_WHATSAPP, CAMBISTA_PHONE_DISPLAY } from '../data/initialData';
import { Match } from '../types/sportsbook';

interface SidebarProps {
  matches: Match[];
  activeView: 'matches' | 'match-center' | 'news' | 'rules';
  currentFilter: string;
  adminAlertCount: number;
  isLightMode: boolean;
  isSoundMuted?: boolean;
  isOpenMobile: boolean;
  onSelectFilter: (filter: string) => void;
  onSwitchView: (view: 'matches' | 'match-center' | 'news' | 'rules') => void;
  onOpenRequestBalance: () => void;
  onOpenAccountModal: (tab: 'profile' | 'register' | 'switch') => void;
  onOpenAdminModal: () => void;
  onToggleTheme: () => void;
  onToggleSoundMute?: () => void;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  matches,
  activeView,
  currentFilter,
  adminAlertCount,
  isLightMode,
  isSoundMuted = false,
  isOpenMobile,
  onSelectFilter,
  onSwitchView,
  onOpenRequestBalance,
  onOpenAccountModal,
  onOpenAdminModal,
  onToggleTheme,
  onToggleSoundMute,
  onCloseMobile,
}) => {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    'Futebol Brasileiro': true,
    'Copas Continentais': true,
    'Ligas Internacionais': true,
  });

  const toggleGroup = (group: string) => {
    setOpenGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  const liveCount = matches.filter((m) => m.isLive).length;

  const getLeagueCount = (slug: string) => {
    if (slug === 'all') return matches.length;
    if (slug === 'live') return liveCount;
    return matches.filter((m) => m.category === slug).length;
  };

  const regions = ['Futebol Brasileiro', 'Copas Continentais', 'Ligas Internacionais'];

  const sidebarContent = (
    <div
      className={`flex flex-col h-full select-none ${
        isLightMode
          ? 'bg-slate-50 border-r border-slate-200 text-slate-800'
          : 'bg-[#0F1322] border-r border-slate-800/80 text-slate-200'
      }`}
    >
      {/* Mobile Header */}
      <div className="flex lg:hidden items-center justify-between px-4 py-3 border-b border-slate-800/40">
        <span className="font-display font-bold text-sm">Menu • 365 DA BARRA</span>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Fechar menu lateral"
          className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg hover:bg-slate-800/30"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 space-y-5 overflow-y-auto flex-1">
        {/* Refined Official Crest Card (replaces ugly oversized white box) */}
        <div
          onClick={() => {
            onSelectFilter('all');
            onCloseMobile();
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              onSelectFilter('all');
              onCloseMobile();
            }
          }}
          className={`cursor-pointer rounded-xl p-3.5 border transition-colors flex items-center gap-3.5 ${
            isLightMode
              ? 'bg-white border-slate-200 hover:border-indigo-300 shadow-2xs'
              : 'bg-[#171C30] border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="w-14 h-14 rounded-xl bg-white p-1.5 shrink-0 flex items-center justify-center shadow-xs ring-1 ring-slate-200/60">
            <img
              src="/logo-365dabarra.png"
              alt="Escudo Oficial 365 DA BARRA"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="min-w-0">
            <div className="font-display font-bold text-sm tracking-tight truncate">
              365 DA BARRA
            </div>
            <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
              <span className="text-amber-400 font-semibold tabular-nums">
                {liveCount} Ao Vivo
              </span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">{matches.length} Jogos</span>
            </div>
            <div className="text-[11px] text-emerald-400 font-medium mt-1">
              Teto Máx: R$ 30.000,00
            </div>
          </div>
        </div>

        {/* Quick Account & Wallet Actions */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              onOpenRequestBalance();
              onCloseMobile();
            }}
            className="px-3 py-2.5 min-h-[40px] rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Pedir Saldo</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onOpenAccountModal('register');
              onCloseMobile();
            }}
            className={`px-3 py-2.5 min-h-[40px] rounded-lg text-xs font-semibold border transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
              isLightMode
                ? 'bg-white border-slate-200 text-slate-800 hover:bg-slate-100'
                : 'bg-[#171C30] border-slate-700/80 text-slate-200 hover:bg-slate-800'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 shrink-0 text-amber-400" />
            <span>Criar Conta</span>
          </button>
        </div>

        {/* Primary Feed Filters */}
        <div className="space-y-1">
          <div className="px-2 pb-1 text-[11px] font-semibold text-slate-400">
            Navegação Rápida
          </div>

          <button
            type="button"
            onClick={() => {
              onSelectFilter('all');
              onCloseMobile();
            }}
            className={`w-full flex items-center justify-between px-3 py-2.5 min-h-[40px] rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeView === 'matches' && currentFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : isLightMode
                ? 'text-slate-700 hover:bg-slate-200/70'
                : 'text-slate-300 hover:bg-slate-800/70'
            }`}
          >
            <span className="flex items-center gap-2.5 truncate">
              <Home className="w-4 h-4 shrink-0" />
              <span>Todos os Jogos do Dia</span>
            </span>
            <span className="font-mono text-xs tabular-nums opacity-80">
              {matches.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              onSelectFilter('live');
              onCloseMobile();
            }}
            className={`w-full flex items-center justify-between px-3 py-2.5 min-h-[40px] rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeView === 'matches' && currentFilter === 'live'
                ? 'bg-rose-600 text-white shadow-xs'
                : isLightMode
                ? 'text-slate-700 hover:bg-slate-200/70'
                : 'text-slate-300 hover:bg-slate-800/70'
            }`}
          >
            <span className="flex items-center gap-2.5 truncate">
              <Flame className="w-4 h-4 shrink-0 text-rose-500" />
              <span>Partidas Ao Vivo</span>
            </span>
            <span className="font-mono text-xs font-bold text-rose-400 tabular-nums">
              {liveCount}
            </span>
          </button>
        </div>

        {/* Categorized Championships */}
        <div className="space-y-3">
          <div className="px-2 text-[11px] font-semibold text-slate-400">
            Campeonatos Oficiais
          </div>

          {regions.map((region) => {
            const regionLeagues = LEAGUE_CATALOG.filter((l) => l.region === region);
            const isOpen = !!openGroups[region];

            return (
              <div
                key={region}
                className={`rounded-xl border overflow-hidden ${
                  isLightMode
                    ? 'bg-white border-slate-200/90'
                    : 'bg-[#14192B] border-slate-800/80'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleGroup(region)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between px-3 py-2.5 min-h-[40px] text-xs font-semibold text-left hover:opacity-90 transition-opacity cursor-pointer"
                >
                  <span className="flex items-center gap-2 truncate">
                    {region === 'Copas Continentais' ? (
                      <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    ) : (
                      <Globe className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    )}
                    <span className="truncate">{region}</span>
                  </span>
                  {isOpen ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <div
                    className={`border-t divide-y ${
                      isLightMode
                        ? 'border-slate-100 divide-slate-100'
                        : 'border-slate-800/60 divide-slate-800/40'
                    }`}
                  >
                    {regionLeagues.map((league) => {
                      const count = getLeagueCount(league.id);
                      const isSelected = activeView === 'matches' && currentFilter === league.id;

                      return (
                        <button
                          key={league.id}
                          type="button"
                          onClick={() => {
                            onSelectFilter(league.id);
                            onCloseMobile();
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 min-h-[38px] text-xs transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600/20 text-amber-400 font-semibold'
                              : isLightMode
                              ? 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                              : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                          }`}
                        >
                          <span className="truncate">{league.name}</span>
                          <span className="font-mono text-[11px] text-slate-400 tabular-nums ml-2">
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Portal Links & Utilities */}
        <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
          <button
            type="button"
            onClick={() => {
              onSwitchView('news');
              onCloseMobile();
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 min-h-[40px] rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeView === 'news'
                ? 'bg-indigo-600 text-white font-semibold'
                : isLightMode
                ? 'text-slate-700 hover:bg-slate-200/70'
                : 'text-slate-300 hover:bg-slate-800/70'
            }`}
          >
            <Newspaper className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>Central de Notícias & Vídeos</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onSwitchView('rules');
              onCloseMobile();
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 min-h-[40px] rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeView === 'rules'
                ? 'bg-indigo-600 text-white font-semibold'
                : isLightMode
                ? 'text-slate-700 hover:bg-slate-200/70'
                : 'text-slate-300 hover:bg-slate-800/70'
            }`}
          >
            <Ticket className="w-4 h-4 shrink-0 text-amber-400" />
            <span>Conferir Bilhete (PIN)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onOpenAdminModal();
              onCloseMobile();
            }}
            className={`w-full flex items-center justify-between px-3 py-2.5 min-h-[40px] rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
              isLightMode
                ? 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
            }`}
          >
            <span className="flex items-center gap-2 truncate">
              <ShieldCheck className="w-4 h-4 shrink-0 text-amber-400" />
              <span>Painel Cambista / Admin</span>
            </span>
            <span className="font-mono text-xs font-bold tabular-nums">
              {adminAlertCount}
            </span>
          </button>

          {onToggleSoundMute && (
            <button
              type="button"
              onClick={onToggleSoundMute}
              className={`w-full flex items-center justify-between px-3 py-2.5 min-h-[40px] rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                isLightMode
                  ? 'text-slate-700 hover:bg-slate-200/70'
                  : 'text-slate-300 hover:bg-slate-800/70'
              }`}
            >
              <span className="flex items-center gap-2.5">
                {isSoundMuted ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                )}
                <span>{isSoundMuted ? 'Alertas Sonoros: Mudo' : 'Alertas Sonoros: Ativos'}</span>
              </span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  isSoundMuted
                    ? 'bg-rose-500/20 text-rose-400'
                    : 'bg-emerald-500/20 text-emerald-400'
                }`}
              >
                {isSoundMuted ? 'OFF' : 'ON'}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={onToggleTheme}
            className={`w-full flex items-center justify-between px-3 py-2.5 min-h-[40px] rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              isLightMode
                ? 'text-slate-700 hover:bg-slate-200/70'
                : 'text-slate-300 hover:bg-slate-800/70'
            }`}
          >
            <span className="flex items-center gap-2.5">
              {isLightMode ? (
                <Moon className="w-4 h-4 text-indigo-600" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" />
              )}
              <span>{isLightMode ? 'Ativar Modo Escuro' : 'Ativar Modo Claro'}</span>
            </span>
          </button>

          <a
            href={`https://api.whatsapp.com/send?phone=${CAMBISTA_WHATSAPP}&text=Ol%C3%A1%2C%20vim%20pelo%20site%20365%20DA%20BARRA!`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 min-h-[40px] rounded-lg text-xs font-semibold bg-[#25D366]/15 text-[#25D366] border border-[#25D366]/30 hover:bg-[#25D366]/25 transition-colors mt-2"
          >
            <MessageCircle className="w-4 h-4 shrink-0" />
            <span>Cambista {CAMBISTA_PHONE_DISPLAY}</span>
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden lg:block w-[260px] shrink-0 h-[calc(100vh-3.5rem)] sticky top-14">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <aside className="relative z-10 w-[280px] max-w-[85vw] h-full shadow-2xl">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};
