import { create } from 'zustand';
import { Service, ServiceSubscription, ConsumptionRecord } from '../../../lib/supabaseClient';
import { fetchMyServices, registerServiceApi, cancelServiceApi } from '../services/service-registration.service';

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
  isLoading: boolean;
  error: string | null;

  loadData: (email: string) => Promise<void>;
  setActiveTab: (tab: 'catalog' | 'active' | 'consumption') => void;
  setFilters: (filters: Partial<ServiceFilters>) => void;
  clearFilters: () => void;
  openRegistration: (service: Service) => void;
  closeRegistration: () => void;
  confirmRegistration: (serviceId: string, email: string) => Promise<void>;
  openDetail: (service: Service) => void;
  closeDetail: () => void;
  openCancelConfirm: (subscriptionId: string) => void;
  closeCancelConfirm: () => void;
  confirmCancel: (email: string) => Promise<void>;
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
  activeTab: 'active',
  registrationModal: { open: false, service: null },
  detailModal: { open: false, service: null },
  cancelConfirm: { open: false, subscriptionId: null },
  isLoading: false,
  error: null,

  loadData: async (email: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await fetchMyServices(email);
      set({
        services: data.services || [],
        subscriptions: data.subscriptions || [],
        consumptionRecords: data.consumptionRecords || [],
        isLoading: false
      });
    } catch (err: any) {
      set({ 
        error: err.message || 'Lỗi khi tải thông tin dịch vụ', 
        isLoading: false 
      });
    }
  },

  setActiveTab: (tab) => set({ activeTab: tab }),

  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),

  clearFilters: () => set({ filters: DEFAULT_FILTERS }),

  openRegistration: (service) =>
    set({ registrationModal: { open: true, service } }),

  closeRegistration: () =>
    set({ registrationModal: { open: false, service: null } }),

  confirmRegistration: async (serviceId: string, email: string) => {
    set({ isLoading: true, error: null });
    try {
      await registerServiceApi(email, serviceId);
      set({ registrationModal: { open: false, service: null } });
      await get().loadData(email);
    } catch (err: any) {
      set({ error: err.message || 'Lỗi khi đăng ký dịch vụ', isLoading: false });
      throw err;
    }
  },

  openDetail: (service) =>
    set({ detailModal: { open: true, service } }),

  closeDetail: () =>
    set({ detailModal: { open: false, service: null } }),

  openCancelConfirm: (subscriptionId: string) =>
    set({ cancelConfirm: { open: true, subscriptionId } }),

  closeCancelConfirm: () =>
    set({ cancelConfirm: { open: false, subscriptionId: null } }),

  confirmCancel: async (email: string) => {
    const { cancelConfirm, subscriptions } = get();
    if (!cancelConfirm.subscriptionId) return;

    set({ isLoading: true, error: null });
    try {
      // Tìm thông tin đăng ký trong store để lấy chính xác service_id
      const sub = subscriptions.find((s) => s.id === cancelConfirm.subscriptionId);
      if (!sub) {
        throw new Error('Không tìm thấy thông tin đăng ký dịch vụ');
      }

      await cancelServiceApi(email, sub.service_id);
      set({ cancelConfirm: { open: false, subscriptionId: null } });
      await get().loadData(email);
    } catch (err: any) {
      set({ error: err.message || 'Lỗi khi hủy đăng ký dịch vụ', isLoading: false });
      throw err;
    }
  },
}));
