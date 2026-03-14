'use client';

interface GameHeaderProps {
  round: number;
  year: number;
  balanceUSD: number;
  totalInvested: number;
  onNextRound: () => void;
  phase: 'investing' | 'outcome';
}

export default function GameHeader({
  round,
  year,
  balanceUSD,
  totalInvested,
  onNextRound,
  phase,
}: GameHeaderProps) {
  const formatUSD = (n: number) =>
    n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-slate-900 border-b border-slate-700 shrink-0">
      {/* Left: branding */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
            FX
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">ForexQuest</span>
        </div>
        <div className="hidden sm:flex items-center gap-1 ml-2">
          <span className="text-slate-500 text-sm">·</span>
          <span className="text-slate-400 text-sm">Educational Currency Simulator</span>
        </div>
      </div>

      {/* Center: round + year */}
      <div className="flex items-center gap-6 text-sm">
        <div className="text-center">
          <p className="text-slate-500 text-xs uppercase tracking-widest">Round</p>
          <p className="text-white font-bold text-xl leading-none">{round}</p>
        </div>
        <div className="w-px h-8 bg-slate-700" />
        <div className="text-center">
          <p className="text-slate-500 text-xs uppercase tracking-widest">Year</p>
          <p className="text-white font-bold text-xl leading-none">{year}</p>
        </div>
      </div>

      {/* Right: balance + next round */}
      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-slate-500 text-xs uppercase tracking-widest">Cash Balance</p>
          <p className="text-green-400 font-bold text-lg font-mono leading-none">{formatUSD(balanceUSD)}</p>
          {totalInvested > 0 && (
            <p className="text-slate-500 text-xs font-mono">{formatUSD(totalInvested)} invested</p>
          )}
        </div>

        <button
          onClick={onNextRound}
          disabled={phase === 'outcome'}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white rounded-lg font-semibold text-sm transition-colors shadow-lg shadow-blue-900/30"
        >
          <span>Next Round</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </header>
  );
}
