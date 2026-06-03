import React, { useState } from 'react';

interface CurrentRentInfo {
  branchName: string;
  roomName: string;
  bedName: string;
  contractId: string;
  depositAmount: number;
}

interface CheckoutFormProps {
  currentInfo: CurrentRentInfo;
  onSubmit: (formData: {
    expectedDate: string;
    reason: string;
    note: string;
    bankName: string;
    bankAccount: string;
    bankOwner: string;
  }) => void;
  isLoading?: boolean;
}

export const CheckoutForm: React.FC<CheckoutFormProps> = ({ currentInfo, onSubmit, isLoading = false }) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const [expectedDate, setExpectedDate] = useState('');
  const [reason, setReason] = useState('Hết hạn hợp đồng');
  const [note, setNote] = useState('');
  const [bankName, setBankName] = useState('Vietcombank');
  const [bankAccount, setBankAccount] = useState('');
  const [bankOwner, setBankOwner] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const formatBankOwner = (val: string) => {
    // Chuyển sang chữ hoa không dấu
    const upper = val.toUpperCase();
    return upper
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/Đ/g, 'D')
      .replace(/[^A-Z ]/g, ''); // Chỉ cho phép chữ cái và khoảng trắng
  };

  const validate = () => {
    const tempErrors: { [key: string]: string } = {};
    if (!expectedDate) {
      tempErrors.expectedDate = 'Vui lòng chọn ngày dự kiến trả phòng.';
    } else if (expectedDate < minDate) {
      tempErrors.expectedDate = 'Ngày trả phòng tối thiểu phải từ ngày mai.';
    }

    if (!bankAccount.trim()) {
      tempErrors.bankAccount = 'Vui lòng nhập số tài khoản ngân hàng.';
    } else if (!/^\d+$/.test(bankAccount.trim())) {
      tempErrors.bankAccount = 'Số tài khoản chỉ được bao gồm các chữ số.';
    }

    if (!bankOwner.trim()) {
      tempErrors.bankOwner = 'Vui lòng nhập tên chủ tài khoản.';
    } else if (bankOwner.trim().split(' ').length < 2) {
      tempErrors.bankOwner = 'Vui lòng nhập đầy đủ họ và tên chủ tài khoản.';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({
        expectedDate,
        reason,
        note,
        bankName,
        bankAccount: bankAccount.trim(),
        bankOwner: bankOwner.trim(),
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-[#ecebe6] shadow-sm p-6 md:p-8 space-y-8">
      {/* 1. THÔNG TIN THUÊ HIỆN TẠI */}
      <div>
        <h3 className="text-lg font-semibold text-[#334537] mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#8c9a8e]" />
          Thông tin thuê hiện tại
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#faf9f6] p-5 rounded-2xl border border-[#ecebe6]">
          <div>
            <p className="text-xs text-[#8c9a8e] font-medium">Chi nhánh</p>
            <p className="text-sm font-semibold text-[#334537] mt-0.5">{currentInfo.branchName}</p>
          </div>
          <div>
            <p className="text-xs text-[#8c9a8e] font-medium">Hợp đồng hiện tại</p>
            <p className="text-sm font-semibold text-[#334537] mt-0.5">{currentInfo.contractId}</p>
          </div>
          <div>
            <p className="text-xs text-[#8c9a8e] font-medium">Phòng - Giường</p>
            <p className="text-sm font-semibold text-[#334537] mt-0.5">
              {currentInfo.roomName} - {currentInfo.bedName}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#8c9a8e] font-medium">Tiền đặt cọc hợp đồng</p>
            <p className="text-sm font-semibold text-[#b87d4b] mt-0.5">
              {currentInfo.depositAmount.toLocaleString('vi-VN')} VNĐ
            </p>
          </div>
        </div>
      </div>

      {/* 2. THÔNG TIN TRẢ PHÒNG */}
      <div>
        <h3 className="text-lg font-semibold text-[#334537] mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#8c9a8e]" />
          Thông tin trả phòng dự kiến
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1">
            <label className="text-xs text-[#8c9a8e] font-semibold block">Ngày trả phòng mong muốn *</label>
            <input
              type="date"
              min={minDate}
              value={expectedDate}
              onChange={(e) => setExpectedDate(e.target.value)}
              className={`w-full bg-[#faf9f6] border ${
                errors.expectedDate ? 'border-red-400 focus:ring-red-200' : 'border-[#ecebe6] focus:ring-[#8c9a8e]/20'
              } text-[#334537] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-4 transition duration-200`}
            />
            {errors.expectedDate && <p className="text-xs text-red-500 font-medium mt-1">{errors.expectedDate}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs text-[#8c9a8e] font-semibold block">Lý do trả phòng *</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-[#faf9f6] border border-[#ecebe6] text-[#334537] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-[#8c9a8e]/20 transition duration-200"
            >
              <option value="Hết hạn hợp đồng">Hết hạn hợp đồng</option>
              <option value="Thay đổi nơi học tập/làm việc">Thay đổi nơi học tập/làm việc</option>
              <option value="Lý do cá nhân">Lý do cá nhân</option>
              <option value="Không hài lòng với dịch vụ">Không hài lòng với dịch vụ</option>
            </select>
          </div>

          <div className="sm:col-span-2 space-y-1">
            <label className="text-xs text-[#8c9a8e] font-semibold block">Ghi chú thêm</label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Nhập ghi chú hoặc lý do chi tiết hơn (nếu có)..."
              className="w-full bg-[#faf9f6] border border-[#ecebe6] text-[#334537] rounded-xl px-4 py-3 text-sm placeholder-[#b0aeab] focus:outline-none focus:ring-4 focus:ring-[#8c9a8e]/20 transition duration-200 resize-none"
            />
          </div>
        </div>
      </div>

      {/* 3. THÔNG TIN HOÀN CỌC */}
      <div>
        <h3 className="text-lg font-semibold text-[#334537] mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#b87d4b]" />
          Thông tin tài khoản nhận hoàn cọc
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="space-y-1">
            <label className="text-xs text-[#8c9a8e] font-semibold block">Ngân hàng hoàn cọc *</label>
            <select
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="w-full bg-[#faf9f6] border border-[#ecebe6] text-[#334537] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-[#8c9a8e]/20 transition duration-200"
            >
              <option value="Vietcombank">Vietcombank</option>
              <option value="Techcombank">Techcombank</option>
              <option value="BIDV">BIDV</option>
              <option value="MBBank">MBBank</option>
              <option value="ACB">ACB</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-[#8c9a8e] font-semibold block">Số tài khoản *</label>
            <input
              type="text"
              value={bankAccount}
              onChange={(e) => setBankAccount(e.target.value)}
              placeholder="Ví dụ: 0348210984"
              className={`w-full bg-[#faf9f6] border ${
                errors.bankAccount ? 'border-red-400 focus:ring-red-200' : 'border-[#ecebe6] focus:ring-[#8c9a8e]/20'
              } text-[#334537] rounded-xl px-4 py-3 text-sm placeholder-[#b0aeab] focus:outline-none focus:ring-4 transition duration-200`}
            />
            {errors.bankAccount && <p className="text-xs text-red-500 font-medium mt-1">{errors.bankAccount}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs text-[#8c9a8e] font-semibold block">Chủ tài khoản (In hoa không dấu) *</label>
            <input
              type="text"
              value={bankOwner}
              onChange={(e) => setBankOwner(formatBankOwner(e.target.value))}
              placeholder="Ví dụ: LE LAM TRI DUC"
              className={`w-full bg-[#faf9f6] border ${
                errors.bankOwner ? 'border-red-400 focus:ring-red-200' : 'border-[#ecebe6] focus:ring-[#8c9a8e]/20'
              } text-[#334537] rounded-xl px-4 py-3 text-sm placeholder-[#b0aeab] focus:outline-none focus:ring-4 transition duration-200`}
            />
            {errors.bankOwner && <p className="text-xs text-red-500 font-medium mt-1">{errors.bankOwner}</p>}
          </div>
        </div>
      </div>

      {/* BUTTON SUBMIT */}
      <div className="pt-4 border-t border-[#ecebe6] flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full sm:w-auto bg-[#334537] hover:bg-[#253228] disabled:bg-[#8c9a8e] text-white font-semibold text-sm px-8 py-3.5 rounded-xl transition duration-200 flex items-center justify-center gap-2 shadow-sm focus:outline-none focus:ring-4 focus:ring-[#334537]/25"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Đang gửi yêu cầu...
            </>
          ) : (
            'Gửi yêu cầu trả phòng & hoàn cọc'
          )}
        </button>
      </div>
    </form>
  );
};
