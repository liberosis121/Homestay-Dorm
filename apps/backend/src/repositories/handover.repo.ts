import { supabase } from '../utils/supabase';

export interface CreateHandoverDto {
  customer_id: string;
  customer_name: string;
  room_id: string;
  room_name: string;
  handover_date: string;
  checklist: { item: string; condition: string; note?: string; checked: boolean; quantity?: number }[];
  customer_signed?: boolean;
  manager_signed?: boolean;
  signature_ip?: string;
  signature_timestamp?: string;
  status: 'pending' | 'signed' | 'partial';
  note?: string;