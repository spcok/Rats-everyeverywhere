import { createRootRoute, Link, Outlet } from '@tanstack/react-router';
import { GitFork, HeartPulse, Dna, LayoutDashboard } from 'lucide-react';

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <div className="flex h-screen w-full bg-stone-950 text-stone-200">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-stone-800 bg-stone-900/50 p-4 flex flex-col justify-between">
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400">
              <Dna className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-wide uppercase text-stone-100">Nikkie Rattery</h1>
              <p className="text-xs text-stone-400">Pedigree & Lineage OS</p>
            </div>
          </div>

          <nav className="space-y-1">
            <Link
              to="/"
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-stone-300 hover:bg-stone-800/60 hover:text-stone-100 transition-colors [&.active]:bg-stone-800 [&.active]:text-emerald-400"
            >
              <LayoutDashboard className="w-4 h-4" />
              Colony Overview
            </Link>
            <Link
              to="/rats"
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-stone-300 hover:bg-stone-800/60 hover:text-stone-100 transition-colors [&.active]:bg-stone-800 [&.active]:text-emerald-400"
            >
              <GitFork className="w-4 h-4" />
              Rats & Pedigrees
            </Link>
            <Link
              to="/pairings"
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-stone-300 hover:bg-stone-800/60 hover:text-stone-100 transition-colors [&.active]:bg-stone-800 [&.active]:text-emerald-400"
            >
              <HeartPulse className="w-4 h-4" />
              Pairing Risk Engine
            </Link>
          </nav>
        </div>

        <div className="p-3 bg-stone-900 border border-stone-800/80 rounded-lg text-xs text-stone-500">
          Rolldown/Vite 8 • TS 7 • Local-First DB
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}