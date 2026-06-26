import { contractRepo } from '../repositories/contract.repo';
import { serviceRegistrationRepo, DbServiceRegistration } from '../repositories/service-registration.repo';
import { supabase } from '../utils/supabase';

export const serviceRegistrationService = {
  getServicesAndSubscriptions: async (userId: string) => {
    // 1. Get all available services in catalog (always exposed to guest and customer)
    const { data: dbServices, error: sErr } = await supabase
      .from('services')
      .select('*')
      .order('id', { ascending: true });

    if (sErr) throw sErr;

    const mappedServices = (dbServices || []).map((s: any) => {
      let category: 'essential' | 'utility' | 'convenience' | 'premium' = 'convenience';
      if (s.service_type === 'utility') category = 'utility';
      else if (s.service_type === 'essential') category = 'essential';
      else if (s.service_type === 'premium') category = 'premium';

      let icon = 'settings';
      if (s.id === 'DV-001') icon = 'bolt';
      else if (s.id === 'DV-002') icon = 'water_drop';
      else if (s.id === 'DV-003') icon = 'wifi';
      else if (s.id === 'DV-004') icon = 'local_laundry_service';

      let billingCycle: 'monthly' | 'per_use' | 'per_kwh' | 'per_m3' = 'monthly';
      if (s.id === 'DV-001') billingCycle = 'per_kwh';
      else if (s.id === 'DV-002') billingCycle = 'per_m3';
      else if (s.id === 'DV-004') billingCycle = 'per_use';

      return {
        id: s.id,
        name: s.name,
        category,
        description: s.description,
        unit_price: s.price,
        billing_cycle: billingCycle,
        status: s.status === 'available' ? 'available' : 'coming_soon',
        icon,
        is_default: s.id === 'DV-001' || s.id === 'DV-002'
      };
    });

    if (!userId) {
      return { services: mappedServices, subscriptions: [], consumptionRecords: [] };
    }

    // 2. Fetch contracts
    const contracts = await contractRepo.findByUserId(userId);
    if (!contracts || contracts.length === 0) {
      return { services: mappedServices, subscriptions: [], consumptionRecords: [] };
    }

    const contractIds = contracts.map((c: any) => c.id);
    const roomIds = contracts.map((c: any) => c.deposit_requests?.room_id).filter(Boolean);

    // 3. Query active/past subscriptions
    const rawSubs = await serviceRegistrationRepo.findSubscriptionsByContractIds(contractIds);
    const subscriptions = rawSubs.map((sub: DbServiceRegistration) => ({
      id: `${sub.contract_id}-${sub.service_id}`,
      customer_id: userId,
      service_id: sub.service_id,
      service_name: sub.services?.name || 'Dịch vụ',
      registered_date: sub.start_date,
      monthly_cost: sub.amount,
      status: sub.end_date ? 'cancelled' as const : 'active' as const
    }));

    // 4. Query utility logs
    const rawConsumption = await serviceRegistrationRepo.findConsumptionByRoomIds(roomIds);
    const consumptionRecords = rawConsumption.map((rec) => {
      const elecKwh = rec.end_electricity - rec.start_electricity;
      const waterM3 = rec.end_water - rec.start_water;
      return {
        id: rec.id.toString(),
        customer_id: userId,
        room_id: rec.room_id,
        period: rec.billing_period,
        electricity_kwh: elecKwh,
        electricity_cost: elecKwh * 3500,
        water_m3: waterM3,
        water_cost: waterM3 * 15000,
        recorded_at: rec.recorded_date
      };
    });

    return {
      services: mappedServices,
      subscriptions,
      consumptionRecords
    };
  },

  registerService: async (userId: string, serviceId: string) => {
    if (!userId) throw new Error('User ID is required');

    const contracts = await contractRepo.findByUserId(userId);
    const activeContract = contracts.find((c: any) => c.status === 'active');
    if (!activeContract) {
      throw new Error('Không tìm thấy hợp đồng đang hiệu lực để đăng ký dịch vụ');
    }

    // Get service price
    const { data: service, error: sErr } = await supabase
      .from('services')
      .select('*')
      .eq('id', serviceId)
      .single();

    if (sErr || !service) {
      throw new Error('Dịch vụ không tồn tại trong hệ thống');
    }

    // Check if active subscription already exists
    const { data: existing } = await supabase
      .from('service_registrations')
      .select('*')
      .eq('contract_id', activeContract.id)
      .eq('service_id', serviceId)
      .is('end_date', null)
      .maybeSingle();

    if (existing) {
      throw new Error('Dịch vụ này đã được đăng ký và đang có hiệu lực');
    }

    return await serviceRegistrationRepo.addSubscription(activeContract.id, serviceId, service.price);
  },

  cancelService: async (userId: string, serviceId: string) => {
    if (!userId) throw new Error('User ID is required');

    const contracts = await contractRepo.findByUserId(userId);
    const activeContract = contracts.find((c: any) => c.status === 'active');
    if (!activeContract) {
      throw new Error('Không tìm thấy hợp đồng đang hiệu lực để hủy đăng ký');
    }

    return await serviceRegistrationRepo.cancelSubscription(activeContract.id, serviceId);
  }
};
