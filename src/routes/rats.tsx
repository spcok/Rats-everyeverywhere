import { createFileRoute } from '@tanstack/react-router';
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  GitFork,
  Search,
  Plus,
  AlertTriangle,
  X,
  ShieldAlert,
  Loader2,
  Inbox,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { RatRecord, BiologicalSex, RatStatus, CoatType, EarType, PedigreeTreeNode } from '@/lib/types';
import { buildPedigreeTree, evaluateHighWhiteRisk } from '@/lib/pedigree';

export const Route = createFileRoute('/rats')({
  component: RatsComponent,
});

function RatsComponent() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [sexFilter, setSexFilter] = useState<'All' | BiologicalSex>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | RatStatus>('All');
  const [selectedPedigreeRatId, setSelectedPedigreeRatId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Fetch real rats directly from Supabase
  const { data: rats = [], isLoading, error } = useQuery<RatRecord[]>({
    queryKey: ['rats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rats')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch colony records:', error);
        return [];
      }
      return (data as RatRecord[]) ?? [];
    },
  });

  const ratsMap = useMemo(() => {
    return new Map<string, RatRecord>(rats.map((r) => [r.id, r]));
  }, [rats]);

  const filteredRats = useMemo(() => {
    return rats.filter((rat) => {
      const matchesSearch =
        rat.pedigree_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (rat.pet_name && rat.pet_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        rat.variety.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rat.colour.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSex = sexFilter === 'All' || rat.sex === sexFilter;
      const matchesStatus = statusFilter === 'All' || rat.status === statusFilter;

      return matchesSearch && matchesSex && matchesStatus;
    });
  }, [rats, searchTerm, sexFilter, statusFilter]);

  const activePedigreeTree = useMemo(() => {
    if (!selectedPedigreeRatId) return null;
    return buildPedigreeTree(selectedPedigreeRatId, ratsMap, 0, 4);
  }, [selectedPedigreeRatId, ratsMap]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Action Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-stone-100">Rat Registry & Colony</h2>
          <p className="text-sm text-stone-400">
            Manage individual records, trace phenotypes, and inspect recursive pedigrees.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Rat
        </button>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-stone-900 border border-stone-800 rounded-xl">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, variety, or colour..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-stone-950 border border-stone-800 rounded-lg pl-9 pr-4 py-2 text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <select
          value={sexFilter}
          onChange={(e) => setSexFilter(e.target.value as 'All' | BiologicalSex)}
          className="bg-stone-950 border border-stone-800 rounded-lg px-3 py-2 text-sm text-stone-200 focus:outline-none focus:border-emerald-500"
        >
          <option value="All">All Sexes</option>
          <option value="Buck">Bucks (Males)</option>
          <option value="Doe">Does (Females)</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'All' | RatStatus)}
          className="bg-stone-950 border border-stone-800 rounded-lg px-3 py-2 text-sm text-stone-200 focus:outline-none focus:border-emerald-500"
        >
          <option value="All">All Statuses</option>
          <option value="Active Breeding">Active Breeding</option>
          <option value="Grow Out">Grow Out</option>
          <option value="Pet Only">Pet Only</option>
          <option value="Retired">Retired</option>
          <option value="Deceased">Deceased</option>
          <option value="Culled">Culled</option>
        </select>
      </div>

      {/* Colony Grid Table */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-stone-400 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
            <p className="text-sm">Loading colony records...</p>
          </div>
        ) : filteredRats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-stone-400 gap-3">
            <Inbox className="w-10 h-10 text-stone-600" />
            <div className="text-center">
              <p className="text-sm font-medium text-stone-300">No rats found</p>
              <p className="text-xs text-stone-500 mt-1">
                {rats.length === 0
                  ? 'Your colony database is empty. Click "Add Rat" to register your first animal.'
                  : 'No records match your active search and filter criteria.'}
              </p>
            </div>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-800 bg-stone-950/60 text-xs font-semibold text-stone-400 uppercase tracking-wider">
                <th className="px-4 py-3">Pedigree Name</th>
                <th className="px-4 py-3">Sex</th>
                <th className="px-4 py-3">Variety / Colour</th>
                <th className="px-4 py-3">Coat & Ear</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">D.O.B.</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/60 text-sm">
              {filteredRats.map((rat) => (
                <tr key={rat.id} className="hover:bg-stone-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-stone-100 flex items-center gap-2">
                      {rat.pedigree_name}
                      {rat.is_high_white_risk && (
                        <span title="High-white / Megacolon risk">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 inline" />
                        </span>
                      )}
                    </div>
                    {rat.pet_name && <div className="text-xs text-stone-400">"{rat.pet_name}"</div>}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        rat.sex === 'Buck'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {rat.sex}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-stone-300">
                    <div>{rat.variety}</div>
                    <div className="text-xs text-stone-500">{rat.colour}</div>
                  </td>
                  <td className="px-4 py-3 text-stone-400 text-xs">
                    {rat.coat} • {rat.ear} Ear
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
                        rat.status === 'Active Breeding'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-stone-800 text-stone-400'
                      }`}
                    >
                      {rat.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-stone-400 text-xs">{rat.dob}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedPedigreeRatId(rat.id)}
                      className="inline-flex items-center gap-1 bg-stone-800 hover:bg-stone-700 text-stone-200 px-2.5 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer"
                    >
                      <GitFork className="w-3.5 h-3.5 text-emerald-400" />
                      Pedigree
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 4-Generation Pedigree Tree Modal */}
      {selectedPedigreeRatId && activePedigreeTree && (
        <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-stone-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400">
                  <GitFork className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-stone-100">4-Generation Ancestral Pedigree</h3>
                  <p className="text-xs text-stone-400">
                    Subject: {activePedigreeTree.pedigree_name} ({activePedigreeTree.sex})
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPedigreeRatId(null)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-x-auto flex-1">
              <div className="min-w-[850px] grid grid-cols-4 gap-4 items-center">
                <div className="space-y-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-stone-500">Subject</div>
                  <PedigreeCard node={activePedigreeTree} isRoot />
                </div>

                <div className="space-y-6">
                  <div className="text-xs font-semibold uppercase tracking-wider text-stone-500">Parents</div>
                  <PedigreeCard node={activePedigreeTree.sire} label="Sire (Dad)" expectedSex="Buck" />
                  <PedigreeCard node={activePedigreeTree.dam} label="Dam (Mum)" expectedSex="Doe" />
                </div>

                <div className="space-y-3">
                  <div className="text-xs font-semibold uppercase tracking-wider text-stone-500">Grandparents</div>
                  <PedigreeCard node={activePedigreeTree.sire?.sire} label="Paternal Grandsire" expectedSex="Buck" compact />
                  <PedigreeCard node={activePedigreeTree.sire?.dam} label="Paternal Granddam" expectedSex="Doe" compact />
                  <PedigreeCard node={activePedigreeTree.dam?.sire} label="Maternal Grandsire" expectedSex="Buck" compact />
                  <PedigreeCard node={activePedigreeTree.dam?.dam} label="Maternal Granddam" expectedSex="Doe" compact />
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-wider text-stone-500">Great Grandparents</div>
                  <PedigreeCard node={activePedigreeTree.sire?.sire?.sire} label="SSS" expectedSex="Buck" ultraCompact />
                  <PedigreeCard node={activePedigreeTree.sire?.sire?.dam} label="SSD" expectedSex="Doe" ultraCompact />
                  <PedigreeCard node={activePedigreeTree.sire?.dam?.sire} label="SDS" expectedSex="Buck" ultraCompact />
                  <PedigreeCard node={activePedigreeTree.sire?.dam?.dam} label="SDD" expectedSex="Doe" ultraCompact />
                  <PedigreeCard node={activePedigreeTree.dam?.sire?.sire} label="DSS" expectedSex="Buck" ultraCompact />
                  <PedigreeCard node={activePedigreeTree.dam?.sire?.dam} label="DSD" expectedSex="Doe" ultraCompact />
                  <PedigreeCard node={activePedigreeTree.dam?.dam?.sire} label="DDS" expectedSex="Buck" ultraCompact />
                  <PedigreeCard node={activePedigreeTree.dam?.dam?.dam} label="DDD" expectedSex="Doe" ultraCompact />
                </div>
              </div>
            </div>

            <div className="p-4 bg-stone-950/60 border-t border-stone-800 text-xs text-stone-400 flex items-center justify-between">
              <span>* Ancestors mapped dynamically using parent pointers (sire_id & dam_id).</span>
              <span className="flex items-center gap-1 text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5" /> High-white marker triggers megacolon alerts in pairing simulations
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Add Rat Modal Form */}
      {isAddModalOpen && (
        <AddRatModal
          onClose={() => setIsAddModalOpen(false)}
          existingRats={rats}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['rats'] });
            setIsAddModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

function PedigreeCard({
  node,
  label,
  expectedSex,
  isRoot,
  compact,
  ultraCompact,
}: {
  node?: PedigreeTreeNode | null;
  label?: string;
  expectedSex?: BiologicalSex;
  isRoot?: boolean;
  compact?: boolean;
  ultraCompact?: boolean;
}) {
  if (!node) {
    return (
      <div
        className={`border border-dashed border-stone-800 rounded-lg p-3 bg-stone-950/30 text-stone-600 text-xs flex flex-col justify-center ${
          ultraCompact ? 'h-11' : compact ? 'h-20' : 'h-28'
        }`}
      >
        <span className="font-medium text-stone-500">{label || 'Unknown Ancestor'}</span>
        {!ultraCompact && <span className="text-[10px] text-stone-600">No record logged</span>}
      </div>
    );
  }

  const isBuck = node.sex === 'Buck';

  if (ultraCompact) {
    return (
      <div
        className={`border rounded p-1.5 text-[11px] truncate flex items-center justify-between bg-stone-950/80 ${
          isBuck ? 'border-blue-900/60' : 'border-rose-900/60'
        }`}
      >
        <span className="truncate font-medium text-stone-200" title={node.pedigree_name}>
          {node.pedigree_name}
        </span>
        {node.is_high_white_risk && <ShieldAlert className="w-3 h-3 text-amber-400 shrink-0 ml-1" />}
      </div>
    );
  }

  return (
    <div
      className={`border rounded-xl p-3 bg-stone-950 transition-all ${
        isRoot
          ? 'border-emerald-500/50 bg-stone-900 ring-1 ring-emerald-500/20 shadow-lg'
          : isBuck
          ? 'border-blue-500/30 hover:border-blue-500/60'
          : 'border-rose-500/30 hover:border-rose-500/60'
      } ${compact ? 'space-y-1' : 'space-y-2'}`}
    >
      {label && (
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-stone-400">
          <span>{label}</span>
          <span className={isBuck ? 'text-blue-400' : 'text-rose-400'}>{node.sex}</span>
        </div>
      )}

      <div>
        <div className="font-semibold text-stone-100 text-xs truncate flex items-center gap-1.5" title={node.pedigree_name}>
          {node.pedigree_name}
          {node.is_high_white_risk && (
            <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" title="High-white marker" />
          )}
        </div>
        {node.pet_name && <div className="text-[11px] text-stone-400">"{node.pet_name}"</div>}
      </div>

      <div className="text-[11px] text-stone-400">
        <div>{node.variety}</div>
        <div className="text-stone-500 text-[10px]">{node.colour}</div>
      </div>
    </div>
  );
}

function AddRatModal({
  onClose,
  existingRats,
  onSuccess,
}: {
  onClose: () => void;
  existingRats: RatRecord[];
  onSuccess: () => void;
}) {
  const [pedigreeName, setPedigreeName] = useState('');
  const [petName, setPetName] = useState('');
  const [sex, setSex] = useState<BiologicalSex>('Buck');
  const [variety, setVariety] = useState('Berkshire');
  const [colour, setColour] = useState('Agouti');
  const [coat, setCoat] = useState<CoatType>('Standard');
  const [ear, setEar] = useState<EarType>('Top');
  const [sireId, setSireId] = useState<string>('');
  const [damId, setDamId] = useState<string>('');
  const [dob, setDob] = useState(new Date().toISOString().split('T')[0] ?? '');
  const [isHighWhite, setIsHighWhite] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVarietyChange = (val: string) => {
    setVariety(val);
    if (evaluateHighWhiteRisk(val)) {
      setIsHighWhite(true);
    }
  };

  const potentialSires = existingRats.filter((r) => r.sex === 'Buck');
  const potentialDams = existingRats.filter((r) => r.sex === 'Doe');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pedigreeName.trim()) return;

    setIsSubmitting(true);

    const newRecord: Partial<RatRecord> = {
      pedigree_name: pedigreeName.trim(),
      pet_name: petName.trim() || undefined,
      sex,
      variety,
      colour,
      coat,
      ear,
      tail_kink: false,
      sire_id: sireId || null,
      dam_id: damId || null,
      dob,
      status: 'Active Breeding',
      is_high_white_risk: isHighWhite,
      bites_humans: false,
      aggressive_to_rats: false,
      neutered_behaviour: false,
      neutered_health: false,
    };

    const { error } = await supabase.from('rats').insert([newRecord]);
    if (error) {
      console.error('Error inserting rat:', error);
      alert(`Failed to save rat: ${error.message}`);
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-stone-800 pb-4">
          <h3 className="text-lg font-bold text-stone-100">Register New Rat</h3>
          <button type="button" onClick={onClose} className="text-stone-400 hover:text-stone-100 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">Pedigree / Show Name *</label>
              <input
                required
                type="text"
                placeholder="e.g. Oakridge Silver Star"
                value={pedigreeName}
                onChange={(e) => setPedigreeName(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-2 text-sm text-stone-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">Call / Pet Name</label>
              <input
                type="text"
                placeholder="e.g. Star"
                value={petName}
                onChange={(e) => setPetName(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-2 text-sm text-stone-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">Sex</label>
              <select
                value={sex}
                onChange={(e) => setSex(e.target.value as BiologicalSex)}
                className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-2 text-sm text-stone-200"
              >
                <option value="Buck">Buck (Male)</option>
                <option value="Doe">Doe (Female)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">Coat</label>
              <select
                value={coat}
                onChange={(e) => setCoat(e.target.value as CoatType)}
                className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-2 text-sm text-stone-200"
              >
                <option value="Standard">Standard</option>
                <option value="Rex">Rex</option>
                <option value="Double Rex">Double Rex</option>
                <option value="Hairless">Hairless</option>
                <option value="Silken">Silken</option>
                <option value="Velveteen">Velveteen</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">Ear Type</label>
              <select
                value={ear}
                onChange={(e) => setEar(e.target.value as EarType)}
                className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-2 text-sm text-stone-200"
              >
                <option value="Top">Top Ear</option>
                <option value="Dumbo">Dumbo</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">Variety / Marking</label>
              <input
                type="text"
                placeholder="e.g. Berkshire, Blazed, Roan"
                value={variety}
                onChange={(e) => handleVarietyChange(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-2 text-sm text-stone-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">Colour</label>
              <input
                type="text"
                placeholder="e.g. Agouti, British Blue, Mink"
                value={colour}
                onChange={(e) => setColour(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-2 text-sm text-stone-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 p-3 bg-stone-950/60 rounded-xl border border-stone-800/80">
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">Sire (Father)</label>
              <select
                value={sireId}
                onChange={(e) => setSireId(e.target.value)}
                className="w-full bg-stone-900 border border-stone-800 rounded-lg px-3 py-2 text-xs text-stone-200"
              >
                <option value="">None / Unknown / Foundation Outcross</option>
                {potentialSires.map((sire) => (
                  <option key={sire.id} value={sire.id}>
                    {sire.pedigree_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">Dam (Mother)</label>
              <select
                value={damId}
                onChange={(e) => setDamId(e.target.value)}
                className="w-full bg-stone-900 border border-stone-800 rounded-lg px-3 py-2 text-xs text-stone-200"
              >
                <option value="">None / Unknown / Foundation Outcross</option>
                {potentialDams.map((dam) => (
                  <option key={dam.id} value={dam.id}>
                    {dam.pedigree_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 items-center">
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">Date of Birth</label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-2 text-sm text-stone-200"
              />
            </div>

            <div className="pt-5">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-stone-300">
                <input
                  type="checkbox"
                  checked={isHighWhite}
                  onChange={(e) => setIsHighWhite(e.target.checked)}
                  className="rounded bg-stone-950 border-stone-800 text-emerald-500 focus:ring-0"
                />
                High-White Risk (Blazed/Roan/Essex)
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-stone-400 hover:text-stone-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save to Registry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}