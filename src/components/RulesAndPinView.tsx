import React, { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileText,
  MessageCircle,
  Receipt,
  Search,
  ShieldAlert,
  Ticket,
} from 'lucide-react';
import { Match, TicketReceipt } from '../types/sportsbook';
import {
  buildWhatsAppTicketMessage,
  formatCurrencyBR,
  formatOddBR,
} from '../utils/bettingRules';
import { CAMBISTA_PHONE_DISPLAY, CAMBISTA_WHATSAPP } from '../data/initialData';

interface RulesAndPinViewProps {
  placedTickets: TicketReceipt[];
  matches: Match[];
  isLightMode: boolean;
  onBack: () => void;
  onOpenReceiptModal: (pin: string) => void;
}

export const RulesAndPinView: React.FC<RulesAndPinViewProps> = ({
  placedTickets,
  matches,
  isLightMode,
  onBack,
  onOpenReceiptModal,
}) => {
  const [pinQuery, setPinQuery] = useState<string>('');
  const [searchedPin, setSearchedPin] = useState<string | null>(null);

  const handleCheckPin = (e?: React.FormEvent, overridePin?: string) => {
    if (e) e.preventDefault();
    const target = (overridePin !== undefined ? overridePin : pinQuery).trim();
    if (overridePin !== undefined) setPinQuery(overridePin);
    setSearchedPin(target);
  };

  const foundTicket = searchedPin
    ? placedTickets.find((t) => t.pin.toLowerCase() === searchedPin.toLowerCase())
    : null;

  const handleShareWhatsApp = (ticket: TicketReceipt) => {
    const msg = buildWhatsAppTicketMessage(ticket, matches);
    window.open(
      `https://api.whatsapp.com/send?phone=${CAMBISTA_WHATSAPP}&text=${encodeURIComponent(msg)}`,
      '_blank'
    );
  };

  return (
    <div className="space-y-5">
      {/* Top Bar */}
      <div
        className={`rounded-2xl p-4 border flex items-center justify-between gap-3 ${
          isLightMode
            ? 'bg-white border-slate-200 shadow-2xs'
            : 'bg-[#14192B] border-slate-800/90'
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="px-3.5 py-2 min-h-[38px] rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <span>Voltar aos Jogos</span>
          </button>
          <div>
            <h1 className="font-display font-bold text-base sm:text-lg">
              Conferir Bilhete (PIN) & Regulamento Oficial
            </h1>
            <p className="text-xs text-slate-400">
              Consulte o status de qualquer bilhete ou pré-bilhete emitido na 365 DA BARRA
            </p>
          </div>
        </div>
      </div>

      {/* PIN Checker Card */}
      <section
        className={`rounded-2xl p-5 border space-y-4 ${
          isLightMode
            ? 'bg-white border-slate-200 shadow-2xs'
            : 'bg-[#14192B] border-slate-800/90'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-display font-bold text-base flex items-center gap-2">
              <Ticket className="w-5 h-5 text-amber-400" />
              <span>Conferir Bilhete pelo Código PIN</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Digite o código PIN de 6 dígitos (ex: 729-304) ou clique em um dos bilhetes recentes
            </p>
          </div>

          {placedTickets.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              <span className="text-slate-400">Testar PIN:</span>
              {placedTickets.slice(0, 3).map((t) => (
                <button
                  key={t.pin}
                  type="button"
                  onClick={() => handleCheckPin(undefined, t.pin)}
                  className="px-2.5 py-1 rounded-lg bg-amber-400/15 hover:bg-amber-400/25 text-amber-400 border border-amber-400/30 font-mono font-bold text-xs cursor-pointer"
                >
                  {t.pin}
                </button>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={(e) => handleCheckPin(e)} className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="text"
            value={pinQuery}
            onChange={(e) => setPinQuery(e.target.value)}
            aria-label="Código PIN do bilhete"
            placeholder="Digite o código PIN do bilhete (ex: 729-304)"
            className={`flex-1 px-4 py-2.5 min-h-[44px] rounded-xl border font-mono text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 ${
              isLightMode
                ? 'bg-slate-50 border-slate-300 text-slate-900'
                : 'bg-[#0C101D] border-slate-700 text-white'
            }`}
          />
          <button
            type="submit"
            className="px-6 py-2.5 min-h-[44px] rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-display font-bold text-sm transition-colors flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
          >
            <Search className="w-4 h-4 shrink-0" />
            <span>Consultar Bilhete</span>
          </button>
        </form>

        {/* Search Result Display */}
        {searchedPin !== null && (
          <div className="pt-2">
            {!searchedPin ? (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                Digite um código PIN válido para consultar o bilhete.
              </div>
            ) : !foundTicket ? (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                Nenhum bilhete encontrado com o código PIN <strong>{searchedPin}</strong>. Verifique o código e tente novamente.
              </div>
            ) : (
              <div
                className={`p-5 rounded-2xl border-2 space-y-4 ${
                  foundTicket.status === 'VALIDADO'
                    ? 'border-emerald-500/60 bg-emerald-950/15'
                    : 'border-amber-400/60 bg-amber-950/15'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-xs text-slate-400">Código PIN Oficial</span>
                    <div className="font-mono font-black text-xl text-amber-400 tabular-nums">
                      {foundTicket.pin}
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
                      foundTicket.status === 'VALIDADO'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-amber-400/20 text-amber-300'
                    }`}
                  >
                    {foundTicket.status === 'VALIDADO' ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                    <span>{foundTicket.status}</span>
                  </span>
                </div>

                <div className="text-xs text-slate-300">
                  Apostador: <strong>{foundTicket.clientName}</strong> · Emitido em{' '}
                  {foundTicket.createdAt}
                </div>

                <div
                  className={`p-3.5 rounded-xl border space-y-2 text-xs ${
                    isLightMode
                      ? 'bg-slate-50 border-slate-200'
                      : 'bg-[#0C101D] border-slate-800'
                  }`}
                >
                  {foundTicket.selections.map((s, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 py-1 border-b last:border-b-0 border-slate-800/40"
                    >
                      <div>
                        <strong className="text-amber-400">
                          {idx + 1}. {s.selection}
                        </strong>
                        <span className="text-slate-400 ml-2">· {s.marketName}</span>
                      </div>
                      <span className="font-mono font-bold tabular-nums">
                        @{formatOddBR(s.oddValue)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
                  <span className="font-mono tabular-nums">
                    Valor Apostado: <strong>R$ {formatCurrencyBR(foundTicket.stake)}</strong> ·
                    Cotação Total: <strong>{formatOddBR(foundTicket.totalOdd)}</strong>
                  </span>
                  <span className="font-mono text-base font-extrabold text-emerald-400 tabular-nums">
                    Possível Retorno: R$ {formatCurrencyBR(foundTicket.payout)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => onOpenReceiptModal(foundTicket.pin)}
                    className="py-2.5 px-4 min-h-[42px] rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Receipt className="w-4 h-4" />
                    <span>Abrir Comprovante Térmico</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleShareWhatsApp(foundTicket)}
                    className="py-2.5 px-4 min-h-[42px] rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Enviar ao Cambista {CAMBISTA_PHONE_DISPLAY}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Official Sportsbook Rules */}
      <section
        className={`rounded-2xl p-6 border space-y-4 ${
          isLightMode
            ? 'bg-white border-slate-200 shadow-2xs'
            : 'bg-[#14192B] border-slate-800/90'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <FileText className="w-5 h-5 text-amber-400" />
          <h2 className="font-display font-bold text-base">
            Regulamento Geral de Apostas • 365 DA BARRA
          </h2>
        </div>

        <div
          className={`space-y-3 text-xs sm:text-sm leading-relaxed ${
            isLightMode ? 'text-slate-600' : 'text-slate-300'
          }`}
        >
          <p>
            <strong>1. Seleção Única por Partida (Bloqueio de Correlação):</strong> Não é
            permitido combinar duas ou mais opções da mesma partida em um mesmo bilhete
            simples ou múltiplo. Caso selecione outra cotação do mesmo jogo, o sistema
            substituirá automaticamente a seleção anterior daquela partida.
          </p>
          <p>
            <strong>2. Tempo Regulamentar (90 Minutos):</strong> Todas as apostas de
            futebol consideram apenas o tempo regulamentar de 90 minutos mais os
            acréscimos definidos pelo árbitro. Prorrogação e disputa de pênaltis não são
            consideradas, salvo indicação explícita no mercado.
          </p>
          <p>
            <strong>3. Cadastro de Usuário e Liberação de Créditos pelo Admin:</strong> O
            apostador pode criar sua conta gratuitamente, porém não realiza depósitos
            automáticos na plataforma. Todo saldo de jogo é liberado exclusivamente pelo
            Administrador/Cambista da banca, ou o cliente pode emitir um{' '}
            <strong>Pré-Bilhete com Código PIN</strong> para validação direta.
          </p>
          <p>
            <strong>4. Limites Oficiais da Banca:</strong> Valor mínimo por aposta:{' '}
            <strong className="font-mono">R$ 2,00</strong> · Valor máximo por aposta:{' '}
            <strong className="font-mono">R$ 5.000,00</strong> · Prêmio/Retorno máximo por
            bilhete: <strong className="font-mono text-amber-400">R$ 30.000,00</strong> ·
            Máximo de 20 jogos por bilhete múltiplo.
          </p>
          <p>
            <strong>5. Partidas Adiadas ou Canceladas:</strong> Caso uma partida seja
            adiada ou interrompida e não seja retomada em até 48 horas, a cotação daquele
            evento específico no bilhete múltiplo será recalculada como{' '}
            <strong className="font-mono">1,00</strong> (anulada), mantendo-se válidas as
            demais seleções do bilhete.
          </p>
        </div>
      </section>
    </div>
  );
};
