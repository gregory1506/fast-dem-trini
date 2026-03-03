import requests
import json
import os

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

def fetch_and_save(query, filename):
    print(f"Fetching {filename}...")
    try:
        response = requests.post(OVERPASS_URL, data={'data': query})
        if response.status_code == 200:
            data = response.json()
            features = []
            for element in data.get('elements', []):
                geometry = []
                if element['type'] == 'way':
                    if 'geometry' in element:
                        geometry = [[node['lon'], node['lat']] for node in element['geometry']]
                    
                    # For buildings, make it a Polygon if closed
                    if filename == 'buildings.geojson' and len(geometry) >= 4 and geometry[0] == geometry[-1]:
                        features.append({
                            "type": "Feature",
                            "properties": element.get('tags', {}),
                            "geometry": {
                                "type": "Polygon",
                                "coordinates": [geometry]
                            }
                        })
                    elif len(geometry) >= 2:
                        features.append({
                            "type": "Feature",
                            "properties": element.get('tags', {}),
                            "geometry": {
                                "type": "LineString",
                                "coordinates": geometry
                            }
                        })
                        
            geojson = {
                "type": "FeatureCollection",
                "features": features
            }
            
            filepath = os.path.join("public", filename)
            with open(filepath, 'w') as f:
                json.dump(geojson, f)
            print(f"Saved {filename} with {len(features)} features")
        else:
            print(f"Failed to fetch {filename}: {response.status_code}")
    except Exception as e:
        print(f"Error fetching {filename}: {e}")

# Major roads in Trinidad
query_roads = """
[out:json][timeout:25];
area["ISO3166-1"="TT"][admin_level=2]->.searchArea;
(
  way["highway"~"motorway|trunk|primary"](area.searchArea);
);
out geom;
"""

# Rivers in Trinidad
query_rivers = """
[out:json][timeout:25];
area["ISO3166-1"="TT"][admin_level=2]->.searchArea;
(
  way["waterway"~"river"](area.searchArea);
);
out geom;
"""

# All Buildings in Trinidad (increased timeout as it's a larger dataset)
query_buildings = """
[out:json][timeout:180];
area["ISO3166-1"="TT"][admin_level=2]->.searchArea;
(
  way["building"](area.searchArea);
);
out geom;
"""

# Create public directory if it doesn't exist
os.makedirs("public", exist_ok=True)

fetch_and_save(query_roads, "roads.geojson")
fetch_and_save(query_rivers, "rivers.geojson")
fetch_and_save(query_buildings, "buildings.geojson")
