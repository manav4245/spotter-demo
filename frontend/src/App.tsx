import React, { useState } from 'react';
import axios from 'axios';
import { Truck, MapPin, Navigation, Clock, Search, AlertCircle, Fuel, BedDouble, Coffee, Package } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

import DailyLogSheet from './components/DailyLogSheet';
import LocationSearch from './components/LocationSearch';
import { TripResult, FormData, TimelineEntry } from './types';
import { formatDuration, getUniqueDates, getDayMiles, interpolatePolyline } from './utils';

L.Marker.prototype.options.icon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const makeIcon = (color: string) =>
  new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

const MARKER_ICONS = {
  origin: makeIcon('blue'),
  pickup: makeIcon('green'),
  dropoff: makeIcon('red'),
  rest: makeIcon('violet'),
  fuel: makeIcon('orange'),
  break: makeIcon('yellow'),
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  Driving: <Navigation className="h-3 w-3" />,
  'Off-Duty': <BedDouble className="h-3 w-3" />,
  Sleeper: <BedDouble className="h-3 w-3" />,
  Fueling: <Fuel className="h-3 w-3" />,
  Break: <Coffee className="h-3 w-3" />,
  Pickup: <Package className="h-3 w-3" />,
  'Drop-off': <Package className="h-3 w-3" />,
};

function getStatusColor(status: string) {
  if (status.includes('Driving')) return 'bg-emerald-500';
  if (status.includes('Rest') || status.includes('Restart')) return 'bg-violet-500';
  if (status.includes('Break')) return 'bg-yellow-500';
  if (status.includes('Fueling')) return 'bg-orange-500';
  if (status.includes('Pickup') || status.includes('Drop-off')) return 'bg-blue-500';
  return 'bg-slate-400';
}

function getStatusIcon(status: string) {
  for (const [key, node] of Object.entries(STATUS_ICONS)) {
    if (status.includes(key)) return node;
  }
  return <Clock className="h-3 w-3" />;
}



const HOS_RULES = [
  { label: '11-hr Driving Limit', desc: 'Per shift', color: 'border-emerald-400' },
  { label: '14-hr Duty Window', desc: 'After coming on duty', color: 'border-blue-400' },
  { label: '30-min Break', desc: 'After 8 hrs driving', color: 'border-yellow-400' },
  { label: '70-hr / 8-day', desc: 'Cycle limit', color: 'border-violet-400' },
];

const MAP_LEGEND = [
  { color: 'bg-blue-500', label: 'Origin' },
  { color: 'bg-green-500', label: 'Pickup' },
  { color: 'bg-red-500', label: 'Dropoff' },
  { color: 'bg-violet-500', label: 'Rest Stop' },
  { color: 'bg-orange-500', label: 'Fuel Stop' },
  { color: 'bg-yellow-400', label: '30-min Break' },
];

function TripForm({
  formData,
  loading,
  onChange,
  onSubmit,
}: {
  formData: FormData;
  loading: boolean;
  onChange: (data: FormData) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <h2 className="text-lg font-bold mb-5 flex items-center gap-2 text-[#00414B]">
        <Search className="h-5 w-5 text-[#FF6F61]" />
        Trip Parameters
      </h2>
      <form onSubmit={onSubmit} className="space-y-4">
        <LocationSearch
          label="Current Location"
          value={formData.currentLocation}
          placeholder="e.g. Chicago, IL"
          icon={<MapPin className="h-4 w-4 text-blue-400" />}
          onChange={v => onChange({ ...formData, currentLocation: v })}
        />
        <LocationSearch
          label="Pickup Location"
          value={formData.pickupLocation}
          placeholder="e.g. St. Louis, MO"
          icon={<Package className="h-4 w-4 text-green-500" />}
          onChange={v => onChange({ ...formData, pickupLocation: v })}
        />
        <LocationSearch
          label="Dropoff Location"
          value={formData.dropoffLocation}
          placeholder="e.g. Dallas, TX"
          icon={<MapPin className="h-4 w-4 text-red-400" />}
          onChange={v => onChange({ ...formData, dropoffLocation: v })}
        />

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">
            Current Cycle Used (Hours)
          </label>
          <div className="relative">
            <Clock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="number"
              min={0}
              max={70}
              step={0.5}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#00414B] focus:border-transparent transition-all"
              value={formData.cycleUsed}
              onChange={e => onChange({ ...formData, cycleUsed: parseFloat(e.target.value) })}
            />
          </div>
          <div className="mt-1.5 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-orange-400 rounded-full transition-all"
              style={{ width: `${(formData.cycleUsed / 70) * 100}%` }}
            />
          </div>
          <div className="text-xs text-slate-400 mt-1">{formData.cycleUsed} / 70 hrs used</div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#00414B] text-white py-3 rounded-xl font-bold hover:bg-[#005a67] transition-all flex items-center justify-center gap-2 mt-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Geocoding & Routing...
            </>
          ) : (
            <>
              <Navigation className="h-4 w-4" />
              Calculate HOS Route
            </>
          )}
        </button>
      </form>
    </div>
  );
}

function TripSummary({ result, dates, cycleUsed }: { result: TripResult; dates: string[]; cycleUsed: number }) {
  const drivingMins = result.timeline
    .filter(e => e.status.includes('Driving'))
    .reduce((sum, e) => sum + e.duration_minutes, 0);
  const restMins = result.timeline
    .filter(e => e.status.includes('Rest') || e.status.includes('Restart'))
    .reduce((sum, e) => sum + e.duration_minutes, 0);
  const fuelStops = result.timeline.filter(e => e.status.includes('Fueling')).length;
  const cycleRemaining = Math.max(0, 70 - cycleUsed - drivingMins / 60);

  const stats = [
    { label: 'Total Distance', value: `${result.distance_miles.toFixed(0)} mi`, color: 'text-[#00414B]' },
    { label: 'Total Days', value: `${dates.length} day${dates.length !== 1 ? 's' : ''}`, color: 'text-blue-600' },
    { label: 'Drive Time', value: formatDuration(drivingMins), color: 'text-emerald-600' },
    { label: 'Rest Time', value: formatDuration(restMins), color: 'text-violet-600' },
    { label: 'Fuel Stops', value: String(fuelStops), color: 'text-orange-600' },
    { label: 'Cycle Remaining', value: `${cycleRemaining.toFixed(1)} hrs`, color: 'text-slate-600' },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
      <h3 className="font-bold text-[#00414B] mb-4 text-sm uppercase tracking-wide">Trip Summary</h3>
      <div className="grid grid-cols-2 gap-3">
        {stats.map(({ label, value, color }) => (
          <div key={label} className="bg-slate-50 rounded-lg p-3">
            <div className="text-xs text-slate-400 font-medium">{label}</div>
            <div className={`text-lg font-bold ${color}`}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TimelinePanel({ timeline }: { timeline: TimelineEntry[] }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 max-h-96 overflow-y-auto">
      <h3 className="font-bold text-[#00414B] mb-4 text-sm uppercase tracking-wide sticky top-0 bg-white pb-2 border-b border-slate-100">
        Duty Timeline ({timeline.length} entries)
      </h3>
      <div className="space-y-2">
        {timeline.map((item, idx) => (
          <div key={idx} className="flex gap-3 items-start">
            <div className={`mt-1 h-2.5 w-2.5 rounded-full flex-shrink-0 ${getStatusColor(item.status)}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">{getStatusIcon(item.status)}</span>
                <p className="font-semibold text-slate-800 text-xs truncate">{item.status}</p>
              </div>
              <p className="text-xs text-slate-400">
                {new Date(item.start).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                {' → '}
                {new Date(item.end).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="text-xs text-slate-400">
                {formatDuration(item.duration_minutes)}
                {item.mile_marker != null ? ` · Mile ${item.mile_marker.toFixed(0)}` : ''}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RouteMap({ result }: { result: TripResult | null }) {
  const center: [number, number] = result?.polyline?.length
    ? result.polyline[Math.floor(result.polyline.length / 2)]
    : [39.8283, -98.5795];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative" style={{ minHeight: 500 }}>
      <MapContainer
        key={result ? `${result.origin.lat}-${result.dropoff.lat}` : 'default'}
        center={center}
        zoom={result ? 5 : 4}
        scrollWheelZoom
        style={{ height: 500, width: '100%', zIndex: 0 }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {result && (
          <>
            <Polyline positions={result.polyline} color="#00414B" weight={5} opacity={0.8} />

            <Marker position={[result.origin.lat, result.origin.lon]} icon={MARKER_ICONS.origin}>
              <Popup><b className="text-blue-700">🚛 Origin</b><br />{result.origin.label}</Popup>
            </Marker>

            <Marker position={[result.pickup.lat, result.pickup.lon]} icon={MARKER_ICONS.pickup}>
              <Popup>
                <b className="text-green-700">📦 Pickup</b><br />
                {result.pickup.label}<br />
                <span className="text-xs text-gray-500">1 hour stop</span>
              </Popup>
            </Marker>

            <Marker position={[result.dropoff.lat, result.dropoff.lon]} icon={MARKER_ICONS.dropoff}>
              <Popup>
                <b className="text-red-700">🏁 Dropoff</b><br />
                {result.dropoff.label}<br />
                <span className="text-xs text-gray-500">1 hour stop</span>
              </Popup>
            </Marker>

            {result.timeline.map((item, idx) => {
              if (item.mile_marker == null) return null;

              let markerIcon: L.Icon | null = null;
              let label = '';

              if (item.status.includes('10hr Rest') || item.status.includes('34hr Restart')) {
                markerIcon = MARKER_ICONS.rest;
                label = '😴 Rest Stop';
              } else if (item.status.includes('Fueling')) {
                markerIcon = MARKER_ICONS.fuel;
                label = '⛽ Fuel Stop';
              } else if (item.status.includes('30min Break')) {
                markerIcon = MARKER_ICONS.break;
                label = '☕ 30-min Break';
              } else {
                return null;
              }

              const pos = interpolatePolyline(result.polyline, result.distance_miles, item.mile_marker);
              if (!pos) return null;

              return (
                <Marker key={idx} position={pos} icon={markerIcon}>
                  <Popup>
                    <b>{label}</b><br />
                    {item.status}<br />
                    <span className="text-xs text-gray-500">
                      {formatDuration(item.duration_minutes)} · Mile ~{item.mile_marker.toFixed(0)}
                    </span>
                  </Popup>
                </Marker>
              );
            })}
          </>
        )}
      </MapContainer>

      {result && (
        <div className="absolute bottom-4 right-4 bg-white rounded-xl shadow-lg border border-slate-200 p-3 z-[1000] text-xs space-y-1.5">
          <div className="font-bold text-slate-600 mb-2">Legend</div>
          {MAP_LEGEND.map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`h-2.5 w-2.5 rounded-full ${color}`} />
              <span className="text-slate-600">{label}</span>
            </div>
          ))}
        </div>
      )}

      {!result && (
        <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[2px] flex items-center justify-center z-10">
          <div className="bg-white p-8 rounded-3xl shadow-2xl border border-slate-100 text-center max-w-sm">
            <Truck className="h-16 w-16 text-[#FF6F61] mx-auto mb-4 animate-bounce" />
            <h3 className="text-2xl font-bold text-[#00414B] mb-2">Ready to Plan?</h3>
            <p className="text-slate-500 text-sm">
              Enter your trip details to generate an HOS-compliant route with rest stops, fuel stops, and ELD log sheets.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

const DEFAULT_FORM: FormData = {
  currentLocation: 'Chicago, IL',
  pickupLocation: 'St. Louis, MO',
  dropoffLocation: 'Dallas, TX',
  cycleUsed: 10,
};

export default function App() {
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM);
  const [result, setResult] = useState<TripResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const base = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const { data } = await axios.post<TripResult>(`${base}/api/calculate-trip/`, {
        current_location: formData.currentLocation,
        pickup_location: formData.pickupLocation,
        dropoff_location: formData.dropoffLocation,
        current_cycle_used: formData.cycleUsed,
      });
      setResult(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to calculate trip. Check your locations and try again.');
    } finally {
      setLoading(false);
    }
  };

  const dates = result ? getUniqueDates(result.timeline) : [];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      <header className="bg-[#00414B] text-white px-6 py-4 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Truck className="text-[#FF6F61] h-9 w-9" />
          <div>
            <div className="text-2xl font-black tracking-tight">
              SPOTTER <span className="text-[#FF6F61] font-light italic text-lg">Logistics</span>
            </div>
            <div className="text-xs text-slate-300 font-medium tracking-widest uppercase">
              HOS Engine · ELD Log Generator
            </div>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm text-slate-300">
          <span>70 hr / 8-day Cycle</span>
          <span className="w-px h-4 bg-slate-600" />
          <span>Property-Carrying Driver</span>
          <span className="w-px h-4 bg-slate-600" />
          <span>FMCSA Compliant</span>
        </div>
      </header>

      <main className="flex-1 container mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 flex flex-col gap-5">
          <TripForm formData={formData} loading={loading} onChange={setFormData} onSubmit={handleSubmit} />

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start gap-3 text-sm">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {result && <TripSummary result={result} dates={dates} cycleUsed={formData.cycleUsed} />}
          {result && <TimelinePanel timeline={result.timeline} />}
        </div>

        <div className="lg:col-span-2 flex flex-col gap-5">
          <RouteMap result={result} />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {HOS_RULES.map(({ label, desc, color }) => (
              <div key={label} className={`bg-white rounded-xl p-3 border-l-4 ${color} shadow-sm border border-slate-200`}>
                <div className="text-xs font-bold text-slate-700">{label}</div>
                <div className="text-xs text-slate-400 mt-0.5">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {result && dates.length > 0 && (
        <section className="container mx-auto px-4 md:px-6 pb-12 mt-4">
          <div className="border-t border-slate-300 pt-8">
            <h2 className="text-2xl font-black text-[#00414B] mb-2 flex items-center gap-3">
              <Truck className="text-[#FF6F61] h-7 w-7" />
              ELD Daily Log Sheets
            </h2>
            <p className="text-slate-500 text-sm mb-8">
              {dates.length} log sheet{dates.length !== 1 ? 's' : ''} generated · FMCSA Driver's Daily Log format · 70-hr/8-day property-carrying driver
            </p>
            <div className="flex flex-col items-center gap-0">
              {dates.map((dateISO, idx) => (
                <DailyLogSheet
                  key={dateISO}
                  date={new Date(dateISO + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  dateISO={dateISO}
                  timeline={result.timeline}
                  totalMiles={result.distance_miles}
                  dayMiles={getDayMiles(result.timeline, dateISO, result.distance_miles)}
                  carrier="Spotter Logistics Inc."
                  truckNumber="TRK-2026-001"
                  fromLocation={result.origin.label}
                  toLocation={result.dropoff.label}
                  sheetNumber={idx + 1}
                  totalSheets={dates.length}
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
