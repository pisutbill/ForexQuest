 'use client';

import { useEffect, useState } from 'react';
import { CurrencyInfo, Holding, RoundResult } from '@/types/game';
import { COUNTRY_FLAG, getVolatilityLabel } from '@/data/currencies';
import CountryChatPopup from '@/components/ChatPopup';

interface CurrencyBuyPanelProps {
  countryName: string;
  currency: CurrencyInfo;
  currentRate: number; // 1 USD = X foreign currency
  balanceUSD: number;
  existingHoldings: Holding[];
  currentRound: number;
  year: number;
  lastRoundResult: RoundResult | null;
  onBuy: (usdAmount: number) => void;
  onClose: () => void;
}

export default function CurrencyBuyPanel({
  countryName,
  currency,
  currentRate,
  balanceUSD,
  existingHoldings,
  currentRound,
  year,
  lastRoundResult,
  onBuy,
  onClose,
}: CurrencyBuyPanelProps) {
  const [usdInput, setUsdInput] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<{
    overview: string;
    key_points: string[];
    risk: 'low' | 'mid' | 'high';
  } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const [lastRoundSummary, setLastRoundSummary] = useState<{
    performance: 'up' | 'down' | 'flat';
    explanation: string;
    reasons: string[];
    verdict: string;
    yearTransition: string;
  } | null>(null);
  const [lastRoundSummaryDone, setLastRoundSummaryDone] = useState(false);

  useEffect(() => {
    if (!lastRoundResult) return;
    fetch('/api/after-summary-country', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        country: lastRoundResult.countryName,
        currency: lastRoundResult.currencyCode,
        yearTransition: `${year - 2}-${year - 1}`,
        currentValue: Math.round(lastRoundResult.newUSDValue),
        rateChange: parseFloat(lastRoundResult.rateChangePct.toFixed(2)),
        position: 'long',
        amountInvested: lastRoundResult.usdSpent,
      }),
    })
      .then((res) => res.json())
      .then((data) => { if (data?.explanation) setLastRoundSummary(data); })
      .catch(() => null)
      .finally(() => setLastRoundSummaryDone(true));
  }, [lastRoundResult]);

  const usdAmount = parseFloat(usdInput) || 0;
  const foreignAmount = usdAmount * currentRate;
  const isValidAmount = usdAmount > 0 && usdAmount <= balanceUSD;

  const totalHeld = existingHoldings.reduce((sum, h) => sum + h.amountFC, 0);
  const totalSpent = existingHoldings.reduce((sum, h) => sum + h.usdSpent, 0);

  const volatility = getVolatilityLabel(currency.volatility);

  const countryFlag =
    COUNTRY_FLAG[countryName] ?? currency.flag;

  const formatUSD = (n: number) =>
    n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });

  const formatFC = (n: number) => {
    if (n >= 1000) return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
    return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
  };

  const handleQuickAmount = (pct: number) => {
    const amount = Math.floor(balanceUSD * pct);
    setUsdInput(String(amount));
  };

  const handleBuy = () => {
    if (!isValidAmount) return;
    onBuy(usdAmount);
    setUsdInput('');
  };

  const handleAiAnalysis = async () => {
    setAiLoading(true);
    setAiAnalysis(null);
    setAiError(null);
    try {
      const res = await fetch('/api/before-summary-country', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year, country: countryName }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAiError(data?.error ?? 'Request failed');
      } else if (data?.overview) {
        setAiAnalysis(data);
      } else {
        setAiError('unavailable');
      }
    } catch (err: any) {
      setAiError(err?.message ?? 'Unknown error');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{countryFlag}</span>
          <div>
            <h2 className="text-white font-bold text-base leading-none">{countryName}</h2>
            <p className="text-slate-400 text-xs mt-0.5">{currency.currencyName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setChatOpen(true)}
            className="text-slate-500 hover:text-blue-400 transition-colors p-1"
            aria-label="Open chat"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors p-1"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <CountryChatPopup
        country={countryName}
        year={year}
        open={chatOpen}
        onClose={() => setChatOpen(false)}
      />

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {/* Exchange rate */}
        <div className="bg-slate-800 rounded-xl p-4">
          <p className="text-slate-400 text-xs uppercase tracking-widest mb-2">Exchange Rate</p>
          <div className="flex items-baseline gap-2">
            <span className="text-white font-bold text-2xl font-mono">
              {currency.symbol}{formatFC(currentRate)}
            </span>
            <span className="text-slate-400 text-sm">per USD</span>
          </div>
          <p className="text-slate-500 text-xs mt-1 font-mono">
            1 {currency.currencyCode} = ${(1 / currentRate).toFixed(4)} USD
          </p>
        </div>

        {/* Risk badge */}
        <div className={`flex items-center gap-2 border rounded-lg px-3 py-2 ${volatility.bg}`}>
          <div className={`w-2 h-2 rounded-full ${
            currency.volatility === 'low' ? 'bg-green-400' :
            currency.volatility === 'medium' ? 'bg-amber-400' : 'bg-red-400'
          }`} />
          <span className={`text-xs font-semibold ${volatility.color}`}>{volatility.label}</span>
          <span className="text-slate-400 text-xs">· {currency.volatility === 'low' ? '±5%' : currency.volatility === 'medium' ? '±12%' : '±25%'} annual swing</span>
        </div>

        {/* Educational description */}
        <div>
          <p className="text-slate-400 text-xs uppercase tracking-widest mb-1.5">About this Currency</p>
          <p className="text-slate-300 text-sm leading-relaxed">{currency.description}</p>
        </div>

        {/* Existing holdings */}
        {existingHoldings.length > 0 && (
          <div className="bg-amber-900/20 border border-amber-700/40 rounded-xl p-4">
            <p className="text-amber-400 text-xs uppercase tracking-widest mb-2">Current Holdings ({currency.currencyCode})</p>
            <div className="flex justify-between text-sm">
              <span className="text-slate-300">
                {currency.symbol}{formatFC(totalHeld)} {currency.currencyCode}
              </span>
              <span className="text-slate-400">{formatUSD(totalSpent)} spent</span>
            </div>
            <p className="text-amber-400/70 text-xs mt-1.5">
              You can buy more — holdings stack until next round.
            </p>
          </div>
        )}

        {/* Last round summary */}
        {lastRoundResult && (
          <div className="bg-slate-800 rounded-xl p-4 space-y-2">
            <p className="text-slate-400 text-xs uppercase tracking-widest">Last Round</p>
            {!lastRoundSummaryDone ? (
              <div className="flex items-center gap-2 text-slate-500 text-xs">
                <div className="w-3 h-3 border border-slate-500 border-t-transparent rounded-full animate-spin" />
                Analyzing…
              </div>
            ) : !lastRoundSummary ? (
              <p className="text-slate-500 text-xs">Analysis unavailable.</p>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                    lastRoundSummary.performance === 'up' ? 'bg-green-900/60 text-green-400' :
                    lastRoundSummary.performance === 'down' ? 'bg-red-900/60 text-red-400' :
                    'bg-slate-700 text-slate-400'
                  }`}>
                    {lastRoundSummary.performance === 'up' ? '▲ UP' : lastRoundSummary.performance === 'down' ? '▼ DOWN' : '— FLAT'}
                  </span>
                  <span className="text-slate-500 text-xs">{lastRoundSummary.yearTransition}</span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">{lastRoundSummary.explanation}</p>
                <ul className="space-y-1">
                  {(lastRoundSummary.reasons ?? []).map((r, i) => (
                    <li key={i} className="text-slate-400 text-xs flex gap-1.5">
                      <span className="text-slate-500 shrink-0">·</span>{r}
                    </li>
                  ))}
                </ul>
                <p className="text-slate-400 text-xs italic border-t border-slate-700 pt-2">{lastRoundSummary.verdict}</p>
              </>
            )}
          </div>
        )}

        {/* Buy form */}
        <div className="bg-slate-800 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-slate-400 text-xs uppercase tracking-widest">Invest this Round</p>
            <button
              onClick={handleAiAnalysis}
              disabled={aiLoading}
              className="text-xs text-blue-400 hover:text-blue-300 disabled:text-slate-500 transition-colors"
            >
              {aiLoading ? 'Analyzing…' : 'AI Analysis'}
            </button>
          </div>

          {aiError && (
            <p className="text-slate-500 text-xs">
              {aiError === 'unavailable' ? 'Analysis unavailable.' : aiError}
            </p>
          )}

          {aiAnalysis && (
            <div className="bg-slate-700/50 rounded-lg p-3 space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded font-semibold ${
                  aiAnalysis.risk === 'low' ? 'bg-green-900/60 text-green-400' :
                  aiAnalysis.risk === 'mid' ? 'bg-amber-900/60 text-amber-400' :
                  'bg-red-900/60 text-red-400'
                }`}>
                  {aiAnalysis.risk.toUpperCase()} RISK
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed">{aiAnalysis.overview}</p>
              <ul className="space-y-1">
                {aiAnalysis.key_points.map((point, i) => (
                  <li key={i} className="text-slate-400 flex gap-1.5">
                    <span className="text-slate-500 shrink-0">·</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <label className="text-slate-400 text-xs mb-1.5 block">Amount in USD</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">$</span>
              <input
                type="number"
                min={1}
                max={balanceUSD}
                value={usdInput}
                onChange={(e) => setUsdInput(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-7 pr-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 placeholder:text-slate-500"
              />
            </div>
            <p className="text-slate-500 text-xs mt-1.5 font-mono">
              Available: ${balanceUSD.toLocaleString('en-US', { maximumFractionDigits: 0 })} USD
            </p>
          </div>

          {/* Quick % buttons */}
          <div className="flex gap-2">
            {[0.1, 0.25, 0.5, 1].map((pct) => (
              <button
                key={pct}
                onClick={() => handleQuickAmount(pct)}
                className="flex-1 py-1.5 text-xs font-semibold text-slate-400 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              >
                {pct === 1 ? 'Max' : `${pct * 100}%`}
              </button>
            ))}
          </div>

          {/* Preview */}
          {usdAmount > 0 && (
            <div className="bg-slate-700/50 rounded-lg p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">You spend</span>
                <span className="text-white font-mono">{formatUSD(usdAmount)}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-slate-400">You receive</span>
                <span className="text-green-400 font-mono font-semibold">
                  {currency.symbol}{formatFC(foreignAmount)} {currency.currencyCode}
                </span>
              </div>
              {usdAmount > balanceUSD && (
                <p className="text-red-400 text-xs mt-2">Exceeds your available balance.</p>
              )}
            </div>
          )}

          <button
            onClick={handleBuy}
            disabled={!isValidAmount}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white rounded-lg font-bold text-sm transition-colors"
          >
            {usdAmount > 0 && isValidAmount
              ? `Buy ${currency.symbol}${formatFC(foreignAmount)} ${currency.currencyCode}`
              : 'Enter an amount to buy'}
          </button>

          <p className="text-slate-500 text-xs text-center">
            Currencies convert back to USD at the next round's exchange rate.
          </p>
        </div>
      </div>
    </div>
  );
}
