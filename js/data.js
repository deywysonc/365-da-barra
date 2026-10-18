// =========================================================================
// 365 DA BARRA - CONFIGURAÇÃO OFICIAL, CLIENTES E INTEGRAÇÃO 100% DADOS REAIS
// =========================================================================

const DEFAULT_CLIENTS = [
    {
        id: 1,
        name: 'Deywyson Machado',
        username: 'deywyson',
        phone: '(71) 99999-0001',
        pixKey: 'deywyson@pix.com.br',
        role: 'Cliente VIP',
        status: 'VERIFICADO',
        balance: 450.00,
        creditLimit: 2000.00,
        createdAt: '10/10/2026'
    },
    {
        id: 2,
        name: 'Carlos Eduardo',
        username: 'carlos',
        phone: '(71) 98888-1122',
        pixKey: '(71) 98888-1122',
        role: 'Apostador',
        status: 'VERIFICADO',
        balance: 120.00,
        creditLimit: 500.00,
        createdAt: '14/10/2026'
    },
    {
        id: 3,
        name: 'Marcos Silva',
        username: 'marcos',
        phone: '(71) 97777-3344',
        pixKey: '123.456.789-00',
        role: 'Apostador (PIN)',
        status: 'AGUARDANDO SALDO',
        balance: 0.00,
        creditLimit: 300.00,
        createdAt: '18/10/2026'
    }
];

function loadSavedState() {
    try {
        const raw = localStorage.getItem('betpro_365dabarra_state_v1');
        if (!raw) return null;
        return JSON.parse(raw);
    } catch (e) {
        return null;
    }
}

const savedState = loadSavedState();

window.BetProData = {
    houseName: '365 DA BARRA',
    currentView: 'matches', // 'matches', 'match-center', 'news', 'rules'
    currentFilter: 'all',
    currentApiLeague: 'all',
    searchQuery: '',
    selectedMatchId: null,
    activeTrackerTab: 'stats',
    activeBetslipView: 'slip',
    isLoadingMatches: true,

    // Opções visuais do Super Campo Ao Vivo
    showPlayersOnPitch: false,
    showBallTrail: true,
    showHeatmap: false,
    pitchPerspective3D: true,
    soundEnabled: false,

    // Regras Oficiais da Banca 365 DA BARRA (padrão 365dabarra-net.jogos.app / Bet365)
    houseRules: {
        maxPrize: 30000.00,        // Prêmio máximo por bilhete (R$ 30.000,00)
        minStake: 2.00,            // Valor mínimo da aposta
        maxStake: 5000.00,         // Valor máximo da aposta
        maxSelections: 20,         // Máximo de jogos em uma múltipla
        oneOptionPerMatch: true    // Regra oficial: apenas 1 opção por partida no mesmo bilhete
    },

    // Clientes Cadastrados (O cliente NÃO deposita sozinho; apenas o Admin libera saldo!)
    activeClientId: (savedState && savedState.activeClientId) ? savedState.activeClientId : 1,
    clients: (savedState && Array.isArray(savedState.clients) && savedState.clients.length > 0)
        ? savedState.clients
        : DEFAULT_CLIENTS,

    // Solicitações de Saldo enviadas ao Admin
    balanceRequests: (savedState && Array.isArray(savedState.balanceRequests))
        ? savedState.balanceRequests
        : [],

    // Campeonatos Conectados à API em Tempo Real
    apiLeagues: [
        { id: 'all', name: '🌍 Todos os Jogos Reais', flag: '🌍', espnSlug: 'all' },
        { id: 'live', name: '🔴 Ao Vivo Agora', flag: '⚡', espnSlug: 'all' },
        { id: 'bra.1', name: '🇧🇷 Brasil • Série A', flag: '🇧🇷', espnSlug: 'bra.1' },
        { id: 'bra.2', name: '🇧🇷 Brasil • Série B', flag: '🇧🇷', espnSlug: 'bra.2' },
        { id: 'eng.1', name: '🏴󠁧󠁢󠁥󠁮󠁧󠁿 Inglaterra • Premier League', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', espnSlug: 'eng.1' },
        { id: 'esp.1', name: '🇪🇸 Espanha • La Liga', flag: '🇪🇸', espnSlug: 'esp.1' },
        { id: 'ita.1', name: '🇮🇹 Itália • Série A', flag: '🇮🇹', espnSlug: 'ita.1' },
        { id: 'ger.1', name: '🇩🇪 Alemanha • Bundesliga', flag: '🇩🇪', espnSlug: 'ger.1' },
        { id: 'fra.1', name: '🇫🇷 França • Ligue 1', flag: '🇫🇷', espnSlug: 'fra.1' },
        { id: 'por.1', name: '🇵🇹 Portugal • Primeira Liga', flag: '🇵🇹', espnSlug: 'por.1' },
        { id: 'arg.1', name: '🇦🇷 Argentina • Liga Profesional', flag: '🇦🇷', espnSlug: 'arg.1' },
        { id: 'conmebol.libertadores', name: '🏆 CONMEBOL Libertadores', flag: '🏆', espnSlug: 'conmebol.libertadores' },
        { id: 'uefa.champions', name: '🇪🇺 UEFA Champions League', flag: '🇪🇺', espnSlug: 'uefa.champions' }
    ],

    // Notícias Reais em Português (API ESPN Brasil)
    newsArticles: [],

    // Lista de Partidas 100% Reais (populada ao vivo via syncRealTimeApi)
    matches: [],

    // Cupom de Apostas Ativo
    betslip: [],

    // Histórico de Bilhetes Emitidos
    placedBetsHistory: (savedState && Array.isArray(savedState.placedBetsHistory))
        ? savedState.placedBetsHistory
        : []
};

window.saveBetProState = function() {
    try {
        const payload = {
            activeClientId: window.BetProData.activeClientId,
            clients: window.BetProData.clients,
            balanceRequests: window.BetProData.balanceRequests,
            placedBetsHistory: window.BetProData.placedBetsHistory
        };
        localStorage.setItem('betpro_365dabarra_state_v1', JSON.stringify(payload));
    } catch (e) {}
};
