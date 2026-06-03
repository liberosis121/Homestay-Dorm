import { create } from 'zustand';
import { getMockDB, saveMockDB, Service, ServiceSubscription, ConsumptionRecord } from '../../../lib/supabaseClient';

interface ServiceFilters {
  categories: ('essential' | 'utility' | 'convenience' | 'premium')[];
  priceRange: 'under100' | '100to300' | 'over300' | null;
  statuses: ('available' | 'coming_soon')[];
  searchText: string;
}

interface CustomerServicesState {
  services: Service[];
  subscriptions: ServiceSubscription[];
  consumptionRecords: ConsumptionRecord[];
  filters: ServiceFilters;
  activeTab: 'catalog' | 'active' | 'consumption';
  registrationModal: { open: boolean; service: Service | null };
  detailModal: { open: boolean; service: Service | null };
  cancelConfirm: { open: boolean; subscriptionId: string | null };

  loadData: (customerId: string) => void;
  setActiveTab: (tab: 'catalog' | 'active' | 'consumption') => void;
  setFilters: (filters: Partial<ServiceFilters>) => void;
  clearFilters: () => void;
  openRegistration: (service: Service) => void;
  closeRegistration: () => void;
  confirmRegistration: (serviceId: string, customerId: string) => void;
  openDetail: (service: Service) => void;
  closeDetail: () => void;
  openCancelConfirm: (subscriptionId: string) => void;
  closeCancelConfirm: () => void;
  confirmCancel: (customerId: string) => void;
}

const DEFAULT_FILTERS: ServiceFilters = {
  categories: [],
  priceRange: null,
  statuses: [],
  searchText: '',
};

export const useCustomerServicesStore = create<CustomerServicesState>((set, get) => ({
  services: [],
  subscriptions: [],
  consumptionRecords: [],
  filters: DEFAULT_FILTERS,
  activeTab: 'catalog',
  registrationModal: { open: false, service: null },
  detailModal: { open: false, service: null },
  cancelConfirm: { open: false, subscriptionId: null },

  loadData: (customerId: string) => {
    const db = getMockDB();
    const services: Service[] = db.services || [];
    // Only load user-specific data when we have a real customer ID
    const subscriptions: ServiceSubscription[] = customerId
      ? (db.service_subscriptions || []).filter(
          (s: ServiceSubscription) => s.customer_id === customerId
        )
      : [];
    const consumptionRecords: ConsumptionRecord[] = customerId
      ? (db.consumption_records || []).filter(
          (r: ConsumptionRecord) => r.customer_id === customerId
        )
      : [];
    set({ services, subscriptions, consumptionRecords });
  },

  setActiveTab: (tab) => set({ activeTab: tab }),

  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),

  clearFilters: () => set({ filters: DEFAULT_FILTERS }),

  openRegistration: (service) =>
    set({ registrationModal: { open: true, service } }),

  closeRegistration: () =>
    set({ registrationModal: { open: false, service: null } }),

  confirmRegistration: (serviceId: string, customerId: string) => {
    const { services } = get();
    const service = services.find((s) => s.id === serviceId);
    if (!service) return;

    const db = getMockDB();
    const newSub: ServiceSubscription = {
      id: `ss-${Date.now()}`,
      customer_id: customerId,
      service_id: serviceId,
      service_name: service.name,
      registered_date: new Date().toISOString().split('T')[0],
      monthly_cost: service.billing_cycle === 'monthly' ? service.unit_price : Math.round(service.unit_price * 10),
      status: 'active',
    };
    db.service_subscriptions = [...(db.service_subscriptions || []), newSub];
    saveMockDB(db);
    set((state) => ({
      subscriptions: [...state.subscriptions, newSub],
      registrationModal: { open: false, service: null },
    }));
  },

  openDetail: (service) =>
    set({ detailModal: { open: true, service } }),

  closeDetail: () =>
    set({ detailModal: { open: false, service: null } }),

  openCancelConfirm: (subscriptionId: string) =>
    set({ cancelConfirm: { open: true, subscriptionId } }),

  closeCancelConfirm: () =>
    set({ cancelConfirm: { open: false, subscriptionId: null } }),

  confirmCancel: (customerId: string) => {
    const { cancelConfirm } = get();
    if (!cancelConfirm.subscriptionId) return;
    const db = getMockDB();
    db.service_subscriptions = (db.service_subscriptions || []).map((s: ServiceSubscription) =>
      s.id === cancelConfirm.subscriptionId ? { ...s, status: 'cancelled' } : s
    );
    saveMockDB(db);
    set((state) => ({
      subscriptions: state.subscriptions.map((s) =>
        s.id === cancelConfirm.subscriptionId ? { ...s, status: 'cancelled' as const } : s
      ),
      cancelConfirm: { open: false, subscriptionId: null },
    }));
    // reload
    get().loadData(customerId);
  },
}));
