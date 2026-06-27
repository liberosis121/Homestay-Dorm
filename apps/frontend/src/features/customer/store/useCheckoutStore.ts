import { create } from 'zustand';
import { fetchCheckoutRequests, submitCheckoutRequestApi, cancelCheckoutRequestApi } from '../services/checkout.service';

export interface CheckoutRequest {
  id: string;
  customerId: string;
  customerName: string;
  branchName: string;
  roomName: string;
  bedName: string;
  contractId: string;
  expectedDate: string;
  reason: string;
  note?: string;
  bankOwner: string;
  bankName: string;
  bankAccount: string;
  depositAmount: number;
  status: 'submitted' | 'inventory_checking' | 'accounting_matching' | 'refunding' | 'completed' | 'rejected';
  statusName: string;
  createdAt: string;
  updatedAt: string;
  rejectReason?: string;
}

interface CheckoutState {
  requests: CheckoutRequest[];
  isLoading: boolean;
  error: string | null;
  loadRequests: (email: string) => Promise<void>;
  submitRequest: (email: string, requestData: {
    contractId: string;
    expectedDate: string;
    reason: string;
    note?: string;
    bankName: string;
    bankAccount: string;
    bankOwner: string;
  }) => Promise<void>;
  cancelRequest: (email: string, requestId: string) => Promise<void>;
}

export const useCheckoutStore = create<CheckoutState>((set) => ({
  requests: [],
  isLoading: false,
  error: null,

  loadRequests: async (email: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await fetchCheckoutRequests(email);
      set({ requests: data || [], isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Lỗi khi tải danh sách yêu cầu trả phòng', isLoading: false });
    }
  },

  submitRequest: async (email: string, requestData) => {
    set({ isLoading: true, error: null });
    try {
      await submitCheckoutRequestApi(email, requestData);
      const data = await fetchCheckoutRequests(email);
      set({ requests: data || [], isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Lỗi khi đăng ký trả phòng', isLoading: false });
      throw err;
    }
  },

  cancelRequest: async (email: string, requestId) => {
    set({ isLoading: true, error: null });
    try {
      await cancelCheckoutRequestApi(email, requestId);
      const data = await fetchCheckoutRequests(email);
      set({ requests: data || [], isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Lỗi khi hủy yêu cầu trả phòng', isLoading: false });
      throw err;
    }
  }
}));
