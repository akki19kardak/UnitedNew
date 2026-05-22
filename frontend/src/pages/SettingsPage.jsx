import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../contexts/useAuth";

import {
  ArrowLeft, Bell, Moon, Sun, Shield, Globe,
  Mail, Smartphone, CheckCircle, Eye, EyeOff, Save, Loader2
} from "lucide-react";
import { auth } from "../lib/firebase";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";

const Toggle = ({ checked, onChange, disabled = false }) => (
  <button
    onClick={() => !disabled && onChange(!checked)}
    className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 ${checked ? "bg-primary" : "bg-slate-200 dark:bg-slate-700"
      } ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
  >
    <span
      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${checked ? "translate-x-5" : "translate-x-0"
        }`}
    />
  </button>
);

const Section = ({ title, icon: Icon, children }) => (
  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
    <div className="px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
      <Icon className="w-5 h-5 text-primary" />
      <h2 className="font-bold text-slate-900 dark:text-white">{title}</h2>
    </div>
    <div className="divide-y divide-slate-50 dark:divide-slate-800">{children}</div>
  </div>
);

const SettingRow = ({ label, desc, children }) => (
  <div className="px-8 py-5 flex items-center justify-between gap-4">
    <div className="min-w-0">
      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{label}</p>
      {desc && <p className="text-xs text-slate-400 mt-0.5">{desc}</p>}
    </div>
    <div className="shrink-0">{children}</div>
  </div>
);

const Toast = ({ show, message = "Settings saved!", type = "success" }) =>
  show ? (
    <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-sm font-semibold text-white ${type === "success" ? "bg-emerald-600" : "bg-red-600"}`}>
      {type === "success" ? <CheckCircle className="w-4 h-4" /> : null} {message}
    </div>
  ) : null;

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [dark, setDark] = useState(document.documentElement.classList.contains("dark"));
  const [notifs, setNotifs] = useState({ email: true, push: false, sms: false, updates: true, reports: true, campaigns: true });
  const [privacy, setPrivacy] = useState({ publicProfile: true, showDonations: false, showActivity: true });
  const [lang, setLang] = useState("en");
  const [showPw, setShowPw] = useState(false);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [loading, setLoading] = useState(false);

  const toggleDark = (val) => {
    setDark(val);
    document.documentElement.classList.toggle("dark", val);
  };

  const saveAll = () => {
    setToast({ show: true, message: "Settings saved!", type: "success" });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

  const handlePasswordUpdate = async () => {
    if (!pw.current || !pw.next || pw.next !== pw.confirm) return;
    setLoading(true);

    try {
      const u = auth.currentUser;
      if (u && u.email) {
        // Re-authenticate
        const credential = EmailAuthProvider.credential(u.email, pw.current);
        await reauthenticateWithCredential(u, credential);
        // Update password
        await updatePassword(u, pw.next);

        setPw({ current: "", next: "", confirm: "" });
        setToast({ show: true, message: "Password updated successfully!", type: "success" });
        setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
      }
    } catch (err) {
      console.error("Password update error:", err);
      setToast({ show: true, message: err.message || "Failed to update password", type: "error" });
      setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 4000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark font-display">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <h1 className="text-base font-bold">Settings</h1>
          <button
            onClick={saveAll}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-blue-600 transition-colors shadow-lg shadow-primary/20"
          >
            <Save className="w-4 h-4" /> Save All
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 space-y-6">

        {/* Appearance */}
        <Section title="Appearance" icon={dark ? Moon : Sun}>
          <SettingRow label="Dark Mode" desc="Switch between light and dark theme">
            <Toggle checked={dark} onChange={toggleDark} />
          </SettingRow>
          <SettingRow label="Language" desc="Interface display language">
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-primary/30 dark:text-white"
            >
              <option value="en">English</option>
              <option value="hi">हिन्दी</option>
              <option value="mr">मराठी</option>
              <option value="ta">தமிழ்</option>
            </select>
          </SettingRow>
        </Section>

        {/* Notifications */}
        <Section title="Notifications" icon={Bell}>
          {[
            { key: "email", label: "Email Notifications", desc: "Receive updates via email" },
            { key: "push", label: "Push Notifications", desc: "Browser push alerts" },
            { key: "sms", label: "SMS Alerts", desc: "Text message notifications" },
            { key: "reports", label: "Impact Reports", desc: "Monthly donor impact summaries" },
            { key: "campaigns", label: "New Campaigns Nearby", desc: "Alerts for campaigns in your area" },
            { key: "updates", label: "Platform Updates", desc: "Feature announcements and news" },
          ].map(({ key, label, desc }) => (
            <SettingRow key={key} label={label} desc={desc}>
              <Toggle
                checked={notifs[key]}
                onChange={(v) => setNotifs((p) => ({ ...p, [key]: v }))}
              />
            </SettingRow>
          ))}
        </Section>

        {/* Privacy */}
        <Section title="Privacy" icon={Shield}>
          {[
            { key: "publicProfile", label: "Public Profile", desc: "Let others discover your profile" },
            { key: "showDonations", label: "Show Donation History", desc: "Display on your public profile" },
            { key: "showActivity", label: "Show Activity Feed", desc: "Visible to NGOs you follow" },
          ].map(({ key, label, desc }) => (
            <SettingRow key={key} label={label} desc={desc}>
              <Toggle
                checked={privacy[key]}
                onChange={(v) => setPrivacy((p) => ({ ...p, [key]: v }))}
              />
            </SettingRow>
          ))}
        </Section>

        {/* Change Password */}
        <Section title="Security" icon={Shield}>
          <div className="px-8 py-6 space-y-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Change Password</p>
            {[
              { key: "current", label: "Current Password" },
              { key: "next", label: "New Password" },
              { key: "confirm", label: "Confirm New Password" },
            ].map(({ key, label }) => (
              <div key={key} className="relative">
                <label className="block text-xs font-semibold text-slate-500 mb-1">{label}</label>
                <input
                  type={showPw ? "text" : "password"}
                  value={pw[key]}
                  onChange={(e) => setPw((p) => ({ ...p, [key]: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 pr-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none dark:text-white"
                />
                {key === "current" && (
                  <button
                    type="button"
                    onClick={() => setShowPw((p) => !p)}
                    className="absolute right-3 bottom-2.5 text-slate-400 hover:text-primary transition-colors"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={handlePasswordUpdate}
              disabled={!pw.current || !pw.next || pw.next !== pw.confirm || loading}
              className="w-full flex justify-center py-2.5 bg-slate-800 dark:bg-white dark:text-slate-900 text-white text-sm font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update Password"}
            </button>
            {pw.next && pw.confirm && pw.next !== pw.confirm && (
              <p className="text-xs text-red-500 font-medium">Passwords do not match</p>
            )}
          </div>
        </Section>

        {/* Account */}
        <Section title="Account" icon={Globe}>
          <SettingRow label="Linked Email" desc={user?.email || "Not set"}>
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded">
              <CheckCircle className="w-3 h-3" /> Verified
            </span>
          </SettingRow>
          <SettingRow label="Account Role" desc="Your role cannot be self-changed">
            <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded capitalize">
              {user?.role}
            </span>
          </SettingRow>
          <div className="px-8 py-6 border-t border-red-50 dark:border-red-900/20">
            <p className="text-sm font-bold text-red-600 mb-2">Danger Zone</p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => { logout(); navigate("/login"); }}
                className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 text-sm font-bold rounded-xl hover:bg-red-100 transition-colors border border-red-200 dark:border-red-800"
              >
                Sign Out
              </button>
              <button className="px-4 py-2 border border-red-200 dark:border-red-800 text-red-400 text-sm font-bold rounded-xl hover:bg-red-50 transition-colors">
                Delete Account
              </button>
            </div>
          </div>
        </Section>

      </main>

      <Toast {...toast} />
    </div>
  );
};

export default SettingsPage;
