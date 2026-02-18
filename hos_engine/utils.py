import datetime
from datetime import timedelta


AVG_SPEED_MPH = 55
MAX_DRIVING_HOURS = 11
MAX_DUTY_WINDOW_HOURS = 14
BREAK_AFTER_HOURS = 8
BREAK_DURATION_MINUTES = 30
REST_DURATION_HOURS = 10
CYCLE_LIMIT_HOURS = 70
FUEL_INTERVAL_MILES = 1000
FUEL_STOP_MINUTES = 30
STOP_DURATION_HOURS = 1


def calculate_trip(distance_miles, current_cycle_used, start_time_str):
    start_time = datetime.datetime.fromisoformat(start_time_str)
    current_time = start_time
    timeline = []

    def add_entry(status, duration_minutes, mile_marker=None, is_driving=False):
        nonlocal current_time
        end_time = current_time + timedelta(minutes=duration_minutes)
        timeline.append({
            "status": status,
            "start": current_time.isoformat(),
            "end": end_time.isoformat(),
            "duration_minutes": round(duration_minutes, 2),
            "mile_marker": round(mile_marker, 1) if mile_marker is not None else None,
            "is_driving": is_driving,
        })
        current_time = end_time

    remaining = distance_miles
    driving_window = 0.0
    duty_window = 0.0
    since_break = 0.0
    cycle_used = float(current_cycle_used)
    since_fuel = 0.0
    miles_done = 0.0

    add_entry("On-Duty (Pickup)", STOP_DURATION_HOURS * 60, mile_marker=0)
    duty_window += STOP_DURATION_HOURS
    cycle_used += STOP_DURATION_HOURS

    guard = 0
    while remaining > 0.01:
        guard += 1
        if guard > 5000:
            break

        drivable = min(
            max(0, MAX_DRIVING_HOURS - driving_window),
            max(0, MAX_DUTY_WINDOW_HOURS - duty_window),
            max(0, BREAK_AFTER_HOURS - since_break),
            max(0, CYCLE_LIMIT_HOURS - cycle_used),
            (FUEL_INTERVAL_MILES - since_fuel) / AVG_SPEED_MPH,
            remaining / AVG_SPEED_MPH,
        )

        if drivable > 0.001:
            miles = drivable * AVG_SPEED_MPH
            add_entry("Driving", drivable * 60, mile_marker=miles_done, is_driving=True)
            remaining -= miles
            since_fuel += miles
            miles_done += miles
            driving_window += drivable
            duty_window += drivable
            since_break += drivable
            cycle_used += drivable

        if remaining <= 0.01:
            break

        if cycle_used >= CYCLE_LIMIT_HOURS - 0.001:
            add_entry("Off-Duty (34hr Restart)", 34 * 60, mile_marker=miles_done)
            driving_window = duty_window = since_break = cycle_used = 0
            continue

        if driving_window >= MAX_DRIVING_HOURS - 0.001 or duty_window >= MAX_DUTY_WINDOW_HOURS - 0.001:
            add_entry("Off-Duty (10hr Rest)", REST_DURATION_HOURS * 60, mile_marker=miles_done)
            driving_window = duty_window = since_break = 0
            continue

        if since_break >= BREAK_AFTER_HOURS - 0.001:
            add_entry("Off-Duty (30min Break)", BREAK_DURATION_MINUTES, mile_marker=miles_done)
            since_break = 0
            duty_window += BREAK_DURATION_MINUTES / 60
            continue

        if since_fuel >= FUEL_INTERVAL_MILES - 0.1:
            add_entry("On-Duty (Fueling)", FUEL_STOP_MINUTES, mile_marker=miles_done)
            since_fuel = 0
            duty_window += FUEL_STOP_MINUTES / 60
            cycle_used += FUEL_STOP_MINUTES / 60
            continue

        break

    add_entry("On-Duty (Drop-off)", STOP_DURATION_HOURS * 60, mile_marker=miles_done)
    return timeline
