export type BiologicalSex = 'Buck' | 'Doe';

export type RatStatus = 
  | 'Active Breeding' 
  | 'Grow Out' 
  | 'Pet Only' 
  | 'Retired' 
  | 'Deceased' 
  | 'Culled';

export type EarType = 'Top' | 'Dumbo';
export type CoatType = 'Standard' | 'Rex' | 'Double Rex' | 'Hairless' | 'Silken' | 'Velveteen';

export interface HealthIncident {
  id: string;
  rat_id: string;
  category: 'Respiratory' | 'Tumour / Mass' | 'Megacolon' | 'Neurological' | 'Heart' | 'Kidney' | 'Abscess' | 'Other';
  age_of_onset_months: number;
  notes?: string;
  is_fatal: boolean;
  logged_at: string;
}

export interface RatRecord {
  id: string;
  litter_id?: string | null;
  sire_id?: string | null;
  dam_id?: string | null;
  pedigree_name: string;
  pet_name?: string;
  variety: string;
  colour: string;
  marking: string;
  coat: CoatType;
  ear: EarType;
  sex: BiologicalSex;
  dob: string;
  dod?: string | null;
  status: RatStatus;
  notes?: string;
  is_high_white_risk: boolean;
}

export interface LitterRecord {
  id: string;
  identifier: string;
  sire_id: string;
  dam_id: string;
  mating_date?: string;
  birth_date: string;
  total_born: number;
  bucks_born: number;
  does_born: number;
  stillborn_count: number;
  infant_deaths_count: number;
  current_alive_count: number;
  notes?: string;
}