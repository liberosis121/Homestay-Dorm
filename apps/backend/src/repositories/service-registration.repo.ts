import { supabase } from '../utils/supabase';

export interface DbService {
  id: string;
  name: string;
  service_type: 'essential' | 'utility' | 'convenience' | 'premium';
  description: string;
  unit: string;
  price: number;
  billing_cycle: string;
  status: string;
}

export interface DbServiceRegistration {
  service_id: string;
  contract_id: string;
  start_date: string;
  end_date: string | null;
  amount: number;
  services?: DbService | null;
}

export interface DbUtilityRecord {
  id: number;
  room_id: string;
  billing_period: string;
  start_electricity: number;
  end_electricity: number;
  start_water: number;
  end_water: number;
  recorded_date: string;
}

export const serviceRegistrationRepo = {
  findSubscriptionsByContractIds: async (contractIds: string[]): Promise<DbServiceRegistration[]> => {
    if (contractIds.length === 0) return [];
    const { data, error } = await supabase
      .from('service_registrations')
      .select('*, services(*)')
      .in('contract_id', contractIds);
    if (error) throw error;
    return (data || []) as DbServiceRegistration[];
  },

  findConsumptionByRoomIds: async (roomIds: string[]): Promise<DbUtilityRecord[]> => {
    if (roomIds.length === 0) return [];
    const { data, error } = await supabase
      .from('electricity_water_records')
      .select('*')
      .in('room_id', roomIds)
      .order('recorded_date', { ascending: true });
    if (error) throw error;
    return (data || []) as DbUtilityRecord[];
  },

  addSubscription: async (contractId: string, serviceId: string, amount: number): Promise<DbServiceRegistration> => {
    const { data, error } = await supabase
      .from('service_registrations')
      .insert({
        contract_id: contractId,
        service_id: serviceId,
        start_date: new Date().toISOString().split('T')[0],
        end_date: null,
        amount
      })
      .select('*, services(*)');
    if (error) throw error;
    return data[0] as DbServiceRegistration;
  },

  cancelSubscription: async (contractId: string, serviceId: string): Promise<DbServiceRegistration> => {
    const { data, error } = await supabase
      .from('service_registrations')
      .update({
        end_date: new Date().toISOString().split('T')[0]
      })
      .eq('contract_id', contractId)
      .eq('service_id', serviceId)
      .select('*, services(*)');
    if (error) throw error;
    return data[0] as DbServiceRegistration;
  }
};
