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

// Partidas Reais Oficiais (Garante catálogo imediato e rico ao abrir o site, atualizado via ESPN API)
const INITIAL_MATCHES = [
    {
        id: 401915401,
        espnId: '401915401',
        espnSlug: 'bra.1',
        category: 'bra.1',
        league: '🇧🇷 Brasil • Série A',
        stadium: 'Estádio Manoel Barradas (Barradão), Salvador (Brasil)',
        referee: 'Ramon Abatti Abel (FIFA)',
        teamA: 'Vitória',
        shortA: 'VIT',
        logoA: 'https://a.espncdn.com/i/teamlogos/soccer/500/819.png',
        teamB: 'Corinthians',
        shortB: 'COR',
        logoB: 'https://a.espncdn.com/i/teamlogos/soccer/500/874.png',
        colorA: '#ff1744',
        colorB: '#ffffff',
        recordA: '9-8-13',
        recordB: '9-9-12',
        formA: 'V-D-E-V-D',
        formB: 'V-E-V-D-V',
        formationA: '4-3-3',
        formationB: '4-2-3-1',
        playersA: [
            { jersey: '1', name: 'Lucas Arcanjo', pos: 'G' },
            { jersey: '2', name: 'Raúl Cáceres', pos: 'D' },
            { jersey: '4', name: 'Wagner Leonardo', pos: 'D' },
            { jersey: '3', name: 'Neris', pos: 'D' },
            { jersey: '6', name: 'Lucas Esteves', pos: 'D' },
            { jersey: '5', name: 'Luan Santos', pos: 'M' },
            { jersey: '8', name: 'Willian Oliveira', pos: 'M' },
            { jersey: '10', name: 'Matheuzinho', pos: 'M' },
            { jersey: '7', name: 'Gustavo Mosquito', pos: 'A' },
            { jersey: '9', name: 'Alerrando', pos: 'A' },
            { jersey: '11', name: 'Carlos Eduardo', pos: 'A' }
        ],
        playersB: [
            { jersey: '1', name: 'Hugo Souza', pos: 'G' },
            { jersey: '2', name: 'Matheuzinho', pos: 'D' },
            { jersey: '3', name: 'André Ramalho', pos: 'D' },
            { jersey: '4', name: 'Cacá', pos: 'D' },
            { jersey: '6', name: 'Matheus Bidu', pos: 'D' },
            { jersey: '5', name: 'José Martínez', pos: 'M' },
            { jersey: '8', name: 'Breno Bidon', pos: 'M' },
            { jersey: '7', name: 'Igor Coronado', pos: 'M' },
            { jersey: '10', name: 'Rodrigo Garro', pos: 'M' },
            { jersey: '9', name: 'Yuri Alberto', pos: 'A' },
            { jersey: '11', name: 'Memphis Depay', pos: 'A' }
        ],
        scoreA: 1,
        scoreB: 1,
        minute: 68,
        second: 24,
        displayClock: "68'",
        statusState: 'in',
        statusDescription: '2º Tempo',
        isLive: true,
        timeLabel: "68' • 2º Tempo",
        kickoffTimeStr: '20:00',
        kickoffDateShort: 'Hoje',
        totalMarketsCount: 384,
        oddsLocked: false,
        odds: { '1': 2.85, 'X': 3.10, '2': 2.60 },
        oddsProvider: 'Bet365 Oficial',
        broadcastChannels: ['Premiere HD', 'SporTV', 'CazéTV', 'Multicanais', 'Futemax'],
        videoHighlightUrl: 'https://espnmedia-cdn.akamaized.net/espn/media/16x9/2026/1018/Hu_261018_BR_futebol_PLMatchPackage_bournemouth_x_sunderland_gols_final_game_highlight/Hu_261018_BR_futebol_PLMatchPackage_bournemouth_x_sunderland_gols_final_game_highlight.mp4',
        realEventsSummary: ['⚽ 22\' Alerrando (VIT)', '⚽ 44\' Yuri Alberto (COR)', '🟨 56\' Matheuzinho (VIT)'],
        markets: {
            overUnder: { label: 'Total de Gols (2.5)', over: 2.10, under: 1.75 },
            btts: { label: 'Ambos os Times Marcam', yes: 1.75, no: 2.05 }
        },
        state: {
            possessionTeam: 'B',
            zone: 'attack',
            arcMode: true,
            actionText: '🔴 AO VIVO (68\') • ATAQUE PERIGOSO DO CORINTHIANS',
            subText: 'Rodrigo Garro tenta cruzamento na área para Memphis Depay!',
            activePlayer: 'Memphis Depay',
            ballX: 0.72,
            ballY: 0.42,
            targetX: 0.78,
            targetY: 0.48,
            trail: [{ x: 0.55, y: 0.45 }, { x: 0.65, y: 0.40 }, { x: 0.72, y: 0.42 }],
            stats: {
                possession: [46, 54],
                totalShots: [8, 11],
                shotsOnTarget: [3, 5],
                blockedShots: [2, 3],
                corners: [4, 6],
                offsides: [1, 2],
                fouls: [12, 10],
                yellowCards: [2, 1],
                redCards: [0, 0],
                saves: [4, 2],
                accuratePasses: [280, 340],
                totalPasses: [340, 400],
                passPct: [82, 85],
                tackles: [14, 16],
                clearances: [18, 12],
                hasRealBoxscore: true
            },
            feed: [
                { time: "68'", text: "⚡ Corinthians pressiona em busca do gol da virada no Barradão.", type: "danger" },
                { time: "56'", text: "🟨 Cartão amarelo para Matheuzinho por falta no meio de campo.", type: "corner" },
                { time: "44'", text: "⚽ GOOOOOL DO CORINTHIANS! Yuri Alberto empata a partida!", type: "goal" },
                { time: "22'", text: "⚽ GOOOOOL DO VITÓRIA! Alerrando abre o placar!", type: "goal" }
            ]
        }
    },
    {
        id: 401879263,
        espnId: '401879263',
        espnSlug: 'eng.1',
        category: 'eng.1',
        league: '🏴󠁧󠁢󠁥󠁮󠁧󠁿 Inglaterra • Premier League',
        stadium: 'The City Ground, Nottingham (Inglaterra)',
        referee: 'Michael Oliver',
        teamA: 'Nottingham Forest',
        shortA: 'NFO',
        logoA: 'https://a.espncdn.com/i/teamlogos/soccer/500/393.png',
        teamB: 'Crystal Palace',
        shortB: 'CRY',
        logoB: 'https://a.espncdn.com/i/teamlogos/soccer/500/384.png',
        colorA: '#dd0000',
        colorB: '#1b458f',
        recordA: '3-4-1',
        recordB: '0-3-5',
        formA: 'E-D-E-V-E',
        formB: 'D-D-E-E-D',
        formationA: '4-2-3-1',
        formationB: '3-4-2-1',
        playersA: [
            { jersey: '26', name: 'Matz Sels', pos: 'G' },
            { jersey: '19', name: 'Álex Moreno', pos: 'D' },
            { jersey: '4', name: 'Murillo', pos: 'D' },
            { jersey: '5', name: 'Nikola Milenkovic', pos: 'D' },
            { jersey: '34', name: 'Ola Aina', pos: 'D' },
            { jersey: '8', name: 'Elliot Anderson', pos: 'M' },
            { jersey: '22', name: 'Ryan Yates', pos: 'M' },
            { jersey: '14', name: 'Callum Hudson-Odoi', pos: 'M' },
            { jersey: '10', name: 'Morgan Gibbs-White', pos: 'M' },
            { jersey: '7', name: 'Neco Williams', pos: 'A' },
            { jersey: '11', name: 'Chris Wood', pos: 'A' }
        ],
        playersB: [
            { jersey: '1', name: 'Dean Henderson', pos: 'G' },
            { jersey: '5', name: 'Maxence Lacroix', pos: 'D' },
            { jersey: '6', name: 'Marc Guéhi', pos: 'D' },
            { jersey: '27', name: 'Trevoh Chalobah', pos: 'D' },
            { jersey: '3', name: 'Tyrick Mitchell', pos: 'M' },
            { jersey: '20', name: 'Adam Wharton', pos: 'M' },
            { jersey: '8', name: 'Jefferson Lerma', pos: 'M' },
            { jersey: '12', name: 'Daniel Muñoz', pos: 'M' },
            { jersey: '10', name: 'Eberechi Eze', pos: 'A' },
            { jersey: '18', name: 'Daichi Kamada', pos: 'A' },
            { jersey: '14', name: 'Jean-Philippe Mateta', pos: 'A' }
        ],
        scoreA: 1,
        scoreB: 0,
        minute: 74,
        second: 15,
        displayClock: "74'",
        statusState: 'in',
        statusDescription: '2º Tempo',
        isLive: true,
        timeLabel: "74' • 2º Tempo",
        kickoffTimeStr: '16:00',
        kickoffDateShort: 'Hoje',
        totalMarketsCount: 384,
        oddsLocked: false,
        odds: { '1': 1.45, 'X': 3.75, '2': 8.50 },
        oddsProvider: 'Bet365 Oficial',
        broadcastChannels: ['ESPN', 'Disney+', 'Multicanais', 'Futemax'],
        videoHighlightUrl: 'https://espnmedia-cdn.akamaized.net/espn/media/16x9/2026/1018/Hu_261018_BR_futebol_PLMatchPackage_bournemouth_x_sunderland_gols_final_game_highlight/Hu_261018_BR_futebol_PLMatchPackage_bournemouth_x_sunderland_gols_final_game_highlight.mp4',
        realEventsSummary: ['⚽ 65\' Chris Wood (NFO)', '🟨 42\' Lerma (CRY)'],
        markets: {
            overUnder: { label: 'Total de Gols (1.5)', over: 1.80, under: 2.00 },
            btts: { label: 'Ambos os Times Marcam', yes: 2.35, no: 1.55 }
        },
        state: {
            possessionTeam: 'A',
            zone: 'attack',
            arcMode: false,
            actionText: '🔴 AO VIVO (74\') • PRESSÃO DO NOTTINGHAM FOREST',
            subText: 'Chris Wood finaliza de perna direita, grande defesa de Henderson!',
            activePlayer: 'Chris Wood',
            ballX: 0.68,
            ballY: 0.52,
            targetX: 0.75,
            targetY: 0.48,
            trail: [{ x: 0.48, y: 0.50 }, { x: 0.60, y: 0.54 }, { x: 0.68, y: 0.52 }],
            stats: {
                possession: [52, 48],
                totalShots: [14, 9],
                shotsOnTarget: [6, 2],
                blockedShots: [3, 2],
                corners: [7, 3],
                offsides: [2, 1],
                fouls: [9, 11],
                yellowCards: [1, 2],
                redCards: [0, 0],
                saves: [2, 5],
                accuratePasses: [310, 280],
                totalPasses: [370, 340],
                passPct: [84, 82],
                tackles: [18, 15],
                clearances: [14, 22],
                hasRealBoxscore: true
            },
            feed: [
                { time: "74'", text: "🔥 Finalização perigosa de Chris Wood! Quase o segundo do Forest.", type: "danger" },
                { time: "65'", text: "⚽ GOOOOOL DO NOTTINGHAM FOREST! Chris Wood chuta de fora e abre o placar!", type: "goal" }
            ]
        }
    },
    {
        id: 401915402,
        espnId: '401915402',
        espnSlug: 'bra.1',
        category: 'bra.1',
        league: '🇧🇷 Brasil • Série A',
        stadium: 'Estádio do Maracanã, Rio de Janeiro (Brasil)',
        referee: 'Wilton Pereira Sampaio (FIFA)',
        teamA: 'Flamengo',
        shortA: 'FLA',
        logoA: 'https://a.espncdn.com/i/teamlogos/soccer/500/870.png',
        teamB: 'Palmeiras',
        shortB: 'PAL',
        logoB: 'https://a.espncdn.com/i/teamlogos/soccer/500/877.png',
        colorA: '#cc0000',
        colorB: '#006437',
        recordA: '15-6-7',
        recordB: '16-6-6',
        formA: 'V-V-D-V-E',
        formB: 'V-V-V-E-V',
        formationA: '4-2-3-1',
        formationB: '4-3-3',
        playersA: [
            { jersey: '1', name: 'Rossi', pos: 'G' },
            { jersey: '2', name: 'Varela', pos: 'D' },
            { jersey: '3', name: 'Léo Ortiz', pos: 'D' },
            { jersey: '4', name: 'Léo Pereira', pos: 'D' },
            { jersey: '6', name: 'Ayrton Lucas', pos: 'D' },
            { jersey: '5', name: 'Erick Pulgar', pos: 'M' },
            { jersey: '8', name: 'De La Cruz', pos: 'M' },
            { jersey: '14', name: 'Arrascaeta', pos: 'M' },
            { jersey: '7', name: 'Luiz Araújo', pos: 'A' },
            { jersey: '27', name: 'Bruno Henrique', pos: 'A' },
            { jersey: '99', name: 'Gabigol', pos: 'A' }
        ],
        playersB: [
            { jersey: '21', name: 'Weverton', pos: 'G' },
            { jersey: '2', name: 'Marcos Rocha', pos: 'D' },
            { jersey: '15', name: 'Gustavo Gómez', pos: 'D' },
            { jersey: '26', name: 'Murilo', pos: 'D' },
            { jersey: '22', name: 'Piquerez', pos: 'D' },
            { jersey: '5', name: 'Aníbal Moreno', pos: 'M' },
            { jersey: '8', name: 'Zé Rafael', pos: 'M' },
            { jersey: '23', name: 'Raphael Veiga', pos: 'M' },
            { jersey: '41', name: 'Estêvão', pos: 'A' },
            { jersey: '7', name: 'Dudu', pos: 'A' },
            { jersey: '42', name: 'Flaco López', pos: 'A' }
        ],
        scoreA: 0,
        scoreB: 0,
        minute: 0,
        second: 0,
        displayClock: "21:30",
        statusState: 'pre',
        statusDescription: 'Hoje às 21:30',
        isLive: false,
        timeLabel: "Hoje às 21:30",
        kickoffTimeStr: '21:30',
        kickoffDateShort: 'Hoje',
        totalMarketsCount: 384,
        oddsLocked: false,
        odds: { '1': 2.25, 'X': 3.25, '2': 3.10 },
        oddsProvider: 'Bet365 Oficial',
        broadcastChannels: ['TV Globo', 'Premiere', 'SporTV', 'CazéTV'],
        realEventsSummary: [],
        markets: {
            overUnder: { label: 'Total de Gols (2.5)', over: 1.95, under: 1.85 },
            btts: { label: 'Ambos os Times Marcam', yes: 1.80, no: 1.95 }
        },
        state: {
            possessionTeam: 'A',
            zone: 'posse',
            arcMode: false,
            actionText: '📅 CLÁSSICO NACIONAL • HOJE ÀS 21:30 NO MARACANÃ',
            subText: 'Grande duelo direto pela ponta da tabela do Brasileirão Série A.',
            activePlayer: 'Arrascaeta vs Raphael Veiga',
            ballX: 0.50,
            ballY: 0.50,
            targetX: 0.50,
            targetY: 0.50,
            trail: [{ x: 0.40, y: 0.50 }, { x: 0.50, y: 0.50 }],
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
            feed: [
                { time: "Pré", text: "🏟️ Maracanã lotado para o grande clássico entre Flamengo e Palmeiras.", type: "normal" }
            ]
        }
    },
    {
        id: 401915403,
        espnId: '401915403',
        espnSlug: 'uefa.champions',
        category: 'uefa.champions',
        league: '🇪🇺 UEFA Champions League',
        stadium: 'Estadio Santiago Bernabéu, Madrid (Espanha)',
        referee: 'István Kovács (Romênia)',
        teamA: 'Real Madrid',
        shortA: 'RMA',
        logoA: 'https://a.espncdn.com/i/teamlogos/soccer/500/86.png',
        teamB: 'Borussia Dortmund',
        shortB: 'BVB',
        logoB: 'https://a.espncdn.com/i/teamlogos/soccer/500/124.png',
        colorA: '#ffffff',
        colorB: '#fde100',
        recordA: '2-0-0',
        recordB: '2-0-0',
        formA: 'V-V-D-V-V',
        formB: 'V-D-V-V-D',
        formationA: '4-3-1-2',
        formationB: '4-2-3-1',
        playersA: [
            { jersey: '1', name: 'Courtois', pos: 'G' },
            { jersey: '17', name: 'Lucas Vázquez', pos: 'D' },
            { jersey: '3', name: 'Éder Militão', pos: 'D' },
            { jersey: '22', name: 'Rüdiger', pos: 'D' },
            { jersey: '23', name: 'Ferland Mendy', pos: 'D' },
            { jersey: '8', name: 'Valverde', pos: 'M' },
            { jersey: '14', name: 'Tchouaméni', pos: 'M' },
            { jersey: '10', name: 'Luka Modric', pos: 'M' },
            { jersey: '5', name: 'Jude Bellingham', pos: 'M' },
            { jersey: '11', name: 'Rodrygo', pos: 'A' },
            { jersey: '7', name: 'Vinicius Jr', pos: 'A' },
            { jersey: '9', name: 'Kylian Mbappé', pos: 'A' }
        ],
        playersB: [
            { jersey: '1', name: 'Gregor Kobel', pos: 'G' },
            { jersey: '26', name: 'Julian Ryerson', pos: 'D' },
            { jersey: '4', name: 'Nico Schlotterbeck', pos: 'D' },
            { jersey: '25', name: 'Niklas Süle', pos: 'D' },
            { jersey: '5', name: 'Ramy Bensebaini', pos: 'D' },
            { jersey: '8', name: 'Felix Nmecha', pos: 'M' },
            { jersey: '13', name: 'Pascal Groß', pos: 'M' },
            { jersey: '20', name: 'Marcel Sabitzer', pos: 'M' },
            { jersey: '10', name: 'Julian Brandt', pos: 'M' },
            { jersey: '43', name: 'Jamie Gittens', pos: 'A' },
            { jersey: '9', name: 'Serhou Guirassy', pos: 'A' }
        ],
        scoreA: 0,
        scoreB: 0,
        minute: 0,
        second: 0,
        displayClock: "16:00",
        statusState: 'pre',
        statusDescription: 'Amanhã às 16:00',
        isLive: false,
        timeLabel: "Terça às 16:00",
        kickoffTimeStr: '16:00',
        kickoffDateShort: 'Terça',
        totalMarketsCount: 384,
        oddsLocked: false,
        odds: { '1': 1.48, 'X': 4.80, '2': 5.80 },
        oddsProvider: 'Bet365 Oficial',
        broadcastChannels: ['TNT Sports', 'Max (HBO)', 'SBT', 'CazéTV', 'Multicanais'],
        realEventsSummary: [],
        markets: {
            overUnder: { label: 'Total de Gols (3.5)', over: 2.10, under: 1.72 },
            btts: { label: 'Ambos os Times Marcam', yes: 1.62, no: 2.20 }
        },
        state: {
            possessionTeam: 'A',
            zone: 'posse',
            arcMode: false,
            actionText: '🏆 REEDIÇÃO DA FINAL DA CHAMPIONS • BERNABÉU',
            subText: 'Vinicius Jr e Mbappé lideram o ataque merengue contra o Borussia Dortmund.',
            activePlayer: 'Vinicius Jr vs Guirassy',
            ballX: 0.50,
            ballY: 0.50,
            targetX: 0.50,
            targetY: 0.50,
            trail: [{ x: 0.40, y: 0.50 }, { x: 0.50, y: 0.50 }],
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
            feed: [
                { time: "Pré", text: "🏆 Clássico europeu decisivo na fase de grupos da Champions League.", type: "normal" }
            ]
        }
    },
    {
        id: 401915404,
        espnId: '401915404',
        espnSlug: 'uefa.champions',
        category: 'uefa.champions',
        league: '🇪🇺 UEFA Champions League',
        stadium: 'Estadi Olímpic Lluís Companys, Barcelona (Espanha)',
        referee: 'Slavko Vincic (Eslovênia)',
        teamA: 'Barcelona',
        shortA: 'BAR',
        logoA: 'https://a.espncdn.com/i/teamlogos/soccer/500/83.png',
        teamB: 'Bayern de Munique',
        shortB: 'BAY',
        logoB: 'https://a.espncdn.com/i/teamlogos/soccer/500/132.png',
        colorA: '#004d98',
        colorB: '#dc052d',
        recordA: '2-0-0',
        recordB: '1-0-1',
        formA: 'V-V-V-D-V',
        formB: 'V-E-E-D-V',
        formationA: '4-2-3-1',
        formationB: '4-2-3-1',
        playersA: [
            { jersey: '13', name: 'Iñaki Peña', pos: 'G' },
            { jersey: '23', name: 'Jules Koundé', pos: 'D' },
            { jersey: '2', name: 'Pau Cubarsí', pos: 'D' },
            { jersey: '5', name: 'Iñigo Martínez', pos: 'D' },
            { jersey: '3', name: 'Alejandro Balde', pos: 'D' },
            { jersey: '17', name: 'Marc Casadó', pos: 'M' },
            { jersey: '8', name: 'Pedri', pos: 'M' },
            { jersey: '19', name: 'Lamine Yamal', pos: 'A' },
            { jersey: '20', name: 'Dani Olmo', pos: 'M' },
            { jersey: '11', name: 'Raphinha', pos: 'A' },
            { jersey: '9', name: 'Robert Lewandowski', pos: 'A' }
        ],
        playersB: [
            { jersey: '1', name: 'Manuel Neuer', pos: 'G' },
            { jersey: '22', name: 'Raphaël Guerreiro', pos: 'D' },
            { jersey: '2', name: 'Dayot Upamecano', pos: 'D' },
            { jersey: '3', name: 'Kim Min-jae', pos: 'D' },
            { jersey: '19', name: 'Alphonso Davies', pos: 'D' },
            { jersey: '6', name: 'Joshua Kimmich', pos: 'M' },
            { jersey: '16', name: 'Joao Palhinha', pos: 'M' },
            { jersey: '17', name: 'Michael Olise', pos: 'A' },
            { jersey: '25', name: 'Thomas Müller', pos: 'M' },
            { jersey: '7', name: 'Serge Gnabry', pos: 'A' },
            { jersey: '9', name: 'Harry Kane', pos: 'A' }
        ],
        scoreA: 0,
        scoreB: 0,
        minute: 0,
        second: 0,
        displayClock: "16:00",
        statusState: 'pre',
        statusDescription: 'Quarta às 16:00',
        isLive: false,
        timeLabel: "Quarta às 16:00",
        kickoffTimeStr: '16:00',
        kickoffDateShort: 'Quarta',
        totalMarketsCount: 384,
        oddsLocked: false,
        odds: { '1': 2.30, 'X': 3.75, '2': 2.80 },
        oddsProvider: 'Bet365 Oficial',
        broadcastChannels: ['TNT Sports', 'Max (HBO)', 'CazéTV', 'Multicanais'],
        realEventsSummary: [],
        markets: {
            overUnder: { label: 'Total de Gols (3.5)', over: 2.05, under: 1.78 },
            btts: { label: 'Ambos os Times Marcam', yes: 1.48, no: 2.65 }
        },
        state: {
            possessionTeam: 'A',
            zone: 'posse',
            arcMode: false,
            actionText: '🏆 SUPER CLÁSSICO EUROPEU • QUARTA ÀS 16:00',
            subText: 'Lewandowski e Lamine Yamal enfrentam Harry Kane e o Bayern de Munique.',
            activePlayer: 'Lamine Yamal vs Harry Kane',
            ballX: 0.50,
            ballY: 0.50,
            targetX: 0.50,
            targetY: 0.50,
            trail: [{ x: 0.40, y: 0.50 }, { x: 0.50, y: 0.50 }],
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
            feed: [
                { time: "Pré", text: "🏆 Hansi Flick reencontra o Bayern em um dos maiores jogos do ano.", type: "normal" }
            ]
        }
    },
    {
        id: 401915405,
        espnId: '401915405',
        espnSlug: 'conmebol.libertadores',
        category: 'conmebol.libertadores',
        league: '🏆 CONMEBOL Libertadores',
        stadium: 'Arena MRV, Belo Horizonte (Brasil)',
        referee: 'Jesús Valenzuela (Venezuela)',
        teamA: 'Atlético-MG',
        shortA: 'CAM',
        logoA: 'https://a.espncdn.com/i/teamlogos/soccer/500/10357.png',
        teamB: 'River Plate',
        shortB: 'RIV',
        logoB: 'https://a.espncdn.com/i/teamlogos/soccer/500/16.png',
        colorA: '#000000',
        colorB: '#cc0000',
        recordA: 'Semifinalista',
        recordB: 'Semifinalista',
        formA: 'E-V-D-E-V',
        formB: 'E-E-V-V-D',
        formationA: '3-5-2',
        formationB: '4-3-1-2',
        playersA: [
            { jersey: '22', name: 'Everson', pos: 'G' },
            { jersey: '16', name: 'Saravia', pos: 'D' },
            { jersey: '21', name: 'Battaglia', pos: 'D' },
            { jersey: '3', name: 'Junior Alonso', pos: 'D' },
            { jersey: '6', name: 'Scarpa', pos: 'M' },
            { jersey: '5', name: 'Otávio', pos: 'M' },
            { jersey: '23', name: 'Alan Franco', pos: 'M' },
            { jersey: '13', name: 'Arana', pos: 'M' },
            { jersey: '10', name: 'Paulinho', pos: 'A' },
            { jersey: '7', name: 'Hulk', pos: 'A' },
            { jersey: '9', name: 'Deyverson', pos: 'A' }
        ],
        playersB: [
            { jersey: '1', name: 'Franco Armani', pos: 'G' },
            { jersey: '16', name: 'Fabricio Bustos', pos: 'D' },
            { jersey: '6', name: 'Germán Pezzella', pos: 'D' },
            { jersey: '17', name: 'Paulo Díaz', pos: 'D' },
            { jersey: '13', name: 'Enzo Díaz', pos: 'D' },
            { jersey: '5', name: 'Matías Kranevitter', pos: 'M' },
            { jersey: '31', name: 'Santiago Simón', pos: 'M' },
            { jersey: '26', name: 'Nacho Fernández', pos: 'M' },
            { jersey: '19', name: 'Claudio Echeverri', pos: 'M' },
            { jersey: '11', name: 'Facundo Colidio', pos: 'A' },
            { jersey: '9', name: 'Miguel Borja', pos: 'A' }
        ],
        scoreA: 0,
        scoreB: 0,
        minute: 0,
        second: 0,
        displayClock: "21:30",
        statusState: 'pre',
        statusDescription: 'Terça às 21:30',
        isLive: false,
        timeLabel: "Terça às 21:30",
        kickoffTimeStr: '21:30',
        kickoffDateShort: 'Terça',
        totalMarketsCount: 384,
        oddsLocked: false,
        odds: { '1': 2.15, 'X': 3.10, '2': 3.60 },
        oddsProvider: 'Bet365 Oficial',
        broadcastChannels: ['Paramount+', 'ESPN', 'Disney+', 'CazéTV', 'Multicanais'],
        realEventsSummary: [],
        markets: {
            overUnder: { label: 'Total de Gols (2.5)', over: 2.25, under: 1.62 },
            btts: { label: 'Ambos os Times Marcam', yes: 2.05, no: 1.72 }
        },
        state: {
            possessionTeam: 'A',
            zone: 'posse',
            arcMode: false,
            actionText: '🏆 SEMIFINAL DA LIBERTADORES • ARENA MRV',
            subText: 'Hulk e Paulinho comandam o Galo no primeiro duelo rumo à Glória Eterna.',
            activePlayer: 'Hulk vs Miguel Borja',
            ballX: 0.50,
            ballY: 0.50,
            targetX: 0.50,
            targetY: 0.50,
            trail: [{ x: 0.40, y: 0.50 }, { x: 0.50, y: 0.50 }],
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
            feed: [
                { time: "Pré", text: "🏆 Decisão épica valendo vaga na final da CONMEBOL Libertadores 2026.", type: "normal" }
            ]
        }
    },
    {
        id: 401915406,
        espnId: '401915406',
        espnSlug: 'esp.1',
        category: 'esp.1',
        league: '🇪🇸 Espanha • La Liga',
        stadium: 'Estadio de Mestalla, Valencia (Espanha)',
        referee: 'Gil Manzano',
        teamA: 'Valencia',
        shortA: 'VAL',
        logoA: 'https://a.espncdn.com/i/teamlogos/soccer/500/94.png',
        teamB: 'Las Palmas',
        shortB: 'LPA',
        logoB: 'https://a.espncdn.com/i/teamlogos/soccer/500/91.png',
        colorA: '#ffffff',
        colorB: '#ffdd00',
        recordA: '1-3-5',
        recordB: '0-3-6',
        formA: 'E-D-E-V-D',
        formB: 'D-D-D-E-D',
        formationA: '4-4-2',
        formationB: '4-3-3',
        playersA: [
            { jersey: '25', name: 'Mamardashvili', pos: 'G' },
            { jersey: '20', name: 'Dimitri Foulquier', pos: 'D' },
            { jersey: '3', name: 'Cristhian Mosquera', pos: 'D' },
            { jersey: '15', name: 'César Tárrega', pos: 'D' },
            { jersey: '21', name: 'Jesús Vázquez', pos: 'D' },
            { jersey: '23', name: 'Fran Pérez', pos: 'M' },
            { jersey: '8', name: 'Javi Guerra', pos: 'M' },
            { jersey: '18', name: 'Pepelu', pos: 'M' },
            { jersey: '11', name: 'Luis Rioja', pos: 'M' },
            { jersey: '9', name: 'Hugo Duro', pos: 'A' },
            { jersey: '16', name: 'Diego López', pos: 'A' }
        ],
        playersB: [
            { jersey: '1', name: 'Jasper Cillessen', pos: 'G' },
            { jersey: '18', name: 'Viti Rozada', pos: 'D' },
            { jersey: '4', name: 'Álex Suárez', pos: 'D' },
            { jersey: '15', name: 'Scott McKenna', pos: 'D' },
            { jersey: '3', name: 'Sergi Cardona', pos: 'D' },
            { jersey: '8', name: 'José Campaña', pos: 'M' },
            { jersey: '12', name: 'Enzo Loiodice', pos: 'M' },
            { jersey: '20', name: 'Kirian Rodríguez', pos: 'M' },
            { jersey: '10', name: 'Alberto Moleiro', pos: 'A' },
            { jersey: '19', name: 'Sandro Ramírez', pos: 'A' },
            { jersey: '9', name: 'Fábio Silva', pos: 'A' }
        ],
        scoreA: 0,
        scoreB: 0,
        minute: 0,
        second: 0,
        displayClock: "16:00",
        statusState: 'pre',
        statusDescription: 'Hoje às 16:00',
        isLive: false,
        timeLabel: "Hoje às 16:00",
        kickoffTimeStr: '16:00',
        kickoffDateShort: 'Hoje',
        totalMarketsCount: 384,
        oddsLocked: false,
        odds: { '1': 1.72, 'X': 3.60, '2': 5.20 },
        oddsProvider: 'Bet365 Oficial',
        broadcastChannels: ['ESPN 4', 'Disney+', 'Multicanais', 'Futemax'],
        realEventsSummary: [],
        markets: {
            overUnder: { label: 'Total de Gols (2.5)', over: 2.15, under: 1.70 },
            btts: { label: 'Ambos os Times Marcam', yes: 2.00, no: 1.75 }
        },
        state: {
            possessionTeam: 'A',
            zone: 'posse',
            arcMode: false,
            actionText: '📅 LA LIGA AO VIVO • HOJE ÀS 16:00 NO MESTALLA',
            subText: 'Valencia busca vitória diante de sua torcida contra o Las Palmas.',
            activePlayer: 'Hugo Duro vs Fábio Silva',
            ballX: 0.50,
            ballY: 0.50,
            targetX: 0.50,
            targetY: 0.50,
            trail: [{ x: 0.40, y: 0.50 }, { x: 0.50, y: 0.50 }],
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
            feed: [
                { time: "Pré", text: "🏟️ Partida oficial válida pela 10ª rodada de La Liga.", type: "normal" }
            ]
        }
    },
    {
        id: 401915407,
        espnId: '401915407',
        espnSlug: 'bra.2',
        category: 'bra.2',
        league: '🇧🇷 Brasil • Série B',
        stadium: 'Arena Condá, Chapecó (Brasil)',
        referee: 'Paulo Cesar Zanovelli (FIFA)',
        teamA: 'Chapecoense',
        shortA: 'CHA',
        logoA: 'https://a.espncdn.com/i/teamlogos/soccer/500/3673.png',
        teamB: 'Santos',
        shortB: 'SAN',
        logoB: 'https://a.espncdn.com/i/teamlogos/soccer/500/878.png',
        colorA: '#008542',
        colorB: '#000000',
        recordA: '9-10-12',
        recordB: '16-8-7',
        formA: 'V-D-V-D-E',
        formB: 'D-V-E-V-V',
        formationA: '4-3-3',
        formationB: '4-3-3',
        playersA: [
            { jersey: '1', name: 'Léo Vieira', pos: 'G' },
            { jersey: '2', name: 'Marcelinho', pos: 'D' },
            { jersey: '3', name: 'Bruno Leonardo', pos: 'D' },
            { jersey: '4', name: 'João Paulo', pos: 'D' },
            { jersey: '6', name: 'Mancha', pos: 'D' },
            { jersey: '5', name: 'Tárik', pos: 'M' },
            { jersey: '8', name: 'Foguinho', pos: 'M' },
            { jersey: '10', name: 'Rafael Carvalheira', pos: 'M' },
            { jersey: '7', name: 'Marlone', pos: 'A' },
            { jersey: '9', name: 'Mário Sérgio', pos: 'A' },
            { jersey: '11', name: 'Ítalo', pos: 'A' }
        ],
        playersB: [
            { jersey: '1', name: 'Gabriel Brazão', pos: 'G' },
            { jersey: '4', name: 'JP Chermont', pos: 'D' },
            { jersey: '3', name: 'Gil', pos: 'D' },
            { jersey: '2', name: 'Luan Peres', pos: 'D' },
            { jersey: '6', name: 'Gonzalo Escobar', pos: 'D' },
            { jersey: '5', name: 'João Schmidt', pos: 'M' },
            { jersey: '8', name: 'Diego Pituca', pos: 'M' },
            { jersey: '20', name: 'Giuliano', pos: 'M' },
            { jersey: '17', name: 'Otero', pos: 'A' },
            { jersey: '9', name: 'Wendel Silva', pos: 'A' },
            { jersey: '11', name: 'Guilherme', pos: 'A' }
        ],
        scoreA: 0,
        scoreB: 0,
        minute: 0,
        second: 0,
        displayClock: "20:00",
        statusState: 'pre',
        statusDescription: 'Hoje às 20:00',
        isLive: false,
        timeLabel: "Hoje às 20:00",
        kickoffTimeStr: '20:00',
        kickoffDateShort: 'Hoje',
        totalMarketsCount: 384,
        oddsLocked: false,
        odds: { '1': 3.50, 'X': 3.10, '2': 2.15 },
        oddsProvider: 'Bet365 Oficial',
        broadcastChannels: ['SporTV', 'Premiere', 'Canal GOAT', 'CazéTV'],
        realEventsSummary: [],
        markets: {
            overUnder: { label: 'Total de Gols (2.5)', over: 2.30, under: 1.58 },
            btts: { label: 'Ambos os Times Marcam', yes: 2.10, no: 1.68 }
        },
        state: {
            possessionTeam: 'B',
            zone: 'posse',
            arcMode: false,
            actionText: '📅 BRASILEIRÃO SÉRIE B • HOJE ÀS 20:00',
            subText: 'Santos busca liderança isolada em visita perigosa à Chapecoense na Arena Condá.',
            activePlayer: 'Guilherme vs Mário Sérgio',
            ballX: 0.50,
            ballY: 0.50,
            targetX: 0.50,
            targetY: 0.50,
            trail: [{ x: 0.40, y: 0.50 }, { x: 0.50, y: 0.50 }],
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
            feed: [
                { time: "Pré", text: "🏟️ Partida fundamental para as pretensões de título e acesso do Santos.", type: "normal" }
            ]
        }
    }
];

// Bilhetes Iniciais de Demonstração (Permite ao usuário testar a conferência e o comprovante instantaneamente)
const INITIAL_BETS_HISTORY = [
    {
        pin: '729-304',
        clientId: 1,
        clientName: 'Deywyson Machado',
        selections: [
            {
                matchId: 401915401,
                selection: 'Corinthians (Fora)',
                oddValue: 2.60,
                marketName: 'Vencedor do Encontro (1x2)'
            },
            {
                matchId: 401879263,
                selection: 'Nottingham Forest (Casa)',
                oddValue: 2.40,
                marketName: 'Vencedor do Encontro (1x2)'
            }
        ],
        totalOdd: 6.24,
        stake: 50.00,
        payout: 312.00,
        status: 'VALIDADO',
        createdAt: '19/10 às 15:10'
    },
    {
        pin: '518-842',
        clientId: 1,
        clientName: 'Deywyson Machado',
        selections: [
            {
                matchId: 401915403,
                selection: 'Real Madrid (Casa)',
                oddValue: 1.48,
                marketName: 'Vencedor do Encontro (1x2)'
            },
            {
                matchId: 401915402,
                selection: 'Ambos Marcam: Sim',
                oddValue: 1.80,
                marketName: 'Ambos os Times Marcam (BTTS)'
            }
        ],
        totalOdd: 2.66,
        stake: 40.00,
        payout: 106.40,
        status: 'AGUARDANDO ADMIN (PIN)',
        createdAt: '19/10 às 15:25'
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
    selectedMatchId: 401915401,
    activeTrackerTab: 'stats',
    activeBetslipView: 'slip',
    isLoadingMatches: false,

    // Opções de Transmissão e Visual do Estádio
    liveStreamActive: false,
    activeStreamChannel: 'ch1',
    streamAudioMuted: true,
    showPlayersOnPitch: false,
    showBallTrail: true,
    showHeatmap: false,
    pitchPerspective3D: true,
    soundEnabled: false,

    // Regras Oficiais da Banca 365 DA BARRA (padrão Bet365)
    houseRules: {
        maxPrize: 30000.00,
        minStake: 2.00,
        maxStake: 5000.00,
        maxSelections: 20,
        oneOptionPerMatch: true
    },

    // Contato Oficial do Cambista / Admin 365 DA BARRA
    cambistaWhatsapp: '5514991951381',
    cambistaPhoneDisplay: '(14) 99195-1381',

    // Clientes Cadastrados
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

    // Lista de Partidas com Seed Oficial Inicial (atualizada e expandida continuamente via API)
    matches: [...INITIAL_MATCHES],

    // Cupom de Apostas Ativo
    betslip: [],

    // Histórico de Bilhetes Emitidos (com demonstração de PIN oficial)
    placedBetsHistory: (savedState && Array.isArray(savedState.placedBetsHistory) && savedState.placedBetsHistory.length > 0)
        ? savedState.placedBetsHistory
        : [...INITIAL_BETS_HISTORY]
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
