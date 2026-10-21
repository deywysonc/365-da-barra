import React, { useState } from 'react';
import { ArrowLeft, Film, Newspaper, PlayCircle, X } from 'lucide-react';
import { NewsArticle } from '../types/sportsbook';
import { EditorialCover } from './TeamCrest';

interface NewsViewProps {
  articles: NewsArticle[];
  isLightMode: boolean;
  onBack: () => void;
}

export const NewsView: React.FC<NewsViewProps> = ({
  articles,
  isLightMode,
  onBack,
}) => {
  const [leagueFilter, setLeagueFilter] = useState<string>('all');
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);

  const filtered =
    leagueFilter === 'all'
      ? articles
      : articles.filter((a) => a.leagueSlug === leagueFilter);

  const featured = filtered[0] || articles[0];
  const rest = filtered.slice(1);

  return (
    <div className="space-y-5">
      {/* Top Bar */}
      <div
        className={`rounded-2xl p-4 border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
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
              Central de Notícias, Bastidores & Vídeos HD
            </h1>
            <p className="text-xs text-slate-400">
              Cobertura jornalística em português das principais ligas e vídeos de gols
            </p>
          </div>
        </div>

        {/* Category Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'Todas as Editorias' },
            { id: 'bra.1', label: 'Brasileirão' },
            { id: 'uefa.champions', label: 'Champions League' },
            { id: 'conmebol.libertadores', label: 'Libertadores' },
            { id: 'eng.1', label: 'Premier League' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setLeagueFilter(cat.id)}
              className={`px-3 py-1.5 min-h-[34px] rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                leagueFilter === cat.id
                  ? 'bg-amber-400 text-slate-950 font-bold'
                  : isLightMode
                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  : 'bg-[#0C101D] text-slate-300 hover:bg-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Featured Lead Story */}
      {featured && (
        <article
          onClick={() => setSelectedArticle(featured)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') setSelectedArticle(featured);
          }}
          className={`rounded-2xl border overflow-hidden cursor-pointer transition-all hover:border-amber-400/60 grid grid-cols-1 lg:grid-cols-12 items-stretch ${
            isLightMode
              ? 'bg-white border-slate-200 shadow-sm'
              : 'bg-[#14192B] border-slate-800/90'
          }`}
        >
          <div className="lg:col-span-7 relative min-h-[240px]">
            <EditorialCover
              imageUrl={featured.image}
              leagueLabel={featured.leagueLabel}
              headline={featured.headline}
              hasVideo={featured.hasVideo}
              className="h-full min-h-[240px]"
            />
          </div>

          <div className="lg:col-span-5 p-6 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold">
                <span>MANCHETE PRINCIPAL</span>
                <span aria-hidden="true">·</span>
                <span>{featured.leagueLabel}</span>
                <span aria-hidden="true">·</span>
                <span className="text-slate-400 font-normal">{featured.timeAgo}</span>
              </div>

              <h2 className="font-display font-extrabold text-xl sm:text-2xl leading-snug">
                {featured.headline}
              </h2>

              <p
                className={`text-sm leading-relaxed ${
                  isLightMode ? 'text-slate-600' : 'text-slate-300'
                }`}
              >
                {featured.description}
              </p>
            </div>

            <div className="pt-5 mt-5 border-t border-slate-800/40 flex items-center justify-between text-xs">
              <span className="text-slate-400">Por {featured.byline}</span>
              <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                <PlayCircle className="w-4 h-4" />
                <span>Ler Matéria & Vídeo →</span>
              </span>
            </div>
          </div>
        </article>
      )}

      {/* Secondary Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {rest.map((art) => (
          <article
            key={art.id}
            onClick={() => setSelectedArticle(art)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') setSelectedArticle(art);
            }}
            className={`rounded-2xl border overflow-hidden cursor-pointer transition-all hover:border-amber-400/60 flex flex-col justify-between ${
              isLightMode
                ? 'bg-white border-slate-200 shadow-2xs'
                : 'bg-[#14192B] border-slate-800/90'
            }`}
          >
            <div>
              <EditorialCover
                imageUrl={art.image}
                leagueLabel={art.leagueLabel}
                headline={art.headline}
                hasVideo={art.hasVideo}
                className="h-44"
              />
              <div className="p-4 space-y-2">
                <div className="text-xs text-slate-400 flex items-center gap-1.5">
                  <span className="text-amber-400 font-semibold">{art.leagueLabel}</span>
                  <span aria-hidden="true">·</span>
                  <span>{art.timeAgo}</span>
                </div>
                <h3 className="font-display font-bold text-base leading-snug">
                  {art.headline}
                </h3>
                <p
                  className={`text-xs leading-relaxed line-clamp-3 ${
                    isLightMode ? 'text-slate-600' : 'text-slate-400'
                  }`}
                >
                  {art.description}
                </p>
              </div>
            </div>

            <div className="px-4 py-3 border-t border-slate-800/40 flex items-center justify-between text-xs">
              <span className="font-semibold text-emerald-400">
                Ler na íntegra →
              </span>
              <span className="text-slate-400">{art.published}</span>
            </div>
          </article>
        ))}
      </div>

      {/* Article Reader & Video Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div
            className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border shadow-2xl ${
              isLightMode
                ? 'bg-white border-slate-200 text-slate-900'
                : 'bg-[#14192B] border-slate-800 text-slate-100'
            }`}
          >
            <div className="sticky top-0 z-10 px-5 py-3.5 bg-[#1D1542] text-white border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400">
                {selectedArticle.leagueLabel} · {selectedArticle.timeAgo}
              </span>
              <button
                type="button"
                onClick={() => setSelectedArticle(null)}
                aria-label="Fechar leitura da notícia"
                className="p-1.5 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <h2 className="font-display font-extrabold text-xl sm:text-2xl leading-snug">
                {selectedArticle.headline}
              </h2>
              <p className="text-sm text-slate-400 font-medium">
                {selectedArticle.description}
              </p>

              <div className="text-xs text-slate-400 pb-3 border-b border-slate-800/60 flex items-center justify-between">
                <span>Por {selectedArticle.byline}</span>
                <span>{selectedArticle.published}</span>
              </div>

              {selectedArticle.videoUrl && (
                <div className="rounded-xl overflow-hidden bg-black border border-slate-800">
                  <div className="px-3.5 py-2 bg-emerald-500/15 text-emerald-400 text-xs font-bold flex items-center gap-2">
                    <Film className="w-4 h-4" />
                    <span>VÍDEO OFICIAL EM HD</span>
                  </div>
                  <video
                    src={selectedArticle.videoUrl}
                    controls
                    autoPlay
                    muted
                    playsInline
                    className="w-full max-h-[340px] object-cover"
                  />
                </div>
              )}

              <div
                className={`text-sm leading-relaxed space-y-3 ${
                  isLightMode ? 'text-slate-700' : 'text-slate-300'
                }`}
                dangerouslySetInnerHTML={{
                  __html:
                    selectedArticle.storyHtml || `<p>${selectedArticle.description}</p>`,
                }}
              />

              <div className="pt-4 border-t border-slate-800/60 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedArticle(null)}
                  className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer"
                >
                  Fechar Matéria
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
