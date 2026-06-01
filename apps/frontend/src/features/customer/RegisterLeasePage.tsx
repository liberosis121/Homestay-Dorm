import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useIndividualLeaseStore } from './store/useIndividualLeaseStore';
import { CheckCircle, ChevronLeft, ChevronRight, UploadCloud, Info } from 'lucide-react';

const personalInfoSchema = z.object({
  fullName: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự'),
  phone: z.string().min(10, 'Số điện thoại không hợp lệ'),
  cccd: z.string().min(12, 'CCCD phải có 12 số').max(12, 'CCCD phải có 12 số'),
  dob: z.string().min(1, 'Vui lòng chọn ngày sinh'),
  gender: z.enum(['male', 'female', 'other']),
});

const rentalInfoSchema = z.object({
  leaseTerm: z.string().min(1, 'Vui lòng chọn thời hạn thuê'),
  moveInDate: z.string().min(1, 'Vui lòng chọn ngày chuyển vào'),
});

export const RegisterLeasePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  
  const { draftData, setDraftData, currentStep, setCurrentStep, clearDraft } = useIndividualLeaseStore();
  
  const [roomName, setRoomName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    if (!user) {
      navigate('/auth/login', { state: { from: location } });
      return;
    }
    // Check if user already rents a room
    if (user.renting_room_name) {
      alert(`Bạn hiện đang thuê ${user.renting_room_name}. Vui lòng trả phòng theo hợp đồng trước khi thuê phòng mới.`);
      navigate('/rooms');
      return;
    }

    const state = location.state as { roomId?: string, roomName?: string };
    if (state?.roomId) {
      setRoomName(state.roomName || 'Phòng không xác định');
    } else {
      navigate('/rooms');
    }
  }, [user, navigate, location]);

  const { register: registerPersonal, handleSubmit: handlePersonal, formState: { errors: errorsPersonal } } = useForm({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      fullName: draftData.fullName || user?.full_name || '',
      phone: draftData.phone || user?.phone || '',
      cccd: draftData.cccd || '',
      dob: draftData.dob || '',
      gender: draftData.gender || 'male' as any,
    }
  });

  const { register: registerRental, handleSubmit: handleRental, formState: { errors: errorsRental } } = useForm({
    resolver: zodResolver(rentalInfoSchema),
    defaultValues: {
      leaseTerm: draftData.leaseTerm || '6',
      moveInDate: draftData.moveInDate || '',
    }
  });

  const [docs, setDocs] = useState<{front: string | null, back: string | null}>({
    front: draftData.cccdFront || null,
    back: draftData.cccdBack || null
  });
  const [docError, setDocError] = useState('');

  const handleNextPersonal = (data: any) => {
    setDraftData(data);
    setCurrentStep(2);
  };

  const handleNextRental = (data: any) => {
    setDraftData(data);
    setCurrentStep(3);
  };

  const handleNextDocs = () => {
    if (!docs.front || !docs.back) {
      setDocError('Vui lòng tải lên đầy đủ 2 mặt CCCD');
      return;
    }
    setDocError('');
    setDraftData({ cccdFront: docs.front, cccdBack: docs.back });
    setCurrentStep(4);
  };

  const handleSubmitFinal = () => {
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setCurrentStep(5);
      
      // We could update mock db here to set user.renting_room_name, but we are keeping it simple for the UI flow
    }, 1500);
  };

  const handleFinish = () => {
    clearDraft();
    navigate('/profile');
  };

  const steps = [
    { num: 1, title: 'Thông tin' },
    { num: 2, title: 'Thuê phòng' },
    { num: 3, title: 'Giấy tờ' },
    { num: 4, title: 'Xác nhận' }
  ];

  return (
    <div className="min-h-screen bg-[#F9F8F4] pt-24 pb-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 font-serif mb-2">Đăng ký thuê phòng</h1>
          <p className="text-gray-600">Phòng đã chọn: <span className="font-semibold text-[#8BA888]">{roomName}</span></p>
        </div>

        {/* Stepper */}
        {currentStep < 5 && (
          <div className="mb-10">
            <div className="flex items-center justify-between">
              {steps.map((s, idx) => (
                <div key={s.num} className="flex flex-col items-center relative z-10 w-1/4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-colors ${
                    currentStep >= s.num ? 'bg-[#8BA888] text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {currentStep > s.num ? <CheckCircle size={20} /> : s.num}
                  </div>
                  <span className={`text-xs mt-2 font-medium ${currentStep >= s.num ? 'text-gray-900' : 'text-gray-400'}`}>
                    {s.title}
                  </span>
                  {idx < steps.length - 1 && (
                    <div className={`absolute top-5 left-1/2 w-full h-[2px] -z-10 ${
                      currentStep > s.num ? 'bg-[#8BA888]' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-8">
          
          {/* Step 1 */}
          {currentStep === 1 && (
            <form onSubmit={handlePersonal(handleNextPersonal)}>
              <h2 className="text-xl font-semibold mb-6">Thông tin cá nhân</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
                  <input {...registerPersonal('fullName')} className="w-full px-4 py-3 rounded-[12px] border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#8BA888]/50 focus:border-[#8BA888]" placeholder="Nguyễn Văn A" />
                  {errorsPersonal.fullName && <p className="text-red-500 text-sm mt-1">{errorsPersonal.fullName.message as string}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                    <input {...registerPersonal('phone')} className="w-full px-4 py-3 rounded-[12px] border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#8BA888]/50 focus:border-[#8BA888]" placeholder="0901234567" />
                    {errorsPersonal.phone && <p className="text-red-500 text-sm mt-1">{errorsPersonal.phone.message as string}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Số CCCD/CMND</label>
                    <input {...registerPersonal('cccd')} className="w-full px-4 py-3 rounded-[12px] border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#8BA888]/50 focus:border-[#8BA888]" placeholder="012345678901" />
                    {errorsPersonal.cccd && <p className="text-red-500 text-sm mt-1">{errorsPersonal.cccd.message as string}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ngày sinh</label>
                    <input type="date" {...registerPersonal('dob')} className="w-full px-4 py-3 rounded-[12px] border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#8BA888]/50 focus:border-[#8BA888]" />
                    {errorsPersonal.dob && <p className="text-red-500 text-sm mt-1">{errorsPersonal.dob.message as string}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Giới tính</label>
                    <select {...registerPersonal('gender')} className="w-full px-4 py-3 rounded-[12px] border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#8BA888]/50 focus:border-[#8BA888] bg-white">
                      <option value="male">Nam</option>
                      <option value="female">Nữ</option>
                      <option value="other">Khác</option>
                    </select>
                    {errorsPersonal.gender && <p className="text-red-500 text-sm mt-1">{errorsPersonal.gender.message as string}</p>}
                  </div>
                </div>
              </div>

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
              <h2 className="text-xl font-semibold mb-6">Thông tin thuê phòng</h2>
              
              <div className="bg-[#F9F8F4] p-4 rounded-[12px] mb-6 flex items-start">
                <Info size={20} className="text-[#8BA888] mt-0.5 mr-3 flex-shrink-0" />
                <p className="text-sm text-gray-700">Giá phòng và các chi phí khác sẽ được tính dựa trên thời hạn thuê mà bạn chọn. Hợp đồng tối thiểu 6 tháng.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thời hạn thuê</label>
                  <select {...registerRental('leaseTerm')} className="w-full px-4 py-3 rounded-[12px] border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#8BA888]/50 focus:border-[#8BA888] bg-white">
                    <option value="6">6 Tháng</option>
                    <option value="12">1 Năm</option>
                    <option value="24">2 Năm</option>
                  </select>
                  {errorsRental.leaseTerm && <p className="text-red-500 text-sm mt-1">{errorsRental.leaseTerm.message as string}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày dự kiến chuyển vào</label>
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
              <h2 className="text-xl font-semibold mb-6">Tải lên giấy tờ</h2>
              <p className="text-sm text-gray-500 mb-6">Vui lòng tải lên ảnh chụp 2 mặt CCCD của bạn để đối chiếu khi làm hợp đồng.</p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mặt trước CCCD</label>
                  <div 
                    onClick={() => setDocs({...docs, front: 'front.jpg'})}
                    className={`border-2 border-dashed rounded-[16px] p-8 text-center cursor-pointer transition-colors ${docs.front ? 'border-[#8BA888] bg-[#F9F8F4]' : 'border-gray-200 hover:border-[#8BA888] hover:bg-gray-50'}`}
                  >
                    {docs.front ? (
                      <div className="flex flex-col items-center text-[#8BA888]">
                        <CheckCircle size={32} className="mb-2" />
                        <span className="font-medium">Đã tải lên mặt trước</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-gray-400">
                        <UploadCloud size={32} className="mb-2" />
                        <span className="text-sm">Nhấn để tải ảnh lên</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mặt sau CCCD</label>
                  <div 
                    onClick={() => setDocs({...docs, back: 'back.jpg'})}
                    className={`border-2 border-dashed rounded-[16px] p-8 text-center cursor-pointer transition-colors ${docs.back ? 'border-[#8BA888] bg-[#F9F8F4]' : 'border-gray-200 hover:border-[#8BA888] hover:bg-gray-50'}`}
                  >
                    {docs.back ? (
                      <div className="flex flex-col items-center text-[#8BA888]">
                        <CheckCircle size={32} className="mb-2" />
                        <span className="font-medium">Đã tải lên mặt sau</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-gray-400">
                        <UploadCloud size={32} className="mb-2" />
                        <span className="text-sm">Nhấn để tải ảnh lên</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {docError && <p className="text-red-500 text-sm mt-4 text-center">{docError}</p>}

              <div className="mt-8 flex justify-between">
                <button type="button" onClick={() => setCurrentStep(2)} className="border border-gray-200 text-gray-600 px-6 py-3 rounded-[12px] font-medium hover:bg-gray-50 transition-colors flex items-center">
                  <ChevronLeft size={18} className="mr-1" /> Quay lại
                </button>
                <button type="button" onClick={handleNextDocs} className="bg-[#8BA888] text-white px-6 py-3 rounded-[12px] font-medium hover:bg-[#7a9677] transition-colors flex items-center">
                  Tiếp tục <ChevronRight size={18} className="ml-1" />
                </button>
              </div>
            </div>
          )}

          {/* Step 4 */}
          {currentStep === 4 && (
            <div>
              <h2 className="text-xl font-semibold mb-6">Xác nhận thông tin</h2>
              
              <div className="space-y-6">
                <div className="bg-gray-50 p-6 rounded-[16px]">
                  <h3 className="font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">Thông tin cá nhân</h3>
                  <div className="grid grid-cols-2 gap-y-3 text-sm">
                    <div className="text-gray-500">Họ và tên:</div>
                    <div className="font-medium">{draftData.fullName}</div>
                    <div className="text-gray-500">Số điện thoại:</div>
                    <div className="font-medium">{draftData.phone}</div>
                    <div className="text-gray-500">CCCD:</div>
                    <div className="font-medium">{draftData.cccd}</div>
                    <div className="text-gray-500">Ngày sinh:</div>
                    <div className="font-medium">{draftData.dob}</div>
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-[16px]">
                  <h3 className="font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">Thông tin thuê phòng</h3>
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
                <button type="button" onClick={() => setCurrentStep(3)} className="border border-gray-200 text-gray-600 px-6 py-3 rounded-[12px] font-medium hover:bg-gray-50 transition-colors flex items-center" disabled={isSubmitting}>
                  <ChevronLeft size={18} className="mr-1" /> Quay lại
                </button>
                <button type="button" onClick={handleSubmitFinal} className="bg-[#8BA888] text-white px-8 py-3 rounded-[12px] font-medium hover:bg-[#7a9677] transition-colors flex items-center disabled:opacity-70" disabled={isSubmitting}>
                  {isSubmitting ? 'Đang xử lý...' : 'Xác nhận Đăng ký'}
                </button>
              </div>
            </div>
          )}

          {/* Step 5 */}
          {currentStep === 5 && (
            <div className="text-center py-10 px-4">
              <div className="w-20 h-20 bg-[#8BA888]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={40} className="text-[#8BA888]" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Đăng ký thành công!</h2>
              <p className="text-gray-600 max-w-md mx-auto mb-8">
                Yêu cầu thuê phòng của bạn đã được gửi. Nhân viên của chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất để hoàn tất hợp đồng.
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
