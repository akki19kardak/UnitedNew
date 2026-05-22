// IndiaMap.jsx — React-Leaflet + Mappls Tile Layer (correct Indian political map)
import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";

// Fix Leaflet default marker icon broken by Vite bundling
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const MAPPLS_KEY = import.meta.env.VITE_MAPPLS_KEY || "7790ee75403bdda0e09c4b54165453d0";

const MARKER_COLORS = {
  ngo:      "#2563eb",
  campaign: "#9333ea",
  donor:    "#16a34a",
  default:  "#dc2626",
};

const makeIcon = (color) =>
  L.divIcon({
    className: "",
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="42" viewBox="0 0 30 42">
      <path d="M15 0C6.716 0 0 6.716 0 15c0 10.5 15 27 15 27S30 25.5 30 15C30 6.716 23.284 0 15 0z"
        fill="${color}" stroke="white" stroke-width="2"/>
      <circle cx="15" cy="15" r="6" fill="white"/>
    </svg>`,
    iconSize:    [30, 42],
    iconAnchor:  [15, 42],
    popupAnchor: [0, -42],
  });

// Fixes map rendering inside flex/hidden containers
const InvalidateOnMount = () => {
  const map = useMap();
  useEffect(() => { setTimeout(() => map.invalidateSize(), 100); }, [map]);
  return null;
};

const IndiaMap = ({
  markers   = [],
  height    = "500px",
  zoom      = 5,
  className = "",
}) => {
  return (
    <div
      className={`rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm ${className}`}
      style={{ height }}
    >
      <MapContainer
        center={[20.5937, 78.9629]}
        zoom={zoom}
        minZoom={4}
        maxZoom={18}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom
      >
        <InvalidateOnMount />

        {/* Mappls tile layer — correct Indian political map with proper J&K, Ladakh borders */}
        <TileLayer
          url={`https://apis.mappls.com/advancedmaps/v1/${MAPPLS_KEY}/still_map/{z}/{x}/{y}.png`}
          attribution='&copy; <a href="https://mappls.com">Mappls</a> | MapmyIndia'
          maxZoom={18}
          tileSize={256}
        />

        {markers.map((marker, i) => {
          if (!marker.lat || !marker.lng) return null;
          const color = MARKER_COLORS[marker.type] || MARKER_COLORS.default;
          return (
            <Marker
              key={i}
              position={[marker.lat, marker.lng]}
              icon={makeIcon(color)}
              eventHandlers={{ click: () => marker.onClick?.() }}
            >
              <Popup>
                <div style={{ minWidth: 150 }}>
                  {marker.title && (
                    <p style={{ fontWeight: 700, fontSize: 13, margin: "0 0 4px", color: "#0f172a" }}>
                      {marker.title}
                    </p>
                  )}
                  {marker.subtitle && (
                    <p style={{ fontSize: 11, color: "#64748b", margin: "0 0 4px" }}>
                      {marker.subtitle}
                    </p>
                  )}
                  {marker.type && (
                    <span style={{
                      display: "inline-block", marginTop: 4, padding: "2px 8px",
                      borderRadius: 99, fontSize: 10, fontWeight: 700,
                      color: "white", background: color, textTransform: "capitalize",
                    }}>
                      {marker.type}
                    </span>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default IndiaMap;
