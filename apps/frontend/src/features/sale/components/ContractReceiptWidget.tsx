import { CreditCard, Banknote, Wallet, Home, Wrench } from 'lucide-react';
import { ContractFormData, DepositRecord } from '../SaleContractsPage';

interface Props {
  deposit: DepositRecord;
  formData: Partial<ContractFormData>;
}

const SERVICE_FEE = 250_000;

export default function ContractReceiptWidget({ deposit, formData }: Props) {
  const monthlyRent = formData.rentPrice ?? deposit.roomMonthlyRent;
  const depositAmount = deposit.depositAmount;
  const total = monthlyRent + depositAmount + SERVICE_FEE;

  return (
    <div className="flex flex-col gap-4">
      {/* Payment Summary */}
      <div className="bg-white rounded-2xl border border-[#d1c4b9] shadow-sm overflow-hidden">
        <div className="px-5 py-4 bg-gradient-to-r from-[#6f583c] to-[#8C7355] text-white">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Tóm tắt thanh toán lần đầu
          </h3>
        </div>
        <div className="p-5 space-y-3">
          {/* Tiền thuê tháng đầu */}
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2 text-[#4e453c]">
              <Home className="w-3.5 h-3.5 text-[#9d8879]" />
              <span>Tiền thuê tháng đầu</span>
            </div>
            <span className="font-semibold text-[#1e1b17]">
              {monthlyRent.toLocaleString('vi-VN')} đ
            </span>
          </div>

          {/* Tiền cọc */}
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2 text-[#4e453c]">
              <Wallet className="w-3.5 h-3.5 text-[#9d8879]" />
              <span>Tiền đặt cọc</span>
            </div>
            <span className="font-semibold text-[#1e1b17]">
              {depositAmount.toLocaleString('vi-VN')} đ
            </span>
          </div>

          {/* Phí dịch vụ */}
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2 text-[#4e453c]">
              <Wrench className="w-3.5 h-3.5 text-[#9d8879]" />
              <span>Phí dịch vụ cố định</span>
            </div>
            <span className="font-semibold text-[#1e1b17]">
              {SERVICE_FEE.toLocaleString('vi-VN')} đ
            </span>
          </div>

          <div className="border-t border-[#eee7e1] pt-3 mt-1">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-[#1e1b17]">Tổng cộng</span>
              <span className="text-lg font-extrabold text-[#6f583c]">
                {total.toLocaleString('vi-VN')} đ
              </span>
            </div>
            <p className="text-[11px] text-[#9d8879] mt-1">Thanh toán ngay khi ký hợp đồng nhận phòng</p>
          </div>
        </div>
      </div>

      {/* Tiến trình hợp đồng */}
      <div className="bg-white rounded-2xl border border-[#d1c4b9] shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#eee7e1] flex justify-between items-center">
          <h3 className="font-bold text-sm text-[#1e1b17] flex items-center gap-2">
            <Banknote className="w-4 h-4 text-[#6f583c]" />
            Thông tin phòng
          </h3>
        </div>
        <div className="p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-[#9d8879]">Mã phòng</span>
            <span className="font-semibold text-[#1e1b17]">{deposit.roomCode}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#9d8879]">Loại phòng</span>
            <span className="font-semibold text-[#1e1b17]">{deposit.roomType}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#9d8879]">Chi nhánh</span>
            <span className="font-semibold text-[#1e1b17]">{deposit.branch}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#9d8879]">Giá chuẩn</span>
            <span className="font-semibold text-[#2d6a4f]">
              {deposit.roomMonthlyRent.toLocaleString('vi-VN')} đ/tháng
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
