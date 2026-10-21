import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Compass,
  Flame,
  Layers,
  Play,
  Radio,
  Search,
  Tv,
  Users,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import { BetSelection, Match } from '../types/sportsbook';
import {
  buildFullMatchMarketsCatalog,
  formatOddBR,
} from '../utils/bettingRules';
import { TeamCrest } from './TeamCrest';
import { CAMBISTA_PHONE_DISPLAY, CAMBISTA_WHATSAPP } from '../data/initialData';

interface MatchCenterViewProps {
  match: Match;
  allMatches: Match[];
  betslip: BetSelection[];
  initialStreamOpen?: boolean;
  isLightMode: boolean;
  onBack: () => void;
  onSelectMatch: (matchId: number) => void;
  onToggleBet: (matchId: number, selection: string, oddValue: number, marketName?: string) => void;
}

const FORMATION_COORDS_A = [
  { x: 0.06, y: 0.5, num: '1' },
  { x: 0.19, y: 0.16, num: '2' },
  { x: 0.17, y: 0.38, num: '3' },
  { x: 0.17, y: 0.62, num: '4' },
  { x: 0.19, y: 0.84, num: '6' },
  { x: 0.38, y: 0.26, num: '5' },
  { x: 0.34, y: 0.5, num: '8' },
  { x: 0.38, y: 0.74, num: '10' },
  { x: 0.58, y: 0.2, num: '7' },
  { x: 0.63, y: 0.5, num: '9' },
  { x: 0.58, y: 0.8, num: '11' },
];

const FORMATION_COORDS_B = [
  { x: 0.94, y: 0.5, num: '1' },
  { x: 0.81, y: 0.16, num: '2' },
  { x: 0.83, y: 0.38, num: '3' },
  { x: 0.83, y: 0.62, num: '4' },
  { x: 0.81, y: 0.84, num: '6' },
  { x: 0.62, y: 0.26, num: '5' },
  { x: 0.66, y: 0.5, num: '8' },
  { x: 0.62, y: 0.74, num: '10' },
  { x: 0.42, y: 0.22, num: '7' },
  { x: 0.37, y: 0.5, num: '9' },
  { x: 0.42, y: 0.78, num: '11' },
];

export const MatchCenterView: React.FC<MatchCenterViewProps> = ({
  match,
  allMatches,
  betslip,
  initialStreamOpen = false,
  isLightMode,
  onBack,
  onSelectMatch,
  onToggleBet,
}) => {
  const [liveStreamOpen, setLiveStreamOpen] = useState(initialStreamOpen);
  const [streamChannel, setStreamChannel] = useState<
    'ch1' | 'multicanais' | 'futemax' | 'cazetv' | 'goat' | 'premiere' | 'highlights'
  >('cazetv');
  const [streamServer, setStreamServer] = useState<'srv1' | 'srv2'>('srv1');
  const [is3D, setIs3D] = useState(true);
  const [showPlayers, setShowPlayers] = useState(true);
  const [showTrail, setShowTrail] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);

  const [trackerTab, setTrackerTab] = useState<'stats' | 'feed' | 'lineups' | 'info'>('stats');
  const [marketCategory, setMarketCategory] = useState<string>('all');
  const [marketSearch, setMarketSearch] = useState<string>('');
  const [collapsedBlocks, setCollapsedBlocks] = useState<Record<string, boolean>>({});

  // Dynamic tactical radar coordinates cycling smoothly
  const [playPhase, setPlayPhase] = useState(0);

  useEffect(() => {
    setLiveStreamOpen(initialStreamOpen);
  }, [initialStreamOpen, match.id]);

  useEffect(() => {
    const timer = setInterval(() => {
      setPlayPhase((p) => (p + 1) % 4);
    }, 3600);
    return () => clearInterval(timer);
  }, []);

  const playWhistleSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2750, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(2950, ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {
      // ignore audio context block
    }
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    if (next) playWhistleSound();
  };

  const marketBlocks = useMemo(() => buildFullMatchMarketsCatalog(match), [match]);
  const totalOptionsCount = useMemo(
    () => marketBlocks.reduce((acc, b) => acc + b.options.length, 0),
    [marketBlocks]
  );

  const filteredBlocks = useMemo(() => {
    const q = marketSearch.trim().toLowerCase();
    return marketBlocks.filter((b) => {
      const catMatch = marketCategory === 'all' || b.cat === marketCategory;
      if (!catMatch) return false;
      if (!q) return true;
      return (
        b.title.toLowerCase().includes(q) ||
        b.options.some((o) => o.label.toLowerCase().includes(q))
      );
    });
  }, [marketBlocks, marketCategory, marketSearch]);

  const isSelected = (selectionLabel: string) =>
    betslip.some((b) => b.matchId === match.id && b.selection === selectionLabel);

  // Calculate tactical ball position from match state + live phase offset
  const phaseOffsets = [
    { dx: 0, dy: 0 },
    { dx: 0.06, dy: -0.08 },
    { dx: -0.05, dy: 0.09 },
    { dx: 0.04, dy: 0.04 },
  ];
  const offset = phaseOffsets[playPhase];
  const ballNormX = Math.max(0.08, Math.min(0.92, (match.state.ballX || 0.62) + offset.dx));
  const ballNormY = Math.max(0.12, Math.min(0.88, (match.state.ballY || 0.45) + offset.dy));

  const PITCH_X = 30;
  const PITCH_Y = 25;
  const PITCH_W = 740;
  const PITCH_H = 400;
  const bx = PITCH_X + ballNormX * PITCH_W;
  const by = PITCH_Y + ballNormY * PITCH_H;

  const isTeamAPossession = match.state.possessionTeam === 'A';
  const frontX = PITCH_X + (isTeamAPossession ? Math.max(0.58, ballNormX + 0.08) : Math.min(0.42, ballNormX - 0.08)) * PITCH_W;
  const tipX = isTeamAPossession ? Math.min(PITCH_X + PITCH_W, frontX + 36) : Math.max(PITCH_X, frontX - 36);
  const midY = PITCH_Y + PITCH_H / 2;

  const trailPoints = (match.state.trail || [
    { x: 0.48, y: 0.5 },
    { x: 0.62, y: 0.42 },
  ]).map((pt) => ({
    x: PITCH_X + pt.x * PITCH_W,
    y: PITCH_Y + pt.y * PITCH_H,
  }));

  const fallbackVideo =
    match.videoHighlightUrl ||
    'https://espnmedia-cdn.akamaized.net/espn/media/16x9/2026/1018/Hu_261018_BR_futebol_PLMatchPackage_bournemouth_x_sunderland_gols_final_game_highlight/Hu_261018_BR_futebol_PLMatchPackage_bournemouth_x_sunderland_gols_final_game_highlight.mp4';

  const stats = match.state.stats;

  return (
    <div className="space-y-5">
      {/* Top Action & View Switcher Bar */}
      <div
        className={`rounded-2xl p-3.5 border flex flex-col lg:flex-row lg:items-center justify-between gap-3 ${
          isLightMode
            ? 'bg-white border-slate-200 shadow-2xs'
            : 'bg-[#14192B] border-slate-800/90'
        }`}
      >
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={onBack}
            className="px-3.5 py-2 min-h-[38px] rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <span>Voltar aos Jogos</span>
          </button>

          <select
            aria-label="Trocar partida aberta"
            value={match.id}
            onChange={(e) => onSelectMatch(Number(e.target.value))}
            className={`px-3 py-2 min-h-[38px] rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400 ${
              isLightMode
                ? 'bg-slate-50 border-slate-200 text-slate-800'
                : 'bg-[#0C101D] border-slate-800 text-slate-200'
            }`}
          >
            {allMatches.map((m) => (
              <option key={m.id} value={m.id}>
                {m.isLive ? `[AO VIVO ${m.scoreA}-${m.scoreB}] ` : ''}
                {m.teamA} x {m.teamB} ({m.league})
              </option>
            ))}
          </select>
        </div>

        {/* Interactive Pitch & Broadcast Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setLiveStreamOpen(!liveStreamOpen)}
            className={`px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              liveStreamOpen
                ? 'bg-rose-600 text-white border-rose-500'
                : isLightMode
                ? 'bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200'
                : 'bg-[#1B223A] border-slate-700 text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Tv className="w-3.5 h-3.5 shrink-0" />
            <span>Transmissão Ao Vivo</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setLiveStreamOpen(false);
              setIs3D(!is3D);
            }}
            className={`px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              !liveStreamOpen && is3D
                ? 'bg-amber-400 text-slate-950 border-amber-300'
                : isLightMode
                ? 'bg-slate-100 border-slate-200 text-slate-700'
                : 'bg-[#1B223A] border-slate-700 text-slate-300'
            }`}
          >
            <Layers className="w-3.5 h-3.5 shrink-0" />
            <span>{is3D ? 'Estádio 3D' : 'Visão 2D'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPlayers(!showPlayers)}
            className={`px-2.5 py-1.5 min-h-[36px] rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              showPlayers
                ? 'bg-emerald-600 text-white border-emerald-500'
                : isLightMode
                ? 'bg-slate-100 border-slate-200 text-slate-700'
                : 'bg-[#1B223A] border-slate-700 text-slate-300'
            }`}
          >
            <Users className="w-3.5 h-3.5 shrink-0" />
            <span>22 Jogadores</span>
          </button>

          <button
            type="button"
            onClick={() => setShowTrail(!showTrail)}
            className={`px-2.5 py-1.5 min-h-[36px] rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              showTrail
                ? 'bg-indigo-600 text-white border-indigo-500'
                : isLightMode
                ? 'bg-slate-100 border-slate-200 text-slate-700'
                : 'bg-[#1B223A] border-slate-700 text-slate-300'
            }`}
          >
            <Zap className="w-3.5 h-3.5 shrink-0" />
            <span>Trajetória</span>
          </button>

          <button
            type="button"
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`px-2.5 py-1.5 min-h-[36px] rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              showHeatmap
                ? 'bg-orange-600 text-white border-orange-500'
                : isLightMode
                ? 'bg-slate-100 border-slate-200 text-slate-700'
                : 'bg-[#1B223A] border-slate-700 text-slate-300'
            }`}
          >
            <Flame className="w-3.5 h-3.5 shrink-0" />
            <span>Mapa de Calor</span>
          </button>

          <button
            type="button"
            onClick={handleToggleSound}
            aria-label="Alternar som da partida"
            className={`px-2.5 py-1.5 min-h-[36px] rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              soundEnabled
                ? 'bg-amber-400 text-slate-950 border-amber-300'
                : isLightMode
                ? 'bg-slate-100 border-slate-200 text-slate-700'
                : 'bg-[#1B223A] border-slate-700 text-slate-300'
            }`}
          >
            {soundEnabled ? (
              <Volume2 className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 shrink-0" />
            )}
            <span>Som</span>
          </button>
        </div>
      </div>

      {/* Match Scoreboard Header */}
      <div className="rounded-2xl p-5 bg-gradient-to-r from-[#1D1542] via-[#13192E] to-[#1D1542] border border-indigo-500/30 text-white shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
          {/* Home Team */}
          <div className="flex items-center md:justify-end gap-3.5">
            <div className="md:text-right">
              <div className="font-display font-extrabold text-lg sm:text-xl">
                {match.teamA}
              </div>
              <div className="text-xs text-slate-300">
                {match.formationA} {match.recordA ? `· Campanha ${match.recordA}` : ''}
              </div>
            </div>
            <TeamCrest
              logoUrl={match.logoA}
              teamName={match.teamA}
              shortName={match.shortA}
              primaryColor={match.colorA}
              size="xl"
            />
          </div>

          {/* Center Score & Clock */}
          <div className="flex flex-col items-center text-center">
            <span className="text-xs font-bold tracking-wider text-amber-400 mb-1">
              {match.isLive
                ? `AO VIVO · ${match.displayClock} · ${match.statusDescription}`
                : match.timeLabel}
            </span>
            <div className="px-6 py-2 rounded-2xl bg-black/45 border border-white/15 font-mono text-2xl sm:text-3xl font-black text-white tabular-nums tracking-tight">
              {match.scoreA} - {match.scoreB}
            </div>
            <span className="text-[11px] text-slate-300 mt-1.5">
              {match.stadium} · Árbitro: {match.referee}
            </span>
          </div>

          {/* Away Team */}
          <div className="flex items-center gap-3.5">
            <TeamCrest
              logoUrl={match.logoB}
              teamName={match.teamB}
              shortName={match.shortB}
              primaryColor={match.colorB}
              size="xl"
            />
            <div>
              <div className="font-display font-extrabold text-lg sm:text-xl">
                {match.teamB}
              </div>
              <div className="text-xs text-slate-300">
                {match.formationB} {match.recordB ? `· Campanha ${match.recordB}` : ''}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Arena Grid: Pitch / Stream (Left 7 cols) + Match Tracker Tabs (Right 5 cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-stretch">
        {/* Pitch / Broadcast Column */}
        <div
          className={`xl:col-span-7 rounded-2xl border overflow-hidden flex flex-col justify-between ${
            isLightMode
              ? 'bg-slate-900 border-slate-800 text-white'
              : 'bg-[#0D1322] border-slate-800/90 text-white'
          }`}
        >
          {liveStreamOpen ? (
            /* Live Multi-Channel Broadcast Stage */
            <div className="p-4 flex flex-col h-full justify-between space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { id: 'cazetv', label: 'CazéTV HD' },
                    { id: 'goat', label: 'Canal GOAT' },
                    { id: 'multicanais', label: 'Multicanais HD' },
                    { id: 'futemax', label: 'Futemax HD' },
                    { id: 'premiere', label: 'Premiere HD' },
                    { id: 'ch1', label: 'Tático 3D' },
                    { id: 'highlights', label: 'Gols & Lances' },
                  ].map((ch) => (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => setStreamChannel(ch.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        streamChannel === ch.id
                          ? 'bg-rose-600 text-white shadow-sm'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {ch.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-black/40 rounded-lg p-0.5 border border-white/10">
                    <button
                      type="button"
                      onClick={() => setStreamServer('srv1')}
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer transition-colors ${
                        streamServer === 'srv1'
                          ? 'bg-amber-400 text-slate-950 font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Opção 1
                    </button>
                    <button
                      type="button"
                      onClick={() => setStreamServer('srv2')}
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer transition-colors ${
                        streamServer === 'srv2'
                          ? 'bg-amber-400 text-slate-950 font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Opção 2
                    </button>
                  </div>
                  <span className="text-xs font-mono font-semibold text-emerald-400">
                    1080p · 60fps
                  </span>
                </div>
              </div>

              <div className="relative rounded-xl overflow-hidden bg-black aspect-video border border-slate-800">
                {streamChannel === 'cazetv' || streamChannel === 'goat' ? (
                  <iframe
                    src={
                      streamChannel === 'goat'
                        ? 'https://www.youtube-nocookie.com/embed/live_stream?channel=UCW-X7s7v_V_s0xQjR7g0yWg&autoplay=1&mute=1&playsinline=1'
                        : 'https://www.youtube-nocookie.com/embed/live_stream?channel=UC8Xb96zG491J5h3X457H8vQ&autoplay=1&mute=1&playsinline=1'
                    }
                    title="Transmissão Ao Vivo"
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    key={`${streamChannel}-${streamServer}`}
                    src={fallbackVideo}
                    controls
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute top-3 left-3 px-3 py-1 rounded-md bg-black/75 backdrop-blur-xs border border-white/15 text-xs font-mono font-bold flex items-center gap-2 pointer-events-none">
                  <span>{match.shortA}</span>
                  <span className="text-amber-400">
                    {match.scoreA} - {match.scoreB}
                  </span>
                  <span>{match.shortB}</span>
                  <span className="text-rose-400 ml-1">{match.displayClock}</span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 flex-wrap text-xs text-slate-300 pt-1">
                <span>
                  Canais Oficiais: {(match.broadcastChannels || ['Premiere', 'SporTV']).join(' · ')}
                </span>
                <a
                  href={`https://api.whatsapp.com/send?phone=${CAMBISTA_WHATSAPP}&text=Ol%C3%A1%2C%20estou%20assistindo%20${encodeURIComponent(
                    match.teamA + ' x ' + match.teamB
                  )}%20na%20365%20DA%20BARRA!`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:underline font-semibold"
                >
                  Falar com Cambista {CAMBISTA_PHONE_DISPLAY} →
                </a>
              </div>
            </div>
          ) : (
            /* Interactive 3D/2D Vector Tactical Pitch */
            <div className="p-4 flex flex-col justify-between h-full space-y-3">
              {/* Broadcast HUD Header */}
              <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-amber-400 truncate">
                    {match.state.actionText}
                  </div>
                  <div className="text-[11px] text-slate-300 truncate mt-0.5">
                    {match.state.subText}
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold whitespace-nowrap shrink-0">
                  Posse: {match.state.activePlayer}
                </span>
              </div>

              {/* SVG Pitch Container */}
              <div className="pitch-stage-container relative py-2 flex items-center justify-center">
                <div
                  className={`w-full rounded-xl overflow-hidden ${
                    is3D ? 'pitch-3d-tilt' : 'pitch-2d-flat'
                  }`}
                >
                  <svg
                    viewBox="0 0 800 450"
                    className="w-full h-auto block select-none"
                    preserveAspectRatio="xMidYMid meet"
                  >
                    <defs>
                      <linearGradient id="zoneAttackHome" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.03" />
                        <stop offset="60%" stopColor="#10b981" stopOpacity="0.18" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.42" />
                      </linearGradient>
                      <linearGradient id="zoneAttackAway" x1="100%" y1="0%" x2="0%" y2="0%">
                        <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.03" />
                        <stop offset="60%" stopColor="#38bdf8" stopOpacity="0.18" />
                        <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.42" />
                      </linearGradient>
                      <radialGradient id="heatSpotGrad" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.55" />
                        <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.28" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                      </radialGradient>
                    </defs>

                    {/* Turf Base */}
                    <rect x="0" y="0" width="800" height="450" rx="12" fill="#0d311e" />

                    {/* Alternating Turf Stripes */}
                    {Array.from({ length: 16 }).map((_, idx) => (
                      <rect
                        key={idx}
                        x={30 + idx * 46.25}
                        y={25}
                        width={46.25}
                        height={400}
                        fill={idx % 2 === 0 ? '#134229' : '#174e31'}
                      />
                    ))}

                    {/* Tactical Attack Curtain */}
                    <polygon
                      points={
                        isTeamAPossession
                          ? `${PITCH_X},${PITCH_Y} ${frontX},${PITCH_Y} ${tipX},${midY} ${frontX},${PITCH_Y + PITCH_H} ${PITCH_X},${PITCH_Y + PITCH_H}`
                          : `${PITCH_X + PITCH_W},${PITCH_Y} ${frontX},${PITCH_Y} ${tipX},${midY} ${frontX},${PITCH_Y + PITCH_H} ${PITCH_X + PITCH_W},${PITCH_Y + PITCH_H}`
                      }
                      fill={isTeamAPossession ? 'url(#zoneAttackHome)' : 'url(#zoneAttackAway)'}
                    />
                    <polyline
                      points={`${frontX},${PITCH_Y} ${tipX},${midY} ${frontX},${PITCH_Y + PITCH_H}`}
                      fill="none"
                      stroke={isTeamAPossession ? '#10b981' : '#38bdf8'}
                      strokeWidth="2.5"
                      strokeDasharray="6,4"
                    />

                    {/* Optional Heatmap Layer */}
                    {showHeatmap && (
                      <g>
                        <circle cx={bx} cy={by} r="75" fill="url(#heatSpotGrad)" />
                        <circle
                          cx={isTeamAPossession ? 580 : 220}
                          cy={215}
                          r="85"
                          fill="url(#heatSpotGrad)"
                        />
                      </g>
                    )}

                    {/* Official Pitch Lines */}
                    <g stroke="rgba(255,255,255,0.68)" strokeWidth="2.2" fill="none">
                      <rect x="30" y="25" width="740" height="400" />
                      <line x1="400" y1="25" x2="400" y2="425" />
                      <circle cx="400" cy="225" r="56" />
                      <circle cx="400" cy="225" r="4" fill="#fff" />
                      <rect x="30" y="105" width="115" height="240" />
                      <rect x="30" y="165" width="42" height="120" />
                      <rect x="655" y="105" width="115" height="240" />
                      <rect x="728" y="165" width="42" height="120" />
                      <rect
                        x="14"
                        y="192"
                        width="16"
                        height="66"
                        fill="rgba(255,255,255,0.14)"
                      />
                      <rect
                        x="770"
                        y="192"
                        width="16"
                        height="66"
                        fill="rgba(255,255,255,0.14)"
                      />
                    </g>

                    {/* 22 Players Tactical Layer */}
                    {showPlayers && (
                      <g>
                        {FORMATION_COORDS_A.map((pos, idx) => {
                          const px = PITCH_X + pos.x * PITCH_W;
                          const py = PITCH_Y + pos.y * PITCH_H;
                          const jersey = match.playersA[idx]?.jersey || pos.num;
                          return (
                            <g key={`pA-${idx}`} transform={`translate(${px}, ${py})`}>
                              <circle
                                cx="0"
                                cy="0"
                                r="10"
                                fill={match.colorA || '#e11d48'}
                                stroke="#090d16"
                                strokeWidth="2"
                              />
                              <text
                                x="0"
                                y="3.5"
                                textAnchor="middle"
                                fill="#ffffff"
                                fontSize="9.5"
                                fontWeight="800"
                              >
                                {jersey}
                              </text>
                            </g>
                          );
                        })}
                        {FORMATION_COORDS_B.map((pos, idx) => {
                          const px = PITCH_X + pos.x * PITCH_W;
                          const py = PITCH_Y + pos.y * PITCH_H;
                          const jersey = match.playersB[idx]?.jersey || pos.num;
                          return (
                            <g key={`pB-${idx}`} transform={`translate(${px}, ${py})`}>
                              <circle
                                cx="0"
                                cy="0"
                                r="10"
                                fill={match.colorB || '#2563eb'}
                                stroke="#090d16"
                                strokeWidth="2"
                              />
                              <text
                                x="0"
                                y="3.5"
                                textAnchor="middle"
                                fill="#ffffff"
                                fontSize="9.5"
                                fontWeight="800"
                              >
                                {jersey}
                              </text>
                            </g>
                          );
                        })}
                      </g>
                    )}

                    {/* Pass Trajectory Layer */}
                    {showTrail && trailPoints.length >= 2 && (
                      <g>
                        <path
                          d={`M ${trailPoints[0].x} ${trailPoints[0].y} Q ${(trailPoints[0].x + bx) / 2} ${Math.min(trailPoints[0].y, by) - 45} ${bx} ${by}`}
                          fill="none"
                          stroke="#fbbf24"
                          strokeWidth="3"
                          strokeDasharray="6,4"
                        />
                        {trailPoints.map((pt, i) => (
                          <g key={i} transform={`translate(${pt.x}, ${pt.y})`}>
                            <circle
                              cx="0"
                              cy="0"
                              r="8"
                              fill="#0f172a"
                              stroke="#fbbf24"
                              strokeWidth="2"
                            />
                            <text
                              x="0"
                              y="3.5"
                              textAnchor="middle"
                              fill="#fbbf24"
                              fontSize="9"
                              fontWeight="800"
                            >
                              {i + 1}
                            </text>
                          </g>
                        ))}
                      </g>
                    )}

                    {/* Active Ball with Radar Rings */}
                    <g transform={`translate(${bx}, ${by})`}>
                      <circle
                        cx="0"
                        cy="0"
                        r="22"
                        fill="none"
                        stroke="#fbbf24"
                        strokeWidth="2"
                        opacity="0.45"
                      />
                      <circle
                        cx="0"
                        cy="0"
                        r="8.5"
                        fill="#ffffff"
                        stroke="#0f172a"
                        strokeWidth="2"
                      />
                    </g>
                  </svg>
                </div>
              </div>

              {/* Pitch Footer Strip */}
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span>
                  Posse de Bola: {match.shortA} {stats.possession[0]}% · {match.shortB}{' '}
                  {stats.possession[1]}%
                </span>
                <button
                  type="button"
                  onClick={() => setPlayPhase((p) => (p + 1) % 4)}
                  className="text-amber-400 hover:underline font-semibold cursor-pointer"
                >
                  Atualizar Radar Tático ↻
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Match Statistics, Feed & Lineups Column */}
        <div
          className={`xl:col-span-5 rounded-2xl border flex flex-col justify-between overflow-hidden ${
            isLightMode
              ? 'bg-white border-slate-200 text-slate-900'
              : 'bg-[#14192B] border-slate-800/90 text-slate-100'
          }`}
        >
          <div>
            {/* Tracker Navigation Tabs */}
            <div
              className={`grid grid-cols-4 border-b text-xs font-semibold ${
                isLightMode ? 'bg-slate-100 border-slate-200' : 'bg-[#0E1220] border-slate-800'
              }`}
            >
              {[
                { id: 'stats', label: 'Estatísticas' },
                { id: 'feed', label: `Lances (${match.state.feed.length})` },
                { id: 'lineups', label: 'Escalações' },
                { id: 'info', label: 'Info & TV' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTrackerTab(t.id as any)}
                  className={`py-3 px-2 border-b-2 transition-colors whitespace-nowrap truncate cursor-pointer ${
                    trackerTab === t.id
                      ? 'border-amber-400 text-amber-400 font-bold bg-indigo-950/20'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-4 max-h-[360px] overflow-y-auto space-y-3">
              {trackerTab === 'stats' && (
                <div className="space-y-3">
                  {[
                    {
                      label: 'Posse de Bola (%)',
                      valA: stats.possession[0],
                      valB: stats.possession[1],
                    },
                    {
                      label: 'Finalizações Totais',
                      valA: stats.totalShots[0],
                      valB: stats.totalShots[1],
                    },
                    {
                      label: 'Chutes no Alvo',
                      valA: stats.shotsOnTarget[0],
                      valB: stats.shotsOnTarget[1],
                    },
                    {
                      label: 'Escanteios',
                      valA: stats.corners[0],
                      valB: stats.corners[1],
                    },
                    {
                      label: 'Faltas Cometidas',
                      valA: stats.fouls[0],
                      valB: stats.fouls[1],
                    },
                    {
                      label: 'Cartões Amarelos',
                      valA: stats.yellowCards[0],
                      valB: stats.yellowCards[1],
                    },
                    {
                      label: 'Defesas do Goleiro',
                      valA: stats.saves[0],
                      valB: stats.saves[1],
                    },
                  ].map((row) => {
                    const sum = row.valA + row.valB || 1;
                    const pctA = Math.round((row.valA / sum) * 100);
                    return (
                      <div key={row.label} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono font-bold tabular-nums">
                            {row.valA}
                          </span>
                          <span className="text-slate-400 font-medium">{row.label}</span>
                          <span className="font-mono font-bold tabular-nums">
                            {row.valB}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-800 overflow-hidden flex">
                          <div
                            className="bg-emerald-500 transition-all"
                            style={{ width: `${pctA}%` }}
                          />
                          <div
                            className="bg-indigo-500 transition-all"
                            style={{ width: `${100 - pctA}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {trackerTab === 'feed' && (
                <div className="space-y-2.5">
                  {match.state.feed.map((ev, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border text-xs flex items-start gap-3 ${
                        ev.type === 'goal'
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                          : isLightMode
                          ? 'bg-slate-50 border-slate-200'
                          : 'bg-[#0E1220] border-slate-800'
                      }`}
                    >
                      <span className="font-mono font-bold text-amber-400 shrink-0 tabular-nums">
                        {ev.time}
                      </span>
                      <span className="leading-relaxed">{ev.text}</span>
                    </div>
                  ))}
                </div>
              )}

              {trackerTab === 'lineups' && (
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="font-display font-bold text-amber-400 mb-2">
                      {match.teamA} ({match.formationA})
                    </div>
                    <div className="space-y-1.5">
                      {match.playersA.map((p, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="font-mono text-[11px] text-slate-400 w-5 tabular-nums">
                            {p.jersey}
                          </span>
                          <span className="truncate font-medium">{p.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="font-display font-bold text-indigo-400 mb-2">
                      {match.teamB} ({match.formationB})
                    </div>
                    <div className="space-y-1.5">
                      {match.playersB.map((p, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="font-mono text-[11px] text-slate-400 w-5 tabular-nums">
                            {p.jersey}
                          </span>
                          <span className="truncate font-medium">{p.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {trackerTab === 'info' && (
                <div className="space-y-3 text-xs leading-relaxed">
                  <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800">
                    <div className="text-slate-400">Estádio Oficial</div>
                    <div className="font-semibold text-sm mt-0.5">{match.stadium}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800">
                    <div className="text-slate-400">Arbitragem</div>
                    <div className="font-semibold text-sm mt-0.5">{match.referee}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800">
                    <div className="text-slate-400">Transmissão e Cobertura</div>
                    <div className="font-semibold text-sm mt-0.5">
                      {(match.broadcastChannels || ['Premiere', 'SporTV']).join(' · ')}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div
            className={`px-4 py-2.5 border-t text-[11px] flex items-center justify-between ${
              isLightMode
                ? 'bg-slate-50 border-slate-200 text-slate-500'
                : 'bg-[#0E1220] border-slate-800 text-slate-400'
            }`}
          >
            <span>Fonte: {match.oddsProvider}</span>
            <span>Regra: 1 opção por partida</span>
          </div>
        </div>
      </div>

      {/* Full Markets Catalog Section */}
      <div className="space-y-4">
        {/* Sticky Market Filter & Search Bar */}
        <div
          className={`sticky top-14 z-20 rounded-2xl p-3.5 border space-y-3 shadow-md ${
            isLightMode
              ? 'bg-white/95 border-slate-200 backdrop-blur-md'
              : 'bg-[#14192B]/95 border-slate-800 backdrop-blur-md'
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="font-display font-bold text-sm sm:text-base">
                Catálogo de Mercados da Partida ({totalOptionsCount} opções disponíveis)
              </h3>
              <p className="text-xs text-slate-400">
                Selecione 1 cotação desta partida para adicionar ao seu Cupom ou gerar código PIN
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={marketSearch}
                  onChange={(e) => setMarketSearch(e.target.value)}
                  placeholder="Buscar mercado ou jogador..."
                  aria-label="Buscar mercado ou jogador"
                  className={`w-full pl-8 pr-3 py-1.5 min-h-[36px] rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                    isLightMode
                      ? 'bg-slate-50 border-slate-200 text-slate-900'
                      : 'bg-[#0C101D] border-slate-800 text-slate-100'
                  }`}
                />
              </div>
              <button
                type="button"
                onClick={() => setCollapsedBlocks({})}
                className={`px-3 py-1.5 min-h-[36px] rounded-xl border text-xs font-semibold cursor-pointer ${
                  isLightMode
                    ? 'bg-slate-100 border-slate-200 text-slate-700'
                    : 'bg-[#1B223A] border-slate-700 text-slate-300'
                }`}
              >
                Expandir
              </button>
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[
              { id: 'all', label: `Todos (${marketBlocks.length})` },
              { id: 'principais', label: 'Principais' },
              { id: 'gols', label: 'Gols (Mais/Menos)' },
              { id: 'tempos', label: '1º e 2º Tempo' },
              { id: 'placar', label: 'Placar Exato' },
              { id: 'escanteios', label: 'Escanteios' },
              { id: 'cartoes', label: 'Cartões' },
              { id: 'handicap', label: 'Handicap' },
              { id: 'jogadores', label: 'Jogadores & Gols' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setMarketCategory(cat.id)}
                className={`px-3 py-1.5 min-h-[34px] rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  marketCategory === cat.id
                    ? 'bg-amber-400 text-slate-950 font-bold'
                    : isLightMode
                    ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    : 'bg-[#0C101D] text-slate-300 hover:bg-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Market Blocks */}
        <div className="space-y-3">
          {filteredBlocks.map((block) => {
            const isCollapsed = !!collapsedBlocks[block.id];
            const gridColsClass =
              block.cols === 4
                ? 'grid-cols-2 sm:grid-cols-4'
                : block.cols === 3
                ? 'grid-cols-1 sm:grid-cols-3'
                : 'grid-cols-1 sm:grid-cols-2';

            return (
              <div
                key={block.id}
                className={`rounded-2xl border overflow-hidden ${
                  isLightMode
                    ? 'bg-white border-slate-200 shadow-2xs'
                    : 'bg-[#14192B] border-slate-800/90'
                }`}
              >
                <button
                  type="button"
                  onClick={() =>
                    setCollapsedBlocks((prev) => ({
                      ...prev,
                      [block.id]: !prev[block.id],
                    }))
                  }
                  className={`w-full px-4 py-3 flex items-center justify-between text-left border-b transition-colors cursor-pointer ${
                    isLightMode
                      ? 'bg-slate-50 border-slate-200 text-slate-900'
                      : 'bg-[#1B163C] border-slate-800/80 text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-display font-bold text-xs sm:text-sm truncate">
                      {block.title}
                    </span>
                    <span className="text-xs text-slate-400 font-mono tabular-nums">
                      ({block.options.length})
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 text-xs text-amber-400 font-medium">
                    <span className="hidden sm:inline">{block.badge}</span>
                    {isCollapsed ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronUp className="w-4 h-4" />
                    )}
                  </div>
                </button>

                {!isCollapsed && (
                  <div className={`p-3 grid ${gridColsClass} gap-2`}>
                    {block.options.map((opt) => {
                      const active = isSelected(opt.label);
                      return (
                        <button
                          key={opt.label}
                          type="button"
                          onClick={() =>
                            onToggleBet(match.id, opt.label, opt.odd, block.title)
                          }
                          className={`px-3.5 py-2.5 min-h-[44px] rounded-xl border text-xs flex items-center justify-between gap-2 transition-all cursor-pointer ${
                            active
                              ? 'bg-rose-600 text-white border-rose-400 font-bold shadow-xs'
                              : isLightMode
                              ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                              : 'bg-[#0C101D] hover:bg-[#1E2640] border-slate-800 text-slate-200'
                          }`}
                        >
                          <span className="truncate text-left">
                            {active ? `✓ ${opt.label}` : opt.label}
                          </span>
                          <span
                            className={`font-mono font-extrabold text-sm tabular-nums shrink-0 ${
                              active
                                ? 'text-white'
                                : isLightMode
                                ? 'text-indigo-950'
                                : 'text-amber-400'
                            }`}
                          >
                            {formatOddBR(opt.odd)}
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
      </div>
    </div>
  );
};
