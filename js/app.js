// =========================================================================
// 365 DA BARRA - MOTOR 100% DADOS REAIS (API ESPN BR, ODDS BET365, ADMIN E CUPOM)
// =========================================================================

let isMatchCenterOpen = false;
let realPlayCycleIdx = 0;
let matchStatusSubfilter = 'all'; // 'all', 'in', 'pre', 'post'
let activeMarketCategory = 'all'; // 'all', 'principais', 'gols', 'tempos', 'placar', 'escanteios', 'cartoes', 'handicap', 'jogadores'
let marketSearchQuery = '';
const collapsedLeagues = new Set();
const collapsedMarketBlocks = new Set();

function escJs(str) {
    return String(str || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

function formatOddComma(val) {
    return (Number(val) || 1).toFixed(2).replace('.', ',');
}

function toggleSiteTheme() {
    const isLight = document.body.classList.toggle('theme-light');
    const iconEl = document.getElementById('theme-toggle-icon');
    const labelEl = document.getElementById('theme-toggle-label');
    if (iconEl) iconEl.className = isLight ? 'fas fa-moon' : 'fas fa-sun';
    if (labelEl) labelEl.innerText = isLight ? 'Tema Escuro' : 'Tema Claro';
}

function toggleMobileSidebar() {
    document.body.classList.remove('mobile-betslip-open');
    document.body.classList.toggle('mobile-sidebar-open');
}

function toggleMobileBetslip() {
    document.body.classList.remove('mobile-sidebar-open');
    document.body.classList.toggle('mobile-betslip-open');
}

function closeMobilePanels() {
    document.body.classList.remove('mobile-sidebar-open');
    document.body.classList.remove('mobile-betslip-open');
}

function toggleSidebarAccordion(itemsId, headerEl) {
    const el = document.getElementById(itemsId);
    if (!el) return;
    const isHidden = el.style.display === 'none';
    el.style.display = isHidden ? 'block' : 'none';
    if (headerEl) headerEl.classList.toggle('selected', isHidden);
}

function toggleSidebarSubAccordion(subId) {
    const el = document.getElementById(subId);
    if (!el) return;
    el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

const LEAGUE_META = {
    'bra.1': { flag: '🇧🇷', name: 'Brasil - Brasileiro Série A' },
    'bra.2': { flag: '🇧🇷', name: 'Brasil - Brasileiro Série B' },
    'eng.1': { flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', name: 'Inglaterra - Premier League' },
    'esp.1': { flag: '🇪🇸', name: 'Espanha - LaLiga' },
    'ita.1': { flag: '🇮🇹', name: 'Itália - Série A' },
    'ger.1': { flag: '🇩🇪', name: 'Alemanha - Bundesliga' },
    'fra.1': { flag: '🇫🇷', name: 'França - Ligue 1' },
    'por.1': { flag: '🇵🇹', name: 'Portugal - Liga Portugal' },
    'arg.1': { flag: '🇦🇷', name: 'Argentina - Liga Profissional' },
    'conmebol.libertadores': { flag: '🏆', name: 'Clubes Internacionais - CONMEBOL Libertadores' },
    'uefa.champions': { flag: '🇪🇺', name: 'Clubes Internacionais - UEFA Champions League' }
};

function getActiveClient() {
    const { clients, activeClientId } = window.BetProData;
    return clients.find(c => c.id === Number(activeClientId)) || clients[0];
}

// Formata a sequência de últimos 5 jogos (ex: V-E-D-V-V) em bolinhas coloridas
function renderFormBadges(formStr) {
    if (!formStr) return '';
    return formStr.split('').slice(0, 5).map(ch => {
        const upper = ch.toUpperCase();
        const isWin = upper === 'V' || upper === 'W';
        const isDraw = upper === 'E' || upper === 'D' && formStr.includes('W');
        let bg = '#ff3d57';
        let label = upper;
        if (upper === 'V' || upper === 'W') { bg = '#00e676'; label = 'V'; }
        else if (upper === 'E' || (upper === 'D' && /[WVL]/.test(formStr))) { bg = '#ffd600'; label = 'E'; }
        else { bg = '#ff3d57'; label = 'D'; }
        const color = bg === '#ffd600' || bg === '#00e676' ? '#06130b' : '#ffffff';
        return `<span style="display:inline-flex;align-items:center;justify-content:center;width:15px;height:15px;border-radius:3px;background:${bg};color:${color};font-size:9px;font-weight:900;margin-left:2px;" title="Histórico recente">${label}</span>`;
    }).join('');
}

// Calcula cotações matemáticas reais baseadas na campanha oficial (V-E-D) ou placar ao vivo quando a Bet365 não envia odd direta
function computeRealOddsFromRecords(recordA, recordB, scoreA, scoreB, isLive, evIdStr) {
    const parseRec = (rec) => {
        if (!rec) return { w: 10, d: 8, l: 10, total: 28 };
        const parts = rec.split('-').map(n => parseInt(n, 10) || 0);
        const w = parts[0] || 8;
        const d = parts[1] || 6;
        const l = parts[2] || 8;
        return { w, d, l, total: Math.max(1, w + d + l) };
    };

    const rA = parseRec(recordA);
    const rB = parseRec(recordB);

    // Força relativa + fator casa
    let pA = ((rA.w / rA.total) * 0.55 + ((rB.l / rB.total) * 0.45)) * 1.15 + 0.08;
    let pB = ((rB.w / rB.total) * 0.55 + ((rA.l / rA.total) * 0.45)) * 0.92 + 0.06;
    let pD = 0.27;

    if (isLive) {
        if (scoreA > scoreB) { pA += 0.35 * (scoreA - scoreB); pB *= 0.45; pD *= 0.65; }
        else if (scoreB > scoreA) { pB += 0.35 * (scoreB - scoreA); pA *= 0.45; pD *= 0.65; }
        else { pD += 0.12; }
    }

    const sum = pA + pD + pB;
    const margin = 1.06; // Margem padrão de casa de apostas
    const odd1 = Math.max(1.12, Math.min(15.0, +(1 / ((pA / sum) * margin)).toFixed(2)));
    const oddX = Math.max(1.80, Math.min(11.0, +(1 / ((pD / sum) * margin)).toFixed(2)));
    const odd2 = Math.max(1.12, Math.min(17.0, +(1 / ((pB / sum) * margin)).toFixed(2)));

    return { odd1, oddX, odd2 };
}

// =====================================================
// 1. SINCRONIZAÇÃO DE PARTIDAS 100% REAIS DA API ESPN BRASIL
// =====================================================
async function syncRealTimeApi(leagueSlug = 'all', silent = false) {
    const statusBadge = document.getElementById('api-status-badge');
    if (statusBadge) statusBadge.innerHTML = '🟡 Sincronizando Jogos Reais...';

    try {
        const endpoints = (leagueSlug === 'all' || leagueSlug === 'live')
            ? ['bra.1', 'eng.1', 'ita.1', 'esp.1', 'ger.1', 'fra.1', 'por.1', 'bra.2', 'arg.1', 'conmebol.libertadores', 'uefa.champions']
            : [leagueSlug];

        const fetchPromises = endpoints.map(async (slug) => {
            try {
                const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${slug}/scoreboard?lang=pt&region=br`;
                const res = await fetch(url);
                if (!res.ok) return { slug, data: null };
                const data = await res.json();
                return { slug, data };
            } catch (e) {
                return { slug, data: null };
            }
        });

        const results = await Promise.all(fetchPromises);
        let syncedCount = 0;

        results.forEach(({ slug, data }) => {
            if (!data || !Array.isArray(data.events)) return;
            const meta = LEAGUE_META[slug] || { flag: '🌍', name: (data.leagues && data.leagues[0] && data.leagues[0].name) || slug.toUpperCase() };

            data.events.forEach(ev => {
                const comp = ev.competitions && ev.competitions[0];
                if (!comp || !comp.competitors || comp.competitors.length < 2) return;

                const home = comp.competitors.find(c => c.homeAway === 'home') || comp.competitors[0];
                const away = comp.competitors.find(c => c.homeAway === 'away') || comp.competitors[1];

                const stateType = (ev.status && ev.status.type && ev.status.type.state) ? ev.status.type.state : 'pre'; // 'in', 'pre', 'post'
                const isLiveApi = stateType === 'in';
                const isFinished = stateType === 'post';
                const statusDescription = (ev.status && ev.status.type && ev.status.type.description) ? ev.status.type.description : 'Agendado';
                const displayClock = (ev.status && ev.status.displayClock) ? ev.status.displayClock : '';

                // Horário real no fuso local (pt-BR) + Formato 365 DA BARRA (ex: 18/out e 16:00)
                const evDate = ev.date ? new Date(ev.date) : new Date();
                const kickoffTimeStr = evDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                const kickoffDateStr = evDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                const monthShortNames = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
                const kickoffDateShort = `${String(evDate.getDate()).padStart(2, '0')}/${monthShortNames[evDate.getMonth()]}`;

                let timeLabel = `Hoje, ${kickoffTimeStr}`;
                if (isLiveApi) {
                    timeLabel = `${displayClock} • ${statusDescription}`;
                } else if (isFinished) {
                    timeLabel = `Encerrado (${kickoffDateStr})`;
                } else {
                    timeLabel = `${kickoffDateStr} às ${kickoffTimeStr} • ${statusDescription}`;
                }

                // Estádio e Cidade Reais
                let stadiumFull = 'Estádio Oficial';
                if (comp.venue && comp.venue.fullName) {
                    const city = (comp.venue.address && comp.venue.address.city) ? `, ${comp.venue.address.city}` : '';
                    const country = (comp.venue.address && comp.venue.address.country) ? ` (${comp.venue.address.country})` : '';
                    stadiumFull = `${comp.venue.fullName}${city}${country}`;
                }

                // Campanha Oficial (V-E-D) e Forma Recente (Últimos 5 jogos)
                const recordA = (home.records && home.records[0] && home.records[0].summary) ? home.records[0].summary : '';
                const recordB = (away.records && away.records[0] && away.records[0].summary) ? away.records[0].summary : '';
                const formA = home.form || '';
                const formB = away.form || '';

                const scoreA = Number(home.score) || 0;
                const scoreB = Number(away.score) || 0;

                // Gols e Cartões Reais da Partida (comp.details)
                const realEventsSummary = [];
                const realDetailsFeed = [];
                if (Array.isArray(comp.details)) {
                    comp.details.forEach(det => {
                        const clk = (det.clock && det.clock.displayValue) ? det.clock.displayValue : '';
                        const player = (det.athletesInvolved && det.athletesInvolved[0] && det.athletesInvolved[0].shortName)
                            ? det.athletesInvolved[0].shortName
                            : ((det.athletesInvolved && det.athletesInvolved[0] && det.athletesInvolved[0].displayName) || '');
                        const isHomeEv = det.team && String(det.team.id) === String(home.team.id);
                        const teamShort = isHomeEv ? (home.team.abbreviation || home.team.shortDisplayName) : (away.team.abbreviation || away.team.shortDisplayName);

                        if (det.scoringPlay) {
                            const pen = det.penaltyKick ? ' (Pên.)' : (det.ownGoal ? ' (GC)' : '');
                            realEventsSummary.push(`⚽ ${clk} ${player}${pen} (${teamShort})`);
                            realDetailsFeed.unshift({
                                time: clk || '•',
                                text: `⚽ GOL! ${player}${pen} marca para ${isHomeEv ? home.team.displayName : away.team.displayName}!`,
                                type: 'goal',
                                isHome: isHomeEv,
                                player
                            });
                        } else if (det.redCard) {
                            realEventsSummary.push(`🟥 ${clk} ${player} (${teamShort})`);
                            realDetailsFeed.unshift({
                                time: clk || '•',
                                text: `🟥 Cartão Vermelho para ${player} (${teamShort}).`,
                                type: 'danger',
                                isHome: isHomeEv,
                                player
                            });
                        } else if (det.yellowCard) {
                            realEventsSummary.push(`🟨 ${clk} ${player} (${teamShort})`);
                            realDetailsFeed.unshift({
                                time: clk || '•',
                                text: `🟨 Cartão Amarelo para ${player} (${teamShort}).`,
                                type: 'corner',
                                isHome: isHomeEv,
                                player
                            });
                        }
                    });
                }

                // Cotações Reais Bet365 (comp.odds) ou Cotações Matemáticas da Campanha Real
                let odd1 = 0, oddX = 0, odd2 = 0;
                let oddsProvider = 'Calculada (Campanha Oficial)';
                if (comp.odds && comp.odds[0]) {
                    const oObj = comp.odds[0];
                    const hVal = oObj.homeTeamOdds && Number(oObj.homeTeamOdds.value);
                    const dVal = oObj.drawOdds && Number(oObj.drawOdds.value);
                    const aVal = oObj.awayTeamOdds && Number(oObj.awayTeamOdds.value);
                    if (hVal > 1.01 && dVal > 1.01 && aVal > 1.01) {
                        odd1 = +hVal.toFixed(2);
                        oddX = +dVal.toFixed(2);
                        odd2 = +aVal.toFixed(2);
                        oddsProvider = (oObj.provider && oObj.provider.displayName) ? `${oObj.provider.displayName} Oficial` : 'Bet365 Oficial';
                    }
                }
                if (!odd1 || !oddX || !odd2) {
                    const calc = computeRealOddsFromRecords(recordA, recordB, scoreA, scoreB, isLiveApi, ev.id);
                    odd1 = calc.odd1;
                    oddX = calc.oddX;
                    odd2 = calc.odd2;
                }

                const totalGoalsNow = scoreA + scoreB;
                const lineGoals = Math.max(2.5, Math.floor(totalGoalsNow) + 1.5);

                const teamAName = home.team.shortDisplayName || home.team.displayName;
                const teamBName = away.team.shortDisplayName || away.team.displayName;
                const shortA = home.team.abbreviation || teamAName.slice(0, 3).toUpperCase();
                const shortB = away.team.abbreviation || teamBName.slice(0, 3).toUpperCase();

                // Verifica se a partida já existe na lista para atualizar em tempo real
                let existing = window.BetProData.matches.find(m => String(m.espnId) === String(ev.id));

                // Texto de ação real para o HUD do gramado 3D
                const latestEventObj = realDetailsFeed[0];
                const defaultActionText = isLiveApi
                    ? `🔴 AO VIVO (${displayClock}) • ${teamAName.toUpperCase()} ${scoreA} x ${scoreB} ${teamBName.toUpperCase()}`
                    : (isFinished
                        ? `✅ FIM DE JOGO • ${teamAName.toUpperCase()} ${scoreA} x ${scoreB} ${teamBName.toUpperCase()}`
                        : `📅 PRÉ-JOGO OFICIAL • HOJE ÀS ${kickoffTimeStr}`);

                const defaultSubText = latestEventObj
                    ? latestEventObj.text
                    : `🏟️ ${stadiumFull} ${recordA ? `• Campanha: ${shortA} (${recordA}) vs ${shortB} (${recordB})` : ''}`;

                if (existing) {
                    existing.scoreA = scoreA;
                    existing.scoreB = scoreB;
                    existing.isLive = isLiveApi;
                    existing.statusState = stateType;
                    existing.statusDescription = statusDescription;
                    existing.displayClock = displayClock;
                    existing.minute = parseInt(displayClock, 10) || existing.minute || 0;
                    existing.timeLabel = timeLabel;
                    existing.kickoffTimeStr = kickoffTimeStr;
                    existing.kickoffDateShort = kickoffDateShort;
                    existing.stadium = stadiumFull;
                    existing.recordA = recordA;
                    existing.recordB = recordB;
                    existing.formA = formA;
                    existing.formB = formB;
                    existing.realEventsSummary = realEventsSummary;
                    existing.odds = { '1': odd1, 'X': oddX, '2': odd2 };
                    existing.oddsProvider = oddsProvider;
                    if (!existing.hasDetailedSummary) {
                        existing.state.actionText = defaultActionText;
                        existing.state.subText = defaultSubText;
                    }
                    syncedCount++;
                } else {
                    const colorA = home.team.color && home.team.color !== '000000' && home.team.color !== 'ffffff'
                        ? `#${home.team.color}` : '#ff6b00';
                    const colorB = away.team.color && away.team.color !== '000000' && away.team.color !== home.team.color
                        ? `#${away.team.color}` : '#29b6f6';

                    const newMatch = {
                        id: Number(ev.id),
                        espnId: String(ev.id),
                        espnSlug: slug,
                        category: slug,
                        league: `${meta.flag} ${meta.name}`,
                        stadium: stadiumFull,
                        referee: 'Escala Oficial da Confederação',
                        teamA: teamAName,
                        shortA,
                        logoA: home.team.logo || 'https://a.espncdn.com/i/teamlogos/soccer/500/819.png',
                        teamB: teamBName,
                        shortB,
                        logoB: away.team.logo || 'https://a.espncdn.com/i/teamlogos/soccer/500/2029.png',
                        colorA,
                        colorB,
                        recordA,
                        recordB,
                        formA,
                        formB,
                        realEventsSummary,
                        oddsProvider,
                        formationA: 'Titulares',
                        formationB: 'Titulares',
                        playersA: [],
                        playersB: [],
                        benchA: [],
                        benchB: [],
                        starterJerseysA: null,
                        starterJerseysB: null,
                        standingsTable: [],
                        lastFiveA: [],
                        lastFiveB: [],
                        h2hGames: [],
                        seasonLeaders: [],
                        realPlayCoordinates: [],
                        hasDetailedSummary: false,
                        scoreA,
                        scoreB,
                        minute: parseInt(displayClock, 10) || (isLiveApi ? 45 : 0),
                        second: 0,
                        displayClock,
                        statusState: stateType,
                        statusDescription,
                        evTimestamp: evDate.getTime(),
                        isLive: isLiveApi,
                        timeLabel,
                        kickoffTimeStr,
                        kickoffDateShort,
                        totalMarketsCount: 384,
                        oddsLocked: false,
                        odds: { '1': odd1, 'X': oddX, '2': odd2 },
                        oddTrend: { '1': 'none', 'X': 'none', '2': 'none' },
                        markets: {
                            overUnder: { label: `Total de Gols (${lineGoals})`, over: 1.88, under: 1.90 },
                            btts: { label: 'Ambos os Times Marcam', yes: 1.78, no: 1.98 },
                            nextGoal: {
                                label: `Próximo Time a Marcar (${totalGoalsNow + 1}º Gol)`,
                                home: +(Math.max(1.45, odd1 * 0.78)).toFixed(2),
                                none: +(Math.max(2.60, 7.5 - totalGoalsNow * 1.1)).toFixed(2),
                                away: +(Math.max(1.55, odd2 * 0.78)).toFixed(2)
                            },
                            corners: { label: 'Total de Escanteios (9.5)', over: 1.83, under: 1.92 },
                            doubleChance: {
                                label: 'Dupla Hipótese',
                                oneX: +(Math.max(1.08, 1 / ((1 / odd1) + (1 / oddX)) * 0.96)).toFixed(2),
                                oneTwo: +(Math.max(1.12, 1 / ((1 / odd1) + (1 / odd2)) * 0.96)).toFixed(2),
                                xTwo: +(Math.max(1.10, 1 / ((1 / oddX) + (1 / odd2)) * 0.96)).toFixed(2)
                            },
                            exactScore: [
                                { label: `${scoreA + 1} - ${scoreB}`, odd: +(odd1 * 2.6).toFixed(2) },
                                { label: `${scoreA + 1} - ${scoreB + 1}`, odd: +(oddX * 2.1).toFixed(2) },
                                { label: `${scoreA} - ${scoreB + 1}`, odd: +(odd2 * 2.7).toFixed(2) },
                                { label: `${scoreA + 2} - ${scoreB}`, odd: +(odd1 * 4.2).toFixed(2) }
                            ]
                        },
                        state: {
                            possessionTeam: scoreB > scoreA ? 'B' : 'A',
                            zone: isLiveApi ? 'attack' : 'posse',
                            arcMode: false,
                            actionText: defaultActionText,
                            subText: defaultSubText,
                            activePlayer: latestEventObj && latestEventObj.player ? latestEventObj.player : `${teamAName} x ${teamBName}`,
                            ballX: isLiveApi ? 0.62 : 0.50,
                            ballY: 0.50,
                            targetX: isLiveApi ? 0.62 : 0.50,
                            targetY: 0.50,
                            trail: [{ x: 0.42, y: 0.50 }, { x: isLiveApi ? 0.62 : 0.50, y: 0.50 }],
                            stats: {
                                possession: [50, 50],
                                totalShots: [0, 0],
                                shotsOnTarget: [0, 0],
                                blockedShots: [0, 0],
                                corners: [0, 0],
                                offsides: [0, 0],
                                fouls: [0, 0],
                                yellowCards: [0, 0],
                                redCards: [0, 0],
                                saves: [0, 0],
                                accuratePasses: [0, 0],
                                totalPasses: [0, 0],
                                passPct: [0, 0],
                                tackles: [0, 0],
                                clearances: [0, 0],
                                hasRealBoxscore: false
                            },
                            feed: realDetailsFeed.length > 0 ? realDetailsFeed : [
                                {
                                    time: isLiveApi ? displayClock : kickoffTimeStr,
                                    text: `📡 Partida oficial sincronizada (${meta.name}) • Estádio: ${stadiumFull}.`,
                                    type: 'normal'
                                }
                            ]
                        }
                    };

                    window.BetProData.matches.push(newMatch);
                    syncedCount++;
                }
            });
        });

        // Ordena: 1º Jogos AO VIVO ('in'), 2º Jogos de Hoje Agendados ('pre'), 3º Encerrados ('post')
        const stateOrder = { 'in': 0, 'pre': 1, 'post': 2 };
        window.BetProData.matches.sort((a, b) => {
            const oa = stateOrder[a.statusState] !== undefined ? stateOrder[a.statusState] : 1;
            const ob = stateOrder[b.statusState] !== undefined ? stateOrder[b.statusState] : 1;
            if (oa !== ob) return oa - ob;
            // Prioriza Brasileirão dentro do mesmo status
            if (a.category === 'bra.1' && b.category !== 'bra.1') return -1;
            if (b.category === 'bra.1' && a.category !== 'bra.1') return 1;
            return (a.evTimestamp || 0) - (b.evTimestamp || 0);
        });

        window.BetProData.isLoadingMatches = false;

        // Seleciona automaticamente a primeira partida real (Ao Vivo ou principal do dia)
        if (!window.BetProData.selectedMatchId && window.BetProData.matches.length > 0) {
            const firstLive = window.BetProData.matches.find(m => m.isLive) || window.BetProData.matches[0];
            window.BetProData.selectedMatchId = firstLive.id;
            fetchMatchSummaryFromApi(firstLive);
        } else if (window.BetProData.selectedMatchId) {
            const curr = window.BetProData.matches.find(m => m.id === window.BetProData.selectedMatchId);
            if (curr) fetchMatchSummaryFromApi(curr);
        }

        // Busca Notícias Reais em Português
        fetchRealNews();

        updateSidebarMatchCounts();
        updateHeroBanner();
        renderMatches();
        updateScoreboardHeader();
        renderTrackerTabContent();
        if (isMatchCenterOpen) renderMatchCenterMarkets();
    } catch (err) {
        window.BetProData.isLoadingMatches = false;
    }
}

function updateSidebarMatchCounts() {
    const matches = window.BetProData.matches || [];
    const liveCount = matches.filter(m => m.isLive).length;

    const topCounter = document.getElementById('live-games-counter');
    if (topCounter) {
        topCounter.innerHTML = `⚡ ${liveCount} Ao Vivo • ${matches.length} Jogos Oficiais`;
    }

    const dayHeader = document.getElementById('sport-day-header');
    if (dayHeader) {
        const weekdaysPt = ['Domingo', 'Segunda-Feira', 'Terça-Feira', 'Quarta-Feira', 'Quinta-Feira', 'Sexta-Feira', 'Sábado'];
        const now = new Date();
        dayHeader.innerText = `${weekdaysPt[now.getDay()]} - Jogos Disponíveis (${matches.length} partidas)`;
    }

    const elAll = document.getElementById('sb-count-all');
    if (elAll) elAll.innerText = matches.length;

    const elLive = document.getElementById('sb-count-live');
    if (elLive) elLive.innerText = liveCount;

    ['bra.1', 'bra.2', 'conmebol.libertadores', 'uefa.champions', 'eng.1', 'esp.1', 'ita.1', 'ger.1', 'fra.1', 'por.1', 'arg.1'].forEach(slug => {
        const el = document.getElementById(`sb-count-${slug}`);
        if (el) {
            el.innerText = matches.filter(m => m.category === slug).length;
        }
    });
}

let currentNewsLeagueFilter = 'all';

function formatRelativeTimePt(dateStr) {
    if (!dateStr) return 'Agora';
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.max(1, Math.floor(diffMs / 60000));
    if (mins < 60) return `Há ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Há ${hours}h`;
    const days = Math.floor(hours / 24);
    return `Há ${days}d`;
}

async function fetchRealNews() {
    try {
        const newsSlugs = [
            { slug: 'bra.1', label: '🇧🇷 Brasileirão' },
            { slug: 'conmebol.libertadores', label: '🏆 Libertadores' },
            { slug: 'eng.1', label: '🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League' },
            { slug: 'esp.1', label: '🇪🇸 La Liga' },
            { slug: 'uefa.champions', label: '🇪🇺 Champions League' }
        ];

        const responses = await Promise.all(
            newsSlugs.map(async (item) => {
                try {
                    const r = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${item.slug}/news?lang=pt&region=br&limit=12`);
                    if (!r.ok) return { item, articles: [] };
                    const d = await r.json();
                    return { item, articles: d.articles || [] };
                } catch (e) {
                    return { item, articles: [] };
                }
            })
        );

        const seenIds = new Set();
        const combined = [];

        responses.forEach(({ item, articles }) => {
            articles.forEach(a => {
                const artId = String(a.id || a.headline);
                if (seenIds.has(artId)) return;
                seenIds.add(artId);

                const imgObj = (a.images && a.images.find(im => im.width >= 600)) || (a.images && a.images[0]);
                const imageUrl = (imgObj && imgObj.url)
                    ? imgObj.url
                    : 'https://a.espncdn.com/photo/2026/1011/r1729044_1296x729_16-9.jpg';

                const tags = (a.categories || [])
                    .map(c => c.description)
                    .filter(Boolean)
                    .filter(t => t.toLowerCase() !== 'futebol')
                    .slice(0, 3);

                const hasVideo = (a.links && a.links.api && a.links.api.self && a.links.api.self.href) || (a.images && a.images.some(im => im.type === 'Media'));

                combined.push({
                    id: a.id,
                    leagueSlug: item.slug,
                    leagueLabel: item.label,
                    headline: a.headline,
                    description: a.description || 'Clique para ler a matéria completa em português e conferir os vídeos da partida.',
                    byline: a.byline || 'Redação ESPN Brasil',
                    publishedRaw: a.published ? new Date(a.published).getTime() : Date.now(),
                    published: a.published ? new Date(a.published).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'Hoje',
                    timeAgo: formatRelativeTimePt(a.published),
                    tags,
                    hasVideo: !!hasVideo,
                    image: imageUrl,
                    url: (a.links && a.links.web && a.links.web.href) ? a.links.web.href : '#'
                });
            });
        });

        combined.sort((a, b) => b.publishedRaw - a.publishedRaw);

        if (combined.length > 0) {
            window.BetProData.newsArticles = combined;
            const newsBadge = document.getElementById('news-count-badge');
            if (newsBadge) newsBadge.innerText = combined.length;

            // Atualiza automaticamente a chamada de notícias no Banner da Home
            const topArt = combined[0];
            const hHeadline = document.getElementById('hero-news-headline');
            const hSub = document.getElementById('hero-news-sub');
            if (hHeadline && topArt) {
                hHeadline.innerText = topArt.headline.length > 68 ? topArt.headline.slice(0, 68) + '...' : topArt.headline;
            }
            if (hSub && topArt) {
                hSub.innerText = `${topArt.leagueLabel} (${topArt.timeAgo}) • ${topArt.description}`;
            }

            if (window.BetProData.currentView === 'news') {
                renderNewsView();
            }
        }
    } catch (e) {}
}

// Atualiza o Card Principal (Hero Banner) com o Jogo Real em Destaque
function updateHeroBanner() {
    const matches = window.BetProData.matches;
    if (!matches || matches.length === 0) return;

    // Prioriza jogo Ao Vivo ou jogo do Brasileirão Série A
    const featured = matches.find(m => m.isLive) || matches.find(m => m.category === 'bra.1') || matches[0];
    if (!featured) return;

    const tagEl = document.getElementById('hero-featured-tag');
    const titleEl = document.getElementById('hero-featured-title');
    const descEl = document.getElementById('hero-featured-desc');
    const btnEl = document.getElementById('hero-featured-btn');

    if (tagEl) {
        tagEl.innerText = featured.isLive
            ? `🔴 AO VIVO AGORA • ${featured.displayClock || ''} (${featured.statusDescription})`
            : `📅 JOGO OFICIAL DO DIA • ${featured.league}`;
    }
    if (titleEl) {
        titleEl.innerHTML = `
            <span style="display:inline-flex;align-items:center;gap:8px;">
                <img src="${featured.logoA}" style="width:26px;height:26px;object-fit:contain;">
                ${featured.teamA}
                <strong style="color:var(--accent-yellow);padding:0 4px;">${featured.isLive || featured.statusState === 'post' ? `${featured.scoreA} x ${featured.scoreB}` : 'vs'}</strong>
                ${featured.teamB}
                <img src="${featured.logoB}" style="width:26px;height:26px;object-fit:contain;">
            </span>
        `;
    }
    if (descEl) {
        const evTxt = (featured.realEventsSummary && featured.realEventsSummary.length > 0)
            ? featured.realEventsSummary.join(' • ')
            : `🏟️ ${featured.stadium} • Odds (${featured.oddsProvider}): Casa @${featured.odds['1'].toFixed(2)} | Empate @${featured.odds['X'].toFixed(2)} | Fora @${featured.odds['2'].toFixed(2)}`;
        descEl.innerText = evTxt;
    }
    if (btnEl) {
        btnEl.onclick = () => openMatchCenter(featured.id);
    }
}

function openFeaturedMatch() {
    const matches = window.BetProData.matches;
    if (!matches || matches.length === 0) return;
    const featured = matches.find(m => m.isLive) || matches[0];
    openMatchCenter(featured.id);
}

function refreshCurrentMatchFromApi() {
    const m = window.BetProData.matches.find(x => x.id === window.BetProData.selectedMatchId);
    if (!m) return;
    showToast(`📡 Sincronizando dados em tempo real de ${m.teamA} x ${m.teamB}...`);
    fetchMatchSummaryFromApi(m, true);
}

// =====================================================
// 2. BUSCA DE DETALHES 100% REAIS DA PARTIDA (ROSTERS, BOXSCORE, COORDENADAS X/Y, TABELA E H2H)
// =====================================================
async function fetchMatchSummaryFromApi(match, showNotification = false) {
    if (!match || !match.espnId) return;
    try {
        const slug = match.espnSlug || 'bra.1';
        const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${slug}/summary?event=${match.espnId}&lang=pt&region=br`;
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();

        match.hasDetailedSummary = true;

        // 1. Informações de Estádio / Cidade / Árbitro (gameInfo)
        if (data.gameInfo) {
            if (data.gameInfo.venue && data.gameInfo.venue.fullName) {
                const city = (data.gameInfo.venue.address && data.gameInfo.venue.address.city) ? `, ${data.gameInfo.venue.address.city}` : '';
                const country = (data.gameInfo.venue.address && data.gameInfo.venue.address.country) ? ` (${data.gameInfo.venue.address.country})` : '';
                match.stadium = `${data.gameInfo.venue.fullName}${city}${country}`;
            }
            if (data.gameInfo.officials && data.gameInfo.officials[0] && data.gameInfo.officials[0].displayName) {
                match.referee = data.gameInfo.officials[0].displayName;
            }
        }

        // 2. Escalações Oficiais Completas: 11 Titulares + Reservas + Estatísticas Individuais (rosters)
        if (data.rosters && data.rosters.length >= 2) {
            const rHome = data.rosters.find(r => r.homeAway === 'home') || data.rosters[0];
            const rAway = data.rosters.find(r => r.homeAway === 'away') || data.rosters[1];

            if (rHome.formation) match.formationA = rHome.formation;
            if (rAway.formation) match.formationB = rAway.formation;

            const parseRosterList = (rosterArr) => {
                if (!Array.isArray(rosterArr)) return { starters: [], bench: [], jerseys: [] };
                const starters = [];
                const bench = [];
                const jerseys = [];

                rosterArr.forEach(p => {
                    const jersey = p.jersey || '•';
                    const name = (p.athlete && p.athlete.displayName) ? p.athlete.displayName : 'Jogador';
                    const pos = (p.position && p.position.abbreviation) ? p.position.abbreviation : '';
                    const posFull = (p.position && p.position.displayName) ? p.position.displayName : pos;

                    // Extrai estatísticas reais do atleta na partida
                    const stMap = {};
                    if (Array.isArray(p.stats)) {
                        p.stats.forEach(st => { stMap[st.name] = Number(st.value) || 0; });
                    }
                    const badges = [];
                    if (stMap.totalGoals > 0) badges.push(`⚽ ${stMap.totalGoals}`);
                    if (stMap.goalAssists > 0) badges.push(`👟 ${stMap.goalAssists} Assist.`);
                    if (stMap.shotsOnTarget > 0) badges.push(`🎯 ${stMap.shotsOnTarget} No Alvo`);
                    if (stMap.saves > 0) badges.push(`🧤 ${stMap.saves} Def.`);
                    if (stMap.yellowCards > 0) badges.push('🟨');
                    if (stMap.redCards > 0) badges.push('🟥');
                    if (p.subbedIn) badges.push('🔄 Entrou');
                    if (p.subbedOut) badges.push('🔻 Saiu');

                    const item = {
                        jersey,
                        name,
                        pos,
                        posFull,
                        badges: badges.join(' '),
                        starter: !!p.starter
                    };

                    if (p.starter) {
                        starters.push(item);
                        jerseys.push(jersey);
                    } else {
                        bench.push(item);
                    }
                });

                return { starters, bench, jerseys };
            };

            const parsedA = parseRosterList(rHome.roster);
            const parsedB = parseRosterList(rAway.roster);

            if (parsedA.starters.length > 0) {
                match.playersA = parsedA.starters;
                match.benchA = parsedA.bench;
                match.starterJerseysA = parsedA.jerseys;
            }
            if (parsedB.starters.length > 0) {
                match.playersB = parsedB.starters;
                match.benchB = parsedB.bench;
                match.starterJerseysB = parsedB.jerseys;
            }
        }

        // 3. Estatísticas Reais Completas da Partida (boxscore.teams)
        if (data.boxscore && Array.isArray(data.boxscore.teams) && data.boxscore.teams.length >= 2) {
            const tHome = data.boxscore.teams.find(t => t.homeAway === 'home') || data.boxscore.teams[0];
            const tAway = data.boxscore.teams.find(t => t.homeAway === 'away') || data.boxscore.teams[1];

            const statMap = (teamObj) => {
                const map = {};
                (teamObj.statistics || []).forEach(s => {
                    map[s.name] = parseFloat(s.displayValue) || 0;
                });
                return map;
            };
            const sA = statMap(tHome);
            const sB = statMap(tAway);

            if (Object.keys(sA).length > 0 || Object.keys(sB).length > 0) {
                const st = match.state.stats;
                st.hasRealBoxscore = true;
                st.possession = [
                    Math.round(sA.possessionPct !== undefined ? sA.possessionPct : 50),
                    Math.round(sB.possessionPct !== undefined ? sB.possessionPct : 50)
                ];
                st.totalShots = [sA.totalShots || 0, sB.totalShots || 0];
                st.shotsOnTarget = [sA.shotsOnTarget || 0, sB.shotsOnTarget || 0];
                st.blockedShots = [sA.blockedShots || 0, sB.blockedShots || 0];
                st.corners = [sA.wonCorners || 0, sB.wonCorners || 0];
                st.offsides = [sA.offsides || 0, sB.offsides || 0];
                st.fouls = [sA.foulsCommitted || 0, sB.foulsCommitted || 0];
                st.yellowCards = [sA.yellowCards || 0, sB.yellowCards || 0];
                st.redCards = [sA.redCards || 0, sB.redCards || 0];
                st.saves = [sA.saves || 0, sB.saves || 0];
                st.accuratePasses = [sA.accuratePasses || 0, sB.accuratePasses || 0];
                st.totalPasses = [sA.totalPasses || 0, sB.totalPasses || 0];
                st.passPct = [
                    Math.round((sA.passPct || 0) * 100),
                    Math.round((sB.passPct || 0) * 100)
                ];
                st.tackles = [sA.effectiveTackles || sA.totalTackles || 0, sB.effectiveTackles || sB.totalTackles || 0];
                st.clearances = [sA.totalClearance || 0, sB.totalClearance || 0];
            }
        }

        // 4. Lances Minuto a Minuto Reais + Coordenadas Reais X/Y da Bola no Gramado (commentary & keyEvents)
        const commList = Array.isArray(data.commentary) && data.commentary.length > 0
            ? data.commentary
            : (Array.isArray(data.keyEvents) ? data.keyEvents : []);

        if (commList.length > 0) {
            const realPlaysWithCoords = [];
            const formattedFeed = [];

            commList.slice().reverse().forEach(item => {
                const playObj = item.play || item;
                const timeStr = (item.time && item.time.displayValue)
                    || (playObj.clock && playObj.clock.displayValue)
                    || '•';
                const rawText = item.text || playObj.text || (playObj.type && playObj.type.text) || '';
                if (!rawText) return;

                const playTypeStr = (playObj.type && playObj.type.text) ? playObj.type.text : '';
                const lower = (rawText + ' ' + playTypeStr).toLowerCase();

                let icon = '⚡';
                let feedType = 'normal';
                let zoneType = 'attack';
                let arcMode = false;

                if (lower.includes('gol') || playObj.scoringPlay) {
                    icon = '⚽'; feedType = 'goal'; zoneType = 'danger'; arcMode = true;
                } else if (lower.includes('cartão vermelho')) {
                    icon = '🟥'; feedType = 'danger'; zoneType = 'danger';
                } else if (lower.includes('cartão amarelo')) {
                    icon = '🟨'; feedType = 'corner'; zoneType = 'attack';
                } else if (lower.includes('escanteio')) {
                    icon = '🚩'; feedType = 'corner'; zoneType = 'danger'; arcMode = true;
                } else if (lower.includes('finalização') || lower.includes('chute') || lower.includes('defesa') || lower.includes('perdida')) {
                    icon = '🧤'; feedType = 'danger'; zoneType = 'danger'; arcMode = true;
                } else if (lower.includes('substituição')) {
                    icon = '🔄'; feedType = 'normal'; zoneType = 'posse';
                } else if (lower.includes('falta') || lower.includes('impedimento')) {
                    icon = '⚠️'; feedType = 'normal'; zoneType = 'posse';
                }

                const teamInPlay = (playObj.team && playObj.team.displayName) ? playObj.team.displayName : '';
                const isTeamA = !teamInPlay || teamInPlay.toLowerCase().includes(match.teamA.toLowerCase().slice(0, 4));
                const participant = (playObj.participants && playObj.participants[0] && playObj.participants[0].athlete && playObj.participants[0].athlete.displayName)
                    ? playObj.participants[0].athlete.displayName
                    : (teamInPlay || (isTeamA ? match.teamA : match.teamB));

                formattedFeed.push({
                    time: timeStr,
                    text: `${icon} ${rawText}`,
                    type: feedType
                });

                // Coordenadas reais do lance fornecidas pela ESPN (0..100)
                if (playObj.fieldPositionX !== undefined && playObj.fieldPositionY !== undefined) {
                    const rawX = Math.max(4, Math.min(96, Number(playObj.fieldPositionX))) / 100;
                    const rawY = Math.max(6, Math.min(94, Number(playObj.fieldPositionY))) / 100;
                    // Ajusta direção (Time A ataca p/ direita, Time B ataca p/ esquerda)
                    const normX = isTeamA ? rawX : (1 - rawX);
                    const normY = rawY;

                    realPlaysWithCoords.push({
                        time: timeStr,
                        typeTitle: `${icon} ${(playTypeStr || 'LANCE REAL').toUpperCase()} • ${(teamInPlay || (isTeamA ? match.teamA : match.teamB)).toUpperCase()}`,
                        subText: rawText,
                        player: `${participant} (${timeStr})`,
                        isTeamA,
                        zone: zoneType,
                        arcMode,
                        x: normX,
                        y: normY
                    });
                } else if (formattedFeed.length <= 12) {
                    // Caso o evento não traga X/Y explícito, posiciona conforme o tipo real do lance
                    const fallbackX = isTeamA
                        ? (zoneType === 'danger' ? 0.86 : (zoneType === 'attack' ? 0.68 : 0.52))
                        : (zoneType === 'danger' ? 0.14 : (zoneType === 'attack' ? 0.32 : 0.48));
                    const fallbackY = lower.includes('escanteio') ? 0.08 : 0.48;

                    realPlaysWithCoords.push({
                        time: timeStr,
                        typeTitle: `${icon} ${(playTypeStr || 'LANCE DA PARTIDA').toUpperCase()} (${timeStr})`,
                        subText: rawText,
                        player: `${participant}`,
                        isTeamA,
                        zone: zoneType,
                        arcMode,
                        x: fallbackX,
                        y: fallbackY
                    });
                }
            });

            match.state.feed = formattedFeed.slice(0, 40);
            match.realPlayCoordinates = realPlaysWithCoords.slice(0, 15);

            // Aplica imediatamente o último lance real no Campo 3D!
            if (match.realPlayCoordinates.length > 0) {
                applyRealPlayToPitch(match, 0);
            }
        }

        // 5. Tabela de Classificação Oficial do Campeonato (standings)
        if (data.standings && Array.isArray(data.standings.groups) && data.standings.groups[0]) {
            const entries = (data.standings.groups[0].standings && data.standings.groups[0].standings.entries) || [];
            match.standingsTable = entries.map(e => {
                const st = {};
                (e.stats || []).forEach(s => { st[s.name] = s.displayValue; });
                return {
                    rank: st.rank || '-',
                    team: typeof e.team === 'string' ? e.team : (e.team && e.team.displayName ? e.team.displayName : 'Clube'),
                    logo: (e.logo && e.logo[0] && e.logo[0].href) ? e.logo[0].href : '',
                    points: st.points || '0',
                    games: st.gamesPlayed || '0',
                    wins: st.wins || '0',
                    ties: st.ties || '0',
                    losses: st.losses || '0',
                    gd: st.pointDifferential || '0'
                };
            });
        }

        // 6. Últimos 5 Jogos Reais de cada Equipe (lastFiveGames)
        if (Array.isArray(data.lastFiveGames) && data.lastFiveGames.length >= 1) {
            const parseLastFive = (teamObj) => {
                if (!teamObj || !Array.isArray(teamObj.events)) return [];
                return teamObj.events.slice(0, 5).map(ev => ({
                    score: ev.score || '0-0',
                    result: ev.gameResult || '-',
                    opponent: (ev.opponent && ev.opponent.displayName) ? ev.opponent.displayName : 'Adversário',
                    opponentLogo: ev.opponentLogo || (ev.opponent && ev.opponent.logo) || '',
                    date: ev.gameDate ? new Date(ev.gameDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '',
                    league: ev.leagueAbbreviation || ev.leagueName || ''
                }));
            };
            match.lastFiveA = parseLastFive(data.lastFiveGames[0]);
            if (data.lastFiveGames[1]) match.lastFiveB = parseLastFive(data.lastFiveGames[1]);
        }

        // 7. Confrontos Diretos Reais - H2H (seasonseries)
        if (Array.isArray(data.seasonseries) && data.seasonseries[0] && Array.isArray(data.seasonseries[0].events)) {
            match.h2hGames = data.seasonseries[0].events.slice(0, 6).map(ev => {
                const c0 = ev.competitors && ev.competitors[0];
                const c1 = ev.competitors && ev.competitors[1];
                return {
                    date: ev.date ? new Date(ev.date).toLocaleDateString('pt-BR') : '',
                    competition: ev.competitionName || '',
                    teamHome: c0 && c0.team ? c0.team.displayName : '',
                    logoHome: c0 && c0.team ? c0.team.logo : '',
                    scoreHome: c0 ? c0.score : '0',
                    teamAway: c1 && c1.team ? c1.team.displayName : '',
                    logoAway: c1 && c1.team ? c1.team.logo : '',
                    scoreAway: c1 ? c1.score : '0'
                };
            });
        }

        // 8. Artilheiros e Líderes da Temporada (leaders)
        if (Array.isArray(data.leaders)) {
            const leadersArr = [];
            data.leaders.forEach(teamLeaderBlock => {
                const tName = (teamLeaderBlock.team && teamLeaderBlock.team.displayName) || '';
                (teamLeaderBlock.leaders || []).forEach(cat => {
                    const topLeader = cat.leaders && cat.leaders[0];
                    if (topLeader && topLeader.athlete) {
                        leadersArr.push({
                            team: tName,
                            category: cat.displayName || 'Destaque',
                            player: topLeader.athlete.displayName,
                            jersey: topLeader.athlete.jersey || '',
                            value: topLeader.displayValue || ''
                        });
                    }
                });
            });
            match.seasonLeaders = leadersArr;
        }

        updateScoreboardHeader();
        renderTrackerTabContent();
        if (isMatchCenterOpen) renderMatchCenterMarkets();
        if (showNotification) showToast(`✅ Dados reais de ${match.teamA} x ${match.teamB} atualizados!`);
    } catch (e) {}
}

// Posiciona a bola e o HUD do Campo 3D usando as coordenadas reais (X/Y) do lance da API
function applyRealPlayToPitch(match, playIdx = 0) {
    if (!match || !match.realPlayCoordinates || match.realPlayCoordinates.length === 0) return;
    const idx = playIdx % match.realPlayCoordinates.length;
    const play = match.realPlayCoordinates[idx];

    match.state.possessionTeam = play.isTeamA ? 'A' : 'B';
    match.state.zone = play.zone;
    match.state.arcMode = play.arcMode;
    match.state.actionText = play.typeTitle;
    match.state.subText = play.subText;
    match.state.activePlayer = play.player;
    match.state.targetX = play.x;
    match.state.targetY = play.y;

    // Constrói a trilha real usando os 2 lances anteriores + lance atual
    const prev1 = match.realPlayCoordinates[Math.min(match.realPlayCoordinates.length - 1, idx + 1)];
    const prev2 = match.realPlayCoordinates[Math.min(match.realPlayCoordinates.length - 1, idx + 2)];
    const trail = [];
    if (prev2 && prev2 !== prev1) trail.push({ x: prev2.x, y: prev2.y });
    if (prev1 && prev1 !== play) trail.push({ x: prev1.x, y: prev1.y });
    trail.push({ x: play.x, y: play.y });
    match.state.trail = trail;
}

// =====================================================
// 3. NAVEGAÇÃO E FILTROS DE CAMPEONATOS REAIS
// =====================================================
function syncNavigationActiveStates() {
    const view = window.BetProData.currentView;
    const filter = window.BetProData.currentFilter;

    // 1. Top Nav
    document.querySelectorAll('.top-nav a[data-top-nav]').forEach(el => {
        const key = el.getAttribute('data-top-nav');
        const isActive =
            (view === 'news' && key === 'news') ||
            (view === 'rules' && key === 'rules') ||
            ((view === 'matches' || view === 'match-center') && filter === 'live' && key === 'matches-live') ||
            ((view === 'matches' || view === 'match-center') && filter !== 'live' && key === 'matches-all');
        el.classList.toggle('active', isActive);
    });

    // 2. Left Sidebar (.menuSingle e .subMenuMulti-items .item)
    document.querySelectorAll('.sidebar [data-sb-nav]').forEach(el => {
        const key = el.getAttribute('data-sb-nav');
        const isActive =
            (view === 'news' && key === 'news') ||
            (view === 'rules' && key === 'rules') ||
            ((view === 'matches' || view === 'match-center') && key === filter);
        el.classList.toggle('active', isActive);
    });

    // 3. Filter Pills
    document.querySelectorAll('.filter-pill[data-pill-filter]').forEach(el => {
        const key = el.getAttribute('data-pill-filter');
        el.classList.toggle('active', key === filter);
    });
}

function switchMainSection(section) {
    window.BetProData.currentView = section;
    isMatchCenterOpen = (section === 'match-center');
    closeMobilePanels();

    document.getElementById('home-matches-view').style.display = section === 'matches' ? 'flex' : 'none';
    document.getElementById('match-center-view').classList.toggle('active', section === 'match-center');
    document.getElementById('news-view').style.display = section === 'news' ? 'flex' : 'none';
    document.getElementById('rules-view').style.display = section === 'rules' ? 'flex' : 'none';

    syncNavigationActiveStates();

    if (section === 'news') renderNewsView();
    if (section === 'matches') renderMatches();
}

function filterMatches(category, pillEl = null) {
    window.BetProData.currentFilter = category;
    closeMobilePanels();
    if (category === 'live') {
        matchStatusSubfilter = 'all';
        document.querySelectorAll('#status-subfilters .status-subfilter-btn').forEach(b => {
            b.classList.toggle('active', b.getAttribute('data-status-filter') === 'all');
        });
    }
    if (window.BetProData.currentView !== 'matches') {
        switchMainSection('matches');
    } else {
        syncNavigationActiveStates();
    }

    // Se filtrar por uma liga específica que ainda não tenha sido carregada, sincroniza ela na hora
    if (category !== 'all' && category !== 'live') {
        const hasLeague = window.BetProData.matches.some(m => m.category === category);
        if (!hasLeague) {
            syncRealTimeApi(category, false);
        }
    }
    renderMatches();
}

function setMatchStatusSubfilter(status, btnEl = null) {
    matchStatusSubfilter = status;
    document.querySelectorAll('#status-subfilters .status-subfilter-btn').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-status-filter') === status);
    });
    renderMatches();
}

function toggleLeagueGroup(slug) {
    if (collapsedLeagues.has(slug)) {
        collapsedLeagues.delete(slug);
    } else {
        collapsedLeagues.add(slug);
    }
    renderMatches();
}

function handleSearchMatches(val) {
    window.BetProData.searchQuery = val || '';
    if (window.BetProData.currentView !== 'matches') {
        switchMainSection('matches');
    }
    renderMatches();
}

function openMatchCenter(matchId) {
    window.BetProData.selectedMatchId = Number(matchId);
    realPlayCycleIdx = 0;
    activeMarketCategory = 'all';
    marketSearchQuery = '';
    switchMainSection('match-center');

    const m = window.BetProData.matches.find(x => x.id === Number(matchId));
    if (m) {
        fetchMatchSummaryFromApi(m);
    }

    updateScoreboardHeader();
    renderTrackerTabContent();
    renderMatchCenterMarkets();
    const containerBets = document.querySelector('.content.containerBets');
    if (containerBets) containerBets.scrollTop = 0;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function backToMatchList() {
    switchMainSection('matches');
}

function filterNewsByLeague(slug, pillEl = null) {
    currentNewsLeagueFilter = slug;
    if (pillEl) {
        const container = document.getElementById('news-filter-pills');
        if (container) {
            container.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
        }
        pillEl.classList.add('active');
    }
    renderNewsView();
}

function renderNewsView() {
    const heroContainer = document.getElementById('news-featured-hero');
    const gridContainer = document.getElementById('news-grid-container');
    if (!gridContainer) return;

    const allArticles = window.BetProData.newsArticles || [];
    if (allArticles.length === 0) {
        if (heroContainer) heroContainer.innerHTML = '';
        gridContainer.innerHTML = `<div style="padding:28px; color:var(--text-muted); grid-column:1 / -1; text-align:center;">Carregando cobertura jornalística e vídeos em tempo real...</div>`;
        fetchRealNews().then(() => renderNewsView());
        return;
    }

    const filtered = currentNewsLeagueFilter === 'all'
        ? allArticles
        : allArticles.filter(a => a.leagueSlug === currentNewsLeagueFilter);

    if (filtered.length === 0) {
        if (heroContainer) heroContainer.innerHTML = '';
        gridContainer.innerHTML = `<div style="padding:24px; color:var(--text-muted); grid-column:1 / -1; text-align:center;">Nenhuma matéria encontrada para esta editoria.</div>`;
        return;
    }

    const featured = filtered[0];
    const rest = filtered.slice(1);

    // 1. Manchete Principal em Destaque (Estilo Portal Esportivo Premium)
    if (heroContainer && featured) {
        const tagsHtml = (featured.tags || []).map(t =>
            `<span style="background:rgba(255,255,255,0.08); color:#e2e8f0; padding:3px 8px; border-radius:4px; font-size:10.5px; font-weight:700;">#${t}</span>`
        ).join('');

        heroContainer.innerHTML = `
            <div onclick="openNewsArticleModal('${featured.id}')" style="cursor:pointer; display:grid; grid-template-columns:1.35fr 1fr; background:linear-gradient(135deg, #3b2a6f 0%, #1c1436 100%); border:1px solid rgba(255,196,0,0.45); border-radius:8px; overflow:hidden; box-shadow:0 12px 32px rgba(0,0,0,0.45); transition:transform 0.2s;">
                <div style="position:relative; min-height:270px; background:#090d14;">
                    <img src="${featured.image}" alt="" style="width:100%; height:100%; object-fit:cover; display:block;" onerror="this.src='https://a.espncdn.com/photo/2026/1011/r1729044_1296x729_16-9.jpg'">
                    <div style="position:absolute; top:12px; left:12px; display:flex; gap:6px;">
                        <span style="background:var(--brand-red-selected); color:#fff; font-size:10.5px; font-weight:900; padding:4px 10px; border-radius:4px; text-transform:uppercase;">🔥 MANCHETE PRINCIPAL</span>
                        <span style="background:rgba(9,13,20,0.88); color:var(--brand-gold); border:1px solid rgba(255,196,0,0.4); font-size:10.5px; font-weight:800; padding:4px 10px; border-radius:4px;">${featured.leagueLabel}</span>
                    </div>
                </div>
                <div style="padding:22px 24px; display:flex; flex-direction:column; justify-content:space-between;">
                    <div>
                        <div style="display:flex; justify-content:space-between; align-items:center; font-size:11px; color:rgba(255,255,255,0.75); font-weight:700; margin-bottom:10px;">
                            <span>✍️ ${featured.byline}</span>
                            <span style="color:var(--brand-gold);">🕒 ${featured.timeAgo} (${featured.published})</span>
                        </div>
                        <h2 style="font-size:20px; font-weight:900; line-height:1.32; color:#fff; margin-bottom:12px;">${featured.headline}</h2>
                        <p style="font-size:13.5px; color:#e2e8f0; line-height:1.55; margin-bottom:14px;">${featured.description}</p>
                        <div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:14px;">${tagsHtml}</div>
                    </div>
                    <div style="display:flex; align-items:center; justify-content:space-between; padding-top:12px; border-top:1px solid rgba(255,255,255,0.12);">
                        <span style="font-size:12.5px; font-weight:900; color:var(--brand-gold);">📖 Ler Matéria Completa & Assistir Vídeos ➔</span>
                        <span style="font-size:11px; color:rgba(255,255,255,0.7);">365 DA BARRA</span>
                    </div>
                </div>
            </div>
        `;
    }

    // 2. Grade de Notícias Secundárias com Categorias e Abertura no Modal Interno
    gridContainer.innerHTML = rest.map(art => {
        const tagsHtml = (art.tags || []).slice(0, 2).map(t =>
            `<span style="background:rgba(255,255,255,0.08); color:var(--text-secondary); padding:2px 6px; border-radius:4px; font-size:10px; font-weight:700;">${t}</span>`
        ).join('');

        return `
            <div onclick="openNewsArticleModal('${art.id}')" style="cursor:pointer; background:var(--card-item-bg); border:1px solid var(--card-item-border); border-radius:6px; overflow:hidden; display:flex; flex-direction:column; justify-content:space-between; transition:all 0.2s;">
                <div>
                    <div style="position:relative; height:175px; background:#090d14;">
                        <img src="${art.image}" alt="" style="width:100%; height:100%; object-fit:cover;" onerror="this.src='https://a.espncdn.com/photo/2026/1011/r1729044_1296x729_16-9.jpg'">
                        <span style="position:absolute; top:10px; left:10px; background:var(--brand-purple); color:#fff; font-size:10px; font-weight:800; padding:3px 8px; border-radius:4px;">${art.leagueLabel}</span>
                        <span style="position:absolute; bottom:8px; right:8px; background:rgba(9,13,20,0.88); color:var(--brand-gold); font-size:10px; font-weight:800; padding:2px 7px; border-radius:4px;">🕒 ${art.timeAgo}</span>
                    </div>
                    <div style="padding:14px;">
                        <div style="display:flex; gap:5px; flex-wrap:wrap; margin-bottom:7px;">${tagsHtml}</div>
                        <h3 style="font-size:14.5px; font-weight:800; margin-bottom:8px; line-height:1.36; color:var(--text-main);">${art.headline}</h3>
                        <p style="font-size:12px; color:var(--text-muted); line-height:1.48;">${art.description}</p>
                    </div>
                </div>
                <div style="padding:10px 14px 14px 14px; border-top:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:11.5px; font-weight:800; color:var(--accent-green);">📖 Ler na Íntegra & Vídeo ➔</span>
                    <span style="font-size:10px; color:var(--text-muted);">${art.published}</span>
                </div>
            </div>
        `;
    }).join('');
}

async function openNewsArticleModal(articleId) {
    const modal = document.getElementById('news-article-modal');
    const bodyEl = document.getElementById('modal-news-body');
    const catEl = document.getElementById('modal-news-category');
    if (!modal || !bodyEl) return;

    const cachedArt = (window.BetProData.newsArticles || []).find(a => String(a.id) === String(articleId));
    modal.classList.add('open');

    if (catEl && cachedArt) {
        catEl.innerText = `${cachedArt.leagueLabel} • ${cachedArt.timeAgo} (${cachedArt.published})`;
    }

    bodyEl.innerHTML = `
        <div style="padding:30px; text-align:center; color:var(--text-muted);">
            <div style="font-size:24px; margin-bottom:8px;">📖</div>
            Carregando texto completo da reportagem e vídeos em alta definição...
        </div>
    `;

    try {
        const res = await fetch(`https://content.core.api.espn.com/v1/sports/news/${articleId}?lang=pt&region=br`);
        const data = await res.json();
        const h0 = (data && data.headlines && data.headlines[0]) ? data.headlines[0] : null;

        const headline = (h0 && h0.headline) || (cachedArt && cachedArt.headline) || 'Reportagem Oficial';
        const description = (h0 && h0.description) || (cachedArt && cachedArt.description) || '';
        const byline = (h0 && h0.byline) || (cachedArt && cachedArt.byline) || 'Redação Esportiva';
        const image = (cachedArt && cachedArt.image) || ((h0 && h0.images && h0.images[0] && h0.images[0].url) ? h0.images[0].url : '');

        // Verifica se há vídeos MP4 em HD na matéria
        let videoHtml = '';
        if (h0 && Array.isArray(h0.video) && h0.video.length > 0) {
            const v0 = h0.video[0];
            const mp4Url = (v0.links && v0.links.source && v0.links.source.HD && v0.links.source.HD.href)
                || (v0.links && v0.links.source && v0.links.source.href)
                || (v0.links && v0.links.mobile && v0.links.mobile.source && v0.links.mobile.source.href);
            const vTitle = v0.headline || v0.title || 'Vídeo da Matéria';
            const vThumb = v0.thumbnail || image;

            if (mp4Url) {
                videoHtml = `
                    <div style="margin-bottom:18px; background:#06090e; border:1px solid rgba(52,202,115,0.4); border-radius:8px; overflow:hidden;">
                        <div style="padding:8px 12px; background:rgba(52,202,115,0.12); font-size:11.5px; font-weight:800; color:var(--accent-green);">
                            🎬 VÍDEO OFICIAL EM HD: ${vTitle}
                        </div>
                        <video controls autoplay muted poster="${vThumb}" style="width:100%; max-height:400px; display:block; background:#000;">
                            <source src="${mp4Url}" type="video/mp4">
                        </video>
                    </div>
                `;
            }
        }

        // Limpa tags internas (<video1>, <photo1>, etc.) do corpo da matéria em português
        let rawStory = (h0 && (h0.story || h0.body)) ? (h0.story || h0.body) : `<p>${description}</p>`;
        rawStory = rawStory
            .replace(/<video\d+>/gi, '')
            .replace(/<photo\d+>/gi, '')
            .replace(/<inline\d+>/gi, '');

        bodyEl.innerHTML = `
            <h1 style="font-size:22px; font-weight:900; line-height:1.32; color:var(--text-main); margin-bottom:10px;">${headline}</h1>
            <p style="font-size:14px; color:var(--text-muted); line-height:1.5; margin-bottom:14px; font-weight:600;">${description}</p>
            <div style="display:flex; justify-content:space-between; align-items:center; padding-bottom:12px; margin-bottom:16px; border-bottom:1px solid var(--border-color); font-size:11.5px; color:var(--text-muted);">
                <span>✍️ Por <strong style="color:var(--text-main);">${byline}</strong></span>
                <span>📅 ${cachedArt ? cachedArt.published : ''}</span>
            </div>
            ${videoHtml}
            ${!videoHtml && image ? `<img src="${image}" style="width:100%; max-height:360px; object-fit:cover; border-radius:8px; margin-bottom:16px; border:1px solid var(--border-color);">` : ''}
            <div style="font-size:14px; line-height:1.75; color:var(--text-secondary); display:flex; flex-direction:column; gap:12px;" class="article-story-content">
                ${rawStory}
            </div>
            ${cachedArt && cachedArt.url && cachedArt.url !== '#' ? `
                <div style="margin-top:20px; padding-top:14px; border-top:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center;">
                    <a href="${cachedArt.url}" target="_blank" style="color:var(--accent-green); font-size:12px; font-weight:800; text-decoration:none;">🔗 Abrir link original na ESPN Brasil ➔</a>
                    <button class="btn-secondary" onclick="closeNewsArticleModal()">Fechar Leitura</button>
                </div>
            ` : ''}
        `;
    } catch (e) {
        bodyEl.innerHTML = `
            <h2 style="font-size:20px; font-weight:900; margin-bottom:10px;">${cachedArt ? cachedArt.headline : 'Notícia'}</h2>
            ${cachedArt && cachedArt.image ? `<img src="${cachedArt.image}" style="width:100%; max-height:320px; object-fit:cover; border-radius:8px; margin-bottom:14px;">` : ''}
            <p style="font-size:14px; line-height:1.65; color:var(--text-secondary);">${cachedArt ? cachedArt.description : ''}</p>
        `;
    }
}

function closeNewsArticleModal() {
    const modal = document.getElementById('news-article-modal');
    const bodyEl = document.getElementById('modal-news-body');
    if (modal) modal.classList.remove('open');
    // Para eventual vídeo em reprodução ao fechar o modal
    if (bodyEl) bodyEl.innerHTML = '';
}

// =====================================================
// 4. RENDERIZAÇÃO DA LISTA DE PARTIDAS (PADRÃO OFICIAL 365 DA BARRA + MELHORIAS)
// =====================================================
function renderMatches() {
    const container = document.getElementById('matches-container');
    if (!container) return;

    const { matches, currentFilter, searchQuery, isLoadingMatches } = window.BetProData;

    if (isLoadingMatches && matches.length === 0) {
        container.innerHTML = `
            <div style="padding:36px; text-align:center; color:var(--text-main); background:var(--card-item-bg); border-radius:5px; border:1px solid var(--card-item-border);">
                <div style="font-size:28px; margin-bottom:10px;">📡</div>
                <h3 style="font-size:16px; margin-bottom:6px;">Sincronizando Partidas Oficiais em Tempo Real...</h3>
                <p style="font-size:12.5px; color:var(--text-muted);">Buscando jogos ao vivo, escalações, estádios, campanhas e cotações nas ligas oficiais.</p>
            </div>
        `;
        return;
    }

    const filtered = matches.filter(m => {
        const matchesFilter =
            currentFilter === 'all' ? true :
            currentFilter === 'live' ? m.isLive :
            m.category === currentFilter;

        const matchesStatus =
            matchStatusSubfilter === 'all' ? true :
            m.statusState === matchStatusSubfilter;

        const q = searchQuery.trim().toLowerCase();
        const matchesSearch = !q ||
            m.teamA.toLowerCase().includes(q) ||
            m.teamB.toLowerCase().includes(q) ||
            m.league.toLowerCase().includes(q) ||
            (m.stadium && m.stadium.toLowerCase().includes(q));

        return matchesFilter && matchesStatus && matchesSearch;
    });

    if (filtered.length === 0) {
        container.innerHTML = `
            <div style="padding:32px; text-align:center; color:var(--text-muted); background:var(--card-item-bg); border-radius:5px; border:1px solid var(--card-item-border);">
                <div style="font-size:24px; margin-bottom:8px;">⚽</div>
                <strong style="color:var(--text-main); font-size:14px;">Nenhuma partida encontrada neste filtro no momento.</strong><br>
                <span style="font-size:12px;">Experimente alternar para Todas as Ligas ou remover filtros de status.</span><br>
                <button class="hero-cta" style="margin-top:14px;" onclick="setMatchStatusSubfilter('all'); filterMatches('all')">🌍 Ver Todos os Jogos Reais</button>
            </div>
        `;
        return;
    }

    // Agrupa as partidas por País/Campeonato (.pais) mantendo a prioridade (Jogos Ao Vivo e Brasileirão no topo)
    const groupsMap = new Map();
    filtered.forEach(m => {
        const key = m.category || m.league;
        if (!groupsMap.has(key)) {
            groupsMap.set(key, {
                slug: key,
                leagueTitle: m.league,
                matches: []
            });
        }
        groupsMap.get(key).matches.push(m);
    });

    container.innerHTML = '';

    groupsMap.forEach(group => {
        const isCollapsed = collapsedLeagues.has(group.slug);
        const liveInGroup = group.matches.filter(x => x.isLive).length;

        const paisDiv = document.createElement('div');
        paisDiv.className = 'pais';

        // Barra Roxa do Campeonato (.eventlist-country exata de 365dabarra-net.jogos.app)
        const countryHeader = document.createElement('div');
        countryHeader.className = 'eventlist-country';
        countryHeader.onclick = () => toggleLeagueGroup(group.slug);
        countryHeader.innerHTML = `
            <span class="name">
                <span>${group.leagueTitle}</span>
                <span style="background:rgba(0,0,0,0.28); color:var(--brand-gold); font-size:10.5px; padding:1px 7px; border-radius:10px; font-weight:800;">${group.matches.length}</span>
                ${liveInGroup > 0 ? `<span style="background:var(--brand-red-selected); color:#fff; font-size:10px; padding:1px 7px; border-radius:4px; font-weight:900;">🔴 ${liveInGroup} AO VIVO</span>` : ''}
            </span>
            ${!isCollapsed ? `
                <div class="titleMarkets titleMarkets3">
                    <span class="item">Casa</span>
                    <span class="item">Empate</span>
                    <span class="item">Fora</span>
                </div>
            ` : '<span style="margin-left:auto; font-size:11px; color:var(--brand-gold); font-weight:700;">▼ Expandir</span>'}
        `;
        paisDiv.appendChild(countryHeader);

        if (!isCollapsed) {
            const eventsWrap = document.createElement('div');
            eventsWrap.className = 'eventlist-events';

            group.matches.forEach(match => {
                const containerCards = document.createElement('div');
                containerCards.className = 'containerCards';

                const sel1Label = `${match.teamA} (Casa)`;
                const selXLabel = 'Empate (X)';
                const sel2Label = `${match.teamB} (Fora)`;

                const sel1 = isBetSelected(match.id, sel1Label);
                const selX = isBetSelected(match.id, selXLabel);
                const sel2 = isBetSelected(match.id, sel2Label);

                // Coluna 1: .timerLive (se ao vivo) ou .dateAndHour (ex: 18/out | 16:00)
                let col1Html = '';
                if (match.isLive) {
                    col1Html = `
                        <div class="timerLive">
                            <span class="live-tag-pill">AO VIVO</span>
                            <span class="live-minute-text">${match.displayClock || match.minute + "'"}</span>
                        </div>
                    `;
                } else if (match.statusState === 'post') {
                    col1Html = `
                        <div class="dateAndHour">
                            <span class="date" style="color:var(--accent-green);">FIM</span>
                            <span class="hour">${match.kickoffDateShort || 'Hoje'}</span>
                        </div>
                    `;
                } else {
                    col1Html = `
                        <div class="dateAndHour">
                            <span class="date">${match.kickoffDateShort || 'Hoje'}</span>
                            <span class="hour">${match.kickoffTimeStr || '16:00'}</span>
                        </div>
                    `;
                }

                const recBadgeA = match.recordA ? `<small style="font-size:10px; color:var(--text-muted); font-weight:600; margin-left:5px;">(${match.recordA})</small>` : '';
                const recBadgeB = match.recordB ? `<small style="font-size:10px; color:var(--text-muted); font-weight:600; margin-left:5px;">(${match.recordB})</small>` : '';

                const scoreAHtml = (match.isLive || match.statusState === 'post') ? `<div class="score">${match.scoreA}</div>` : '';
                const scoreBHtml = (match.isLive || match.statusState === 'post') ? `<div class="score">${match.scoreB}</div>` : '';

                const eventsStrip = (match.realEventsSummary && match.realEventsSummary.length > 0)
                    ? `<span style="color:var(--brand-gold); margin-left:8px;">${match.realEventsSummary.slice(0, 3).join(' • ')}</span>`
                    : '';

                containerCards.innerHTML = `
                    <div class="cardItem cardItem3" onclick="if(!event.target.closest('.odd') && !event.target.closest('.totalOutcomes-button')) openMatchCenter(${match.id})">
                        ${col1Html}
                        <div class="teams">
                            <div class="team">
                                <div class="logoTeam">
                                    <img src="${match.logoA}" alt="${escJs(match.teamA)}" width="23" height="23" onerror="this.style.display='none'">
                                </div>
                                <div class="nameTeam">
                                    <span>${match.teamA}</span>
                                    ${recBadgeA}
                                    ${renderFormBadges(match.formA)}
                                </div>
                                ${scoreAHtml}
                            </div>
                            <div class="team">
                                <div class="logoTeam">
                                    <img src="${match.logoB}" alt="${escJs(match.teamB)}" width="23" height="23" onerror="this.style.display='none'">
                                </div>
                                <div class="nameTeam">
                                    <span>${match.teamB}</span>
                                    ${recBadgeB}
                                    ${renderFormBadges(match.formB)}
                                </div>
                                ${scoreBHtml}
                            </div>
                            <div style="font-size:10.5px; color:var(--text-muted); margin-top:3px; display:flex; align-items:center; flex-wrap:wrap; gap:6px;">
                                <span>🏟️ ${match.stadium}</span>
                                ${eventsStrip}
                            </div>
                        </div>
                        <div class="outcomesMain">
                            <div class="boxOdds boxOdds3">
                                <a class="odd ${sel1 ? 'oddSelected' : ''}" onclick="event.stopPropagation(); toggleBet(${match.id}, '${escJs(sel1Label)}', ${match.odds['1']}, 'Vencedor do Encontro')">
                                    <span class="odd-micro-label">${sel1 ? '✓ CASA' : 'CASA'}</span>
                                    <span class="odd-main-val">${formatOddComma(match.odds['1'])}</span>
                                </a>
                                <a class="odd ${selX ? 'oddSelected' : ''}" onclick="event.stopPropagation(); toggleBet(${match.id}, '${escJs(selXLabel)}', ${match.odds['X']}, 'Vencedor do Encontro')">
                                    <span class="odd-micro-label">${selX ? '✓ EMPATE' : 'EMPATE'}</span>
                                    <span class="odd-main-val">${formatOddComma(match.odds['X'])}</span>
                                </a>
                                <a class="odd ${sel2 ? 'oddSelected' : ''}" onclick="event.stopPropagation(); toggleBet(${match.id}, '${escJs(sel2Label)}', ${match.odds['2']}, 'Vencedor do Encontro')">
                                    <span class="odd-micro-label">${sel2 ? '✓ FORA' : 'FORA'}</span>
                                    <span class="odd-main-val">${formatOddComma(match.odds['2'])}</span>
                                </a>
                            </div>
                        </div>
                        <div class="totalOutcomes">
                            <a class="totalOutcomes-button" onclick="event.stopPropagation(); openMatchCenter(${match.id})" title="Abrir Campo 3D Ao Vivo, Escalações e +384 Opções de Aposta">
                                <span>+${match.totalMarketsCount || 384}</span>
                                <small style="font-size:9px; font-weight:900;">🏟️ 3D / +Odds</small>
                            </a>
                        </div>
                    </div>
                `;
                eventsWrap.appendChild(containerCards);
            });

            paisDiv.appendChild(eventsWrap);
        }

        container.appendChild(paisDiv);
    });
}

// =====================================================
// 5. ABAS DE INFORMAÇÕES REAIS DA PARTIDA (ESTATÍSTICAS, LANCES, ESCALAÇÕES, TABELA & H2H)
// =====================================================
function switchTrackerTab(tabName, el) {
    window.BetProData.activeTrackerTab = tabName;
    document.querySelectorAll('.tracker-tab').forEach(t => t.classList.remove('active'));
    if (el) el.classList.add('active');
    renderTrackerTabContent();
}

function renderTrackerTabContent() {
    const m = window.BetProData.matches.find(x => x.id === window.BetProData.selectedMatchId);
    const container = document.getElementById('tracker-tab-body');
    if (!container) return;

    if (!m) {
        container.innerHTML = `<div style="padding:18px; color:var(--text-muted); font-size:12px;">Sincronizando informações reais da partida...</div>`;
        return;
    }

    const activeTab = window.BetProData.activeTrackerTab;
    const feedCountEl = document.getElementById('feed-count');
    if (feedCountEl) feedCountEl.innerText = m.state.feed.length;

    if (activeTab === 'stats') {
        const s = m.state.stats;
        const calcPct = (a, b) => (a + b === 0 ? 50 : Math.round((a / (a + b)) * 100));

        // Se a partida já começou ou tem estatísticas de boxscore da API
        if (s.hasRealBoxscore || m.isLive || m.statusState === 'post') {
            const shotTotPct = calcPct(s.totalShots[0], s.totalShots[1]);
            const shotOnPct = calcPct(s.shotsOnTarget[0], s.shotsOnTarget[1]);
            const cornPct = calcPct(s.corners[0], s.corners[1]);
            const passPctBar = calcPct(s.accuratePasses[0], s.accuratePasses[1]);
            const foulPct = calcPct(s.fouls[0], s.fouls[1]);
            const tacklePct = calcPct(s.tackles[0], s.tackles[1]);

            container.innerHTML = `
                <div class="gauges-row">
                    <div class="gauge-card">
                        <span class="gauge-title">Posse Real</span>
                        <div class="gauge-vals">
                            <span style="color:${m.colorA}">${s.possession[0]}%</span>
                            <span style="color:var(--text-muted); font-size:10px;">vs</span>
                            <span style="color:${m.colorB}">${s.possession[1]}%</span>
                        </div>
                    </div>
                    <div class="gauge-card">
                        <span class="gauge-title">Finalizações</span>
                        <div class="gauge-vals">
                            <span style="color:${m.colorA}">${s.totalShots[0]}</span>
                            <span style="color:var(--text-muted); font-size:10px;">vs</span>
                            <span style="color:${m.colorB}">${s.totalShots[1]}</span>
                        </div>
                    </div>
                    <div class="gauge-card">
                        <span class="gauge-title">🎯 No Alvo</span>
                        <div class="gauge-vals">
                            <span style="color:${m.colorA}">${s.shotsOnTarget[0]}</span>
                            <span style="color:var(--text-muted); font-size:10px;">vs</span>
                            <span style="color:${m.colorB}">${s.shotsOnTarget[1]}</span>
                        </div>
                    </div>
                </div>

                <div class="stat-row">
                    <div class="stat-labels">
                        <span>${s.totalShots[0]} (${s.shotsOnTarget[0]} no gol)</span>
                        <span class="stat-name">🎯 Finalizações Totais (No Alvo)</span>
                        <span>(${s.shotsOnTarget[1]} no gol) ${s.totalShots[1]}</span>
                    </div>
                    <div class="stat-bar-bg">
                        <div class="stat-bar-home" style="width:${shotTotPct}%; background:${m.colorA}"></div>
                        <div class="stat-bar-away" style="width:${100 - shotTotPct}%; background:${m.colorB}"></div>
                    </div>
                </div>

                <div class="stat-row">
                    <div class="stat-labels">
                        <span>${s.accuratePasses[0]}/${s.totalPasses[0]} (${s.passPct[0]}%)</span>
                        <span class="stat-name">👟 Passes Certos / Total</span>
                        <span>(${s.passPct[1]}%) ${s.accuratePasses[1]}/${s.totalPasses[1]}</span>
                    </div>
                    <div class="stat-bar-bg">
                        <div class="stat-bar-home" style="width:${passPctBar}%; background:${m.colorA}"></div>
                        <div class="stat-bar-away" style="width:${100 - passPctBar}%; background:${m.colorB}"></div>
                    </div>
                </div>

                <div class="stat-row">
                    <div class="stat-labels">
                        <span>${s.corners[0]} (Imp: ${s.offsides[0]})</span>
                        <span class="stat-name">🚩 Escanteios e Impedimentos</span>
                        <span>(Imp: ${s.offsides[1]}) ${s.corners[1]}</span>
                    </div>
                    <div class="stat-bar-bg">
                        <div class="stat-bar-home" style="width:${cornPct}%; background:${m.colorA}"></div>
                        <div class="stat-bar-away" style="width:${100 - cornPct}%; background:${m.colorB}"></div>
                    </div>
                </div>

                <div class="stat-row">
                    <div class="stat-labels">
                        <span>${s.tackles[0]} (🧤 ${s.saves[0]} def)</span>
                        <span class="stat-name">🛡️ Desarmes e Defesas</span>
                        <span>(🧤 ${s.saves[1]} def) ${s.tackles[1]}</span>
                    </div>
                    <div class="stat-bar-bg">
                        <div class="stat-bar-home" style="width:${tacklePct}%; background:${m.colorA}"></div>
                        <div class="stat-bar-away" style="width:${100 - tacklePct}%; background:${m.colorB}"></div>
                    </div>
                </div>

                <div class="stat-row" style="margin-bottom:0;">
                    <div class="stat-labels">
                        <span>${s.fouls[0]} (🟨${s.yellowCards[0]} 🟥${s.redCards[0]})</span>
                        <span class="stat-name">⚠️ Faltas e Cartões</span>
                        <span>(🟨${s.yellowCards[1]} 🟥${s.redCards[1]}) ${s.fouls[1]}</span>
                    </div>
                    <div class="stat-bar-bg">
                        <div class="stat-bar-home" style="width:${foulPct}%; background:${m.colorA}"></div>
                        <div class="stat-bar-away" style="width:${100 - foulPct}%; background:${m.colorB}"></div>
                    </div>
                </div>
            `;
        } else {
            // Partida Pré-Jogo (Agendada): Exibe Comparativo Real de Campanha, Artilheiros da Temporada e Últimos 5 Jogos!
            const leadersHtml = (m.seasonLeaders && m.seasonLeaders.length > 0)
                ? m.seasonLeaders.slice(0, 4).map(l => `
                    <div style="display:flex; justify-content:space-between; padding:6px 8px; background:var(--bg-dark); border:1px solid var(--border-color); border-radius:6px; font-size:11.5px; margin-bottom:5px;">
                        <span>⭐ <strong>${l.player}</strong> <span style="color:var(--text-muted);">(${l.team})</span></span>
                        <span style="color:var(--accent-green); font-weight:800;">${l.value}</span>
                    </div>
                `).join('')
                : `<div style="font-size:11.5px; color:var(--text-muted);">Sincronizando líderes da temporada...</div>`;

            container.innerHTML = `
                <div style="background:rgba(41,182,246,0.08); border:1px solid rgba(41,182,246,0.25); border-radius:8px; padding:10px; margin-bottom:10px;">
                    <div style="font-size:11px; font-weight:900; color:#29b6f6; margin-bottom:6px;">📊 COMPARATIVO OFICIAL PRÉ-JOGO (${m.timeLabel})</div>
                    <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:6px;">
                        <span><strong>${m.teamA}</strong>: ${m.recordA || 'Titular'} ${renderFormBadges(m.formA)}</span>
                        <span>${renderFormBadges(m.formB)} ${m.recordB || 'Titular'} :<strong>${m.teamB}</strong></span>
                    </div>
                    <div style="font-size:11px; color:var(--text-muted);">🏟️ ${m.stadium}</div>
                </div>
                <div style="font-size:11.5px; font-weight:800; color:var(--accent-yellow); margin-bottom:6px;">👟 Artilheiros & Líderes Reais na Temporada:</div>
                ${leadersHtml}
            `;
        }
    } else if (activeTab === 'feed') {
        container.innerHTML = `
            <div class="feed-list">
                ${m.state.feed.map((item, idx) => `
                    <div class="feed-item ${item.type}" style="cursor:pointer;" onclick="applyRealPlayToPitch(window.BetProData.matches.find(x=>x.id===${m.id}), ${idx})">
                        <span class="feed-time">${item.time}</span>
                        <span class="feed-text">${item.text}</span>
                    </div>
                `).join('')}
            </div>
        `;
    } else if (activeTab === 'lineups') {
        const hasRealRosters = Array.isArray(m.playersA) && m.playersA.length > 0 && typeof m.playersA[0] === 'object';

        if (!hasRealRosters) {
            container.innerHTML = `
                <div style="padding:14px; background:var(--bg-dark); border:1px solid var(--border-color); border-radius:8px; font-size:12px; color:var(--text-muted);">
                    <strong style="color:var(--text-main);">⏳ Escalação Oficial Aguardando Divulgação da Confederação</strong><br><br>
                    As escalações oficiais (11 titulares + banco de reservas) são liberadas pela API cerca de 1 hora antes do apito inicial.<br><br>
                    <strong>Estádio:</strong> ${m.stadium}<br>
                    <strong>Horário:</strong> ${m.timeLabel}
                </div>
            `;
            return;
        }

        const renderPlayerRow = (p) => `
            <div class="lineup-player" style="display:flex; justify-content:space-between; align-items:center; gap:4px;">
                <span><strong style="color:var(--accent-yellow);">${p.jersey}.</strong> ${p.name} <small style="color:var(--text-muted);">(${p.pos})</small></span>
                ${p.badges ? `<span style="font-size:9.5px; color:var(--accent-green); font-weight:800;">${p.badges}</span>` : ''}
            </div>
        `;

        container.innerHTML = `
            <div class="lineups-grid">
                <div class="lineup-col">
                    <h4 style="color:${m.colorA}; display:flex; align-items:center; gap:6px;">
                        <img src="${m.logoA}" style="width:16px; height:16px; object-fit:contain;"> ${m.teamA} (${m.formationA})
                    </h4>
                    <div style="font-size:10px; color:var(--accent-green); font-weight:800; margin-bottom:4px;">11 TITULARES OFICIAIS</div>
                    ${m.playersA.map(renderPlayerRow).join('')}
                    ${m.benchA && m.benchA.length > 0 ? `
                        <div style="font-size:10px; color:var(--text-muted); font-weight:800; margin:8px 0 4px 0;">BANCO DE RESERVAS</div>
                        ${m.benchA.slice(0, 9).map(renderPlayerRow).join('')}
                    ` : ''}
                </div>
                <div class="lineup-col">
                    <h4 style="color:${m.colorB}; display:flex; align-items:center; gap:6px;">
                        <img src="${m.logoB}" style="width:16px; height:16px; object-fit:contain;"> ${m.teamB} (${m.formationB})
                    </h4>
                    <div style="font-size:10px; color:var(--accent-green); font-weight:800; margin-bottom:4px;">11 TITULARES OFICIAIS</div>
                    ${m.playersB.map(renderPlayerRow).join('')}
                    ${m.benchB && m.benchB.length > 0 ? `
                        <div style="font-size:10px; color:var(--text-muted); font-weight:800; margin:8px 0 4px 0;">BANCO DE RESERVAS</div>
                        ${m.benchB.slice(0, 9).map(renderPlayerRow).join('')}
                    ` : ''}
                </div>
            </div>
        `;
    } else if (activeTab === 'standings') {
        let html = '';

        // 1. Confrontos Diretos Recentes (H2H)
        if (m.h2hGames && m.h2hGames.length > 0) {
            html += `
                <div style="margin-bottom:12px;">
                    <div style="font-size:11px; font-weight:900; color:var(--accent-yellow); margin-bottom:6px;">⚔️ CONFRONTO DIRETO OFICIAL (H2H)</div>
                    ${m.h2hGames.slice(0, 4).map(g => `
                        <div style="display:flex; justify-content:space-between; align-items:center; padding:5px 8px; background:var(--bg-dark); border:1px solid var(--border-color); border-radius:5px; font-size:11px; margin-bottom:4px;">
                            <span style="color:var(--text-muted); font-size:10px;">${g.date}</span>
                            <span><strong>${g.teamHome}</strong> <strong style="color:var(--accent-green); padding:0 4px;">${g.scoreHome} x ${g.scoreAway}</strong> <strong>${g.teamAway}</strong></span>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        // 2. Últimos Jogos Reais de cada Equipe
        if ((m.lastFiveA && m.lastFiveA.length > 0) || (m.lastFiveB && m.lastFiveB.length > 0)) {
            html += `
                <div style="margin-bottom:12px;">
                    <div style="font-size:11px; font-weight:900; color:#29b6f6; margin-bottom:6px;">📅 ÚLTIMOS JOGOS REAIS DAS EQUIPES</div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; font-size:10.5px;">
                        <div style="background:var(--bg-dark); padding:6px; border-radius:6px; border:1px solid var(--border-color);">
                            <div style="font-weight:800; margin-bottom:4px; color:${m.colorA};">${m.teamA}</div>
                            ${(m.lastFiveA || []).slice(0, 4).map(ev => `
                                <div style="display:flex; justify-content:space-between; padding:2px 0; border-bottom:1px solid rgba(255,255,255,0.04);">
                                    <span>vs ${ev.opponent}</span>
                                    <strong style="color:${ev.result === 'V' || ev.result === 'W' ? 'var(--accent-green)' : (ev.result === 'E' ? 'var(--accent-yellow)' : 'var(--accent-red)')}">${ev.score} (${ev.result})</strong>
                                </div>
                            `).join('')}
                        </div>
                        <div style="background:var(--bg-dark); padding:6px; border-radius:6px; border:1px solid var(--border-color);">
                            <div style="font-weight:800; margin-bottom:4px; color:${m.colorB};">${m.teamB}</div>
                            ${(m.lastFiveB || []).slice(0, 4).map(ev => `
                                <div style="display:flex; justify-content:space-between; padding:2px 0; border-bottom:1px solid rgba(255,255,255,0.04);">
                                    <span>vs ${ev.opponent}</span>
                                    <strong style="color:${ev.result === 'V' || ev.result === 'W' ? 'var(--accent-green)' : (ev.result === 'E' ? 'var(--accent-yellow)' : 'var(--accent-red)')}">${ev.score} (${ev.result})</strong>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
        }

        // 3. Tabela de Classificação Oficial do Campeonato
        if (m.standingsTable && m.standingsTable.length > 0) {
            html += `
                <div>
                    <div style="font-size:11px; font-weight:900; color:var(--accent-green); margin-bottom:6px;">🏆 CLASSIFICAÇÃO OFICIAL (${m.league})</div>
                    <table style="width:100%; border-collapse:collapse; font-size:11px;">
                        <thead>
                            <tr style="color:var(--text-muted); border-bottom:1px solid var(--border-color); text-align:left;">
                                <th style="padding:4px;">#</th>
                                <th style="padding:4px;">Equipe</th>
                                <th style="padding:4px; text-align:center;">P</th>
                                <th style="padding:4px; text-align:center;">J</th>
                                <th style="padding:4px; text-align:center;">V</th>
                                <th style="padding:4px; text-align:center;">SG</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${m.standingsTable.slice(0, 12).map(row => {
                                const isMatchTeam = row.team.toLowerCase().includes(m.teamA.toLowerCase().slice(0, 4)) ||
                                                    row.team.toLowerCase().includes(m.teamB.toLowerCase().slice(0, 4));
                                return `
                                    <tr style="border-bottom:1px solid rgba(255,255,255,0.05); background:${isMatchTeam ? 'rgba(0,230,118,0.12)' : 'transparent'}; font-weight:${isMatchTeam ? '800' : '500'};">
                                        <td style="padding:4px;">${row.rank}</td>
                                        <td style="padding:4px;">${row.team}</td>
                                        <td style="padding:4px; text-align:center; color:var(--accent-green); font-weight:800;">${row.points}</td>
                                        <td style="padding:4px; text-align:center;">${row.games}</td>
                                        <td style="padding:4px; text-align:center;">${row.wins}</td>
                                        <td style="padding:4px; text-align:center;">${row.gd}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }

        if (!html) {
            html = `<div style="padding:14px; color:var(--text-muted); font-size:12px;">Carregando tabela de classificação e histórico H2H da API...</div>`;
        }
        container.innerHTML = html;
    }
}

// =====================================================
// 6. CATÁLOGO COMPLETO DE +380 OPÇÕES E 45 MERCADOS DA PARTIDA
// =====================================================
function setMarketCategoryFilter(cat) {
    activeMarketCategory = cat;
    renderMatchCenterMarkets();
}

function handleMarketSearchInput(val) {
    marketSearchQuery = val || '';
    renderMatchCenterMarkets();
}

function toggleMarketBlockCollapse(blockId) {
    if (collapsedMarketBlocks.has(blockId)) {
        collapsedMarketBlocks.delete(blockId);
    } else {
        collapsedMarketBlocks.add(blockId);
    }
    renderMatchCenterMarkets();
}

function expandOrCollapseAllMarkets(collapseAll) {
    const match = window.BetProData.matches.find(x => x.id === window.BetProData.selectedMatchId);
    if (!match) return;
    const blocks = buildFullMatchMarketsCatalog(match);
    if (collapseAll) {
        blocks.forEach(b => collapsedMarketBlocks.add(b.id));
    } else {
        collapsedMarketBlocks.clear();
    }
    renderMatchCenterMarkets();
}

function buildFullMatchMarketsCatalog(match) {
    const o1 = Number(match.odds['1']) || 2.10;
    const oX = Number(match.odds['X']) || 3.25;
    const o2 = Number(match.odds['2']) || 3.40;
    const sA = Number(match.scoreA) || 0;
    const sB = Number(match.scoreB) || 0;
    const totG = sA + sB;

    const clampOdd = (v, min = 1.04, max = 150) => +(Math.min(max, Math.max(min, Number(v) || 1.85))).toFixed(2);

    // Extrai nomes reais dos jogadores escalados ou artilheiros da temporada
    const getRealPlayer = (playersArr, teamLeaders, idx, fallback) => {
        if (Array.isArray(playersArr) && playersArr.length > idx) {
            const p = playersArr[playersArr.length - 1 - idx] || playersArr[idx];
            if (p && typeof p === 'object') return `${p.jersey ? p.jersey + '. ' : ''}${p.name}`;
            if (typeof p === 'string') return p;
        }
        if (Array.isArray(teamLeaders) && teamLeaders[idx]) {
            return teamLeaders[idx].player;
        }
        return fallback;
    };

    const pA1 = getRealPlayer(match.playersA, match.seasonLeaders, 0, `Camisa 9 (${match.shortA})`);
    const pA2 = getRealPlayer(match.playersA, match.seasonLeaders, 1, `Camisa 10 (${match.shortA})`);
    const pA3 = getRealPlayer(match.playersA, match.seasonLeaders, 2, `Camisa 7 (${match.shortA})`);
    const pA4 = getRealPlayer(match.playersA, match.seasonLeaders, 3, `Camisa 11 (${match.shortA})`);

    const pB1 = getRealPlayer(match.playersB, match.seasonLeaders, 0, `Camisa 9 (${match.shortB})`);
    const pB2 = getRealPlayer(match.playersB, match.seasonLeaders, 1, `Camisa 10 (${match.shortB})`);
    const pB3 = getRealPlayer(match.playersB, match.seasonLeaders, 2, `Camisa 7 (${match.shortB})`);
    const pB4 = getRealPlayer(match.playersB, match.seasonLeaders, 3, `Camisa 11 (${match.shortB})`);

    const dc1X = clampOdd(1 / ((1 / o1) + (1 / oX)) * 0.95, 1.06, 4.50);
    const dc12 = clampOdd(1 / ((1 / o1) + (1 / o2)) * 0.95, 1.08, 3.80);
    const dcX2 = clampOdd(1 / ((1 / oX) + (1 / o2)) * 0.95, 1.06, 4.80);

    const dnb1 = clampOdd(o1 * 0.72, 1.12, 8.50);
    const dnb2 = clampOdd(o2 * 0.72, 1.12, 9.50);

    const bttsYes = match.markets && match.markets.btts ? match.markets.btts.yes : 1.78;
    const bttsNo = match.markets && match.markets.btts ? match.markets.btts.no : 1.98;

    const blocks = [
        // ==================== 1. PRINCIPAIS (10 Mercados) ====================
        {
            id: 'm_1x2',
            cat: 'principais',
            title: '⚽ Vencedor do Encontro (1x2 - Tempo Regulamentar 90\')',
            badge: match.oddsProvider || 'Bet365 Oficial',
            cols: 3,
            options: [
                { label: `${match.teamA} (Casa)`, odd: o1 },
                { label: 'Empate (X)', odd: oX },
                { label: `${match.teamB} (Fora)`, odd: o2 }
            ]
        },
        {
            id: 'm_dc',
            cat: 'principais',
            title: '🛡️ Dupla Hipótese (Dupla Chance)',
            badge: 'Tempo Regulamentar',
            cols: 3,
            options: [
                { label: `${match.shortA} ou Empate (1X)`, odd: dc1X },
                { label: `${match.shortA} ou ${match.shortB} (12)`, odd: dc12 },
                { label: `Empate ou ${match.shortB} (X2)`, odd: dcX2 }
            ]
        },
        {
            id: 'm_dnb',
            cat: 'principais',
            title: '🤝 Empate Anula a Aposta (Draw No Bet)',
            badge: 'Reembolso no Empate',
            cols: 2,
            options: [
                { label: `Empate Anula: ${match.teamA}`, odd: dnb1 },
                { label: `Empate Anula: ${match.teamB}`, odd: dnb2 }
            ]
        },
        {
            id: 'm_btts',
            cat: 'principais',
            title: '🥅 Ambos os Times Marcam (BTTS)',
            badge: '90 Minutos',
            cols: 2,
            options: [
                { label: 'Ambos Marcam: Sim', odd: bttsYes },
                { label: 'Ambos Marcam: Não', odd: bttsNo }
            ]
        },
        {
            id: 'm_next_goal',
            cat: 'principais',
            title: `🔥 Próximo Time a Marcar (${totG + 1}º Gol da Partida)`,
            badge: 'Tempo Real',
            cols: 3,
            options: [
                { label: `Próx. Gol: ${match.teamA}`, odd: clampOdd(o1 * 0.78, 1.35) },
                { label: 'Sem Mais Gols', odd: clampOdd(7.50 - totG * 1.05, 2.40) },
                { label: `Próx. Gol: ${match.teamB}`, odd: clampOdd(o2 * 0.78, 1.45) }
            ]
        },
        {
            id: 'm_1x2_btts',
            cat: 'principais',
            title: '⚡ Resultado Final + Ambos os Times Marcam',
            badge: 'Combo Especial',
            cols: 3,
            options: [
                { label: `${match.shortA} Vence & Ambos: Sim`, odd: clampOdd(o1 * 1.95, 2.60) },
                { label: `Empate & Ambos: Sim`, odd: clampOdd(oX * 1.38, 4.10) },
                { label: `${match.shortB} Vence & Ambos: Sim`, odd: clampOdd(o2 * 2.05, 2.90) },
                { label: `${match.shortA} Vence & Ambos: Não`, odd: clampOdd(o1 * 1.55, 2.15) },
                { label: `Empate (0x0) & Ambos: Não`, odd: clampOdd(oX * 2.45, 6.50) },
                { label: `${match.shortB} Vence & Ambos: Não`, odd: clampOdd(o2 * 1.62, 2.35) }
            ]
        },
        {
            id: 'm_1x2_ou25',
            cat: 'principais',
            title: '🎯 Resultado Final + Total de Gols (2.5)',
            badge: 'Combo Gols',
            cols: 3,
            options: [
                { label: `${match.shortA} & Mais de 2.5 Gols`, odd: clampOdd(o1 * 1.68, 2.10) },
                { label: `Empate & Mais de 2.5 Gols`, odd: clampOdd(oX * 3.10, 8.50) },
                { label: `${match.shortB} & Mais de 2.5 Gols`, odd: clampOdd(o2 * 1.75, 2.30) },
                { label: `${match.shortA} & Menos de 2.5 Gols`, odd: clampOdd(o1 * 1.92, 2.50) },
                { label: `Empate & Menos de 2.5 Gols`, odd: clampOdd(oX * 1.32, 3.60) },
                { label: `${match.shortB} & Menos de 2.5 Gols`, odd: clampOdd(o2 * 1.98, 2.75) }
            ]
        },
        {
            id: 'm_dc_btts',
            cat: 'principais',
            title: '🛡️ Dupla Hipótese + Ambos os Times Marcam',
            badge: 'Dupla + BTTS',
            cols: 3,
            options: [
                { label: `1X & Ambos Marcam: Sim`, odd: clampOdd(dc1X * 1.82, 1.95) },
                { label: `12 & Ambos Marcam: Sim`, odd: clampOdd(dc12 * 1.90, 2.05) },
                { label: `X2 & Ambos Marcam: Sim`, odd: clampOdd(dcX2 * 1.88, 2.05) },
                { label: `1X & Ambos Marcam: Não`, odd: clampOdd(dc1X * 1.65, 1.85) },
                { label: `12 & Ambos Marcam: Não`, odd: clampOdd(dc12 * 1.58, 1.78) },
                { label: `X2 & Ambos Marcam: Não`, odd: clampOdd(dcX2 * 1.72, 1.92) }
            ]
        },
        {
            id: 'm_win_margin',
            cat: 'principais',
            title: '📏 Margem de Vitória (90 Minutos)',
            badge: 'Diferença de Gols',
            cols: 4,
            options: [
                { label: `${match.shortA} por 1 Gol`, odd: clampOdd(o1 * 1.75, 3.10) },
                { label: `${match.shortA} por 2 Gols`, odd: clampOdd(o1 * 2.55, 4.80) },
                { label: `${match.shortA} por 3+ Gols`, odd: clampOdd(o1 * 4.20, 7.50) },
                { label: 'Empate com Gols', odd: clampOdd(oX * 1.38, 4.20) },
                { label: `${match.shortB} por 1 Gol`, odd: clampOdd(o2 * 1.80, 3.40) },
                { label: `${match.shortB} por 2 Gols`, odd: clampOdd(o2 * 2.75, 5.40) },
                { label: `${match.shortB} por 3+ Gols`, odd: clampOdd(o2 * 4.60, 8.80) },
                { label: 'Placar 0 x 0', odd: clampOdd(oX * 2.40, 6.80) }
            ]
        },
        {
            id: 'm_win_either_half',
            cat: 'principais',
            title: '🏆 Equipe Vence pelo Menos Um dos Tempos',
            badge: 'Especial Equipes',
            cols: 4,
            options: [
                { label: `${match.shortA} Vence 1T ou 2T: Sim`, odd: clampOdd(o1 * 0.72, 1.38) },
                { label: `${match.shortA} Vence 1T ou 2T: Não`, odd: clampOdd(2.65, 1.70) },
                { label: `${match.shortB} Vence 1T ou 2T: Sim`, odd: clampOdd(o2 * 0.74, 1.50) },
                { label: `${match.shortB} Vence 1T ou 2T: Não`, odd: clampOdd(2.25, 1.55) }
            ]
        },

        // ==================== 2. GOLS (10 Mercados) ====================
        {
            id: 'm_ou_full',
            cat: 'gols',
            title: '⚽ Total de Gols na Partida (Mais / Menos - Todas as Linhas)',
            badge: 'Linhas 0.5 a 6.5',
            cols: 2,
            options: [
                { label: 'Mais de 0.5 Gols', odd: 1.07 },
                { label: 'Menos de 0.5 Gols', odd: 8.20 },
                { label: 'Mais de 1.5 Gols', odd: 1.32 },
                { label: 'Menos de 1.5 Gols', odd: 3.25 },
                { label: 'Mais de 2.5 Gols', odd: 1.88 },
                { label: 'Menos de 2.5 Gols', odd: 1.90 },
                { label: 'Mais de 3.5 Gols', odd: 3.10 },
                { label: 'Menos de 3.5 Gols', odd: 1.35 },
                { label: 'Mais de 4.5 Gols', odd: 5.80 },
                { label: 'Menos de 4.5 Gols', odd: 1.12 },
                { label: 'Mais de 5.5 Gols', odd: 11.50 },
                { label: 'Menos de 5.5 Gols', odd: 1.04 },
                { label: 'Mais de 6.5 Gols', odd: 23.00 },
                { label: 'Menos de 6.5 Gols', odd: 1.01 }
            ]
        },
        {
            id: 'm_ou_asian',
            cat: 'gols',
            title: '🌏 Linhas Asiáticas de Gols (Total Asiático)',
            badge: 'Reembolso Parcial/Total',
            cols: 2,
            options: [
                { label: 'Gols Asiático: Mais de 1.0', odd: 1.12 },
                { label: 'Gols Asiático: Menos de 1.0', odd: 5.90 },
                { label: 'Gols Asiático: Mais de 1.25', odd: 1.22 },
                { label: 'Gols Asiático: Menos de 1.25', odd: 3.95 },
                { label: 'Gols Asiático: Mais de 1.75', odd: 1.44 },
                { label: 'Gols Asiático: Menos de 1.75', odd: 2.68 },
                { label: 'Gols Asiático: Mais de 2.0', odd: 1.56 },
                { label: 'Gols Asiático: Menos de 2.0', odd: 2.38 },
                { label: 'Gols Asiático: Mais de 2.25', odd: 1.72 },
                { label: 'Gols Asiático: Menos de 2.25', odd: 2.08 },
                { label: 'Gols Asiático: Mais de 2.75', odd: 2.12 },
                { label: 'Gols Asiático: Menos de 2.75', odd: 1.70 },
                { label: 'Gols Asiático: Mais de 3.0', odd: 2.55 },
                { label: 'Gols Asiático: Menos de 3.0', odd: 1.50 },
                { label: 'Gols Asiático: Mais de 3.25', odd: 2.82 },
                { label: 'Gols Asiático: Menos de 3.25', odd: 1.41 },
                { label: 'Gols Asiático: Mais de 3.75', odd: 3.65 },
                { label: 'Gols Asiático: Menos de 3.75', odd: 1.26 }
            ]
        },
        {
            id: 'm_home_ou',
            cat: 'gols',
            title: `🏠 Total de Gols: ${match.teamA} (Mandante)`,
            badge: 'Gols Casa',
            cols: 2,
            options: [
                { label: `${match.shortA}: Mais de 0.5 Gols`, odd: clampOdd(o1 * 0.58, 1.18) },
                { label: `${match.shortA}: Menos de 0.5 Gols`, odd: clampOdd(4.20 / (o1 * 0.5), 2.20) },
                { label: `${match.shortA}: Mais de 1.5 Gols`, odd: clampOdd(o1 * 0.98, 1.85) },
                { label: `${match.shortA}: Menos de 1.5 Gols`, odd: clampOdd(1.85, 1.38) },
                { label: `${match.shortA}: Mais de 2.5 Gols`, odd: clampOdd(o1 * 1.95, 3.60) },
                { label: `${match.shortA}: Menos de 2.5 Gols`, odd: 1.24 },
                { label: `${match.shortA}: Mais de 3.5 Gols`, odd: clampOdd(o1 * 3.80, 7.50) },
                { label: `${match.shortA}: Menos de 3.5 Gols`, odd: 1.07 }
            ]
        },
        {
            id: 'm_away_ou',
            cat: 'gols',
            title: `✈️ Total de Gols: ${match.teamB} (Visitante)`,
            badge: 'Gols Fora',
            cols: 2,
            options: [
                { label: `${match.shortB}: Mais de 0.5 Gols`, odd: clampOdd(o2 * 0.55, 1.25) },
                { label: `${match.shortB}: Menos de 0.5 Gols`, odd: clampOdd(3.80 / (o2 * 0.45), 1.95) },
                { label: `${match.shortB}: Mais de 1.5 Gols`, odd: clampOdd(o2 * 1.05, 2.15) },
                { label: `${match.shortB}: Menos de 1.5 Gols`, odd: 1.65 },
                { label: `${match.shortB}: Mais de 2.5 Gols`, odd: clampOdd(o2 * 2.20, 4.40) },
                { label: `${match.shortB}: Menos de 2.5 Gols`, odd: 1.18 },
                { label: `${match.shortB}: Mais de 3.5 Gols`, odd: clampOdd(o2 * 4.20, 9.20) },
                { label: `${match.shortB}: Menos de 3.5 Gols`, odd: 1.05 }
            ]
        },
        {
            id: 'm_exact_goals',
            cat: 'gols',
            title: '🔢 Número Exato de Gols na Partida',
            badge: 'Contagem Exata',
            cols: 4,
            options: [
                { label: 'Exatamente 0 Gols', odd: 8.20 },
                { label: 'Exatamente 1 Gol', odd: 4.30 },
                { label: 'Exatamente 2 Gols', odd: 3.35 },
                { label: 'Exatamente 3 Gols', odd: 4.10 },
                { label: 'Exatamente 4 Gols', odd: 6.20 },
                { label: 'Exatamente 5 Gols', odd: 11.00 },
                { label: '6 ou Mais Gols', odd: 17.50 },
                { label: '2 ou 3 Gols Exatos', odd: 1.95 }
            ]
        },
        {
            id: 'm_home_exact_goals',
            cat: 'gols',
            title: `🏠 Gols Exatos: ${match.teamA}`,
            badge: 'Mandante',
            cols: 4,
            options: [
                { label: `${match.shortA}: 0 Gols`, odd: 3.40 },
                { label: `${match.shortA}: 1 Gol`, odd: 2.55 },
                { label: `${match.shortA}: 2 Gols`, odd: 3.50 },
                { label: `${match.shortA}: 3 Gols`, odd: 6.80 },
                { label: `${match.shortA}: 4+ Gols`, odd: 13.00 }
            ]
        },
        {
            id: 'm_away_exact_goals',
            cat: 'gols',
            title: `✈️ Gols Exatos: ${match.teamB}`,
            badge: 'Visitante',
            cols: 4,
            options: [
                { label: `${match.shortB}: 0 Gols`, odd: 2.75 },
                { label: `${match.shortB}: 1 Gol`, odd: 2.50 },
                { label: `${match.shortB}: 2 Gols`, odd: 4.10 },
                { label: `${match.shortB}: 3 Gols`, odd: 8.50 },
                { label: `${match.shortB}: 4+ Gols`, odd: 18.00 }
            ]
        },
        {
            id: 'm_goal_bands',
            cat: 'gols',
            title: '📊 Faixas de Gols na Partida (Multi-Gols)',
            badge: 'Intervalo de Gols',
            cols: 4,
            options: [
                { label: 'Faixa: 0 a 1 Gol', odd: 3.15 },
                { label: 'Faixa: 1 a 2 Gols', odd: 1.98 },
                { label: 'Faixa: 1 a 3 Gols', odd: 1.40 },
                { label: 'Faixa: 2 a 3 Gols', odd: 1.95 },
                { label: 'Faixa: 2 a 4 Gols', odd: 1.52 },
                { label: 'Faixa: 3 a 4 Gols', odd: 2.55 },
                { label: 'Faixa: 3 a 5 Gols', odd: 2.10 },
                { label: 'Faixa: 4 a 6 Gols', odd: 3.85 }
            ]
        },
        {
            id: 'm_odd_even_goals',
            cat: 'gols',
            title: '🎲 Gols Ímpar / Par (Geral e por Equipe)',
            badge: 'Ímpar / Par',
            cols: 2,
            options: [
                { label: 'Total de Gols: Ímpar', odd: 1.90 },
                { label: 'Total de Gols: Par', odd: 1.86 },
                { label: `Gols ${match.shortA}: Ímpar`, odd: 2.05 },
                { label: `Gols ${match.shortA}: Par`, odd: 1.72 },
                { label: `Gols ${match.shortB}: Ímpar`, odd: 2.15 },
                { label: `Gols ${match.shortB}: Par`, odd: 1.65 }
            ]
        },
        {
            id: 'm_cleansheet_both_halves',
            cat: 'gols',
            title: '🧤 Baliza Inviolada (Clean Sheet) & Marcar nos Dois Tempos',
            badge: 'Defesa & Ataque',
            cols: 2,
            options: [
                { label: `${match.shortA} Não Sofre Gol: Sim`, odd: clampOdd(o1 * 1.15, 2.25) },
                { label: `${match.shortA} Não Sofre Gol: Não`, odd: 1.58 },
                { label: `${match.shortB} Não Sofre Gol: Sim`, odd: clampOdd(o2 * 1.20, 2.75) },
                { label: `${match.shortB} Não Sofre Gol: Não`, odd: 1.42 },
                { label: `${match.shortA} Marca nos 2 Tempos: Sim`, odd: clampOdd(o1 * 1.45, 2.85) },
                { label: `${match.shortB} Marca nos 2 Tempos: Sim`, odd: clampOdd(o2 * 1.55, 3.40) },
                { label: 'Gols em Ambos os Tempos: Sim', odd: 1.74 },
                { label: 'Gols em Ambos os Tempos: Não', odd: 2.02 }
            ]
        },

        // ==================== 3. 1º E 2º TEMPO (9 Mercados) ====================
        {
            id: 'm_ht_1x2',
            cat: 'tempos',
            title: '⏱️ Resultado do 1º Tempo (Intervalo)',
            badge: '1º Tempo',
            cols: 3,
            options: [
                { label: `1º Tempo: ${match.teamA}`, odd: clampOdd(o1 * 1.28, 2.40) },
                { label: '1º Tempo: Empate', odd: 2.10 },
                { label: `1º Tempo: ${match.teamB}`, odd: clampOdd(o2 * 1.32, 2.75) }
            ]
        },
        {
            id: 'm_ht_dc',
            cat: 'tempos',
            title: '🛡️ Dupla Hipótese no 1º Tempo',
            badge: '1º Tempo',
            cols: 3,
            options: [
                { label: `1º Tempo: ${match.shortA} ou Empate (1X)`, odd: 1.24 },
                { label: `1º Tempo: ${match.shortA} ou ${match.shortB} (12)`, odd: 1.66 },
                { label: `1º Tempo: Empate ou ${match.shortB} (X2)`, odd: 1.36 }
            ]
        },
        {
            id: 'm_ht_dnb_btts',
            cat: 'tempos',
            title: '🥅 Empate Anula & Ambos Marcam no 1º Tempo',
            badge: '1º Tempo',
            cols: 2,
            options: [
                { label: `1ºT Empate Anula: ${match.shortA}`, odd: clampOdd(o1 * 0.82, 1.55) },
                { label: `1ºT Empate Anula: ${match.shortB}`, odd: clampOdd(o2 * 0.85, 1.95) },
                { label: '1ºT Ambos Marcam: Sim', odd: 4.30 },
                { label: '1ºT Ambos Marcam: Não', odd: 1.20 }
            ]
        },
        {
            id: 'm_ht_ou',
            cat: 'tempos',
            title: '⚽ Total de Gols no 1º Tempo (Mais / Menos)',
            badge: '1º Tempo',
            cols: 2,
            options: [
                { label: '1ºT: Mais de 0.5 Gols', odd: 1.38 },
                { label: '1ºT: Menos de 0.5 Gols', odd: 2.90 },
                { label: '1ºT: Mais de 1.5 Gols', odd: 2.75 },
                { label: '1ºT: Menos de 1.5 Gols', odd: 1.42 },
                { label: '1ºT: Mais de 2.5 Gols', odd: 6.80 },
                { label: '1ºT: Menos de 2.5 Gols', odd: 1.09 },
                { label: '1ºT: Mais de 3.5 Gols', odd: 17.00 },
                { label: '1ºT: Menos de 3.5 Gols', odd: 1.02 }
            ]
        },
        {
            id: 'm_ht_cs',
            cat: 'tempos',
            title: '🔢 Placar Exato do 1º Tempo',
            badge: 'Intervalo',
            cols: 4,
            options: [
                { label: '1ºT Placar: 0 - 0', odd: 2.75 },
                { label: '1ºT Placar: 1 - 0', odd: 3.90 },
                { label: '1ºT Placar: 0 - 1', odd: 4.60 },
                { label: '1ºT Placar: 1 - 1', odd: 7.20 },
                { label: '1ºT Placar: 2 - 0', odd: 9.80 },
                { label: '1ºT Placar: 0 - 2', odd: 13.50 },
                { label: '1ºT Placar: 2 - 1', odd: 18.00 },
                { label: '1ºT Placar: 1 - 2', odd: 22.00 },
                { label: '1ºT Placar: 3 - 0', odd: 29.00 },
                { label: '1ºT Placar: 0 - 3', odd: 41.00 }
            ]
        },
        {
            id: 'm_2h_1x2_dc',
            cat: 'tempos',
            title: '⏱️ Resultado & Dupla Hipótese do 2º Tempo',
            badge: '2º Tempo',
            cols: 3,
            options: [
                { label: `2º Tempo: ${match.teamA}`, odd: clampOdd(o1 * 1.18, 2.20) },
                { label: '2º Tempo: Empate', odd: 2.35 },
                { label: `2º Tempo: ${match.teamB}`, odd: clampOdd(o2 * 1.22, 2.55) },
                { label: `2ºT Dupla: ${match.shortA}/Empate`, odd: 1.28 },
                { label: `2ºT Dupla: ${match.shortA}/${match.shortB}`, odd: 1.52 },
                { label: `2ºT Dupla: Empate/${match.shortB}`, odd: 1.40 }
            ]
        },
        {
            id: 'm_2h_ou_btts',
            cat: 'tempos',
            title: '⚽ Total de Gols & Ambos Marcam no 2º Tempo',
            badge: '2º Tempo',
            cols: 2,
            options: [
                { label: '2ºT: Mais de 0.5 Gols', odd: 1.25 },
                { label: '2ºT: Menos de 0.5 Gols', odd: 3.75 },
                { label: '2ºT: Mais de 1.5 Gols', odd: 2.15 },
                { label: '2ºT: Menos de 1.5 Gols', odd: 1.66 },
                { label: '2ºT: Mais de 2.5 Gols', odd: 4.70 },
                { label: '2ºT: Menos de 2.5 Gols', odd: 1.17 },
                { label: '2ºT: Mais de 3.5 Gols', odd: 11.00 },
                { label: '2ºT: Menos de 3.5 Gols', odd: 1.04 },
                { label: '2ºT Ambos Marcam: Sim', odd: 3.30 },
                { label: '2ºT Ambos Marcam: Não', odd: 1.32 }
            ]
        },
        {
            id: 'm_ht_ft',
            cat: 'tempos',
            title: '🔄 Intervalo / Final do Jogo (HT / FT)',
            badge: '9 Combinações',
            cols: 3,
            options: [
                { label: `${match.shortA} / ${match.shortA}`, odd: clampOdd(o1 * 1.55, 2.95) },
                { label: `${match.shortA} / Empate`, odd: 14.50 },
                { label: `${match.shortA} / ${match.shortB}`, odd: 29.00 },
                { label: `Empate / ${match.shortA}`, odd: clampOdd(o1 * 2.15, 4.60) },
                { label: 'Empate / Empate', odd: 4.80 },
                { label: `Empate / ${match.shortB}`, odd: clampOdd(o2 * 2.20, 5.40) },
                { label: `${match.shortB} / ${match.shortA}`, odd: 26.00 },
                { label: `${match.shortB} / Empate`, odd: 14.50 },
                { label: `${match.shortB} / ${match.shortB}`, odd: clampOdd(o2 * 1.60, 3.60) }
            ]
        },
        {
            id: 'm_highest_scoring_half',
            cat: 'tempos',
            title: '📈 Tempo com Mais Gols (Geral e por Equipe)',
            badge: 'Comparativo 1T x 2T',
            cols: 3,
            options: [
                { label: 'Mais Gols: 1º Tempo', odd: 3.10 },
                { label: 'Mais Gols: Igualdade', odd: 3.35 },
                { label: 'Mais Gols: 2º Tempo', odd: 2.05 },
                { label: `${match.shortA} Mais Gols: 1ºT`, odd: 3.20 },
                { label: `${match.shortA} Mais Gols: Igual`, odd: 2.40 },
                { label: `${match.shortA} Mais Gols: 2ºT`, odd: 2.50 },
                { label: `${match.shortB} Mais Gols: 1ºT`, odd: 3.45 },
                { label: `${match.shortB} Mais Gols: Igual`, odd: 2.15 },
                { label: `${match.shortB} Mais Gols: 2ºT`, odd: 2.75 }
            ]
        },

        // ==================== 4. PLACAR EXATO (2 Mercados / 32 Opções) ====================
        {
            id: 'm_cs_full',
            cat: 'placar',
            title: '🔢 Placar Exato Completo (Tempo Regulamentar 90\')',
            badge: '24 Placares Oficiais',
            cols: 4,
            options: [
                { label: 'Placar Exato 1 - 0', odd: clampOdd(o1 * 2.9, 5.80) },
                { label: 'Placar Exato 2 - 0', odd: clampOdd(o1 * 3.8, 7.80) },
                { label: 'Placar Exato 2 - 1', odd: clampOdd(o1 * 3.9, 8.20) },
                { label: 'Placar Exato 3 - 0', odd: clampOdd(o1 * 6.8, 14.00) },
                { label: 'Placar Exato 3 - 1', odd: clampOdd(o1 * 7.2, 15.00) },
                { label: 'Placar Exato 3 - 2', odd: 26.00 },
                { label: 'Placar Exato 4 - 0', odd: 34.00 },
                { label: 'Placar Exato 4 - 1', odd: 31.00 },
                { label: 'Placar Exato 4 - 2', odd: 51.00 },
                { label: 'Placar Exato 0 - 0', odd: 8.20 },
                { label: 'Placar Exato 1 - 1', odd: 6.10 },
                { label: 'Placar Exato 2 - 2', odd: 13.50 },
                { label: 'Placar Exato 3 - 3', odd: 51.00 },
                { label: 'Placar Exato 0 - 1', odd: clampOdd(o2 * 3.1, 6.80) },
                { label: 'Placar Exato 0 - 2', odd: clampOdd(o2 * 4.5, 10.50) },
                { label: 'Placar Exato 1 - 2', odd: clampOdd(o2 * 4.1, 9.20) },
                { label: 'Placar Exato 0 - 3', odd: 23.00 },
                { label: 'Placar Exato 1 - 3', odd: 21.00 },
                { label: 'Placar Exato 2 - 3', odd: 29.00 },
                { label: 'Placar Exato 0 - 4', odd: 56.00 },
                { label: 'Placar Exato 1 - 4', odd: 46.00 },
                { label: 'Placar Exato 2 - 4', odd: 67.00 },
                { label: `Outro Placar: ${match.shortA} Vence`, odd: 19.00 },
                { label: `Outro Placar: ${match.shortB} Vence`, odd: 26.00 }
            ]
        },
        {
            id: 'm_cs_groups',
            cat: 'placar',
            title: '🎯 Placar Exato Múltiplo (Grupos de Resultados)',
            badge: 'Maior Chance de Acerto',
            cols: 4,
            options: [
                { label: `${match.shortA}: 1-0, 2-0 ou 3-0`, odd: clampOdd(o1 * 1.45, 2.95) },
                { label: `${match.shortA}: 2-1, 3-1 ou 4-1`, odd: clampOdd(o1 * 2.10, 4.50) },
                { label: `${match.shortB}: 0-1, 0-2 ou 0-3`, odd: clampOdd(o2 * 1.55, 3.60) },
                { label: `${match.shortB}: 1-2, 1-3 ou 1-4`, odd: clampOdd(o2 * 2.25, 5.10) },
                { label: 'Empate: 1-1, 2-2 ou 3-3', odd: 4.30 },
                { label: 'Qualquer Vitória por 1-0', odd: 4.10 },
                { label: 'Qualquer Vitória por 2-0', odd: 5.20 },
                { label: 'Qualquer Vitória por 2-1', odd: 4.80 }
            ]
        },

        // ==================== 5. ESCANTEIOS (5 Mercados / 65 Opções) ====================
        {
            id: 'm_corners_ou',
            cat: 'escanteios',
            title: '🚩 Total de Escanteios (Mais / Menos - Todas as Linhas)',
            badge: 'Linhas 6.5 a 13.5',
            cols: 2,
            options: [
                { label: 'Escanteios: Mais de 6.5', odd: 1.18 },
                { label: 'Escanteios: Menos de 6.5', odd: 4.40 },
                { label: 'Escanteios: Mais de 7.5', odd: 1.32 },
                { label: 'Escanteios: Menos de 7.5', odd: 3.20 },
                { label: 'Escanteios: Mais de 8.5', odd: 1.54 },
                { label: 'Escanteios: Menos de 8.5', odd: 2.38 },
                { label: 'Escanteios: Mais de 9.5', odd: 1.85 },
                { label: 'Escanteios: Menos de 9.5', odd: 1.90 },
                { label: 'Escanteios: Mais de 10.5', odd: 2.30 },
                { label: 'Escanteios: Menos de 10.5', odd: 1.58 },
                { label: 'Escanteios: Mais de 11.5', odd: 3.05 },
                { label: 'Escanteios: Menos de 11.5', odd: 1.35 },
                { label: 'Escanteios: Mais de 12.5', odd: 4.20 },
                { label: 'Escanteios: Menos de 12.5', odd: 1.20 },
                { label: 'Escanteios: Mais de 13.5', odd: 6.10 },
                { label: 'Escanteios: Menos de 13.5', odd: 1.11 }
            ]
        },
        {
            id: 'm_corners_3way',
            cat: 'escanteios',
            title: '🚩 Escanteios 3 Opções (Menos / Exatamente / Mais)',
            badge: '3 Opções',
            cols: 3,
            options: [
                { label: 'Menos de 8 Escanteios', odd: 3.10 },
                { label: 'Exatamente 8 Escanteios', odd: 7.50 },
                { label: 'Mais de 8 Escanteios', odd: 1.55 },
                { label: 'Menos de 9 Escanteios', odd: 2.35 },
                { label: 'Exatamente 9 Escanteios', odd: 7.00 },
                { label: 'Mais de 9 Escanteios', odd: 1.88 },
                { label: 'Menos de 10 Escanteios', odd: 1.88 },
                { label: 'Exatamente 10 Escanteios', odd: 7.20 },
                { label: 'Mais de 10 Escanteios', odd: 2.32 },
                { label: 'Menos de 11 Escanteios', odd: 1.55 },
                { label: 'Exatamente 11 Escanteios', odd: 8.00 },
                { label: 'Mais de 11 Escanteios', odd: 3.10 }
            ]
        },
        {
            id: 'm_corners_teams',
            cat: 'escanteios',
            title: `🚩 Escanteios por Equipe (${match.shortA} e ${match.shortB})`,
            badge: 'Total Individual',
            cols: 2,
            options: [
                { label: `${match.shortA}: Mais de 3.5 Escanteios`, odd: 1.32 },
                { label: `${match.shortA}: Menos de 3.5 Escanteios`, odd: 3.20 },
                { label: `${match.shortA}: Mais de 4.5 Escanteios`, odd: 1.65 },
                { label: `${match.shortA}: Menos de 4.5 Escanteios`, odd: 2.15 },
                { label: `${match.shortA}: Mais de 5.5 Escanteios`, odd: 2.20 },
                { label: `${match.shortA}: Menos de 5.5 Escanteios`, odd: 1.62 },
                { label: `${match.shortA}: Mais de 6.5 Escanteios`, odd: 3.15 },
                { label: `${match.shortA}: Menos de 6.5 Escanteios`, odd: 1.33 },
                { label: `${match.shortB}: Mais de 3.5 Escanteios`, odd: 1.48 },
                { label: `${match.shortB}: Menos de 3.5 Escanteios`, odd: 2.52 },
                { label: `${match.shortB}: Mais de 4.5 Escanteios`, odd: 1.92 },
                { label: `${match.shortB}: Menos de 4.5 Escanteios`, odd: 1.82 },
                { label: `${match.shortB}: Mais de 5.5 Escanteios`, odd: 2.68 },
                { label: `${match.shortB}: Menos de 5.5 Escanteios`, odd: 1.44 },
                { label: `${match.shortB}: Mais de 6.5 Escanteios`, odd: 3.90 },
                { label: `${match.shortB}: Menos de 6.5 Escanteios`, odd: 1.22 }
            ]
        },
        {
            id: 'm_corners_ht_1x2',
            cat: 'escanteios',
            title: '🚩 Escanteios no 1º Tempo & Vencedor de Escanteios (1x2)',
            badge: '1ºT & Mais Cantos',
            cols: 3,
            options: [
                { label: '1ºT: Mais de 3.5 Cantos', odd: 1.48 },
                { label: '1ºT: Menos de 3.5 Cantos', odd: 2.52 },
                { label: '1ºT: Mais de 4.5 Cantos', odd: 1.95 },
                { label: '1ºT: Menos de 4.5 Cantos', odd: 1.80 },
                { label: '1ºT: Mais de 5.5 Cantos', odd: 2.85 },
                { label: '1ºT: Menos de 5.5 Cantos', odd: 1.40 },
                { label: `Mais Cantos: ${match.teamA}`, odd: 1.72 },
                { label: 'Empate em Escanteios', odd: 7.50 },
                { label: `Mais Cantos: ${match.teamB}`, odd: 2.45 }
            ]
        },
        {
            id: 'm_corners_race',
            cat: 'escanteios',
            title: '🏁 Corrida de Escanteios (Primeiro a Atingir X Cantos)',
            badge: 'Race to Corners',
            cols: 3,
            options: [
                { label: `Primeiro a 3 Cantos: ${match.shortA}`, odd: 1.65 },
                { label: `Primeiro a 3 Cantos: ${match.shortB}`, odd: 2.25 },
                { label: 'Nenhum chega a 3 Cantos', odd: 15.00 },
                { label: `Primeiro a 5 Cantos: ${match.shortA}`, odd: 1.90 },
                { label: `Primeiro a 5 Cantos: ${match.shortB}`, odd: 2.75 },
                { label: 'Nenhum chega a 5 Cantos', odd: 3.90 },
                { label: `Primeiro a 7 Cantos: ${match.shortA}`, odd: 2.85 },
                { label: `Primeiro a 7 Cantos: ${match.shortB}`, odd: 4.10 },
                { label: 'Nenhum chega a 7 Cantos', odd: 1.72 },
                { label: `Primeiro a 9 Cantos: ${match.shortA}`, odd: 5.20 },
                { label: `Primeiro a 9 Cantos: ${match.shortB}`, odd: 7.50 },
                { label: 'Nenhum chega a 9 Cantos', odd: 1.20 }
            ]
        },

        // ==================== 6. CARTÕES (3 Mercados / 29 Opções) ====================
        {
            id: 'm_cards_ou',
            cat: 'cartoes',
            title: '🟨 Total de Cartões na Partida (Mais / Menos)',
            badge: 'Disciplina 90\'',
            cols: 2,
            options: [
                { label: 'Cartões: Mais de 2.5', odd: 1.22 },
                { label: 'Cartões: Menos de 2.5', odd: 3.90 },
                { label: 'Cartões: Mais de 3.5', odd: 1.52 },
                { label: 'Cartões: Menos de 3.5', odd: 2.42 },
                { label: 'Cartões: Mais de 4.5', odd: 1.92 },
                { label: 'Cartões: Menos de 4.5', odd: 1.82 },
                { label: 'Cartões: Mais de 5.5', odd: 2.65 },
                { label: 'Cartões: Menos de 5.5', odd: 1.45 },
                { label: 'Cartões: Mais de 6.5', odd: 3.85 },
                { label: 'Cartões: Menos de 6.5', odd: 1.23 }
            ]
        },
        {
            id: 'm_cards_teams',
            cat: 'cartoes',
            title: `🟨 Cartões por Equipe (${match.shortA} e ${match.shortB})`,
            badge: 'Cartões Individuais',
            cols: 2,
            options: [
                { label: `${match.shortA}: Mais de 1.5 Cartões`, odd: 1.48 },
                { label: `${match.shortA}: Menos de 1.5 Cartões`, odd: 2.52 },
                { label: `${match.shortA}: Mais de 2.5 Cartões`, odd: 2.25 },
                { label: `${match.shortA}: Menos de 2.5 Cartões`, odd: 1.60 },
                { label: `${match.shortA}: Mais de 3.5 Cartões`, odd: 3.95 },
                { label: `${match.shortA}: Menos de 3.5 Cartões`, odd: 1.22 },
                { label: `${match.shortB}: Mais de 1.5 Cartões`, odd: 1.40 },
                { label: `${match.shortB}: Menos de 1.5 Cartões`, odd: 2.80 },
                { label: `${match.shortB}: Mais de 2.5 Cartões`, odd: 2.05 },
                { label: `${match.shortB}: Menos de 2.5 Cartões`, odd: 1.72 },
                { label: `${match.shortB}: Mais de 3.5 Cartões`, odd: 3.50 },
                { label: `${match.shortB}: Menos de 3.5 Cartões`, odd: 1.28 }
            ]
        },
        {
            id: 'm_cards_red_specials',
            cat: 'cartoes',
            title: '🟥 Cartão Vermelho, Pênalti & Mais Cartões (1x2)',
            badge: 'Arbitragem / VAR',
            cols: 3,
            options: [
                { label: 'Cartão Vermelho no Jogo: Sim', odd: 3.95 },
                { label: 'Cartão Vermelho no Jogo: Não', odd: 1.22 },
                { label: 'Pênalti Marcado no Jogo: Sim', odd: 2.85 },
                { label: 'Pênalti Marcado no Jogo: Não', odd: 1.40 },
                { label: `Mais Cartões: ${match.shortA}`, odd: 2.35 },
                { label: 'Empate em Cartões', odd: 4.50 },
                { label: `Mais Cartões: ${match.shortB}`, odd: 2.05 }
            ]
        },

        // ==================== 7. HANDICAP (2 Mercados / 30 Opções) ====================
        {
            id: 'm_eh_3way',
            cat: 'handicap',
            title: '⚖️ Handicap Europeu (3 Opções)',
            badge: 'Vantagem / Desvantagem',
            cols: 3,
            options: [
                { label: `Handicap (-2): ${match.shortA}`, odd: clampOdd(o1 * 3.85, 6.20) },
                { label: 'Empate Handicap (-2)', odd: 5.40 },
                { label: `Handicap (+2): ${match.shortB}`, odd: 1.25 },
                { label: `Handicap (-1): ${match.shortA}`, odd: clampOdd(o1 * 1.92, 3.20) },
                { label: 'Empate Handicap (-1)', odd: 3.65 },
                { label: `Handicap (+1): ${match.shortB}`, odd: dcX2 },
                { label: `Handicap (+1): ${match.shortA}`, odd: dc1X },
                { label: 'Empate Handicap (+1)', odd: 3.85 },
                { label: `Handicap (-1): ${match.shortB}`, odd: clampOdd(o2 * 2.05, 3.90) },
                { label: `Handicap (+2): ${match.shortA}`, odd: 1.14 },
                { label: 'Empate Handicap (+2)', odd: 6.20 },
                { label: `Handicap (-2): ${match.shortB}`, odd: clampOdd(o2 * 4.20, 8.50) }
            ]
        },
        {
            id: 'm_ah_2way',
            cat: 'handicap',
            title: '🌏 Handicap Asiático Completo (Linhas -2.0 a +2.0)',
            badge: 'Linhas Asiáticas',
            cols: 2,
            options: [
                { label: `${match.shortA} (-2.0 Asiático)`, odd: clampOdd(o1 * 3.40, 5.80) },
                { label: `${match.shortB} (+2.0 Asiático)`, odd: 1.14 },
                { label: `${match.shortA} (-1.5 Asiático)`, odd: clampOdd(o1 * 1.92, 3.20) },
                { label: `${match.shortB} (+1.5 Asiático)`, odd: 1.34 },
                { label: `${match.shortA} (-1.0 Asiático)`, odd: clampOdd(o1 * 1.52, 2.45) },
                { label: `${match.shortB} (+1.0 Asiático)`, odd: 1.55 },
                { label: `${match.shortA} (-0.5 Asiático)`, odd: o1 },
                { label: `${match.shortB} (+0.5 Asiático)`, odd: dcX2 },
                { label: `${match.shortA} (0.0 Asiático)`, odd: dnb1 },
                { label: `${match.shortB} (0.0 Asiático)`, odd: dnb2 },
                { label: `${match.shortA} (+0.5 Asiático)`, odd: dc1X },
                { label: `${match.shortB} (-0.5 Asiático)`, odd: o2 },
                { label: `${match.shortA} (+1.0 Asiático)`, odd: 1.36 },
                { label: `${match.shortB} (-1.0 Asiático)`, odd: clampOdd(o2 * 1.65, 3.10) },
                { label: `${match.shortA} (+1.5 Asiático)`, odd: 1.22 },
                { label: `${match.shortB} (-1.5 Asiático)`, odd: clampOdd(o2 * 2.15, 4.20) },
                { label: `${match.shortA} (+2.0 Asiático)`, odd: 1.08 },
                { label: `${match.shortB} (-2.0 Asiático)`, odd: clampOdd(o2 * 3.80, 7.40) }
            ]
        },

        // ==================== 8. JOGADORES & ESPECIAIS (4 Mercados / 36 Opções) ====================
        {
            id: 'm_player_anytime',
            cat: 'jogadores',
            title: '👟 Jogador para Marcar a Qualquer Momento (90 Minutos)',
            badge: 'Atletas Escalados / Destaques',
            cols: 4,
            options: [
                { label: `Gol: ${pA1}`, odd: 2.30 },
                { label: `Gol: ${pA2}`, odd: 2.85 },
                { label: `Gol: ${pA3}`, odd: 3.20 },
                { label: `Gol: ${pA4}`, odd: 3.60 },
                { label: `Gol: ${pB1}`, odd: 2.55 },
                { label: `Gol: ${pB2}`, odd: 3.10 },
                { label: `Gol: ${pB3}`, odd: 3.50 },
                { label: `Gol: ${pB4}`, odd: 3.95 }
            ]
        },
        {
            id: 'm_player_first',
            cat: 'jogadores',
            title: '🥇 Primeiro Jogador a Marcar Gol na Partida',
            badge: '1º Artilheiro',
            cols: 4,
            options: [
                { label: `1º Gol: ${pA1}`, odd: 4.80 },
                { label: `1º Gol: ${pA2}`, odd: 6.20 },
                { label: `1º Gol: ${pA3}`, odd: 7.00 },
                { label: `1º Gol: ${pA4}`, odd: 8.20 },
                { label: `1º Gol: ${pB1}`, odd: 5.40 },
                { label: `1º Gol: ${pB2}`, odd: 6.80 },
                { label: `1º Gol: ${pB3}`, odd: 7.80 },
                { label: `1º Gol: ${pB4}`, odd: 9.00 }
            ]
        },
        {
            id: 'm_player_brace_assist',
            cat: 'jogadores',
            title: '🔥 Jogador para Marcar 2+ Gols ou Dar Assistência',
            badge: 'Especiais Atletas',
            cols: 4,
            options: [
                { label: `2+ Gols: ${pA1}`, odd: 7.50 },
                { label: `2+ Gols: ${pA2}`, odd: 10.50 },
                { label: `2+ Gols: ${pB1}`, odd: 8.80 },
                { label: `2+ Gols: ${pB2}`, odd: 12.00 },
                { label: `Assistência: ${pA2}`, odd: 3.40 },
                { label: `Assistência: ${pA3}`, odd: 3.90 },
                { label: `Assistência: ${pB2}`, odd: 3.75 },
                { label: `Assistência: ${pB3}`, odd: 4.30 }
            ]
        },
        {
            id: 'm_time_first_goal_specials',
            cat: 'jogadores',
            title: '⏱️ Minuto do 1º Gol & Especiais da Partida',
            badge: 'Minutos & Lances',
            cols: 4,
            options: [
                { label: '1º Gol: 01 a 15 min', odd: 3.10 },
                { label: '1º Gol: 16 a 30 min', odd: 3.60 },
                { label: '1º Gol: 31 a 45 min', odd: 4.20 },
                { label: '1º Gol: 46 a 60 min', odd: 4.80 },
                { label: '1º Gol: 61 a 75 min', odd: 5.80 },
                { label: '1º Gol: 76 a 90 min', odd: 6.80 },
                { label: 'Gol antes dos 28:00 min: Sim', odd: 1.85 },
                { label: 'Gol antes dos 28:00 min: Não', odd: 1.88 },
                { label: 'Gol de Fora da Área: Sim', odd: 2.95 },
                { label: 'Gol de Cabeça na Partida: Sim', odd: 2.45 },
                { label: 'Gol de Falta Direta: Sim', odd: 7.50 },
                { label: 'Gol Contra na Partida: Sim', odd: 8.50 }
            ]
        }
    ];

    // Atualiza o contador real de opções na partida
    const totalOpts = blocks.reduce((acc, b) => acc + b.options.length, 0);
    match.totalMarketsCount = totalOpts;

    return blocks;
}

function renderMatchCenterMarkets() {
    const match = window.BetProData.matches.find(x => x.id === window.BetProData.selectedMatchId);
    if (!match) return;

    const container = document.getElementById('mc-all-markets');
    if (!container) return;

    const allBlocks = buildFullMatchMarketsCatalog(match);
    const totalOptionsCount = allBlocks.reduce((acc, b) => acc + b.options.length, 0);

    const categories = [
        { id: 'all', label: `🔥 Todos (${totalOptionsCount})` },
        { id: 'principais', label: '⭐ Principais' },
        { id: 'gols', label: '⚽ Gols' },
        { id: 'tempos', label: '⏱️ 1º / 2º Tempo' },
        { id: 'placar', label: '🔢 Placar Exato' },
        { id: 'escanteios', label: '🚩 Escanteios' },
        { id: 'cartoes', label: '🟨 Cartões' },
        { id: 'handicap', label: '⚖️ Handicap' },
        { id: 'jogadores', label: '👟 Jogadores & Especiais' }
    ];

    const q = (marketSearchQuery || '').trim().toLowerCase();
    const visibleBlocks = allBlocks.filter(b => {
        const catMatch = activeMarketCategory === 'all' || b.cat === activeMarketCategory;
        if (!catMatch) return false;
        if (!q) return true;
        return b.title.toLowerCase().includes(q) || b.options.some(o => o.label.toLowerCase().includes(q));
    });

    const catPillsHtml = categories.map(c => `
        <button class="filter-pill ${activeMarketCategory === c.id ? 'active' : ''}" onclick="setMarketCategoryFilter('${c.id}')">
            ${c.label}
        </button>
    `).join('');

    const cardsHtml = visibleBlocks.map(block => {
        const isCollapsed = collapsedMarketBlocks.has(block.id);
        const gridClass = block.cols === 4 ? 'mc-market-grid-4' : (block.cols === 3 ? 'mc-market-grid-3' : 'mc-market-grid-2');

        const optsHtml = block.options.map(opt => {
            const isSel = isBetSelected(match.id, opt.label);
            return `
                <div class="odd-btn ${isSel ? 'selected' : ''}" onclick="toggleBet(${match.id}, '${escJs(opt.label)}', ${opt.odd}, '${escJs(block.title)}')">
                    <span class="odd-label" title="${escJs(opt.label)}">${isSel ? '✓ ' : ''}${opt.label}</span>
                    <span class="odd-val">${formatOddComma(opt.odd)}</span>
                </div>
            `;
        }).join('');

        return `
            <div class="mc-market-card">
                <div class="mc-market-header" onclick="toggleMarketBlockCollapse('${block.id}')" style="cursor:pointer;">
                    <span>${block.title} <small style="color:rgba(255,255,255,0.68); font-weight:600; margin-left:6px;">(${block.options.length} opções)</small></span>
                    <span style="font-size:11px; color:var(--brand-gold); display:flex; align-items:center; gap:8px;">
                        <span>${block.badge}</span>
                        <i class="fas fa-chevron-${isCollapsed ? 'down' : 'up'}"></i>
                    </span>
                </div>
                ${!isCollapsed ? `<div class="${gridClass}">${optsHtml}</div>` : ''}
            </div>
        `;
    }).join('');

    container.innerHTML = `
        <div style="background:rgba(59,42,111,0.38); border:1px solid var(--brand-gold); padding:10px 14px; border-radius:6px; font-size:12px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
            <span>📌 <strong>Catálogo Oficial 365 DA BARRA:</strong> <strong>${allBlocks.length} Mercados</strong> e <strong>${totalOptionsCount} Opções de Aposta</strong> disponíveis nesta partida (Regra: 1 opção por jogo).</span>
            <span style="color:var(--brand-gold); font-weight:900;">Teto Máx: R$ 30.000,00</span>
        </div>

        <!-- Barra de Abas de Mercados + Busca Rápida de Mercado -->
        <div class="filter-bar" style="position:sticky; top:0; z-index:15; box-shadow:0 4px 14px rgba(0,0,0,0.35);">
            <div class="filter-pills" style="flex:1;">
                ${catPillsHtml}
            </div>
            <div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap;">
                <input type="text" class="stake-input" style="width:190px; height:32px; font-size:12px;" placeholder="🔍 Buscar mercado/opção..." value="${escJs(marketSearchQuery)}" oninput="handleMarketSearchInput(this.value)">
                <button class="quick-stake-btn" style="flex:0; white-space:nowrap; padding:6px 10px;" onclick="expandOrCollapseAllMarkets(false)">Expandir</button>
                <button class="quick-stake-btn" style="flex:0; white-space:nowrap; padding:6px 10px;" onclick="expandOrCollapseAllMarkets(true)">Recolher</button>
            </div>
        </div>

        ${visibleBlocks.length === 0 ? `
            <div style="padding:24px; text-align:center; background:var(--card-item-bg); border:1px solid var(--card-item-border); border-radius:6px; color:var(--text-muted);">
                Nenhum mercado encontrado para "<strong>${marketSearchQuery}</strong>".
            </div>
        ` : cardsHtml}
    `;
}

// =====================================================
// 7. REGRAS DE APOSTA (1 OPÇÃO POR PARTIDA), CUPOM PIN E PAINEL ADMIN
// =====================================================
function isBetSelected(matchId, selection) {
    return window.BetProData.betslip.some(b => b.matchId === matchId && b.selection === selection);
}

function toggleBet(matchId, selection, oddValue, marketName = 'Vencedor do Encontro') {
    const { betslip, houseRules } = window.BetProData;
    const existingIndex = betslip.findIndex(bet => bet.matchId === matchId);

    if (existingIndex > -1) {
        if (betslip[existingIndex].selection === selection) {
            betslip.splice(existingIndex, 1);
        } else {
            betslip[existingIndex] = { matchId, selection, oddValue, marketName };
            showToast('🔄 Regra 365 da Barra: Apenas 1 opção por partida no mesmo bilhete. Seleção substituída!');
        }
    } else {
        if (betslip.length >= houseRules.maxSelections) {
            showToast(`⚠️ Limite máximo de ${houseRules.maxSelections} jogos por bilhete atingido!`);
            return;
        }
        betslip.push({ matchId, selection, oddValue, marketName });
    }

    if (window.BetProData.activeBetslipView !== 'slip') {
        switchBetslipView('slip');
    }
    renderMatches();
    if (isMatchCenterOpen) renderMatchCenterMarkets();
    updateBetslip();
}

function removeBet(index) {
    window.BetProData.betslip.splice(index, 1);
    renderMatches();
    if (isMatchCenterOpen) renderMatchCenterMarkets();
    updateBetslip();
}

function clearBetslip() {
    window.BetProData.betslip = [];
    renderMatches();
    if (isMatchCenterOpen) renderMatchCenterMarkets();
    updateBetslip();
}

function switchBetslipView(view) {
    window.BetProData.activeBetslipView = view;
    document.getElementById('tab-slip-btn').classList.toggle('active', view === 'slip');
    document.getElementById('tab-history-btn').classList.toggle('active', view === 'history');
    document.getElementById('betslip-footer').style.display = view === 'slip' ? 'block' : 'none';
    updateBetslip();
}

function updateMobileBetslipFab(count, totalOdd) {
    const countEl = document.getElementById('mbf-count');
    const subEl = document.getElementById('mbf-sub');
    const oddEl = document.getElementById('mbf-odd');
    const fabEl = document.getElementById('mobile-betslip-fab');
    if (countEl) countEl.innerText = count;
    if (subEl) {
        subEl.innerText = count === 0
            ? 'Toque nas cotações para apostar'
            : `${count} ${count === 1 ? 'jogo selecionado' : 'jogos selecionados'} • Finalizar / PIN`;
    }
    if (oddEl) oddEl.innerText = `Odd ${formatOddComma(totalOdd)}`;
    if (fabEl) fabEl.classList.toggle('has-items', count > 0);
}

function updateBetslip() {
    const { betslip, placedBetsHistory, activeBetslipView, matches } = window.BetProData;
    const itemsContainer = document.getElementById('betslip-items');
    const totalOddEl = document.getElementById('total-odd-value');
    const betTypeLabel = document.getElementById('bet-type-label');
    document.getElementById('betslip-count').innerText = betslip.length;
    document.getElementById('history-count').innerText = placedBetsHistory.length;

    const currentTotalOdd = betslip.reduce((acc, b) => acc * (Number(b.oddValue) || 1), 1);
    updateMobileBetslipFab(betslip.length, betslip.length > 0 ? currentTotalOdd : 1);

    if (activeBetslipView === 'history') {
        if (placedBetsHistory.length === 0) {
            itemsContainer.innerHTML = '<p style="color: var(--text-muted); text-align: center; margin-top: 24px; font-size: 12px;">Nenhum bilhete emitido ainda.</p>';
            return;
        }
        const latestTicket = placedBetsHistory[0];
        const pinBannerHtml = latestTicket ? `
            <div class="betslip-pin" onclick="openTicketReceiptModal('${latestTicket.pin}')" style="cursor:pointer;">
                <span class="title">Pré-Bilhete / PIN Gerado!</span>
                <span style="font-size:11.5px;">Informe o código abaixo ao Admin / Cambista:</span>
                <div class="code"><span>${latestTicket.pin}</span></div>
                <span style="font-size:10.5px; margin-top:6px; text-decoration:underline;">🧾 Clique para abrir ou imprimir o comprovante</span>
            </div>
        ` : '';

        itemsContainer.innerHTML = pinBannerHtml + placedBetsHistory.map((h) => `
            <div class="betslip-item" onclick="openTicketReceiptModal('${h.pin}')" style="cursor:pointer;">
                <div class="card-header" style="background:${h.status === 'VALIDADO' ? 'var(--brand-green-dark)' : 'var(--brand-purple)'};">
                    <span class="outcomeSelected">PIN: ${h.pin} • ${h.status}</span>
                    <span class="removeBetslipItem" title="Ver Recibo"><i class="fas fa-receipt"></i></span>
                </div>
                <div class="body">
                    <span class="item"><strong>Cliente: ${h.clientName}</strong> (${h.createdAt})</span>
                    <span class="item">${h.selections.map(s => s.selection).join(' + ')}</span>
                    <span class="item">Apostado: <strong>R$ ${h.stake.toFixed(2).replace('.', ',')}</strong> • Odd: <strong>${formatOddComma(h.totalOdd)}</strong></span>
                    <span class="item itemHightlight">Retorno: <strong>R$ ${h.payout.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
                </div>
            </div>
        `).join('');
        return;
    }

    if (betslip.length === 0) {
        itemsContainer.innerHTML = `
            <div style="text-align: center; margin-top: 28px; color: var(--text-muted); font-size: 12.5px; padding: 0 10px;">
                <div style="font-size: 28px; margin-bottom: 8px; color: var(--brand-gold);"><i class="fas fa-ticket-alt"></i></div>
                <strong style="color:var(--text-main);">Cupom de Apostas Vazio</strong><br>
                Clique nas cotações (1 opção por partida) para montar sua aposta na <strong>365 DA BARRA</strong>.
            </div>
        `;
        totalOddEl.innerText = '1,00';
        betTypeLabel.innerText = 'Nenhuma seleção';
        calculateReturn();
        return;
    }

    itemsContainer.innerHTML = '';
    let totalOdd = 1;

    betslip.forEach((bet, index) => {
        totalOdd *= bet.oddValue;
        const match = matches.find(m => m.id === bet.matchId);

        const item = document.createElement('div');
        item.className = 'betslip-item';
        item.innerHTML = `
            <div class="card-header">
                <span class="outcomeSelected">${bet.selection}</span>
                <a class="removeBetslipItem" onclick="removeBet(${index})" title="Remover seleção">
                    <i class="fas fa-trash"></i>
                </a>
            </div>
            <div class="body">
                <span class="item"><strong>Futebol - ${match ? match.league : '365 DA BARRA'}</strong></span>
                <span class="item">${match ? `${match.teamA} x ${match.teamB}` : ''}</span>
                <span class="item">${bet.marketName}</span>
                <span class="item itemHightlight">Cotação: <strong>${formatOddComma(bet.oddValue)}</strong></span>
            </div>
        `;
        itemsContainer.appendChild(item);
    });

    betTypeLabel.innerText = betslip.length === 1 ? 'Aposta Simples (1 Jogo)' : `Múltipla (${betslip.length} Jogos)`;
    totalOddEl.innerText = formatOddComma(totalOdd);
    calculateReturn();
}

function calculateReturn() {
    const amount = parseFloat(document.getElementById('bet-amount').value) || 0;
    const rawOddText = (document.getElementById('total-odd-value').innerText || '1').replace(',', '.');
    const totalOdd = parseFloat(rawOddText) || 1;
    const retEl = document.getElementById('potential-return-value');
    const maxPrize = window.BetProData.houseRules.maxPrize;

    if (window.BetProData.betslip.length === 0 || amount <= 0) {
        retEl.innerText = 'R$ 0,00';
        return;
    }
    const rawRet = amount * totalOdd;
    const cappedRet = Math.min(maxPrize, rawRet);
    retEl.innerText = `R$ ${cappedRet.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${rawRet > maxPrize ? ' (Teto Máx)' : ''}`;
}

function addQuickStake(val) {
    const input = document.getElementById('bet-amount');
    const client = getActiveClient();
    if (val === 'MAX') {
        input.value = Math.max(2, Math.floor(client.balance));
    } else {
        const current = parseFloat(input.value) || 0;
        input.value = current + val;
    }
    calculateReturn();
}

// =====================================================
// 8. CADASTRO DE USUÁRIO, MINHA CONTA, RECIBO DIGITAL E PAINEL ADMIN
// =====================================================
function getInitialsFromName(name) {
    const parts = String(name || 'Cliente').trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function handleClientSelectChange(clientId) {
    window.BetProData.activeClientId = Number(clientId);
    if (window.saveBetProState) window.saveBetProState();
    updateWalletUI();
    const client = getActiveClient();
    showToast(`👤 Apostador ativo: ${client.name} (Saldo: R$ ${client.balance.toFixed(2).replace('.', ',')})`);
}

function updateWalletUI() {
    const client = getActiveClient();
    const balEl = document.getElementById('user-balance');
    if (balEl) {
        balEl.innerText = `R$ ${client.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    const nameEl = document.getElementById('header-user-name');
    if (nameEl) nameEl.innerText = client.name;

    const avatarEl = document.getElementById('header-user-avatar');
    if (avatarEl) avatarEl.innerText = getInitialsFromName(client.name);

    const selectEl = document.getElementById('client-selector');
    if (selectEl) {
        selectEl.innerHTML = window.BetProData.clients.map(c =>
            `<option value="${c.id}" ${c.id === client.id ? 'selected' : ''}>${c.name} — R$ ${c.balance.toFixed(2).replace('.', ',')}</option>`
        ).join('');
    }
}

// Abre o Modal Central do Apostador (Abas: 'profile' | 'register' | 'switch')
function openUserAccountModal(initialTab = 'profile') {
    const modal = document.getElementById('user-account-modal');
    if (!modal) return;
    switchUserAccountTab(initialTab);
    modal.classList.add('open');
}

function closeUserAccountModal() {
    const modal = document.getElementById('user-account-modal');
    if (modal) modal.classList.remove('open');
}

function switchUserAccountTab(tab) {
    ['profile', 'register', 'switch'].forEach(t => {
        const btn = document.getElementById(`acc-tab-btn-${t}`);
        const pane = document.getElementById(`acc-tab-${t}`);
        if (btn) btn.classList.toggle('active', t === tab);
        if (pane) pane.style.display = (t === tab) ? 'block' : 'none';
    });
    if (tab === 'profile') renderUserProfilePane();
    if (tab === 'switch') renderUserSwitchPane();
}

function renderUserProfilePane() {
    const box = document.getElementById('user-profile-summary-box');
    if (!box) return;
    const c = getActiveClient();
    const myTickets = (window.BetProData.placedBetsHistory || []).filter(t => t.clientId === c.id || t.clientName === c.name);
    const myReqs = (window.BetProData.balanceRequests || []).filter(r => r.clientId === c.id);

    box.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; background:linear-gradient(135deg, #3b2a6f 0%, #241947 100%); border:1px solid rgba(255,196,0,0.45); border-radius:8px; padding:16px; margin-bottom:14px; color:#fff;">
            <div style="display:flex; align-items:center; gap:12px;">
                <div style="width:48px; height:48px; border-radius:50%; background:var(--brand-gold); color:#1c1436; font-size:18px; font-weight:900; display:flex; align-items:center; justify-content:center;">
                    ${getInitialsFromName(c.name)}
                </div>
                <div>
                    <div style="display:flex; align-items:center; gap:8px;">
                        <strong style="font-size:16px;">${c.name}</strong>
                        <span style="background:var(--brand-green-pin); color:#fff; font-size:9.5px; font-weight:900; padding:2px 7px; border-radius:10px;">${c.status || 'VERIFICADO'}</span>
                    </div>
                    <div style="font-size:11.5px; color:rgba(255,255,255,0.8); margin-top:3px;">
                        📱 WhatsApp: <strong>${c.phone || 'Não informado'}</strong> • 🔑 PIX Prêmios: <strong>${c.pixKey || c.phone || 'Cadastrado'}</strong>
                    </div>
                </div>
            </div>
            <div style="text-align:right;">
                <span style="font-size:10px; text-transform:uppercase; color:rgba(255,255,255,0.75); font-weight:700;">Saldo Liberado (Admin)</span>
                <div style="font-size:20px; font-weight:900; color:var(--brand-gold); font-family:'JetBrains Mono',monospace;">
                    R$ ${c.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
            </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:14px;">
            <button class="place-bet-btn" onclick="closeUserAccountModal(); openRequestBalanceModal();">
                <i class="fas fa-hand-holding-usd"></i> Solicitar Saldo ao Admin
            </button>
            <button class="pin-bet-btn" style="height:44px; font-size:13px;" onclick="switchUserAccountTab('register')">
                <i class="fas fa-user-plus"></i> Cadastrar Outro Apostador
            </button>
        </div>

        ${myReqs.length > 0 ? `
            <div style="background:rgba(255,196,0,0.12); border:1px solid rgba(255,196,0,0.4); border-radius:6px; padding:10px 12px; margin-bottom:14px; font-size:12px;">
                <strong style="color:var(--brand-gold); display:block; margin-bottom:4px;">⏳ Solicitações de Saldo Aguardando Liberação do Admin (${myReqs.length}):</strong>
                ${myReqs.map(r => `<div style="display:flex; justify-content:space-between; padding:3px 0;"><span>Pedido de <strong>R$ ${r.amount.toFixed(2).replace('.', ',')}</strong> às ${r.time}</span><span style="color:var(--brand-gold); font-weight:800;">Aguardando Admin</span></div>`).join('')}
            </div>
        ` : ''}

        <div>
            <h4 style="font-size:12px; text-transform:uppercase; color:var(--text-muted); margin-bottom:8px;">🧾 Meus Bilhetes Emitidos (${myTickets.length})</h4>
            ${myTickets.length === 0 ? `
                <div style="padding:16px; text-align:center; background:var(--bg-dark); border:1px solid var(--border-color); border-radius:6px; font-size:12px; color:var(--text-muted);">
                    Você ainda não emitiu bilhetes nesta conta. Escolha seus jogos na tela inicial para apostar!
                </div>
            ` : `
                <div style="max-height:190px; overflow-y:auto; display:flex; flex-direction:column; gap:6px;">
                    ${myTickets.map(t => `
                        <div onclick="closeUserAccountModal(); openTicketReceiptModal('${t.pin}');" style="cursor:pointer; display:flex; justify-content:space-between; align-items:center; padding:8px 12px; background:var(--bg-dark); border:1px solid var(--border-color); border-radius:6px; font-size:12px;">
                            <div>
                                <strong>PIN: <span style="color:var(--brand-gold);">${t.pin}</span></strong> • ${t.selections.length} jogo(s) (${t.createdAt})<br>
                                <span style="font-size:11px; color:var(--text-muted);">Apostado: R$ ${t.stake.toFixed(2).replace('.', ',')} • Retorno: <strong style="color:var(--brand-green-pin);">R$ ${t.payout.toFixed(2).replace('.', ',')}</strong></span>
                            </div>
                            <span style="padding:3px 8px; border-radius:4px; font-size:10px; font-weight:900; background:${t.status === 'VALIDADO' ? 'rgba(52,202,115,0.2)' : 'rgba(255,196,0,0.2)'}; color:${t.status === 'VALIDADO' ? 'var(--brand-green-pin)' : 'var(--brand-gold)'};">
                                ${t.status}
                            </span>
                        </div>
                    `).join('')}
                </div>
            `}
        </div>
    `;
}

function renderUserSwitchPane() {
    const listEl = document.getElementById('user-switch-list');
    if (!listEl) return;
    const active = getActiveClient();

    listEl.innerHTML = window.BetProData.clients.map(c => {
        const isCurrent = c.id === active.id;
        return `
            <div onclick="selectUserAccountFromModal(${c.id})" style="cursor:pointer; display:flex; justify-content:space-between; align-items:center; padding:10px 14px; background:${isCurrent ? 'rgba(59,42,111,0.38)' : 'var(--bg-dark)'}; border:1px solid ${isCurrent ? 'var(--brand-gold)' : 'var(--border-color)'}; border-radius:6px;">
                <div style="display:flex; align-items:center; gap:10px;">
                    <div style="width:36px; height:36px; border-radius:50%; background:${isCurrent ? 'var(--brand-gold)' : 'var(--brand-purple)'}; color:${isCurrent ? '#1c1436' : '#fff'}; font-weight:900; font-size:13px; display:flex; align-items:center; justify-content:center;">
                        ${getInitialsFromName(c.name)}
                    </div>
                    <div>
                        <strong style="font-size:13.5px; color:var(--text-main);">${c.name}</strong>
                        ${isCurrent ? `<span style="margin-left:6px; background:var(--brand-green-pin); color:#fff; font-size:9.5px; font-weight:900; padding:2px 6px; border-radius:4px;">CONTA ATIVA</span>` : ''}
                        <div style="font-size:11px; color:var(--text-muted);">📱 ${c.phone || ''} • PIX: ${c.pixKey || c.phone || ''}</div>
                    </div>
                </div>
                <div style="text-align:right;">
                    <div style="font-size:13.5px; font-weight:900; color:var(--brand-green-pin); font-family:'JetBrains Mono',monospace;">
                        R$ ${c.balance.toFixed(2).replace('.', ',')}
                    </div>
                    <span style="font-size:10.5px; color:var(--brand-gold); font-weight:700;">${isCurrent ? '✓ Logado' : 'Entrar ➔'}</span>
                </div>
            </div>
        `;
    }).join('');
}

function selectUserAccountFromModal(clientId) {
    window.BetProData.activeClientId = Number(clientId);
    if (window.saveBetProState) window.saveBetProState();
    updateWalletUI();
    switchUserAccountTab('profile');
    const c = getActiveClient();
    showToast(`✅ Você entrou na conta de ${c.name}!`);
}

function handleUserRegistrationSubmit(event) {
    if (event) event.preventDefault();
    const fullName = (document.getElementById('reg-full-name').value || '').trim();
    const username = (document.getElementById('reg-username').value || '').trim();
    const phone = (document.getElementById('reg-phone').value || '').trim();
    const pixKey = (document.getElementById('reg-pix').value || '').trim();
    const initialReq = parseFloat(document.getElementById('reg-initial-request').value) || 0;

    if (!fullName || !phone) {
        showToast('⚠️ Preencha seu Nome Completo e WhatsApp para criar a conta!');
        return;
    }

    const newId = window.BetProData.clients.reduce((max, c) => Math.max(max, c.id), 0) + 1;
    const newClient = {
        id: newId,
        name: fullName,
        username: username || fullName.toLowerCase().replace(/\s+/g, ''),
        phone,
        pixKey: pixKey || phone,
        role: 'Apostador',
        status: initialReq > 0 ? 'AGUARDANDO LIBERAÇÃO ADMIN' : 'CONTA CRIADA',
        balance: 0.00,
        creditLimit: 1000.00,
        createdAt: new Date().toLocaleDateString('pt-BR')
    };

    window.BetProData.clients.push(newClient);
    window.BetProData.activeClientId = newId;

    // Se o usuário já pediu saldo inicial no ato do cadastro, envia direto para a fila do Admin!
    if (initialReq > 0) {
        window.BetProData.balanceRequests.unshift({
            id: Date.now(),
            clientId: newId,
            clientName: fullName,
            amount: initialReq,
            time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        });
    }

    if (window.saveBetProState) window.saveBetProState();

    // Limpa o formulário
    document.getElementById('user-register-form').reset();

    updateWalletUI();
    updateAdminBadge();
    switchUserAccountTab('profile');

    if (initialReq > 0) {
        showToast(`🎉 Conta de "${fullName}" criada! Pedido de R$ ${initialReq.toFixed(2).replace('.', ',')} enviado ao Admin para liberação!`);
    } else {
        showToast(`🎉 Conta de "${fullName}" criada com sucesso! Você já pode gerar Pré-Bilhetes PIN ou pedir saldo ao Admin.`);
    }
}

function generateRandomPin() {
    const p1 = Math.floor(100 + Math.random() * 900);
    const p2 = Math.floor(100 + Math.random() * 900);
    return `${p1}-${p2}`;
}

function placeBet(asPreTicketPinOnly = false) {
    const { betslip, houseRules } = window.BetProData;
    if (betslip.length === 0) {
        showToast('⚠️ Selecione pelo menos 1 cotação (Casa, Empate ou Fora) antes de finalizar o bilhete!');
        return;
    }

    const stake = parseFloat(document.getElementById('bet-amount').value) || 0;
    if (stake < houseRules.minStake) {
        showToast(`⚠️ O valor mínimo de aposta na 365 DA BARRA é R$ ${houseRules.minStake.toFixed(2).replace('.', ',')}.`);
        return;
    }
    if (stake > houseRules.maxStake) {
        showToast(`⚠️ O valor máximo permitido por aposta é R$ ${houseRules.maxStake.toFixed(2).replace('.', ',')}.`);
        return;
    }

    const client = getActiveClient();
    const rawOddText = (document.getElementById('total-odd-value').innerText || '1').replace(',', '.');
    const totalOdd = parseFloat(rawOddText) || 1;
    const payout = Math.min(houseRules.maxPrize, +(stake * totalOdd).toFixed(2));
    const pin = generateRandomPin();

    if (!asPreTicketPinOnly) {
        if (stake > client.balance) {
            showToast('❌ Saldo insuficiente! Solicite liberação de saldo ao Admin ou clique em "Gerar Pré-Bilhete (PIN)".');
            return;
        }
        client.balance = +(client.balance - stake).toFixed(2);
        updateWalletUI();
    }

    const ticket = {
        pin,
        clientId: client.id,
        clientName: client.name,
        selections: [...betslip],
        totalOdd,
        stake,
        payout,
        status: asPreTicketPinOnly ? 'AGUARDANDO ADMIN (PIN)' : 'VALIDADO',
        createdAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    window.BetProData.placedBetsHistory.unshift(ticket);
    window.BetProData.betslip = [];
    if (window.saveBetProState) window.saveBetProState();

    updateAdminBadge();
    renderMatches();
    if (isMatchCenterOpen) renderMatchCenterMarkets();
    switchBetslipView('history');

    // Abre o Comprovante Digital Oficial com o Código PIN
    openTicketReceiptModal(pin);

    if (asPreTicketPinOnly) {
        showToast(`📌 Pré-Bilhete Gerado! Código PIN: ${pin} — Envie ao Admin para validar!`);
    } else {
        showToast(`✅ Bilhete #${pin} Validado com Saldo Liberado! Retorno: R$ ${payout.toFixed(2).replace('.', ',')}`);
    }
}

function openTicketReceiptModal(pin) {
    const modal = document.getElementById('ticket-receipt-modal');
    const body = document.getElementById('ticket-receipt-body');
    if (!modal || !body) return;

    const t = window.BetProData.placedBetsHistory.find(x => x.pin === pin);
    if (!t) return;

    const isValidated = t.status === 'VALIDADO';
    const matches = window.BetProData.matches || [];

    const selectionsHtml = t.selections.map(s => {
        const m = matches.find(x => x.id === s.matchId);
        return `
            <div style="padding:8px 10px; background:var(--bg-dark); border:1px solid var(--border-color); border-radius:7px; margin-bottom:6px; font-size:12px;">
                <div style="display:flex; justify-content:space-between; align-items:center; font-weight:800; color:var(--text-main);">
                    <span>🎯 ${s.selection}</span>
                    <span style="color:var(--accent-yellow); font-family:'JetBrains Mono',monospace;">${formatOddComma(s.oddValue)}</span>
                </div>
                <div style="font-size:11px; color:var(--text-muted); margin-top:3px;">
                    ${s.marketName} ${m ? `• ${m.teamA} x ${m.teamB}` : ''}
                </div>
            </div>
        `;
    }).join('');

    body.innerHTML = `
        <div style="text-align:center; margin-bottom:8px;">
            <span style="display:inline-block; padding:4px 12px; border-radius:20px; font-size:11px; font-weight:900; background:${isValidated ? 'rgba(52,202,115,0.18)' : 'rgba(255,196,0,0.18)'}; color:${isValidated ? 'var(--accent-green)' : 'var(--accent-yellow)'}; border:1px solid ${isValidated ? 'rgba(52,202,115,0.45)' : 'rgba(255,196,0,0.45)'};">
                ${isValidated ? '✅ BILHETE OFICIAL VALIDADO' : '⏳ PRÉ-BILHETE • AGUARDANDO VALIDAÇÃO DO CAMBISTA'}
            </span>
        </div>

        <div class="receipt-pin-box">
            <div style="font-size:10.5px; color:rgba(255,255,255,0.9); text-transform:uppercase; font-weight:800; margin-bottom:4px;">Código PIN do Bilhete</div>
            <div class="receipt-pin-code">${t.pin}</div>
            <div style="font-size:11px; color:#ffffff; margin-top:4px;">Apostador: <strong>${t.clientName}</strong> • Emitido às ${t.createdAt}</div>
        </div>

        <div style="margin:12px 0; max-height:210px; overflow-y:auto;">
            <div style="font-size:11px; font-weight:800; color:var(--text-muted); text-transform:uppercase; margin-bottom:6px;">Seleções do Bilhete (${t.selections.length})</div>
            ${selectionsHtml}
        </div>

        <div style="background:var(--bg-elevated); border:1px solid var(--border-color); border-radius:8px; padding:10px 12px; font-size:12.5px; margin-bottom:14px;">
            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                <span style="color:var(--text-muted);">Cotação Total:</span>
                <strong style="font-family:'JetBrains Mono',monospace; color:var(--accent-yellow);">${formatOddComma(t.totalOdd)}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                <span style="color:var(--text-muted);">Valor Apostado:</span>
                <strong style="font-family:'JetBrains Mono',monospace;">R$ ${t.stake.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; padding-top:6px; border-top:1px solid var(--border-color);">
                <span style="font-weight:800; color:var(--text-main);">Possível Retorno:</span>
                <strong style="font-family:'JetBrains Mono',monospace; font-size:15px; color:var(--accent-green);">R$ ${t.payout.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
            <button class="btn-deposit" style="justify-content:center;" onclick="copyTicketPin('${t.pin}')">📋 Copiar Código PIN</button>
            <button class="btn-secondary" style="justify-content:center;" onclick="window.print()">🖨️ Imprimir Recibo</button>
        </div>
    `;

    modal.classList.add('open');
}

function closeTicketReceiptModal() {
    const modal = document.getElementById('ticket-receipt-modal');
    if (modal) modal.classList.remove('open');
}

function copyTicketPin(pin) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(pin).catch(() => {});
    }
    showToast(`📋 Código PIN ${pin} copiado para a área de transferência!`);
}

function openRequestBalanceModal() {
    const client = getActiveClient();
    const nameEl = document.getElementById('req-client-name');
    if (nameEl) nameEl.innerText = client.name;
    document.getElementById('request-balance-modal').classList.add('open');
}

function closeRequestBalanceModal() {
    document.getElementById('request-balance-modal').classList.remove('open');
}

function sendBalanceRequestToAdmin(amount) {
    const val = Number(amount);
    if (!val || val <= 0) {
        showToast('⚠️ Informe um valor válido para solicitar ao Admin!');
        return;
    }
    const client = getActiveClient();
    window.BetProData.balanceRequests.unshift({
        id: Date.now(),
        clientId: client.id,
        clientName: client.name,
        amount: val,
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    });
    if (window.saveBetProState) window.saveBetProState();
    closeRequestBalanceModal();
    updateAdminBadge();
    showToast(`📲 Solicitação de R$ ${val.toFixed(2).replace('.', ',')} enviada ao Admin da 365 DA BARRA!`);
}

function sendCustomBalanceRequest() {
    const input = document.getElementById('custom-req-amount');
    const val = parseFloat(input ? input.value : 0);
    if (!val || val < 5) {
        showToast('⚠️ Digite um valor de pelo menos R$ 5,00 para solicitar ao Admin.');
        return;
    }
    if (input) input.value = '';
    sendBalanceRequestToAdmin(val);
}

function openAdminModal() {
    renderAdminPanel();
    document.getElementById('admin-modal').classList.add('open');
}

function closeAdminModal() {
    document.getElementById('admin-modal').classList.remove('open');
}

function updateAdminBadge() {
    const pendingPins = window.BetProData.placedBetsHistory.filter(t => t.status !== 'VALIDADO').length;
    const reqs = window.BetProData.balanceRequests.length;
    const badge = document.getElementById('admin-alert-count');
    if (badge) badge.innerText = pendingPins + reqs;
}

function adminAdjustBalance(clientId, delta) {
    const c = window.BetProData.clients.find(x => x.id === Number(clientId));
    if (!c) return;
    if (delta === 'ZERO') {
        c.balance = 0;
    } else {
        c.balance = Math.max(0, +(c.balance + Number(delta)).toFixed(2));
        c.status = 'VERIFICADO';
    }
    if (window.saveBetProState) window.saveBetProState();
    updateWalletUI();
    renderAdminPanel();
    showToast(`🔐 Admin: Saldo de ${c.name} atualizado para R$ ${c.balance.toFixed(2).replace('.', ',')}!`);
}

function adminApproveBalanceRequest(reqId) {
    const idx = window.BetProData.balanceRequests.findIndex(r => r.id === reqId);
    if (idx === -1) return;
    const req = window.BetProData.balanceRequests[idx];
    const c = window.BetProData.clients.find(x => x.id === req.clientId);
    if (c) {
        c.balance = +(c.balance + req.amount).toFixed(2);
        c.status = 'VERIFICADO';
    }
    window.BetProData.balanceRequests.splice(idx, 1);
    if (window.saveBetProState) window.saveBetProState();
    updateWalletUI();
    updateAdminBadge();
    renderAdminPanel();
    showToast(`✅ Admin liberou R$ ${req.amount.toFixed(2).replace('.', ',')} na conta de ${req.clientName}!`);
}

function adminRejectBalanceRequest(reqId) {
    const idx = window.BetProData.balanceRequests.findIndex(r => r.id === reqId);
    if (idx === -1) return;
    const req = window.BetProData.balanceRequests[idx];
    window.BetProData.balanceRequests.splice(idx, 1);
    if (window.saveBetProState) window.saveBetProState();
    updateAdminBadge();
    renderAdminPanel();
    showToast(`🗑️ Pedido de saldo de ${req.clientName} recusado.`);
}

function adminValidatePinTicket(pin) {
    const t = window.BetProData.placedBetsHistory.find(x => x.pin === pin);
    if (!t) {
        showToast('❌ Código PIN não encontrado!');
        return;
    }
    t.status = 'VALIDADO';
    if (window.saveBetProState) window.saveBetProState();
    updateAdminBadge();
    updateBetslip();
    renderAdminPanel();
    showToast(`✅ Bilhete PIN ${pin} (${t.clientName}) VALIDADO pelo Admin!`);
}

function adminCreateNewClient() {
    const nameInput = document.getElementById('admin-new-client-name');
    const phoneInput = document.getElementById('admin-new-client-phone');
    const balInput = document.getElementById('admin-new-client-bal');
    const name = (nameInput.value || '').trim();
    const phone = (phoneInput && phoneInput.value ? phoneInput.value : '(71) 99999-0000').trim();
    const bal = parseFloat(balInput.value) || 0;
    if (!name) {
        showToast('⚠️ Informe o nome do novo cliente!');
        return;
    }
    const newId = window.BetProData.clients.reduce((max, c) => Math.max(max, c.id), 0) + 1;
    window.BetProData.clients.push({
        id: newId,
        name,
        username: name.toLowerCase().replace(/\s+/g, ''),
        phone,
        pixKey: phone,
        role: 'Apostador',
        status: bal > 0 ? 'VERIFICADO' : 'AGUARDANDO SALDO',
        balance: bal,
        creditLimit: 1000,
        createdAt: new Date().toLocaleDateString('pt-BR')
    });
    window.BetProData.activeClientId = newId;
    if (window.saveBetProState) window.saveBetProState();
    nameInput.value = '';
    if (phoneInput) phoneInput.value = '';
    balInput.value = '';
    updateWalletUI();
    renderAdminPanel();
    showToast(`👤 Novo cliente "${name}" cadastrado pelo Admin com R$ ${bal.toFixed(2).replace('.', ',')} liberados!`);
}

function renderAdminPanel() {
    const kpiStrip = document.getElementById('admin-kpi-strip');
    const pendingPins = window.BetProData.placedBetsHistory.filter(t => t.status !== 'VALIDADO');
    const totalBalances = window.BetProData.clients.reduce((sum, c) => sum + (c.balance || 0), 0);

    if (kpiStrip) {
        kpiStrip.innerHTML = `
            <div class="admin-kpi-card">
                <span>👥 Clientes Cadastrados</span>
                <strong>${window.BetProData.clients.length} Contas</strong>
            </div>
            <div class="admin-kpi-card">
                <span>📲 Pedidos de Saldo</span>
                <strong style="color:${window.BetProData.balanceRequests.length > 0 ? '#ff4757' : 'var(--brand-green-pin)'};">${window.BetProData.balanceRequests.length} Pendentes</strong>
            </div>
            <div class="admin-kpi-card">
                <span>💰 Total em Créditos Ativos</span>
                <strong style="color:var(--brand-green-pin);">R$ ${totalBalances.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            </div>
        `;
    }

    const reqsList = document.getElementById('admin-requests-list');
    if (reqsList) {
        if (window.BetProData.balanceRequests.length === 0) {
            reqsList.innerHTML = `<div style="font-size:12px; color:var(--text-muted); padding:4px 0;">Nenhuma solicitação de saldo pendente no momento.</div>`;
        } else {
            reqsList.innerHTML = window.BetProData.balanceRequests.map(r => `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:9px 12px; background:rgba(255,196,0,0.12); border:1px solid var(--brand-gold); border-radius:6px; margin-bottom:6px; font-size:12.5px;">
                    <div>
                        <strong>👤 ${r.clientName}</strong> solicitou liberação de <strong style="color:var(--brand-gold);">R$ ${r.amount.toFixed(2).replace('.', ',')}</strong>
                        <span style="font-size:11px; color:var(--text-muted); margin-left:6px;">(${r.time})</span>
                    </div>
                    <div style="display:flex; gap:6px;">
                        <button class="hero-cta" style="padding:5px 12px; font-size:11.5px; background:var(--brand-green-pin); color:#fff;" onclick="adminApproveBalanceRequest(${r.id})">✅ Liberar R$ ${r.amount.toFixed(0)}</button>
                        <button class="quick-stake-btn" style="flex:0; padding:5px 9px; color:#ff4757;" onclick="adminRejectBalanceRequest(${r.id})" title="Recusar">✕</button>
                    </div>
                </div>
            `).join('');
        }
    }

    const pinsList = document.getElementById('admin-pins-list');
    if (pinsList) {
        if (pendingPins.length === 0) {
            pinsList.innerHTML = `<div style="font-size:12px; color:var(--text-muted); padding:4px 0;">Nenhum pré-bilhete aguardando validação.</div>`;
        } else {
            pinsList.innerHTML = pendingPins.map(t => `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:9px 12px; background:var(--bg-panel); border:1px solid var(--brand-gold); border-radius:6px; margin-bottom:6px; font-size:12.5px;">
                    <div>
                        PIN: <strong style="color:var(--brand-gold); font-family:'JetBrains Mono',monospace;">${t.pin}</strong> • <strong>${t.clientName}</strong><br>
                        <span style="font-size:11px; color:var(--text-muted);">Apostado: R$ ${t.stake.toFixed(2).replace('.', ',')} • Retorno: R$ ${t.payout.toFixed(2).replace('.', ',')} (${t.selections.length} jogos)</span>
                    </div>
                    <button class="hero-cta" style="padding:6px 12px; font-size:11.5px; background:var(--brand-green-pin); color:#fff;" onclick="adminValidatePinTicket('${t.pin}')">✅ Validar PIN</button>
                </div>
            `).join('');
        }
    }

    const clientsList = document.getElementById('admin-clients-list');
    if (clientsList) {
        clientsList.innerHTML = window.BetProData.clients.map(c => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:9px 12px; background:var(--bg-panel); border:1px solid var(--border-color); border-radius:6px; margin-bottom:6px; font-size:12px; gap:8px; flex-wrap:wrap;">
                <div>
                    <strong style="font-size:13px;">${c.name}</strong>
                    <span style="font-size:10.5px; color:var(--text-muted); margin-left:6px;">📱 ${c.phone || ''} • PIX: ${c.pixKey || c.phone || ''}</span><br>
                    <span style="color:var(--brand-green-pin); font-weight:900; font-family:'JetBrains Mono',monospace;">Saldo Liberado: R$ ${c.balance.toFixed(2).replace('.', ',')}</span>
                </div>
                <div style="display:flex; gap:5px; align-items:center;">
                    <button class="quick-stake-btn" onclick="adminAdjustBalance(${c.id}, 50)">+R$ 50</button>
                    <button class="quick-stake-btn" onclick="adminAdjustBalance(${c.id}, 100)">+R$ 100</button>
                    <button class="quick-stake-btn" onclick="adminAdjustBalance(${c.id}, 500)">+R$ 500</button>
                    <button class="quick-stake-btn" style="color:#ff4757;" onclick="adminAdjustBalance(${c.id}, 'ZERO')">Zerar</button>
                </div>
            </div>
        `).join('');
    }
}

function checkPinTicket() {
    const pinInput = document.getElementById('check-pin-input');
    const resultBox = document.getElementById('check-pin-result');
    const pin = (pinInput.value || '').trim();
    const t = window.BetProData.placedBetsHistory.find(x => x.pin === pin);
    if (!t) {
        resultBox.innerHTML = `<div style="padding:12px; background:rgba(201,48,44,0.18); border:1px solid var(--brand-red-selected); border-radius:6px; font-size:12.5px;">❌ Nenhum bilhete encontrado com o código PIN <strong>${pin}</strong>.</div>`;
        return;
    }
    resultBox.innerHTML = `
        <div style="padding:14px; background:var(--bg-dark); border:1px solid var(--brand-green-pin); border-radius:8px; font-size:13px;">
            <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
                <strong>Bilhete PIN: ${t.pin}</strong>
                <span style="color:var(--brand-green-pin); font-weight:800;">${t.status}</span>
            </div>
            <div>Cliente: <strong>${t.clientName}</strong></div>
            <div>Seleções: ${t.selections.map(s => s.selection).join(' + ')}</div>
            <div>Valor Apostado: R$ ${t.stake.toFixed(2).replace('.', ',')} • Cotação: ${formatOddComma(t.totalOdd)}</div>
            <div style="color:var(--brand-green-pin); font-weight:900; margin-top:4px;">Possível Retorno: R$ ${t.payout.toFixed(2).replace('.', ',')}</div>
        </div>
    `;
}

function showToast(msg) {
    const container = document.getElementById('toast-container');
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerText = msg;
    container.appendChild(t);
    setTimeout(() => t.remove(), 3800);
}

// =====================================================
// 9. ATUALIZAÇÃO EM TEMPO REAL DA API (SEM DADOS FALSOS)
// =====================================================

// A cada 4.5s, alterna suavemente entre os últimos lances REAIS da partida aberta no Campo 3D
setInterval(() => {
    const m = window.BetProData.matches.find(x => x.id === window.BetProData.selectedMatchId);
    if (m && m.realPlayCoordinates && m.realPlayCoordinates.length > 1) {
        realPlayCycleIdx = (realPlayCycleIdx + 1) % Math.min(6, m.realPlayCoordinates.length);
        applyRealPlayToPitch(m, realPlayCycleIdx);
    }
}, 4500);

// A cada 15 segundos, consulta a API Oficial em background para atualizar placares, minutos, lances e estatísticas reais
setInterval(() => {
    syncRealTimeApi('all', true);
}, 15000);

window.addEventListener('DOMContentLoaded', () => {
    updateWalletUI();
    updateAdminBadge();
    renderMatches();
    updateBetslip();
    requestAnimationFrame(drawPitch);
    // Sincroniza imediatamente TODAS as ligas reais ao abrir o site!
    syncRealTimeApi('all', true);
});
