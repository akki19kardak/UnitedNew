import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Upload, MapPin, Calendar,
  Info, Loader2, Plus, X, Search
} from "lucide-react";
import useAuth from "../contexts/useAuth";
import axios from "axios";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const createCustomIcon = (color) =>
  L.divIcon({
    className: "",
    html: `<div style="
      width:32px;height:32px;
      background:${color};border-radius:50% 50% 50% 0;transform:rotate(-45deg);
      border:3px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.35);transition:all .2s;
    "></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32]
  });

const LocationMarker = ({ position, setPosition }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([position.latitude, position.longitude], 13);
  }, [position.latitude, position.longitude]);

  useMapEvents({
    click(e) {
      setPosition({ latitude: e.latlng.lat, longitude: e.latlng.lng });
    },
  });

  return (
    <Marker
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const pos = e.target.getLatLng();
          setPosition({ latitude: pos.lat, longitude: pos.lng });
        },
      }}
      position={[position.latitude, position.longitude]}
      icon={createCustomIcon("#3b82f6")}
    />
  );
};

const API = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";

// ✅ Only categories that exist in Campaign.js model enum
const CATEGORIES = [
  "education",
  "health",
  "environment",
  "disaster-relief",
  "women-empowerment",
  "child-welfare",
  "animal-welfare",
  "other",
];

const CreateCampaignPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    title: "",
    category: "",
    description: "",
    targetAmount: "",
    endDate: "",
    location: {
      city: "",
      state: "",
      country: "India",
      coordinates: { latitude: 20.5937, longitude: 78.9629 },
    },
    imageUrl: "",
    tags: [],
    isUrgent: false,
  });

  const [tagInput, setTagInput] = useState("");
  const [geocoding, setGeocoding] = useState(false);

  const handleGeocode = async () => {
    if (!form.location.city && !form.location.state) return;
    setGeocoding(true);
    try {
      const query = encodeURIComponent(`${form.location.city}, ${form.location.state}, India`);
      const res = await axios.get(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`, {
        headers: { "User-Agent": "UnitedImpact/1.0" }
      });
      if (res.data && res.data.length > 0) {
        setForm(prev => ({
          ...prev,
          location: {
            ...prev.location,
            coordinates: {
              latitude: parseFloat(res.data[0].lat),
              longitude: parseFloat(res.data[0].lon)
            }
          }
        }));
      }
    } catch (err) {
      console.warn("Geocoding failed", err);
    } finally {
      setGeocoding(false);
    }
  };

  const handleAddTag = (e) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (!form.tags.includes(tagInput.trim())) {
        setForm((prev) => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      }
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tagToRemove),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (user?.role !== "ngo") {
      setError("Only NGOs can create campaigns.");
      return;
    }

    if (!form.targetAmount || Number(form.targetAmount) <= 0) {
      setError("Please enter a valid goal amount.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // ✅ user.token is already stored in AuthContext — no getIdToken() needed
      const token = user.token;

      const campaignData = {
        title: form.title,
        description: form.description,
        category: form.category || "other",
        goalAmount: Number(form.targetAmount),   // ✅ mapped to goalAmount (model field)
        endDate: form.endDate,
        startDate: new Date().toISOString(),
        location: form.location,
        imageUrl: form.imageUrl,
        tags: form.tags,
        isUrgent: form.isUrgent,
        images: form.imageUrl
          ? [{ url: form.imageUrl, isPrimary: true }]
          : [],
      };

      const res = await axios.post(`${API}/campaigns`, campaignData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSuccess("Campaign created successfully! Redirecting...");
      setTimeout(() => {
        navigate(`/campaigns/${res.data.campaign?._id || res.data._id}`);
      }, 1000);
    } catch (err) {
      console.error("Error creating campaign:", err);
      setError(
        err.response?.data?.message ||
        "Failed to create campaign. Please check your inputs."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors mb-8 group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back</span>
        </button>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-8 border-b border-slate-100 dark:border-slate-800">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Start a New Campaign
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">
              Fill in the details below to reach out for support and create impact.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">

            {/* Error */}
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium flex items-center gap-3">
                <Info className="w-5 h-5 shrink-0" />
                {error}
              </div>
            )}

            {/* Success */}
            {success && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 text-green-600 dark:text-green-400 rounded-xl text-sm font-medium flex items-center gap-3">
                <Info className="w-5 h-5 shrink-0" />
                {success}
              </div>
            )}

            {/* ── Basic Info ── */}
            <section className="space-y-6">
              <div className="flex items-center gap-2 text-primary">
                <Info className="w-5 h-5" />
                <h2 className="font-bold uppercase tracking-wider text-xs">
                  Basic Information
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Title */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-2 text-slate-900 dark:text-white">
                    Campaign Title *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Clean Water for Rural Karnataka"
                    value={form.title}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, title: e.target.value }))
                    }
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-slate-900 dark:text-white"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-slate-900 dark:text-white">
                    Category *
                  </label>
                  <select
                    required
                    value={form.category}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, category: e.target.value }))
                    }
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-slate-900 dark:text-white capitalize"
                  >
                    <option value="">Select a category</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.replace(/-/g, " ")}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Goal Amount */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-slate-900 dark:text-white">
                    Goal Amount (₹) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                      ₹
                    </span>
                    <input
                      required
                      type="number"
                      min="1"
                      placeholder="e.g. 50000"
                      value={form.targetAmount}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          targetAmount: e.target.value,
                        }))
                      }
                      className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Is Urgent toggle */}
                <div className="md:col-span-2 flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isUrgent"
                    checked={form.isUrgent}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, isUrgent: e.target.checked }))
                    }
                    className="w-4 h-4 accent-primary cursor-pointer"
                  />
                  <label
                    htmlFor="isUrgent"
                    className="text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    Mark as Urgent Campaign
                  </label>
                </div>
              </div>
            </section>

            {/* ── Description ── */}
            <section className="space-y-4">
              <label className="block text-sm font-semibold text-slate-900 dark:text-white">
                Detailed Description *
              </label>
              <textarea
                required
                rows={6}
                placeholder="Tell the story of why this campaign is important..."
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, description: e.target.value }))
                }
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none text-slate-900 dark:text-white"
              />
            </section>

            {/* ── Media + Location ── */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-8">

              {/* Media */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-primary">
                  <Upload className="w-5 h-5" />
                  <h2 className="font-bold uppercase tracking-wider text-xs">
                    Media
                  </h2>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-slate-500">
                    Campaign Header Image URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={form.imageUrl}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, imageUrl: e.target.value }))
                    }
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-slate-900 dark:text-white"
                  />
                  {form.imageUrl && (
                    <div className="mt-4 aspect-video rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-inner">
                      <img
                        src={form.imageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = "";
                          e.target.alt = "Invalid image URL";
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Location & Timeline */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-primary">
                  <MapPin className="w-5 h-5" />
                  <h2 className="font-bold uppercase tracking-wider text-xs">
                    Location & Timeline
                  </h2>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 ml-1">
                      City *
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="Bengaluru"
                      value={form.location.city}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          location: { ...prev.location, city: e.target.value },
                        }))
                      }
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 ml-1">
                      State *
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="Karnataka"
                      value={form.location.state}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          location: { ...prev.location, state: e.target.value },
                        }))
                      }
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="col-span-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleGeocode}
                      disabled={geocoding}
                      className="text-xs font-bold px-4 py-2 bg-blue-50 text-blue-600 rounded-lg flex items-center gap-2 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 transition-colors"
                    >
                      {geocoding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                      Find on Map
                    </button>
                  </div>

                  <div className="col-span-2 h-[250px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 relative">
                    <MapContainer center={[form.location.coordinates.latitude, form.location.coordinates.longitude]} zoom={4} className="w-full h-full z-0">
                      <TileLayer
                        url={`https://apis.mappls.com/advancedmaps/v1/${import.meta.env.VITE_MAPPLS_KEY || "7790ee75403bdda0e09c4b54165453d0"}/still_map/{z}/{x}/{y}.png`}
                        attribution='&copy; <a href="https://mappls.com">Mappls</a> | MapmyIndia'
                        maxZoom={18}
                        tileSize={256}
                      />
                      <LocationMarker
                        position={form.location.coordinates}
                        setPosition={(pos) => setForm(prev => ({ ...prev, location: { ...prev.location, coordinates: pos } }))}
                      />
                    </MapContainer>
                  </div>

                  <div className="col-span-2 mt-4">
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 ml-1">
                      End Date *
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        required
                        type="date"
                        min={new Date().toISOString().split("T")[0]}
                        value={form.endDate}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            endDate: e.target.value,
                          }))
                        }
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ── Tags ── */}
            <section className="space-y-4">
              <label className="block text-sm font-semibold text-slate-900 dark:text-white">
                Tags <span className="text-slate-400 font-normal">(Press Enter to add)</span>
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {form.tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full cursor-default"
                  >
                    #{tag}
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-red-500"
                      onClick={() => removeTag(tag)}
                    />
                  </span>
                ))}
              </div>
              <input
                type="text"
                placeholder="Add tags like water, education, urgent..."
                value={tagInput}
                onKeyDown={handleAddTag}
                onChange={(e) => setTagInput(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-slate-900 dark:text-white"
              />
            </section>

            {/* ── Actions ── */}
            <div className="pt-8 flex items-center justify-end gap-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-3 text-slate-500 font-bold hover:text-slate-800 dark:hover:text-white transition-colors"
              >
                Discard
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-10 py-3.5 bg-primary hover:bg-blue-600 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Plus className="w-5 h-5" />
                )}
                Launch Campaign
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateCampaignPage;
