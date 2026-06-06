import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Invoice {
  id: string; // HD-2024-10-01
  billingPeriod: string; // Tháng 10/2024
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
  filters: {
    month: string; // "Tất cả" or "1", "2"..."12"
    year: string; // "Tất cả" or "2024", "2023"
    status: string; // "Tất cả" or "paid", "unpaid", "overdue"
    type: string; // "Tất cả" or "monthly", "service", "incidental"
  };
  selectedInvoiceId: string | null;
  setFilters: (filters: Partial<InvoiceState['filters']>) => void;
  setSelectedInvoiceId: (id: string | null) => void;
  payInvoice: (invoiceId: string, paymentMethod: 'qr' | 'wallet' | 'card') => void;
  resetStore: () => void;
}

const generateMockData = () => {
  const invoices: Invoice[] = [];
  const payments: PaymentHistory[] = [];

  const months = [
    { num: 5, year: 2024 },
    { num: 6, year: 2024 },
    { num: 7, year: 2024 },
    { num: 8, year: 2024 },
    { num: 9, year: 2024 },
    { num: 10, year: 2024 },
  ];

  let paymentCounter = 200450;

  // Let's generate 5 invoices for each of the 6 months:
  // Invoice 1: Hóa đơn phòng & điện nước (monthly)
  // Invoice 2: Phí dịch vụ giặt ủi & dọn phòng riêng (service)
  // Invoice 3: Phí gửi xe (service)
  // Invoice 4: Phí nước uống & sinh hoạt chung (incidental)
  // Invoice 5: Hóa đơn phát sinh (incidental - lost key, repair, etc.)

  months.forEach((m) => {
    const billingPeriod = `Tháng ${m.num < 10 ? '0' + m.num : m.num}/${m.year}`;

    // 1. Monthly Rent Invoice
    const rentId = `HD-${m.year}-${m.num < 10 ? '0' + m.num : m.num}-01`;
    let rentStatus: 'paid' | 'unpaid' | 'overdue' = 'paid';
    if (m.num === 10) rentStatus = 'unpaid';
    if (m.num === 9) rentStatus = 'overdue';

    const rentInvoice: Invoice = {
      id: rentId,
      billingPeriod,
      month: m.num,
      year: m.year,
      type: 'monthly',
      typeName: 'Hóa đơn định kỳ',
      roomPrice: 4500000,
      electricityPrice: 200000 + m.num * 15000,
      electricityUsage: `Chỉ số: ${1240 - (10 - m.num) * 100} - ${1366 - (10 - m.num) * 100} (${126} kWh)`,
      waterPrice: 100000,
      waterUsage: `Khối lượng: 18 m³`,
      servicePrice: 150000,
      serviceDetails: 'Phí dịch vụ chung',
      totalAmount: 4500000 + (200000 + m.num * 15000) + 100000 + 150000,
      dueDate: `${m.year}-${m.num < 10 ? '0' + m.num : m.num}-05`,
      status: rentStatus,
      paidAt: rentStatus === 'paid' ? `${m.year}-${m.num < 10 ? '0' + m.num : m.num}-03T10:15:30Z` : undefined
    };
    invoices.push(rentInvoice);

    if (rentStatus === 'paid') {
      payments.push({
        id: `GD-${paymentCounter++}`,
        invoiceId: rentId,
        billingPeriod,
        amount: rentInvoice.totalAmount,
        paymentMethod: 'qr',
        paidAt: rentInvoice.paidAt!,
        status: 'success'
      });
    }

    // 2. Laundry & Cleaning (Service)
    const svc1Id = `HD-${m.year}-${m.num < 10 ? '0' + m.num : m.num}-02`;
    let svc1Status: 'paid' | 'unpaid' | 'overdue' = 'paid';
    if (m.num === 10 || m.num === 9 || m.num === 8) svc1Status = 'unpaid';

    const svc1Invoice: Invoice = {
      id: svc1Id,
      billingPeriod,
      month: m.num,
      year: m.year,
      type: 'service',
      typeName: 'Hóa đơn dịch vụ',
      roomPrice: 0,
      electricityPrice: 0,
      electricityUsage: '',
      waterPrice: 0,
      waterUsage: '',
      servicePrice: 250000,
      serviceDetails: 'Giặt ủi & Dọn phòng riêng (4 lần/tháng)',
      totalAmount: 250000,
      dueDate: `${m.year}-${m.num < 10 ? '0' + m.num : m.num}-10`,
      status: svc1Status,
      paidAt: svc1Status === 'paid' ? `${m.year}-${m.num < 10 ? '0' + m.num : m.num}-08T14:20:00Z` : undefined
    };
    invoices.push(svc1Invoice);
    if (svc1Status === 'paid') {
      payments.push({
        id: `GD-${paymentCounter++}`,
        invoiceId: svc1Id,
        billingPeriod,
        amount: svc1Invoice.totalAmount,
        paymentMethod: 'wallet',
        paidAt: svc1Invoice.paidAt!,
        status: 'success'
      });
    }

    // 3. Parking Fee (Service)
    const svc2Id = `HD-${m.year}-${m.num < 10 ? '0' + m.num : m.num}-03`;
    let svc2Status: 'paid' | 'unpaid' | 'overdue' = 'paid';
    if (m.num === 10) svc2Status = 'unpaid';

    const svc2Invoice: Invoice = {
      id: svc2Id,
      billingPeriod,
      month: m.num,
      year: m.year,
      type: 'service',
      typeName: 'Hóa đơn dịch vụ',
      roomPrice: 0,
      electricityPrice: 0,
      electricityUsage: '',
      waterPrice: 0,
      waterUsage: '',
      servicePrice: 120000,
      serviceDetails: 'Phí gửi xe máy định kỳ',
      totalAmount: 120000,
      dueDate: `${m.year}-${m.num < 10 ? '0' + m.num : m.num}-10`,
      status: svc2Status,
      paidAt: svc2Status === 'paid' ? `${m.year}-${m.num < 10 ? '0' + m.num : m.num}-09T08:30:00Z` : undefined
    };
    invoices.push(svc2Invoice);
    if (svc2Status === 'paid') {
      payments.push({
        id: `GD-${paymentCounter++}`,
        invoiceId: svc2Id,
        billingPeriod,
        amount: svc2Invoice.totalAmount,
        paymentMethod: 'card',
        paidAt: svc2Invoice.paidAt!,
        status: 'success'
      });
    }

    // 4. Drinking water (Incidental)
    const inc1Id = `HD-${m.year}-${m.num < 10 ? '0' + m.num : m.num}-04`;
    let inc1Status: 'paid' | 'unpaid' | 'overdue' = 'paid';
    if (m.num === 10) inc1Status = 'unpaid';

    const inc1Invoice: Invoice = {
      id: inc1Id,
      billingPeriod,
      month: m.num,
      year: m.year,
      type: 'incidental',
      typeName: 'Hóa đơn phát sinh',
      roomPrice: 0,
      electricityPrice: 0,
      electricityUsage: '',
      waterPrice: 0,
      waterUsage: '',
      servicePrice: 50000,
      serviceDetails: 'Nước uống Lavie (2 bình 20L)',
      totalAmount: 50000,
      dueDate: `${m.year}-${m.num < 10 ? '0' + m.num : m.num}-15`,
      status: inc1Status,
      paidAt: inc1Status === 'paid' ? `${m.year}-${m.num < 10 ? '0' + m.num : m.num}-12T16:45:00Z` : undefined
    };
    invoices.push(inc1Invoice);
    if (inc1Status === 'paid') {
      payments.push({
        id: `GD-${paymentCounter++}`,
        invoiceId: inc1Id,
        billingPeriod,
        amount: inc1Invoice.totalAmount,
        paymentMethod: 'qr',
        paidAt: inc1Invoice.paidAt!,
        status: 'success'
      });
    }

    // 5. Incidentals - guest pass, repair, etc.
    const inc2Id = `HD-${m.year}-${m.num < 10 ? '0' + m.num : m.num}-05`;
    let inc2Status: 'paid' | 'unpaid' | 'overdue' = 'paid';
    if (m.num === 10 || m.num === 9 || m.num === 8) inc2Status = 'unpaid';

    const names = [
      'Thay thẻ từ phòng bị mất',
      'Sửa vòi nước bồn rửa mặt',
      'Đăng ký thẻ Gym 1 tháng',
      'Vé vào cổng sự kiện Trung thu',
      'Phụ thu dọn dẹp vệ sinh phòng',
      'Thay bóng đèn bàn học',
    ];
    const prices = [100000, 150000, 300000, 150000, 100000, 50000];
    const idx = m.num - 5; // 0 to 5

    const inc2Invoice: Invoice = {
      id: inc2Id,
      billingPeriod,
      month: m.num,
      year: m.year,
      type: 'incidental',
      typeName: 'Hóa đơn phát sinh',
      roomPrice: 0,
      electricityPrice: 0,
      electricityUsage: '',
      waterPrice: 0,
      waterUsage: '',
      servicePrice: prices[idx],
      serviceDetails: names[idx],
      totalAmount: prices[idx],
      dueDate: `${m.year}-${m.num < 10 ? '0' + m.num : m.num}-20`,
      status: inc2Status,
      paidAt: inc2Status === 'paid' ? `${m.year}-${m.num < 10 ? '0' + m.num : m.num}-18T11:00:00Z` : undefined
    };
    invoices.push(inc2Invoice);
    if (inc2Status === 'paid') {
      payments.push({
        id: `GD-${paymentCounter++}`,
        invoiceId: inc2Id,
        billingPeriod,
        amount: inc2Invoice.totalAmount,
        paymentMethod: 'qr',
        paidAt: inc2Invoice.paidAt!,
        status: 'success'
      });
    }
  });

  return { invoices, payments };
};

const initialData = generateMockData();

export const useInvoiceStore = create<InvoiceState>()(
  persist(
    (set) => ({
      invoices: initialData.invoices,
      payments: initialData.payments,
      filters: {
        month: '10', // Default filtered to current mock month
        year: '2024',
        status: 'Tất cả',
        type: 'Tất cả',
      },
      selectedInvoiceId: 'HD-2024-10-01', // Default selected
      setFilters: (newFilters) => 
        set((state) => ({ filters: { ...state.filters, ...newFilters } })),
      setSelectedInvoiceId: (selectedInvoiceId) => set({ selectedInvoiceId }),
      payInvoice: (invoiceId, paymentMethod) => 
        set((state) => {
          const nowStr = new Date().toISOString();
          const updatedInvoices: Invoice[] = state.invoices.map((inv) => {
            if (inv.id === invoiceId) {
              return { ...inv, status: 'paid' as const, paidAt: nowStr };
            }
            return inv;
          });

          const paidInvoice = state.invoices.find((inv) => inv.id === invoiceId);
          if (!paidInvoice || paidInvoice.status === 'paid') return {};

          const newPayment: PaymentHistory = {
            id: `GD-${Math.floor(100000 + Math.random() * 900000)}`,
            invoiceId,
            billingPeriod: paidInvoice.billingPeriod,
            amount: paidInvoice.totalAmount,
            paymentMethod,
            paidAt: nowStr,
            status: 'success',
          };

          return {
            invoices: updatedInvoices,
            payments: [newPayment, ...state.payments],
          };
        }),
      resetStore: () => 
        set({
          invoices: initialData.invoices,
          payments: initialData.payments,
          filters: {
            month: '10',
            year: '2024',
            status: 'Tất cả',
            type: 'Tất cả',
          },
          selectedInvoiceId: 'HD-2024-10-01',
        }),
    }),
    {
      name: 'invoice-storage',
    }
  )
);
