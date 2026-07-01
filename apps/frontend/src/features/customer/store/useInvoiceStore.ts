import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { fetchMyInvoices, payInvoiceApi } from '../services/invoice.service';

export interface Invoice {
  id: string; // e.g. HDTT-M01 or HD-2024-10-01
  billingPeriod: string; // e.g. "Tháng 10/2024"
  month: number;
  year: number;
  type: 'monthly' | 'service' | 'incidental';
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
  status: 'paid' | 'unpaid' | 'overdue';
  paidAt?: string;
}

export interface PaymentHistory {
  id: string; // GD-100234
  invoiceId: string;
  billingPeriod: string;
  amount: number;
  paymentMethod: 'qr' | 'wallet' | 'card';
  paidAt: string; // Date ISO string
  status: 'success' | 'failed';
}

interface InvoiceState {
  invoices: Invoice[];
  payments: PaymentHistory[];
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

export const useInvoiceStore = create<InvoiceState>()(
  persist(
    (set) => ({
      invoices: [],
      payments: [],
      isLoading: false,
      error: null,
      filters: {
        month: 'Tất cả', // Changed default to 'Tất cả' so all records show up initially
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
            // Select first invoice if none is selected
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

            const paidInvoice = state.invoices.find((inv) => inv.id === invoiceId);
            const newPayment: PaymentHistory = {
              id: `GD-${Math.floor(100000 + Math.random() * 900000)}`,
              invoiceId,
              billingPeriod: paidInvoice?.billingPeriod || 'Tháng này',
              amount: paidInvoice?.totalAmount || 0,
              paymentMethod,
              paidAt: res.paidAt,
              status: 'success',
            };

            return {
              invoices: updatedInvoices,
              payments: [newPayment, ...state.payments],
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
          payments: [],
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
    }),
    {
      name: 'invoice-storage-v2',
    }
  )
);
