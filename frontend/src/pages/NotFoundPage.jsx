import { useNavigate } from "react-router-dom";
import { Home, ArrowLeft, Search } from "lucide-react";

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex-1 bg-background-light dark:bg-background-dark flex flex-col items-center justify-center px-4 font-display">
      {/* Animated 404 */}
      <div className="text-center mb-10">
        <div className="relative inline-block">
          <span className="text-[10rem] font-extrabold text-slate-100 dark:text-slate-800 leading-none select-none">
            404
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
              <Search className="w-10 h-10 text-primary" />
            </div>
          </div>
        </div>
      </div>

      <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white mb-3">
        Page Not Found
      </h1>
      <p className="text-slate-500 dark:text-slate-400 text-base max-w-md text-center mb-10 leading-relaxed">
        The page you're looking for doesn't exist or has been moved.
        Let's get you back on track.
      </p>

      <div className="flex flex-wrap gap-3 justify-center">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-6 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </button>
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-blue-600 transition-colors shadow-lg shadow-primary/20"
        >
          <Home className="w-4 h-4" />
          Go Home
        </button>
        <button
          onClick={() => navigate("/campaigns")}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-xl text-sm font-semibold hover:bg-emerald-600 transition-colors"
        >
          Browse Campaigns
        </button>
      </div>

      {/* Quick links */}
      <div className="mt-14 text-center">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
          Quick Links
        </p>
        <div className="flex flex-wrap justify-center gap-4 text-sm">
          {[
            { label: "Dashboard",   path: "/dashboard" },
            { label: "Campaigns",   path: "/campaigns" },
            { label: "Messages",    path: "/messages" },
            { label: "Reports",     path: "/reports" },
            { label: "Achievements",path: "/achievements" },
          ].map(({ label, path }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="text-primary hover:underline font-medium"
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
