import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Compass,
  Newspaper,
  Play,
  Search,
  Sparkles,
  Ticket,
  Tv,
  X,
} from 'lucide-react';
import { BetSelection, Match, NewsArticle } from '../types/sportsbook';
import { LEAGUE_CATALOG } from '../data/initialData';
import { formatOddBR } from '../utils/bettingRules';
import { TeamCrest } from './TeamCrest';

interface MatchesViewProps {
  matches: Match[];
  betslip: BetSelection[];
  currentFilter: string;
  statusFilter: 'all' | 'in' | 'pre' | 'post';
  searchQuery: string;
  topNews?: NewsArticle;
  isLightMode: boolean;
  onSelectFilter: (filter: string) => void;
  onSelectStatusFilter: (status: 'all' | 'in' | 'pre' | 'post') => void;
  onSearchChange: (q: string) => void;
  onToggleBet: (matchId: number, selection: string, oddValue: number, marketName?: string) => void;
  onOpenMatchCenter: (matchId: number, autoStream?: boolean) => void;
  onSwitchView: (view: 'matches' | 'match-center' | 'news' | 'rules') => void;
}

export const MatchesView: React.FC<MatchesViewProps> = ({
  matches,
  betslip,
  currentFilter,
  statusFilter,
  searchQuery,
  topNews,
  isLightMode,
  onSelectFilter,
  onSelectStatusFilter,
  onSearchChange,
  onToggleBet,
  onOpenMatchCenter,
  onSwitchView,
}) => {
  const [collapsedLeagues, setCollapsedLeagues] = useState<Record<string, boolean>>({});
  const [showHowItWorks, setShowHowItWorks] = useState<boolean>(true);

  const toggleLeagueCollapse = (slug: string) => {
    setCollapsedLeagues((prev) => ({ ...prev, [slug]: !prev[slug] }));
  };

  const isSelected = (matchId: number, selectionLabel: string) =>
    betslip.some((b) => b.matchId === matchId && b.selection === selectionLabel);

  // Featured live or main match for the Spotlight Hero
  const featuredMatch =
    matches.find((m) => m.isLive && m.category === 'bra.1') ||
    matches.find((m) => m.isLive) ||
    matches[0];

  // Filter matches
  const filteredMatches = matches.filter((m) => {
    const matchLeague =
      currentFilter === 'all'
        ? true
        : currentFilter === 'live'
        ? m.isLive
        : m.category === currentFilter;

    const matchStatus = statusFilter === 'all' ? true : m.statusState === statusFilter;

    const q = searchQuery.trim().toLowerCase();
    const matchQuery =
      !q ||
      m.teamA.toLowerCase().includes(q) ||
      m.teamB.toLowerCase().includes(q) ||
      m.league.toLowerCase().includes(q) ||
      (m.stadium && m.stadium.toLowerCase().includes(q));

    return matchLeague && matchStatus && matchQuery;
  });

  // Group filtered matches by league
  const groupedLeagues: Array<{
    slug: string;
    leagueTitle: string;
    matches: Match[];
  }> = [];

  filteredMatches.forEach((m) => {
    const existing = groupedLeagues.find((g) => g.slug === m.category);
    if (existing) {
      existing.matches.push(m);
    } else {
      groupedLeagues.push({
        slug: m.category,
        leagueTitle: m.league,
        matches: [m],
      });
    }
  });

  const quickLeagues = LEAGUE_CATALOG.slice(0, 9);

  return (
    <div className="space-y-5">
      {/* Spotlight Hero Split (1 Dominant Visual Anchor + Contextual Portal Sidekick) */}
      {featuredMatch && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-stretch">
          {/* Primary Spotlight Match Card */}
          <div
            className={`xl:col-span-8 rounded-2xl p-5 border relative overflow-hidden flex flex-col justify-between ${
              isLightMode
                ? 'bg-gradient-to-br from-indigo-950 via-[#1E1545] to-slate-900 text-white border-indigo-900 shadow-sm'
                : 'bg-gradient-to-br from-[#23194F] via-[#161B30] to-[#0E1322] text-white border-indigo-500/30'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 text-xs text-amber-300 font-medium mb-3">
                <span>
                  {featuredMatch.isLive
                    ? `AO VIVO AGORA · ${featuredMatch.displayClock} (${featuredMatch.statusDescription})`
                    : `DESTAQUE DO DIA · ${featuredMatch.timeLabel}`}
                </span>
                <span className="text-slate-300 hidden sm:inline">
                  {featuredMatch.league} · +{featuredMatch.totalMarketsCount} mercados
                </span>
              </div>

              {/* Match Teams & Score */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
                <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                  <div className="flex items-center gap-2.5">
                    <TeamCrest
                      logoUrl={featuredMatch.logoA}
                      teamName={featuredMatch.teamA}
                      shortName={featuredMatch.shortA}
                      primaryColor={featuredMatch.colorA}
                      size="lg"
                    />
                    <div>
                      <div className="font-display font-bold text-lg sm:text-xl leading-tight">
                        {featuredMatch.teamA}
                      </div>
                      <div className="text-xs text-slate-300">
                        Mandante · {featuredMatch.formationA}
                      </div>
                    </div>
                  </div>

                  <div className="px-3.5 py-1.5 rounded-xl bg-black/35 border border-white/10 font-mono text-xl sm:text-2xl font-extrabold text-amber-400 tabular-nums">
                    {featuredMatch.isLive || featuredMatch.statusState === 'post'
                      ? `${featuredMatch.scoreA} - ${featuredMatch.scoreB}`
                      : 'vs'}
                  </div>

                  <div className="flex items-center gap-2.5">
                    <TeamCrest
                      logoUrl={featuredMatch.logoB}
                      teamName={featuredMatch.teamB}
                      shortName={featuredMatch.shortB}
                      primaryColor={featuredMatch.colorB}
                      size="lg"
                    />
                    <div>
                      <div className="font-display font-bold text-lg sm:text-xl leading-tight">
                        {featuredMatch.teamB}
                      </div>
                      <div className="text-xs text-slate-300">
                        Visitante · {featuredMatch.formationB}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Unboxed Match Events & Stadium Metadata */}
              <div className="mt-2 text-xs text-slate-300 flex items-center flex-wrap gap-x-2 gap-y-1">
                <span>{featuredMatch.stadium}</span>
                {featuredMatch.realEventsSummary.length > 0 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-amber-300 font-medium">
                      {featuredMatch.realEventsSummary.join(' · ')}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Bottom Actions: Direct 1X2 Quick Bet + Open 3D Match Center */}
            <div className="mt-5 pt-4 border-t border-white/10 space-y-2.5">
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  {
                    key: '1',
                    short: 'CASA',
                    label: `${featuredMatch.teamA} (Casa)`,
                    odd: featuredMatch.odds['1'],
                  },
                  {
                    key: 'X',
                    short: 'EMPATE',
                    label: 'Empate (X)',
                    odd: featuredMatch.odds['X'],
                  },
                  {
                    key: '2',
                    short: 'FORA',
                    label: `${featuredMatch.teamB} (Fora)`,
                    odd: featuredMatch.odds['2'],
                  },
                ].map((item) => {
                  const active = isSelected(featuredMatch.id, item.label);
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() =>
                        onToggleBet(
                          featuredMatch.id,
                          item.label,
                          item.odd,
                          'Vencedor do Encontro (1x2)'
                        )
                      }
                      className={`px-3 py-2 min-h-[44px] rounded-xl border text-left transition-all flex items-center justify-between gap-2 cursor-pointer ${
                        active
                          ? 'bg-amber-400 text-slate-950 border-amber-300 font-bold shadow-sm'
                          : 'bg-white/10 hover:bg-white/15 text-white border-white/15'
                      }`}
                    >
                      <span
                        className={`text-[10px] font-bold tracking-wider uppercase whitespace-nowrap ${
                          active ? 'text-slate-900' : 'text-slate-300'
                        }`}
                      >
                        {active ? `✓ ${item.short}` : item.short}
                      </span>
                      <span
                        className={`font-mono text-sm font-extrabold tabular-nums whitespace-nowrap ${
                          active ? 'text-slate-950' : 'text-amber-400'
                        }`}
                      >
                        {formatOddBR(item.odd)}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => onOpenMatchCenter(featuredMatch.id, false)}
                  className="flex-1 px-4 py-2.5 min-h-[42px] rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer shadow-xs"
                >
                  <Compass className="w-4 h-4 shrink-0" />
                  <span>Abrir Campo 3D & +{featuredMatch.totalMarketsCount} Mercados</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenMatchCenter(featuredMatch.id, true)}
                  aria-label="Assistir transmissão ao vivo"
                  title="Assistir transmissão ao vivo"
                  className="px-3.5 py-2.5 min-h-[42px] rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
                >
                  <Tv className="w-4 h-4 text-rose-400 shrink-0" />
                  <span className="hidden sm:inline">Ao Vivo HD</span>
                </button>
              </div>
            </div>
          </div>

          {/* Secondary Sidekick Card: Quick Guide + News / PIN Shortcuts */}
          <div
            className={`xl:col-span-4 rounded-2xl p-5 border flex flex-col justify-between ${
              isLightMode
                ? 'bg-white border-slate-200 text-slate-900 shadow-2xs'
                : 'bg-[#14192B] border-slate-800/90 text-slate-100'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 text-xs text-emerald-500 font-bold mb-2">
                <span className="truncate">COMO FUNCIONA A 365 DA BARRA</span>
                <button
                  type="button"
                  onClick={() => setShowHowItWorks(!showHowItWorks)}
                  className="text-slate-400 hover:text-slate-200 text-[11px] underline shrink-0 cursor-pointer"
                >
                  {showHowItWorks ? 'Compactar' : 'Ver passos'}
                </button>
              </div>

              {showHowItWorks ? (
                <ol className="space-y-2.5 text-xs leading-relaxed mt-2">
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-600/20 text-indigo-400 font-mono font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <span className={isLightMode ? 'text-slate-600' : 'text-slate-300'}>
                      <strong className={isLightMode ? 'text-slate-900' : 'text-white'}>
                        Escolha seus palpites:
                      </strong>{' '}
                      Clique na cotação (1 opção por jogo) ou abra os +380 mercados.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-600/20 text-indigo-400 font-mono font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <span className={isLightMode ? 'text-slate-600' : 'text-slate-300'}>
                      <strong className={isLightMode ? 'text-slate-900' : 'text-white'}>
                        Defina o valor no Cupom:
                      </strong>{' '}
                      Aposta mínima de R$ 2,00 e retorno imediato calculado.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-600/20 text-indigo-400 font-mono font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </span>
                    <span className={isLightMode ? 'text-slate-600' : 'text-slate-300'}>
                      <strong className={isLightMode ? 'text-slate-900' : 'text-white'}>
                        Saldo Admin ou Código PIN:
                      </strong>{' '}
                      Finalize com seu saldo liberado ou gere um Pré-Bilhete PIN.
                    </span>
                  </li>
                </ol>
              ) : (
                <p className="text-xs text-slate-400 mt-1">
                  1 opção por partida · Mín. R$ 2,00 · Prêmio máx. R$ 30.000,00.
                </p>
              )}
            </div>

            <div className="mt-4 pt-3.5 border-t border-slate-800/40 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onSwitchView('news')}
                className={`px-2.5 py-2.5 min-h-[40px] rounded-xl text-[11px] font-bold border transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  isLightMode
                    ? 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                    : 'bg-[#1C233B] border-slate-700/80 text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Newspaper className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Notícias HD</span>
              </button>

              <button
                type="button"
                onClick={() => onSwitchView('rules')}
                className={`px-2.5 py-2.5 min-h-[40px] rounded-xl text-[11px] font-bold border transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  isLightMode
                    ? 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                    : 'bg-[#1C233B] border-slate-700/80 text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Ticket className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Consultar PIN</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unified Filter, Status & Search Bar */}
      <div
        className={`rounded-2xl p-3.5 border space-y-3 ${
          isLightMode
            ? 'bg-white border-slate-200 shadow-2xs'
            : 'bg-[#14192B] border-slate-800/90'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Status Segmented Controls */}
          <div
            className={`inline-flex items-center p-1 rounded-xl border self-start ${
              isLightMode
                ? 'bg-slate-100 border-slate-200'
                : 'bg-[#0C101D] border-slate-800'
            }`}
          >
            {[
              { id: 'all', label: `Todos (${matches.length})` },
              {
                id: 'in',
                label: `Ao Vivo (${matches.filter((m) => m.statusState === 'in').length})`,
              },
              {
                id: 'pre',
                label: `Pré-Jogo (${matches.filter((m) => m.statusState === 'pre').length})`,
              },
              {
                id: 'post',
                label: `Encerrados (${matches.filter((m) => m.statusState === 'post').length})`,
              },
            ].map((tab) => {
              const active = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onSelectStatusFilter(tab.id as any)}
                  className={`px-3 py-1.5 min-h-[34px] rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : isLightMode
                      ? 'text-slate-600 hover:text-slate-900'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Live Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              aria-label="Buscar time, campeonato ou estádio"
              placeholder="Buscar time, campeonato ou estádio..."
              className={`w-full pl-9 pr-8 py-2 min-h-[38px] text-xs rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                isLightMode
                  ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
                  : 'bg-[#0C101D] border-slate-800 text-slate-100 placeholder:text-slate-500'
              }`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="Limpar busca"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Horizontal League Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {quickLeagues.map((lg) => {
            const active = currentFilter === lg.id;
            return (
              <button
                key={lg.id}
                type="button"
                onClick={() => onSelectFilter(lg.id)}
                className={`px-3 py-1.5 min-h-[34px] rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 border cursor-pointer ${
                  active
                    ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-2xs'
                    : isLightMode
                    ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    : 'bg-[#192036] border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {lg.shortName}
              </button>
            );
          })}
        </div>
      </div>

      {/* Matches List Grouped by Championship */}
      {groupedLeagues.length === 0 ? (
        <div
          className={`rounded-2xl p-10 text-center border ${
            isLightMode
              ? 'bg-white border-slate-200 text-slate-600'
              : 'bg-[#14192B] border-slate-800 text-slate-400'
          }`}
        >
          <p className="font-display font-bold text-base mb-1">
            Nenhuma partida encontrada para este filtro
          </p>
          <p className="text-xs mb-4">
            Experimente limpar a busca ou visualizar todas as ligas disponíveis.
          </p>
          <button
            type="button"
            onClick={() => {
              onSelectFilter('all');
              onSelectStatusFilter('all');
              onSearchChange('');
            }}
            className="px-4 py-2 rounded-lg bg-amber-400 text-slate-950 font-semibold text-xs hover:bg-amber-300 transition-colors cursor-pointer"
          >
            Mostrar Todos os Jogos
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedLeagues.map((group) => {
            const isCollapsed = !!collapsedLeagues[group.slug];
            const liveCountInGroup = group.matches.filter((m) => m.isLive).length;

            return (
              <section
                key={group.slug}
                className={`rounded-2xl border overflow-hidden ${
                  isLightMode
                    ? 'bg-white border-slate-200 shadow-2xs'
                    : 'bg-[#14192B] border-slate-800/90'
                }`}
              >
                {/* League Header with Pixel-Aligned 1X2 Column Labels */}
                <div
                  onClick={() => toggleLeagueCollapse(group.slug)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') toggleLeagueCollapse(group.slug);
                  }}
                  className={`px-4 py-2.5 cursor-pointer select-none border-b transition-colors md:grid md:grid-cols-[76px_1fr_246px_84px] md:items-center md:gap-4 flex items-center justify-between ${
                    isLightMode
                      ? 'bg-slate-100/90 border-slate-200 text-slate-900'
                      : 'bg-[#1F1746] border-indigo-950/80 text-white'
                  }`}
                >
                  <div className="md:col-span-2 flex items-center gap-2 min-w-0">
                    <h2 className="font-display font-bold text-xs sm:text-sm tracking-tight truncate">
                      {group.leagueTitle}
                    </h2>
                    <span className="text-xs text-slate-400 font-mono tabular-nums">
                      ({group.matches.length})
                    </span>
                    {liveCountInGroup > 0 && (
                      <span className="text-[11px] font-semibold text-rose-400 ml-1">
                        · {liveCountInGroup} Ao Vivo
                      </span>
                    )}
                  </div>

                  {!isCollapsed ? (
                    <>
                      <div className="hidden md:grid grid-cols-3 gap-1.5 text-center text-[11px] font-bold tracking-wider text-slate-300">
                        <span>CASA</span>
                        <span>EMPATE</span>
                        <span>FORA</span>
                      </div>
                      <div className="hidden md:flex items-center justify-end gap-1.5 text-[11px] font-semibold text-amber-400">
                        <span>Mercados</span>
                        <ChevronUp className="w-4 h-4" />
                      </div>
                      <ChevronUp className="w-4 h-4 md:hidden text-slate-400" />
                    </>
                  ) : (
                    <div className="md:col-span-2 flex items-center justify-end gap-1 text-xs text-amber-400 font-semibold">
                      <span>Expandir</span>
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  )}
                </div>

                {/* Match Rows */}
                {!isCollapsed && (
                  <div
                    className={`divide-y ${
                      isLightMode ? 'divide-slate-200/80' : 'divide-slate-800/80'
                    }`}
                  >
                    {group.matches.map((match) => {
                      const sel1Label = `${match.teamA} (Casa)`;
                      const selXLabel = 'Empate (X)';
                      const sel2Label = `${match.teamB} (Fora)`;

                      const sel1 = isSelected(match.id, sel1Label);
                      const selX = isSelected(match.id, selXLabel);
                      const sel2 = isSelected(match.id, sel2Label);

                      // Check if any custom market from Match Center is selected for this match
                      const customSelection = betslip.find(
                        (b) =>
                          b.matchId === match.id &&
                          b.selection !== sel1Label &&
                          b.selection !== selXLabel &&
                          b.selection !== sel2Label
                      );

                      return (
                        <div
                          key={match.id}
                          className={`p-3.5 sm:px-4 transition-colors md:grid md:grid-cols-[76px_1fr_246px_84px] md:items-center md:gap-4 flex flex-col gap-3 ${
                            isLightMode
                              ? 'hover:bg-slate-50/90'
                              : 'hover:bg-[#192038]/60'
                          }`}
                        >
                          {/* Col 1: Time / Live Status */}
                          <div
                            onClick={() => onOpenMatchCenter(match.id)}
                            className="flex md:flex-col items-center md:justify-center justify-between gap-2 cursor-pointer"
                          >
                            {match.isLive ? (
                              <div className="flex md:flex-col items-center gap-1.5">
                                <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-bold text-[10px] tracking-wide">
                                  AO VIVO
                                </span>
                                <span className="font-mono font-extrabold text-xs sm:text-sm text-amber-400 tabular-nums">
                                  {match.displayClock || `${match.minute}'`}
                                </span>
                              </div>
                            ) : match.statusState === 'post' ? (
                              <div className="flex md:flex-col items-center gap-1">
                                <span className="text-[11px] font-bold text-emerald-400">
                                  ENCERRADO
                                </span>
                                <span className="font-mono text-xs text-slate-400 tabular-nums">
                                  {match.kickoffDateShort}
                                </span>
                              </div>
                            ) : (
                              <div className="flex md:flex-col items-center gap-1.5">
                                <span className="text-xs font-medium text-slate-400">
                                  {match.kickoffDateShort || 'Hoje'}
                                </span>
                                <span className="font-mono font-bold text-xs sm:text-sm text-amber-400 tabular-nums">
                                  {match.kickoffTimeStr || '16:00'}
                                </span>
                              </div>
                            )}

                            {/* Mobile-only quick link to 3D Arena */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenMatchCenter(match.id);
                              }}
                              className="md:hidden text-xs font-semibold text-amber-400 flex items-center gap-1"
                            >
                              <span>Arena 3D & +{match.totalMarketsCount}</span>
                              <span>→</span>
                            </button>
                          </div>

                          {/* Col 2: Teams, Crests, Scores & Clean Unboxed Metadata */}
                          <div
                            onClick={() => onOpenMatchCenter(match.id)}
                            className="min-w-0 cursor-pointer space-y-2"
                          >
                            {/* Home Team Row */}
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <TeamCrest
                                  logoUrl={match.logoA}
                                  teamName={match.teamA}
                                  shortName={match.shortA}
                                  primaryColor={match.colorA}
                                  size="sm"
                                />
                                <span className="font-display font-bold text-sm truncate">
                                  {match.teamA}
                                </span>
                                {match.recordA && (
                                  <span className="text-[11px] text-slate-400 font-mono tabular-nums whitespace-nowrap shrink-0 hidden sm:inline">
                                    ({match.recordA})
                                  </span>
                                )}
                                {match.formA && (
                                  <span className="hidden 2xl:inline text-[11px] text-slate-400 font-mono whitespace-nowrap shrink-0">
                                    · {match.formA.replace(/-/g, ' ')}
                                  </span>
                                )}
                              </div>
                              {(match.isLive || match.statusState === 'post') && (
                                <span className="font-mono font-extrabold text-sm px-2 py-0.5 rounded bg-slate-800/80 text-amber-400 tabular-nums shrink-0">
                                  {match.scoreA}
                                </span>
                              )}
                            </div>

                            {/* Away Team Row */}
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <TeamCrest
                                  logoUrl={match.logoB}
                                  teamName={match.teamB}
                                  shortName={match.shortB}
                                  primaryColor={match.colorB}
                                  size="sm"
                                />
                                <span className="font-display font-bold text-sm truncate">
                                  {match.teamB}
                                </span>
                                {match.recordB && (
                                  <span className="text-[11px] text-slate-400 font-mono tabular-nums whitespace-nowrap shrink-0 hidden sm:inline">
                                    ({match.recordB})
                                  </span>
                                )}
                                {match.formB && (
                                  <span className="hidden 2xl:inline text-[11px] text-slate-400 font-mono whitespace-nowrap shrink-0">
                                    · {match.formB.replace(/-/g, ' ')}
                                  </span>
                                )}
                              </div>
                              {(match.isLive || match.statusState === 'post') && (
                                <span className="font-mono font-extrabold text-sm px-2 py-0.5 rounded bg-slate-800/80 text-amber-400 tabular-nums shrink-0">
                                  {match.scoreB}
                                </span>
                              )}
                            </div>

                            {/* Unboxed Metadata: Stadium & Scorers / Custom Selected Market */}
                            <div className="text-[11px] text-slate-400 flex items-center flex-wrap gap-x-2 gap-y-0.5 pt-0.5">
                              <span className="truncate max-w-[280px] sm:max-w-none">
                                {match.stadium}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenMatchCenter(match.id, true);
                                }}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-600/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold hover:bg-rose-600 hover:text-white transition-all cursor-pointer"
                              >
                                <Tv className="w-3 h-3 text-rose-400" />
                                <span>IPTV AO VIVO</span>
                              </button>
                              {match.realEventsSummary.length > 0 && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="text-amber-400/95 font-medium">
                                    {match.realEventsSummary.slice(0, 3).join(' · ')}
                                  </span>
                                </>
                              )}
                              {customSelection && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="text-emerald-400 font-semibold">
                                    ✓ Selecionado: {customSelection.selection} (@
                                    {formatOddBR(customSelection.oddValue)})
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Col 3: 1X2 Odds Grid (Aligned with Header) */}
                          <div className="grid grid-cols-3 gap-1.5 w-full md:w-[246px] shrink-0">
                            {[
                              {
                                short: 'CASA',
                                label: sel1Label,
                                odd: match.odds['1'],
                                selected: sel1,
                              },
                              {
                                short: 'EMPATE',
                                label: selXLabel,
                                odd: match.odds['X'],
                                selected: selX,
                              },
                              {
                                short: 'FORA',
                                label: sel2Label,
                                odd: match.odds['2'],
                                selected: sel2,
                              },
                            ].map((btn) => (
                              <button
                                key={btn.short}
                                type="button"
                                onClick={() =>
                                  onToggleBet(
                                    match.id,
                                    btn.label,
                                    btn.odd,
                                    'Vencedor do Encontro (1x2)'
                                  )
                                }
                                aria-label={`Apostar em ${btn.label} com cotação ${formatOddBR(btn.odd)}`}
                                className={`min-h-[46px] px-2 py-1.5 rounded-xl border transition-all flex flex-col items-center justify-center cursor-pointer select-none ${
                                  btn.selected
                                    ? 'bg-rose-600 text-white border-rose-400 shadow-sm scale-[1.01]'
                                    : isLightMode
                                    ? 'bg-slate-100 hover:bg-slate-200/80 border-slate-200/90 text-slate-900'
                                    : 'bg-[#0C101D] hover:bg-[#222B45] border-slate-800 text-white'
                                }`}
                              >
                                <span
                                  className={`text-[10px] font-bold tracking-wider leading-none ${
                                    btn.selected
                                      ? 'text-white'
                                      : isLightMode
                                      ? 'text-slate-500'
                                      : 'text-slate-400'
                                  }`}
                                >
                                  {btn.selected ? `✓ ${btn.short}` : btn.short}
                                </span>
                                <span
                                  className={`font-mono text-sm font-extrabold tabular-nums mt-1 leading-none ${
                                    btn.selected
                                      ? 'text-white'
                                      : isLightMode
                                      ? 'text-indigo-950'
                                      : 'text-amber-400'
                                  }`}
                                >
                                  {formatOddBR(btn.odd)}
                                </span>
                              </button>
                            ))}
                          </div>

                          {/* Col 4: +384 Markets & 3D Field Trigger */}
                          <div className="hidden md:flex justify-end shrink-0">
                            <button
                              type="button"
                              onClick={() => onOpenMatchCenter(match.id)}
                              title="Abrir Campo 3D e todos os mercados da partida"
                              className="w-[84px] min-h-[46px] px-2 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold transition-colors flex flex-col items-center justify-center cursor-pointer shadow-2xs"
                            >
                              <span className="font-mono text-xs font-extrabold tabular-nums leading-none">
                                +{match.totalMarketsCount}
                              </span>
                              <span className="text-[10px] font-extrabold tracking-tight mt-1 leading-none">
                                3D / +Odds
                              </span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
};
