import { create } from 'zustand';
import { fetchMyInvoices, payInvoiceApi } from '../services/invoice.service';

export interface Invoice {
  id: string; // e.g. HDTT-M01 or HD-2024-10-01
  billingPeriod: string; // e.g. "Tháng 10/2024"
  month: number;
  year: number;
  type: 'checkin' | 'monthly' | 'service' | 'incidental' | 'deposit' | 'refund';
  typeName: string; // "Hóa đơn định kỳ", "Hóa đơn dịch vụ", "Hóa đơn phát sinh"
  roomPrice: number;
  electricityPrice: number;
  electricityUsage: string; // "Chỉ số: 1240 - 1366 (126 kWh)"
  waterPrice: number;
  waterUsage: string; // "Khối lượng: 18 m³"
  servicePrice: number;
  serviceDetails: string;
  totalAmount: number;
  dueDate: string; // YYYY-MM-DD
  status: 'paid' | 'unpaid' | 'overdue' | 'pending';
  paidAt?: string;
  isCredit?: boolean;
  canPay?: boolean;
  refundRecipientUserId?: string;
  refundRecipientRole?: 'representative';
}

interface InvoiceState {
  invoices: Invoice[];
  isLoading: boolean;
  error: string | null;
  filters: {
    month: string; // "Tất cả" or "1", "2"..."12"
    year: string; // "Tất cả" or "2024", "2023"
    status: string; // "Tất cả" or "paid", "unpaid", "overdue"
    type: string; // "Tất cả" or "monthly", "service", "incidental"
  };
  selectedInvoiceId: string | null;
  setFilters: (filters: Partial<InvoiceState['filters']>) => void;
  setSelectedInvoiceId: (id: string | null) => void;
  fetchInvoices: (email: string) => Promise<void>;
  payInvoice: (email: string, invoiceId: string, paymentMethod: 'qr' | 'wallet' | 'card') => Promise<void>;
  resetStore: () => void;
}

export const useInvoiceStore = create<InvoiceState>((set) => ({
  invoices: [],
  isLoading: false,
  error: null,
  filters: {
    month: 'Tất cả',
    year: 'Tất cả',
    status: 'Tất cả',
    type: 'Tất cả',
  },
  selectedInvoiceId: null,
  setFilters: (newFilters) => 
    set((state) => ({ filters: { ...state.filters, ...newFilters } })),
  setSelectedInvoiceId: (selectedInvoiceId) => set({ selectedInvoiceId }),
  fetchInvoices: async (email: string) => {
    set({ isLoading: true, error: null });
    try {
      const invoices = await fetchMyInvoices(email);
      set({ 
        invoices, 
        isLoading: false,
        selectedInvoiceId: invoices.length > 0 ? invoices[0].id : null 
      });
    } catch (err: any) {
      set({ error: err.message || 'Lỗi khi tải danh sách hóa đơn', isLoading: false });
    }
  },
  payInvoice: async (email: string, invoiceId: string, paymentMethod: 'qr' | 'wallet' | 'card') => {
    set({ isLoading: true, error: null });
    try {
      const res = await payInvoiceApi(email, invoiceId, paymentMethod);
      
      set((state) => {
        const updatedInvoices = state.invoices.map((inv) => {
          if (inv.id === invoiceId) {
            return { ...inv, status: 'paid' as const, paidAt: res.paidAt };
          }
          return inv;
        });

        return {
          invoices: updatedInvoices,
          isLoading: false
        };
      });
    } catch (err: any) {
      set({ error: err.message || 'Lỗi khi thanh toán hóa đơn', isLoading: false });
      throw err;
    }
  },
  resetStore: () => 
    set({
      invoices: [],
      isLoading: false,
      error: null,
      filters: {
        month: 'Tất cả',
        year: 'Tất cả',
        status: 'Tất cả',
        type: 'Tất cả',
      },
      selectedInvoiceId: null,
    }),
}));
