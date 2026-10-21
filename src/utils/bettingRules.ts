import { BetSelection, HouseRules, MarketBlock, Match, TicketReceipt } from '../types/sportsbook';

export const DEFAULT_HOUSE_RULES: HouseRules = {
  maxPrize: 30000.0,
  minStake: 2.0,
  maxStake: 5000.0,
  maxSelections: 20,
  oneOptionPerMatch: true,
};

export function formatOddBR(val: number): string {
  return (Number(val) || 1).toFixed(2).replace('.', ',');
}

export function formatCurrencyBR(val: number): string {
  const num = Number(val) || 0;
  return num.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatBRL(val: number): string {
  return `R$ ${formatCurrencyBR(val)}`;
}

export function getInitials(name: string): string {
  if (!name) return '365';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function generateRandomPin(): string {
  const p1 = Math.floor(100 + Math.random() * 900);
  const p2 = Math.floor(100 + Math.random() * 900);
  return `${p1}-${p2}`;
}

export interface ToggleBetResult {
  updatedSlip: BetSelection[];
  action: 'added' | 'removed' | 'replaced' | 'max_limit_reached';
}

/**
 * Enforces the 365 DA BARRA correlation rule:
 * Only 1 selection per match is allowed in the same betslip.
 * Selecting the same option removes it; selecting another option from the same match replaces it.
 */
export function toggleBetSelection(
  currentSlip: BetSelection[],
  newSelection: BetSelection,
  rules: HouseRules = DEFAULT_HOUSE_RULES
): ToggleBetResult {
  const existingIndex = currentSlip.findIndex((b) => b.matchId === newSelection.matchId);

  if (existingIndex > -1) {
    if (currentSlip[existingIndex].selection === newSelection.selection) {
      const next = currentSlip.filter((_, idx) => idx !== existingIndex);
      return { updatedSlip: next, action: 'removed' };
    } else {
      const next = [...currentSlip];
      next[existingIndex] = newSelection;
      return { updatedSlip: next, action: 'replaced' };
    }
  }

  if (currentSlip.length >= rules.maxSelections) {
    return { updatedSlip: currentSlip, action: 'max_limit_reached' };
  }

  return {
    updatedSlip: [...currentSlip, newSelection],
    action: 'added',
  };
}

export interface BetslipTotals {
  count: number;
  totalOdd: number;
  rawReturn: number;
  payout: number;
  isCapped: boolean;
  modalityLabel: string;
}

export function calculateBetslipTotals(
  slip: BetSelection[],
  stake: number,
  rules: HouseRules = DEFAULT_HOUSE_RULES
): BetslipTotals {
  const count = slip.length;
  const cleanStake = Math.max(0, Number(stake) || 0);

  if (count === 0) {
    return {
      count: 0,
      totalOdd: 1.0,
      rawReturn: 0,
      payout: 0,
      isCapped: false,
      modalityLabel: 'Nenhuma seleção',
    };
  }

  const totalOdd = +slip
    .reduce((acc, item) => acc * (Number(item.oddValue) || 1), 1)
    .toFixed(2);

  const rawReturn = +(cleanStake * totalOdd).toFixed(2);
  const payout = Math.min(rules.maxPrize, rawReturn);
  const isCapped = rawReturn > rules.maxPrize;

  let modalityLabel = 'Aposta Simples (1 Jogo)';
  if (count === 2) modalityLabel = 'Bilhete Duplo (2 Jogos)';
  else if (count === 3) modalityLabel = 'Bilhete Triplo (3 Jogos)';
  else if (count > 3) modalityLabel = `Múltipla (${count} Jogos)`;

  return {
    count,
    totalOdd,
    rawReturn,
    payout,
    isCapped,
    modalityLabel,
  };
}

export interface BetValidationResult {
  valid: boolean;
  error?: string;
}

export function validateBetPlacement(
  slip: BetSelection[],
  stake: number,
  clientBalance: number,
  asPreTicketPinOnly: boolean,
  rules: HouseRules = DEFAULT_HOUSE_RULES
): BetValidationResult {
  if (!slip || slip.length === 0) {
    return {
      valid: false,
      error: 'Selecione pelo menos 1 cotação (Casa, Empate ou Fora) antes de finalizar o bilhete.',
    };
  }

  const numStake = Number(stake) || 0;
  if (numStake < rules.minStake) {
    return {
      valid: false,
      error: `O valor mínimo de aposta na 365 DA BARRA é R$ ${formatCurrencyBR(rules.minStake)}.`,
    };
  }

  if (numStake > rules.maxStake) {
    return {
      valid: false,
      error: `O valor máximo permitido por aposta é R$ ${formatCurrencyBR(rules.maxStake)}.`,
    };
  }

  if (!asPreTicketPinOnly && numStake > clientBalance) {
    return {
      valid: false,
      error: 'Saldo insuficiente! Solicite liberação de saldo ao Admin ou clique em "Gerar Pré-Bilhete (PIN)".',
    };
  }

  return { valid: true };
}

export function computeRealOddsFromRecords(
  recordA: string,
  recordB: string,
  scoreA: number,
  scoreB: number,
  isLive: boolean
): { odd1: number; oddX: number; odd2: number } {
  const parseRec = (rec: string) => {
    if (!rec) return { w: 10, d: 8, l: 10, total: 28 };
    const parts = rec.split('-').map((n) => parseInt(n, 10) || 0);
    const w = parts[0] || 8;
    const d = parts[1] || 6;
    const l = parts[2] || 8;
    return { w, d, l, total: Math.max(1, w + d + l) };
  };

  const rA = parseRec(recordA);
  const rB = parseRec(recordB);

  let pA = ((rA.w / rA.total) * 0.55 + (rB.l / rB.total) * 0.45) * 1.15 + 0.08;
  let pB = ((rB.w / rB.total) * 0.55 + (rA.l / rA.total) * 0.45) * 0.92 + 0.06;
  let pD = 0.27;

  if (isLive) {
    if (scoreA > scoreB) {
      pA += 0.35 * (scoreA - scoreB);
      pB *= 0.45;
      pD *= 0.65;
    } else if (scoreB > scoreA) {
      pB += 0.35 * (scoreB - scoreA);
      pA *= 0.45;
      pD *= 0.65;
    } else {
      pD += 0.12;
    }
  }

  const sum = pA + pD + pB;
  const margin = 1.06;
  const odd1 = Math.max(1.12, Math.min(15.0, +(1 / ((pA / sum) * margin)).toFixed(2)));
  const oddX = Math.max(1.8, Math.min(11.0, +(1 / ((pD / sum) * margin)).toFixed(2)));
  const odd2 = Math.max(1.12, Math.min(17.0, +(1 / ((pB / sum) * margin)).toFixed(2)));

  return { odd1, oddX, odd2 };
}

export function buildWhatsAppTicketMessage(
  ticket: TicketReceipt,
  matches: Match[]
): string {
  const selectionsText = ticket.selections
    .map((s, idx) => {
      const m = matches.find((x) => x.id === s.matchId);
      const gameStr = m ? `${m.teamA} x ${m.teamB}` : 'Partida Oficial';
      return `${idx + 1}. *${s.selection}* (Odd ${formatOddBR(s.oddValue)})\n   _${s.marketName}_ • ${gameStr}`;
    })
    .join('\n\n');

  return (
    `🏆 *365 DA BARRA • COMPROVANTE OFICIAL*\n` +
    `-----------------------------------------\n` +
    `📌 *CÓDIGO PIN:* ${ticket.pin}\n` +
    `👤 *Apostador:* ${ticket.clientName}\n` +
    `📅 *Data/Hora:* ${ticket.createdAt}\n` +
    `📋 *Status:* ${ticket.status}\n` +
    `-----------------------------------------\n` +
    `⚽ *SELEÇÕES (${ticket.selections.length}):*\n\n${selectionsText}\n\n` +
    `-----------------------------------------\n` +
    `📊 *Cotação Total:* ${formatOddBR(ticket.totalOdd)}\n` +
    `💰 *Valor Apostado:* R$ ${formatCurrencyBR(ticket.stake)}\n` +
    `💵 *Possível Retorno:* R$ ${formatCurrencyBR(ticket.payout)}\n` +
    `-----------------------------------------\n` +
    `📲 *WhatsApp Cambista:* (14) 99195-1381\n` +
    `✅ _365 DA BARRA • Banca Oficial_`
  );
}

/**
 * Generates the complete 35-block (+280 to +380 options) betting catalog for a match.
 */
export function buildFullMatchMarketsCatalog(match: Match): MarketBlock[] {
  const o1 = Number(match.odds?.['1']) || 2.1;
  const oX = Number(match.odds?.['X']) || 3.25;
  const o2 = Number(match.odds?.['2']) || 3.4;

  const clampOdd = (val: number, fallback = 1.85) =>
    +Math.max(1.02, Math.min(85.0, Number(val) || fallback)).toFixed(2);

  const dc1X = clampOdd(1 / (1 / o1 + 1 / oX) * 0.95, 1.28);
  const dc12 = clampOdd(1 / (1 / o1 + 1 / o2) * 0.95, 1.32);
  const dcX2 = clampOdd(1 / (1 / oX + 1 / o2) * 0.95, 1.48);

  const dnb1 = clampOdd(o1 * 0.72, 1.52);
  const dnb2 = clampOdd(o2 * 0.72, 2.25);

  const bttsYes = match.markets?.btts?.yes || 1.8;
  const bttsNo = match.markets?.btts?.no || 1.95;

  const totalGoalsNow = (match.scoreA || 0) + (match.scoreB || 0);

  const pA = match.playersA || [];
  const pB = match.playersB || [];
  const getPlayerName = (list: typeof pA, reverseIdx: number, fallback: string) => {
    if (!list || list.length === 0) return fallback;
    const item = list[Math.max(0, list.length - reverseIdx)];
    return item ? item.name : fallback;
  };

  const pA1 = getPlayerName(pA, 1, `Centroavante (${match.shortA})`);
  const pA2 = getPlayerName(pA, 2, `Atacante (${match.shortA})`);
  const pA3 = getPlayerName(pA, 3, `Meia Ofensivo (${match.shortA})`);
  const pA4 = getPlayerName(pA, 4, `Camisa 10 (${match.shortA})`);

  const pB1 = getPlayerName(pB, 1, `Centroavante (${match.shortB})`);
  const pB2 = getPlayerName(pB, 2, `Atacante (${match.shortB})`);
  const pB3 = getPlayerName(pB, 3, `Meia Ofensivo (${match.shortB})`);
  const pB4 = getPlayerName(pB, 4, `Camisa 10 (${match.shortB})`);

  const blocks: MarketBlock[] = [
    // 1. PRINCIPAIS
    {
      id: 'm_1x2',
      cat: 'principais',
      title: 'Resultado Final (1x2 • Tempo Regulamentar)',
      badge: 'Mercado Principal',
      cols: 3,
      options: [
        { label: `${match.teamA} (Casa)`, odd: o1 },
        { label: 'Empate (X)', odd: oX },
        { label: `${match.teamB} (Fora)`, odd: o2 },
      ],
    },
    {
      id: 'm_dc',
      cat: 'principais',
      title: 'Dupla Hipótese (Chance Dupla)',
      badge: 'Proteção 2 Resultados',
      cols: 3,
      options: [
        { label: `${match.teamA} ou Empate (1X)`, odd: dc1X },
        { label: `${match.teamA} ou ${match.teamB} (12)`, odd: dc12 },
        { label: `Empate ou ${match.teamB} (X2)`, odd: dcX2 },
      ],
    },
    {
      id: 'm_dnb',
      cat: 'principais',
      title: 'Empate Anula a Aposta (Draw No Bet)',
      badge: 'Reembolso no Empate',
      cols: 2,
      options: [
        { label: `Empate Anula: ${match.teamA}`, odd: dnb1 },
        { label: `Empate Anula: ${match.teamB}`, odd: dnb2 },
      ],
    },
    {
      id: 'm_btts',
      cat: 'principais',
      title: 'Ambos os Times Marcam (BTTS)',
      badge: '90 Minutos',
      cols: 2,
      options: [
        { label: 'Ambos Marcam: Sim', odd: bttsYes },
        { label: 'Ambos Marcam: Não', odd: bttsNo },
      ],
    },
    {
      id: 'm_1x2_btts',
      cat: 'principais',
      title: 'Resultado Final & Ambos os Times Marcam',
      badge: 'Combo Especial',
      cols: 3,
      options: [
        { label: `${match.shortA} Vence & Ambos: Sim`, odd: clampOdd(o1 * 1.95, 3.8) },
        { label: `${match.shortA} Vence & Ambos: Não`, odd: clampOdd(o1 * 1.65, 3.2) },
        { label: 'Empate com Gols (Sim)', odd: 4.5 },
        { label: `${match.shortB} Vence & Ambos: Sim`, odd: clampOdd(o2 * 2.1, 4.9) },
        { label: `${match.shortB} Vence & Ambos: Não`, odd: clampOdd(o2 * 1.75, 4.1) },
        { label: 'Empate sem Gols (0-0)', odd: 8.5 },
      ],
    },
    {
      id: 'm_1x2_ou25',
      cat: 'principais',
      title: 'Resultado Final & Total de Gols (2.5)',
      badge: 'Combo Gols',
      cols: 3,
      options: [
        { label: `${match.shortA} & Mais de 2.5`, odd: clampOdd(o1 * 1.68, 3.1) },
        { label: 'Empate & Mais de 2.5', odd: 11.5 },
        { label: `${match.shortB} & Mais de 2.5`, odd: clampOdd(o2 * 1.78, 4.2) },
        { label: `${match.shortA} & Menos de 2.5`, odd: clampOdd(o1 * 1.92, 3.9) },
        { label: 'Empate & Menos de 2.5', odd: 3.95 },
        { label: `${match.shortB} & Menos de 2.5`, odd: clampOdd(o2 * 2.05, 5.1) },
      ],
    },
    {
      id: 'm_next_goal',
      cat: 'principais',
      title: `Próximo Time a Marcar (${totalGoalsNow + 1}º Gol)`,
      badge: 'Tempo Real',
      cols: 3,
      options: [
        { label: `Próximo Gol: ${match.teamA}`, odd: clampOdd(o1 * 0.78, 1.75) },
        { label: 'Sem Mais Gols na Partida', odd: clampOdd(7.5 - totalGoalsNow * 1.1, 6.5) },
        { label: `Próximo Gol: ${match.teamB}`, odd: clampOdd(o2 * 0.82, 2.15) },
      ],
    },

    // 2. GOLS
    {
      id: 'm_ou_full',
      cat: 'gols',
      title: 'Total de Gols na Partida (Mais / Menos • Todas as Linhas)',
      badge: 'Linhas 0.5 a 6.5',
      cols: 2,
      options: [
        { label: 'Mais de 0.5 Gols', odd: 1.07 },
        { label: 'Menos de 0.5 Gols', odd: 8.2 },
        { label: 'Mais de 1.5 Gols', odd: 1.32 },
        { label: 'Menos de 1.5 Gols', odd: 3.25 },
        { label: 'Mais de 2.5 Gols', odd: 1.88 },
        { label: 'Menos de 2.5 Gols', odd: 1.9 },
        { label: 'Mais de 3.5 Gols', odd: 3.1 },
        { label: 'Menos de 3.5 Gols', odd: 1.35 },
        { label: 'Mais de 4.5 Gols', odd: 5.8 },
        { label: 'Menos de 4.5 Gols', odd: 1.12 },
        { label: 'Mais de 5.5 Gols', odd: 11.5 },
        { label: 'Menos de 5.5 Gols', odd: 1.04 },
      ],
    },
    {
      id: 'm_ou_asian',
      cat: 'gols',
      title: 'Linhas Asiáticas de Gols (Total Asiático)',
      badge: 'Reembolso Parcial/Total',
      cols: 2,
      options: [
        { label: 'Gols Asiático: Mais de 1.75', odd: 1.44 },
        { label: 'Gols Asiático: Menos de 1.75', odd: 2.68 },
        { label: 'Gols Asiático: Mais de 2.0', odd: 1.56 },
        { label: 'Gols Asiático: Menos de 2.0', odd: 2.38 },
        { label: 'Gols Asiático: Mais de 2.25', odd: 1.72 },
        { label: 'Gols Asiático: Menos de 2.25', odd: 2.08 },
        { label: 'Gols Asiático: Mais de 2.75', odd: 2.12 },
        { label: 'Gols Asiático: Menos de 2.75', odd: 1.7 },
        { label: 'Gols Asiático: Mais de 3.0', odd: 2.55 },
        { label: 'Gols Asiático: Menos de 3.0', odd: 1.5 },
      ],
    },
    {
      id: 'm_home_ou',
      cat: 'gols',
      title: `Total de Gols: ${match.teamA} (Mandante)`,
      badge: 'Gols Casa',
      cols: 2,
      options: [
        { label: `${match.shortA}: Mais de 0.5 Gols`, odd: clampOdd(o1 * 0.58, 1.18) },
        { label: `${match.shortA}: Menos de 0.5 Gols`, odd: clampOdd(4.2 / (o1 * 0.5), 2.2) },
        { label: `${match.shortA}: Mais de 1.5 Gols`, odd: clampOdd(o1 * 0.98, 1.85) },
        { label: `${match.shortA}: Menos de 1.5 Gols`, odd: 1.85 },
        { label: `${match.shortA}: Mais de 2.5 Gols`, odd: clampOdd(o1 * 1.95, 3.6) },
        { label: `${match.shortA}: Menos de 2.5 Gols`, odd: 1.24 },
      ],
    },
    {
      id: 'm_away_ou',
      cat: 'gols',
      title: `Total de Gols: ${match.teamB} (Visitante)`,
      badge: 'Gols Fora',
      cols: 2,
      options: [
        { label: `${match.shortB}: Mais de 0.5 Gols`, odd: clampOdd(o2 * 0.55, 1.25) },
        { label: `${match.shortB}: Menos de 0.5 Gols`, odd: clampOdd(3.8 / (o2 * 0.45), 1.95) },
        { label: `${match.shortB}: Mais de 1.5 Gols`, odd: clampOdd(o2 * 1.05, 2.15) },
        { label: `${match.shortB}: Menos de 1.5 Gols`, odd: 1.65 },
        { label: `${match.shortB}: Mais de 2.5 Gols`, odd: clampOdd(o2 * 2.2, 4.4) },
        { label: `${match.shortB}: Menos de 2.5 Gols`, odd: 1.18 },
      ],
    },
    {
      id: 'm_goal_bands',
      cat: 'gols',
      title: 'Faixas de Gols na Partida & Ímpar/Par',
      badge: 'Multi-Gols',
      cols: 4,
      options: [
        { label: 'Faixa: 0 a 1 Gol', odd: 3.15 },
        { label: 'Faixa: 1 a 2 Gols', odd: 1.98 },
        { label: 'Faixa: 2 a 3 Gols', odd: 1.95 },
        { label: 'Faixa: 3 a 5 Gols', odd: 2.1 },
        { label: 'Total de Gols: Ímpar', odd: 1.9 },
        { label: 'Total de Gols: Par', odd: 1.86 },
        { label: 'Gols em Ambos os Tempos: Sim', odd: 1.74 },
        { label: 'Gols em Ambos os Tempos: Não', odd: 2.02 },
      ],
    },

    // 3. 1º E 2º TEMPO
    {
      id: 'm_ht_1x2',
      cat: 'tempos',
      title: 'Resultado do 1º Tempo (Intervalo)',
      badge: '1º Tempo',
      cols: 3,
      options: [
        { label: `1º Tempo: ${match.teamA}`, odd: clampOdd(o1 * 1.28, 2.4) },
        { label: '1º Tempo: Empate', odd: 2.1 },
        { label: `1º Tempo: ${match.teamB}`, odd: clampOdd(o2 * 1.32, 2.75) },
      ],
    },
    {
      id: 'm_ht_ou',
      cat: 'tempos',
      title: 'Total de Gols no 1º Tempo (Mais / Menos)',
      badge: '1º Tempo',
      cols: 2,
      options: [
        { label: '1ºT: Mais de 0.5 Gols', odd: 1.38 },
        { label: '1ºT: Menos de 0.5 Gols', odd: 2.9 },
        { label: '1ºT: Mais de 1.5 Gols', odd: 2.75 },
        { label: '1ºT: Menos de 1.5 Gols', odd: 1.42 },
        { label: '1ºT Ambos Marcam: Sim', odd: 4.3 },
        { label: '1ºT Ambos Marcam: Não', odd: 1.2 },
      ],
    },
    {
      id: 'm_2h_1x2_dc',
      cat: 'tempos',
      title: 'Resultado & Gols do 2º Tempo',
      badge: '2º Tempo',
      cols: 3,
      options: [
        { label: `2º Tempo: ${match.teamA}`, odd: clampOdd(o1 * 1.18, 2.2) },
        { label: '2º Tempo: Empate', odd: 2.35 },
        { label: `2º Tempo: ${match.teamB}`, odd: clampOdd(o2 * 1.22, 2.55) },
        { label: '2ºT: Mais de 0.5 Gols', odd: 1.25 },
        { label: '2ºT: Mais de 1.5 Gols', odd: 2.15 },
        { label: '2ºT Ambos Marcam: Sim', odd: 3.3 },
      ],
    },
    {
      id: 'm_ht_ft',
      cat: 'tempos',
      title: 'Intervalo / Final do Jogo (HT / FT)',
      badge: '9 Combinações',
      cols: 3,
      options: [
        { label: `${match.shortA} / ${match.shortA}`, odd: clampOdd(o1 * 1.55, 2.95) },
        { label: `${match.shortA} / Empate`, odd: 14.5 },
        { label: `${match.shortA} / ${match.shortB}`, odd: 29.0 },
        { label: `Empate / ${match.shortA}`, odd: clampOdd(o1 * 2.15, 4.6) },
        { label: 'Empate / Empate', odd: 4.8 },
        { label: `Empate / ${match.shortB}`, odd: clampOdd(o2 * 2.2, 5.4) },
        { label: `${match.shortB} / ${match.shortA}`, odd: 26.0 },
        { label: `${match.shortB} / Empate`, odd: 14.5 },
        { label: `${match.shortB} / ${match.shortB}`, odd: clampOdd(o2 * 1.6, 3.6) },
      ],
    },

    // 4. PLACAR EXATO
    {
      id: 'm_cs_full',
      cat: 'placar',
      title: "Placar Exato Completo (Tempo Regulamentar 90')",
      badge: 'Placares Oficiais',
      cols: 4,
      options: [
        { label: 'Placar Exato 1 - 0', odd: clampOdd(o1 * 2.9, 5.8) },
        { label: 'Placar Exato 2 - 0', odd: clampOdd(o1 * 3.8, 7.8) },
        { label: 'Placar Exato 2 - 1', odd: clampOdd(o1 * 3.9, 8.2) },
        { label: 'Placar Exato 3 - 0', odd: clampOdd(o1 * 6.8, 14.0) },
        { label: 'Placar Exato 3 - 1', odd: clampOdd(o1 * 7.2, 15.0) },
        { label: 'Placar Exato 3 - 2', odd: 26.0 },
        { label: 'Placar Exato 0 - 0', odd: 8.2 },
        { label: 'Placar Exato 1 - 1', odd: 6.1 },
        { label: 'Placar Exato 2 - 2', odd: 13.5 },
        { label: 'Placar Exato 0 - 1', odd: clampOdd(o2 * 3.1, 6.8) },
        { label: 'Placar Exato 0 - 2', odd: clampOdd(o2 * 4.5, 10.5) },
        { label: 'Placar Exato 1 - 2', odd: clampOdd(o2 * 4.1, 9.2) },
        { label: 'Placar Exato 0 - 3', odd: 23.0 },
        { label: 'Placar Exato 1 - 3', odd: 21.0 },
        { label: `Outro Placar: ${match.shortA} Vence`, odd: 19.0 },
        { label: `Outro Placar: ${match.shortB} Vence`, odd: 26.0 },
      ],
    },
    {
      id: 'm_cs_groups',
      cat: 'placar',
      title: 'Placar Exato Múltiplo (Grupos de Resultados)',
      badge: 'Maior Chance de Acerto',
      cols: 4,
      options: [
        { label: `${match.shortA}: 1-0, 2-0 ou 3-0`, odd: clampOdd(o1 * 1.45, 2.95) },
        { label: `${match.shortA}: 2-1, 3-1 ou 4-1`, odd: clampOdd(o1 * 2.1, 4.5) },
        { label: `${match.shortB}: 0-1, 0-2 ou 0-3`, odd: clampOdd(o2 * 1.55, 3.6) },
        { label: `${match.shortB}: 1-2, 1-3 ou 1-4`, odd: clampOdd(o2 * 2.25, 5.1) },
        { label: 'Empate: 1-1, 2-2 ou 3-3', odd: 4.3 },
        { label: 'Qualquer Vitória por 1-0', odd: 4.1 },
        { label: 'Qualquer Vitória por 2-0', odd: 5.2 },
        { label: 'Qualquer Vitória por 2-1', odd: 4.8 },
      ],
    },

    // 5. ESCANTEIOS
    {
      id: 'm_corners_ou',
      cat: 'escanteios',
      title: 'Total de Escanteios (Mais / Menos • Todas as Linhas)',
      badge: 'Linhas 7.5 a 12.5',
      cols: 2,
      options: [
        { label: 'Escanteios: Mais de 7.5', odd: 1.32 },
        { label: 'Escanteios: Menos de 7.5', odd: 3.2 },
        { label: 'Escanteios: Mais de 8.5', odd: 1.54 },
        { label: 'Escanteios: Menos de 8.5', odd: 2.38 },
        { label: 'Escanteios: Mais de 9.5', odd: 1.85 },
        { label: 'Escanteios: Menos de 9.5', odd: 1.9 },
        { label: 'Escanteios: Mais de 10.5', odd: 2.3 },
        { label: 'Escanteios: Menos de 10.5', odd: 1.58 },
        { label: 'Escanteios: Mais de 11.5', odd: 3.05 },
        { label: 'Escanteios: Menos de 11.5', odd: 1.35 },
        { label: 'Escanteios: Mais de 12.5', odd: 4.2 },
        { label: 'Escanteios: Menos de 12.5', odd: 1.2 },
      ],
    },
    {
      id: 'm_corners_race',
      cat: 'escanteios',
      title: 'Corrida de Escanteios & Vencedor em Cantos',
      badge: 'Race to Corners',
      cols: 3,
      options: [
        { label: `Mais Cantos: ${match.teamA}`, odd: 1.72 },
        { label: 'Empate em Escanteios', odd: 7.5 },
        { label: `Mais Cantos: ${match.teamB}`, odd: 2.45 },
        { label: `Primeiro a 3 Cantos: ${match.shortA}`, odd: 1.65 },
        { label: `Primeiro a 3 Cantos: ${match.shortB}`, odd: 2.25 },
        { label: 'Nenhum chega a 3 Cantos', odd: 15.0 },
        { label: `Primeiro a 5 Cantos: ${match.shortA}`, odd: 1.9 },
        { label: `Primeiro a 5 Cantos: ${match.shortB}`, odd: 2.75 },
        { label: 'Nenhum chega a 5 Cantos', odd: 3.9 },
      ],
    },

    // 6. CARTÕES
    {
      id: 'm_cards_ou',
      cat: 'cartoes',
      title: 'Total de Cartões na Partida & Especiais de Arbitragem',
      badge: "Disciplina 90'",
      cols: 2,
      options: [
        { label: 'Cartões: Mais de 3.5', odd: 1.52 },
        { label: 'Cartões: Menos de 3.5', odd: 2.42 },
        { label: 'Cartões: Mais de 4.5', odd: 1.92 },
        { label: 'Cartões: Menos de 4.5', odd: 1.82 },
        { label: 'Cartões: Mais de 5.5', odd: 2.65 },
        { label: 'Cartões: Menos de 5.5', odd: 1.45 },
        { label: 'Cartão Vermelho no Jogo: Sim', odd: 3.95 },
        { label: 'Cartão Vermelho no Jogo: Não', odd: 1.22 },
        { label: 'Pênalti Marcado no Jogo: Sim', odd: 2.85 },
        { label: 'Pênalti Marcado no Jogo: Não', odd: 1.4 },
      ],
    },

    // 7. HANDICAP
    {
      id: 'm_ah_2way',
      cat: 'handicap',
      title: 'Handicap Asiático & Europeu Completo',
      badge: 'Linhas -1.5 a +1.5',
      cols: 2,
      options: [
        { label: `${match.shortA} (-1.5 Asiático)`, odd: clampOdd(o1 * 1.92, 3.2) },
        { label: `${match.shortB} (+1.5 Asiático)`, odd: 1.34 },
        { label: `${match.shortA} (-0.5 Asiático)`, odd: o1 },
        { label: `${match.shortB} (+0.5 Asiático)`, odd: dcX2 },
        { label: `${match.shortA} (0.0 Asiático)`, odd: dnb1 },
        { label: `${match.shortB} (0.0 Asiático)`, odd: dnb2 },
        { label: `${match.shortA} (+0.5 Asiático)`, odd: dc1X },
        { label: `${match.shortB} (-0.5 Asiático)`, odd: o2 },
      ],
    },

    // 8. JOGADORES & ESPECIAIS
    {
      id: 'm_player_anytime',
      cat: 'jogadores',
      title: 'Jogador para Marcar a Qualquer Momento (90 Minutos)',
      badge: 'Atletas Escalados',
      cols: 4,
      options: [
        { label: `Gol: ${pA1}`, odd: 2.3 },
        { label: `Gol: ${pA2}`, odd: 2.85 },
        { label: `Gol: ${pA3}`, odd: 3.2 },
        { label: `Gol: ${pA4}`, odd: 3.6 },
        { label: `Gol: ${pB1}`, odd: 2.55 },
        { label: `Gol: ${pB2}`, odd: 3.1 },
        { label: `Gol: ${pB3}`, odd: 3.5 },
        { label: `Gol: ${pB4}`, odd: 3.95 },
      ],
    },
    {
      id: 'm_player_first',
      cat: 'jogadores',
      title: 'Primeiro Jogador a Marcar & Assistências',
      badge: 'Destaques Individuais',
      cols: 4,
      options: [
        { label: `1º Gol: ${pA1}`, odd: 4.8 },
        { label: `1º Gol: ${pA2}`, odd: 6.2 },
        { label: `1º Gol: ${pB1}`, odd: 5.4 },
        { label: `1º Gol: ${pB2}`, odd: 6.8 },
        { label: `Assistência: ${pA2}`, odd: 3.4 },
        { label: `Assistência: ${pA3}`, odd: 3.9 },
        { label: `Assistência: ${pB2}`, odd: 3.75 },
        { label: `Assistência: ${pB3}`, odd: 4.3 },
      ],
    },
  ];

  return blocks;
}
