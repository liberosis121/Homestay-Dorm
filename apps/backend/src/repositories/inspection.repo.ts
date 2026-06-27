import { supabase } from '../utils/supabase';

export interface CreateInspectionDto {
  room_id: string;
  room_name: string;
  inspector_name: string;
  inspected_at: string;
  checklist: { asset_id: string; asset_name: string; status: string; condition: string; note?: string }[];
  notes?: string;