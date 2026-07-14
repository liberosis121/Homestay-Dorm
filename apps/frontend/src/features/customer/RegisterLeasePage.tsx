import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CalendarClock, CheckCircle, ChevronLeft, ClipboardList, Home, Info, Send, Sparkles, UserRound, XCircle } from 'lucide-react';
import CustomSelect from '../../components/ui/CustomSelect';
import CustomDatePicker from '../../components/ui/CustomDatePicker';
import { useAuthStore } from '../../stores/authStore';
import { cancelLeaseRegistrationApi, createLeaseRegistrationApi, getMyLeaseRegistrationsApi, type LeaseRegistration } from './lease.api';
import { getBranchesApi } from '../rooms/rooms.api';
import { fetchProfile } from './services/profile.service';

type InterestedRoomState = {
  interestedRoomId?: string;
  interestedRoomName?: string;
  preferredBranchId?: string;
  preferredBranchName?: string;
  preferredRoomType?: string;
  preferredGender?: string;
  preferredBudget?: number;
};

const roomTypeOptions = [
  { value: 'Studio', label: 'Studio' },
  { value: 'Twin', label: 'Twin' },
  { value: 'Dorm', label: 'KTX / Dorm' },
  { value: 'Any', label: 'Tư vấn theo nhu cầu' },
];

const rentalTypeOptions = [
  { value: 'shared', label: 'Ở ghép' },
  { value: 'full_room', label: 'Thuê nguyên phòng' },
  { value: 'flexible', label: 'Linh hoạt' },
];

const genderOptions = [
  { value: 'male', label: 'Nam' },
  { value: 'female', label: 'Nữ' },
  { value: 'other', label: 'Khác' },
];

const budgetOptions = [
  { value: 'under_2m', label: 'Dưới 2 triệu' },
  { value: '2m_5m', label: '2 - 5 triệu' },
  { value: 'over_5m', label: 'Trên 5 triệu' },
  { value: 'flexible', label: 'Linh hoạt theo phòng phù hợp' },
];

const viewingTimeOptions = [
  { value: '08:00-10:00', label: '08:00 - 10:00' },
  { value: '10:00-12:00', label: '10:00 - 12:00' },
  { value: '13:30-15:30', label: '13:30 - 15:30' },
  { value: '15:30-17:30', label: '15:30 - 17:30' },
  { value: 'flexible', label: 'Linh hoạt theo Sale' },
];

const today = new Date().toISOString().split('T')[0];
const inputClass = 'w-full bg-white border border-[#d7ded3] rounded-24 py-3.5 px-5 text-sm font-body-md shadow-[0_1px_0_rgba(74,101,73,0.04)] transition-all focus:outline-none focus:ring-2 focus:border-primary focus:ring-primary/20 text-on-surface hover:border-primary/40 disabled:bg-[#f6f5f1] disabled:text-on-surface-variant/70 disabled:cursor-not-allowed disabled:border-[#e3e2de]';
const selectTriggerClass = 'w-full bg-white border-[#d7ded3] rounded-24 py-3.5 shadow-[0_1px_0_rgba(74,101,73,0.04)] hover:border-primary/40 transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary/20';
const datePickerTriggerClass = 'w-full bg-white border-[#d7ded3] rounded-24 py-3.5 px-5 shadow-[0_1px_0_rgba(74,101,73,0.04)] hover:border-primary/40 transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary/20';

const BLOCKING_REGISTRATION_STATUSES = new Set(['pending_schedule', 'scheduled', 'deposited']);
const REGISTRATION_STATUS_LABELS: Record<string, string> = {
  pending_schedule: 'Chờ Sale xếp lịch',
  scheduled: 'Đã có lịch xem',
  deposited: 'Đã đặt cọc',
};

const findBlockingRegistration = (registrations: LeaseRegistration[]) => {
  return registrations
    .filter((registration) => BLOCKING_REGISTRATION_STATUSES.has(registration.status))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0] || null;
};

export const RegisterLeasePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const interested = (location.state || {}) as InterestedRoomState;

  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [branches, setBranches] = useState<any[]>([]);
  const [isProfileComplete, setIsProfileComplete] = useState<boolean | null>(null);
  const [registrations, setRegistrations] = useState<LeaseRegistration[]>([]);
  const [isCheckingRegistrations, setIsCheckingRegistrations] = useState(false);
  const [isCancellingRegistration, setIsCancellingRegistration] = useState(false);
  const [registrationActionMessage, setRegistrationActionMessage] = useState('');

  const [form, setForm] = useState({
    fullName: user?.full_name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    gender: 'male',
    preferredRoomType: interested.preferredRoomType || 'Any',
    rentalType: 'flexible',
    occupantsCount: '1',
    preferredBranchId: interested.preferredBranchId || 'any',
    budgetRange: interested.preferredBudget
      ? interested.preferredBudget <= 2000000
        ? 'under_2m'
        : interested.preferredBudget <= 5000000
          ? '2m_5m'
          : 'over_5m'
      : 'flexible',
    moveInDate: '',
    leaseTerm: '6',
    preferredViewingDate: '',
    preferredViewingTime: 'flexible',
    viewingTimeNote: '',
    amenities: [] as string[],
    note: '',
  });

  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: location } });
      return;
    }
    if (user.renting_room_name) {
      navigate('/profile');
      return;
    }

    // Kiểm tra tính đầy đủ của hồ sơ
    fetchProfile()
      .then((data) => {
        const phone = data.phone || '';
        const details = data.details || {};
        const cccd = details.cccd || '';
        const dob = details.dob || '';
        const gender = details.gender || '';
        const nationality = details.nationality || '';
        const issueDate = details.cccd_issue_date || '';
        const issuePlace = details.cccd_issue_place || '';
        const address = details.address || '';

        const complete = (
          phone.trim() !== '' &&
          cccd.trim() !== '' &&
          dob.trim() !== '' &&
          gender.trim() !== '' &&
          nationality.trim() !== '' &&
          issueDate.trim() !== '' &&
          issuePlace.trim() !== '' &&
          address.trim() !== ''
        );
        setIsProfileComplete(complete);

        // Load thông tin của người dùng vào form
        const genderVal = details.gender || '';
        let mappedGender = 'male';
        if (genderVal === 'female' || genderVal === 'Nữ') {
          mappedGender = 'female';
        } else if (genderVal === 'other' || genderVal === 'Khác') {
          mappedGender = 'other';
        } else if (genderVal === 'male' || genderVal === 'Nam') {
          mappedGender = 'male';
        }

        setForm(prev => ({
          ...prev,
          fullName: data.full_name || prev.fullName,
          phone: phone || prev.phone,
          email: data.email || prev.email,
          gender: mappedGender,
        }));
      })
      .catch((err) => {
        console.error('Lỗi khi kiểm tra hồ sơ cá nhân:', err);
        setIsProfileComplete(false);
      });

    getBranchesApi()
      .then((data) => setBranches(data))
      .catch((err) => console.error('Lỗi khi tải chi nhánh:', err));
    setIsCheckingRegistrations(true);
    getMyLeaseRegistrationsApi()
      .then((data) => setRegistrations(data))
      .catch((err) => {
        console.error('Lỗi khi tải phiếu đăng ký thuê:', err);
        setErrors(prev => ({
          ...prev,
          submit: 'Không thể kiểm tra phiếu thuê hiện có. Vui lòng thử lại sau.',
        }));
      })
      .finally(() => setIsCheckingRegistrations(false));
  }, [user, navigate, location]);

  const branchOptions = useMemo(() => {
    return [
      ...branches.map((b: any) => ({ value: b.id, label: b.name })),
      { value: 'any', label: 'Chưa quyết định' }
    ];
  }, [branches]);

  const interestedRoomLabel = useMemo(() => {
    if (!interested.interestedRoomName) return null;
    return {
      room: interested.interestedRoomName,
      branch: interested.preferredBranchName || branchOptions.find(b => b.value === interested.preferredBranchId)?.label || 'Chi nhánh đang cập nhật',
      price: interested.preferredBudget ? `${interested.preferredBudget.toLocaleString('vi-VN')}đ/tháng` : 'Giá đang cập nhật',
    };
  }, [interested, branchOptions]);

  const blockingRegistration = useMemo(() => findBlockingRegistration(registrations), [registrations]);
  const canCancelBlockingRegistration = blockingRegistration?.status === 'pending_schedule';

  const handleCancelBlockingRegistration = async () => {
    if (!blockingRegistration || !canCancelBlockingRegistration) return;

    setIsCancellingRegistration(true);
    setRegistrationActionMessage('');
    try {
      const updated = await cancelLeaseRegistrationApi(blockingRegistration.id);
      setRegistrations(prev => prev.map(item => item.id === updated.id ? updated : item));
      setErrors(prev => {
        const { submit, ...rest } = prev;
        return rest;
      });
      setRegistrationActionMessage('Đã hủy phiếu cũ. Bạn có thể gửi phiếu yêu cầu thuê mới.');
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Không thể hủy phiếu cũ. Vui lòng thử lại hoặc liên hệ Sale.';
      setErrors(prev => ({ ...prev, submit: msg }));
    } finally {
      setIsCancellingRegistration(false);
    }
  };

  const setField = (key: keyof typeof form, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: '' }));
  };

  const toggleAmenity = (value: string) => {
    setForm(prev => ({
      ...prev,
      amenities: prev.amenities.includes(value)
        ? prev.amenities.filter(item => item !== value)
        : [...prev.amenities, value],
    }));
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.fullName.trim()) next.fullName = 'Vui lòng nhập họ tên';
    if (!form.phone.trim() || form.phone.trim().length < 10) next.phone = 'Số điện thoại không hợp lệ';
    if (!form.email.trim()) next.email = 'Vui lòng nhập email';
    if (!form.moveInDate) next.moveInDate = 'Vui lòng chọn ngày dự kiến vào ở';
    if (!form.preferredViewingDate) next.preferredViewingDate = 'Vui lòng chọn ngày bạn có thể xem phòng';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !validate()) return;

    if (blockingRegistration) {
      setErrors({
        submit: canCancelBlockingRegistration
          ? 'Bạn cần hủy phiếu cũ hoặc đặt lại lịch với Sale trước khi tạo phiếu mới.'
          : 'Bạn đang có phiếu thuê đang xử lý. Vui lòng kiểm tra lịch xem phòng hoặc liên hệ Sale để được hỗ trợ.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Map khoảng giá (categorical) -> ngân sách tối đa dạng số (cột preferred_price là numeric)
      const budgetToPrice: Record<string, number> = {
        under_2m: 2000000,
        '2m_5m': 5000000,
        over_5m: 8000000,
        flexible: 0, // 0 = linh hoạt / chưa xác định
      };
      // Gửi TÊN khu vực (không phải branch ID) để Sale đọc được
      const areaLabel = branchOptions.find(b => b.value === form.preferredBranchId)?.label || 'Chưa quyết định';
      const viewingTimeLabel = viewingTimeOptions.find(t => t.value === form.preferredViewingTime)?.label || form.preferredViewingTime;

      // Map form fields sang format backend yêu cầu
      await createLeaseRegistrationApi({
        occupants_count: parseInt(form.occupantsCount, 10),
        preferred_area: areaLabel,
        preferred_room_type: form.preferredRoomType.toLowerCase(), // 'dorm' | 'twin' | 'studio' | 'any'
        preferred_price: budgetToPrice[form.budgetRange] ?? 0,
        viewing_preference: `${form.preferredViewingDate} (${viewingTimeLabel})`,
        expected_move_in_date: form.moveInDate,
        rental_duration: `${form.leaseTerm} tháng`,
        other_criteria: [
          interested.interestedRoomName ? `Phòng quan tâm: ${interested.interestedRoomName}` : '',
          form.note,
          form.amenities.join(', '),
          form.viewingTimeNote,
        ].filter(Boolean).join(' | ') || undefined,
      });
      setSubmitted(true);
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Có lỗi xảy ra khi gửi đơn. Vui lòng thử lại.';
      setErrors({ submit: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isProfileComplete === null) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span>
          <p className="font-body-md text-sm text-on-surface-variant">Đang kiểm tra hồ sơ cá nhân...</p>
        </div>
      </div>
    );
  }

  if (isProfileComplete === false) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6 bg-surface theme-customer">
        <div className="w-full max-w-lg bg-white dark:bg-surface-container-highest/80 border border-glass-stroke shadow-2xl rounded-[32px] p-8 md:p-10 text-center flex flex-col items-center gap-6 moss-shadow">
          <div className="w-20 h-20 bg-amber-50 dark:bg-amber-950/30 rounded-full flex items-center justify-center text-amber-500 shadow-lg shadow-amber-500/10">
            <span className="material-symbols-outlined text-4xl">warning</span>
          </div>
          <div className="space-y-3">
            <h2 className="font-headline-lg text-2xl font-bold text-on-surface">Cập nhật hồ sơ cá nhân</h2>
            <p className="font-body-md text-on-surface-variant leading-relaxed text-sm text-justify">
              Bạn cần điền đầy đủ các thông tin cá nhân bắt buộc bao gồm: <strong>Số điện thoại, Số CCCD/Passport, Ngày sinh, Giới tính, Quốc tịch, Ngày cấp và Nơi cấp CCCD, Địa chỉ thường trú</strong> trong hồ sơ cá nhân của mình trước khi thực hiện chức năng đăng ký thuê phòng.
            </p>
          </div>
          <button
            onClick={() => navigate('/profile')}
            className="w-full h-14 bg-primary text-on-primary rounded-2xl font-label-md flex items-center justify-center gap-2 hover:bg-primary-container hover:text-on-primary-container transition-all shadow-lg shadow-primary/10 mt-2 cursor-pointer group"
          >
            Cập nhật hồ sơ cá nhân
            <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-3xl mx-auto px-margin-mobile md:px-margin-desktop py-8">
        <div className="bg-surface-container-lowest rounded-32 border border-surface-variant shadow-sm p-8 md:p-10 text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary mb-3">Đã gửi phiếu đăng ký thuê</h1>
          <p className="text-on-surface-variant max-w-xl mx-auto leading-relaxed">
            Nhân viên Sale sẽ xem nhu cầu, kiểm tra phòng/giường phù hợp và dựa trên thời gian rảnh của bạn để sắp xếp lịch xem phòng.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 mt-8">
            <button onClick={() => navigate('/customer/viewing-schedules')} className="px-6 py-3 bg-primary text-on-primary rounded-full font-label-md text-sm shadow-md hover:opacity-90 transition-all">
              Xem lịch xem phòng của tôi
            </button>
            <button onClick={() => navigate('/profile')} className="px-6 py-3 border border-outline-variant text-on-surface-variant rounded-full font-label-md text-sm hover:bg-surface-container-low transition-all">
              Về hồ sơ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1180px] mx-auto px-margin-mobile md:px-margin-desktop py-7 theme-customer">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-primary hover:text-[#3d4e3a] bg-primary/5 hover:bg-primary/15 font-label-md text-sm mb-6 cursor-pointer transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        <ChevronLeft className="w-4 h-4" />
        Quay lại
      </button>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
        <section className="bg-surface-container-lowest rounded-32 border border-surface-variant shadow-sm p-6 md:p-7">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5 mb-7">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-[#4a6549] rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                <ClipboardList className="w-4 h-4" />
                Phiếu nhu cầu thuê
              </div>
              <h1 className="text-3xl font-bold text-[#3d4e3a] mb-3">Đăng ký thuê phòng</h1>
              <p className="text-on-surface-variant text-sm leading-7">
                Bạn gửi nhu cầu thuê và thời gian có thể đến xem phòng. Nhân viên Sale sẽ kiểm tra điều kiện, tìm phòng/giường phù hợp rồi lập lịch xem phòng cho bạn.
              </p>
            </div>
          </div>

          {interestedRoomLabel && (
            <div className="mb-6 p-4 bg-[#f6f5f1] border border-[#dcdad4] rounded-24 flex flex-col md:flex-row md:items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-surface-container-lowest text-[#4a6549] flex items-center justify-center shrink-0 border border-[#dcdad4]">
                <Home className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-[#4a6549] uppercase tracking-wider mb-1">Phòng bạn đang quan tâm</p>
                <h2 className="text-lg font-bold text-on-surface">{interestedRoomLabel.room}</h2>
                <p className="text-sm text-on-surface-variant mt-1">{interestedRoomLabel.branch}</p>
                <span className="mt-2 -ml-0.5 inline-flex w-fit items-center rounded-full border border-[#d7ded3] bg-[#eef3ea] px-3 py-1 text-xs font-bold text-[#4a6549]">
                  {interestedRoomLabel.price}
                </span>
              </div>
              <p className="md:max-w-xs text-sm text-on-surface-variant leading-6">
                Phòng này sẽ được ghi nhận như một ưu tiên. Sale vẫn kiểm tra tình trạng thực tế trước khi sắp lịch xem phòng.
              </p>
            </div>
          )}

          {registrationActionMessage && (
            <div className="mb-6 flex items-start gap-3 rounded-24 border border-primary/25 bg-primary/10 px-5 py-4 text-sm text-primary">
              <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span className="leading-6">{registrationActionMessage}</span>
            </div>
          )}

          {blockingRegistration && (
            <div className="mb-6 rounded-24 border border-amber-200 bg-amber-50 px-5 py-5 text-sm text-[#5f4a1f]">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 shrink-0 mt-0.5 text-amber-700" />
                  <div>
                    <p className="font-bold text-[#4c3b18]">Bạn đang có phiếu yêu cầu thuê đang xử lý</p>
                    <p className="mt-1 leading-6">
                      Phiếu {blockingRegistration.id} đang ở trạng thái{' '}
                      <span className="font-semibold">{REGISTRATION_STATUS_LABELS[blockingRegistration.status] || blockingRegistration.status}</span>.
                      Nếu bạn vẫn còn nhu cầu với phiếu cũ, Sale có thể xếp lại lịch trên phiếu này.
                      Nếu muốn gửi thông tin mới, hãy hủy phiếu cũ trước.
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col gap-2 sm:flex-row md:flex-col">
                  <button
                    type="button"
                    onClick={() => navigate('/customer/viewing-schedules')}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-[#d7ded3] bg-white px-4 py-2.5 text-sm font-semibold text-[#4a6549] shadow-sm transition hover:bg-primary/5 cursor-pointer"
                  >
                    <CalendarClock className="w-4 h-4" />
                    Đặt lại lịch với Sale
                  </button>
                  {canCancelBlockingRegistration && (
                    <button
                      type="button"
                      onClick={handleCancelBlockingRegistration}
                      disabled={isCancellingRegistration}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-error px-4 py-2.5 text-sm font-semibold text-on-error shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                      {isCancellingRegistration ? 'Đang hủy phiếu...' : 'Hủy phiếu cũ để tạo phiếu mới'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <FormSection icon={<UserRound className="w-5 h-5" />} title="Thông tin liên hệ">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Họ và tên" error={errors.fullName}>
                  <input value={form.fullName} onChange={e => setField('fullName', e.target.value)} className={inputClass} placeholder="Nguyễn Văn A" disabled />
                </Field>
                <Field label="Số điện thoại" error={errors.phone}>
                  <input value={form.phone} onChange={e => setField('phone', e.target.value)} className={inputClass} placeholder="0901234567" disabled />
                </Field>
                <Field label="Email" error={errors.email}>
                  <input value={form.email} onChange={e => setField('email', e.target.value)} className={inputClass} placeholder="email@example.com" disabled />
                </Field>
                <Field label="Giới tính">
                  <CustomSelect value={form.gender} onChange={val => setField('gender', val)} options={genderOptions} triggerClassName={selectTriggerClass} disabled pill hideArrow />
                </Field>
              </div>
            </FormSection>

            <FormSection icon={<Home className="w-5 h-5" />} title="Nhu cầu thuê">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Loại phòng mong muốn">
                  <CustomSelect value={form.preferredRoomType} onChange={val => setField('preferredRoomType', val)} options={roomTypeOptions} triggerClassName={selectTriggerClass} />
                </Field>
                <Field label="Hình thức thuê">
                  <CustomSelect value={form.rentalType} onChange={val => setField('rentalType', val)} options={rentalTypeOptions} triggerClassName={selectTriggerClass} />
                </Field>
                <Field label="Số người ở">
                  <input type="number" min="1" max="8" value={form.occupantsCount} onChange={e => setField('occupantsCount', e.target.value)} className={inputClass} />
                </Field>
                <Field label="Chi nhánh/khu vực mong muốn">
                  <CustomSelect value={form.preferredBranchId} onChange={val => setField('preferredBranchId', val)} options={branchOptions} triggerClassName={selectTriggerClass} />
                </Field>
                <Field label="Khoảng giá">
                  <CustomSelect value={form.budgetRange} onChange={val => setField('budgetRange', val)} options={budgetOptions} triggerClassName={selectTriggerClass} />
                </Field>
                <Field label="Ngày dự kiến vào ở" error={errors.moveInDate}>
                  <CustomDatePicker
                    value={form.moveInDate}
                    onChange={val => setField('moveInDate', val)}
                    min={today}
                    error={!!errors.moveInDate}
                    placeholder="Chọn ngày vào ở"
                    variant="surface"
                    triggerClassName={datePickerTriggerClass}
                  />
                </Field>
                <Field label="Thời hạn thuê">
                  <CustomSelect
                    value={form.leaseTerm}
                    onChange={val => setField('leaseTerm', val)}
                    options={[
                      { value: '6', label: '6 tháng' },
                      { value: '12', label: '12 tháng' },
                      { value: '24', label: '24 tháng' },
                    ]}
                    triggerClassName={selectTriggerClass}
                  />
                </Field>
              </div>
            </FormSection>

            <FormSection icon={<CalendarClock className="w-5 h-5" />} title="Thời gian xem phòng mong muốn">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Ngày có thể đến xem" error={errors.preferredViewingDate}>
                  <CustomDatePicker
                    value={form.preferredViewingDate}
                    onChange={val => setField('preferredViewingDate', val)}
                    min={today}
                    error={!!errors.preferredViewingDate}
                    placeholder="Chọn ngày xem"
                    variant="surface"
                    triggerClassName={datePickerTriggerClass}
                  />
                </Field>
                <Field label="Khung giờ rảnh">
                  <CustomSelect value={form.preferredViewingTime} onChange={val => setField('preferredViewingTime', val)} options={viewingTimeOptions} triggerClassName={selectTriggerClass} />
                </Field>
                <div className="md:col-span-2">
                  <Field label="Ghi chú thời gian">
                    <input value={form.viewingTimeNote} onChange={e => setField('viewingTimeNote', e.target.value)} className={inputClass} placeholder="Ví dụ: chỉ rảnh sau 16:00 hoặc cuối tuần" />
                  </Field>
                </div>
              </div>
            </FormSection>

            <FormSection icon={<Sparkles className="w-5 h-5" />} title="Tiện ích và ghi chú">
              <div className="space-y-5">
                <div>
                  <p className="block text-sm font-label-md text-on-surface-variant ml-2 mb-2">Tiện ích mong muốn</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      ['AC', 'Máy lạnh'],
                      ['Wifi', 'Wifi mạnh'],
                      ['Private WC', 'WC riêng'],
                      ['Kitchen', 'Bếp chung'],
                      ['Washing Machine', 'Máy giặt'],
                    ].map(([value, label]) => {
                      const active = form.amenities.includes(value);
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => toggleAmenity(value)}
                          className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold shadow-[0_1.5px_3px_rgba(74,101,73,0.06)] transition-all duration-200 hover:-translate-y-[1px] active:translate-y-[1px] active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/20 ${active
                              ? 'bg-primary text-on-primary border-primary hover:bg-[#3d4e3a] active:bg-[#303f2e] hover:shadow-md'
                              : 'bg-white text-on-surface-variant border-[#d7ded3] hover:border-primary/50 hover:bg-primary/5 hover:text-primary active:bg-primary/10 hover:shadow-md'
                            }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <Field label="Ghi chú thêm">
                  <textarea value={form.note} onChange={e => setField('note', e.target.value)} className={`${inputClass} min-h-[120px] resize-none`} placeholder="Ví dụ: muốn ở gần trường, cần chỗ để xe, ưu tiên phòng yên tĩnh..." />
                </Field>
              </div>
            </FormSection>

            {errors.submit && (
              <div className="flex items-start gap-3 rounded-24 border border-error/40 bg-error/10 px-5 py-4 text-sm text-error">
                <Info className="w-5 h-5 shrink-0 mt-0.5" />
                <span className="leading-6">{errors.submit}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-surface-variant">
              <p className="text-xs text-on-surface-variant leading-relaxed max-w-xl">
                Phiếu này sẽ được gửi đến nhân viên Sale để kiểm tra phòng/giường phù hợp trước khi lập lịch xem phòng.
              </p>
              <button type="submit" disabled={isSubmitting || isCheckingRegistrations || !!blockingRegistration} className="inline-flex w-auto shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full bg-timber-accent px-7 py-2.5 text-sm font-label-md text-white shadow-sm transition-all hover:opacity-95 hover:-translate-y-[1px] hover:shadow-md active:translate-y-[1px] active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100">
                {isCheckingRegistrations
                  ? 'Đang kiểm tra phiếu cũ...'
                  : blockingRegistration
                    ? 'Cần xử lý phiếu cũ trước'
                    : isSubmitting
                      ? 'Đang gửi...'
                      : 'Gửi phiếu đăng ký'}
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </section>

        <aside className="sticky top-24">
          <div className="bg-[#f6f5f1] border border-[#dcdad4] rounded-32 p-6 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#4a6549] text-on-primary flex items-center justify-center shadow-sm">
              <Info className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-[#3d4e3a] text-lg">Quy trình sau khi gửi phiếu</h3>
              <p className="text-sm text-on-surface-variant mt-3 leading-7 text-justify">
                Sale sẽ kiểm tra nhu cầu, tìm phòng/giường phù hợp, đối chiếu thời gian rảnh của bạn rồi lập lịch xem phòng. Bạn chỉ gửi yêu cầu đặt cọc sau khi đã xem phòng và quyết định thuê.
              </p>
            </div>
            <div className="space-y-3 text-sm pt-1">
              {['Gửi phiếu nhu cầu thuê', 'Sale sắp xếp phòng và lịch xem', 'Khách xem phòng thực tế', 'Gửi yêu cầu đặt cọc nếu ưng ý'].map((item, index) => (
                <div key={item} className="flex items-center gap-3 text-on-surface-variant">
                  <span className="w-7 h-7 rounded-full bg-surface-container-lowest border border-[#dcdad4] text-[#4a6549] flex items-center justify-center text-xs font-bold shrink-0">{index + 1}</span>
                  <span className="leading-6">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

function FormSection({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="bg-surface-container-low border border-outline-variant/40 rounded-24 p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
          {icon}
        </div>
        <h2 className="font-bold text-on-surface text-base">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className="ml-2 block min-h-[20px] max-w-full text-sm font-label-md leading-normal text-on-surface-variant">
        {label}
      </span>
      <div className="min-w-0">
        {children}
      </div>
      {error && <span className="block text-xs text-error ml-2">{error}</span>}
    </label>
  );
}
