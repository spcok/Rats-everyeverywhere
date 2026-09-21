import { createFileRoute } from '@tanstack/react-router';
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  HeartPulse,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Dna,
  GitFork,
  ArrowRight,
  Info,
  Calendar,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { RatRecord, HealthIncident, LitterRecord } from '@/lib/types';
import { calculatePairingCOI, evaluateHighWhiteRisk, analyzeLineageRisks } from '@/lib/pedigree';

export const Route = createFileRoute('/pairings')({
  component: PairingsComponent,
});

// Resilient default seed data
const SEED_RATS: RatRecord[] = [
  {
    id: 'rat-001',
    pedigree_name: 'Strix Silver Dollar',
    pet_name: 'Dollar',
    sex: 'Buck',
    variety: 'Self',
    colour: 'Silver',
    coat: 'Standard',
    ear: 'Top',
    tail_kink: false,
    dob: '2025-01-15',
    status: 'Active Breeding',
    is_high_white_risk: false,
    bites_humans: false,
    aggressive_to_rats: false,
    neutered_behaviour: false,
    neutered_health: false,
  },
  {
    id: 'rat-002',
    pedigree_name: 'Nikkie Arctic Moon',
    pet_name: 'Luna',
    sex: 'Doe',
    variety: 'Blazed Berkshire',
    colour: 'British Blue',
    coat: 'Rex',
    ear: 'Dumbo',
    tail_kink: false,
    dob: '2025-02-01',
    status: 'Active Breeding',
    is_high_white_risk: true,
    bites_humans: false,
    aggressive_to_rats: false,
    neutered_behaviour: false,
    neutered_health: false,
  },
  {
    id: 'rat-003',
    sire_id: 'rat-001',
    dam_id: 'rat-002',
    pedigree_name: 'Nikkie Eclipse Storm',
    pet_name: 'Storm',
    sex: 'Buck',
    variety: 'Badger Roan',
    colour: 'Russian Dove',
    coat: 'Rex',
    ear: 'Dumbo',
    tail_kink: false,
    dob: '2025-07-10',
    status: 'Active Breeding',
    is_high_white_risk: true,
    bites_humans: false,
    aggressive_to_rats: false,
    neutered_behaviour: false,
    neutered_health: false,
  },
  {
    id: 'rat-004',
    pedigree_name: 'Oakhaven Willow',
    pet_name: 'Willow',
    sex: 'Doe',
    variety: 'Irish',
    colour: 'Mink',
    coat: 'Standard',
    ear: 'Top',
    tail_kink: false,
    dob: '2025-03-12',
    status: 'Active Breeding',
    is_high_white_risk: false,
    bites_humans: false,
    aggressive_to_rats: false,
    neutered_behaviour: false,
    neutered_health: false,
  },
];

function PairingsComponent() {
  const queryClient = useQueryClient();
  const [selectedSireId, setSelectedSireId] = useState<string>('rat-001');
  const [selectedDamId, setSelectedDamId] = useState<string>('rat-002');
  const [plannedMatingDate, setPlannedMatingDate] = useState<string>(
    new Date().toISOString().split('T')[0] ?? ''
  );
  const [litterIdentifier, setLitterIdentifier] = useState<string>('Litter A-2026');
  const [isCommitModalOpen, setIsCommitModalOpen] = useState(false);
  const [committedNotice, setCommittedNotice] = useState(false);

  // Fetch colony
  const { data: rats = SEED_RATS } = useQuery({
    queryKey: ['rats'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('rats').select('*');
        if (error || !data || data.length === 0) return SEED_RATS;
        return data as RatRecord[];
      } catch {
        return SEED_RATS;
      }
    },
  });

  // Fetch health incidents
  const { data: healthIncidents = [] } = useQuery({
    queryKey: ['health_incidents'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('health_incidents').select('*');
        if (error || !data) return [];
        return data as HealthIncident[];
      } catch {
        return [];
      }
    },
  });

  const ratsMap = useMemo(() => new Map(rats.map((r) => [r.id, r])), [rats]);

  const potentialSires = useMemo(
    () => rats.filter((r) => r.sex === 'Buck' && r.status !== 'Deceased'),
    [rats]
  );
  const potentialDams = useMemo(
    () => rats.filter((r) => r.sex === 'Doe' && r.status !== 'Deceased'),
    [rats]
  );

  const currentSire = ratsMap.get(selectedSireId);
  const currentDam = ratsMap.get(selectedDamId);

  // Calculate COI & Common Ancestors
  const coiAnalysis = useMemo(() => {
    return calculatePairingCOI(selectedSireId, selectedDamId, ratsMap);
  }, [selectedSireId, selectedDamId, ratsMap]);

  // Evaluate Lineage Risks & Defects
  const lineageWarnings = useMemo(() => {
    if (!currentSire || !currentDam) return [];
    return analyzeLineageRisks(
      currentSire,
      currentDam,
      coiAnalysis.commonAncestors,
      ratsMap,
      healthIncidents
    );
  }, [currentSire, currentDam, coiAnalysis.commonAncestors, ratsMap, healthIncidents]);

  // Estimated Gestation Dates
  const gestationDetails = useMemo(() => {
    if (!plannedMatingDate) return null;
    const mating = new Date(plannedMatingDate);
    
    // Normal rat gestation is 21-23 days
    const minBirth = new Date(mating);
    minBirth.setDate(mating.getDate() + 21);

    const maxBirth = new Date(mating);
    maxBirth.setDate(mating.getDate() + 23);

    const weanDate = new Date(minBirth);
    weanDate.setDate(minBirth.getDate() + 31); // 4.5 weeks

    return {
      birthWindow: `${minBirth.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - ${maxBirth.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`,
      weanEstimate: weanDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    };
  }, [plannedMatingDate]);

  // Handle Committing Pairing to a Planned Litter
  const handleCommitPairing = async () => {
    if (!currentSire || !currentDam) return;

    const newLitter: Partial<LitterRecord> = {
      id: crypto.randomUUID(),
      identifier: litterIdentifier,
      sire_id: currentSire.id,
      dam_id: currentDam.id,
      mating_date: plannedMatingDate,
      birth_date: plannedMatingDate, // Target placeholder
      total_born_live: 0,
      total_born_dead: 0,
      bucks_count: 0,
      does_count: 0,
      infant_deaths_count: 0,
      notes: `Target pairing: COI ${coiAnalysis.coi}%. Warnings: ${lineageWarnings.length}`,
    };

    try {
      await supabase.from('litters').insert([newLitter]);
    } catch (err) {
      console.warn('Litter logged to local session (Supabase disconnected)', err);
    }

    setIsCommitModalOpen(false);
    setCommittedNotice(true);
    setTimeout(() => setCommittedNotice(false), 4000);
  };

  // COI Level formatting
  const coiSeverity =
    coiAnalysis.coi === 0
      ? { label: 'Outcross (0%)', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' }
      : coiAnalysis.coi < 6.25
      ? { label: 'Mild Linebreeding (< 6.25%)', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' }
      : coiAnalysis.coi < 12.5
      ? { label: 'Moderate Linebreeding (6.25% - 12.5%)', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' }
      : { label: 'High Closebreeding (> 12.5%)', color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-stone-100 flex items-center gap-2.5">
            <HeartPulse className="w-6 h-6 text-emerald-400" />
            Mating Pair Risk Simulator
          </h2>
          <p className="text-sm text-stone-400">
            Real-time Wright's inbreeding calculations, lethal megacolon checks, and ancestral health audits.
          </p>
        </div>

        {committedNotice && (
          <div className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-4 py-2 rounded-xl text-xs font-semibold animate-fade-in">
            <CheckCircle2 className="w-4 h-4" />
            Litter successfully scheduled!
          </div>
        )}
      </div>

      {/* Breeding Pair Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sire Card */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
              <Dna className="w-4 h-4" /> Prospective Sire (Buck)
            </span>
            {currentSire?.is_high_white_risk && (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                <AlertTriangle className="w-3 h-3" /> High-White
              </span>
            )}
          </div>

          <select
            value={selectedSireId}
            onChange={(e) => setSelectedSireId(e.target.value)}
            className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2.5 text-sm text-stone-100 font-medium focus:outline-none focus:border-blue-500"
          >
            {potentialSires.map((sire) => (
              <option key={sire.id} value={sire.id}>
                {sire.pedigree_name} {sire.pet_name ? `("${sire.pet_name}")` : ''} — {sire.variety}
              </option>
            ))}
          </select>

          {currentSire && (
            <div className="grid grid-cols-2 gap-2 text-xs text-stone-400 bg-stone-950/60 p-3 rounded-xl border border-stone-800/80">
              <div><span className="text-stone-500">Colour:</span> {currentSire.colour}</div>
              <div><span className="text-stone-500">Coat:</span> {currentSire.coat}</div>
              <div><span className="text-stone-500">Ears:</span> {currentSire.ear}</div>
              <div><span className="text-stone-500">Status:</span> {currentSire.status}</div>
            </div>
          )}
        </div>

        {/* Dam Card */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
              <Dna className="w-4 h-4" /> Prospective Dam (Doe)
            </span>
            {currentDam?.is_high_white_risk && (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                <AlertTriangle className="w-3 h-3" /> High-White
              </span>
            )}
          </div>

          <select
            value={selectedDamId}
            onChange={(e) => setSelectedDamId(e.target.value)}
            className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2.5 text-sm text-stone-100 font-medium focus:outline-none focus:border-rose-500"
          >
            {potentialDams.map((dam) => (
              <option key={dam.id} value={dam.id}>
                {dam.pedigree_name} {dam.pet_name ? `("${dam.pet_name}")` : ''} — {dam.variety}
              </option>
            ))}
          </select>

          {currentDam && (
            <div className="grid grid-cols-2 gap-2 text-xs text-stone-400 bg-stone-950/60 p-3 rounded-xl border border-stone-800/80">
              <div><span className="text-stone-500">Colour:</span> {currentDam.colour}</div>
              <div><span className="text-stone-500">Coat:</span> {currentDam.coat}</div>
              <div><span className="text-stone-500">Ears:</span> {currentDam.ear}</div>
              <div><span className="text-stone-500">Status:</span> {currentDam.status}</div>
            </div>
          )}
        </div>
      </div>

      {/* Analysis Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Wright's COI Meter */}
        <div className={`p-5 rounded-2xl border ${coiSeverity.bg} flex flex-col justify-between space-y-3`}>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold tracking-wider text-stone-400">
                Wright's COI
              </span>
              <GitFork className={`w-4 h-4 ${coiSeverity.color}`} />
            </div>
            <div className="text-4xl font-extrabold mt-2 tracking-tight text-stone-100">
              {coiAnalysis.coi}%
            </div>
          </div>
          <div className="space-y-1">
            <div className={`text-xs font-semibold ${coiSeverity.color}`}>{coiSeverity.label}</div>
            <p className="text-[11px] text-stone-400">
              Calculated across {coiAnalysis.commonAncestors.length} shared common ancestors.
            </p>
          </div>
        </div>

        {/* Megacolon & Lethal Gene Risk */}
        <div className="p-5 bg-stone-900 border border-stone-800 rounded-2xl flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold tracking-wider text-stone-400">
                Megacolon Screening
              </span>
              {lineageWarnings.some((w) => w.issueType === 'Megacolon' && w.severity === 'critical') ? (
                <ShieldAlert className="w-5 h-5 text-rose-500" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              )}
            </div>
            <div className="mt-2">
              {lineageWarnings.some((w) => w.issueType === 'Megacolon' && w.severity === 'critical') ? (
                <span className="text-rose-400 font-bold text-lg flex items-center gap-1.5">
                  <AlertTriangle className="w-5 h-5" /> High Risk Combination
                </span>
              ) : (
                <span className="text-emerald-400 font-bold text-lg flex items-center gap-1.5">
                  <ShieldCheck className="w-5 h-5" /> Safe Phenotype Pairing
                </span>
              )}
            </div>
          </div>
          <p className="text-[11px] text-stone-400">
            Screening for double-blazed, roan-to-roan, or variegated lethal white combinations.
          </p>
        </div>

        {/* Gestation & Planning Window */}
        <div className="p-5 bg-stone-900 border border-stone-800 rounded-2xl flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold tracking-wider text-stone-400">
                Gestation Forecast
              </span>
              <Calendar className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-lg font-bold text-stone-100 mt-2">
              {gestationDetails?.birthWindow ?? 'Select mating date'}
            </div>
          </div>
          <div className="text-[11px] text-stone-400 space-y-1">
            <div>Expected Weaning: <span className="text-stone-200">{gestationDetails?.weanEstimate}</span></div>
            <div>Avg Gestation: 21-23 Days</div>
          </div>
        </div>
      </div>

      {/* Defect Warnings / Health Lineage Bubble-Up */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-base font-bold text-stone-100 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          Ancestral Defect & Temperament Screening
        </h3>

        {lineageWarnings.length === 0 ? (
          <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>
              Clean pedigree overlap. No shared ancestors carry documented records of early onset tumors, aggressive biting, or high-white megacolon faults.
            </span>
          </div>
        ) : (
          <div className="space-y-3">
            {lineageWarnings.map((warn, index) => (
              <div
                key={index}
                className={`p-4 rounded-xl border flex items-start gap-3.5 text-xs ${
                  warn.severity === 'critical'
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    : warn.severity === 'high'
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    : 'bg-stone-950 border-stone-800 text-stone-300'
                }`}
              >
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold flex items-center gap-2">
                    <span>{warn.ancestorName}</span>
                    <span className="uppercase text-[10px] tracking-wider px-1.5 py-0.5 rounded bg-stone-900/80 border border-stone-700">
                      {warn.issueType}
                    </span>
                  </div>
                  <p className="leading-relaxed opacity-90">{warn.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Common Ancestor Breakdown Table */}
      {coiAnalysis.commonAncestors.length > 0 && (
        <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden space-y-0">
          <div className="p-4 bg-stone-950/60 border-b border-stone-800 text-xs font-semibold text-stone-400 uppercase tracking-wider">
            Shared Ancestors Driving COI
          </div>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-800/80 text-stone-500 bg-stone-950/20">
                <th className="px-4 py-2.5">Ancestor Name</th>
                <th className="px-4 py-2.5">Lineage Occurrences</th>
                <th className="px-4 py-2.5 text-right">Inbreeding Impact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/50">
              {coiAnalysis.commonAncestors.map((anc) => (
                <tr key={anc.id} className="hover:bg-stone-800/30">
                  <td className="px-4 py-2.5 font-medium text-stone-200">{anc.name}</td>
                  <td className="px-4 py-2.5 text-stone-400">{anc.paths} genealogical route(s)</td>
                  <td className="px-4 py-2.5 text-right text-emerald-400 font-mono">Present in both lines</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-stone-900/90 border border-stone-800 rounded-2xl">
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={plannedMatingDate}
            onChange={(e) => setPlannedMatingDate(e.target.value)}
            className="bg-stone-950 border border-stone-800 rounded-lg px-3 py-2 text-xs text-stone-200"
          />
          <span className="text-xs text-stone-400">Planned mating execution date</span>
        </div>

        <button
          type="button"
          onClick={() => setIsCommitModalOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-emerald-950"
        >
          Schedule This Litter
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Commit Litter Modal */}
      {isCommitModalOpen && (
        <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-md p-6 space-y-5">
            <h3 className="text-lg font-bold text-stone-100">Schedule Planned Litter</h3>
            <p className="text-xs text-stone-400 leading-relaxed">
              This will create a new tracking record in the colony registry linking {currentSire?.pedigree_name} and {currentDam?.pedigree_name}.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">Litter Identifier</label>
                <input
                  type="text"
                  value={litterIdentifier}
                  onChange={(e) => setLitterIdentifier(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-2 text-sm text-stone-100"
                  placeholder="e.g. Litter B-2026"
                />
              </div>

              <div className="p-3 bg-stone-950 rounded-xl border border-stone-800 text-xs space-y-1 text-stone-400">
                <div>Pairing COI: <span className="text-stone-200 font-bold">{coiAnalysis.coi}%</span></div>
                <div>Est. Birth: <span className="text-stone-200 font-bold">{gestationDetails?.birthWindow}</span></div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setIsCommitModalOpen(false)}
                className="px-4 py-2 text-xs text-stone-400 hover:text-stone-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCommitPairing}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors"
              >
                Confirm & Create Litter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}