/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  Flame,
  Home,
  ShieldCheck,
  Sparkles,
  Ticket,
  QrCode,
  Volume2,
} from 'lucide-react';
import {
  BalanceRequest,
  BetSelection,
  ClientAccount,
  Match,
  NewsArticle,
  SoundEventType,
  TicketReceipt,
} from './types/sportsbook';
import {
  DEFAULT_CLIENTS,
  FALLBACK_NEWS_ARTICLES,
  INITIAL_BETS_HISTORY,
  INITIAL_MATCHES,
  syncEspnMatches,
} from './data/initialData';
import {
  calculateBetslipTotals,
  formatBRL,
  generateRandomPin,
  toggleBetSelection,
  validateBetPlacement,
} from './utils/bettingRules';
import { getSoundProfile, playSoftAlertSound } from './utils/soundEffects';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { MatchesView } from './components/MatchesView';
import { MatchCenterView } from './components/MatchCenterView';
import { BetslipPanel } from './components/BetslipPanel';
import { NewsView } from './components/NewsView';
import { RulesAndPinView } from './components/RulesAndPinView';
import {
  AdminModal,
  RequestBalanceModal,
  TicketReceiptModal,
  UserAccountModal,
} from './components/Modals';

const STORAGE_KEYS = {
  CLIENTS: '365dabarra_clients_v2',
  ACTIVE_CLIENT_ID: '365dabarra_active_client_v2',
  TICKETS: '365dabarra_tickets_v2',
  REQUESTS: '365dabarra_balance_requests_v3',
  THEME: '365dabarra_theme_v2',
  SOUND_MUTED: '365dabarra_sound_muted_v2',
};

interface ToastMessage {
  id: number;
  title: string;
  subtitle?: string;
  tone: 'emerald' | 'amber' | 'rose';
  soundLabel?: string;
}

export default function App() {
  // Theme state (Dark Emerald & Gold default, optional crisp Light Mode)
  const [isLightMode, setIsLightMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.THEME) === 'light';
    } catch {
      return false;
    }
  });

  // Soft Acoustic Sound Alerts state
  const [isSoundMuted, setIsSoundMuted] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.SOUND_MUTED) === 'true';
    } catch {
      return false;
    }
  });

  // Matches & News
  const [matches, setMatches] = useState<Match[]>(INITIAL_MATCHES);
  const [newsArticles] = useState<NewsArticle[]>(FALLBACK_NEWS_ARTICLES);

  // Navigation & Filters
  const [activeView, setActiveView] = useState<'matches' | 'match-center' | 'news' | 'rules'>('matches');
  const [currentFilter, setCurrentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in' | 'pre' | 'post'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMatchId, setSelectedMatchId] = useState<number>(INITIAL_MATCHES[0].id);
  const [autoOpenStream, setAutoOpenStream] = useState<boolean>(false);

  // Clients & Active Client
  const [clients, setClients] = useState<ClientAccount[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CLIENTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore storage errors
    }
    return DEFAULT_CLIENTS;
  });

  const [activeClientId, setActiveClientId] = useState<number>(() => {
    try {
      const saved = Number(localStorage.getItem(STORAGE_KEYS.ACTIVE_CLIENT_ID));
      if (saved) return saved;
    } catch {
      // ignore
    }
    return DEFAULT_CLIENTS[0].id;
  });

  const activeClient = useMemo(
    () => clients.find((c) => c.id === activeClientId) || clients[0],
    [clients, activeClientId]
  );

  // Betslip & Placed Tickets
  const [betslip, setBetslip] = useState<BetSelection[]>([
    {
      matchId: INITIAL_MATCHES[0].id,
      selection: `${INITIAL_MATCHES[0].teamA} (Casa)`,
      oddValue: INITIAL_MATCHES[0].odds['1'],
      marketName: 'Vencedor do Encontro (1x2)',
    },
  ]);
  const [stakeAmount, setStakeAmount] = useState<number>(20);
  const [betslipTab, setBetslipTab] = useState<'slip' | 'history'>('slip');

  const [placedTickets, setPlacedTickets] = useState<TicketReceipt[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TICKETS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return INITIAL_BETS_HISTORY;
  });

  // Balance & PIX Withdrawal Requests for Admin Panel
  const [balanceRequests, setBalanceRequests] = useState<BalanceRequest[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.REQUESTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [
      {
        id: 901,
        clientId: 3,
        clientName: 'Marcos Silva',
        amount: 150.0,
        time: '15:20',
        type: 'DEPOSIT',
        pixKey: '123.456.789-00',
      },
      {
        id: 902,
        clientId: 2,
        clientName: 'Carlos Eduardo',
        amount: 80.0,
        time: '15:32',
        type: 'WITHDRAWAL',
        pixKey: '(71) 98888-1122',
      },
    ];
  });

  // Mobile Drawers & Modals
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const [mobileBetslipOpen, setMobileBetslipOpen] = useState<boolean>(false);
  const [accountModalOpen, setAccountModalOpen] = useState<boolean>(false);
  const [accountModalTab, setAccountModalTab] = useState<'profile' | 'register' | 'switch'>('profile');
  const [requestBalanceOpen, setRequestBalanceOpen] = useState<boolean>(false);
  const [adminModalOpen, setAdminModalOpen] = useState<boolean>(false);
  const [activeReceiptPin, setActiveReceiptPin] = useState<string | null>(null);

  // Toast Notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const pushToast = (
    title: string,
    subtitle?: string,
    tone: 'emerald' | 'amber' | 'rose' = 'emerald',
    soundEvent?: SoundEventType
  ) => {
    let soundLabel: string | undefined;
    if (soundEvent) {
      const played = playSoftAlertSound(soundEvent, { muted: isSoundMuted });
      if (played) {
        soundLabel = getSoundProfile(soundEvent).label;
      }
    }

    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev.slice(-2), { id, title, subtitle, tone, soundLabel }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  };

  // Persist state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
    } catch {
      // ignore
    }
  }, [clients]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_CLIENT_ID, String(activeClientId));
    } catch {
      // ignore
    }
  }, [activeClientId]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(placedTickets));
    } catch {
      // ignore
    }
  }, [placedTickets]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(balanceRequests));
    } catch {
      // ignore
    }
  }, [balanceRequests]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, isLightMode ? 'light' : 'dark');
    } catch {
      // ignore
    }
  }, [isLightMode]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SOUND_MUTED, String(isSoundMuted));
    } catch {
      // ignore
    }
  }, [isSoundMuted]);

  // Live ESPN Scoreboard Synchronization + Live Radar Ticker
  useEffect(() => {
    let mounted = true;
    syncEspnMatches(INITIAL_MATCHES).then((synced) => {
      if (mounted && synced.length > 0) {
        setMatches(synced);
      }
    });

    const radarInterval = setInterval(() => {
      setMatches((prev) =>
        prev.map((m) => {
          if (!m.isLive) return m;
          const nextSec = (m.second + 1) % 60;
          const nextMin = nextSec === 0 ? Math.min(90, m.minute + 1) : m.minute;
          const jitterX = Math.sin(Date.now() / 1200 + m.id) * 0.035;
          const jitterY = Math.cos(Date.now() / 950 + m.id) * 0.04;
          const bx = Math.max(0.08, Math.min(0.92, m.state.ballX + jitterX));
          const by = Math.max(0.12, Math.min(0.88, m.state.ballY + jitterY));
          const zone: 'posse' | 'attack' | 'danger' =
            bx > 0.76 || bx < 0.24 ? 'danger' : bx > 0.6 || bx < 0.4 ? 'attack' : 'posse';

          return {
            ...m,
            minute: nextMin,
            second: nextSec,
            displayClock: `${nextMin}'`,
            state: {
              ...m.state,
              zone,
              ballX: bx,
              ballY: by,
              trail: [...m.state.trail.slice(-5), { x: bx, y: by }],
            },
          };
        })
      );
    }, 2800);

    return () => {
      mounted = false;
      clearInterval(radarInterval);
    };
  }, []);

  // Handlers
  const handleToggleSoundMute = () => {
    setIsSoundMuted((prev) => {
      const next = !prev;
      if (!next) {
        playSoftAlertSound('bet_validated', { muted: false });
      }
      return next;
    });
  };

  const handleTestSoundAlert = (event: SoundEventType) => {
    const profile = getSoundProfile(event);
    playSoftAlertSound(event, { muted: false });
    pushToast(
      `Alerta Sonoro: ${profile.label}`,
      profile.description,
      event === 'bet_validated'
        ? 'emerald'
        : event === 'withdrawal_approved'
        ? 'amber'
        : 'emerald'
    );
  };

  const handleSimulateIncomingAdminAlert = () => {
    const sampleClients = clients.length > 0 ? clients : DEFAULT_CLIENTS;
    const picked = sampleClients[Math.floor(Math.random() * sampleClients.length)];
    const isWithdrawal = Math.random() > 0.45;
    const amount = isWithdrawal ? 120 : 200;

    const newReq: BalanceRequest = {
      id: Date.now(),
      clientId: picked.id,
      clientName: picked.name,
      amount,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      type: isWithdrawal ? 'WITHDRAWAL' : 'DEPOSIT',
      pixKey: picked.pixKey || picked.phone,
    };

    setBalanceRequests((prev) => [newReq, ...prev]);
    pushToast(
      isWithdrawal
        ? `Nova Solicitação de Saque PIX (${formatBRL(amount)})`
        : `Nova Solicitação de Saldo (+${formatBRL(amount)})`,
      `Apostador: ${picked.name} • Notificação recebida no Painel Admin.`,
      'amber',
      'admin_notification'
    );
  };

  const handleNavigate = (view: 'matches' | 'match-center' | 'news' | 'rules', filter?: string) => {
    setActiveView(view);
    if (filter !== undefined) {
      setCurrentFilter(filter);
      if (filter === 'live') {
        setStatusFilter('in');
      } else if (filter === 'all') {
        setStatusFilter('all');
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectLeagueFilter = (filter: string) => {
    setCurrentFilter(filter);
    if (filter === 'live') {
      setStatusFilter('in');
    } else if (statusFilter === 'in' && filter !== 'live') {
      setStatusFilter('all');
    }
    if (activeView !== 'matches') {
      setActiveView('matches');
    }
  };

  const handleToggleBet = (
    matchId: number,
    selection: string,
    oddValue: number,
    marketName = 'Vencedor do Encontro (1x2)'
  ) => {
    const match = matches.find((m) => m.id === matchId);
    const result = toggleBetSelection(betslip, {
      matchId,
      selection,
      oddValue,
      marketName,
    });

    setBetslip(result.updatedSlip);

    if (result.action === 'added') {
      pushToast(
        `${selection} (@${oddValue.toFixed(2)})`,
        match ? `Adicionado: ${match.teamA} x ${match.teamB}` : 'Seleção adicionada ao Cupom',
        'emerald',
        'selection_added'
      );
    } else if (result.action === 'replaced') {
      pushToast(
        `Seleção Atualizada: ${selection} (@${oddValue.toFixed(2)})`,
        'Regra 1 opção por jogo: substituição automática no mesmo confronto.',
        'amber',
        'selection_added'
      );
    } else if (result.action === 'max_limit_reached') {
      pushToast(
        'Limite de 20 seleções atingido',
        'Finalize ou remova um jogo do cupom antes de adicionar outro.',
        'rose',
        'error_alert'
      );
    }
  };

  const handleRemoveBet = (matchId: number) => {
    setBetslip((prev) => prev.filter((b) => b.matchId !== matchId));
  };

  const handleClearSlip = () => {
    setBetslip([]);
    pushToast('Cupom limpo', 'Todas as seleções foram removidas.', 'amber');
  };

  const handleOpenMatchCenter = (matchId: number, autoStream = false) => {
    setSelectedMatchId(matchId);
    setAutoOpenStream(autoStream);
    setActiveView('match-center');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePlaceBet = (asPreTicketPinOnly: boolean) => {
    const validation = validateBetPlacement(
      betslip,
      stakeAmount,
      activeClient.balance,
      asPreTicketPinOnly
    );

    if (!validation.valid) {
      pushToast(
        'Não foi possível finalizar a aposta',
        validation.errorMessage || 'Verifique os dados do cupom.',
        'rose',
        'error_alert'
      );
      if (validation.errorCode === 'INSUFFICIENT_BALANCE') {
        setRequestBalanceOpen(true);
      }
      return;
    }

    const totals = calculateBetslipTotals(betslip, stakeAmount);
    const pin = generateRandomPin();
    const now = new Date();
    const createdAt = `${now.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    })} às ${now.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;

    const newTicket: TicketReceipt = {
      pin,
      clientId: activeClient.id,
      clientName: activeClient.name,
      selections: [...betslip],
      totalOdd: totals.totalOdd,
      stake: stakeAmount,
      payout: totals.payout,
      status: asPreTicketPinOnly ? 'AGUARDANDO ADMIN (PIN)' : 'VALIDADO',
      createdAt,
    };

    if (!asPreTicketPinOnly) {
      setClients((prev) =>
        prev.map((c) =>
          c.id === activeClient.id
            ? { ...c, balance: Math.max(0, +(c.balance - stakeAmount).toFixed(2)) }
            : c
        )
      );
    }

    setPlacedTickets((prev) => [newTicket, ...prev]);
    setBetslip([]);
    setBetslipTab('history');
    setMobileBetslipOpen(false);
    setActiveReceiptPin(pin);

    pushToast(
      asPreTicketPinOnly ? `Pré-Bilhete PIN ${pin} Gerado!` : `Aposta Validada • PIN ${pin}`,
      asPreTicketPinOnly
        ? 'Nova notificação enviada ao Admin/Cambista para validação do PIN.'
        : `Saldo debitado: ${formatBRL(stakeAmount)} • Retorno: ${formatBRL(totals.payout)}`,
      'emerald',
      asPreTicketPinOnly ? 'admin_notification' : 'bet_validated'
    );
  };

  // Account & Admin Actions
  const handleRegisterClient = (data: {
    name: string;
    username: string;
    phone: string;
    pixKey: string;
    initialRequest: number;
  }) => {
    const newId = Date.now();
    const newClient: ClientAccount = {
      id: newId,
      name: data.name,
      username: data.username,
      phone: data.phone,
      pixKey: data.pixKey,
      role: 'Apostador Cadastrado',
      status: data.initialRequest > 0 ? 'AGUARDANDO SALDO' : 'VERIFICADO',
      balance: 0,
      creditLimit: 1000,
      createdAt: new Date().toLocaleDateString('pt-BR'),
    };

    setClients((prev) => [...prev, newClient]);
    setActiveClientId(newId);

    if (data.initialRequest > 0) {
      const req: BalanceRequest = {
        id: Date.now() + 1,
        clientId: newId,
        clientName: data.name,
        amount: data.initialRequest,
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        type: 'DEPOSIT',
        pixKey: data.pixKey,
      };
      setBalanceRequests((prev) => [req, ...prev]);
      pushToast(
        `Conta criada: ${data.name}`,
        `Solicitação de ${formatBRL(data.initialRequest)} enviada ao Painel Admin!`,
        'emerald',
        'admin_notification'
      );
    } else {
      pushToast(
        `Bem-vindo, ${data.name}!`,
        'Sua conta foi criada e conectada com sucesso.',
        'emerald',
        'bet_validated'
      );
    }
  };

  const handleSubmitBalanceRequest = (
    amount: number,
    type: 'DEPOSIT' | 'WITHDRAWAL' = 'DEPOSIT',
    pixKey?: string
  ) => {
    if (type === 'WITHDRAWAL' && amount > activeClient.balance) {
      pushToast(
        'Saldo insuficiente para saque',
        `Seu saldo liberado atual é de ${formatBRL(activeClient.balance)}.`,
        'rose',
        'error_alert'
      );
      return;
    }

    const req: BalanceRequest = {
      id: Date.now(),
      clientId: activeClient.id,
      clientName: activeClient.name,
      amount,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      type,
      pixKey: pixKey || activeClient.pixKey,
    };
    setBalanceRequests((prev) => [req, ...prev]);
    pushToast(
      type === 'WITHDRAWAL'
        ? `Saque PIX de ${formatBRL(amount)} solicitado!`
        : `Solicitação de ${formatBRL(amount)} enviada!`,
      'Nova notificação registrada no Painel do Administrador.',
      'amber',
      'admin_notification'
    );
  };

  const handleApproveBalanceRequest = (reqId: number) => {
    const target = balanceRequests.find((r) => r.id === reqId);
    if (!target) return;

    const isWithdrawal = target.type === 'WITHDRAWAL';

    setClients((prev) =>
      prev.map((c) => {
        if (c.id !== target.clientId) return c;
        const nextBalance = isWithdrawal
          ? Math.max(0, +(c.balance - target.amount).toFixed(2))
          : +(c.balance + target.amount).toFixed(2);
        return {
          ...c,
          balance: nextBalance,
          status: 'VERIFICADO',
        };
      })
    );
    setBalanceRequests((prev) => prev.filter((r) => r.id !== reqId));

    pushToast(
      isWithdrawal
        ? `Saque PIX Aprovado: ${formatBRL(target.amount)}`
        : `Saldo Liberado: +${formatBRL(target.amount)}`,
      isWithdrawal
        ? `Transferência PIX confirmada para ${target.clientName} (${target.pixKey || 'Chave PIX'}).`
        : `Creditado na conta de ${target.clientName}.`,
      'emerald',
      'withdrawal_approved'
    );
  };

  const handleRejectBalanceRequest = (reqId: number) => {
    setBalanceRequests((prev) => prev.filter((r) => r.id !== reqId));
    pushToast('Solicitação recusada', 'O pedido foi removido da fila.', 'amber', 'error_alert');
  };

  const handleAdjustClientBalance = (clientId: number, deltaOrZero: number | 'ZERO') => {
    setClients((prev) =>
      prev.map((c) => {
        if (c.id !== clientId) return c;
        const nextBalance = deltaOrZero === 'ZERO' ? 0 : Math.max(0, +(c.balance + deltaOrZero).toFixed(2));
        return {
          ...c,
          balance: nextBalance,
          status: nextBalance > 0 ? 'VERIFICADO' : c.status,
        };
      })
    );
    const targetClient = clients.find((c) => c.id === clientId);
    pushToast(
      deltaOrZero === 'ZERO'
        ? `Saldo zerado (${targetClient?.name || 'Cliente'})`
        : `Saldo atualizado: +${formatBRL(deltaOrZero)}`,
      targetClient ? `Apostador: ${targetClient.name}` : undefined,
      'emerald',
      deltaOrZero === 'ZERO' ? 'error_alert' : 'withdrawal_approved'
    );
  };

  const handleValidateTicketPin = (pin: string) => {
    setPlacedTickets((prev) =>
      prev.map((t) => (t.pin === pin ? { ...t, status: 'VALIDADO' } : t))
    );
    pushToast(
      `Bilhete PIN ${pin} Validado!`,
      'O comprovante agora consta como VALIDADO OFICIAL.',
      'emerald',
      'bet_validated'
    );
  };

  const handleCreateClientByAdmin = (name: string, phone: string, initialBalance: number) => {
    const newId = Date.now();
    const newClient: ClientAccount = {
      id: newId,
      name,
      username: name.toLowerCase().replace(/\s+/g, '.'),
      phone,
      pixKey: phone,
      role: 'Cliente VIP',
      status: 'VERIFICADO',
      balance: initialBalance,
      creditLimit: 1500,
      createdAt: new Date().toLocaleDateString('pt-BR'),
    };
    setClients((prev) => [...prev, newClient]);
    setActiveClientId(newId);
    pushToast(
      `Apostador ${name} cadastrado!`,
      `Saldo inicial liberado: ${formatBRL(initialBalance)}`,
      'emerald',
      'withdrawal_approved'
    );
  };

  const selectedMatch = useMemo(
    () => matches.find((m) => m.id === selectedMatchId) || matches[0],
    [matches, selectedMatchId]
  );

  const activeReceiptTicket = useMemo(
    () => placedTickets.find((t) => t.pin === activeReceiptPin) || null,
    [placedTickets, activeReceiptPin]
  );

  const pendingPinsCount = useMemo(
    () => placedTickets.filter((t) => t.status === 'AGUARDANDO ADMIN (PIN)').length,
    [placedTickets]
  );

  const adminAlertCount = balanceRequests.length + pendingPinsCount;

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-200 ${
        isLightMode ? 'bg-[#F1F5F9] text-slate-900' : 'bg-[#090D16] text-slate-100'
      }`}
    >
      {/* Top Header (Zone 1: Brand | Zone 2: Primary Views | Zone 3: Active Client & Balance) */}
      <Header
        activeView={activeView}
        currentFilter={currentFilter}
        activeClient={activeClient}
        isLightMode={isLightMode}
        onNavigate={handleNavigate}
        onOpenAccountModal={(tab) => {
          setAccountModalTab(tab);
          setAccountModalOpen(true);
        }}
        onToggleMobileSidebar={() => setMobileSidebarOpen((v) => !v)}
      />

      {/* Main 3-Column Sportsbook Workspace */}
      <div className="flex-1 w-full max-w-[1640px] mx-auto px-3 sm:px-5 pt-4 pb-20 lg:pb-8 grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)_340px] gap-4 items-start">
        {/* Left Navigation & League Tree Sidebar */}
        <Sidebar
          matches={matches}
          activeView={activeView}
          currentFilter={currentFilter}
          adminAlertCount={adminAlertCount}
          isLightMode={isLightMode}
          isSoundMuted={isSoundMuted}
          isOpenMobile={mobileSidebarOpen}
          onSelectFilter={handleSelectLeagueFilter}
          onSwitchView={(view) => handleNavigate(view)}
          onOpenRequestBalance={() => setRequestBalanceOpen(true)}
          onOpenAccountModal={(tab) => {
            setAccountModalTab(tab);
            setAccountModalOpen(true);
          }}
          onOpenAdminModal={() => setAdminModalOpen(true)}
          onToggleTheme={() => setIsLightMode((v) => !v)}
          onToggleSoundMute={handleToggleSoundMute}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />

        {/* Center Primary Canvas */}
        <main className="min-w-0">
          {activeView === 'matches' && (
            <MatchesView
              matches={matches}
              betslip={betslip}
              currentFilter={currentFilter}
              statusFilter={statusFilter}
              searchQuery={searchQuery}
              topNews={newsArticles[0]}
              isLightMode={isLightMode}
              onSelectFilter={handleSelectLeagueFilter}
              onSelectStatusFilter={setStatusFilter}
              onSearchChange={setSearchQuery}
              onToggleBet={handleToggleBet}
              onOpenMatchCenter={handleOpenMatchCenter}
              onSwitchView={(view) => handleNavigate(view)}
            />
          )}

          {activeView === 'match-center' && selectedMatch && (
            <MatchCenterView
              match={selectedMatch}
              allMatches={matches}
              betslip={betslip}
              initialStreamOpen={autoOpenStream}
              isLightMode={isLightMode}
              onBack={() => setActiveView('matches')}
              onSelectMatch={(mId) => setSelectedMatchId(mId)}
              onToggleBet={handleToggleBet}
            />
          )}

          {activeView === 'news' && (
            <NewsView
              articles={newsArticles}
              isLightMode={isLightMode}
              onBack={() => setActiveView('matches')}
            />
          )}

          {activeView === 'rules' && (
            <RulesAndPinView
              placedTickets={placedTickets}
              matches={matches}
              isLightMode={isLightMode}
              onBack={() => setActiveView('matches')}
              onOpenReceiptModal={(pin) => setActiveReceiptPin(pin)}
            />
          )}
        </main>

        {/* Right Sticky Betslip & Placed Tickets History */}
        <BetslipPanel
          betslip={betslip}
          placedTickets={placedTickets}
          matches={matches}
          clients={clients}
          activeClient={activeClient}
          activeTab={betslipTab}
          stakeAmount={stakeAmount}
          isLightMode={isLightMode}
          isOpenMobile={mobileBetslipOpen}
          onSwitchTab={setBetslipTab}
          onSelectClient={(id) => setActiveClientId(id)}
          onOpenNewClient={() => {
            setAccountModalTab('register');
            setAccountModalOpen(true);
          }}
          onStakeChange={setStakeAmount}
          onRemoveBet={handleRemoveBet}
          onClearSlip={handleClearSlip}
          onPlaceBet={handlePlaceBet}
          onOpenReceipt={(pin) => setActiveReceiptPin(pin)}
          onCloseMobile={() => setMobileBetslipOpen(false)}
        />
      </div>

      {/* Mobile Ergonomic Thumb-Zone Bottom Bar (<= 56px height) */}
      <nav
        aria-label="Navegação Rápida Mobile"
        className={`lg:hidden fixed bottom-0 inset-x-0 z-40 h-14 border-t grid grid-cols-5 items-center px-1 backdrop-blur-md ${
          isLightMode
            ? 'bg-white/95 border-slate-200 text-slate-700'
            : 'bg-[#0B101B]/95 border-slate-800/90 text-slate-300'
        }`}
      >
        <button
          type="button"
          onClick={() => {
            setMobileBetslipOpen(false);
            handleNavigate('matches', 'all');
          }}
          className={`flex flex-col items-center justify-center h-full gap-0.5 text-[10px] font-bold transition-colors ${
            activeView === 'matches' && currentFilter !== 'live'
              ? 'text-emerald-400'
              : 'text-slate-400'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>Jogos</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setMobileBetslipOpen(false);
            handleNavigate('matches', 'live');
          }}
          className={`flex flex-col items-center justify-center h-full gap-0.5 text-[10px] font-bold transition-colors ${
            (activeView === 'matches' && currentFilter === 'live') || activeView === 'match-center'
              ? 'text-emerald-400'
              : 'text-slate-400'
          }`}
        >
          <Flame className="w-4 h-4 text-rose-500" />
          <span>Ao Vivo</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileBetslipOpen((v) => !v)}
          className="relative flex flex-col items-center justify-center h-full"
        >
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 tabular-nums">
            <Ticket className="w-3.5 h-3.5" />
            <span>Cupom ({betslip.length})</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setMobileBetslipOpen(false);
            handleNavigate('rules');
          }}
          className={`flex flex-col items-center justify-center h-full gap-0.5 text-[10px] font-bold transition-colors ${
            activeView === 'rules' ? 'text-amber-400' : 'text-slate-400'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>Conferir PIN</span>
        </button>

        <button
          type="button"
          onClick={() => setAdminModalOpen(true)}
          className="relative flex flex-col items-center justify-center h-full gap-0.5 text-[10px] font-bold text-amber-400"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Admin</span>
          {adminAlertCount > 0 && (
            <span className="absolute top-1.5 right-3 w-4 h-4 rounded-full bg-amber-400 text-slate-950 font-mono font-black text-[9px] flex items-center justify-center tabular-nums">
              {adminAlertCount}
            </span>
          )}
        </button>
      </nav>

      {/* Toast Feedback Stack with Soft Acoustic Badge */}
      {toasts.length > 0 && (
        <div className="fixed bottom-16 lg:bottom-5 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-3 sm:px-0">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-2.5 p-3.5 rounded-xl border shadow-xl backdrop-blur-md transition-all ${
                t.tone === 'emerald'
                  ? 'bg-[#0D1F1A]/95 border-emerald-500/50 text-emerald-100'
                  : t.tone === 'amber'
                  ? 'bg-[#231B0C]/95 border-amber-400/50 text-amber-100'
                  : 'bg-[#261116]/95 border-rose-500/50 text-rose-100'
              }`}
            >
              <Sparkles
                className={`w-4 h-4 shrink-0 mt-0.5 ${
                  t.tone === 'emerald'
                    ? 'text-emerald-400'
                    : t.tone === 'amber'
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-extrabold leading-tight">{t.title}</div>
                  {t.soundLabel && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/10 text-[9px] font-mono font-bold uppercase tracking-wider shrink-0">
                      <Volume2 className="w-2.5 h-2.5" />
                      <span>♪ Som</span>
                    </span>
                  )}
                </div>
                {t.subtitle && (
                  <div className="text-[11px] opacity-85 mt-0.5 leading-snug">{t.subtitle}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Interactive Modals */}
      <UserAccountModal
        isOpen={accountModalOpen}
        onClose={() => setAccountModalOpen(false)}
        initialTab={accountModalTab}
        currentClient={activeClient}
        clients={clients}
        tickets={placedTickets}
        onSwitchClient={(id) => {
          setActiveClientId(id);
          const found = clients.find((c) => c.id === id);
          if (found) {
            pushToast(
              `Apostador conectado: ${found.name}`,
              `Saldo disponível: ${formatBRL(found.balance)}`,
              'emerald',
              'selection_added'
            );
          }
        }}
        onRegisterClient={handleRegisterClient}
        onOpenRequestBalance={() => setRequestBalanceOpen(true)}
        onOpenAdmin={() => setAdminModalOpen(true)}
        isLightMode={isLightMode}
      />

      <RequestBalanceModal
        isOpen={requestBalanceOpen}
        onClose={() => setRequestBalanceOpen(false)}
        currentClient={activeClient}
        onSubmitRequest={handleSubmitBalanceRequest}
        onOpenAdmin={() => setAdminModalOpen(true)}
        isLightMode={isLightMode}
      />

      <AdminModal
        isOpen={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
        clients={clients}
        balanceRequests={balanceRequests}
        tickets={placedTickets}
        isSoundMuted={isSoundMuted}
        onToggleSoundMute={handleToggleSoundMute}
        onTestSoundAlert={handleTestSoundAlert}
        onSimulateIncomingAdminAlert={handleSimulateIncomingAdminAlert}
        onApproveRequest={handleApproveBalanceRequest}
        onRejectRequest={handleRejectBalanceRequest}
        onAdjustClientBalance={handleAdjustClientBalance}
        onValidateTicketPin={handleValidateTicketPin}
        onCreateClientByAdmin={handleCreateClientByAdmin}
        onInspectTicket={(ticket) => setActiveReceiptPin(ticket.pin)}
        isLightMode={isLightMode}
      />

      <TicketReceiptModal
        ticket={activeReceiptTicket}
        matches={matches}
        onClose={() => setActiveReceiptPin(null)}
      />
    </div>
  );
}
