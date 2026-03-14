'use client';

import { useState } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { Holding } from '@/types/game';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

// Natural Earth (GeoJSON) country names that differ from the DB country names
const GEO_TO_DB_NAME: Record<string, string> = {
  'Ivory Coast': "Côte d'Ivoire",
  'Dem. Rep. Congo': 'Congo',
  'Congo': 'Republic of the Congo',
  'Bosnia and Herz.': 'Bosnia and Herzegovina',
  'Central African Rep.': 'Central African Republic',
  'Dominican Rep.': 'Dominican Republic',
  'Eq. Guinea': 'Equatorial Guinea',
  'S. Sudan': 'South Sudan',
  'Czechia': 'Czech Republic',
  'Czech Rep.': 'Czech Republic',
  'Trinidad and Tob.': 'Trinidad and Tobago',
  'São Tomé and Principe': 'São Tomé and Príncipe',
  'W. Sahara': 'Western Sahara',
  'Macedonia': 'North Macedonia',
  'Swaziland': 'Eswatini',
  'Burma': 'Myanmar',
  'Lao PDR': 'Laos',
  'Viet Nam': 'Vietnam',
  'Korea': 'South Korea',
  'Timor-Leste': 'East Timor',
  'Cape Verde': 'Cape Verde',
  'Cabo Verde': 'Cape Verde',
};

interface WorldMapProps {
  selectedCountry: string | null;
  holdings: Holding[];
  countryToCurrency: Record<string, string>;
  onCountryClick: (countryName: string, currencyCode: string) => void;
}

export default function WorldMap({ selectedCountry, holdings, countryToCurrency, onCountryClick }: WorldMapProps) {
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

  const currenciesWithHoldings = new Set(holdings.map((h) => h.currencyCode));

  const resolveCountry = (geoName: string) => GEO_TO_DB_NAME[geoName] ?? geoName;

  const getCountryFill = (geoName: string, isHovered: boolean) => {
    const dbName = resolveCountry(geoName);
    const currencyCode = countryToCurrency[dbName];

    if (!currencyCode) return isHovered ? '#334155' : '#1e293b';
    if (dbName === selectedCountry) return isHovered ? '#60a5fa' : '#3b82f6';
    if (currenciesWithHoldings.has(currencyCode)) return isHovered ? '#fbbf24' : '#d97706';
    return isHovered ? '#475569' : '#334155';
  };

  return (
    <div className="relative w-full h-full bg-slate-950 rounded-xl overflow-hidden border border-slate-700/50">
      {/* Hovered country tooltip */}
      <div className="absolute top-3 left-3 z-10 pointer-events-none">
        {hoveredCountry ? (
          <div className="bg-slate-800/90 backdrop-blur border border-slate-600 rounded-lg px-3 py-2 shadow-xl">
            {(() => {
              const dbName = resolveCountry(hoveredCountry);
              const code = countryToCurrency[dbName];
              return (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">{dbName}</span>
                  {code ? (
                    <span className="text-xs text-slate-400 bg-slate-700 px-2 py-0.5 rounded font-mono">{code}</span>
                  ) : (
                    <span className="text-xs text-slate-500 italic">No tradeable currency</span>
                  )}
                </div>
              );
            })()}
          </div>
        ) : (
          <div className="bg-slate-800/70 backdrop-blur border border-slate-700 rounded-lg px-3 py-2">
            <p className="text-xs text-slate-400">Click a highlighted country to invest</p>
          </div>
        )}
      </div>

      <ComposableMap
        projection="geoNaturalEarth1"
        projectionConfig={{ scale: 155, center: [10, 10] }}
        style={{ width: '100%', height: '100%' }}
      >
        <ZoomableGroup zoom={1} minZoom={0.8} maxZoom={5}>
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const geoName: string = geo.properties.name;
                const dbName = resolveCountry(geoName);
                const currencyCode = countryToCurrency[dbName];
                const isPlayable = !!currencyCode;
                const isHovered = hoveredCountry === geoName;
                const fill = getCountryFill(geoName, isHovered);

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={fill}
                    stroke="#0f172a"
                    strokeWidth={0.5}
                    style={{
                      default: { outline: 'none' },
                      hover: { outline: 'none', cursor: isPlayable ? 'pointer' : 'default' },
                      pressed: { outline: 'none' },
                    }}
                    onClick={() => {
                      if (isPlayable) onCountryClick(dbName, currencyCode);
                    }}
                    onMouseEnter={() => setHoveredCountry(geoName)}
                    onMouseLeave={() => setHoveredCountry(null)}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-10 flex flex-col gap-1.5 pointer-events-none">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-[#334155]" />
          <span className="text-xs text-slate-400">Click to invest</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-[#d97706]" />
          <span className="text-xs text-slate-400">Currently holding</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-[#3b82f6]" />
          <span className="text-xs text-slate-400">Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-[#1e293b]" />
          <span className="text-xs text-slate-500">No currency data</span>
        </div>
      </div>

      {/* Zoom hint */}
      <div className="absolute bottom-3 right-3 z-10 pointer-events-none">
        <span className="text-xs text-slate-500">Scroll to zoom · Drag to pan</span>
      </div>
    </div>
  );
}
