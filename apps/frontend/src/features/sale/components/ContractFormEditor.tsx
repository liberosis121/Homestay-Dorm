import { useState, useEffect } from 'react';
import {
  User, Users, Phone, Mail, MapPin, Home, Building2,
  FileText, Banknote, ChevronLeft, Save, FileSignature,
  AlertCircle, CheckCircle2, Info, Edit3
} from 'lucide-react';
import { ContractFormData, DepositRecord } from '../SaleContractsPage';
import ContractReceiptWidget from './ContractReceiptWidget';
import CustomSelect from '../../../components/ui/CustomSelect';
import CustomDatePicker from '../../../components/ui/CustomDatePicker';
import FormLabel from '../../../components/ui/FormLabel';

interface Props {
  deposit: DepositRecord;
  onBack: () => void;
  onSubmit: (data: ContractFormData) => void;
  onSaveDraft: (data: ContractFormData) => void;
}

type ContractType = 'long_term' | 'short_term';
type PaymentCycle = '1_month' | '3_months' | '6_months';

const DEFAULT_TERMS = `ĐIỀU KHOẢN HỢP ĐỒNG THUÊ PHÒNG HOMESTAY

1. NGHĨA VỤ THANH TOÁN
   • Tiền thuê phòng phải được thanh toán đúng hạn vào ngày 01 hằng tháng.
   • Thanh toán chậm quá 07 ngày sẽ bị phạt 0.5%/ngày trên số tiền còn thiếu.
   • Tiền cọc được hoàn trả trong vòng 07 ngày làm việc sau khi kết thúc hợp đồng (trừ các khoản khấu trừ hợp lệ).

2. SỬ DỤNG PHÒNG & TÀI SẢN
   • Bên thuê có trách nhiệm giữ gìn cơ sở vật chất và trang thiết bị trong phòng.
   • Không được tự ý sửa chữa, lắp đặt thêm thiết bị hoặc thay đổi kết cấu phòng.
   • Hư hỏng do lỗi của bên thuê sẽ được khấu trừ từ tiền cọc hoặc bồi thường.

3. NỘI QUY HOMESTAY
   • Giữ yên tĩnh từ 22:00 đến 07:00. Không gây ồn ào, ảnh hưởng đến các cư dân khác.
   • Không hút thuốc lá, sử dụng chất cấm trong khuôn viên homestay.
   • Khách vãng lai phải đăng ký với Ban quản lý. Không cho người ngoài ở lại qua đêm khi chưa được phép.
   • Phân loại và đổ rác đúng nơi quy định.

4. CHẤM DỨT HỢP ĐỒNG
   • Bên thuê thông báo trước tối thiểu 30 ngày bằng văn bản khi muốn chấm dứt hợp đồng trước hạn.
   • Chấm dứt trước hạn mà không thông báo sẽ dẫn đến mất tiền cọc.
   • Bên cho thuê có quyền chấm dứt hợp đồng ngay lập tức nếu bên thuê vi phạm nghiêm trọng nội quy.`;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
      <AlertCircle className="w-3 h-3" /> {message}
    </p>
  );
}

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div className="w-8 h-8 rounded-lg bg-[#6f583c]/10 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-[#6f583c]" />
      </div>
      <h3 className="font-bold text-[#1e1b17] text-sm">{title}</h3>
    </div>
  );
}

export default function ContractFormEditor({ deposit, onBack, onSubmit, onSaveDraft }: Props) {
  // Form state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Parse deposit.duration to number (e.g. "6 tháng" -> 6)
  const getInitialDuration = () => {
    const durStr = (deposit as any).duration || (deposit as any).rental_duration || '';
    const match = durStr.match(/\d+/);
    const months = match ? parseInt(match[0], 10) : 6;
    if ([6, 12, 18, 24].includes(months)) return months;
    return 6;
  };

  const [durationMonths, setDurationMonths] = useState<number>(getInitialDuration());
  const [contractType, setContractType] = useState<ContractType>('short_term');
  const [rentPrice, setRentPrice] = useState(deposit.roomMonthlyRent);
  const [paymentCycle, setPaymentCycle] = useState<PaymentCycle>('1_month');
  const [terms, setTerms] = useState(DEFAULT_TERMS);
  const [notes, setNotes] = useState('');
  const [checklistChecked, setChecklistChecked] = useState([false, false, false, false]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  // Auto-calculate end date and contract type based on startDate and durationMonths
  useEffect(() => {
    if (startDate) {
      const d = new Date(startDate);
      d.setMonth(d.getMonth() + durationMonths);
      setEndDate(d.toISOString().split('T')[0]);

      if (durationMonths < 12) {
        setContractType('short_term');
      } else {
        setContractType('long_term');
      }
    } else {
      setEndDate('');
    }
  }, [startDate, durationMonths]);

  const formData: Partial<ContractFormData> = {
    startDate,
    endDate,
    contractType,
    rentPrice,
    paymentCycle,
    terms,
    notes,
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!startDate) errs.startDate = 'Vui lòng chọn ngày bắt đầu';
    if (!endDate) errs.endDate = 'Vui lòng chọn ngày kết thúc';
    if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
      errs.endDate = 'Ngày kết thúc phải sau ngày bắt đầu';
    }
    if (!rentPrice || rentPrice <= 0) errs.rentPrice = 'Giá thuê phải là số dương';
    if (!checklistChecked.every(Boolean)) errs.checklist = 'Hoàn tất toàn bộ checklist xác nhận';
    return errs;
  };

  const handleSubmit = () => {
    setSubmitted(true);
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    onSubmit({
      depositId: deposit.id,
      customerId: deposit.customerId,
      roomCode: deposit.roomCode,
      startDate,
      endDate,
      contractType,
      rentPrice,
      paymentCycle,
      terms,
      notes,
    } as ContractFormData);
  };

  const handleSaveDraft = () => {
    onSaveDraft({
      depositId: deposit.id,
      customerId: deposit.customerId,
      roomCode: deposit.roomCode,
      startDate,
      endDate,
      contractType,
      rentPrice,
      paymentCycle,
      terms,
      notes,
    } as ContractFormData);
  };

  const toggleChecklist = (i: number) => {
    const next = [...checklistChecked];
    next[i] = !next[i];
    setChecklistChecked(next);
    if (submitted && next.every(Boolean)) {
      setErrors((e) => { const c = { ...e }; delete c.checklist; return c; });
    }
  };

  const toggleAllChecklist = () => {
    const nextVal = !allChecklistDone;
    const next = checklistChecked.map(() => nextVal);
    setChecklistChecked(next);
    if (submitted && nextVal) {
      setErrors((e) => { const c = { ...e }; delete c.checklist; return c; });
    }
  };

  const allChecklistDone = checklistChecked.every(Boolean);

  const checklistLabels = [
    'Đã xác minh danh tính khách thuê',
    'Đã xác minh tình trạng phòng',
    'Đã giải thích đầy đủ điều khoản hợp đồng',
    'Khách hàng đồng ý và sẵn sàng ký hợp đồng',
  ];

  const roomAmenities = (
    (deposit as DepositRecord & { amenities?: string[]; roomAmenities?: string[] }).roomAmenities ||
    (deposit as DepositRecord & { amenities?: string[]; roomAmenities?: string[] }).amenities ||
    []
  ).filter(Boolean);

  return (
    <div className="animate-fade-in-up theme-sale">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-[#6f583c] hover:text-[#5c4830] bg-[#faf2ec]/50 border border-[#d1c4b9]/30 hover:bg-[#e8e1d3]/40 hover:border-[#d1c4b9]/80 font-medium transition-all duration-200 cursor-pointer active:scale-[0.98] active:bg-[#e8e1d3]/60 focus:outline-none focus:ring-2 focus:ring-[#6f583c]/20"
        >
          <ChevronLeft className="w-4 h-4" />
          Danh sách phiếu cọc
        </button>
        <span className="text-[#9d8879]">/</span>
        <span className="text-sm text-[#1e1b17] font-semibold">Lập hợp đồng – {deposit.depositCode}</span>
      </div>

      {/* Main layout: 8/4 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: Form editor */}
        <div className="lg:col-span-8 space-y-5">

          {/* Section 1: Thông tin khách thuê */}
          <div className="bg-white rounded-2xl border border-[#d1c4b9] shadow-sm p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <SectionHeader
                icon={User}
                title={deposit.rentalType === 'group' ? 'Thông tin nhóm khách thuê' : 'Thông tin khách thuê'}
              />
              <div className="flex flex-wrap items-center gap-2">
                {deposit.rentalType === 'group' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#e8e1d3]/60 text-[#5e503f] border border-[#d2c4b9]">
                    <Users className="w-3.5 h-3.5 text-[#5e503f]/80" />
                    Nhóm khách thuê
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#faf2ec] text-[#6f583c] border border-[#d1c4b9]">
                    <User className="w-3.5 h-3.5 text-[#6f583c]/80" />
                    Khách cá nhân
                  </span>
                )}
                {deposit.roomCapacity && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#faf2ec] text-[#4e453c] border border-[#d1c4b9]">
                    Sức chứa: {deposit.roomCapacity} người
                  </span>
                )}
              </div>
            </div>

            {deposit.rentalType === 'group' ? (
              <div className="space-y-4">
                {/* Số lượng khách */}
                <div className="text-xs text-[#9d8879] bg-[#faf2ec] rounded-lg px-3 py-1.5 flex items-center justify-between">
                  <span>Số khách đăng ký: <strong className="text-[#1e1b17]">{deposit.tenants?.length || 0} người</strong></span>
                  {deposit.roomCapacity && (
                    <span>Tình trạng: <strong className="text-[#2d6a4f]">Hợp lệ (≤ {deposit.roomCapacity} người)</strong></span>
                  )}
                </div>

                {/* Representative (Trưởng nhóm) */}
                <div className="bg-[#fff8f3] rounded-xl p-4 border border-[#eee7e1] relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-[#6f583c] text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                    Đại diện / Trưởng nhóm
                  </div>
                  
                  {(() => {
                    const rep = deposit.tenants?.find(t => t.role === 'representative') || {
                      name: deposit.customerName,
                      cccd: deposit.customerCCCD,
                      phone: deposit.customerPhone,
                      email: deposit.customerEmail,
                      role: 'representative'
                    };
                    return (
                      <div className="flex items-start gap-4 mt-2 sm:mt-0">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#6f583c] to-[#8C7355] flex items-center justify-center text-white font-bold text-lg shrink-0">
                          {rep.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-[#1e1b17] text-base flex items-center gap-2">
                            {rep.name}
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 mt-2">
                            <div className="flex items-center gap-2 text-sm text-[#4e453c]">
                              <User className="w-3.5 h-3.5 text-[#9d8879]" />
                              <span>CCCD: <strong className="font-mono">{rep.cccd}</strong></span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-[#4e453c]">
                              <Phone className="w-3.5 h-3.5 text-[#9d8879]" />
                              <span>{rep.phone}</span>
                            </div>
                            {rep.email && (
                              <div className="flex items-center gap-2 text-sm text-[#4e453c]">
                                <Mail className="w-3.5 h-3.5 text-[#9d8879]" />
                                <span>{rep.email}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-sm text-[#4e453c]">
                              <MapPin className="w-3.5 h-3.5 text-[#9d8879]" />
                              <span className="truncate">{deposit.customerAddress}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Other members */}
                <div>
                  <h4 className="text-xs font-bold text-[#8c7355] uppercase tracking-wider mb-2.5 ml-1 flex items-center gap-1.5">
                    Thành viên đi cùng ({(deposit.tenants?.filter(t => t.role === 'member').length || 0)} người)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {deposit.tenants?.filter(t => t.role === 'member').map((member, idx) => (
                      <div key={idx} className="bg-white rounded-xl p-3 border border-[#eee7e1] flex items-start gap-3 hover:shadow-sm transition-shadow">
                        <div className="w-9 h-9 rounded-full bg-[#faf2ec] border border-[#d1c4b9] flex items-center justify-center text-[#6f583c] font-bold text-sm shrink-0">
                          {member.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-[#1e1b17] text-xs truncate">{member.name}</p>
                          <div className="space-y-0.5 mt-1 text-[11px] text-[#4e453c]">
                            <p className="flex items-center gap-1.5">
                              <span className="text-[#9d8879]">CCCD:</span>
                              <span className="font-mono font-medium">{member.cccd}</span>
                            </p>
                            <p className="flex items-center gap-1.5">
                              <span className="text-[#9d8879]">SĐT:</span>
                              <span>{member.phone}</span>
                            </p>
                            {member.email && (
                              <p className="flex items-center gap-1.5 truncate">
                                <span className="text-[#9d8879]">Email:</span>
                                <span className="truncate">{member.email}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[#fff8f3] rounded-xl p-4 border border-[#eee7e1]">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#6f583c] to-[#8C7355] flex items-center justify-center text-white font-bold text-lg shrink-0">
                    {deposit.customerName.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-[#1e1b17] text-base">{deposit.customerName}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 mt-2">
                      <div className="flex items-center gap-2 text-sm text-[#4e453c]">
                        <User className="w-3.5 h-3.5 text-[#9d8879]" />
                        <span>CCCD: <strong className="font-mono">{deposit.customerCCCD}</strong></span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-[#4e453c]">
                        <Phone className="w-3.5 h-3.5 text-[#9d8879]" />
                        <span>{deposit.customerPhone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-[#4e453c]">
                        <Mail className="w-3.5 h-3.5 text-[#9d8879]" />
                        <span>{deposit.customerEmail}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-[#4e453c]">
                        <MapPin className="w-3.5 h-3.5 text-[#9d8879]" />
                        <span className="truncate">{deposit.customerAddress}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="mt-3 flex items-center gap-1.5 text-xs text-[#9d8879] bg-[#faf2ec] rounded-lg px-3 py-2">
              <Info className="w-3.5 h-3.5 shrink-0" />
              Thông tin khách thuê được tự động điền từ phiếu đặt cọc. Liên hệ quản lý nếu cần cập nhật.
            </div>
          </div>

          {/* Section 2: Thông tin phòng */}
          <div className="bg-white rounded-2xl border border-[#d1c4b9] shadow-sm p-6">
            <SectionHeader icon={Home} title="Thông tin phòng thuê" />
            <div className="bg-[#fff8f3] rounded-xl p-4 border border-[#eee7e1]">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#6f583c]/10 flex items-center justify-center shrink-0">
                  <Building2 className="w-6 h-6 text-[#6f583c]" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-[#1e1b17] text-base">{deposit.roomCode}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-[#e2d8ca] bg-[#fffdf9] px-2.5 py-1 text-[11px] font-semibold text-[#5f584f]">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-[#9d8879]" />
                      <span className="truncate">Chi nhánh {deposit.branch}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-[#e2d8ca] bg-[#fffdf9] px-2.5 py-1 text-[11px] font-semibold text-[#5f584f]">
                      <Home className="h-3.5 w-3.5 shrink-0 text-[#9d8879]" />
                      {deposit.roomType}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-[#c8d9c0] bg-[#eef6ea] px-2.5 py-1 text-[11px] font-bold text-[#2d6a4f]">
                      <Banknote className="h-3.5 w-3.5 shrink-0" />
                      {deposit.roomMonthlyRent.toLocaleString('vi-VN')} đ/tháng
                    </span>
                  </div>

                  {/* Giường được thuê — hiển thị rõ cho cả thuê cá nhân (1 giường) lẫn nhóm (N giường) */}
                  {deposit.bedNames && deposit.bedNames.length > 0 && (
                    <div className="mt-3 rounded-xl border border-[#e2d8ca] bg-[#fffdf9] px-3 py-2.5">
                      <p className="text-[11px] font-bold text-[#8c7355] uppercase tracking-wider mb-1.5">
                        Giường được thuê ({deposit.bedNames.length})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {deposit.bedNames.map((b) => (
                          <span key={b} className="inline-flex items-center gap-1 rounded-full border border-[#c8d9c0] bg-[#eef6ea] px-2.5 py-1 text-[11px] font-bold text-[#2d6a4f]">
                            <Home className="h-3.5 w-3.5 shrink-0" />
                            {b}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {roomAmenities.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {roomAmenities.map((amenity) => (
                        <span key={amenity} className="inline-flex items-center rounded-full bg-[#f4f1ec] px-2 py-0.5 text-[10.5px] font-medium text-[#7a6b5b]">
                          {amenity}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Thông tin hợp đồng */}
          <div className="bg-white rounded-2xl border border-[#d1c4b9] shadow-sm p-6">
            <SectionHeader icon={FileText} title="Thông tin hợp đồng" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Loại hợp đồng (Tự động cập nhật) */}
              <div>
                <label className="block text-xs font-bold text-[#4e453c] uppercase tracking-wider mb-2">
                  Loại hợp đồng
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { val: 'long_term', label: 'Dài hạn', desc: 'Thời hạn từ 12 tháng trở lên' },
                    { val: 'short_term', label: 'Ngắn hạn', desc: 'Thời hạn dưới 12 tháng' },
                  ].map(({ val, label, desc }) => (
                    <div
                      key={val}
                      className={`px-4 py-3 rounded-xl border-2 text-left transition-all ${
                        contractType === val
                          ? 'border-[#6f583c] bg-[#fff8f3] opacity-100'
                          : 'border-[#d1c4b9] bg-gray-50 opacity-60'
                      }`}
                    >
                      <p className={`font-semibold text-sm ${contractType === val ? 'text-[#6f583c]' : 'text-gray-400'}`}>
                        {label}
                      </p>
                      <p className="text-xs text-gray-400">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ngày bắt đầu */}
              <div>
                <CustomDatePicker
                  label="Ngày bắt đầu"
                  required
                  value={startDate}
                  onChange={setStartDate}
                  min={(() => {
                    const d = new Date();
                    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                  })()}
                  error={errors.startDate}
                  placeholder="Chọn ngày bắt đầu"
                />
              </div>

              {/* Thời hạn hợp đồng */}
              <div>
                <label className="block text-xs font-bold text-[#4e453c] uppercase tracking-wider mb-2">
                  Thời hạn hợp đồng *
                </label>
                <select
                  value={durationMonths}
                  onChange={(e) => setDurationMonths(parseInt(e.target.value, 10))}
                  className="w-full py-2.5 px-4 rounded-xl border border-[#d1c4b9] text-sm bg-[#fff8f3] focus:outline-none focus:ring-2 focus:ring-[#6f583c]/30 focus:border-[#6f583c] transition"
                >
                  <option value={6}>6 tháng</option>
                  <option value={12}>12 tháng</option>
                  <option value={18}>18 tháng</option>
                  <option value={24}>24 tháng</option>
                </select>
              </div>

              {/* Ngày kết thúc */}
              <div>
                <label className="block text-xs font-bold text-[#4e453c] uppercase tracking-wider mb-2">
                  Ngày kết thúc (Tự động tính)
                </label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={endDate ? (() => {
                    const parts = endDate.split('-');
                    return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : endDate;
                  })() : 'Chưa xác định'}
                  className="w-full py-2.5 px-4 rounded-xl border border-[#d1c4b9] text-sm bg-gray-100 text-gray-500 cursor-not-allowed focus:outline-none"
                />
                <p className="text-[10px] text-[#9d8879] mt-1">
                  Được tính tự động bằng Ngày bắt đầu cộng thêm thời hạn hợp đồng.
                </p>
              </div>

              {/* Giá thuê */}
              <div>
                <FormLabel label="Giá thuê thực tế (đ/tháng)" required className="mb-2" />
                <div className="relative">
                  <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9d8879]" />
                  <input
                    type="text"
                    value={rentPrice === 0 ? '' : new Intl.NumberFormat('vi-VN').format(rentPrice)}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '');
                      setRentPrice(raw ? parseInt(raw, 10) : 0);
                    }}
                    className={`w-full pl-10 pr-20 py-2.5 rounded-xl border text-sm bg-[#fff8f3] focus:outline-none focus:ring-2 focus:ring-[#6f583c]/30 focus:border-[#6f583c] transition ${
                      errors.rentPrice ? 'border-red-400 bg-red-50' : 'border-[#d1c4b9]'
                    }`}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#9d8879]">
                    đ/tháng
                  </span>
                </div>
                <p className="text-[11px] text-[#9d8879] mt-1">
                  Giá chuẩn phòng: {deposit.roomMonthlyRent.toLocaleString('vi-VN')} đ/tháng
                </p>
                <FieldError message={errors.rentPrice} />
              </div>

              {/* Kỳ thanh toán */}
              <div>
                <FormLabel label="Kỳ thanh toán" required className="mb-2" />
                <CustomSelect
                  value={paymentCycle}
                  onChange={(val) => setPaymentCycle(val as PaymentCycle)}
                  theme="sale"
                  options={[
                    { value: '1_month', label: 'Hàng tháng (1 tháng/kỳ)' },
                    { value: '3_months', label: 'Hàng quý (3 tháng/kỳ)' },
                    { value: '6_months', label: 'Nửa năm (6 tháng/kỳ)' },
                  ]}
                  triggerClassName="w-full !py-[11px] !px-4 !bg-[#fff8f3] !border-[#d1c4b9] !rounded-xl text-sm"
                  dropdownClassName="!border-[#d1c4b9]"
                />
              </div>

              {/* Tiền cọc (read-only) */}
              <div className="sm:col-span-2">
                <FormLabel label="Tiền đặt cọc (tự động từ phiếu cọc)" className="mb-2" />
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#d1c4b9] bg-[#f0faf2] text-sm">
                  <CheckCircle2 className="w-4 h-4 text-[#2d6a4f] shrink-0" />
                  <span className="font-bold text-[#2d6a4f]">
                    {deposit.depositAmount.toLocaleString('vi-VN')} đ
                  </span>
                  <span className="text-[#9d8879]">– Đã xác nhận từ phiếu {deposit.depositCode}</span>
                </div>
              </div>

              {/* Ghi chú */}
              <div className="sm:col-span-2">
                <FormLabel label="Ghi chú (không bắt buộc)" className="mb-2" />
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Thêm ghi chú, yêu cầu đặc biệt của khách hàng..."
                  className="w-full px-4 py-3 rounded-xl border border-[#d1c4b9] text-sm bg-[#fff8f3] focus:outline-none focus:ring-2 focus:ring-[#6f583c]/30 focus:border-[#6f583c] transition placeholder-[#b5a89c] resize-none"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Điều khoản & nội quy */}
          <div className="bg-white rounded-2xl border border-[#d1c4b9] shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <SectionHeader icon={Edit3} title="Điều khoản & Nội quy" />
              <span className="text-xs text-[#9d8879] flex items-center gap-1">
                <Edit3 className="w-3 h-3" /> Có thể chỉnh sửa
              </span>
            </div>
            <textarea
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              rows={16}
              className="w-full px-4 py-3 rounded-xl border border-[#d1c4b9] text-xs text-[#1e1b17] bg-[#fff8f3] focus:outline-none focus:ring-2 focus:ring-[#6f583c]/30 focus:border-[#6f583c] transition font-mono leading-relaxed resize-y"
            />
            <p className="text-[11px] text-[#9d8879] mt-2 flex items-center gap-1">
              <Info className="w-3 h-3" />
              Mẫu điều khoản chuẩn của HomeStay Dorm. Bạn có thể chỉnh sửa trực tiếp nếu cần.
            </p>
          </div>

          {/* Section 5: Checklist xác nhận (mobile only - widget for desktop) */}
          <div className="bg-white rounded-2xl border border-[#d1c4b9] shadow-sm p-6 lg:hidden">
            <div className="flex items-center justify-between mb-4">
              <SectionHeader icon={CheckCircle2} title="Checklist xác nhận bắt buộc" />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleAllChecklist}
                  className="px-2 py-0.5 text-[10px] font-bold text-[#6f583c] bg-[#faf2ec]/60 border border-[#d1c4b9]/30 hover:bg-[#e8e1d3]/40 hover:border-[#d1c4b9]/80 rounded-md transition cursor-pointer active:scale-95 flex items-center"
                >
                  {allChecklistDone ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                </button>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${allChecklistDone ? 'bg-[#d8f3dc] text-[#1b5e20]' : 'bg-[#fef3c7] text-[#92400e]'}`}>
                  {checklistChecked.filter(Boolean).length}/{checklistLabels.length}
                </span>
              </div>
            </div>
            <div className="space-y-3">
              {checklistLabels.map((label, i) => (
                <label key={i} className="flex items-start gap-3 cursor-pointer group">
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition ${
                      checklistChecked[i] ? 'bg-[#2d6a4f] border-[#2d6a4f]' : 'border-[#d1c4b9] group-hover:border-[#6f583c]'
                    }`}
                    onClick={() => toggleChecklist(i)}
                  >
                    {checklistChecked[i] && <CheckCircle2 className="w-3 h-3 text-white" />}
                  </div>
                  <span className={`text-sm ${checklistChecked[i] ? 'text-[#1e1b17] font-medium' : 'text-[#9d8879]'}`}>
                    {label}
                  </span>
                </label>
              ))}
            </div>
            {errors.checklist && <FieldError message={errors.checklist} />}
          </div>
        </div>

        {/* RIGHT: Sticky widget */}
        <div className="lg:col-span-4 hidden lg:block">
          <div className="sticky top-6 space-y-4">
            <ContractReceiptWidget
              deposit={deposit}
              formData={formData}
            />
            {/* Checklist (desktop) */}
            <div className={`bg-white rounded-2xl border shadow-sm p-5 ${errors.checklist ? 'border-red-400' : 'border-[#d1c4b9]'}`}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-sm text-[#1e1b17] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#6f583c]" />
                  Checklist xác nhận
                </h4>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleAllChecklist}
                    className="px-2 py-0.5 text-[10px] font-bold text-[#6f583c] bg-[#faf2ec]/60 border border-[#d1c4b9]/30 hover:bg-[#e8e1d3]/40 hover:border-[#d1c4b9]/80 rounded-md transition cursor-pointer active:scale-95 flex items-center"
                  >
                    {allChecklistDone ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                  </button>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${allChecklistDone ? 'bg-[#d8f3dc] text-[#1b5e20]' : 'bg-[#fef3c7] text-[#92400e]'}`}>
                    {checklistChecked.filter(Boolean).length}/{checklistLabels.length}
                  </span>
                </div>
              </div>
              <div className="space-y-2.5">
                {checklistLabels.map((label, i) => (
                  <label key={i} className="flex items-start gap-2.5 cursor-pointer group">
                    <div
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition ${
                        checklistChecked[i] ? 'bg-[#2d6a4f] border-[#2d6a4f]' : 'border-[#d1c4b9] group-hover:border-[#6f583c]'
                      }`}
                      onClick={() => toggleChecklist(i)}
                    >
                      {checklistChecked[i] && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </div>
                    <span className={`text-xs ${checklistChecked[i] ? 'text-[#1e1b17] font-medium' : 'text-[#9d8879]'}`}>
                      {label}
                    </span>
                  </label>
                ))}
              </div>
              {errors.checklist && <FieldError message={errors.checklist} />}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Footer Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-[#d1c4b9] shadow-lg px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#d1c4b9] text-[#4e453c] text-sm font-semibold hover:bg-[#faf2ec] transition cursor-pointer active:scale-[0.98]"
          >
            <ChevronLeft className="w-4 h-4" />
            Hủy bỏ
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveDraft}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#6f583c] text-[#6f583c] text-sm font-semibold hover:bg-[#fff8f3] transition cursor-pointer active:scale-[0.98]"
            >
              <Save className="w-4 h-4" />
              Lưu nháp
            </button>
            <button
              onClick={handleSubmit}
              disabled={!allChecklistDone}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition shadow-md ${
                allChecklistDone
                  ? 'bg-[#6f583c] text-white hover:bg-[#5c4830] hover:shadow-lg active:scale-95 cursor-pointer'
                  : 'bg-[#d1c4b9] text-[#9d8879] cursor-not-allowed'
              }`}
            >
              <FileSignature className="w-4 h-4" />
              Lập hợp đồng
            </button>
          </div>
        </div>
      </div>

      {/* Spacer for footer */}
      <div className="h-20" />
    </div>
  );
}
