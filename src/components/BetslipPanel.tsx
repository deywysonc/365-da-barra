import React from 'react';
import {
  CheckCircle2,
  QrCode,
  Receipt,
  Ticket,
  Trash2,
  UserCheck,
  UserPlus,
  X,
} from 'lucide-react';
import {
  BetSelection,
  ClientAccount,
  Match,
  TicketReceipt,
} from '../types/sportsbook';
import {
  calculateBetslipTotals,
  formatCurrencyBR,
  formatOddBR,
} from '../utils/bettingRules';

interface BetslipPanelProps {
  betslip: BetSelection[];
  placedTickets: TicketReceipt[];
  matches: Match[];
  clients: ClientAccount[];
  activeClient: ClientAccount;
  activeTab: 'slip' | 'history';
  stakeAmount: number;
  isLightMode: boolean;
  isOpenMobile: boolean;
  onSwitchTab: (tab: 'slip' | 'history') => void;
  onSelectClient: (clientId: number) => void;
  onOpenNewClient: () => void;
  onStakeChange: (val: number) => void;
  onRemoveBet: (matchId: number) => void;
  onClearSlip: () => void;
  onPlaceBet: (asPreTicketPinOnly: boolean) => void;
  onOpenReceipt: (pin: string) => void;
  onCloseMobile: () => void;
}

export const BetslipPanel: React.FC<BetslipPanelProps> = ({
  betslip,
  placedTickets,
  matches,
  clients,
  activeClient,
  activeTab,
  stakeAmount,
  isLightMode,
  isOpenMobile,
  onSwitchTab,
  onSelectClient,
  onOpenNewClient,
  onStakeChange,
  onRemoveBet,
  onClearSlip,
  onPlaceBet,
  onOpenReceipt,
  onCloseMobile,
}) => {
  const totals = calculateBetslipTotals(betslip, stakeAmount);

  const handleQuickStake = (deltaOrMax: number | 'MAX') => {
    if (deltaOrMax === 'MAX') {
      const maxVal = activeClient.balance >= 2 ? activeClient.balance : 100;
      onStakeChange(Math.min(5000, maxVal));
    } else {
      onStakeChange(Math.min(5000, +(Number(stakeAmount || 0) + deltaOrMax).toFixed(2)));
    }
  };

  const panelBody = (
    <div
      className={`flex flex-col h-full select-none ${
        isLightMode
          ? 'bg-white border-l border-slate-200 text-slate-900'
          : 'bg-[#101424] border-l border-slate-800/90 text-slate-100'
      }`}
    >
      {/* Top Tabs Header */}
      <div
        className={`flex items-center justify-between px-3.5 py-2.5 border-b ${
          isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-[#181236] border-slate-800'
        }`}
      >
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onSwitchTab('slip')}
            className={`px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'slip'
                ? 'bg-amber-400 text-slate-950 shadow-2xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Receipt className="w-3.5 h-3.5 shrink-0" />
            <span>Cupom</span>
            <span className="font-mono tabular-nums">({betslip.length})</span>
          </button>

          <button
            type="button"
            onClick={() => onSwitchTab('history')}
            className={`px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'history'
                ? 'bg-amber-400 text-slate-950 shadow-2xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Ticket className="w-3.5 h-3.5 shrink-0" />
            <span>Bilhetes / PIN</span>
            <span className="font-mono tabular-nums">({placedTickets.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-1">
          {betslip.length > 0 && activeTab === 'slip' && (
            <button
              type="button"
              onClick={onClearSlip}
              title="Limpar todas as seleções do cupom"
              aria-label="Limpar cupom"
              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800/40 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Fechar cupom"
            className="xl:hidden p-2 rounded-lg text-slate-300 hover:bg-slate-800/40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Active Bettor Bar */}
      <div
        className={`px-3.5 py-2.5 border-b flex items-center justify-between gap-2 ${
          isLightMode ? 'bg-slate-100/70 border-slate-200' : 'bg-[#14192B] border-slate-800/80'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <UserCheck className="w-4 h-4 text-amber-400 shrink-0" />
          <select
            aria-label="Selecionar apostador ativo"
            value={activeClient.id}
            onChange={(e) => onSelectClient(Number(e.target.value))}
            className={`w-full text-xs font-semibold rounded-lg px-2 py-1.5 border truncate focus:outline-none focus:ring-2 focus:ring-amber-400 ${
              isLightMode
                ? 'bg-white border-slate-200 text-slate-800'
                : 'bg-[#0C101D] border-slate-700 text-slate-100'
            }`}
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} — R$ {formatCurrencyBR(c.balance)}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={onOpenNewClient}
          className="px-2.5 py-1.5 min-h-[32px] rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-1 shrink-0 cursor-pointer"
        >
          <UserPlus className="w-3.5 h-3.5 shrink-0" />
          <span>Novo</span>
        </button>
      </div>

      {/* Main Scrollable Area */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5">
        {activeTab === 'slip' ? (
          betslip.length === 0 ? (
            <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-center px-4 py-8">
              <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/25 flex items-center justify-center text-amber-400 mb-3">
                <Ticket className="w-6 h-6" />
              </div>
              <div className="font-display font-bold text-sm mb-1">
                Cupom de Apostas Vazio
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-[230px]">
                Clique nas cotações (Casa, Empate ou Fora) para montar seu bilhete simples ou múltiplo na{' '}
                <strong className="text-amber-400">365 DA BARRA</strong>.
              </p>
              <span className="mt-3 text-[11px] text-slate-500">
                Regra: 1 opção por partida · Mín. R$ 2,00
              </span>
            </div>
          ) : (
            betslip.map((item) => {
              const m = matches.find((x) => x.id === item.matchId);
              return (
                <div
                  key={`${item.matchId}-${item.selection}`}
                  className={`p-3 rounded-xl border transition-colors ${
                    isLightMode
                      ? 'bg-slate-50 border-slate-200'
                      : 'bg-[#161C30] border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-display font-bold text-xs text-amber-400 truncate">
                        {item.selection}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">
                        {item.marketName}
                      </div>
                      {m && (
                        <div className="text-[11px] font-medium text-slate-300 truncate mt-0.5">
                          {m.teamA} x {m.teamB}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2 py-1 rounded-lg bg-indigo-950/80 border border-indigo-500/30 font-mono font-extrabold text-xs text-amber-400 tabular-nums">
                        {formatOddBR(item.oddValue)}
                      </span>
                      <button
                        type="button"
                        onClick={() => onRemoveBet(item.matchId)}
                        aria-label={`Remover ${item.selection}`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800/50 transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )
        ) : (
          /* History / PIN Tab */
          <div className="space-y-3">
            {placedTickets.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">
                Nenhum bilhete emitido ainda.
              </p>
            ) : (
              placedTickets.map((t) => {
                const isValidated = t.status === 'VALIDADO';
                return (
                  <div
                    key={t.pin}
                    onClick={() => onOpenReceipt(t.pin)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') onOpenReceipt(t.pin);
                    }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all hover:border-amber-400/60 ${
                      isLightMode
                        ? 'bg-slate-50 border-slate-200'
                        : 'bg-[#161C30] border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="font-mono font-extrabold text-xs text-amber-400 tabular-nums">
                        PIN: {t.pin}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          isValidated
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : 'bg-amber-500/15 text-amber-300'
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-300 space-y-0.5">
                      {t.selections.map((s, i) => (
                        <div key={i} className="truncate">
                          {i + 1}. {s.selection} (@{formatOddBR(s.oddValue)})
                        </div>
                      ))}
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-mono tabular-nums">
                        R$ {formatCurrencyBR(t.stake)} · Odd {formatOddBR(t.totalOdd)}
                      </span>
                      <span className="font-mono font-bold text-emerald-400 tabular-nums">
                        R$ {formatCurrencyBR(t.payout)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Footer Totals & Bet Submission Controls */}
      {activeTab === 'slip' && (
        <div
          className={`p-3.5 border-t space-y-3 ${
            isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-[#14192B] border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Modalidade do Bilhete:</span>
            <span className="font-semibold">{totals.modalityLabel}</span>
          </div>

          <div
            className={`p-3 rounded-xl border grid grid-cols-2 gap-2 ${
              isLightMode
                ? 'bg-white border-slate-200'
                : 'bg-[#0C101D] border-slate-800'
            }`}
          >
            <div>
              <div className="text-[11px] text-slate-400">Cotação Total</div>
              <div className="font-mono font-extrabold text-base text-amber-400 tabular-nums">
                {formatOddBR(totals.totalOdd)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-slate-400">Possível Retorno</div>
              <div className="font-mono font-extrabold text-base text-emerald-400 tabular-nums">
                R$ {formatCurrencyBR(totals.payout)}
              </div>
            </div>
          </div>

          {/* Stake Input & Quick Stakes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="stake-amount-input"
                className="text-xs font-semibold text-slate-300"
              >
                Valor da Aposta (R$)
              </label>
              <input
                id="stake-amount-input"
                type="number"
                min={2}
                max={5000}
                step="1"
                value={stakeAmount}
                onChange={(e) => onStakeChange(Number(e.target.value))}
                className={`w-28 px-3 py-1.5 min-h-[38px] rounded-xl border font-mono font-bold text-sm text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                  isLightMode
                    ? 'bg-white border-slate-300 text-slate-900'
                    : 'bg-[#090C16] border-slate-700 text-white'
                }`}
              />
            </div>

            <div className="grid grid-cols-5 gap-1.5">
              {[
                { label: '+R$ 10', val: 10 },
                { label: '+R$ 25', val: 25 },
                { label: '+R$ 50', val: 50 },
                { label: '+R$ 100', val: 100 },
                { label: 'TUDO', val: 'MAX' as const },
              ].map((q) => (
                <button
                  key={q.label}
                  type="button"
                  onClick={() => handleQuickStake(q.val)}
                  className={`py-1.5 min-h-[34px] rounded-lg border text-[11px] font-mono font-bold transition-colors cursor-pointer ${
                    isLightMode
                      ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                      : 'bg-[#0C101D] hover:bg-slate-800 border-slate-800 text-slate-300'
                  }`}
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dual Submit Buttons */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={() => onPlaceBet(false)}
              className="w-full py-3 min-h-[44px] rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Finalizar com Saldo Liberado</span>
            </button>

            <button
              type="button"
              onClick={() => onPlaceBet(true)}
              className="w-full py-2.5 min-h-[42px] rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-display font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <QrCode className="w-4 h-4 shrink-0" />
              <span>Gerar Pré-Bilhete (Código PIN)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Right Betslip Column */}
      <aside className="hidden xl:block w-[340px] shrink-0 h-[calc(100vh-3.5rem)] sticky top-14">
        {panelBody}
      </aside>

      {/* Mobile & Tablet Slide-Up Betslip Sheet */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 xl:hidden flex flex-col justify-end">
          <div
            className="fixed inset-0 bg-black/65 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 w-full max-h-[88vh] rounded-t-3xl overflow-hidden shadow-2xl flex flex-col">
            {panelBody}
          </div>
        </div>
      )}
    </>
  );
};
