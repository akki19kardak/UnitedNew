// CampaignsPage.jsx — React-Leaflet + Mappls Tile Layer (correct Indian political map)
import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import L from "leaflet";
import {
  MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents,
} from "react-leaflet";
import {
  MapPin, RefreshCw, List, Map as MapIcon, Verified,
  Leaf, Loader2, PlusCircle, X, ExternalLink,
  Search, Building2, Phone, Mail, Globe, Award,
  ChevronRight, SlidersHorizontal, ChevronDown,
  Zap, CheckCircle2, Clock, RotateCcw, Navigation,
} from "lucide-react";
import useAuth from "../contexts/useAuth";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const API         = import.meta.env.VITE_BACKEND_URL;
const MAPPLS_KEY  = import.meta.env.VITE_MAPPLS_KEY || "7790ee75403bdda0e09c4b54165453d0";
const MAPPLS_TILE = `https://apis.mappls.com/advancedmaps/v1/${MAPPLS_KEY}/still_map/{z}/{x}/{y}.png`;


const CATEGORY_ENUM = [
  "education", "health", "environment",
  "women-empowerment", "child-welfare",
  "animal-welfare", "disaster-relief", "other",
];

const CATEGORY_META = {
  education:           { label: "Education",        color: "#3b82f6" },
  health:              { label: "Healthcare",        color: "#ef4444" },
  environment:         { label: "Environment",       color: "#16a34a" },
  "women-empowerment": { label: "Women Empowerment", color: "#a855f7" },
  "child-welfare":     { label: "Child Welfare",     color: "#ec4899" },
  "animal-welfare":    { label: "Animal Welfare",    color: "#f97316" },
  "disaster-relief":   { label: "Disaster Relief",   color: "#f59e0b" },
  other:               { label: "Other",             color: "#94a3b8" },
};

const getCategoryColor = (cat) => CATEGORY_META[cat]?.color || "#3b82f6";
const getCategoryLabel = (cat) => CATEGORY_META[cat]?.label || cat;

const DEFAULT_CENTER = [20.5937, 78.9629];
const DEFAULT_ZOOM   = 5;

const DEFAULT_FILTERS = {
  status: "active", isUrgent: false, category: "",
  state: "", goalMin: "", goalMax: "", distanceKm: "",
};

const makeIcon = (color, isActive = false) =>
  L.divIcon({
    className: "",
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="${isActive ? 40 : 30}" height="${isActive ? 52 : 42}" viewBox="0 0 30 42">
      <path d="M15 0C6.716 0 0 6.716 0 15c0 10.5 15 27 15 27S30 25.5 30 15C30 6.716 23.284 0 15 0z"
        fill="${color}" stroke="white" stroke-width="2"/>
      <circle cx="15" cy="15" r="6" fill="white"/>
    </svg>`,
    iconSize:    [isActive ? 40 : 30, isActive ? 52 : 42],
    iconAnchor:  [isActive ? 20 : 15, isActive ? 52 : 42],
    popupAnchor: [0, isActive ? -52 : -42],
  });

const ProgressBar = ({ current, target }) => {
  const safe = Number(target) || 1;
  const pct  = Math.min(Math.round((Number(current) / safe) * 100), 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm font-medium">
        <span>\u20B9{Number(current || 0).toLocaleString("en-IN")} raised</span>
        <span className="text-slate-500">Goal: \u20B9{Number(safe).toLocaleString("en-IN")}</span>
      </div>
      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: "#3b82f6" }} />
      </div>
      <div className="text-xs text-slate-500 text-right">{pct}% funded</div>
    </div>
  );
};

const daysLeft = (endDate) => {
  if (!endDate) return "No deadline";
  const d = Math.ceil((new Date(endDate) - Date.now()) / 86400000);
  return d > 0 ? `${d} days left` : "Ended";
};

const Chip = ({ active, onClick, children, color }) => (
  <button onClick={onClick}
    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all
      ${active ? "text-white border-transparent shadow-sm" : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-400 hover:text-blue-600 bg-white dark:bg-slate-900"}`}
    style={active ? { backgroundColor: color || "#3b82f6", borderColor: color || "#3b82f6" } : {}}>
    {children}
  </button>
);

const MapEvents = ({ onMoveEnd }) => {
  useMapEvents({
    moveend: (e) => {
      const c = e.target.getCenter();
      onMoveEnd({ lat: c.lat, lng: c.lng, zoom: e.target.getZoom() });
    },
  });
  return null;
};

const InvalidateSize = () => {
  const map = useMap();
  useEffect(() => { setTimeout(() => map.invalidateSize(), 200); }, [map]);
  return null;
};

const FilterPanel = ({ filters, onChange, onReset, activeCount, availableStates, availableCategories }) => {
  const [open, setOpen] = useState(false);
  const set = (key, val) => onChange({ ...filters, [key]: val });
  return (
    <div className="border-b border-slate-100 dark:border-slate-800">
      <button onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Filters</span>
          {activeCount > 0 && <span className="text-xs font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded-full">{activeCount}</span>}
        </div>
        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <button onClick={(e) => { e.stopPropagation(); onReset(); }}
              className="text-xs text-blue-500 font-semibold hover:underline flex items-center gap-1">
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          )}
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </button>
      {open && (
        <div className="px-4 pb-5 space-y-5">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Status</p>
            <div className="flex flex-wrap gap-2">
              {[
                { val: "active",    label: "Active",    icon: Clock,             color: "#3b82f6" },
                { val: "completed", label: "Completed", icon: CheckCircle2,      color: "#10b981" },
                { val: "all",       label: "All",       icon: SlidersHorizontal, color: "#94a3b8" },
              ].map(({ val, label, icon: Icon, color }) => (
                <Chip key={val} active={filters.status === val} color={color} onClick={() => set("status", val)}>
                  <span className="flex items-center gap-1.5"><Icon className="w-3 h-3" />{label}</span>
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Priority</p>
            <Chip active={filters.isUrgent} color="#f97316" onClick={() => set("isUrgent", !filters.isUrgent)}>
              <span className="flex items-center gap-1.5"><Zap className="w-3 h-3" /> Urgent Only</span>
            </Chip>
          </div>
          {availableCategories.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Cause</p>
              <div className="flex flex-wrap gap-1.5">
                <Chip active={filters.category === ""} color="#3b82f6" onClick={() => set("category", "")}>All</Chip>
                {availableCategories.map((cat) => (
                  <Chip key={cat} active={filters.category === cat} color={getCategoryColor(cat)} onClick={() => set("category", cat)}>
                    {getCategoryLabel(cat)}
                  </Chip>
                ))}
              </div>
            </div>
          )}
          {availableStates.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">State</p>
              <select value={filters.state} onChange={(e) => set("state", e.target.value)}
                className="w-full text-sm bg-slate-50 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 outline-none rounded-xl py-2 px-3 font-medium cursor-pointer focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all">
                <option value="">All States</option>
                {availableStates.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Goal Amount (\u20B9)</p>
            <div className="flex items-center gap-2 mb-2">
              <input type="number" placeholder="Min" value={filters.goalMin} onChange={(e) => set("goalMin", e.target.value)}
                className="flex-1 text-sm bg-slate-50 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 outline-none rounded-xl py-2 px-3 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" />
              <span className="text-slate-400 text-sm font-bold">\u2013</span>
              <input type="number" placeholder="Max" value={filters.goalMax} onChange={(e) => set("goalMax", e.target.value)}
                className="flex-1 text-sm bg-slate-50 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 outline-none rounded-xl py-2 px-3 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: "< \u20B95L",              min: "",        max: "500000"  },
                { label: "\u20B95L\u2013\u20B920L", min: "500000",  max: "2000000" },
                { label: "\u20B920L\u2013\u20B950L",min: "2000000", max: "5000000" },
                { label: "> \u20B950L",             min: "5000000", max: ""        },
              ].map((p) => (
                <Chip key={p.label} active={filters.goalMin === p.min && filters.goalMax === p.max} color="#3b82f6"
                  onClick={() => onChange({ ...filters, goalMin: p.min, goalMax: p.max })}>
                  {p.label}
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Distance from Map Centre</p>
            <div className="flex items-center gap-2 mb-2">
              <Navigation className="w-4 h-4 text-blue-500 shrink-0" />
              <input type="number" min="1" max="5000" placeholder="e.g. 200" value={filters.distanceKm}
                onChange={(e) => set("distanceKm", e.target.value)}
                className="flex-1 text-sm bg-slate-50 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 outline-none rounded-xl py-2 px-3 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" />
              <span className="text-slate-400 text-xs font-semibold shrink-0">km</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {["50","100","250","500",""].map((val) => (
                <Chip key={val || "any"} active={filters.distanceKm === val} color="#3b82f6" onClick={() => set("distanceKm", val)}>
                  {val ? `${val} km` : "Anywhere"}
                </Chip>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const NgoModal = ({ ngo, onClose, onViewProfile }) => {
  if (!ngo) return null;
  const { name, logoUrl, city, state, email, phone, website, cause, description,
          darpanId, isVerified, totalDonations, totalDonors, totalCampaigns,
          _campaignLat, _campaignLng } = ngo;
  return (
    <>
      <div className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed z-[9999] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[94vw] max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700"
        role="dialog" aria-modal="true">
        <div className="flex items-start justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-4">
            {logoUrl
              ? <img src={logoUrl} alt={name} className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shadow" />
              : <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shadow"><Building2 className="w-8 h-8 text-blue-500" /></div>
            }
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{name}</h2>
                {isVerified && (
                  <span className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                    <Verified className="w-3 h-3" /> Verified
                  </span>
                )}
              </div>
              {(city || state) && (
                <p className="text-sm text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {[city, state].filter(Boolean).join(", ")}
                </p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-5">
          {description && <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{description}</p>}
          {darpanId && (
            <div className="flex items-center gap-2 text-sm bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3">
              <Award className="w-4 h-4 text-blue-500 shrink-0" />
              <span className="text-slate-600 dark:text-slate-400">Darpan ID: <strong className="text-slate-800 dark:text-white">{darpanId}</strong></span>
            </div>
          )}
          {cause && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Focus Area</p>
              <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full capitalize"
                style={{ backgroundColor: getCategoryColor(cause) + "22", color: getCategoryColor(cause) }}>
                {getCategoryLabel(cause)}
              </span>
            </div>
          )}
          {(totalDonations > 0 || totalDonors > 0 || totalCampaigns > 0) && (
            <div className="grid grid-cols-3 gap-3">
              {totalDonations > 0 && (
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-slate-900 dark:text-white">\u20B9{(totalDonations/100000).toFixed(1)}L</p>
                  <p className="text-xs text-slate-500 mt-0.5">Raised</p>
                </div>
              )}
              {totalDonors > 0 && (
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{totalDonors.toLocaleString("en-IN")}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Donors</p>
                </div>
              )}
              {totalCampaigns > 0 && (
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{totalCampaigns}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Campaigns</p>
                </div>
              )}
            </div>
          )}
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Contact</p>
            {email   && <a href={`mailto:${email}`}   className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400 hover:text-blue-500 transition-colors"><Mail  className="w-4 h-4 shrink-0" />{email}</a>}
            {phone   && <a href={`tel:${phone}`}       className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400 hover:text-blue-500 transition-colors"><Phone className="w-4 h-4 shrink-0" />{phone}</a>}
            {website && <a href={website} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm text-blue-500 hover:underline"><Globe className="w-4 h-4 shrink-0" />{website}</a>}
          </div>
          {_campaignLat && _campaignLng && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Campaign Zone</p>
              <div className="w-full h-44 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                <MapContainer center={[_campaignLat, _campaignLng]} zoom={13}
                  zoomControl={false} scrollWheelZoom={false} dragging={false}
                  style={{ height: "100%", width: "100%" }}>
                  <TileLayer
                    url={MAPPLS_TILE}
                    attribution='&copy; <a href="https://mappls.com">Mappls</a>'
                    maxZoom={18}
                  />
                  <Marker position={[_campaignLat, _campaignLng]} icon={makeIcon("#2563eb")} />
                </MapContainer>
              </div>
            </div>
          )}
          <button onClick={() => { onClose(); onViewProfile(ngo._id); }}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
            View Full NGO Profile <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
};

const CampaignCard = ({ campaign, isActive, onClick, onNgoClick }) => {
  const navigate = useNavigate();
  const color   = getCategoryColor(campaign.category);
  const img     = campaign.imageUrl || campaign.images?.find((i) => i.isPrimary)?.url || campaign.images?.[0]?.url;
  const ngo     = typeof campaign.ngoId === "object" ? campaign.ngoId : null;
  const ngoName = ngo?.name || "Verified NGO";
  const ngoLogo = ngo?.logoUrl || null;
  const lat     = campaign.location?.coordinates?.latitude;
  const lng     = campaign.location?.coordinates?.longitude;
  return (
    <div onClick={() => onClick(campaign)}
      className={`group border rounded-2xl overflow-hidden cursor-pointer transition-all duration-200
        ${isActive ? "border-blue-500 shadow-lg ring-2 ring-blue-500/20" : "border-slate-200 dark:border-slate-800 hover:shadow-md"}
        bg-white dark:bg-slate-900`}>
      <div className="relative h-44 bg-slate-100 dark:bg-slate-800 overflow-hidden">
        {img
          ? <img src={img} alt={campaign.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          : <div className="w-full h-full flex items-center justify-center text-slate-300"><Leaf className="w-10 h-10" /></div>
        }
        <span className="absolute bottom-3 left-3 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider" style={{ backgroundColor: color }}>{getCategoryLabel(campaign.category)}</span>
        {campaign.isUrgent && <span className="absolute top-3 left-3 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider shadow">Urgent</span>}
        {campaign.status === "completed" && <span className="absolute top-3 right-3 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider shadow">Completed</span>}
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 min-w-0">
            {ngoLogo
              ? <img src={ngoLogo} alt={ngoName} className="w-7 h-7 rounded-full object-cover shrink-0 border border-slate-200" />
              : <div className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0"><Verified className="w-4 h-4 text-blue-500" /></div>
            }
            <div className="min-w-0">
              <p className="text-[10px] text-slate-400 leading-none mb-0.5 uppercase tracking-wider font-medium">Organized by</p>
              <p className="text-sm font-bold text-slate-800 dark:text-white truncate leading-tight">{ngoName}</p>
            </div>
          </div>
          {ngo && (
            <button onClick={(e) => { e.stopPropagation(); onNgoClick({ ...ngo, _campaignLat: lat, _campaignLng: lng }); }}
              className="flex items-center gap-1.5 text-[11px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 px-2.5 py-1.5 rounded-lg transition-colors shrink-0 ml-2 whitespace-nowrap">
              <ExternalLink className="w-3 h-3" /> View NGO
            </button>
          )}
        </div>
        {campaign.location?.city && (
          <span className="text-xs text-slate-500 flex items-center gap-1 mb-2">
            <MapPin className="w-3 h-3" /> {campaign.location.city}{campaign.location.state ? `, ${campaign.location.state}` : ""}
          </span>
        )}
        <h3 className="text-base font-bold mb-1.5 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">{campaign.title}</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2 leading-relaxed">{campaign.shortDescription || campaign.description}</p>
        <div className="mb-4">
          <ProgressBar current={campaign.currentAmount || 0} target={campaign.goalAmount || 1} />
          <p className="text-xs text-slate-400 text-right mt-1">{daysLeft(campaign.endDate)}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={(e) => { e.stopPropagation(); navigate(`/donate/${campaign._id}`); }}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors">Donate</button>
          <button onClick={(e) => { e.stopPropagation(); navigate(`/campaigns/${campaign._id}?tab=volunteer`); }}
            className="flex-1 py-2.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-600 text-sm font-semibold rounded-lg transition-colors">Volunteer</button>
        </div>
      </div>
    </div>
  );
};

const CampaignsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isNGO    = user?.role === "ngo";

  const [allCampaigns,   setAllCampaigns]   = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState("");
  const [search,         setSearch]         = useState("");
  const [sortBy,         setSortBy]         = useState("newest");
  const [mobileView,     setMobileView]     = useState("list");
  const [mapCentre,      setMapCentre]      = useState({ lat: DEFAULT_CENTER[0], lng: DEFAULT_CENTER[1] });
  const [activeCampaign, setActiveCampaign] = useState(null);
  const [selectedNgo,    setSelectedNgo]    = useState(null);
  const [filters,        setFilters]        = useState(DEFAULT_FILTERS);
  const [searchAsMove,   setSearchAsMove]   = useState(false);

  const searchDebounce = useRef(null);
  const latestFetch    = useRef(0);

  const availableStates     = [...new Set(allCampaigns.map((c) => c.location?.state).filter(Boolean))].sort();
  const availableCategories = [...new Set(allCampaigns.map((c) => c.category).filter(Boolean))].filter((c) => CATEGORY_ENUM.includes(c)).sort();
  const activeFilterCount   = [
    filters.status !== DEFAULT_FILTERS.status, filters.isUrgent,
    filters.category !== "", filters.state !== "",
    filters.goalMin !== "", filters.goalMax !== "", filters.distanceKm !== "",
  ].filter(Boolean).length;

  const displayed = [...allCampaigns]
    .filter((c) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        c.title?.toLowerCase().includes(q) ||
        c.shortDescription?.toLowerCase().includes(q) ||
        c.location?.city?.toLowerCase().includes(q) ||
        (typeof c.ngoId === "object" && c.ngoId?.name?.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      if (sortBy === "funded")    return (b.currentAmount||0)/(b.goalAmount||1) - (a.currentAmount||0)/(a.goalAmount||1);
      if (sortBy === "goal_high") return (b.goalAmount||0) - (a.goalAmount||0);
      if (sortBy === "goal_low")  return (a.goalAmount||0) - (b.goalAmount||0);
      if (sortBy === "ending")    return new Date(a.endDate||0) - new Date(b.endDate||0);
      return new Date(b.createdAt||0) - new Date(a.createdAt||0);
    });

  const mappable = displayed.filter(
    (c) => c.location?.coordinates?.latitude && c.location?.coordinates?.longitude
  );

  const fetchCampaigns = useCallback(async (overrides = {}) => {
    const fetchId = ++latestFetch.current;
    setLoading(true); setError("");
    try {
      const f = { ...filters, ...overrides };
      const q = new URLSearchParams();
      if (f.status && f.status !== "all") q.append("status",   f.status);
      if (f.category)                      q.append("category", f.category);
      if (f.isUrgent)                      q.append("isUrgent", "true");
      if (f.state)                         q.append("state",    f.state);
      if (f.goalMin)                       q.append("goalMin",  f.goalMin);
      if (f.goalMax)                       q.append("goalMax",  f.goalMax);
      if (f.search)                        q.append("search",   f.search);
      if (f.distanceKm) {
        q.append("lat", f.lat ?? mapCentre.lat);
        q.append("lng", f.lng ?? mapCentre.lng);
        q.append("distanceKm", f.distanceKm);
      }
      const res  = await axios.get(`${API}/campaigns?${q.toString()}`);
      if (fetchId !== latestFetch.current) return;
      const data = Array.isArray(res.data) ? res.data : res.data.campaigns || res.data.data || [];
      setAllCampaigns(data);
    } catch (err) {
      if (fetchId !== latestFetch.current) return;
      setError("Failed to load campaigns. Please try again.");
      console.error(err);
    } finally {
      if (fetchId === latestFetch.current) setLoading(false);
    }
  }, [filters, mapCentre]);

  useEffect(() => { fetchCampaigns(); }, []);
  useEffect(() => { fetchCampaigns(); }, [
    filters.status, filters.isUrgent, filters.category,
    filters.state, filters.goalMin, filters.goalMax, filters.distanceKm,
  ]);

  const handleSearchInput = (e) => {
    const val = e.target.value;
    setSearch(val);
    clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => fetchCampaigns({ search: val.trim() }), 400);
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950 flex-1 flex flex-col">
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 sticky top-16 z-[500]">
        <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-hide">
            <button onClick={() => setFilters((f) => ({ ...f, category: "" }))}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all
                ${filters.category === "" ? "bg-blue-600 text-white shadow-sm" : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"}`}>
              All Causes
            </button>
            {availableCategories.map((cat) => (
              <button key={cat}
                onClick={() => setFilters((f) => ({ ...f, category: f.category === cat ? "" : cat }))}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all
                  ${filters.category === cat ? "text-white shadow-sm" : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"}`}
                style={filters.category === cat ? { backgroundColor: getCategoryColor(cat) } : {}}>
                {getCategoryLabel(cat)}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
              className="text-sm bg-slate-100 dark:bg-slate-800 dark:text-white border-none outline-none rounded-lg py-1.5 px-3 font-medium cursor-pointer">
              <option value="newest">Newest First</option>
              <option value="funded">Most Funded</option>
              <option value="goal_high">Highest Goal</option>
              <option value="goal_low">Lowest Goal</option>
              <option value="ending">Ending Soon</option>
            </select>
            {isNGO && (
              <button onClick={() => navigate("/campaigns/create")}
                className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-all ml-2">
                <PlusCircle className="w-4 h-4" /><span className="hidden sm:inline">Create</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <main className="flex-1 relative">
        <div className="flex min-h-[calc(100vh-112px)]">
          <aside className={`${mobileView === "map" ? "hidden" : "flex"} lg:flex flex-col w-full lg:w-[40%] xl:w-[35%] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800`}
            style={{ height: "calc(100vh - 112px)" }}>
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center justify-between mb-3">
                <h1 className="text-xl font-bold dark:text-white">Discover Campaigns</h1>
                <span className="text-sm font-medium bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-500">
                  {loading ? "..." : `${displayed.length} found`}
                </span>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input type="text" value={search} onChange={handleSearchInput}
                  placeholder="Search campaigns, NGOs, cities..."
                  className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:text-white placeholder-slate-400 transition-all" />
                {(search || activeFilterCount > 0) && (
                  <button onClick={() => { setFilters(DEFAULT_FILTERS); setSearch(""); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <div className="shrink-0">
              <FilterPanel filters={filters} onChange={setFilters}
                onReset={() => { setFilters(DEFAULT_FILTERS); setSearch(""); }}
                activeCount={activeFilterCount} availableStates={availableStates} availableCategories={availableCategories} />
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg text-sm flex items-center gap-2">
                  {error}<button onClick={() => fetchCampaigns()} className="ml-auto text-xs underline font-semibold">Retry</button>
                </div>
              )}
              {loading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  <p className="text-sm">Loading campaigns...</p>
                </div>
              ) : displayed.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
                  <MapPin className="w-10 h-10" />
                  <p className="text-sm font-medium">No campaigns match your filters</p>
                  <button onClick={() => { setFilters(DEFAULT_FILTERS); setSearch(""); }}
                    className="mt-2 text-blue-500 text-sm font-semibold hover:underline flex items-center gap-1">
                    <RotateCcw className="w-3 h-3" /> Reset all filters
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  {displayed.map((campaign) => (
                    <CampaignCard key={campaign._id} campaign={campaign}
                      isActive={activeCampaign?._id === campaign._id}
                      onClick={setActiveCampaign} onNgoClick={setSelectedNgo} />
                  ))}
                </div>
              )}
            </div>
          </aside>

          <section
            className={`${mobileView === "list" ? "hidden" : "block"} lg:block relative w-full lg:w-[60%] xl:w-[65%]`}
            style={{ height: "calc(100vh - 112px)", zIndex: 0 }}
          >
            <MapContainer
              center={DEFAULT_CENTER}
              zoom={DEFAULT_ZOOM}
              minZoom={4}
              maxZoom={18}
              style={{ height: "100%", width: "100%" }}
              scrollWheelZoom
            >
              <InvalidateSize />
              <MapEvents onMoveEnd={setMapCentre} />

              {/* Mappls tile layer — correct Indian political map */}
              <TileLayer
                url={MAPPLS_TILE}
                attribution='&copy; <a href="https://mappls.com">Mappls</a> | MapmyIndia'
                maxZoom={18}
                tileSize={256}
              />

              {filters.distanceKm && (
                <Circle
                  center={[mapCentre.lat, mapCentre.lng]}
                  radius={Number(filters.distanceKm) * 1000}
                  pathOptions={{ color: "#3b82f6", fillColor: "#3b82f6", fillOpacity: 0.05, weight: 2 }}
                />
              )}

              {mappable.map((campaign) => {
                const lat   = campaign.location.coordinates.latitude;
                const lng   = campaign.location.coordinates.longitude;
                const color = getCategoryColor(campaign.category);
                const isAct = activeCampaign?._id === campaign._id;
                const ngo   = typeof campaign.ngoId === "object" ? campaign.ngoId : null;
                const pct   = Math.round(((campaign.currentAmount||0) / (campaign.goalAmount||1)) * 100);
                return (
                  <Marker key={campaign._id} position={[lat, lng]} icon={makeIcon(color, isAct)}
                    eventHandlers={{ click: () => setActiveCampaign(campaign) }}>
                    <Popup minWidth={220}>
                      <div style={{ fontFamily: "sans-serif" }}>
                        <span style={{ background: color, color: "white", fontSize: 10, fontWeight: 700,
                          textTransform: "uppercase", letterSpacing: 1, padding: "2px 8px", borderRadius: 4 }}>
                          {getCategoryLabel(campaign.category)}
                        </span>
                        <p style={{ fontWeight: 700, fontSize: 14, margin: "8px 0 4px", lineHeight: 1.3 }}>{campaign.title}</p>
                        {campaign.location?.city && (
                          <p style={{ fontSize: 11, color: "#64748b", margin: "0 0 4px" }}>
                            \uD83D\uDCCD {campaign.location.city}{campaign.location.state ? ", " + campaign.location.state : ""}
                          </p>
                        )}
                        {ngo?.name && <p style={{ fontSize: 11, color: "#64748b", margin: "0 0 6px" }}>\u2705 {ngo.name}</p>}
                        <p style={{ fontSize: 11, color: "#475569", margin: "0 0 10px" }}>
                          {pct}% funded{campaign.isUrgent && <span style={{ color: "#f97316", fontWeight: 700 }}> \u2022 Urgent</span>}
                        </p>
                        <div style={{ display: "flex", gap: 8 }}>
                          <a href={`/donate/${campaign._id}`}
                            style={{ flex: 1, padding: 6, background: "#2563eb", color: "white",
                              textAlign: "center", borderRadius: 8, fontSize: 11, fontWeight: 700, textDecoration: "none" }}>Donate</a>
                          <a href={`/campaigns/${campaign._id}`}
                            style={{ flex: 1, padding: 6, background: "#eff6ff", color: "#2563eb",
                              textAlign: "center", borderRadius: 8, fontSize: 11, fontWeight: 700, textDecoration: "none" }}>View</a>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>

            <div className="absolute top-5 left-1/2 -translate-x-1/2 z-[400]">
              <button
                onClick={() => {
                  setSearchAsMove((p) => !p);
                  if (!searchAsMove) fetchCampaigns({ lat: mapCentre.lat, lng: mapCentre.lng });
                }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full shadow-lg text-sm font-bold transition-all
                  ${searchAsMove ? "bg-blue-600 text-white" : "bg-white dark:bg-slate-900 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 hover:scale-105"}`}>
                <RefreshCw className={`w-4 h-4 ${searchAsMove ? "animate-spin" : ""}`} />
                {searchAsMove ? "Searching map..." : "Search this area"}
              </button>
            </div>

            {filters.distanceKm && (
              <div className="absolute bottom-12 left-4 z-[400] bg-white dark:bg-slate-900 px-3 py-1.5 rounded-full shadow-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-blue-600 flex items-center gap-1.5">
                <Navigation className="w-3 h-3" /> Within {filters.distanceKm} km
              </div>
            )}
          </section>
        </div>
      </main>

      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[9998]">
        <div className="bg-slate-900 text-white flex items-center p-1 rounded-full shadow-2xl">
          {["list", "map"].map((v) => (
            <button key={v} onClick={() => setMobileView(v)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${mobileView === v ? "bg-blue-600" : "hover:bg-white/10"}`}>
              {v === "list" ? <List className="w-4 h-4" /> : <MapIcon className="w-4 h-4" />}
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {selectedNgo && (
        <NgoModal ngo={selectedNgo} onClose={() => setSelectedNgo(null)}
          onViewProfile={(id) => navigate(`/ngo/${id}`)} />
      )}
    </div>
  );
};

export default CampaignsPage;
