import { X, Printer, Check } from 'lucide-react';
import { ModalPortal } from './ModalPortal';

export interface InvoiceDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceType: 'deposit' | 'checkin' | 'monthly' | 'service' | 'liquidation' | 'refund';
  invoiceData: any;
  onConfirmPayment?: (id: string) => void;
}

export default function InvoiceDetailDrawer({
  isOpen,
  onClose,
  invoiceType,
  invoiceData,
  onConfirmPayment,
}: InvoiceDetailDrawerProps) {
  if (!isOpen || !invoiceData) return null;

  const handlePrint = () => {
    window.print();
  };

  // Định dạng ngày lập hóa đơn: chấp nhận cả ISO thô lẫn chuỗi "YYYY-MM-DD HH:mm" đã format sẵn.
  const formatInvoiceDate = (val: any) => {
    if (!val) return '---';
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    return d.toLocaleDateString('vi-VN');
  };

  // Status badge style helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
      case 'completed':
        return (
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#F5EFE6] text-[#5C4632] border border-[#DCCFC0]/60">
            Đã thanh toán
          </span>
        );
      case 'unpaid':
        return (
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#FAF6F0] text-[#B9792B] border border-[#E7DED2]">
            Chờ thanh toán
          </span>
        );
      case 'pending':
        return (
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#FAF6F0] text-[#B9792B] border border-[#E7DED2]">
            Chờ xác nhận
          </span>
        );
      case 'overdue':
        return (
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#FBF6F5] text-[#A94F4F] border border-[#F1DFDD]">
            Quá hạn
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#FAF9F6] text-[#8A7563] border border-[#E7DED2]">
            Đã hủy
          </span>
        );
      default:
        return (
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#FAF9F6] text-[#8A7563] border border-[#E7DED2]">
            {status || 'Bản nháp'}
          </span>
        );
    }
  };

  // DB có 2 kiểu giá trị cho payment_method: enum tiếng Anh ('transfer'/'cash') do code hiện tại ghi,
  // và nhãn tiếng Việt viết thẳng (vd 'Chuyển khoản') do dữ liệu seed cũ ghi. Chuẩn hóa cả 2 dạng,
  // và không đoán bừa 'Tiền mặt' khi dữ liệu thật sự chưa có (null).
  const formatPaymentMethod = (method: string | null | undefined, fallback = '---') => {
    if (!method) return fallback;
    if (method === 'transfer') return 'Chuyển khoản';
    if (method === 'cash') return 'Tiền mặt';
    return method; // đã là nhãn tiếng Việt sẵn có trong dữ liệu, hiển thị nguyên trạng
  };

  const formattedAmount = (amount: number) => (
    <span className="whitespace-nowrap ">
      {(amount || 0).toLocaleString('vi-VN')}
      {'\u00A0\u0111'}
    </span>
  );

  return (
    <ModalPortal>
      {/* Overlay Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 z-[999] backdrop-blur-xs transition-opacity duration-200 animate-in fade-in"
        onClick={onClose}
      />
      
      {/* Drawer Panel */}
      <div 
        className="fixed inset-y-0 right-0 w-full sm:w-[420px] bg-white border-l border-[#d1c4b9] shadow-2xl z-[1000] flex flex-col justify-between animate-in slide-in-from-right duration-200"
      >
        {/* Header */}
        <div className="p-6 border-b border-[#d1c4b9] flex justify-between items-center bg-[#fbf9f8]">
          <div>
            <h3 className="font-headline-sm text-base text-[#5a462d] font-bold">
              {invoiceType === 'deposit' && 'Chi tiết Hóa đơn cọc'}
              {invoiceType === 'checkin' && 'Chi tiết Hóa đơn nhận phòng'}
              {invoiceType === 'monthly' && 'Chi tiết Hóa đơn định kỳ'}
              {invoiceType === 'service' && 'Chi tiết Hóa đơn dịch vụ'}
              {invoiceType === 'liquidation' && 'Chi tiết Hóa đơn thanh lý'}
            </h3>
            <p className=" text-xs text-[#5e5f5d] mt-1">
              Mã: {invoiceData.id || invoiceData.code || '---'}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 text-[#5e5f5d] hover:bg-[#e4e2e1] rounded-full transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6 text-sm">
          {/* Status block */}
          <div className="flex justify-between items-center">
            <span className="font-label-caps text-[11px] text-[#5a462d] font-bold uppercase tracking-wider">Trạng thái thanh toán</span>
            {getStatusBadge(invoiceData.status)}
          </div>

          {/* Type-Specific Sections */}
          {/* 1. DEPOSIT TYPE */}
          {invoiceType === 'deposit' && (
            <>
              <div className="border-t border-[#d1c4b9] pt-4">
                <h4 className="font-label-caps text-[11px] text-[#5a462d] mb-2 font-bold uppercase tracking-wider">Thông tin đặt cọc</h4>
                <div className="grid grid-cols-2 gap-y-2 text-xs">
                  <div className="text-[#8A7563]">Khách hàng:</div>
                  <div className="text-right font-semibold text-[#1b1c1c]">{invoiceData.customer_name || '---'}</div>
                  
                  <div className="text-[#8A7563]">Phòng đặt cọc:</div>
                  <div className="text-right font-semibold text-[#1b1c1c]">{invoiceData.room_name || '---'}</div>
                  
                  <div className="text-[#8A7563]">Ngày lập hóa đơn:</div>
                  <div className="text-right text-[#1b1c1c]  text-xs">{formatInvoiceDate(invoiceData.created_at)}</div>

                  <div className="text-[#8A7563]">Hạn thanh toán:</div>
                  <div className="text-right text-[#1b1c1c]  text-xs">{invoiceData.deadline || '---'}</div>

                  <div className="text-[#8A7563]">Phương thức thu:</div>
                  <div className="text-right text-[#1b1c1c]">
                    {formatPaymentMethod(invoiceData.payment_method)}
                  </div>
                </div>
              </div>

              <div className="border-t border-[#d1c4b9] pt-4">
                <h4 className="font-label-caps text-[11px] text-[#5a462d] mb-2 font-bold uppercase tracking-wider">Chi tiết thanh toán</h4>
                <div className="p-4 bg-[#f0eded] border border-[#d1c4b9] rounded flex justify-between items-center">
                  <span className="font-bold text-[#1b1c1c]">Tổng tiền đặt cọc:</span>
                  <span className="text-xl font-bold text-[#5a462d] ">{formattedAmount(invoiceData.amount)}</span>
                </div>
              </div>
            </>
          )}

          {/* 2. CHECKIN TYPE */}
          {invoiceType === 'checkin' && (() => {
            const rent = invoiceData.rent_amount || 0;
            const deposit = invoiceData.deposit_amount || 0;
            const servicesList = invoiceData.services || [];
            const servicesTotal = servicesList.reduce((sum: number, s: any) => sum + (s.amount || 0), 0);
            const calculatedTotal = rent + deposit + servicesTotal;
            const otherFee = invoiceData.total - calculatedTotal;

            return (
              <>
                {/* Section 1: Thông tin hóa đơn */}
                <div className="border-t border-[#d1c4b9] pt-4">
                  <h4 className="font-label-caps text-[11px] text-[#5a462d] mb-2 font-bold uppercase tracking-wider">Thông tin hóa đơn</h4>
                  <div className="grid grid-cols-2 gap-y-2 text-xs">
                    <div className="text-[#8A7563]">Mã hóa đơn nhận phòng:</div>
                    <div className="text-right  font-semibold text-[#5C4632]">{invoiceData.id || '---'}</div>
                    
                    <div className="text-[#8A7563]">Ngày lập hóa đơn:</div>
                    <div className="text-right text-[#5C4632] ">{formatInvoiceDate(invoiceData.created_at)}</div>

                    <div className="text-[#8A7563]">Hạn thanh toán:</div>
                    <div className="text-right text-[#5C4632] ">
                      {invoiceData.deadline || invoiceData.checkin_date || (invoiceData.created_at ? invoiceData.created_at.substring(0, 10) : '---')}
                    </div>

                    <div className="text-[#8A7563]">Phương thức thanh toán:</div>
                    <div className="text-right text-[#5C4632] font-semibold">
                      {formatPaymentMethod(invoiceData.payment_method, 'Chuyển khoản (QR)')}
                    </div>
                  </div>
                </div>

                {/* Section 2: Thông tin hợp đồng */}
                <div className="border-t border-[#d1c4b9] pt-4">
                  <h4 className="font-label-caps text-[11px] text-[#5a462d] mb-2 font-bold uppercase tracking-wider">Thông tin hợp đồng</h4>
                  <div className="grid grid-cols-2 gap-y-2 text-xs">
                    <div className="text-[#8A7563]">Mã hợp đồng:</div>
                    <div className="text-right  font-semibold text-[#5C4632]">
                      {invoiceData.contract_id || (invoiceData.deposit_ref ? invoiceData.deposit_ref.replace('DEP', 'HĐ') : 'HĐ-MOCK')}
                    </div>
                    
                    <div className="text-[#8A7563]">Ngày bắt đầu thuê:</div>
                    <div className="text-right text-[#5C4632] ">{invoiceData.checkin_date || '---'}</div>
                    
                    <div className="text-[#8A7563]">Kỳ thanh toán:</div>
                    <div className="text-right text-[#5C4632] font-semibold">
                      {invoiceData.created_at ? 'Tháng ' + invoiceData.created_at.substring(5, 7) + '/' + invoiceData.created_at.substring(0, 4) : 'Kỳ nhận phòng'}
                    </div>
                  </div>
                </div>

                {/* Section 3: Thông tin khách thuê */}
                <div className="border-t border-[#d1c4b9] pt-4">
                  <h4 className="font-label-caps text-[11px] text-[#5a462d] mb-2 font-bold uppercase tracking-wider">Thông tin khách thuê</h4>
                  <div className="grid grid-cols-2 gap-y-2 text-xs">
                    <div className="text-[#8A7563]">Tên khách thuê:</div>
                    <div className="text-right font-semibold text-[#5C4632]">{invoiceData.customer_name || '---'}</div>
                  </div>
                </div>

                {/* Section 4: Thông tin phòng/giường */}
                <div className="border-t border-[#d1c4b9] pt-4">
                  <h4 className="font-label-caps text-[11px] text-[#5a462d] mb-2 font-bold uppercase tracking-wider">Thông tin phòng / giường</h4>
                  <div className="grid grid-cols-2 gap-y-2 text-xs">
                    <div className="text-[#8A7563]">Mã phòng / giường:</div>
                    <div className="text-right  font-semibold text-[#5C4632]">{invoiceData.room_id || '---'}</div>
                    
                    <div className="text-[#8A7563]">Tên phòng:</div>
                    <div className="text-right font-semibold text-[#5C4632]">{invoiceData.room_name || '---'}</div>
                    
                    <div className="text-[#8A7563]">Loại phòng:</div>
                    <div className="text-right text-[#5C4632]">
                      {invoiceData.room_type || '---'}
                    </div>
                  </div>
                </div>

                {/* Section 5: Chi tiết khoản thu ban đầu */}
                <div className="border-t border-[#d1c4b9] pt-4">
                  <h4 className="font-label-caps text-[11px] text-[#5a462d] mb-2 font-bold uppercase tracking-wider">Chi tiết khoản thu ban đầu</h4>
                  <div className="divide-y divide-[#E7DED2]/65 text-xs">
                    <div className="flex justify-between py-2 items-center">
                      <span className="text-[#8A7563]">Tiền thuê phòng (Tháng đầu):</span>
                      <span className="text-[#5C4632] font-semibold">{formattedAmount(rent)}</span>
                    </div>
                    <div className="flex justify-between py-2 items-center">
                      <span className="text-[#8A7563]">Tiền đặt cọc phòng / giường:</span>
                      <span className="text-[#5C4632] font-semibold">{formattedAmount(deposit)}</span>
                    </div>
                    {servicesList.map((srv: any, i: number) => (
                      <div key={i} className="flex justify-between py-2 items-center">
                        <span className="text-[#8A7563]">{srv.name}:</span>
                        <span className="text-[#5C4632] font-semibold">{formattedAmount(srv.amount)}</span>
                      </div>
                    ))}
                    {otherFee !== 0 && (
                      <div className="flex justify-between py-2 items-center">
                        <span className="text-[#8A7563]">Các khoản khác / Ưu đãi:</span>
                        <span className={`font-semibold ${otherFee > 0 ? 'text-[#B9792B]' : 'text-[#5F7D4E]'}`}>
                          {otherFee > 0 ? '+' : ''}{formattedAmount(otherFee)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center py-2 bg-[#FAF9F6] border-t border-[#DCCFC0]/65 text-xs text-[#8A7563] pt-3">
                    <span>Tổng cộng các khoản thu:</span>
                    <span className="font-semibold">{formattedAmount(invoiceData.total)}</span>
                  </div>
                </div>

                {/* Section 6: Tổng cộng */}
                <div className="p-4 bg-[#f0eded] border border-[#d1c4b9] rounded flex justify-between items-center">
                    <span className="font-bold text-[#1b1c1c]">Tổng cộng cần thanh toán:</span>
                    <span className="text-xl font-bold text-[#5a462d] ">{formattedAmount(invoiceData.total)}</span>
                  </div>
              </>
            );
          })()}

          {/* 3. MONTHLY TYPE */}
          {invoiceType === 'monthly' && (
            <>
              <div className="space-y-4">
                <h4 className="font-label-caps text-[11px] text-[#8A7563] border-b border-[#DCCFC0]/55 pb-1 font-bold uppercase tracking-wider">Thông tin kỳ thanh toán</h4>
                <div className="grid grid-cols-2 gap-y-2">
                  <div className="text-[#8A7563]">Khách thuê:</div>
                  <div className="text-right font-semibold text-[#1b1c1c]">{invoiceData.customer_name || '---'}</div>
                  
                  <div className="text-[#8A7563]">Phòng:</div>
                  <div className="text-right font-semibold text-[#1b1c1c]">{invoiceData.room_name || '---'}</div>
                  
                  <div className="text-[#8A7563]">Kỳ thanh toán:</div>
                  <div className="text-right text-[#1b1c1c] font-semibold">Tháng {invoiceData.period || '---'}</div>

                  <div className="text-[#8A7563]">Hạn thanh toán:</div>
                  <div className="text-right text-[#1b1c1c]  text-xs">{invoiceData.due_date || '---'}</div>

                  <div className="text-[#8A7563]">Ngày lập hóa đơn:</div>
                  <div className="text-right text-[#1b1c1c]  text-xs">{formatInvoiceDate(invoiceData.created_at)}</div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-label-caps text-[11px] text-[#8A7563] border-b border-[#DCCFC0]/55 pb-1 font-bold uppercase tracking-wider">Chi tiết chỉ số & chi phí</h4>
                <div className="divide-y divide-[#E7DED2]/65 text-xs  space-y-1">
                  <div className="flex justify-between py-1.5">
                    <span className="font-sans text-[#1b1c1c]">Tiền thuê phòng:</span>
                    <span className="text-[#1b1c1c]">{formattedAmount(invoiceData.rent_amount)}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="font-sans text-[#1b1c1c]">Tiền điện ({invoiceData.electricity_kwh} kWh x 3.500):</span>
                    <span className="text-[#1b1c1c]">{formattedAmount(invoiceData.electricity_cost)}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="font-sans text-[#1b1c1c]">Tiền nước ({invoiceData.water_m3} m³ x 15.000):</span>
                    <span className="text-[#1b1c1c]">{formattedAmount(invoiceData.water_cost)}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="font-sans text-[#1b1c1c]">Dịch vụ tiện ích (Wifi, rác, v.v.):</span>
                    <span className="text-[#1b1c1c]">{formattedAmount(invoiceData.services_cost)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center py-2.5 bg-[#5C4632]/5 px-3 rounded-lg border border-[#5C4632]/10 mt-3">
                  <span className="font-bold text-[#5C4632] text-sm">Tổng cộng hóa đơn:</span>
                  <span className=" text-lg font-bold text-[#5C4632]">{formattedAmount(invoiceData.total)}</span>
                </div>
              </div>
            </>
          )}

          {/* 4. SERVICE TYPE */}
          {invoiceType === 'service' && (
            <>
              <div className="space-y-4">
                <h4 className="font-label-caps text-[11px] text-[#8A7563] border-b border-[#DCCFC0]/55 pb-1 font-bold uppercase tracking-wider">Thông tin dịch vụ phát sinh</h4>
                <div className="grid grid-cols-2 gap-y-2">
                  <div className="text-[#8A7563]">Khách hàng:</div>
                  <div className="text-right font-semibold text-[#1b1c1c]">{invoiceData.customer_name || '---'}</div>
                  
                  <div className="text-[#8A7563]">Phòng:</div>
                  <div className="text-right font-semibold text-[#1b1c1c]">{invoiceData.room_name || '---'}</div>
                  
                  <div className="text-[#8A7563]">Mô tả khoản phát sinh:</div>
                  <div className="text-right text-[#1b1c1c] font-medium">{invoiceData.description || '---'}</div>

                  <div className="text-[#8A7563]">Ngày tạo phiếu:</div>
                  <div className="text-right text-[#1b1c1c]  text-xs">{invoiceData.created_at || '---'}</div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-label-caps text-[11px] text-[#8A7563] border-b border-[#DCCFC0]/55 pb-1 font-bold uppercase tracking-wider">Thanh toán dịch vụ</h4>
                <div className="flex justify-between items-center py-2.5 bg-[#5C4632]/5 px-3 rounded-lg border border-[#5C4632]/10">
                  <span className="font-bold text-[#5C4632] text-sm">Số tiền dịch vụ:</span>
                  <span className=" text-lg font-bold text-[#5C4632]">{formattedAmount(invoiceData.amount || invoiceData.total)}</span>
                </div>
              </div>
            </>
          )}

          {/* 5. LIQUIDATION TYPE */}
          {invoiceType === 'liquidation' && (
            <>
              <div className="space-y-4">
                <h4 className="font-label-caps text-[11px] text-[#8A7563] border-b border-[#DCCFC0]/55 pb-1 font-bold uppercase tracking-wider">Thông tin thanh lý hợp đồng</h4>
                <div className="grid grid-cols-2 gap-y-2">
                  <div className="text-[#8A7563]">Khách hàng:</div>
                  <div className="text-right font-semibold text-[#1b1c1c]">{invoiceData.customer_name || '---'}</div>
                  
                  <div className="text-[#8A7563]">Hợp đồng số:</div>
                  <div className="text-right font-semibold text-[#1b1c1c]  text-xs">{invoiceData.contract_code || invoiceData.contract_id || '---'}</div>
                  
                  <div className="text-[#8A7563]">Ngày thanh lý:</div>
                  <div className="text-right text-[#1b1c1c]  text-xs">{invoiceData.liquidated_at || invoiceData.created_at || '---'}</div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-label-caps text-[11px] text-[#8A7563] border-b border-[#DCCFC0]/55 pb-1 font-bold uppercase tracking-wider">Bảng quyết toán thanh lý</h4>
                <div className="divide-y divide-[#E7DED2]/65 text-xs ">
                  <div className="flex justify-between py-2">
                    <span className="font-sans text-[#1b1c1c]">Tiền hoàn cọc phòng:</span>
                    <span className="text-[#5F7D4E] font-bold">+{formattedAmount(invoiceData.refund_amount || invoiceData.deposit_refund)}</span>
                  </div>
                  {(invoiceData.deductions || invoiceData.refund_reconciliations?.deductions) && 
                    (invoiceData.deductions || invoiceData.refund_reconciliations?.deductions).map((ded: any, i: number) => (
                    <div key={i} className="flex justify-between py-2">
                      <span className="font-sans text-[#1b1c1c]">{ded.name || ded.reason}:</span>
                      <span className="text-[#A94F4F] font-bold">-{formattedAmount(ded.amount)}</span>
                    </div>
                  ))}
                  {invoiceData.damage_fee > 0 && (
                    <div className="flex justify-between py-2">
                      <span className="font-sans text-[#1b1c1c]">Phí bồi thường hư hại:</span>
                      <span className="text-[#A94F4F] font-bold">-{formattedAmount(invoiceData.damage_fee)}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center py-2.5 bg-[#5C4632]/5 px-3 rounded-lg border border-[#5C4632]/10 mt-3">
                  <span className="font-bold text-[#5C4632] text-sm">Tổng thanh toán thực tế:</span>
                  <span className=" text-lg font-bold text-[#5C4632]">{formattedAmount(invoiceData.total || invoiceData.amount)}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-[#d1c4b9] flex gap-3 bg-[#fbf9f8]">
          <button 
            onClick={handlePrint}
            className="flex-1 border border-[#5a462d] text-[#5a462d] py-2 rounded text-sm font-semibold bg-transparent hover:bg-[#e4e2e1] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            In PDF
          </button>
          
          {onConfirmPayment && invoiceData.status === 'pending' && (
            <button
              onClick={() => onConfirmPayment(invoiceData.id)}
              className="flex-1 bg-[#5C4632] text-[#ffffff] py-2.5 rounded-lg text-sm font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Ghi nhận TT
            </button>
          )}
        </div>
      </div>
    </ModalPortal>
  );
}
