
const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Lấy Bearer token thật từ localStorage (giống interceptor của api.client.ts)
const getHeaders = () => {
  const token = localStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};


export const accountantService = {
  // ============================================================
  // 1. HOA DON DAT COC
  // ============================================================
  fetchPendingDepositRequests: async (_email: string) => {
    const res = await fetch(`${API}/api/accountant/deposit-requests/pending`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Không thể tải phiếu đặt cọc đang chờ');
    const result = await res.json();
    return result.data;
  },

  fetchDepositInvoices: async (_email: string) => {
    const res = await fetch(`${API}/api/accountant/deposit-invoices`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Không thể tải danh sách hóa đơn đặt cọc');
    const result = await res.json();
    return result.data;
  },

  createDepositInvoice: async (_email: string, data: {
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
      headers: getHeaders(),
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
  fetchCheckinInvoices: async (_email: string) => {
    const res = await fetch(`${API}/api/accountant/checkin-invoices`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Không thể tải danh sách hóa đơn nhận phòng');
    const result = await res.json();
    return result.data;
  },

  createCheckinInvoice: async (_email: string, data: {
    contractId: string;
    amount: number;
    paymentMethod: 'transfer' | 'cash';
    note?: string;
  }) => {
    const res = await fetch(`${API}/api/accountant/checkin-invoices`, {
      method: 'POST',
      headers: getHeaders(),
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
  fetchMonthlyInvoices: async (_email: string) => {
    const res = await fetch(`${API}/api/accountant/monthly-invoices`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Không thể tải danh sách hóa đơn định kỳ');
    const result = await res.json();
    return result.data;
  },

  fetchActiveContracts: async (_email: string) => {
    const res = await fetch(`${API}/api/accountant/active-contracts`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Không thể tải danh sách hợp đồng hoạt động');
    const result = await res.json();
    return result.data;
  },

  fetchContractServices: async (_email: string, contractId: string) => {
    const res = await fetch(`${API}/api/accountant/contracts/${contractId}/services`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Không thể tải danh sách dịch vụ đăng ký');
    const result = await res.json();
    return result.data;
  },

  fetchLatestMeterReading: async (_email: string, roomId: string) => {
    const res = await fetch(`${API}/api/accountant/monthly-invoices/latest-reading/${roomId}`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Không thể tải chỉ số điện nước gần nhất');
    const result = await res.json();
    return result.data;
  },

  fetchContractIncidentals: async (_email: string, contractId: string) => {
    const res = await fetch(`${API}/api/accountant/monthly-invoices/incidentals/${contractId}`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Không thể tải danh sách phí phát sinh');
    const result = await res.json();
    return result.data;
  },

  createContractIncidental: async (_email: string, data: {
    id: string;
    contractId: string;
    costName: string;
    amount: number;
    status: string;
    recordedDate: string;
  }) => {
    const res = await fetch(`${API}/api/accountant/monthly-invoices/incidentals`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Không thể ghi nhận khoản phí phát sinh');
    const result = await res.json();
    return result.data;
  },

  confirmContractIncidental: async (_email: string, id: string) => {
    const res = await fetch(`${API}/api/accountant/monthly-invoices/incidentals/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status: 'confirmed' })
    });
    if (!res.ok) throw new Error('Không thể xác nhận khoản phí phát sinh');
    const result = await res.json();
    return result.data;
  },

  deleteContractIncidental: async (_email: string, id: string) => {
    const res = await fetch(`${API}/api/accountant/monthly-invoices/incidentals/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Không thể xóa khoản phí phát sinh');
    const result = await res.json();
    return result.data;
  },

  createMonthlyInvoice: async (_email: string, data: {
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
      headers: getHeaders(),
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
  fetchPendingCheckouts: async (_email: string) => {
    const res = await fetch(`${API}/api/accountant/checkouts/pending`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Không thể tải danh sách yêu cầu trả phòng');
    const result = await res.json();
    return result.data;
  },

  fetchRefundReconciliations: async (_email: string) => {
    const res = await fetch(`${API}/api/accountant/refunds`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Không thể tải danh sách bảng đối soát');
    const result = await res.json();
    return result.data;
  },

  fetchCancellationRefunds: async (_email: string) => {
    const res = await fetch(`${API}/api/accountant/cancellation-refunds`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Không thể tải danh sách hoàn cọc chưa ký HĐ');
    const result = await res.json();
    return result.data;
  },

  createRefundReconciliation: async (_email: string, data: {
    checkoutId: string;
    contractId: string;
    originalDeposit: number;
    refundRate: number;
    baseRefund: number;
    totalDeductions: number;
    finalRefund: number;
    additionalCharge: number;
    note?: string;
    deductions?: { reason: string; amount: number }[];
  }) => {
    const res = await fetch(`${API}/api/accountant/refunds`, {
      method: 'POST',
      headers: getHeaders(),
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
  fetchPayouts: async (_email: string) => {
    const res = await fetch(`${API}/api/accountant/payouts`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Không thể tải danh sách phiếu chi');
    const result = await res.json();
    return result.data;
  },

  confirmPayout: async (
    _email: string,
    payoutId: string,
    accountDetails: string,
    paymentMethod: 'transfer' | 'cash'
  ) => {
    const res = await fetch(`${API}/api/accountant/payouts/${payoutId}/confirm`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ accountDetails, paymentMethod })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Lỗi khi xác nhận chi tiền');
    }
    const result = await res.json();
    return result.data;
  },

  confirmInvoicePayment: async (_email: string, invoiceId: string, paymentMethod: string) => {
    const res = await fetch(`${API}/api/invoices/${invoiceId}/pay`, {
      method: 'POST',
      headers: getHeaders(),
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
