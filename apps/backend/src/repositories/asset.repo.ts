import { supabase } from '../utils/supabase';

export interface CreateAssetDto {
  name: string;
  category: 'furniture' | 'electronics' | 'appliance' | 'fixture';
  serial_number?: string;
  current_location: string;
  location_type: 'room' | 'warehouse' | 'maintenance';
  status: 'in_use' | 'in_stock' | 'maintenance' | 'retired';
  purchase_date: string;
  purchase_price: number;
  depreciation_rate: number;
  transfer_history?: any[];
}