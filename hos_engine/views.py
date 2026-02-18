import requests
import datetime
import traceback
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .utils import calculate_trip


NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
OSRM_URL = "https://router.project-osrm.org/route/v1/driving"
HEADERS = {"User-Agent": "SpotterHOSApp/1.0"}


def geocode(location):
    resp = requests.get(
        NOMINATIM_URL,
        params={"q": location, "format": "json", "limit": 1},
        headers=HEADERS,
        timeout=10,
    )
    resp.raise_for_status()
    results = resp.json()
    if not results:
        raise ValueError(f"Location not found: '{location}'")
    return float(results[0]["lat"]), float(results[0]["lon"])


def get_route(origin, pickup, dropoff):
    waypoints = ";".join(f"{lon},{lat}" for lat, lon in [origin, pickup, dropoff])
    resp = requests.get(
        f"{OSRM_URL}/{waypoints}",
        params={"overview": "full", "geometries": "geojson", "steps": "false"},
        headers=HEADERS,
        timeout=30,
    )
    resp.raise_for_status()
    data = resp.json()

    if data.get("code") != "Ok":
        raise ValueError(f"Routing failed: {data.get('message', 'unknown error')}")

    route = data["routes"][0]
    distance_miles = route["distance"] / 1609.344
    polyline = [[c[1], c[0]] for c in route["geometry"]["coordinates"]]
    waypoint_coords = [(wp["location"][1], wp["location"][0]) for wp in data["waypoints"]]

    return distance_miles, polyline, waypoint_coords


class CalculateTripView(APIView):
    def post(self, request):
        current_location = request.data.get("current_location", "").strip()
        pickup_location = request.data.get("pickup_location", "").strip()
        dropoff_location = request.data.get("dropoff_location", "").strip()
        current_cycle_used = float(request.data.get("current_cycle_used", 0))

        if not all([current_location, pickup_location, dropoff_location]):
            return Response(
                {"error": "current_location, pickup_location, and dropoff_location are all required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            origin_coords = geocode(current_location)
            pickup_coords = geocode(pickup_location)
            dropoff_coords = geocode(dropoff_location)

            distance_miles, polyline, _ = get_route(origin_coords, pickup_coords, dropoff_coords)

            start_time = datetime.datetime.utcnow().replace(
                hour=8, minute=0, second=0, microsecond=0
            ).isoformat()

            timeline = calculate_trip(
                distance_miles=distance_miles,
                current_cycle_used=current_cycle_used,
                start_time_str=start_time,
            )

            return Response({
                "timeline": timeline,
                "distance_miles": round(distance_miles, 1),
                "polyline": polyline,
                "origin": {"lat": origin_coords[0], "lon": origin_coords[1], "label": current_location},
                "pickup": {"lat": pickup_coords[0], "lon": pickup_coords[1], "label": pickup_location},
                "dropoff": {"lat": dropoff_coords[0], "lon": dropoff_coords[1], "label": dropoff_location},
            }, status=status.HTTP_200_OK)

        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except requests.RequestException as e:
            return Response({"error": f"External API error: {str(e)}"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception as e:
            return Response({"error": str(e), "traceback": traceback.format_exc()}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
