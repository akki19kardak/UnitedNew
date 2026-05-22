import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../contexts/useAuth";
import axios from "axios";

import {
  ArrowLeft, Camera, Save, User, Mail, Phone,
  MapPin, Globe, Heart, Users, Building2, CheckCircle,
  Loader2
} from "lucide-react";

const ROLE_COLORS = {
  donor: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  volunteer: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  ngo: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  admin: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const ProfilePage = () => {
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();

  const nameParts = (user?.name || "").split(" ");
  const [form, setForm] = useState({
    firstName: nameParts[0] || "",
    lastName: nameParts.slice(1).join(" ") || "",
    email: user?.email || "",
    phone: user?.phone || "",
    city: user?.city || "",
    bio: user?.bio || "",
  });

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      const parts = (user.name || "").split(" ");
      setForm({
        firstName: parts[0] || "",
        lastName: parts.slice(1).join(" ") || "",
        email: user.email || "",
        phone: user.phone || "",
        city: user.city || "",
        bio: user.bio || "",
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);

    try {
      await updateProfile({
        name: `${form.firstName} ${form.lastName}`.trim(),
        phone: form.phone,
        city: form.city,
        bio: form.bio,
      });
      setEditing(false);
    } catch (error) {
      console.error("Profile update error:", error);
    } finally {
      setLoading(false);
    }
  };

  const field = (label, key, type = "text", placeholder = "") => (
    <div>
      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      {editing ? (
        <input
          type={type}
          value={form[key]}
          onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
          placeholder={placeholder}
          className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none dark:text-white"
        />
      ) : (
        <p className="text-sm text-slate-800 dark:text-slate-200 py-2.5 px-1">
          {form[key] || <span className="text-slate-400 italic">Not set</span>}
        </p>
      )}
    </div>
  );

  return (
    <div className="bg-background-light dark:bg-background-dark font-display">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
          <div className="flex gap-3">
            {editing ? (
              <>
                <button
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 text-sm font-semibold border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10 space-y-8">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
            <User className="w-5 h-5 text-primary" /> Personal Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {field("First Name", "firstName", "text", "John")}
            {field("Last Name", "lastName", "text", "Doe")}
            {field("Email Address", "email", "email", "you@email.com")}
            {field("Phone Number", "phone", "tel", "+91 00000 00000")}
            {field("City / Location", "city", "text", "Mumbai")}
          </div>
          <div className="mt-6">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Bio</label>
            {editing ? (
              <textarea
                value={form.bio}
                onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                rows={3}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary/30 outline-none"
              />
            ) : (
              <p className="text-sm py-2 px-1">{form.bio || "No bio yet."}</p>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-red-100 p-8 shadow-sm">
          <h2 className="text-lg font-bold mb-4 text-red-600">Danger Zone</h2>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Sign out of your account</p>
            <button
              onClick={() => { logout(); navigate("/login"); }}
              className="px-5 py-2.5 bg-red-50 text-red-600 text-sm font-bold rounded-xl hover:bg-red-100"
            >
              Sign Out
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
