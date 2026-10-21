import React, { useState } from 'react';
import {
  X,
  User,
  UserPlus,
  Users,
  Wallet,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  MessageCircle,
  Printer,
  Copy,
  Check,
  QrCode,
  Sparkles,
  Plus,
  RotateCcw,
  Volume2,
  VolumeX,
  BellRing,
} from 'lucide-react';
import {
  ClientAccount,
  BalanceRequest,
  TicketReceipt,
  Match,
  SoundEventType,
} from '../types/sportsbook';
import {
  formatBRL,
  buildWhatsAppTicketMessage,
} from '../utils/bettingRules';
import { CAMBISTA_WHATSAPP } from '../data/initialData';

/* ============================================================================
   1. USER ACCOUNT MODAL (Perfil, Criar Conta, Entrar / Trocar Cliente)
   ============================================================================ */
interface UserAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'profile' | 'register' | 'switch';
  currentClient: ClientAccount;
  clients: ClientAccount[];
  tickets: TicketReceipt[];
  onSwitchClient: (clientId: number) => void;
  onRegisterClient: (data: {
    name: string;
    username: string;
    phone: string;
    pixKey: string;
    initialRequest: number;
  }) => void;
  onOpenRequestBalance: () => void;
  onOpenAdmin: () => void;
  isLightMode: boolean;
}

export const UserAccountModal: React.FC<UserAccountModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'profile',
  currentClient,
  clients,
  tickets,
  onSwitchClient,
  onRegisterClient,
  onOpenRequestBalance,
  onOpenAdmin,
  isLightMode,
}) => {
  const [tab, setTab] = useState<'profile' | 'register' | 'switch'>(initialTab);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [initialRequest, setInitialRequest] = useState('100');

  React.useEffect(() => {
    if (isOpen) {
      setTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const clientTickets = tickets.filter((t) => t.clientId === currentClient.id);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onRegisterClient({
      name: name.trim(),
      username: username.trim() || name.trim().toLowerCase().replace(/\s+/g, '.'),
      phone: phone.trim() || '(14) 99999-0000',
      pixKey: pixKey.trim() || phone.trim() || 'Não informada',
      initialRequest: Math.max(0, parseFloat(initialRequest) || 0),
    });
    setName('');
    setUsername('');
    setPhone('');
    setPixKey('');
    setInitialRequest('100');
    setTab('profile');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden transition-all ${
          isLightMode
            ? 'bg-white border-slate-200 text-slate-900'
            : 'bg-[#0E141F] border-slate-800 text-white'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${
            isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-[#131C2B] border-slate-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold tracking-tight">
                CENTRAL DO APOSTADOR • 365 DA BARRA
              </h3>
              <p className="text-xs text-slate-400">
                Gerencie seu perfil, crie uma nova conta ou alterne entre apostadores cadastrados
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div
          className={`grid grid-cols-3 gap-2 px-6 py-3 border-b ${
            isLightMode ? 'bg-slate-100/70 border-slate-200' : 'bg-[#090D14] border-slate-800/80'
          }`}
        >
          <button
            type="button"
            onClick={() => setTab('profile')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
              tab === 'profile'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : isLightMode
                ? 'bg-white text-slate-600 hover:bg-slate-200/70'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Minha Conta</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('register')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
              tab === 'register'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : isLightMode
                ? 'bg-white text-slate-600 hover:bg-slate-200/70'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Criar Nova Conta</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('switch')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
              tab === 'switch'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : isLightMode
                ? 'bg-white text-slate-600 hover:bg-slate-200/70'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Trocar Cliente ({clients.length})</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {tab === 'profile' && (
            <div className="space-y-5">
              <div
                className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isLightMode
                    ? 'bg-slate-50 border-slate-200'
                    : 'bg-gradient-to-br from-[#131D2E] to-[#0B101B] border-slate-800'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-xl font-black text-emerald-400">
                    {currentClient.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-lg font-extrabold">{currentClient.name}</h4>
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {currentClient.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      @{currentClient.username} • {currentClient.role}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      WhatsApp: <strong className="text-slate-200">{currentClient.phone}</strong> • PIX:{' '}
                      <strong className="text-slate-200">{currentClient.pixKey}</strong>
                    </p>
                  </div>
                </div>

                <div className="sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    SALDO LIBERADO PELO ADMIN
                  </span>
                  <span className="text-2xl font-black font-mono tabular-nums text-emerald-400">
                    {formatBRL(currentClient.balance)}
                  </span>
                  <span className="block text-[11px] text-slate-400 tabular-nums">
                    Bilhetes emitidos: {clientTickets.length}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenRequestBalance();
                  }}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-400/10"
                >
                  <Wallet className="w-4 h-4" />
                  <span>Solicitar Liberação de Saldo</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAdmin();
                  }}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-400/30 font-bold text-xs uppercase tracking-wider transition-all"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Abrir Painel Admin / Cambista</span>
                </button>
              </div>
            </div>
          )}

          {tab === 'register' && (
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Marcos Oliveira"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-emerald-500 ${
                      isLightMode
                        ? 'bg-slate-50 border-slate-300 text-slate-900'
                        : 'bg-slate-900/90 border-slate-700 text-white'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Usuário / Login
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ex: marcos.barra"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-emerald-500 ${
                      isLightMode
                        ? 'bg-slate-50 border-slate-300 text-slate-900'
                        : 'bg-slate-900/90 border-slate-700 text-white'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    WhatsApp com DDD *
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(14) 99999-9999"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-emerald-500 ${
                      isLightMode
                        ? 'bg-slate-50 border-slate-300 text-slate-900'
                        : 'bg-slate-900/90 border-slate-700 text-white'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Chave PIX (Para Recebimento de Prêmios)
                  </label>
                  <input
                    type="text"
                    value={pixKey}
                    onChange={(e) => setPixKey(e.target.value)}
                    placeholder="CPF, E-mail ou Telefone"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-emerald-500 ${
                      isLightMode
                        ? 'bg-slate-50 border-slate-300 text-slate-900'
                        : 'bg-slate-900/90 border-slate-700 text-white'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Solicitar Saldo Inicial ao Administrador (R$)
                </label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={initialRequest}
                  onChange={(e) => setInitialRequest(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono tabular-nums focus:outline-none focus:border-emerald-500 ${
                    isLightMode
                      ? 'bg-slate-50 border-slate-300 text-slate-900'
                      : 'bg-slate-900/90 border-slate-700 text-white'
                  }`}
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  O pedido de saldo inicial aparecerá imediatamente no Painel do Administrador para aprovação.
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20"
              >
                Cadastrar Apostador & Entrar na Conta
              </button>
            </form>
          )}

          {tab === 'switch' && (
            <div className="space-y-2.5">
              {clients.map((client) => {
                const isCurrent = client.id === currentClient.id;
                return (
                  <div
                    key={client.id}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                      isCurrent
                        ? 'bg-emerald-500/10 border-emerald-500/40'
                        : isLightMode
                        ? 'bg-slate-50 border-slate-200 hover:border-slate-300'
                        : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{client.name}</span>
                        <span className="text-[10px] font-mono text-slate-400">
                          @{client.username}
                        </span>
                        {isCurrent && (
                          <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded bg-emerald-500 text-slate-950">
                            ATIVO
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {client.phone} • PIX: {client.pixKey}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="block text-[10px] uppercase text-slate-400 font-bold">
                          Saldo
                        </span>
                        <span className="font-mono font-extrabold text-sm text-emerald-400 tabular-nums">
                          {formatBRL(client.balance)}
                        </span>
                      </div>
                      {!isCurrent && (
                        <button
                          type="button"
                          onClick={() => {
                            onSwitchClient(client.id);
                            onClose();
                          }}
                          className="px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors"
                        >
                          Selecionar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   2. REQUEST BALANCE & PIX WITHDRAWAL MODAL (Saldo / Saque PIX)
   ============================================================================ */
interface RequestBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentClient: ClientAccount;
  onSubmitRequest: (
    amount: number,
    type?: 'DEPOSIT' | 'WITHDRAWAL',
    pixKey?: string
  ) => void;
  onOpenAdmin: () => void;
  isLightMode: boolean;
}

export const RequestBalanceModal: React.FC<RequestBalanceModalProps> = ({
  isOpen,
  onClose,
  currentClient,
  onSubmitRequest,
  onOpenAdmin,
  isLightMode,
}) => {
  const [mode, setMode] = useState<'DEPOSIT' | 'WITHDRAWAL'>('DEPOSIT');
  const [amount, setAmount] = useState<number>(100);
  const [pixDestination, setPixDestination] = useState<string>(currentClient.pixKey || '');

  React.useEffect(() => {
    if (isOpen) {
      setPixDestination(currentClient.pixKey || currentClient.phone || '');
    }
  }, [isOpen, currentClient]);

  if (!isOpen) return null;

  const presets = [50, 100, 250, 500];

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) return;
    onSubmitRequest(amount, mode, pixDestination);
    onClose();
  };

  const handleWhatsAppDirect = () => {
    const isWithdrawal = mode === 'WITHDRAWAL';
    const msg = [
      `Olá Cambista *365 DA BARRA*!`,
      isWithdrawal
        ? `Solicito *SAQUE PIX* do meu saldo disponível:`
        : `Solicito *LIBERAÇÃO DE SALDO* na minha conta:`,
      `👤 Apostador: *${currentClient.name}* (@${currentClient.username})`,
      `💰 Valor: *${formatBRL(amount)}*`,
      `📱 Chave PIX: ${pixDestination || currentClient.pixKey}`,
    ].join('\n');
    window.open(
      `https://wa.me/${CAMBISTA_WHATSAPP}?text=${encodeURIComponent(msg)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden ${
          isLightMode
            ? 'bg-white border-slate-200 text-slate-900'
            : 'bg-[#0E141F] border-slate-800 text-white'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${
            isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-[#131C2B] border-slate-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Wallet className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-extrabold uppercase tracking-wider">
              Central Financeira • Saldo & Saque PIX
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white"
            aria-label="Fechar modal financeiro"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher: Pedir Saldo vs Solicitar Saque PIX */}
        <div
          className={`grid grid-cols-2 gap-2 px-6 py-3 border-b ${
            isLightMode ? 'bg-slate-100/70 border-slate-200' : 'bg-[#090D14] border-slate-800'
          }`}
        >
          <button
            type="button"
            onClick={() => setMode('DEPOSIT')}
            className={`py-2 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              mode === 'DEPOSIT'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : isLightMode
                ? 'bg-white text-slate-600'
                : 'bg-slate-900 text-slate-300'
            }`}
          >
            + Pedir Saldo
          </button>
          <button
            type="button"
            onClick={() => setMode('WITHDRAWAL')}
            className={`py-2 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              mode === 'WITHDRAWAL'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : isLightMode
                ? 'bg-white text-slate-600'
                : 'bg-slate-900 text-slate-300'
            }`}
          >
            💸 Solicitar Saque PIX
          </button>
        </div>

        <form onSubmit={handleConfirm} className="p-6 space-y-4">
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between ${
              isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/90 border-slate-800'
            }`}
          >
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Apostador Conectado
              </span>
              <strong className="text-sm">{currentClient.name}</strong>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Saldo Disponível
              </span>
              <strong className="text-base font-mono tabular-nums text-emerald-400">
                {formatBRL(currentClient.balance)}
              </strong>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              {mode === 'WITHDRAWAL' ? 'Valor do Saque Rápido' : 'Escolha um Valor Rápido'}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {presets.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(val)}
                  className={`py-2.5 rounded-xl font-mono font-extrabold text-xs tabular-nums border transition-all cursor-pointer ${
                    amount === val
                      ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-md shadow-amber-400/20'
                      : isLightMode
                      ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  R$ {val}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              {mode === 'WITHDRAWAL' ? 'Valor do Saque PIX (R$)' : 'Valor de Saldo Desejado (R$)'}
            </label>
            <input
              type="number"
              min="10"
              max="50000"
              step="5"
              value={amount}
              onChange={(e) => setAmount(Math.max(0, parseFloat(e.target.value) || 0))}
              className={`w-full px-4 py-3 rounded-xl border font-mono text-lg font-extrabold tabular-nums focus:outline-none focus:border-amber-400 ${
                isLightMode
                  ? 'bg-slate-50 border-slate-300 text-slate-900'
                  : 'bg-slate-900 border-slate-700 text-white'
              }`}
            />
          </div>

          {mode === 'WITHDRAWAL' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Chave PIX para Recebimento
              </label>
              <input
                type="text"
                required
                value={pixDestination}
                onChange={(e) => setPixDestination(e.target.value)}
                placeholder="CPF, Telefone, E-mail ou Chave Aleatória"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono focus:outline-none focus:border-amber-400 ${
                  isLightMode
                    ? 'bg-slate-50 border-slate-300 text-slate-900'
                    : 'bg-slate-900 border-slate-700 text-white'
                }`}
              />
            </div>
          )}

          <div className="space-y-2 pt-1">
            <button
              type="submit"
              className={`w-full py-3 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all shadow-lg cursor-pointer ${
                mode === 'WITHDRAWAL'
                  ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-amber-400/20'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
              }`}
            >
              {mode === 'WITHDRAWAL'
                ? 'Solicitar Saque PIX ao Admin'
                : 'Enviar Solicitação para o Painel Admin'}
            </button>

            <button
              type="button"
              onClick={handleWhatsAppDirect}
              className="w-full py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Solicitar via WhatsApp (14) 99195-1381</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAdmin();
              }}
              className="w-full py-2 text-[11px] font-bold text-amber-400 hover:underline text-center cursor-pointer"
            >
              É Administrador? Clique aqui para aprovar agora no Painel Admin →
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ============================================================================
   3. ADMIN & CAMBISTA MODAL (Aprovar Saldo/Saque, Validar PIN, Alertas Sonoros)
   ============================================================================ */
interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: ClientAccount[];
  balanceRequests: BalanceRequest[];
  tickets: TicketReceipt[];
  isSoundMuted?: boolean;
  onToggleSoundMute?: () => void;
  onTestSoundAlert?: (event: SoundEventType) => void;
  onSimulateIncomingAdminAlert?: () => void;
  onApproveRequest: (reqId: number) => void;
  onRejectRequest: (reqId: number) => void;
  onAdjustClientBalance: (clientId: number, deltaOrZero: number | 'ZERO') => void;
  onValidateTicketPin: (pin: string) => void;
  onCreateClientByAdmin: (name: string, phone: string, initialBalance: number) => void;
  onInspectTicket: (ticket: TicketReceipt) => void;
  isLightMode: boolean;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  clients,
  balanceRequests,
  tickets,
  isSoundMuted = false,
  onToggleSoundMute,
  onTestSoundAlert,
  onSimulateIncomingAdminAlert,
  onApproveRequest,
  onRejectRequest,
  onAdjustClientBalance,
  onValidateTicketPin,
  onCreateClientByAdmin,
  onInspectTicket,
  isLightMode,
}) => {
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientBalance, setNewClientBalance] = useState('200');

  if (!isOpen) return null;

  const totalBalance = clients.reduce((acc, c) => acc + c.balance, 0);
  const pendingTickets = tickets.filter((t) => t.status === 'AGUARDANDO ADMIN (PIN)');

  const handleQuickAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;
    onCreateClientByAdmin(
      newClientName.trim(),
      newClientPhone.trim() || '(14) 99999-0000',
      Math.max(0, parseFloat(newClientBalance) || 0)
    );
    setNewClientName('');
    setNewClientPhone('');
    setNewClientBalance('200');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-4xl rounded-2xl border shadow-2xl overflow-hidden ${
          isLightMode
            ? 'bg-white border-slate-200 text-slate-900'
            : 'bg-[#0E141F] border-slate-800 text-white'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${
            isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-[#131C2B] border-slate-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold tracking-tight">
                PAINEL DO ADMINISTRADOR & CAMBISTA • 365 DA BARRA
              </h3>
              <p className="text-xs text-slate-400">
                Liberação de saldo, aprovação de saques PIX, validação de Pré-Bilhetes PIN e alertas sonoros
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white"
            aria-label="Fechar Painel Admin"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 max-h-[80vh] overflow-y-auto space-y-6">
          {/* Soft Acoustic Sound Alerts Control Strip */}
          <div
            className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
              isLightMode
                ? 'bg-slate-50 border-slate-200'
                : 'bg-[#121B2B] border-slate-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onToggleSoundMute}
                className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                  isSoundMuted
                    ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                    : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                }`}
                title={isSoundMuted ? 'Ativar alertas sonoros' : 'Silenciar alertas sonoros'}
              >
                {isSoundMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider">
                    Alertas Sonoros Suaves (Eventos Críticos)
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      isSoundMuted
                        ? 'bg-rose-500/20 text-rose-400'
                        : 'bg-emerald-500/20 text-emerald-400'
                    }`}
                  >
                    {isSoundMuted ? 'SILENCIADO' : 'ATIVO'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Toques harmônicos suaves para aposta validada, saque PIX aprovado e nova notificação admin
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {onTestSoundAlert && (
                <>
                  <button
                    type="button"
                    onClick={() => onTestSoundAlert('bet_validated')}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold cursor-pointer"
                  >
                    ♪ Som Aposta Validada
                  </button>
                  <button
                    type="button"
                    onClick={() => onTestSoundAlert('withdrawal_approved')}
                    className="px-2.5 py-1.5 rounded-lg bg-amber-400/15 hover:bg-amber-400/25 text-amber-300 border border-amber-400/30 text-[11px] font-bold cursor-pointer"
                  >
                    ♪ Som Saque Aprovado
                  </button>
                  <button
                    type="button"
                    onClick={() => onTestSoundAlert('admin_notification')}
                    className="px-2.5 py-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 text-[11px] font-bold cursor-pointer"
                  >
                    ♪ Som Alerta Admin
                  </button>
                </>
              )}
              {onSimulateIncomingAdminAlert && (
                <button
                  type="button"
                  onClick={onSimulateIncomingAdminAlert}
                  className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-extrabold flex items-center gap-1 cursor-pointer"
                >
                  <BellRing className="w-3.5 h-3.5" />
                  <span>Simular Nova Notificação</span>
                </button>
              )}
            </div>
          </div>

          {/* KPI Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div
              className={`p-4 rounded-xl border ${
                isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/80 border-slate-800'
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Total em Saldos Liberados
              </span>
              <span className="text-xl font-black font-mono tabular-nums text-emerald-400 mt-1 block">
                {formatBRL(totalBalance)}
              </span>
            </div>
            <div
              className={`p-4 rounded-xl border ${
                isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/80 border-slate-800'
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Solicitações de Saldo / Saque PIX
              </span>
              <span className="text-xl font-black font-mono tabular-nums text-amber-400 mt-1 block">
                {balanceRequests.length}
              </span>
            </div>
            <div
              className={`p-4 rounded-xl border ${
                isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/80 border-slate-800'
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Pré-Bilhetes PIN Aguardando
              </span>
              <span className="text-xl font-black font-mono tabular-nums text-sky-400 mt-1 block">
                {pendingTickets.length}
              </span>
            </div>
          </div>

          {/* Pending Balance & PIX Withdrawal Requests */}
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-400 mb-2.5 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>Solicitações de Saldo & Saques PIX Pendentes ({balanceRequests.length})</span>
            </h4>
            {balanceRequests.length === 0 ? (
              <div
                className={`p-4 rounded-xl border text-xs text-slate-400 ${
                  isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/40 border-slate-800'
                }`}
              >
                Nenhuma solicitação de saldo ou saque PIX pendente no momento.
              </div>
            ) : (
              <div className="space-y-2">
                {balanceRequests.map((req) => {
                  const isWithdrawal = req.type === 'WITHDRAWAL';
                  return (
                    <div
                      key={req.id}
                      className={`flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl border ${
                        isWithdrawal
                          ? isLightMode
                            ? 'bg-emerald-50/70 border-emerald-200'
                            : 'bg-emerald-500/10 border-emerald-500/30'
                          : isLightMode
                          ? 'bg-amber-50/60 border-amber-200'
                          : 'bg-amber-500/10 border-amber-500/30'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              isWithdrawal
                                ? 'bg-emerald-500 text-slate-950'
                                : 'bg-amber-400 text-slate-950'
                            }`}
                          >
                            {isWithdrawal ? 'SAQUE PIX' : 'PEDIDO DE SALDO'}
                          </span>
                          <span className="font-bold text-sm">{req.clientName}</span>
                          <span className="text-xs text-slate-400">às {req.time}</span>
                        </div>
                        {req.pixKey && (
                          <div className="text-[11px] text-slate-400 font-mono mt-1">
                            Chave PIX destino: <strong className="text-slate-200">{req.pixKey}</strong>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`font-mono font-black text-base tabular-nums ${
                            isWithdrawal ? 'text-emerald-400' : 'text-amber-400'
                          }`}
                        >
                          {isWithdrawal ? formatBRL(req.amount) : `+${formatBRL(req.amount)}`}
                        </span>
                        <button
                          type="button"
                          onClick={() => onApproveRequest(req.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs transition-colors cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{isWithdrawal ? 'Aprovar Saque PIX' : 'Liberar Saldo'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onRejectRequest(req.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold transition-colors cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Recusar</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pending PIN Tickets */}
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-sky-400 mb-2.5">
              Pré-Bilhetes PIN Aguardando Validação ({pendingTickets.length})
            </h4>
            {pendingTickets.length === 0 ? (
              <div
                className={`p-4 rounded-xl border text-xs text-slate-400 ${
                  isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/40 border-slate-800'
                }`}
              >
                Todos os códigos PIN já foram validados.
              </div>
            ) : (
              <div className="space-y-2">
                {pendingTickets.map((t) => (
                  <div
                    key={t.pin}
                    className={`flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl border ${
                      isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/70 border-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-mono font-black text-xs tabular-nums">
                          PIN {t.pin}
                        </span>
                        <span className="font-bold text-sm">{t.clientName}</span>
                        <span className="text-xs text-slate-400">
                          ({t.selections.length} seleções • Odd {t.totalOdd.toFixed(2)})
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1 tabular-nums">
                        Aposta: <strong className="text-white">{formatBRL(t.stake)}</strong> → Retorno Potencial:{' '}
                        <strong className="text-emerald-400">{formatBRL(t.payout)}</strong>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onInspectTicket(t)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
                      >
                        Ver Recibo
                      </button>
                      <button
                        type="button"
                        onClick={() => onValidateTicketPin(t.pin)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Validar PIN</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Client Balance Manager */}
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 mb-2.5">
              Gerenciar Saldos de Clientes ({clients.length})
            </h4>
            <div className="space-y-2">
              {clients.map((c) => (
                <div
                  key={c.id}
                  className={`flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl border ${
                    isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/70 border-slate-800'
                  }`}
                >
                  <div>
                    <div className="font-bold text-sm">{c.name}</div>
                    <div className="text-xs text-slate-400 font-mono">
                      @{c.username} • {c.phone}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-black text-sm text-emerald-400 tabular-nums mr-2">
                      {formatBRL(c.balance)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onAdjustClientBalance(c.id, 50)}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-mono font-bold text-xs tabular-nums"
                    >
                      +R$ 50
                    </button>
                    <button
                      type="button"
                      onClick={() => onAdjustClientBalance(c.id, 100)}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-mono font-bold text-xs tabular-nums"
                    >
                      +R$ 100
                    </button>
                    <button
                      type="button"
                      onClick={() => onAdjustClientBalance(c.id, 500)}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-extrabold text-xs tabular-nums"
                    >
                      +R$ 500
                    </button>
                    <button
                      type="button"
                      onClick={() => onAdjustClientBalance(c.id, 'ZERO')}
                      className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs"
                      title="Zerar Saldo"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Add New Client */}
          <form
            onSubmit={handleQuickAddClient}
            className={`p-4 rounded-xl border space-y-3 ${
              isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/40 border-slate-800'
            }`}
          >
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Cadastrar Novo Apostador com Saldo Liberado</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              <input
                type="text"
                required
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                placeholder="Nome do Apostador"
                className={`px-3 py-2 rounded-lg border text-xs ${
                  isLightMode
                    ? 'bg-white border-slate-300 text-slate-900'
                    : 'bg-slate-900 border-slate-700 text-white'
                }`}
              />
              <input
                type="text"
                value={newClientPhone}
                onChange={(e) => setNewClientPhone(e.target.value)}
                placeholder="WhatsApp (14) 99999-9999"
                className={`px-3 py-2 rounded-lg border text-xs ${
                  isLightMode
                    ? 'bg-white border-slate-300 text-slate-900'
                    : 'bg-slate-900 border-slate-700 text-white'
                }`}
              />
              <input
                type="number"
                min="0"
                step="10"
                value={newClientBalance}
                onChange={(e) => setNewClientBalance(e.target.value)}
                placeholder="Saldo Inicial (R$)"
                className={`px-3 py-2 rounded-lg border text-xs font-mono tabular-nums ${
                  isLightMode
                    ? 'bg-white border-slate-300 text-slate-900'
                    : 'bg-slate-900 border-slate-700 text-white'
                }`}
              />
              <button
                type="submit"
                className="py-2 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs uppercase"
              >
                Criar & Liberar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   4. OFFICIAL THERMAL RECEIPT MODAL (Comprovante Oficial / Código PIN)
   ============================================================================ */
interface TicketReceiptModalProps {
  ticket: TicketReceipt | null;
  matches: Match[];
  onClose: () => void;
}

export const TicketReceiptModal: React.FC<TicketReceiptModalProps> = ({
  ticket,
  matches,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!ticket) return null;

  const matchesById = new Map<number, Match>(matches.map((m) => [m.id, m]));

  const handleCopyPin = () => {
    navigator.clipboard?.writeText(ticket.pin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWhatsApp = () => {
    const text = buildWhatsAppTicketMessage(ticket, matchesById);
    window.open(
      `https://wa.me/${CAMBISTA_WHATSAPP}?text=${encodeURIComponent(text)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-[#FFFDF7] text-slate-900 shadow-2xl border-2 border-amber-400 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Thermal Receipt Top Banner */}
        <div className="bg-slate-950 text-white px-6 py-4 flex items-center justify-between border-b-2 border-dashed border-amber-400">
          <div className="flex items-center gap-3">
            <img
              src="/logo-365dabarra.png"
              alt="365 DA BARRA"
              className="w-10 h-10 rounded-lg object-contain bg-slate-900 p-1 border border-amber-400/40"
            />
            <div>
              <h3 className="font-black text-sm tracking-wider text-amber-400">
                365 DA BARRA • OFICIAL
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                COMPROVANTE DE APOSTA ESPORTIVA
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white"
            aria-label="Fechar comprovante"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thermal Receipt Body */}
        <div className="p-6 space-y-4 font-mono text-xs">
          {/* PIN Highlight Box */}
          <div className="p-4 rounded-xl bg-slate-950 text-white text-center border border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 block">
              CÓDIGO PIN DO BILHETE
            </span>
            <div className="text-3xl font-black tracking-widest text-emerald-400 tabular-nums my-1">
              {ticket.pin}
            </div>
            <span
              className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                ticket.status === 'VALIDADO'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-amber-400 text-slate-950'
              }`}
            >
              {ticket.status}
            </span>
          </div>

          <div className="flex justify-between text-[11px] text-slate-600 border-b border-dashed border-slate-300 pb-2">
            <span>APOSTADOR: <strong>{ticket.clientName}</strong></span>
            <span className="tabular-nums">{ticket.createdAt}</span>
          </div>

          {/* Selections List */}
          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
            {ticket.selections.map((sel, idx) => {
              const m = matchesById.get(sel.matchId);
              const matchName = m ? `${m.teamA} x ${m.teamB}` : `Jogo #${sel.matchId}`;
              return (
                <div
                  key={`${sel.matchId}-${idx}`}
                  className="p-2.5 rounded-lg bg-slate-100 border border-slate-200"
                >
                  <div className="font-bold text-slate-900 text-xs">
                    {idx + 1}. {matchName}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-600 mt-1">
                    <span>
                      {sel.marketName}: <strong className="text-slate-900">{sel.selection}</strong>
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-black tabular-nums">
                      @{sel.oddValue.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Financial Totals */}
          <div className="border-t-2 border-dashed border-slate-300 pt-3 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-600">COTAÇÃO TOTAL (ODD):</span>
              <strong className="tabular-nums text-slate-900">{ticket.totalOdd.toFixed(2)}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">VALOR APOSTADO:</span>
              <strong className="tabular-nums text-slate-900">{formatBRL(ticket.stake)}</strong>
            </div>
            <div className="flex justify-between text-sm font-black pt-1 border-t border-slate-200">
              <span className="text-emerald-700">RETORNO POTENCIAL:</span>
              <span className="tabular-nums text-emerald-700">{formatBRL(ticket.payout)}</span>
            </div>
          </div>

          {/* Barcode Graphic */}
          <div className="flex items-center justify-center gap-2 py-2 text-slate-400">
            <QrCode className="w-5 h-5" />
            <span className="tracking-[0.3em] text-[10px] font-bold">
              ||| |||| || ||||| ||| {ticket.pin} ||||
            </span>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2 font-sans">
            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Enviar Bilhete p/ WhatsApp (14) 99195-1381</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleCopyPin}
                className="py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'PIN Copiado!' : 'Copiar PIN'}</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
