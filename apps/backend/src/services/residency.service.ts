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
}

export const residencyService = {
  getResidencyChecks: async (filters?: { status?: string }) => {
    let query = supabase.from('residency_checks').select('*');
    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }