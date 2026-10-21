import { SoundEventType } from '../types/sportsbook';

export interface SoundToneStep {
  frequency: number;
  startTimeOffset: number; // seconds
  duration: number; // seconds
  type: OscillatorType;
  peakGain: number;
  harmonicFrequency?: number;
}

export interface SoundProfile {
  id: SoundEventType;
  label: string;
  description: string;
  filterCutoffHz: number;
  steps: SoundToneStep[];
}

export const SOUND_PROFILES: Record<SoundEventType, SoundProfile> = {
  bet_validated: {
    id: 'bet_validated',
    label: 'Aposta Validada',
    description: 'Acorde harmônico suave confirmando validação de bilhete ou PIN',
    filterCutoffHz: 2600,
    steps: [
      {
        frequency: 523.25, // C5
        startTimeOffset: 0,
        duration: 0.18,
        type: 'sine',
        peakGain: 0.09,
        harmonicFrequency: 1046.5,
      },
      {
        frequency: 659.25, // E5
        startTimeOffset: 0.09,
        duration: 0.22,
        type: 'sine',
        peakGain: 0.1,
      },
      {
        frequency: 783.99, // G5
        startTimeOffset: 0.18,
        duration: 0.36,
        type: 'triangle',
        peakGain: 0.11,
        harmonicFrequency: 1567.98,
      },
    ],
  },
  withdrawal_approved: {
    id: 'withdrawal_approved',
    label: 'Saque / Saldo Aprovado',
    description: 'Arpejo ascendente cristalino para saque PIX aprovado ou saldo creditado',
    filterCutoffHz: 2800,
    steps: [
      {
        frequency: 587.33, // D5
        startTimeOffset: 0,
        duration: 0.16,
        type: 'sine',
        peakGain: 0.085,
      },
      {
        frequency: 739.99, // F#5
        startTimeOffset: 0.08,
        duration: 0.18,
        type: 'sine',
        peakGain: 0.095,
      },
      {
        frequency: 880.0, // A5
        startTimeOffset: 0.16,
        duration: 0.22,
        type: 'triangle',
        peakGain: 0.1,
      },
      {
        frequency: 1174.66, // D6
        startTimeOffset: 0.25,
        duration: 0.42,
        type: 'sine',
        peakGain: 0.11,
        harmonicFrequency: 587.33,
      },
    ],
  },
  admin_notification: {
    id: 'admin_notification',
    label: 'Notificação do Admin',
    description: 'Toque duplo suave de sino para nova solicitação de saldo, saque ou pré-bilhete PIN',
    filterCutoffHz: 2200,
    steps: [
      {
        frequency: 659.25, // E5
        startTimeOffset: 0,
        duration: 0.2,
        type: 'sine',
        peakGain: 0.09,
      },
      {
        frequency: 987.77, // B5
        startTimeOffset: 0.13,
        duration: 0.34,
        type: 'sine',
        peakGain: 0.1,
        harmonicFrequency: 493.88,
      },
    ],
  },
  selection_added: {
    id: 'selection_added',
    label: 'Palpite no Cupom',
    description: 'Pulso acústico sutil ao selecionar ou trocar uma cotação',
    filterCutoffHz: 1800,
    steps: [
      {
        frequency: 440.0, // A4
        startTimeOffset: 0,
        duration: 0.07,
        type: 'sine',
        peakGain: 0.045,
      },
      {
        frequency: 554.37, // C#5
        startTimeOffset: 0.035,
        duration: 0.09,
        type: 'sine',
        peakGain: 0.05,
      },
    ],
  },
  error_alert: {
    id: 'error_alert',
    label: 'Aviso de Regra / Limite',
    description: 'Tom grave suave indicando limite atingido ou saldo insuficiente',
    filterCutoffHz: 1400,
    steps: [
      {
        frequency: 349.23, // F4
        startTimeOffset: 0,
        duration: 0.16,
        type: 'triangle',
        peakGain: 0.07,
      },
      {
        frequency: 293.66, // D4
        startTimeOffset: 0.12,
        duration: 0.24,
        type: 'triangle',
        peakGain: 0.075,
      },
    ],
  },
};

export function getSoundProfile(event: SoundEventType): SoundProfile {
  return SOUND_PROFILES[event] || SOUND_PROFILES.admin_notification;
}

let sharedAudioCtx: AudioContext | null = null;

function getOrCreateAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    sharedAudioCtx = new AudioCtx();
  }
  return sharedAudioCtx;
}

export function playSoftAlertSound(
  event: SoundEventType,
  options: { muted?: boolean; volumeMultiplier?: number } = {}
): boolean {
  const { muted = false, volumeMultiplier = 1 } = options;
  if (muted || volumeMultiplier <= 0) {
    return false;
  }

  const profile = getSoundProfile(event);

  if (typeof window !== 'undefined') {
    (window as unknown as Record<string, unknown>).__lastPlayedSoundEvent = {
      event: profile.id,
      label: profile.label,
      timestamp: Date.now(),
    };
  }

  try {
    const ctx = getOrCreateAudioContext();
    if (!ctx) return false;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Master low-pass filter to keep all tones warm, rounded, and soft
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(profile.filterCutoffHz, now);
    filter.Q.setValueAtTime(0.7, now);
    filter.connect(ctx.destination);

    profile.steps.forEach((step) => {
      const start = now + step.startTimeOffset;
      const stop = start + step.duration;
      const attackTime = Math.min(0.018, step.duration * 0.2);
      const targetGain = Math.max(0.001, Math.min(0.25, step.peakGain * volumeMultiplier));

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = step.type;
      osc.frequency.setValueAtTime(step.frequency, start);

      // Soft envelope: zero -> smooth linear attack -> exponential decay
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(targetGain, start + attackTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, stop);

      osc.connect(gain);
      gain.connect(filter);

      osc.start(start);
      osc.stop(stop + 0.01);

      // Optional subtle harmonic overtone for bell richness
      if (step.harmonicFrequency) {
        const harmOsc = ctx.createOscillator();
        const harmGain = ctx.createGain();
        harmOsc.type = 'sine';
        harmOsc.frequency.setValueAtTime(step.harmonicFrequency, start);

        harmGain.gain.setValueAtTime(0.0001, start);
        harmGain.gain.linearRampToValueAtTime(targetGain * 0.28, start + attackTime);
        harmGain.gain.exponentialRampToValueAtTime(0.0001, stop);

        harmOsc.connect(harmGain);
        harmGain.connect(filter);

        harmOsc.start(start);
        harmOsc.stop(stop + 0.01);
      }
    });

    return true;
  } catch {
    return false;
  }
}
