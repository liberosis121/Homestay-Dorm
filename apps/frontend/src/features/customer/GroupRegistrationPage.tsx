import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useGroupRegistrationStore } from './store/useGroupRegistrationStore';
import { CheckCircle, ChevronLeft, ChevronRight, Info, Plus, Trash2, Users } from 'lucide-react';

const memberSchema = z.object({
  fullName: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự'),
  phone: z.string().min(10, 'Số điện thoại không hợp lệ'),
  cccd: z.string().min(12, 'CCCD phải có 12 số').max(12, 'CCCD phải có 12 số'),
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
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    const state = location.state as { roomId?: string, roomName?: string, capacity?: number, availableBeds?: number };
    if (state?.roomId) {
      setRoomName(state.roomName || 'Phòng không xác định');
      setCapacity(state.capacity || 4);
      setAvailableBeds(state.availableBeds || 4);
    } else {
      navigate('/rooms');
    }
  }, [user, navigate, location]);

  const { register: registerGroup, control, handleSubmit: handleGroup, formState: { errors: errorsGroup } } = useForm({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      members: draftData.members.length > 0 ? draftData.members : [
        { fullName: user?.full_name || '', phone: user?.phone || '', cccd: '' }
      ]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'members'
  });

  const { register: registerRental, handleSubmit: handleRental, formState: { errors: errorsRental } } = useForm({
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

    setDraftData({ members: membersWithRep });
    setCurrentStep(2);
  };

  const handleNextRental = (data: any) => {
    setDraftData(data);
    setCurrentStep(3);
  };

  const handleSubmitFinal = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setCurrentStep(4);
    }, 1500);
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
          <h1 className="text-3xl font-bold text-gray-900 font-serif mb-2">Đăng ký thuê phòng (Nhóm)</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <p className="text-gray-600">Phòng đã chọn: <span className="font-semibold text-[#8BA888]">{roomName}</span></p>
            <span className="px-2.5 py-1 bg-[#8BA888]/10 text-[#8BA888] rounded-full font-medium">Trống: {availableBeds}/{capacity} giường</span>
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

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    </div>
                  </div>
                ))}
              </div>

              {fields.length < availableBeds && (
                <button 
                  type="button" 
                  onClick={() => append({ fullName: '', phone: '', cccd: '' })}
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
                  <select {...registerRental('leaseTerm')} className="w-full px-4 py-3 rounded-[12px] border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#8BA888]/50 focus:border-[#8BA888] bg-white">
                    <option value="6">6 Tháng</option>
                    <option value="12">1 Năm</option>
                    <option value="24">2 Năm</option>
                  </select>
                  {errorsRental.leaseTerm && <p className="text-red-500 text-sm mt-1">{errorsRental.leaseTerm.message as string}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày dự kiến chuyển vào (chung)</label>
                  <input type="date" {...registerRental('moveInDate')} className="w-full px-4 py-3 rounded-[12px] border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#8BA888]/50 focus:border-[#8BA888]" />
                  {errorsRental.moveInDate && <p className="text-red-500 text-sm mt-1">{errorsRental.moveInDate.message as string}</p>}
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
                      <div key={idx} className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm items-center">
                        <div className="font-medium flex items-center gap-2">
                          {m.fullName} {m.isRepresentative && <span className="px-2 py-0.5 bg-[#8BA888] text-white text-[10px] rounded uppercase font-bold">Đại diện</span>}
                        </div>
                        <div className="text-gray-500">SĐT: <span className="text-gray-900">{m.phone}</span></div>
                        <div className="text-gray-500">CCCD: <span className="text-gray-900">{m.cccd}</span></div>
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
