const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const getHeaders = (email: string) => {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer mock-token-${email}`
  };
};

export const accountantService = {
  // ============================================================
  // 1. HOA DON DAT COC
  // ============================================================
  fetchPendingDepositRequests: async (email: string) => {
    const res = await fetch(`${API}/api/accountant/deposit-requests/pending`, {
      headers: getHeaders(email)
    });
    if (!res.ok) throw new Error('Không thể tải phiếu đặt cọc đang chờ');
    const result = await res.json();
    return result.data;
  },

  fetchDepositInvoices: async (email: string) => {
    const res = await fetch(`${API}/api/accountant/deposit-invoices`, {
      headers: getHeaders(email)
    });
    if (!res.ok) throw new Error('Không thể tải danh sách hóa đơn đặt cọc');
    const result = await res.json();
    return result.data;
  },

  createDepositInvoice: async (email: string, data: {
    requestId: string;
    customerId: string;
    roomId: string;
    amount: number;
    deadlineType: string;
    paymentMethod: 'transfer' | 'cash';
    note?: string;
  }) => {
    const res = await fetch(`${API}/api/accountant/deposit-invoices`, {
      method: 'POST',
      headers: getHeaders(email),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Lỗi khi lập hóa đơn cọc');
    }
    const result = await res.json();
    return result.data;
  },

  // ============================================================
  // 2. HOA DON NHAN PHONG
  // ============================================================
  fetchCheckinInvoices: async (email: string) => {
    const res = await fetch(`${API}/api/accountant/checkin-invoices`, {
      headers: getHeaders(email)
    });
    if (!res.ok) throw new Error('Không thể tải danh sách hóa đơn nhận phòng');
    const result = await res.json();
    return result.data;
  },

  createCheckinInvoice: async (email: string, data: {
    contractId: string;
    amount: number;
    paymentMethod: 'transfer' | 'cash';
    note?: string;
  }) => {
    const res = await fetch(`${API}/api/accountant/checkin-invoices`, {
      method: 'POST',
      headers: getHeaders(email),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Lỗi khi lập hóa đơn nhận phòng');
    }
    const result = await res.json();
    return result.data;
  },

  // ============================================================
  // 3. HOA DON DINH KY
  // ============================================================
  fetchMonthlyInvoices: async (email: string) => {
    const res = await fetch(`${API}/api/accountant/monthly-invoices`, {
      headers: getHeaders(email)
    });
    if (!res.ok) throw new Error('Không thể tải danh sách hóa đơn định kỳ');
    const result = await res.json();
    return result.data;
  },

  fetchLatestMeterReading: async (email: string, roomId: string) => {
    const res = await fetch(`${API}/api/accountant/monthly-invoices/latest-reading/${roomId}`, {
      headers: getHeaders(email)
    });
    if (!res.ok) throw new Error('Không thể tải chỉ số điện nước gần nhất');
    const result = await res.json();
    return result.data;
  },

  createMonthlyInvoice: async (email: string, data: {
    contractId: string;
    roomId: string;
    billingPeriod: string;
    prevElectricity: number;
    newElectricity: number;
    prevWater: number;
    newWater: number;
    rentPrice: number;
    servicePrice: number;
    note?: string;
  }) => {
    const res = await fetch(`${API}/api/accountant/monthly-invoices`, {
      method: 'POST',
      headers: getHeaders(email),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Lỗi khi lập hóa đơn định kỳ');
    }
    const result = await res.json();
    return result.data;
  },

  // ============================================================
  // 4. DOI SOAT HOAN COC
  // ============================================================
  fetchPendingCheckouts: async (email: string) => {
    const res = await fetch(`${API}/api/accountant/checkouts/pending`, {
      headers: getHeaders(email)
    });
    if (!res.ok) throw new Error('Không thể tải danh sách yêu cầu trả phòng');
    const result = await res.json();
    return result.data;
  },

  fetchRefundReconciliations: async (email: string) => {
    const res = await fetch(`${API}/api/accountant/refunds`, {
      headers: getHeaders(email)
    });
    if (!res.ok) throw new Error('Không thể tải danh sách bảng đối soát');
    const result = await res.json();
    return result.data;
  },

  createRefundReconciliation: async (email: string, data: {
    checkoutId: string;
    contractId: string;
    originalDeposit: number;
    refundRate: number;
    baseRefund: number;
    totalDeductions: number;
    finalRefund: number;
    additionalCharge: number;
    note?: string;
  }) => {
    const res = await fetch(`${API}/api/accountant/refunds`, {
      method: 'POST',
      headers: getHeaders(email),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Lỗi khi lập bảng đối soát hoàn cọc');
    }
    const result = await res.json();
    return result.data;
  },

  // ============================================================
  // 5. PHIEU CHI TIEN & QUYET TOAN
  // ============================================================
  fetchPayouts: async (email: string) => {
    const res = await fetch(`${API}/api/accountant/payouts`, {
      headers: getHeaders(email)
    });
    if (!res.ok) throw new Error('Không thể tải danh sách phiếu chi');
    const result = await res.json();
    return result.data;
  },

  confirmPayout: async (email: string, payoutId: string, accountDetails: string) => {
    const res = await fetch(`${API}/api/accountant/payouts/${payoutId}/confirm`, {
      method: 'POST',
      headers: getHeaders(email),
      body: JSON.stringify({ accountDetails })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Lỗi khi xác nhận chi tiền');
    }
    const result = await res.json();
    return result.data;
  },

  confirmInvoicePayment: async (email: string, invoiceId: string, paymentMethod: string) => {
    const res = await fetch(`${API}/api/invoices/${invoiceId}/pay`, {
      method: 'POST',
      headers: getHeaders(email),
      body: JSON.stringify({ paymentMethod })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Lỗi khi xác nhận thanh toán');
    }
    const result = await res.json();
    return result.data;
  }
};
