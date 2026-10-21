export interface Player {
  jersey: string;
  name: string;
  pos: string;
  posFull?: string;
  badges?: string;
  starter?: boolean;
}

export interface MatchStats {
  possession: [number, number];
  totalShots: [number, number];
  shotsOnTarget: [number, number];
  blockedShots: [number, number];
  corners: [number, number];
  offsides: [number, number];
  fouls: [number, number];
  yellowCards: [number, number];
  redCards: [number, number];
  saves: [number, number];
  accuratePasses: [number, number];
  totalPasses: [number, number];
  passPct: [number, number];
  tackles: [number, number];
  clearances: [number, number];
  hasRealBoxscore?: boolean;
}

export interface FeedEvent {
  time: string;
  text: string;
  type: 'goal' | 'danger' | 'corner' | 'normal';
  isHome?: boolean;
  player?: string;
}

export interface MatchLiveState {
  possessionTeam: 'A' | 'B';
  zone: 'posse' | 'attack' | 'danger';
  arcMode: boolean;
  actionText: string;
  subText: string;
  activePlayer: string;
  ballX: number;
  ballY: number;
  targetX: number;
  targetY: number;
  trail: Array<{ x: number; y: number }>;
  stats: MatchStats;
  feed: FeedEvent[];
}

export interface Match {
  id: number;
  espnId: string;
  espnSlug: string;
  category: string;
  league: string;
  stadium: string;
  referee: string;
  teamA: string;
  shortA: string;
  logoA: string;
  teamB: string;
  shortB: string;
  logoB: string;
  colorA: string;
  colorB: string;
  recordA: string;
  recordB: string;
  formA: string;
  formB: string;
  formationA: string;
  formationB: string;
  playersA: Player[];
  playersB: Player[];
  benchA?: Player[];
  benchB?: Player[];
  scoreA: number;
  scoreB: number;
  minute: number;
  second: number;
  displayClock: string;
  statusState: 'in' | 'pre' | 'post';
  statusDescription: string;
  isLive: boolean;
  timeLabel: string;
  kickoffTimeStr: string;
  kickoffDateShort: string;
  totalMarketsCount: number;
  oddsLocked: boolean;
  odds: {
    '1': number;
    'X': number;
    '2': number;
  };
  oddsProvider: string;
  broadcastChannels: string[];
  videoHighlightUrl?: string;
  videoHighlightTitle?: string;
  realEventsSummary: string[];
  markets: {
    overUnder: { label: string; over: number; under: number };
    btts: { label: string; yes: number; no: number };
  };
  state: MatchLiveState;
  hasDetailedSummary?: boolean;
  evTimestamp?: number;
}

export interface MarketOption {
  label: string;
  odd: number;
}

export interface MarketBlock {
  id: string;
  cat: 'principais' | 'gols' | 'tempos' | 'placar' | 'escanteios' | 'cartoes' | 'handicap' | 'jogadores';
  title: string;
  badge: string;
  cols: 2 | 3 | 4;
  options: MarketOption[];
}

export interface BetSelection {
  matchId: number;
  selection: string;
  oddValue: number;
  marketName: string;
}

export interface TicketReceipt {
  pin: string;
  clientId: number;
  clientName: string;
  selections: BetSelection[];
  totalOdd: number;
  stake: number;
  payout: number;
  status: 'VALIDADO' | 'AGUARDANDO ADMIN (PIN)';
  createdAt: string;
}

export interface ClientAccount {
  id: number;
  name: string;
  username: string;
  phone: string;
  pixKey: string;
  role: string;
  status: string;
  balance: number;
  creditLimit: number;
  createdAt: string;
}

export type SoundEventType =
  | 'bet_validated'
  | 'withdrawal_approved'
  | 'admin_notification'
  | 'selection_added'
  | 'error_alert';

export interface BalanceRequest {
  id: number;
  clientId: number;
  clientName: string;
  amount: number;
  time: string;
  type?: 'DEPOSIT' | 'WITHDRAWAL';
  pixKey?: string;
}

export interface NewsArticle {
  id: string;
  leagueSlug: string;
  leagueLabel: string;
  headline: string;
  description: string;
  byline: string;
  publishedRaw: number;
  published: string;
  timeAgo: string;
  tags: string[];
  hasVideo: boolean;
  videoUrl?: string;
  image: string;
  storyHtml?: string;
  url: string;
}

export interface HouseRules {
  maxPrize: number;
  minStake: number;
  maxStake: number;
  maxSelections: number;
  oneOptionPerMatch: boolean;
}
