import { monthlyInvoiceRepo } from '../repositories/monthly-invoice.repo';

export const monthlyInvoiceService = {
  /**
   * Lay danh sach hoa don dinh ky.
   */
  getInvoices: async () => {
    return await monthlyInvoiceRepo.getMonthlyInvoices();
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

    const totalAmount = data.rentPrice + data.servicePrice + electricityCost + waterCost;

    // 3. Tao hoa don dinh ky
    const invoiceData = {
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

    return await monthlyInvoiceRepo.createMonthlyInvoice(invoiceData);
  }
};
