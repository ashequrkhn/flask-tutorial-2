// React Leaflet and Leaflet core imports
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// React imports
import { useEffect, useRef, useState } from "react";

// Fixing broken Leaflet default marker URLs (because Vite doesn't bundle them properly)
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Override default icon paths to ensure markers render correctly
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Props for the SearchBar component
type SearchBarProps = {
  onSearch: (coords: [number, number], label: string) => void;
};

// 🔍 Search bar component using Nominatim API for location suggestions
function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced fetch to OpenStreetMap's Nominatim API based on query input
  useEffect(() => {
    if (!query) {
      setSuggestions([]);
      return;
    }

    // Clear existing timeout to debounce input
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    // Wait 300ms after typing before firing API call
    timeoutRef.current = setTimeout(async () => {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(
          query
        )}`
      );

      const data = await res.json();
      console.log(
        "Suggestions address:",
        data[0].address,
        "\n",
        "Query:",
        query
      );
      setSuggestions(data.slice(0, 5)); // Limit suggestions to 5
    }, 300);
  }, [query]);

  // Handle suggestion click
  const handleSelect = (item: any) => {
    const coords: [number, number] = [
      parseFloat(item.lat),
      parseFloat(item.lon),
    ];

    onSearch(coords, item.display_name);

    setSuggestions([]);
    setQuery(item.display_name);
    console.log("items", item);
  };

  return (
    <div className="search-container">
      <input
        ref={inputRef}
        type="text"
        value={query}
        placeholder="Search address..."
        onChange={(e) => setQuery(e.target.value)}
        className="search-input"
      />
      {suggestions.length > 0 && (
        <ul className="search-suggestions">
          {suggestions.map((item, index) => (
            <li
              key={index}
              onClick={() => handleSelect(item)}
              className="suggestion-item"
            >
              {item.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// 📍 Handles user clicking on the map
function MapClickHandler({
  onClick,
}: {
  onClick: (latlng: [number, number]) => void;
}) {
  useMapEvents({
    click(e) {
      onClick([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

// 🗺️ Animates camera movement when map center changes
function MapFlyTo({ coords }: { coords: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(coords, 15); // Zoom level 15 for good detail
  }, [coords]);
  return null;
}

async function getAddressFromCoords(coords: [number, number]) {
  const data = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords[0]}&lon=${coords[1]}&addressdetails=1`
  );
  const res = await data.json();
  return res.display_name || "Unknown location";
}

// 🧠 Main Map Component
const Maps = () => {
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(
    null
  );
  const [markerLabel, setMarkerLabel] = useState<string>("You clicked here");
  const [mapCenter, setMapCenter] = useState<[number, number]>([
    -33.8688,
    151.2093, // Default to Sydney
  ]);

  // 🔄 Send coordinates to Flask backend
  const sendCoordinatesToBackend = async (coords: [number, number]) => {
    try {
      const res = await fetch("http://localhost:5000/api/coordinates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          latitude: coords[0],
          longitude: coords[1],
        }),
      });

      const data = await res.json();
      console.log("Flask response:", data);
      alert("Location submitted successfully!");
    } catch (err) {
      console.error("Failed to send coordinates:", err);
      alert("Something went wrong.");
    }
  };

  // 📌 Gets user's current location from the browser
  const handleMyLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: [number, number] = [
          position.coords.latitude,
          position.coords.longitude,
        ];
        setMarkerPosition(coords);
        setMapCenter(coords);
        setMarkerLabel("You are here");
      },
      (error) => {
        console.error(error);
        alert("Unable to retrieve your location.");
      }
    );
  };

  return (
    <div className="flex-container">
      {/* Search bar for address lookup */}
      <SearchBar
        onSearch={(coords, label) => {
          setMarkerPosition(coords);
          setMapCenter(coords);
          setMarkerLabel(label);
        }}
      />

      {/* Button to get user's current GPS location */}
      <button onClick={handleMyLocation} className="location-button">
        📍 My Location
      </button>

      {/* Button to send selected location to backend */}
      <button
        onClick={() => {
          if (!markerPosition) {
            alert("No marker selected!");
            return;
          }
          sendCoordinatesToBackend(markerPosition);
        }}
        className="submit-button"
      >
        Submit Location
      </button>

      {/* Main Leaflet Map */}
      <div className="map">
        <MapContainer
          center={mapCenter}
          zoom={13}
          scrollWheelZoom={true}
          style={{ width: "100%", height: "100%" }}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Handles clicking on the map */}
          <MapClickHandler
            onClick={(coords) => {
              setMarkerPosition(coords);
              setMarkerLabel("You clicked here");
            }}
          />

          {/* Smooth fly-to animation on location change */}
          <MapFlyTo coords={mapCenter} />

          {/* Show marker and popup if marker exists */}
          {markerPosition && (
            <Marker position={markerPosition}>
              <Popup>
                {markerLabel}
                <br />
                Lat: {markerPosition[0].toFixed(4)} <br />
                Lng: {markerPosition[1].toFixed(4)}
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
    </div>
  );
};

export default Maps;
