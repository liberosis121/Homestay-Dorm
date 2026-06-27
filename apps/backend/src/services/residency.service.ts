import { supabase } from '../utils/supabase';

export interface ResidencyCheckUpdate {
  status: 'pending' | 'approved' | 'rejected';
  checklist: {
    valid_documents: boolean;
    info_matches: boolean;
    age_verified: boolean;
    no_violation: boolean;
  };
  violation_note?: string;
  confirmed?: boolean;