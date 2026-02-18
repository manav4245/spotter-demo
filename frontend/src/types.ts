export interface TimelineEntry {
    status: string;
    start: string;
    end: string;
    duration_minutes: number;
    mile_marker?: number | null;
    is_driving?: boolean;
}

export interface LocationInfo {
    lat: number;
    lon: number;
    label: string;
}

export interface TripResult {
    timeline: TimelineEntry[];
    distance_miles: number;
    polyline: [number, number][];
    origin: LocationInfo;
    pickup: LocationInfo;
    dropoff: LocationInfo;
}

export interface FormData {
    currentLocation: string;
    pickupLocation: string;
    dropoffLocation: string;
    cycleUsed: number;
}
