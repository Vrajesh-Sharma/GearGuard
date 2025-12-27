import React from "react";

export default function AppShell({ children }) {
  return (
    <div className="min-h-screen">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(closest-side,rgba(59,130,246,0.30),transparent),radial-gradient(closest-side,rgba(16,185,129,0.22),transparent),radial-gradient(closest-side,rgba(245,158,11,0.16),transparent)] bg-[length:200%_200%] animate-gradient" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/30 via-slate-950/60 to-slate-950/95" />
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </div>
    </div>
  );
}
