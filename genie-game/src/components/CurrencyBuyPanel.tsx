'use client';

import { useState } from 'react';
import { CurrencyInfo, Holding } from '@/types/game';
import { COUNTRY_FLAG, getVolatilityLabel } from '@/data/currencies';

interface CurrencyBuyPanelProps {
  countryName: string;
  currency: CurrencyInfo;
  currentRate: number; // 1 USD = X foreign currency
  balanceUSD: number;
  existingHoldings: Holding[];
  currentRound: number;
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
  onBuy,
  onClose,
}: CurrencyBuyPanelProps) {
  const [usdInput, setUsdInput] = useState('');

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

        {/* Buy form */}
        <div className="bg-slate-800 rounded-xl p-4 space-y-4">
          <p className="text-slate-400 text-xs uppercase tracking-widest">Invest this Round</p>

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
