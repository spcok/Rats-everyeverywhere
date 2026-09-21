import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/pairings')({
  component: PairingsComponent,
});

function PairingsComponent() {
  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold tracking-tight text-stone-100">Pairing Risk Simulator</h2>
      <p className="text-sm text-stone-400">Wright's Inbreeding Coefficient (COI) calculator and shared ancestral defect alerts.</p>
      <div className="p-6 bg-stone-900/60 border border-stone-800 rounded-xl text-stone-400 text-sm">
        Ready for Phase 2 Wright's COI engine and lethal combination warning checks.
      </div>
    </div>
  );
}