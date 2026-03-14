'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import GameHeader from '@/components/GameHeader';
import CurrencyBuyPanel from '@/components/CurrencyBuyPanel';
import Portfolio from '@/components/Portfolio';
import RoundOutcomeModal from '@/components/RoundOutcomeModal';
import { CURRENCIES, COUNTRY_TO_CURRENCY } from '@/data/currencies';
import { Holding, RoundResult, GamePhase } from '@/types/game';

const WorldMap = dynamic(() => import('@/components/WorldMap'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-slate-950 rounded-xl border border-slate-700/50">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-400 text-sm">Loading world map…</p>
      </div>
    </div>
  ),
});

const START_YEAR = 2024;
const STARTING_BALANCE = 10_000;

function buildInitialRates(): Record<string, number> {
  return Object.fromEntries(
    Object.entries(CURRENCIES).map(([code, info]) => [code, info.baseRateToUSD])
  );
}

export default function GamePage() {
  const [round, setRound] = useState(1);
  const [balanceUSD, setBalanceUSD] = useState(STARTING_BALANCE);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [currentRates, setCurrentRates] = useState<Record<string, number>>(buildInitialRates);
  const [phase, setPhase] = useState<GamePhase>('investing');
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
  const [prevBalance, setPrevBalance] = useState(STARTING_BALANCE);

  // Map selection state
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedCurrencyCode, setSelectedCurrencyCode] = useState<string | null>(null);

  const year = START_YEAR + round - 1;
  const totalInvested = holdings.reduce((sum, h) => sum + h.usdSpent, 0);

  const existingHoldingsForSelected = useMemo(
    () => holdings.filter((h) => h.currencyCode === selectedCurrencyCode),
    [holdings, selectedCurrencyCode]
  );

  // --- Handlers ---

  const handleCountryClick = (countryName: string, currencyCode: string) => {
    setSelectedCountry(countryName);
    setSelectedCurrencyCode(currencyCode);
  };

  const handleClosePanel = () => {
    setSelectedCountry(null);
    setSelectedCurrencyCode(null);
  };

  const handleBuy = (usdAmount: number) => {
    if (!selectedCurrencyCode || !selectedCountry) return;
    const currency = CURRENCIES[selectedCurrencyCode];
    if (!currency) return;

    const rate = currentRates[selectedCurrencyCode] ?? currency.baseRateToUSD;
    const amountFC = usdAmount * rate;

    const newHolding: Holding = {
      id: `${selectedCurrencyCode}-${Date.now()}`,
      currencyCode: selectedCurrencyCode,
      currencyName: currency.currencyName,
      countryName: selectedCountry,
      symbol: currency.symbol,
      flag: currency.flag,
      amountFC,
      purchaseRateToUSD: rate,
      usdSpent: usdAmount,
      roundPurchased: round,
    };

    setHoldings((prev) => [...prev, newHolding]);
    setBalanceUSD((prev) => prev - usdAmount);
    // Close panel after purchase
    setSelectedCountry(null);
    setSelectedCurrencyCode(null);
  };

  const simulateRateChange = (
    code: string,
    currentRate: number
  ): number => {
    const currency = CURRENCIES[code];
    if (!currency) return currentRate;

    const volatilityRange = {
      low: 0.05,
      medium: 0.13,
      high: 0.28,
    }[currency.volatility];

    // Random change in [-range, +range]
    const changePct = (Math.random() * 2 - 1) * volatilityRange;
    return currentRate * (1 + changePct);
  };

  const handleNextRound = () => {
    if (phase === 'outcome') return;

    // Generate new rates for all currencies
    const newRates: Record<string, number> = {};
    Object.keys(CURRENCIES).forEach((code) => {
      newRates[code] = simulateRateChange(code, currentRates[code] ?? CURRENCIES[code].baseRateToUSD);
    });

    // Group holdings by currency for result calculation
    const grouped = holdings.reduce<Record<string, Holding[]>>((acc, h) => {
      (acc[h.currencyCode] ??= []).push(h);
      return acc;
    }, {});

    const results: RoundResult[] = Object.entries(grouped).map(([code, hs]) => {
      const currency = CURRENCIES[code];
      const totalFC = hs.reduce((s, h) => s + h.amountFC, 0);
      const totalSpent = hs.reduce((s, h) => s + h.usdSpent, 0);
      const avgPurchaseRate = totalFC / totalSpent; // FC per USD
      const purchaseRateToUSD = totalFC / totalSpent; // FC per USD (same)
      const newRate = newRates[code];
      const newUSDValue = totalFC / newRate;
      const pnl = newUSDValue - totalSpent;
      const pnlPct = (pnl / totalSpent) * 100;

      // Rate change from perspective of the FC value (lower rate = stronger FC)
      const oldRateUSD = currentRates[code]; // 1 USD = X FC
      const rateChangePct = ((newRate - oldRateUSD) / oldRateUSD) * 100;
      // Currency strengthened means rate went DOWN (fewer FC per USD)
      const currencyChangePct = -rateChangePct; // flip: positive = currency strengthened

      return {
        currencyCode: code,
        currencyName: currency?.currencyName ?? code,
        countryName: hs[0].countryName,
        symbol: currency?.symbol ?? '',
        flag: currency?.flag ?? '🏳',
        amountFC: totalFC,
        usdSpent: totalSpent,
        purchaseRateToUSD: purchaseRateToUSD,
        newRateToUSD: newRate,
        rateChangePct,
        currencyChangePct,
        newUSDValue,
        pnl,
        pnlPct,
      };
    });

    // New balance = cash + liquidated holdings
    const liquidatedValue = results.reduce((sum, r) => sum + r.newUSDValue, 0);
    const newBalance = balanceUSD + liquidatedValue;

    setPrevBalance(balanceUSD + totalInvested);
    setCurrentRates(newRates);
    setRoundResults(results);
    setHoldings([]);
    setBalanceUSD(newBalance);
    setRound((r) => r + 1);
    setPhase('outcome');
    setSelectedCountry(null);
    setSelectedCurrencyCode(null);
  };

  const handleContinue = () => {
    setPhase('investing');
    setRoundResults([]);
  };

  const selectedCurrency =
    selectedCurrencyCode ? CURRENCIES[selectedCurrencyCode] : null;

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-white overflow-hidden">
      <GameHeader
        round={round}
        year={year}
        balanceUSD={balanceUSD}
        totalInvested={totalInvested}
        onNextRound={handleNextRound}
        phase={phase}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Map area */}
        <div className="flex-1 p-3 min-w-0">
          <WorldMap
            selectedCountry={selectedCountry}
            holdings={holdings}
            onCountryClick={handleCountryClick}
          />
        </div>

        {/* Right panel */}
        <div className="w-80 xl:w-96 border-l border-slate-700/60 overflow-hidden flex flex-col bg-slate-900">
          {selectedCountry && selectedCurrency ? (
            <CurrencyBuyPanel
              countryName={selectedCountry}
              currency={selectedCurrency}
              currentRate={currentRates[selectedCurrencyCode!] ?? selectedCurrency.baseRateToUSD}
              balanceUSD={balanceUSD}
              existingHoldings={existingHoldingsForSelected}
              currentRound={round}
              onBuy={handleBuy}
              onClose={handleClosePanel}
            />
          ) : (
            <Portfolio
              balanceUSD={balanceUSD}
              holdings={holdings}
              currentRates={currentRates}
              round={round}
              year={year}
            />
          )}
        </div>
      </div>

      {/* Round outcome modal */}
      {phase === 'outcome' && (
        <RoundOutcomeModal
          round={round}
          year={year}
          results={roundResults}
          newBalance={balanceUSD}
          previousBalance={prevBalance}
          onContinue={handleContinue}
        />
      )}
    </div>
  );
}
