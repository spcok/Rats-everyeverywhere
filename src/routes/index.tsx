import { createFileRoute } from '@tanstack/react-router';
import { Dna, ShieldAlert, Sparkles, FolderKanban } from 'lucide-react';

export const Route = createFileRoute('/')({
  component: DashboardComponent,
});

function DashboardComponent() {
  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-stone-100">Colony Health & Lineage Status</h2>
        <p className="text-sm text-stone-400 mt-1">Real-time status of breeding lines, active litters, and health alerts.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 bg-stone-900 border border-stone-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-xs uppercase tracking-wider font-semibold">Active Breeders</span>
            <Dna className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-bold text-stone-100">0</p>
          <p className="text-xs text-stone-500">0 Bucks • 0 Does</p>
        </div>

        <div className="p-5 bg-stone-900 border border-stone-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-xs uppercase tracking-wider font-semibold">Tracked Litters</span>
            <FolderKanban className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-3xl font-bold text-stone-100">0</p>
          <p className="text-xs text-stone-500">Awaiting database sync</p>
        </div>

        <div className="p-5 bg-stone-900 border border-stone-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-xs uppercase tracking-wider font-semibold">Megacolon Watch</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-3xl font-bold text-amber-400">0</p>
          <p className="text-xs text-stone-500">High-white markers active</p>
        </div>

        <div className="p-5 bg-stone-900 border border-stone-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-xs uppercase tracking-wider font-semibold">Health Incidents</span>
            <Sparkles className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-3xl font-bold text-rose-400">0</p>
          <p className="text-xs text-stone-500">Respiratory & tumour flags</p>
        </div>
      </div>
    </div>
  );
}