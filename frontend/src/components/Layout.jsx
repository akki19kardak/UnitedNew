import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import RoleSelectionModal from "./RoleSelectionModal";

const Layout = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-display flex flex-col">
      <Navbar />
      <RoleSelectionModal />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
