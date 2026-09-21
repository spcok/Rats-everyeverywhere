import type { HealthIncident, PedigreeTreeNode, RatRecord } from './types';

export interface SharedLineageWarning {
  ancestorId: string;
  ancestorName: string;
  issueType: 'Megacolon' | 'Temperament' | 'Tumour' | 'Respiratory' | 'Organ Failure';
  severity: 'critical' | 'high' | 'caution';
  description: string;
}

/**
 * Builds a recursive pedigree tree up to maxDepth (default 4 generations: Self, Parents, Grandparents, G-Grandparents).
 * Uses a cycle detection set to prevent stack overflow if circular references exist.
 */
export function buildPedigreeTree(
  ratId: string | null | undefined,
  ratsMap: Map<string, RatRecord>,
  currentDepth = 0,
  maxDepth = 4,
  relationPath = 'ROOT',
  visitedIds = new Set<string>()
): PedigreeTreeNode | null {
  if (!ratId || currentDepth >= maxDepth) return null;

  const rat = ratsMap.get(ratId);
  if (!rat) return null;

  // Prevent infinite cycles in malformed lineage data
  if (visitedIds.has(rat.id)) {
    console.warn(`Circular lineage detected for rat ${rat.pedigree_name} (${rat.id})`);
    return null;
  }

  const nextVisited = new Set(visitedIds);
  nextVisited.add(rat.id);

  const sireNode = rat.sire_id
    ? buildPedigreeTree(
        rat.sire_id,
        ratsMap,
        currentDepth + 1,
        maxDepth,
        `${relationPath}->S`,
        nextVisited
      )
    : null;

  const damNode = rat.dam_id
    ? buildPedigreeTree(
        rat.dam_id,
        ratsMap,
        currentDepth + 1,
        maxDepth,
        `${relationPath}->D`,
        nextVisited
      )
    : null;

  return {
    id: rat.id,
    pedigree_name: rat.pedigree_name,
    pet_name: rat.pet_name,
    sex: rat.sex,
    variety: rat.variety,
    colour: rat.colour,
    sire_id: rat.sire_id,
    dam_id: rat.dam_id,
    dob: rat.dob,
    dod: rat.dod,
    is_high_white_risk: rat.is_high_white_risk,
    generation: currentDepth,
    relation_path: relationPath,
    sire: sireNode,
    dam: damNode,
  };
}

/**
 * Traverses all ancestors and records their paths and generation depths from the starting rat.
 */
function getAncestorPaths(
  startId: string,
  ratsMap: Map<string, RatRecord>,
  depth = 0,
  maxDepth = 6,
  visited = new Set<string>()
): Map<string, number[]> {
  const ancestorPaths = new Map<string, number[]>();
  if (depth >= maxDepth || visited.has(startId)) return ancestorPaths;

  const rat = ratsMap.get(startId);
  if (!rat) return ancestorPaths;

  const currentVisited = new Set(visited);
  currentVisited.add(startId);

  const parents = [rat.sire_id, rat.dam_id].filter((id): id is string => Boolean(id));

  for (const parentId of parents) {
    const existing = ancestorPaths.get(parentId) ?? [];
    existing.push(depth + 1);
    ancestorPaths.set(parentId, existing);

    const subAncestors = getAncestorPaths(parentId, ratsMap, depth + 1, maxDepth, currentVisited);
    for (const [ancestorId, depths] of subAncestors.entries()) {
      const parentExisting = ancestorPaths.get(ancestorId) ?? [];
      ancestorPaths.set(ancestorId, [...parentExisting, ...depths]);
    }
  }

  return ancestorPaths;
}

/**
 * Calculates Wright's Coefficient of Inbreeding (COI) between a Sire and a Dam.
 * Formula: F_x = sum((1/2)^(n1 + n2 + 1) * (1 + F_A))
 */
export function calculatePairingCOI(
  sireId: string | null | undefined,
  damId: string | null | undefined,
  ratsMap: Map<string, RatRecord>
): { coi: number; commonAncestors: Array<{ id: string; name: string; paths: number }> } {
  if (!sireId || !damId) return { coi: 0, commonAncestors: [] };

  const sireAncestors = getAncestorPaths(sireId, ratsMap);
  const damAncestors = getAncestorPaths(damId, ratsMap);

  let totalCOI = 0;
  const commonAncestors: Array<{ id: string; name: string; paths: number }> = [];

  for (const [ancestorId, sireDepths] of sireAncestors.entries()) {
    if (damAncestors.has(ancestorId)) {
      const damDepths = damAncestors.get(ancestorId)!;
      const ancestorRat = ratsMap.get(ancestorId);
      let pathCount = 0;

      for (const sDepth of sireDepths) {
        for (const dDepth of damDepths) {
          // n1 = sDepth - 1, n2 = dDepth - 1
          // Exponent = (sDepth - 1) + (dDepth - 1) + 1 = sDepth + dDepth - 1
          const power = sDepth + dDepth - 1;
          totalCOI += Math.pow(0.5, power);
          pathCount++;
        }
      }

      commonAncestors.push({
        id: ancestorId,
        name: ancestorRat?.pedigree_name || 'Unknown Ancestor',
        paths: pathCount,
      });
    }
  }

  return {
    coi: Math.min(Number((totalCOI * 100).toFixed(2)), 100),
    commonAncestors,
  };
}

/**
 * Checks for high-white markings that could lead to lethal Megacolon when paired.
 */
export function evaluateHighWhiteRisk(varietyOrMarking: string): boolean {
  if (!varietyOrMarking) return false;

  const highWhitePatterns = [
    'blaze',
    'blazed',
    'variegated',
    'roan',
    'essex',
    'badger',
    'downunder',
    'high white',
    'high-white',
    'spotted downunder',
    'capped essex',
    'striped roan',
  ];
  const normalized = varietyOrMarking.toLowerCase();
  return highWhitePatterns.some((pattern) => normalized.includes(pattern));
}

/**
 * Traverses common ancestors to identify duplicate lines carrying known genetic faults,
 * high-white megacolon overlaps, early onset tumors, or documented aggression.
 */
export function analyzeLineageRisks(
  sire: RatRecord,
  dam: RatRecord,
  commonAncestors: Array<{ id: string; name: string; paths: number }>,
  ratsMap: Map<string, RatRecord>,
  healthIncidents: HealthIncident[] = []
): SharedLineageWarning[] {
  const warnings: SharedLineageWarning[] = [];

  // 1. Direct High-White / Megacolon Check between parents
  const sireHighWhite = sire.is_high_white_risk || evaluateHighWhiteRisk(sire.variety);
  const damHighWhite = dam.is_high_white_risk || evaluateHighWhiteRisk(dam.variety);

  if (sireHighWhite && damHighWhite) {
    warnings.push({
      ancestorId: 'direct-parents',
      ancestorName: `${sire.pedigree_name} × ${dam.pedigree_name}`,
      issueType: 'Megacolon',
      severity: 'critical',
      description:
        'Lethal Megacolon Risk: Both parents exhibit high-white/blazed phenotype markings. High risk of lethal aganglionosis in offspring.',
    });
  }

  // 2. Direct Parental Temperament Check
  if (sire.bites_humans || sire.aggressive_to_rats || sire.neutered_behaviour) {
    warnings.push({
      ancestorId: sire.id,
      ancestorName: sire.pedigree_name,
      issueType: 'Temperament',
      severity: 'high',
      description:
        'Sire has logged hormonal aggression or biting incidents. High heritability to male offspring.',
    });
  }

  if (dam.bites_humans || dam.aggressive_to_rats) {
    warnings.push({
      ancestorId: dam.id,
      ancestorName: dam.pedigree_name,
      issueType: 'Temperament',
      severity: 'high',
      description: 'Dam has logged biting or aggression incidents.',
    });
  }

  // 3. Ancestral Fault Bubble-Up across shared ancestors
  const healthByRat = new Map<string, HealthIncident[]>();
  for (const incident of healthIncidents) {
    const list = healthByRat.get(incident.rat_id) ?? [];
    list.push(incident);
    healthByRat.set(incident.rat_id, list);
  }

  for (const common of commonAncestors) {
    const ancestor = ratsMap.get(common.id);
    if (!ancestor) continue;

    // Check ancestor megacolon carrier status
    if (ancestor.is_high_white_risk || evaluateHighWhiteRisk(ancestor.variety)) {
      warnings.push({
        ancestorId: ancestor.id,
        ancestorName: ancestor.pedigree_name,
        issueType: 'Megacolon',
        severity: 'caution',
        description: `Common ancestor carries high-white markers across ${common.paths} line path(s).`,
      });
    }

    // Check ancestor aggression
    if (ancestor.bites_humans || ancestor.aggressive_to_rats) {
      warnings.push({
        ancestorId: ancestor.id,
        ancestorName: ancestor.pedigree_name,
        issueType: 'Temperament',
        severity: 'high',
        description:
          'Common ancestor had documented aggression issues appearing in both lines.',
      });
    }

    // Check ancestor logged health incidents
    const incidents = healthByRat.get(ancestor.id) ?? [];
    for (const inc of incidents) {
      if (inc.category === 'Mammary / Fatty Lumps' || inc.category === 'Other Tumours') {
        warnings.push({
          ancestorId: ancestor.id,
          ancestorName: ancestor.pedigree_name,
          issueType: 'Tumour',
          severity: inc.age_of_onset_months < 18 ? 'high' : 'caution',
          description: `Early tumour onset (${inc.age_of_onset_months}m) in common ancestor ${ancestor.pedigree_name}.`,
        });
      }

      if (inc.category === 'Respiratory' && inc.is_fatal) {
        warnings.push({
          ancestorId: ancestor.id,
          ancestorName: ancestor.pedigree_name,
          issueType: 'Respiratory',
          severity: 'high',
          description: `Fatal respiratory vulnerability noted in common ancestor ${ancestor.pedigree_name}.`,
        });
      }

      if (inc.category === 'Kidney' || inc.category === 'Heart / Sudden') {
        warnings.push({
          ancestorId: ancestor.id,
          ancestorName: ancestor.pedigree_name,
          issueType: 'Organ Failure',
          severity: inc.age_of_onset_months < 18 ? 'high' : 'caution',
          description: `${inc.category} event logged at ${inc.age_of_onset_months}m in common ancestor ${ancestor.pedigree_name}.`,
        });
      }
    }
  }

  return warnings;
}