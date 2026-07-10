import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useGroupRegistrationStore } from './store/useGroupRegistrationStore';
import { CheckCircle, ChevronLeft, ChevronRight, Info, Plus, Trash2, Users } from 'lucide-react';
import CustomSelect from '../../components/ui/CustomSelect';
import CustomDatePicker from '../../components/ui/CustomDatePicker';
import { getRoomDetailApi } from '../rooms/rooms.api';
import { createLeaseRegistrationApi } from './lease.api';

const memberSchema = z.object({
  fullName: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự'),
  phone: z.string().min(10, 'Số điện thoại không hợp lệ'),
  cccd: z.string().min(12, 'CCCD phải có 12 số').max(12, 'CCCD phải có 12 số'),
  issueDate: z.string().min(1, 'Vui lòng chọn ngày cấp'),
  issuePlace: z.string().min(1, 'Vui lòng nhập nơi cấp'),
  dob: z.string().min(1, 'Vui lòng chọn ngày sinh'),
  gender: z.enum(['male', 'female', 'other']),
  nationality: z.string().min(1, 'Vui lòng nhập quốc tịch'),
  permanentAddress: z.string().min(1, 'Vui lòng nhập địa chỉ thường trú'),
});

const groupSchema = z.object({
  members: z.array(memberSchema).min(1, 'Phải có ít nhất 1 thành viên'),
});

const rentalInfoSchema = z.object({
  leaseTerm: z.string().min(1, 'Vui lòng chọn thời hạn thuê'),
  moveInDate: z.string().min(1, 'Vui lòng chọn ngày chuyển vào'),
});

export const GroupRegistrationPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  
  const { draftData, setDraftData, currentStep, setCurrentStep, clearDraft } = useGroupRegistrationStore();
  
  const [roomName, setRoomName] = useState<string>('');
  const [capacity, setCapacity] = useState<number>(0);
  const [availableBeds, setAvailableBeds] = useState<number>(0);
  const [selectedBeds, setSelectedBeds] = useState<string[]>([]);
  const [genderType, setGenderType] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roomDetail, setRoomDetail] = useState<any>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth/login', { state: { from: location } });
      return;
    }
    if (user.renting_room_name) {
      alert(`Bạn hiện đang thuê ${user.renting_room_name}. Vui lòng trả phòng theo hợp đồng trước khi thuê phòng mới.`);
      navigate('/rooms');
      return;
    }

    const state = location.state as { roomId?: string, roomName?: string, capacity?: number, availableBeds?: number, selectedBedsNames?: string[], genderType?: string };
    if (state?.roomId) {
      setRoomName(state.roomName || 'Phòng không xác định');
      setCapacity(state.capacity || 4);
      setAvailableBeds(state.availableBeds || 4);
      setSelectedBeds(state.selectedBedsNames || []);
      setGenderType(state.genderType || '');

      // Load room details
      getRoomDetailApi(state.roomId)
        .then((detail) => setRoomDetail(detail))
        .catch((err) => console.error('Lỗi khi tải chi tiết phòng:', err));
    } else {
      navigate('/rooms');
    }
  }, [user, navigate, location]);

  type GroupSchemaType = z.infer<typeof groupSchema>;
  const { register: registerGroup, setValue: setGroupValue, watch: watchGroup, control, handleSubmit: handleGroup, formState: { errors: errorsGroup } } = useForm<GroupSchemaType>({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      members: (draftData.members && draftData.members.length > 0) ? draftData.members as any : [
        { 
          fullName: user?.full_name || '', 
          phone: user?.phone || '', 
          cccd: '',
          issueDate: '',
          issuePlace: '',
          dob: '',
          gender: 'male',
          nationality: 'Việt Nam',
          permanentAddress: ''
        }
      ]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'members'
  });

  type RentalInfoType = z.infer<typeof rentalInfoSchema>;
  const { setValue: setRentalValue, watch: watchRental, handleSubmit: handleRental, formState: { errors: errorsRental } } = useForm<RentalInfoType>({
    resolver: zodResolver(rentalInfoSchema),
    defaultValues: {
      leaseTerm: draftData.leaseTerm || '6',
      moveInDate: draftData.moveInDate || '',
    }
  });

  const checkDuplicateCccd = (members: any[]) => {
    const cccds = members.map(m => m.cccd);
    return new Set(cccds).size === cccds.length;
  };

  const handleNextGroup = (data: any) => {
    if (data.members.length > availableBeds) {
      alert(`Số lượng thành viên (${data.members.length}) vượt quá số giường trống (${availableBeds}) của phòng.`);
      return;
    }
    
    // The representative is always the first person in the array
    const membersWithRep = data.members.map((m: any, index: number) => ({
      ...m,
      id: m.id || `m-${Date.now()}-${index}`,
      isRepresentative: index === 0
    }));

    if (!checkDuplicateCccd(membersWithRep)) {
      alert('Phát hiện CCCD trùng lặp giữa các thành viên. Vui lòng kiểm tra lại.');
      return;
    }

    if (genderType && genderType !== 'unisex') {
      const invalidGenderMember = membersWithRep.find((m: any) => m.gender !== genderType);
      if (invalidGenderMember) {
        alert(`Phòng này dành cho ${genderType === 'female' ? 'Nữ' : 'Nam'}. Giới tính của thành viên "${invalidGenderMember.fullName}" không phù hợp.`);
        return;
      }
    }

    setDraftData({ members: membersWithRep });
    setCurrentStep(2);
  };

  const handleNextRental = (data: any) => {
    setDraftData(data);
    setCurrentStep(3);
  };

  const handleSubmitFinal = async () => {
    if (!roomDetail || !user) return;
    setIsSubmitting(true);
    try {
      const preferredArea = roomDetail.branches?.name || 'Chi nhánh mặc định';
      const preferredRoomType = roomDetail.room_type || 'Dorm';
      const preferredPrice = `${(roomDetail.price || 0).toLocaleString('vi-VN')} VNĐ/tháng`;
      
      await createLeaseRegistrationApi({
        occupants_count: draftData.members.length,
        preferred_area: preferredArea,
        preferred_room_type: preferredRoomType,
        preferred_price: preferredPrice,
        viewing_preference: 'Chưa quyết định',
        expected_move_in_date: draftData.moveInDate || '',
        rental_duration: `${draftData.leaseTerm || '6'} tháng`,
        other_criteria: JSON.stringify({
          isGroup: true,
          roomId: roomDetail.id,
          roomName: roomDetail.name,
          beds: selectedBeds,
          members: draftData.members
        })
      });

      setCurrentStep(4);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || err.message || 'Lỗi khi gửi đơn đăng ký thuê nhóm');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinish = () => {
    clearDraft();
    navigate('/profile');
  };

  const steps = [
    { num: 1, title: 'Thành viên nhóm' },
    { num: 2, title: 'Thuê phòng' },
    { num: 3, title: 'Xác nhận' }
  ];

  return (
    <div className="min-h-screen bg-[#F9F8F4] pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Đăng ký thuê phòng (Nhóm)</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <p className="text-gray-600">Phòng đã chọn: <span className="font-semibold text-[#8BA888]">{roomName}</span></p>
            <span className="px-2.5 py-1 bg-[#8BA888]/10 text-[#8BA888] rounded-full font-medium">Trống: {availableBeds}/{capacity} giường</span>
            {selectedBeds.length > 0 && (
              <span className="px-2.5 py-1 bg-[#8BA888]/10 text-[#8BA888] rounded-full font-medium">Giường: {selectedBeds.join(', ')}</span>
            )}
          </div>
        </div>

        {/* Stepper */}
        {currentStep < 4 && (
          <div className="mb-10">
            <div className="flex items-center justify-between px-10">
              {steps.map((s, idx) => (
                <div key={s.num} className="flex flex-col items-center relative z-10">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-colors ${
                    currentStep >= s.num ? 'bg-[#8BA888] text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {currentStep > s.num ? <CheckCircle size={20} /> : s.num}
                  </div>
                  <span className={`text-xs mt-2 font-medium ${currentStep >= s.num ? 'text-gray-900' : 'text-gray-400'}`}>
                    {s.title}
                  </span>
                  {idx < steps.length - 1 && (
                    <div className={`absolute top-5 left-[3rem] w-[calc(100vw_-_300px)] max-w-[200px] sm:max-w-[300px] h-[2px] -z-10 ${
                      currentStep > s.num ? 'bg-[#8BA888]' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-6 sm:p-8">
          
          {/* Step 1 */}
          {currentStep === 1 && (
            <form onSubmit={handleGroup(handleNextGroup)}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Thông tin các thành viên</h2>
                <div className="text-sm font-medium bg-[#F9F8F4] px-3 py-1.5 rounded-lg border border-gray-200">
                  Số lượng: <span className="text-[#8BA888]">{fields.length}</span> / {availableBeds}
                </div>
              </div>
              
              <div className="bg-blue-50 text-blue-800 p-4 rounded-[12px] mb-6 flex items-start">
                <Info size={20} className="text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <p className="text-sm">Thành viên đầu tiên trong danh sách sẽ là <strong>người đại diện nhóm</strong> để ký hợp đồng và nhận hóa đơn thanh toán hàng tháng.</p>
              </div>

              <div className="space-y-6 mb-6">
                {fields.map((field, index) => (
                  <div key={field.id} className={`p-5 rounded-[16px] border ${index === 0 ? 'border-[#8BA888] bg-[#8BA888]/5 relative' : 'border-gray-200'}`}>
                    {index === 0 && (
                      <div className="absolute top-0 right-0 bg-[#8BA888] text-white text-xs font-bold px-3 py-1 rounded-bl-[16px] rounded-tr-[16px]">
                        Người đại diện
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-medium text-gray-900 flex items-center gap-2">
                        <Users size={18} className="text-gray-400" /> Thành viên {index + 1}
                      </h3>
                      {index > 0 && (
                        <button type="button" onClick={() => remove(index)} className="text-red-500 hover:text-red-700 p-1">
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
                        <input {...registerGroup(`members.${index}.fullName` as const)} className="w-full px-4 py-2.5 rounded-[12px] border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#8BA888]/50 focus:border-[#8BA888] text-sm" placeholder="Nguyễn Văn A" />
                        {errorsGroup.members?.[index]?.fullName && <p className="text-red-500 text-xs mt-1">{errorsGroup.members[index]?.fullName?.message}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                        <input {...registerGroup(`members.${index}.phone` as const)} className="w-full px-4 py-2.5 rounded-[12px] border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#8BA888]/50 focus:border-[#8BA888] text-sm" placeholder="090..." />
                        {errorsGroup.members?.[index]?.phone && <p className="text-red-500 text-xs mt-1">{errorsGroup.members[index]?.phone?.message}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Số CCCD</label>
                        <input {...registerGroup(`members.${index}.cccd` as const)} className="w-full px-4 py-2.5 rounded-[12px] border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#8BA888]/50 focus:border-[#8BA888] text-sm" placeholder="012345678901" />
                        {errorsGroup.members?.[index]?.cccd && <p className="text-red-500 text-xs mt-1">{errorsGroup.members[index]?.cccd?.message}</p>}
                      </div>
                      <div>
                        <CustomDatePicker
                          label="Ngày sinh"
                          value={watchGroup(`members.${index}.dob` as const) || ''}
                          onChange={(val) => setGroupValue(`members.${index}.dob` as const, val, { shouldValidate: true })}
                          placeholder="Chọn ngày sinh"
                          error={errorsGroup.members?.[index]?.dob?.message}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Giới tính</label>
                        <CustomSelect
                          value={watchGroup(`members.${index}.gender` as const)}
                          onChange={(val) => setGroupValue(`members.${index}.gender` as const, val as any)}
                          options={[
                            { value: 'male', label: 'Nam' },
                            { value: 'female', label: 'Nữ' },
                            { value: 'other', label: 'Khác' }
                          ]}
                          triggerClassName="w-full border-gray-200 focus:ring-2 focus:ring-[#8BA888]/50 focus:border-[#8BA888] py-2.5 text-sm font-normal text-gray-900"
                        />
                        {errorsGroup.members?.[index]?.gender && <p className="text-red-500 text-xs mt-1">{errorsGroup.members[index]?.gender?.message}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Quốc tịch</label>
                        <input {...registerGroup(`members.${index}.nationality` as const)} className="w-full px-4 py-2.5 rounded-[12px] border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#8BA888]/50 focus:border-[#8BA888] text-sm" placeholder="Việt Nam" />
                        {errorsGroup.members?.[index]?.nationality && <p className="text-red-500 text-xs mt-1">{errorsGroup.members[index]?.nationality?.message}</p>}
                      </div>
                      <div>
                        <CustomDatePicker
                          label="Ngày cấp CCCD"
                          value={watchGroup(`members.${index}.issueDate` as const) || ''}
                          onChange={(val) => setGroupValue(`members.${index}.issueDate` as const, val, { shouldValidate: true })}
                          placeholder="Chọn ngày cấp"
                          error={errorsGroup.members?.[index]?.issueDate?.message}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nơi cấp CCCD</label>
                        <input {...registerGroup(`members.${index}.issuePlace` as const)} className="w-full px-4 py-2.5 rounded-[12px] border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#8BA888]/50 focus:border-[#8BA888] text-sm" placeholder="Cục CSQLHC về TTXH" />
                        {errorsGroup.members?.[index]?.issuePlace && <p className="text-red-500 text-xs mt-1">{errorsGroup.members[index]?.issuePlace?.message}</p>}
                      </div>
                      <div className="lg:col-span-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ thường trú</label>
                        <input {...registerGroup(`members.${index}.permanentAddress` as const)} className="w-full px-4 py-2.5 rounded-[12px] border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#8BA888]/50 focus:border-[#8BA888] text-sm" placeholder="123 Đường A..." />
                        {errorsGroup.members?.[index]?.permanentAddress && <p className="text-red-500 text-xs mt-1">{errorsGroup.members[index]?.permanentAddress?.message}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {fields.length < availableBeds && (
                <button 
                  type="button" 
                  onClick={() => append({ 
                    fullName: '', 
                    phone: '', 
                    cccd: '',
                    issueDate: '',
                    issuePlace: '',
                    dob: '',
                    gender: 'male',
                    nationality: 'Việt Nam',
                    permanentAddress: ''
                  })}
                  className="w-full py-4 border-2 border-dashed border-gray-300 rounded-[16px] text-gray-600 font-medium hover:border-[#8BA888] hover:text-[#8BA888] hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={20} /> Thêm thành viên
                </button>
              )}

              <div className="mt-8 flex justify-end">
                <button type="submit" className="bg-[#8BA888] text-white px-6 py-3 rounded-[12px] font-medium hover:bg-[#7a9677] transition-colors flex items-center">
                  Tiếp tục <ChevronRight size={18} className="ml-1" />
                </button>
              </div>
            </form>
          )}

          {/* Step 2 */}
          {currentStep === 2 && (
            <form onSubmit={handleRental(handleNextRental)}>
              <h2 className="text-xl font-semibold mb-6">Thông tin thuê phòng chung</h2>
              
              <div className="bg-[#F9F8F4] p-4 rounded-[12px] mb-6 flex items-start">
                <Info size={20} className="text-[#8BA888] mt-0.5 mr-3 flex-shrink-0" />
                <p className="text-sm text-gray-700">Giá phòng được tính trên tổng số giường mà nhóm đã đăng ký. Hợp đồng sẽ được đứng tên bởi người đại diện.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thời hạn thuê (chung cho cả nhóm)</label>
                  <CustomSelect
                    value={watchRental('leaseTerm')}
                    onChange={(val) => setRentalValue('leaseTerm', val)}
                    options={[
                      { value: '6', label: '6 Tháng' },
                      { value: '12', label: '1 Năm' },
                      { value: '24', label: '2 Năm' }
                    ]}
                    triggerClassName="w-full border-gray-200 focus:ring-2 focus:ring-[#8BA888]/50 focus:border-[#8BA888] py-3 text-base font-normal text-gray-900"
                  />
                  {errorsRental.leaseTerm && <p className="text-red-500 text-sm mt-1">{errorsRental.leaseTerm.message as string}</p>}
                </div>

                <div>
                  <CustomDatePicker
                    label="Ngày dự kiến chuyển vào (chung)"
                    value={watchRental('moveInDate') || ''}
                    onChange={(val) => setRentalValue('moveInDate', val, { shouldValidate: true })}
                    placeholder="Chọn ngày vào ở"
                    error={errorsRental.moveInDate?.message as string}
                    required
                    min={(() => {
                      const d = new Date();
                      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                    })()}
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-between">
                <button type="button" onClick={() => setCurrentStep(1)} className="border border-gray-200 text-gray-600 px-6 py-3 rounded-[12px] font-medium hover:bg-gray-50 transition-colors flex items-center">
                  <ChevronLeft size={18} className="mr-1" /> Quay lại
                </button>
                <button type="submit" className="bg-[#8BA888] text-white px-6 py-3 rounded-[12px] font-medium hover:bg-[#7a9677] transition-colors flex items-center">
                  Tiếp tục <ChevronRight size={18} className="ml-1" />
                </button>
              </div>
            </form>
          )}

          {/* Step 3 */}
          {currentStep === 3 && (
            <div>
              <h2 className="text-xl font-semibold mb-6">Xác nhận thông tin nhóm</h2>
              
              <div className="space-y-6">
                <div className="bg-gray-50 p-6 rounded-[16px]">
                  <h3 className="font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">Danh sách thành viên ({draftData.members.length})</h3>
                  <div className="space-y-4">
                    {draftData.members.map((m, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-white border border-gray-100 rounded-[12px] text-sm">
                        <div className="flex items-center gap-3 w-full sm:w-1/3">
                          <div className="font-medium text-gray-900 truncate" title={m.fullName}>
                            {m.fullName}
                          </div>
                          {m.isRepresentative && (
                            <span className="px-2 py-0.5 bg-[#8BA888] text-white text-[10px] rounded uppercase font-bold whitespace-nowrap shrink-0">
                              Đại diện
                            </span>
                          )}
                        </div>
                        <div className="text-gray-500 w-full sm:w-1/3">SĐT: <span className="text-gray-900">{m.phone}</span></div>
                        <div className="text-gray-500 w-full sm:w-1/3">CCCD: <span className="text-gray-900">{m.cccd}</span></div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-[16px]">
                  <h3 className="font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">Thông tin thuê phòng chung</h3>
                  <div className="grid grid-cols-2 gap-y-3 text-sm">
                    <div className="text-gray-500">Phòng:</div>
                    <div className="font-medium text-[#8BA888]">{roomName}</div>
                    <div className="text-gray-500">Thời hạn:</div>
                    <div className="font-medium">{draftData.leaseTerm} Tháng</div>
                    <div className="text-gray-500">Ngày chuyển vào:</div>
                    <div className="font-medium">{draftData.moveInDate}</div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-between">
                <button type="button" onClick={() => setCurrentStep(2)} className="border border-gray-200 text-gray-600 px-6 py-3 rounded-[12px] font-medium hover:bg-gray-50 transition-colors flex items-center" disabled={isSubmitting}>
                  <ChevronLeft size={18} className="mr-1" /> Quay lại
                </button>
                <button type="button" onClick={handleSubmitFinal} className="bg-[#8BA888] text-white px-8 py-3 rounded-[12px] font-medium hover:bg-[#7a9677] transition-colors flex items-center disabled:opacity-70" disabled={isSubmitting}>
                  {isSubmitting ? 'Đang xử lý...' : 'Xác nhận Đăng ký Nhóm'}
                </button>
              </div>
            </div>
          )}

          {/* Step 4 */}
          {currentStep === 4 && (
            <div className="text-center py-10 px-4">
              <div className="w-20 h-20 bg-[#8BA888]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={40} className="text-[#8BA888]" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Đăng ký thành công!</h2>
              <p className="text-gray-600 max-w-md mx-auto mb-8">
                Yêu cầu thuê phòng nhóm của bạn đã được gửi. Nhân viên của chúng tôi sẽ liên hệ với <strong>Người đại diện</strong> trong thời gian sớm nhất để hoàn tất hợp đồng.
              </p>
              
              <div className="flex justify-center">
                <button onClick={handleFinish} className="bg-[#8BA888] text-white px-8 py-3 rounded-[12px] font-medium hover:bg-[#7a9677] transition-colors">
                  Về trang cá nhân
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
