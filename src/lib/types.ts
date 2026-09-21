export type BiologicalSex = 'Buck' | 'Doe';

export type RatStatus = 
  | 'Active Breeding' 
  | 'Grow Out' 
  | 'Pet Only' 
  | 'Retired' 
  | 'Deceased' 
  | 'Culled';

export type EarType = 'Top' | 'Dumbo';

export type CoatType = 
  | 'Standard' 
  | 'Rex' 
  | 'Double Rex' 
  | 'Hairless' 
  | 'Silken' 
  | 'Silken Rex' 
  | 'Velveteen';

export type HealthCategory =
  | 'Respiratory'
  | 'Mammary / Fatty Lumps'
  | 'Other Tumours'
  | 'Neurological'
  | 'Abscess / Infection'
  | 'Heart / Sudden'
  | 'Kidney'
  | 'Hind Leg Degeneration (HLD)'
  | 'Megacolon'
  | 'Birthing / Pregnancy'
  | 'Other';

export interface HealthIncident {
  id: string;
  rat_id: string;
  category: HealthCategory;
  age_of_onset_months: number;
  description?: string;
  veterinary_diagnosis?: string;
  treatment?: string;
  is_fatal: boolean;
  incident_date: string;
  created_at: string;
}

export interface RatWeight {
  id: string;
  rat_id: string;
  weigh_date: string;
  weight_grams: number;
  milestone_interval?: '2d' | '1w' | '2w' | '3w' | '4w' | '5w' | '6w' | '3m' | '6m' | '12m' | '18m' | '24m' | '30m' | '36m' | '42m';
  notes?: string;
}

export interface RatRecord {
  id: string;
  litter_id?: string | null;
  sire_id?: string | null;
  dam_id?: string | null;
  
  pedigree_name: string;
  pet_name?: string;
  breeder?: string;
  owner?: string;
  owner_contact?: string;
  
  sex: BiologicalSex;
  variety: string;
  colour: string;
  marking?: string;
  coat: CoatType;
  ear: EarType;
  tail_kink: boolean;
  known_genetics?: string;
  is_high_white_risk: boolean;
  
  dob: string;
  dod?: string | null;
  status: RatStatus;
  age_at_death_months?: number;
  cause_of_death_l1?: string;
  cause_of_death_l2?: string;
  cause_of_death_details?: string;
  
  bites_humans: boolean;
  aggressive_to_rats: boolean;
  neutered_behaviour: boolean;
  neutered_health: boolean;
  notes?: string;
  
  created_at?: string;
  updated_at?: string;
}

export interface LitterRecord {
  id: string;
  identifier: string;
  sire_id?: string | null;
  dam_id?: string | null;
  mating_date?: string;
  birth_date: string;
  time_of_birth?: string;
  
  total_born_live: number;
  total_born_dead: number;
  bucks_count: number;
  does_count: number;
  infant_deaths_count: number;
  
  dam_weight_start?: number;
  dam_weight_d9_11?: number;
  dam_weight_d13_15?: number;
  dam_weight_d17_18?: number;
  dam_weight_d20_21?: number;
  dam_weight_post_birth?: number;
  
  milestone_ears_lift?: string;
  milestone_pigment?: string;
  milestone_fuzz?: string;
  milestone_eyes_open?: string;
  milestone_walking?: string;
  milestone_eating_solids?: string;
  milestone_weaned?: string;
  milestone_sex_separated?: string;
  
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PedigreeTreeNode {
  id: string;
  pedigree_name: string;
  pet_name?: string;
  sex: BiologicalSex;
  variety: string;
  colour: string;
  sire_id?: string | null;
  dam_id?: string | null;
  dob: string;
  dod?: string | null;
  is_high_white_risk: boolean;
  generation: number;
  relation_path: string;
  sire?: PedigreeTreeNode | null;
  dam?: PedigreeTreeNode | null;
}

export interface PairingRiskAnalysis {
  sire_id: string;
  dam_id: string;
  coi_percentage: number;
  common_ancestors: Array<{
    ancestor_id: string;
    pedigree_name: string;
    occurrences_in_sire_line: number;
    occurrences_in_dam_line: number;
  }>;
  megacolon_warning: boolean;
  shared_defect_warnings: Array<{
    category: HealthCategory;
    ancestor_name: string;
    details: string;
  }>;
}