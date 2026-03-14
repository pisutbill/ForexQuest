import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        {/* Logo */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-blue-600 text-white text-4xl font-bold mb-6 shadow-lg shadow-blue-900/40">
          FX
        </div>

        <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">ForexQuest</h1>
        <p className="text-slate-400 text-lg mb-2">Currency Trading Simulator</p>
        <p className="text-slate-500 text-sm mb-10 leading-relaxed">
          Learn how global currency markets work by trading real currencies across a world map.
          Invest your USD, watch exchange rates shift, and grow your portfolio year by year.
        </p>

        {/* Feature bullets */}
        <div className="grid grid-cols-1 gap-3 mb-10 text-left">
          {[
            { icon: '🌍', title: 'Interactive World Map', desc: 'Click any country to buy its currency' },
            { icon: '📈', title: 'Live Rate Simulation', desc: 'Exchange rates shift each round based on real volatility' },
            { icon: '💰', title: 'Portfolio Tracking', desc: 'Track your holdings, P&L, and net worth' },
            { icon: '🎓', title: 'Educational Context', desc: 'Learn why currencies rise and fall' },
          ].map((f) => (
            <div key={f.title} className="flex items-start gap-3 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3">
              <span className="text-xl">{f.icon}</span>
              <div>
                <p className="text-white font-semibold text-sm">{f.title}</p>
                <p className="text-slate-400 text-xs mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <Link
          href="/game"
          className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-base transition-colors shadow-lg shadow-blue-900/30"
        >
          Start Playing
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        <p className="text-slate-600 text-xs mt-4">Start with $10,000 USD · 5+ rounds</p>
      </div>
    </div>
  );
}
