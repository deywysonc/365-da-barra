import React, { useState } from 'react';
import { Shield, Trophy, Tv } from 'lucide-react';

interface TeamCrestProps {
  logoUrl?: string;
  teamName: string;
  shortName: string;
  primaryColor?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const TeamCrest: React.FC<TeamCrestProps> = ({
  logoUrl,
  teamName,
  shortName,
  primaryColor = '#10b981',
  size = 'md',
}) => {
  const [imgError, setImgError] = useState(false);

  const sizeMap = {
    sm: 'w-6 h-6 text-[9px] p-0.5',
    md: 'w-8 h-8 text-[10px] p-1',
    lg: 'w-11 h-11 text-xs p-1.5',
    xl: 'w-14 h-14 text-sm p-2',
  };

  if (!logoUrl || imgError) {
    return (
      <div
        className={`${sizeMap[size]} rounded-full flex items-center justify-center font-display font-bold text-white shrink-0 shadow-sm ring-1 ring-white/20`}
        style={{ backgroundColor: primaryColor }}
        title={teamName}
      >
        {shortName.slice(0, 3).toUpperCase()}
      </div>
    );
  }

  return (
    <div
      className={`${sizeMap[size]} rounded-full bg-white/95 dark:bg-slate-100 flex items-center justify-center shrink-0 shadow-sm ring-1 ring-slate-200/80 overflow-hidden`}
      title={teamName}
    >
      <img
        src={logoUrl}
        alt={teamName}
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
        className="w-full h-full object-contain"
      />
    </div>
  );
};

interface EditorialCoverProps {
  imageUrl?: string;
  leagueLabel: string;
  headline: string;
  hasVideo?: boolean;
  className?: string;
}

export const EditorialCover: React.FC<EditorialCoverProps> = ({
  imageUrl,
  leagueLabel,
  headline,
  hasVideo,
  className = 'h-48',
}) => {
  const [imgError, setImgError] = useState(false);

  const isChampions = leagueLabel.toLowerCase().includes('champions');
  const isLibertadores = leagueLabel.toLowerCase().includes('libertadores');
  const isPremier = leagueLabel.toLowerCase().includes('premier');

  const gradientClass = isChampions
    ? 'from-indigo-950 via-blue-900 to-slate-950'
    : isLibertadores
    ? 'from-amber-950 via-stone-900 to-emerald-950'
    : isPremier
    ? 'from-purple-950 via-fuchsia-950 to-slate-950'
    : 'from-emerald-950 via-teal-900 to-slate-950';

  return (
    <div className={`relative w-full overflow-hidden bg-slate-950 ${className}`}>
      {imageUrl && !imgError ? (
        <img
          src={imageUrl}
          alt={headline}
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <div
          className={`w-full h-full bg-gradient-to-br ${gradientClass} flex flex-col items-center justify-center p-6 relative overflow-hidden`}
        >
          {/* Subtle architectural stadium pitch lines */}
          <svg
            viewBox="0 0 400 220"
            className="absolute inset-0 w-full h-full opacity-15 pointer-events-none"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <rect x="20" y="20" width="360" height="180" rx="8" />
            <line x1="200" y1="20" x2="200" y2="200" />
            <circle cx="200" cy="110" r="36" />
            <rect x="20" y="65" width="55" height="90" />
            <rect x="325" y="65" width="55" height="90" />
          </svg>
          <div className="relative z-10 flex flex-col items-center text-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 flex items-center justify-center text-amber-400">
              {hasVideo ? <Tv className="w-6 h-6" /> : <Trophy className="w-6 h-6" />}
            </div>
            <span className="text-xs font-medium tracking-wide text-slate-300">
              {leagueLabel} • Cobertura 365 DA BARRA
            </span>
          </div>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />
    </div>
  );
};
