import React from "react";
import { Link } from "react-router-dom";
import { Mail, Phone, MapPin } from "lucide-react";
import logo from "../assets/logo.png";

const Footer = () => {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <Link to="/">
          <img src={logo} alt="United Impact" className="h-14 w-auto object-contain" />
        </Link>
            

            <p className="mb-6 text-slate-600 dark:text-slate-400">
              Turning collective action into measurable impact—support verified NGOs, donate securely, and volunteer for causes that matter.
            </p>

            {/* Social */}
            <div className="flex gap-3">
              {[
                { name: "Facebook", url: "https://facebook.com" },
                { name: "Twitter", url: "https://twitter.com" },
                { name: "Instagram", url: "https://instagram.com" },
              ].map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.name}
                  className="w-10 h-10 rounded-lg flex items-center justify-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-primary hover:border-primary group transition-all"
                >
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 group-hover:text-white">
                    {social.name.slice(0, 2).toUpperCase()}
                  </span>
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">Quick Links</h3>
            <ul className="space-y-2">
              {[
                { label: "Home", to: "/" },
                { label: "Campaigns", to: "/campaigns" },
                { label: "Dashboard", to: "/dashboard" },
                { label: "Profile", to: "/profile" },
                { label: "Messages", to: "/messages" },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-slate-600 dark:text-slate-400 hover:text-primary transition-colors hover:translate-x-1 inline-block"
                  >
                    → {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Platform */}
          <div>
            <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">Platform</h3>
            <ul className="space-y-2">
              {[
                { label: "Impact Reports", to: "/reports" },
                { label: "Achievements", to: "/achievements" },
                { label: "Verify NGOs", to: "/admin/verification" },
                { label: "Create Campaign", to: "/campaigns/create" },
                { label: "Settings", to: "/settings" },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-slate-600 dark:text-slate-400 hover:text-primary transition-colors hover:translate-x-1 inline-block"
                  >
                    → {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-slate-600 dark:text-slate-400 hover:text-primary transition-colors">
                <MapPin size={20} className="text-primary mt-1 flex-shrink-0" />
                <span>Mumbai, Maharashtra, India</span>
              </li>
              <li className="flex items-center gap-3 text-slate-600 dark:text-slate-400 hover:text-primary transition-colors">
                <Phone size={20} className="text-primary flex-shrink-0" />
                <span>+91 98765 43210</span>
              </li>
              <li className="flex items-center gap-3 text-slate-600 dark:text-slate-400 hover:text-primary transition-colors">
                <Mail size={20} className="text-primary flex-shrink-0" />
                <span>support@unitedimpact.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-200 dark:border-slate-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 transition-colors">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            © {new Date().getFullYear()} United Impact. All rights reserved. Built by{" "}
            <span className="text-primary font-semibold">Akshat</span>
          </p>
          <div className="flex gap-6 text-sm">
            <Link to="/privacy" className="text-slate-600 dark:text-slate-400 hover:text-primary transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="text-slate-600 dark:text-slate-400 hover:text-primary transition-colors">Terms of Service</Link>
            <Link to="/cookies" className="text-slate-600 dark:text-slate-400 hover:text-primary transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;