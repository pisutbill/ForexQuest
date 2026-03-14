'use client';

import { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import GameHeader from '@/components/GameHeader';
import CurrencyBuyPanel from '@/components/CurrencyBuyPanel';
import Portfolio from '@/components/Portfolio';
import RoundOutcomeModal from '@/components/RoundOutcomeModal';
import { CURRENCIES } from '@/data/currencies';
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

const START_YEAR = 2000;
const STARTING_BALANCE = 10_000;

async function fetchRatesForYear(year: number): Promise<Record<string, number> | null> {
  const res = await fetch(`/api/rates?year=${year}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.rates ?? null;
}

export default function GamePage() {
  const [round, setRound] = useState(1);
  const [balanceUSD, setBalanceUSD] = useState(STARTING_BALANCE);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [currentRates, setCurrentRates] = useState<Record<string, number>>({});
  const [phase, setPhase] = useState<GamePhase>('investing');
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
  const [lastRoundResults, setLastRoundResults] = useState<RoundResult[]>([]);
  const [prevBalance, setPrevBalance] = useState(STARTING_BALANCE);
  const [ratesLoading, setRatesLoading] = useState(true);
  const [ratesError, setRatesError] = useState(false);

  const [countryToCurrency, setCountryToCurrency] = useState<Record<string, string>>({});
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedCurrencyCode, setSelectedCurrencyCode] = useState<string | null>(null);

  const year = START_YEAR + round - 1;
  const totalInvested = holdings.reduce((sum, h) => sum + h.usdSpent, 0);

  useEffect(() => {
    Promise.all([
      fetchRatesForYear(START_YEAR),
      fetch('/api/countries').then((r) => r.json()).then((d) => d.countries as Record<string, string>),
    ]).then(([rates, countries]) => {
      if (rates) {
        setCurrentRates(rates);
      } else {
        setRatesError(true);
      }
      setCountryToCurrency(countries ?? {});
      setRatesLoading(false);
    });
  }, []);

  const existingHoldingsForSelected = useMemo(
    () => holdings.filter((h) => h.currencyCode === selectedCurrencyCode),
    [holdings, selectedCurrencyCode]
  );

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
    const rate = currentRates[selectedCurrencyCode];
    if (!rate) return;

    const newHolding: Holding = {
      id: `${selectedCurrencyCode}-${Date.now()}`,
      currencyCode: selectedCurrencyCode,
      currencyName: currency.currencyName,
      countryName: selectedCountry,
      symbol: currency.symbol,
      flag: currency.flag,
      amountFC: usdAmount * rate,
      purchaseRateToUSD: rate,
      usdSpent: usdAmount,
      roundPurchased: round,
    };

    setHoldings((prev) => [...prev, newHolding]);
    setBalanceUSD((prev) => prev - usdAmount);
    setSelectedCountry(null);
    setSelectedCurrencyCode(null);
  };

  const handleNextRound = async () => {
    if (phase === 'outcome') return;

    const newRates = await fetchRatesForYear(year + 1);
    if (!newRates) {
      setRatesError(true);
      return;
    }

    const grouped = holdings.reduce<Record<string, Holding[]>>((acc, h) => {
      (acc[h.currencyCode] ??= []).push(h);
      return acc;
    }, {});

    const results: RoundResult[] = Object.entries(grouped).map(([code, hs]) => {
      const currency = CURRENCIES[code];
      const totalFC = hs.reduce((s, h) => s + h.amountFC, 0);
      const totalSpent = hs.reduce((s, h) => s + h.usdSpent, 0);
      const purchaseRateToUSD = totalFC / totalSpent;
      const newRate = newRates[code] ?? currentRates[code];
      const newUSDValue = totalFC / newRate;
      const pnl = newUSDValue - totalSpent;
      const pnlPct = (pnl / totalSpent) * 100;
      const oldRate = currentRates[code];
      const rateChangePct = ((newRate - oldRate) / oldRate) * 100;
      const currencyChangePct = -rateChangePct;

      return {
        currencyCode: code,
        currencyName: currency?.currencyName ?? code,
        countryName: hs[0].countryName,
        symbol: currency?.symbol ?? '',
        flag: currency?.flag ?? '🏳',
        amountFC: totalFC,
        usdSpent: totalSpent,
        purchaseRateToUSD,
        newRateToUSD: newRate,
        rateChangePct,
        currencyChangePct,
        newUSDValue,
        pnl,
        pnlPct,
      };
    });

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
    setLastRoundResults(roundResults);
    setPhase('investing');
    setRoundResults([]);
  };

  const selectedCurrency = selectedCurrencyCode ? CURRENCIES[selectedCurrencyCode] : null;

  if (ratesLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Loading historical rates for {START_YEAR}…</p>
        </div>
      </div>
    );
  }

  if (ratesError) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <div className="text-center max-w-sm">
          <p className="text-red-400 font-semibold mb-2">Failed to load rates from database</p>
          <p className="text-slate-400 text-sm">Check your database connection and try again.</p>
        </div>
      </div>
    );
  }

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
        <div className="flex-1 p-3 min-w-0">
          <WorldMap
            selectedCountry={selectedCountry}
            holdings={holdings}
            countryToCurrency={countryToCurrency}
            onCountryClick={handleCountryClick}
          />
        </div>

        <div className="w-80 xl:w-96 border-l border-slate-700/60 overflow-hidden flex flex-col bg-slate-900">
          {selectedCountry && selectedCurrency ? (
            <CurrencyBuyPanel
              countryName={selectedCountry}
              currency={selectedCurrency}
              currentRate={currentRates[selectedCurrencyCode!] ?? 1}
              balanceUSD={balanceUSD}
              existingHoldings={existingHoldingsForSelected}
              currentRound={round}
              year={year}
              lastRoundResult={lastRoundResults.find((r) => r.currencyCode === selectedCurrencyCode) ?? null}
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
