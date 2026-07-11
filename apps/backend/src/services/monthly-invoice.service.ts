import { monthlyInvoiceRepo } from '../repositories/monthly-invoice.repo';
import { serviceRegistrationRepo } from '../repositories/service-registration.repo';
import { incidentalCostRepo } from '../repositories/incidental-cost.repo';

export const monthlyInvoiceService = {
  /**
   * Lay danh sach hoa don dinh ky.
   */
  getInvoices: async () => {
    return await monthlyInvoiceRepo.getMonthlyInvoices();
  },

  /**
   * Lay danh sach cac hop dong dang active.
   */
  getActiveContracts: async () => {
    return await monthlyInvoiceRepo.getActiveContracts();
  },

  /**
   * Lay danh sach dich vu co dinh dang active ma hop dong da dang ky (bang service_registrations that).
   */
  getContractServices: async (contractId: string) => {
    if (!contractId) throw new Error('Yeu cau contractId');
    const regs = await serviceRegistrationRepo.findSubscriptionsByContractIds([contractId]);
    return regs
      .filter(r => !r.end_date) // chi lay dich vu dang con hieu luc
      .map(r => ({
        id: r.service_id,
        service_name: r.services?.name || 'Dịch vụ',
        monthly_cost: r.amount
      }));
  },

  /**
   * Lay danh sach khoan phi phat sinh (incidental_costs) that cua mot hop dong.
   */
  getContractIncidentals: async (contractId: string) => {
    if (!contractId) throw new Error('Yeu cau contractId');
    return await incidentalCostRepo.findAll({ contract_id: contractId });
  },

  /**
   * Ghi nhan mot khoan phi phat sinh moi cho hop dong.
   */
  createContractIncidental: async (data: {
    id: string;
    contractId: string;
    costName: string;
    amount: number;
    status: string;
    recordedDate: string;
    staffId: string;
  }) => {
    if (!data.contractId || !data.costName || !data.amount) {
      throw new Error('Cac truong thong tin bat buoc: contractId, costName, amount');
    }
    return await incidentalCostRepo.create({
      id: data.id,
      contract_id: data.contractId,
      cost_name: data.costName,
      penalty_amount: data.amount,
      status: data.status,
      recorded_date: data.recordedDate,
      recorded_by: data.staffId
    });
  },

  /**
   * Cap nhat trang thai (xac nhan) mot khoan phi phat sinh.
   */
  updateContractIncidentalStatus: async (id: string, status: string) => {
    if (!id || !status) throw new Error('Yeu cau id, status');
    return await incidentalCostRepo.update(id, { status });
  },

  /**
   * Xoa mot khoan phi phat sinh (chua duoc dua vao hoa don).
   */
  deleteContractIncidental: async (id: string) => {
    if (!id) throw new Error('Yeu cau id');
    return await incidentalCostRepo.remove(id);
  },

  /**
   * Lay chi so dien nuoc moi nhat de ho tro dien tu dong khi nhap o front-end.
   */
  getLatestReading: async (roomId: string) => {
    if (!roomId) throw new Error('Yeu cau roomId');
    return await monthlyInvoiceRepo.getLatestMeterReading(roomId);
  },

  /**
   * Lập hóa đơn định kỳ hàng tháng cho một hợp đồng thuê:
   * 1. Ghi nhan chi so dien nuoc (electricity_water_records)
   * 2. Tinh toan tien dien, nuoc theo bieu gia:
   *    - Dien: 3,500 VND/kWh
   *    - Nuoc: 15,000 VND/m3
   * 3. Them hoa don moi vao bang invoices lien ket voi chi so dien nuoc vua tao.
   */
  createInvoice: async (data: {
    contractId: string;
    roomId: string;
    billingPeriod: string; // YYYY-MM
    prevElectricity: number;
    newElectricity: number;
    prevWater: number;
    newWater: number;
    rentPrice: number;
    servicePrice: number;
    staffId: string;
    note?: string;
  }) => {
    if (!data.contractId || !data.roomId || !data.billingPeriod) {
      throw new Error('Cac truong thong tin bat buoc: contractId, roomId, billingPeriod');
    }

    // Lay cac khoan phi phat sinh DA XAC NHAN nhung CHUA duoc tinh vao hoa don nao (status='confirmed')
    // de cong vao tong tien hoa don, tranh truong hop khoan phat sinh bi bo sot khi lap hoa don.
    const confirmedIncidentals = await incidentalCostRepo.findAll({ contract_id: data.contractId, status: 'confirmed' });
    const incidentalsTotal = confirmedIncidentals.reduce((sum, c) => sum + (Number(c.penalty_amount) || 0), 0);

    // 1. Ghi nhan chi so dien nuoc
    const readingData = {
      room_id: data.roomId,
      billing_period: data.billingPeriod,
      start_electricity: data.prevElectricity,
      end_electricity: data.newElectricity,
      start_water: data.prevWater,
      end_water: data.newWater,
      recorded_date: new Date().toISOString()
    };

    const reading = await monthlyInvoiceRepo.createMeterReading(readingData);

    // 2. Tinh toan chi phi
    const elecUsage = data.newElectricity - data.prevElectricity;
    const waterUsage = data.newWater - data.prevWater;

    const electricityCost = elecUsage > 0 ? elecUsage * 3500 : 0;
    const waterCost = waterUsage > 0 ? waterUsage * 15000 : 0;

    const totalAmount = data.rentPrice + data.servicePrice + electricityCost + waterCost + incidentalsTotal;

    // 3. Tao hoa don dinh ky
    const invoiceId = 'HDTT-' + Math.floor(100000 + Math.random() * 900000);
    const invoiceData = {
      id: invoiceId,
      amount: totalAmount,
      status: 'pending',
      invoice_type: 'monthly',
      payment_method: 'transfer',
      payment_time: null,
      evidence_url: null,
      deposit_id: null,
      contract_id: data.contractId,
      water_record_id: reading.id,
      reconciliation_id: null,
      staff_id: data.staffId,
      note: data.note || null
    };

    const invoice = await monthlyInvoiceRepo.createMonthlyInvoice(invoiceData);

    // 4. Danh dau cac khoan phi phat sinh da duoc tinh vao hoa don nay, tranh bi tinh trung o ky sau.
    await Promise.all(
      confirmedIncidentals.map(c => incidentalCostRepo.update(c.id, { status: 'billed', invoice_id: invoice.id }))
    );

    return invoice;
  }
};
