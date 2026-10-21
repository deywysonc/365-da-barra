import test from 'node:test';
import assert from 'node:assert/strict';
import {
  toggleBetSelection,
  calculateBetslipTotals,
  validateBetPlacement,
  computeRealOddsFromRecords,
  DEFAULT_HOUSE_RULES,
} from './bettingRules';
import { getSoundProfile, playSoftAlertSound } from './soundEffects';
import { BetSelection } from '../types/sportsbook';

test('toggleBetSelection adds a new selection and removes it when clicked again', () => {
  const sel1: BetSelection = {
    matchId: 401915401,
    selection: 'Vitória (Casa)',
    oddValue: 2.85,
    marketName: 'Vencedor do Encontro',
  };

  const added = toggleBetSelection([], sel1);
  assert.equal(added.action, 'added');
  assert.equal(added.updatedSlip.length, 1);
  assert.equal(added.updatedSlip[0].selection, 'Vitória (Casa)');

  const removed = toggleBetSelection(added.updatedSlip, sel1);
  assert.equal(removed.action, 'removed');
  assert.equal(removed.updatedSlip.length, 0);
});

test('toggleBetSelection enforces 1-option-per-match correlation rule by replacing same-match selection', () => {
  const selHome: BetSelection = {
    matchId: 401915401,
    selection: 'Vitória (Casa)',
    oddValue: 2.85,
    marketName: 'Vencedor do Encontro',
  };
  const selAway: BetSelection = {
    matchId: 401915401,
    selection: 'Corinthians (Fora)',
    oddValue: 2.6,
    marketName: 'Vencedor do Encontro',
  };

  const step1 = toggleBetSelection([], selHome);
  const step2 = toggleBetSelection(step1.updatedSlip, selAway);

  assert.equal(step2.action, 'replaced');
  assert.equal(step2.updatedSlip.length, 1);
  assert.equal(step2.updatedSlip[0].selection, 'Corinthians (Fora)');
  assert.equal(step2.updatedSlip[0].oddValue, 2.6);
});

test('calculateBetslipTotals computes combined odds, modality label, and caps payout at R$ 30.000,00', () => {
  const slip: BetSelection[] = [
    { matchId: 1, selection: 'Corinthians (Fora)', oddValue: 2.6, marketName: '1x2' },
    { matchId: 2, selection: 'Nottingham Forest (Casa)', oddValue: 2.4, marketName: '1x2' },
  ];

  const totals = calculateBetslipTotals(slip, 50, DEFAULT_HOUSE_RULES);
  assert.equal(totals.count, 2);
  assert.equal(totals.totalOdd, 6.24);
  assert.equal(totals.payout, 312.0);
  assert.equal(totals.isCapped, false);
  assert.equal(totals.modalityLabel, 'Bilhete Duplo (2 Jogos)');

  // High stake that exceeds 30,000 cap
  const cappedTotals = calculateBetslipTotals(slip, 5000, DEFAULT_HOUSE_RULES);
  assert.equal(cappedTotals.rawReturn, 31200.0);
  assert.equal(cappedTotals.payout, 30000.0);
  assert.equal(cappedTotals.isCapped, true);
});

test('validateBetPlacement validates minimum stake, maximum stake, and balance', () => {
  const slip: BetSelection[] = [
    { matchId: 1, selection: 'Flamengo (Casa)', oddValue: 2.25, marketName: '1x2' },
  ];

  // Empty slip
  assert.equal(validateBetPlacement([], 20, 450, false).valid, false);

  // Stake below minimum (R$ 2,00)
  assert.equal(validateBetPlacement(slip, 1.5, 450, false).valid, false);

  // Stake above balance for direct wallet bet
  assert.equal(validateBetPlacement(slip, 500, 450, false).valid, false);

  // Stake above balance ALLOWED when generating Pre-Ticket PIN for Cambista
  assert.equal(validateBetPlacement(slip, 500, 0, true).valid, true);

  // Valid wallet bet
  assert.equal(validateBetPlacement(slip, 50, 450, false).valid, true);
});

test('computeRealOddsFromRecords returns valid bounded 1X2 odds', () => {
  const odds = computeRealOddsFromRecords('15-6-7', '16-6-6', 0, 0, false);
  assert.ok(odds.odd1 >= 1.12 && odds.odd1 <= 15.0);
  assert.ok(odds.oddX >= 1.8 && odds.oddX <= 11.0);
  assert.ok(odds.odd2 >= 1.12 && odds.odd2 <= 17.0);
});

test('getSoundProfile returns soft harmonic profiles for bet_validated, withdrawal_approved, and admin_notification', () => {
  const betProfile = getSoundProfile('bet_validated');
  const withdrawalProfile = getSoundProfile('withdrawal_approved');
  const adminProfile = getSoundProfile('admin_notification');

  assert.equal(betProfile.id, 'bet_validated');
  assert.ok(betProfile.steps.length >= 3);
  assert.ok(betProfile.steps[2].frequency > betProfile.steps[0].frequency);

  assert.equal(withdrawalProfile.id, 'withdrawal_approved');
  assert.ok(withdrawalProfile.steps.length >= 4);
  assert.ok(withdrawalProfile.steps[3].frequency > withdrawalProfile.steps[0].frequency);

  assert.equal(adminProfile.id, 'admin_notification');
  assert.ok(adminProfile.steps.every((s) => s.peakGain <= 0.15));

  // Verify muted call returns false cleanly
  assert.equal(playSoftAlertSound('bet_validated', { muted: true }), false);
});

