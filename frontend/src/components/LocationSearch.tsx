import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Loader2 } from 'lucide-react';

interface Suggestion {
    place_id: number;
    display_name: string;
    lat: string;
    lon: string;
}

interface LocationSearchProps {
    label: string;
    value: string;
    placeholder?: string;
    icon?: React.ReactNode;
    onChange: (value: string) => void;
}

const NOMINATIM = 'https://nominatim.openstreetmap.org/search';

function useDebounce<T>(value: T, delay: number): T {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);
    return debounced;
}

export default function LocationSearch({ label, value, placeholder, icon, onChange }: LocationSearchProps) {
    const [query, setQuery] = useState(value);
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [activeIdx, setActiveIdx] = useState(-1);

    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const abortRef = useRef<AbortController | null>(null);

    const debouncedQuery = useDebounce(query, 300);

    // Sync external value changes (e.g. form reset)
    useEffect(() => {
        setQuery(value);
    }, [value]);

    // Fetch suggestions whenever debounced query changes
    useEffect(() => {
        if (debouncedQuery.length < 3) {
            setSuggestions([]);
            setOpen(false);
            return;
        }

        abortRef.current?.abort();
        abortRef.current = new AbortController();

        setLoading(true);
        fetch(
            `${NOMINATIM}?q=${encodeURIComponent(debouncedQuery)}&format=json&limit=6&addressdetails=1&countrycodes=us`,
            {
                signal: abortRef.current.signal,
                headers: { 'Accept-Language': 'en' },
            }
        )
            .then(r => r.json())
            .then((data: Suggestion[]) => {
                setSuggestions(data);
                setOpen(data.length > 0);
                setActiveIdx(-1);
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [debouncedQuery]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const select = useCallback((s: Suggestion) => {
        // Use a short, clean label: first two parts of display_name
        const parts = s.display_name.split(', ');
        const short = parts.slice(0, 3).join(', ');
        setQuery(short);
        onChange(short);
        setSuggestions([]);
        setOpen(false);
        setActiveIdx(-1);
    }, [onChange]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!open) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIdx(i => Math.min(i + 1, suggestions.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIdx(i => Math.max(i - 1, 0));
        } else if (e.key === 'Enter' && activeIdx >= 0) {
            e.preventDefault();
            select(suggestions[activeIdx]);
        } else if (e.key === 'Escape') {
            setOpen(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value);
        onChange(e.target.value);
    };

    // Format suggestion for display — bold the matching part
    const formatSuggestion = (s: Suggestion) => {
        const parts = s.display_name.split(', ');
        const primary = parts.slice(0, 2).join(', ');
        const secondary = parts.slice(2, 5).join(', ');
        return { primary, secondary };
    };

    return (
        <div ref={containerRef} className="relative">
            <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">
                {label}
            </label>
            <div className="relative">
                <span className="absolute left-3 top-2.5 pointer-events-none">
                    {icon ?? <MapPin className="h-4 w-4 text-slate-400" />}
                </span>
                <input
                    ref={inputRef}
                    type="text"
                    className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#00414B] focus:border-transparent outline-none transition-all"
                    placeholder={placeholder ?? 'Search location...'}
                    value={query}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => suggestions.length > 0 && setOpen(true)}
                    autoComplete="off"
                    required
                />
                {loading && (
                    <Loader2 className="absolute right-3 top-2.5 h-4 w-4 text-slate-400 animate-spin" />
                )}
            </div>

            {open && suggestions.length > 0 && (
                <ul className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                    {suggestions.map((s, i) => {
                        const { primary, secondary } = formatSuggestion(s);
                        return (
                            <li
                                key={s.place_id}
                                className={`flex items-start gap-3 px-3 py-2.5 cursor-pointer transition-colors ${i === activeIdx ? 'bg-[#00414B]/10' : 'hover:bg-slate-50'
                                    }`}
                                onMouseDown={() => select(s)}
                                onMouseEnter={() => setActiveIdx(i)}
                            >
                                <MapPin className="h-4 w-4 text-[#FF6F61] flex-shrink-0 mt-0.5" />
                                <div className="min-w-0">
                                    <div className="text-sm font-medium text-slate-800 truncate">{primary}</div>
                                    {secondary && (
                                        <div className="text-xs text-slate-400 truncate">{secondary}</div>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
