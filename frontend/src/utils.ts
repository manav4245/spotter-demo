import { TimelineEntry } from './types';

export function formatDuration(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function getUniqueDates(timeline: TimelineEntry[]): string[] {
    const dates = new Set<string>();
    for (const e of timeline) {
        dates.add(e.start.split('T')[0]);
        dates.add(e.end.split('T')[0]);
    }
    return Array.from(dates).sort();
}

export function getDayMiles(timeline: TimelineEntry[], dateISO: string, totalMiles: number): number {
    const dayStart = new Date(dateISO + 'T00:00:00').getTime();
    const dayEnd = new Date(dateISO + 'T24:00:00').getTime();
    let dayDriving = 0;
    let totalDriving = 0;

    for (const e of timeline) {
        if (!e.is_driving) continue;
        totalDriving += e.duration_minutes;
        const s = new Date(e.start).getTime();
        const en = new Date(e.end).getTime();
        if (s < dayEnd && en > dayStart) {
            const cs = Math.max(s, dayStart);
            const ce = Math.min(en, dayEnd);
            dayDriving += (ce - cs) / 60000;
        }
    }

    return totalDriving === 0 ? 0 : (dayDriving / totalDriving) * totalMiles;
}

export function interpolatePolyline(
    polyline: [number, number][],
    totalMiles: number,
    targetMile: number
): [number, number] | null {
    if (!polyline.length || totalMiles === 0) return null;
    const frac = Math.min(1, Math.max(0, targetMile / totalMiles));
    const raw = frac * (polyline.length - 1);
    const i = Math.floor(raw);
    const t = raw - i;
    if (i >= polyline.length - 1) return polyline[polyline.length - 1];
    const [lat1, lon1] = polyline[i];
    const [lat2, lon2] = polyline[i + 1];
    return [lat1 + t * (lat2 - lat1), lon1 + t * (lon2 - lon1)];
}
