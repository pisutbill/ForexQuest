export interface CurrencyInfo {
  currencyCode: string;
  currencyName: string;
  symbol: string;
  flag: string;
  volatility: 'low' | 'medium' | 'high';
  description: string;
}

export interface Holding {
  id: string;
  currencyCode: string;
  currencyName: string;
  countryName: string;
  symbol: string;
  flag: string;
  amountFC: number;          // amount in foreign currency
  purchaseRateToUSD: number; // 1 USD = X FC at purchase time
  usdSpent: number;
  roundPurchased: number;
}

export interface RoundResult {
  currencyCode: string;
  currencyName: string;
  countryName: string;
  symbol: string;
  flag: string;
  amountFC: number;
  usdSpent: number;
  purchaseRateToUSD: number;
  newRateToUSD: number;
  rateChangePct: number;    // % change in the rate number
  currencyChangePct: number; // % change in currency value (inverse of rate)
  newUSDValue: number;
  pnl: number;
  pnlPct: number;
}

export type GamePhase = 'investing' | 'outcome';
