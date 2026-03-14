'use client';

import { useEffect, useState } from 'react';
import { RoundResult } from '@/types/game';

type AiOverview = {
  summary: string;
  portfolioTrend: 'positive' | 'negative' | 'mixed' | 'flat';
  key_drivers: string[];
  best_performer?: string;
  worst_performer?: string;
  verdict: string;
};

interface RoundOutcomeModalProps {
  round: number;
  year: number;
  results: RoundResult[];
  newBalance: number;
  previousBalance: number;
  onContinue: () => void;
}

export default function RoundOutcomeModal({
  round,
  year,
  results,
  newBalance,
  previousBalance,
  onContinue,
}: RoundOutcomeModalProps) {
  const [aiOverview, setAiOverview] = useState<AiOverview | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDone, setAiDone] = useState(false);

  useEffect(() => {
    if (results.length === 0) return;
    setAiLoading(true);
    const holdings = results.map((r) => ({
      country: r.countryName,
      currency: r.currencyCode,
      yearTransition: `${year - 1}-${year}`,
      currentValue: Math.round(r.newUSDValue),
      rateChange: parseFloat(r.rateChangePct.toFixed(2)),
    }));
    fetch('/api/result-overview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ holdings }),
    })
      .then((res) => res.json())
      .then((data) => { if (data?.summary) setAiOverview(data); })
      .catch(() => null)
      .finally(() => { setAiLoading(false); setAiDone(true); });
  }, []);

  const formatUSD = (n: number) =>
    n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  const formatFC = (n: number) => {
    if (n >= 10000) return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
    if (n >= 100) return n.toLocaleString('en-US', { maximumFractionDigits: 1 });
    return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
  };

  const totalPnL = results.reduce((sum, r) => sum + r.pnl, 0);
  const totalInvested = results.reduce((sum, r) => sum + r.usdSpent, 0);
  const totalPnLPct = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
  const isOverallPositive = totalPnL >= 0;
  const balanceChange = newBalance - previousBalance;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top accent */}
        <div className={`h-1 w-full ${isOverallPositive ? 'bg-green-500' : 'bg-red-500'}`} />

        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-widest">Year {year - 1} → {year}</p>
              <h2 className="text-white font-bold text-xl mt-0.5">Round {round - 1} Results</h2>
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-xs uppercase tracking-widest">Net P&amp;L</p>
              <p className={`font-bold text-2xl font-mono ${isOverallPositive ? 'text-green-400' : 'text-red-400'}`}>
                {isOverallPositive ? '+' : ''}{formatUSD(totalPnL)}
              </p>
              {totalInvested > 0 && (
                <p className={`text-sm font-mono ${isOverallPositive ? 'text-green-400/70' : 'text-red-400/70'}`}>
                  {isOverallPositive ? '+' : ''}{totalPnLPct.toFixed(1)}% on invested
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Results list */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {results.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-400 text-base font-semibold">No positions this round</p>
              <p className="text-slate-500 text-sm mt-1">
                You held no currencies. Your balance is unchanged.
              </p>
              {/* Still show market moves for education */}
              <p className="text-blue-400 text-xs mt-4">
                Markets moved without you — try investing next round!
              </p>
            </div>
          ) : (
            results.map((r) => {
              const isPositive = r.pnl >= 0;
              const currencyStrengthened = r.newRateToUSD < r.purchaseRateToUSD;

              return (
                <div key={r.currencyCode} className="bg-slate-800 rounded-xl p-4">
                  {/* Currency header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{r.flag}</span>
                      <div>
                        <p className="text-white font-semibold text-sm">
                          {r.currencyCode} — {r.currencyName}
                        </p>
                        <p className="text-slate-400 text-xs">{r.countryName}</p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold font-mono ${
                      isPositive ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'
                    }`}>
                      {isPositive ? '▲' : '▼'}
                      {isPositive ? '+' : ''}{formatUSD(r.pnl)}
                    </div>
                  </div>

                  {/* Rate change row */}
                  <div className="bg-slate-700/40 rounded-lg p-3 mb-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-400">Exchange Rate (1 USD =)</span>
                      <span className={`font-semibold ${currencyStrengthened ? 'text-green-400' : 'text-red-400'}`}>
                        {currencyStrengthened ? '↑ Strengthened' : '↓ Weakened'} {Math.abs(r.currencyChangePct).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-mono">
                      <span className="text-slate-300">
                        {r.symbol}{formatFC(r.purchaseRateToUSD)}
                      </span>
                      <span className="text-slate-500">→</span>
                      <span className={`font-semibold ${currencyStrengthened ? 'text-green-400' : 'text-red-400'}`}>
                        {r.symbol}{formatFC(r.newRateToUSD)}
                      </span>
                    </div>
                    <p className="text-slate-500 text-xs mt-1.5">
                      {currencyStrengthened
                        ? `${r.currencyCode} gained value vs. USD — your holdings are worth more!`
                        : `${r.currencyCode} lost value vs. USD — your holdings are worth less.`}
                    </p>
                  </div>

                  {/* Value breakdown */}
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <p className="text-slate-500 mb-0.5">Amount held</p>
                      <p className="text-slate-300 font-mono font-semibold">
                        {r.symbol}{formatFC(r.amountFC)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 mb-0.5">Cost basis</p>
                      <p className="text-slate-300 font-mono font-semibold">{formatUSD(r.usdSpent)}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 mb-0.5">Value now</p>
                      <p className={`font-mono font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                        {formatUSD(r.newUSDValue)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* AI Overview */}
        {(aiLoading || aiDone) && (
          <div className="px-6 py-4 border-t border-slate-700 space-y-2">
            <p className="text-slate-400 text-xs uppercase tracking-widest">AI Analysis</p>
            {aiLoading ? (
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <div className="w-3 h-3 border border-slate-500 border-t-transparent rounded-full animate-spin" />
                Analyzing your portfolio…
              </div>
            ) : !aiOverview ? (
              <p className="text-slate-500 text-xs">Analysis unavailable.</p>
            ) : (
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                    aiOverview.portfolioTrend === 'positive' ? 'bg-green-900/60 text-green-400' :
                    aiOverview.portfolioTrend === 'negative' ? 'bg-red-900/60 text-red-400' :
                    aiOverview.portfolioTrend === 'mixed' ? 'bg-amber-900/60 text-amber-400' :
                    'bg-slate-700 text-slate-400'
                  }`}>
                    {aiOverview.portfolioTrend.toUpperCase()}
                  </span>
                  {aiOverview.best_performer && (
                    <span className="text-xs text-slate-400">Best: <span className="text-green-400">{aiOverview.best_performer}</span></span>
                  )}
                  {aiOverview.worst_performer && (
                    <span className="text-xs text-slate-400">Worst: <span className="text-red-400">{aiOverview.worst_performer}</span></span>
                  )}
                </div>
                <p className="text-slate-300 leading-relaxed">{aiOverview.summary}</p>
                <ul className="space-y-1">
                  {aiOverview.key_drivers.map((d, i) => (
                    <li key={i} className="text-slate-400 text-xs flex gap-1.5">
                      <span className="text-slate-500 shrink-0">·</span>{d}
                    </li>
                  ))}
                </ul>
                <p className="text-slate-400 text-xs italic border-t border-slate-700 pt-2">{aiOverview.verdict}</p>
              </div>
            )}
          </div>
        )}

        {/* Footer: balance summary + continue */}
        <div className="px-6 py-4 border-t border-slate-700 bg-slate-800/50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-slate-400 text-xs">New Balance</p>
              <p className="text-white font-bold text-xl font-mono">{formatUSD(newBalance)}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-xs">Change from holdings</p>
              <p className={`font-mono font-semibold text-sm ${balanceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {balanceChange >= 0 ? '+' : ''}{formatUSD(balanceChange)}
              </p>
            </div>
          </div>

          <button
            onClick={onContinue}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
          >
            <span>Continue to Round {round}</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
