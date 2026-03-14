'use client';

import { Holding } from '@/types/game';
import { CURRENCIES } from '@/data/currencies';

interface PortfolioProps {
  balanceUSD: number;
  holdings: Holding[];
  currentRates: Record<string, number>;
  round: number;
  year: number;
}

export default function Portfolio({ balanceUSD, holdings, currentRates, round, year }: PortfolioProps) {
  const formatUSD = (n: number) =>
    n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  const formatFC = (n: number) => {
    if (n >= 10000) return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
    if (n >= 100) return n.toLocaleString('en-US', { maximumFractionDigits: 1 });
    return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
  };

  // Group holdings by currency
  const grouped = holdings.reduce<Record<string, { holdings: Holding[]; totalFC: number; totalSpent: number }>>((acc, h) => {
    if (!acc[h.currencyCode]) {
      acc[h.currencyCode] = { holdings: [], totalFC: 0, totalSpent: 0 };
    }
    acc[h.currencyCode].holdings.push(h);
    acc[h.currencyCode].totalFC += h.amountFC;
    acc[h.currencyCode].totalSpent += h.usdSpent;
    return acc;
  }, {});

  const totalInvested = holdings.reduce((sum, h) => sum + h.usdSpent, 0);
  const totalPortfolioValue = Object.entries(grouped).reduce((sum, [code, g]) => {
    const rate = currentRates[code] ?? CURRENCIES[code]?.baseRateToUSD ?? 1;
    return sum + g.totalFC / rate;
  }, 0);
  const totalNetWorth = balanceUSD + totalPortfolioValue;

  return (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-700">
        <h2 className="text-white font-bold text-base">Portfolio</h2>
        <p className="text-slate-400 text-xs mt-0.5">Round {round} · {year}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* Net worth summary */}
        <div className="bg-slate-800 rounded-xl p-4">
          <p className="text-slate-400 text-xs uppercase tracking-widest mb-2">Total Net Worth</p>
          <p className="text-white font-bold text-2xl font-mono">{formatUSD(totalNetWorth)}</p>
          <div className="mt-3 space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Cash (USD)</span>
              <span className="text-green-400 font-mono font-semibold">{formatUSD(balanceUSD)}</span>
            </div>
            {totalInvested > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Invested</span>
                <span className="text-amber-400 font-mono">{formatUSD(totalPortfolioValue)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Holdings */}
        {Object.keys(grouped).length > 0 ? (
          <div>
            <p className="text-slate-400 text-xs uppercase tracking-widest mb-3">Positions</p>
            <div className="space-y-3">
              {Object.entries(grouped).map(([code, g]) => {
                const currency = CURRENCIES[code];
                if (!currency) return null;
                const rate = currentRates[code] ?? currency.baseRateToUSD;
                const currentUSDValue = g.totalFC / rate;
                const unrealizedPnL = currentUSDValue - g.totalSpent;
                const pnlPct = (unrealizedPnL / g.totalSpent) * 100;
                const isPositive = unrealizedPnL >= 0;

                return (
                  <div key={code} className="bg-slate-800 rounded-xl p-3.5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{currency.flag}</span>
                        <div>
                          <p className="text-white font-semibold text-sm">{code}</p>
                          <p className="text-slate-400 text-xs">{currency.currencyName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-mono text-sm font-semibold">
                          {formatUSD(currentUSDValue)}
                        </p>
                        <p className={`text-xs font-mono font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                          {isPositive ? '+' : ''}{formatUSD(unrealizedPnL)} ({isPositive ? '+' : ''}{pnlPct.toFixed(1)}%)
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-between text-xs text-slate-500 pt-2 border-t border-slate-700/60">
                      <span>
                        {currency.symbol}{formatFC(g.totalFC)} {code}
                      </span>
                      <span>Rate: {formatFC(rate)}</span>
                    </div>

                    {/* P&L bar */}
                    <div className="mt-2 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${isPositive ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.min(Math.abs(pnlPct) * 2, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
              </svg>
            </div>
            <p className="text-slate-400 font-semibold text-sm">No positions yet</p>
            <p className="text-slate-500 text-xs mt-1 max-w-[180px]">
              Click a country on the map to invest in its currency.
            </p>
          </div>
        )}

        {/* Tip */}
        <div className="bg-blue-950/40 border border-blue-800/40 rounded-xl p-3.5">
          <p className="text-blue-400 text-xs font-semibold mb-1">How it works</p>
          <p className="text-slate-400 text-xs leading-relaxed">
            Click any highlighted country to buy its currency with your USD. At round end, rates shift and your holdings convert back — revealing your gain or loss.
          </p>
        </div>
      </div>
    </div>
  );
}
