import React, { useState } from 'react';
import CustomDatePicker from '../../../components/ui/CustomDatePicker';
import { Send } from 'lucide-react';

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

const inputCls =
  'w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition duration-200';

const labelCls = 'text-xs text-on-surface-variant font-semibold block mb-1.5';

const sectionTitle = (text: string) => (
  <h3 className="text-base font-semibold text-on-surface mb-4">
    {text}
  </h3>
);

export const CheckoutForm: React.FC<CheckoutFormProps> = ({
  currentInfo,
  onSubmit,
  isLoading = false,
}) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;

  const [expectedDate, setExpectedDate] = useState('');
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankOwner, setBankOwner] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const formatBankOwner = (val: string) => {
    const upper = val.toUpperCase();
    return upper
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/Đ/g, 'D')
      .replace(/[^A-Z ]/g, '');
  };

  const validate = () => {
    const tempErrors: { [key: string]: string } = {};
    if (!expectedDate) {
      tempErrors.expectedDate = 'Vui lòng chọn ngày dự kiến trả phòng.';
    } else if (expectedDate < minDate) {
      tempErrors.expectedDate = 'Ngày trả phòng tối thiểu phải từ ngày mai.';
    }
    if (!reason.trim()) {
      tempErrors.reason = 'Vui lòng nhập lý do trả phòng.';
    }
    if (!bankName.trim()) {
      tempErrors.bankName = 'Vui lòng nhập tên ngân hàng.';
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
      onSubmit({ expectedDate, reason, note, bankName, bankAccount: bankAccount.trim(), bankOwner: bankOwner.trim() });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-surface-container-lowest rounded-24 border border-outline-variant/40 shadow-sm p-6 md:p-8 space-y-8">



      {/* 1. THÔNG TIN THUÊ */}
      <div>
        {sectionTitle('Thông tin thuê hiện tại')}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-surface-container-low p-5 rounded-2xl border border-outline-variant/40">
          <div>
            <p className="text-xs text-on-surface-variant font-medium">Chi nhánh</p>
            <p className="text-sm font-semibold text-on-surface mt-0.5">{currentInfo.branchName}</p>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant font-medium">Hợp đồng</p>
            <p className="text-sm font-semibold text-on-surface mt-0.5">{currentInfo.contractId}</p>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant font-medium">Phòng – Giường</p>
            <p className="text-sm font-semibold text-on-surface mt-0.5">{currentInfo.roomName} – {currentInfo.bedName}</p>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant font-medium">Tiền đặt cọc hợp đồng</p>
            <p className="text-sm font-semibold text-primary mt-0.5">
              {currentInfo.depositAmount.toLocaleString('vi-VN')} VNĐ
            </p>
          </div>
        </div>
      </div>

      {/* 2. THÔNG TIN TRẢ PHÒNG */}
      <div>
        {sectionTitle('Thông tin trả phòng dự kiến')}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className={labelCls}>Ngày trả phòng mong muốn *</label>
            <CustomDatePicker
              min={minDate}
              value={expectedDate}
              onChange={setExpectedDate}
              placeholder="Chọn ngày"
              error={!!errors.expectedDate}
              variant="surface"
              triggerClassName="bg-surface-container-low border-outline-variant hover:border-primary/50 rounded-xl pl-12 pr-10 py-3"
            />
            {errors.expectedDate && (
              <p className="text-xs text-error font-medium mt-1">{errors.expectedDate}</p>
            )}
          </div>

          <div>
            <label className={labelCls}>Lý do trả phòng *</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="VD: Hết hạn hợp đồng, chuyển công tác..."
              className={`${inputCls} ${errors.reason ? 'border-error focus:ring-error/25 focus:border-error' : ''}`}
            />
            {errors.reason && (
              <p className="text-xs text-error font-medium mt-1">{errors.reason}</p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label className={labelCls}>Ghi chú thêm</label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Nhập ghi chú hoặc lý do chi tiết hơn (nếu có)..."
              className={`${inputCls} resize-none`}
            />
          </div>
        </div>
      </div>

      {/* 3. THÔNG TIN HOÀN CỌC */}
      <div>
        {sectionTitle('Tài khoản nhận hoàn cọc')}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div>
            <label className={labelCls}>Ngân hàng *</label>
            <input
              type="text"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="VD: Vietcombank, Techcombank..."
              className={`${inputCls} ${errors.bankName ? 'border-error focus:ring-error/25 focus:border-error' : ''}`}
            />
            {errors.bankName && (
              <p className="text-xs text-error font-medium mt-1">{errors.bankName}</p>
            )}
          </div>

          <div>
            <label className={labelCls}>Số tài khoản *</label>
            <input
              type="text"
              value={bankAccount}
              onChange={(e) => setBankAccount(e.target.value)}
              placeholder="VD: 0348210984"
              className={`${inputCls} ${errors.bankAccount ? 'border-error focus:ring-error/25 focus:border-error' : ''}`}
            />
            {errors.bankAccount && (
              <p className="text-xs text-error font-medium mt-1">{errors.bankAccount}</p>
            )}
          </div>

          <div>
            <label className={labelCls}>Chủ tài khoản (In hoa không dấu) *</label>
            <input
              type="text"
              value={bankOwner}
              onChange={(e) => setBankOwner(formatBankOwner(e.target.value))}
              placeholder="VD: LE LAM TRI DUC"
              className={`${inputCls} ${errors.bankOwner ? 'border-error focus:ring-error/25 focus:border-error' : ''}`}
            />
            {errors.bankOwner && (
              <p className="text-xs text-error font-medium mt-1">{errors.bankOwner}</p>
            )}
          </div>
        </div>
      </div>

      {/* SUBMIT */}
      <div className="pt-4 border-t border-outline-variant/40 flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-60 text-on-primary font-semibold text-sm px-8 py-3.5 rounded-full transition duration-200 shadow-sm focus:outline-none focus:ring-4 focus:ring-primary/25 cursor-pointer disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Đang gửi yêu cầu...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Gửi yêu cầu trả phòng
            </>
          )}
        </button>
      </div>
    </form>
  );
};
