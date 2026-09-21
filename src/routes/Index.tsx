import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Dna, ShieldAlert, Sparkles, FolderKanban, GitFork, HeartPulse, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { RatRecord, LitterRecord, HealthIncident } from '@/lib/types';

export const Route = createFileRoute('/')({
  component: DashboardComponent,
});

function DashboardComponent() {
  const { data: rats = [], isLoading: loadingRats } = useQuery<RatRecord[]>({
    queryKey: ['rats'],
    queryFn: async () => {
      const { data, error } = await supabase.from('rats').select('*');
      if (error) return [];
      return (data as RatRecord[]) ?? [];
    },
  });

  const { data: litters = [], isLoading: loadingLitters } = useQuery<LitterRecord[]>({
    queryKey: ['litters'],
    queryFn: async () => {
      const { data, error } = await supabase.from('litters').select('*');
      if (error) return [];
      return (data as LitterRecord[]) ?? [];
    },
  });

  const { data: healthIncidents = [], isLoading: loadingHealth } = useQuery<HealthIncident[]>({
    queryKey: ['health_incidents'],
    queryFn: async () => {
      const { data, error } = await supabase.from('health_incidents').select('*');
      if (error) return [];
      return (data as HealthIncident[]) ?? [];
    },
  });

  const activeBreeders = rats.filter((r) => r.status === 'Active Breeding');
  const activeBucks = activeBreeders.filter((r) => r.sex === 'Buck').length;
  const activeDoes = activeBreeders.filter((r) => r.sex === 'Doe').length;
  const highWhiteCount = rats.filter((r) => r.is_high_white_risk).length;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-stone-100">Colony Health & Lineage Status</h2>
        <p className="text-sm text-stone-400 mt-1">
          Real-time metrics for registered breeding stock, litters, and bloodline flags.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-stone-900 border border-stone-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-xs uppercase tracking-wider font-semibold">Active Breeders</span>
            <Dna className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-bold text-stone-100">{loadingRats ? '...' : activeBreeders.length}</p>
          <p className="text-xs text-stone-500">{activeBucks} Bucks • {activeDoes} Does</p>
        </div>

        <div className="p-5 bg-stone-900 border border-stone-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-xs uppercase tracking-wider font-semibold">Tracked Litters</span>
            <FolderKanban className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-3xl font-bold text-stone-100">{loadingLitters ? '...' : litters.length}</p>
          <p className="text-xs text-stone-500">Scheduled & logged litters</p>
        </div>

        <div className="p-5 bg-stone-900 border border-stone-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-xs uppercase tracking-wider font-semibold">Megacolon Watch</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-3xl font-bold text-amber-400">{loadingRats ? '...' : highWhiteCount}</p>
          <p className="text-xs text-stone-500">High-white markers active</p>
        </div>

        <div className="p-5 bg-stone-900 border border-stone-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-xs uppercase tracking-wider font-semibold">Health Incidents</span>
            <Sparkles className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-3xl font-bold text-rose-400">{loadingHealth ? '...' : healthIncidents.length}</p>
          <p className="text-xs text-stone-500">Logged line health events</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        <Link
          to="/rats"
          className="p-6 bg-stone-900 border border-stone-800 rounded-2xl hover:border-emerald-500/50 transition-all group flex items-start justify-between"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-stone-200 font-semibold text-base">
              <GitFork className="w-5 h-5 text-emerald-400" />
              Manage Colony & Pedigrees
            </div>
            <p className="text-xs text-stone-400 leading-relaxed">
              Register stock, view 4-generation pedigree DAGs, and review individual rat records.
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-stone-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          to="/pairings"
          className="p-6 bg-stone-900 border border-stone-800 rounded-2xl hover:border-blue-500/50 transition-all group flex items-start justify-between"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-stone-200 font-semibold text-base">
              <HeartPulse className="w-5 h-5 text-blue-400" />
              Pairing Risk Simulator
            </div>
            <p className="text-xs text-stone-400 leading-relaxed">
              Simulate prospective matings, calculate Wright's COI, and screen for lethal megacolon defects.
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-stone-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
        </Link>
      </div>
    </div>
  );
}