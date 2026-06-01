import React, { useRef } from 'react';
import { useDepositStore, DepositStatus } from './store/useDepositStore';
import { CheckCircle2, Copy, UploadCloud, Clock, QrCode, CreditCard, Wallet, FileText, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const statusMap: Record<DepositStatus, { label: string; desc: string }> = {
  pending: { label: 'Đang chờ thanh toán', desc: 'Cập nhật lúc 09:30, 29/09/2024' },
  submitted: { label: 'Đã nộp minh chứng', desc: 'Chờ ban quản lý xác nhận' },
  approved: { label: 'Hoàn tất', desc: 'Thanh toán thành công' },
  rejected: { label: 'Từ chối', desc: 'Vui lòng kiểm tra lại minh chứng' },
  expired: { label: 'Hết hạn', desc: 'Yêu cầu đã bị hủy' },
};

export default function DepositRegistrationPage() {
  const navigate = useNavigate();
  const {
    status,
    depositInfo,
    paymentMethod,
    proofImage,
    setStatus,
    setPaymentMethod,
    setProofImage,
    submitDeposit,
  } = useDepositStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!depositInfo) return <div>Loading...</div>;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDemoStatus = (newStatus: DepositStatus) => {
    setStatus(newStatus);
  };

  const steps: DepositStatus[] = ['pending', 'submitted', 'approved'];
  // For UI representation, if status is rejected/expired, it's a special case, but timeline shows linear.

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-8">
      {/* Demo Toolbar */}
      <div className="flex justify-end mb-6">
        <select 
          className="text-sm p-2 border border-outline-variant rounded-lg bg-surface font-label-md text-primary focus:outline-none"
          value={status}
          onChange={(e) => handleDemoStatus(e.target.value as DepositStatus)}
        >
          <option value="pending">Demo Mode: Pending</option>
          <option value="submitted">Demo Mode: Submitted</option>
          <option value="approved">Demo Mode: Approved</option>
          <option value="rejected">Demo Mode: Rejected</option>
          <option value="expired">Demo Mode: Expired</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pb-20">
        
        {/* LEFT COLUMN - MAIN CONTENT */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Header section */}
          <div>
            <h1 className="text-3xl font-bold font-headline-lg text-primary mb-2">Đăng ký đặt cọc</h1>
            <p className="text-on-surface-variant font-body-md text-[15px]">
              Vui lòng hoàn tất thanh toán để giữ chỗ phòng của bạn.
            </p>
          </div>

          {/* Payment Methods */}
          <div className="bg-surface-container-lowest rounded-3xl p-8 border border-outline-variant/30 shadow-sm space-y-6 relative overflow-hidden">
            <h2 className="text-xl font-bold font-headline-md text-primary">Phương thức thanh toán</h2>
            
            <div className="flex flex-wrap items-center gap-3">
              {[
                { id: 'qr', label: 'QR Banking', icon: QrCode },
                { id: 'card', label: 'ATM/Visa', icon: CreditCard },
                { id: 'wallet', label: 'Momo', icon: Wallet },
              ].map((method) => (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id as any)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-label-md text-sm font-semibold transition-all ${
                    paymentMethod === method.id 
                      ? 'bg-primary text-white shadow-md' 
                      : 'bg-surface-container-high text-on-surface-variant hover:bg-primary-container/40'
                  }`}
                >
                  <method.icon className="w-4 h-4" />
                  {method.label}
                </button>
              ))}
            </div>

            {/* QR Payment Content */}
            {paymentMethod === 'qr' && (
              <div className="bg-surface rounded-2xl border border-outline-variant/30 p-4 flex flex-col md:flex-row gap-6 items-center">
                
                {/* QR Code Graphic */}
                <div className="relative w-48 h-48 rounded-xl bg-gradient-to-br from-[#1b3b3a] to-[#2c524b] flex items-center justify-center flex-shrink-0 p-3 shadow-inner">
                  {/* Mock QR image */}
                  <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=homestaydorm&color=2c524b&bgcolor=ffffff" alt="QR Code" className="w-full h-full object-cover rounded-lg border-4 border-white shadow-md mix-blend-screen" />
                  <div className="absolute -bottom-3 -right-3 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                </div>

                {/* Bank Details */}
                <div className="flex-1 w-full space-y-0">
                  <div className="flex justify-between items-center py-3 border-b border-outline-variant/20">
                    <span className="text-on-surface-variant text-sm font-medium">Ngân hàng</span>
                    <span className="font-bold text-on-surface font-label-md">Vietcombank</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-outline-variant/20">
                    <span className="text-on-surface-variant text-sm font-medium">Số tài khoản</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-on-surface font-label-md tracking-wide">1029 3847 56</span>
                      <button className="text-primary hover:bg-primary/10 p-1 rounded transition-colors" title="Copy">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-outline-variant/20">
                    <span className="text-on-surface-variant text-sm font-medium">Chủ tài khoản</span>
                    <span className="font-bold text-on-surface font-label-md">HOMESTAY DORM CO.</span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-on-surface-variant text-sm font-medium whitespace-nowrap">Nội dung chuyển khoản:</span>
                    <span className="font-bold text-timber-accent font-label-md bg-timber-accent/10 px-3 py-1 rounded-md text-sm ml-2">
                      HS DORM S101 DC
                    </span>
                  </div>
                </div>
              </div>
            )}
            {paymentMethod !== 'qr' && (
              <div className="bg-surface rounded-2xl border border-outline-variant/30 p-8 text-center text-on-surface-variant">
                Tính năng thanh toán qua {paymentMethod === 'card' ? 'Thẻ ATM/Visa' : 'Ví điện tử'} đang được bảo trì. Vui lòng sử dụng QR Banking.
              </div>
            )}
          </div>

          {/* Upload Proof */}
          <div className="bg-surface-container-lowest rounded-3xl p-8 border border-outline-variant/30 shadow-sm space-y-4">
            <h2 className="text-xl font-bold font-headline-md text-primary">Minh chứng thanh toán</h2>
            <p className="text-on-surface-variant font-body-md text-sm">
              Vui lòng tải lên ảnh chụp biên lai hoặc màn hình giao dịch thành công.
            </p>

            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            
            {!proofImage ? (
              <div 
                className="w-full border-2 border-dashed border-outline-variant/50 rounded-2xl p-10 flex flex-col items-center justify-center text-center gap-4 hover:bg-surface-container-low transition-colors cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-14 h-14 bg-primary/10 text-primary rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-label-md font-bold text-on-surface">Kéo và thả tệp vào đây</p>
                  <p className="text-xs text-on-surface-variant mt-1 font-medium">PNG, JPG, PDF (Tối đa 5MB)</p>
                </div>
                <button className="px-6 py-2.5 bg-timber-accent hover:bg-[#7a6449] text-white rounded-full font-label-md text-sm font-semibold transition-colors shadow-sm">
                  Tải lên từ máy
                </button>
              </div>
            ) : (
              <div className="w-full border-2 border-dashed border-outline-variant/50 rounded-2xl p-4 flex flex-col items-center gap-4 bg-surface-container-low">
                <div className="relative w-full aspect-[21/9] md:aspect-[21/6] rounded-xl overflow-hidden border border-outline-variant/20 shadow-sm bg-white">
                  <img src={proofImage} alt="Biên lai" className="w-full h-full object-contain" />
                  <button 
                    onClick={() => setProofImage(null)}
                    className="absolute top-2 right-2 w-8 h-8 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/80 transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                </div>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm font-label-md text-primary underline hover:text-primary/80"
                >
                  Tải lên tệp khác
                </button>
              </div>
            )}

            <div className="pt-4 flex justify-end">
              <button
                onClick={() => {
                  if (!proofImage && status === 'pending') {
                    alert('Vui lòng tải ảnh minh chứng lên trước khi xác nhận!');
                    return;
                  }
                  if (status === 'pending') {
                    submitDeposit();
                  }
                }}
                disabled={!proofImage && status === 'pending'}
                className={`px-8 py-3.5 rounded-full font-label-md font-bold text-[15px] shadow-md transition-all ${
                  (proofImage || status !== 'pending') 
                    ? 'bg-primary text-white hover:bg-[#253228] hover:shadow-lg hover:-translate-y-0.5' 
                    : 'bg-surface-container-high text-on-surface-variant cursor-not-allowed opacity-70'
                }`}
              >
                {status === 'pending' ? 'Xác nhận đã thanh toán' : 'Đã gửi xác nhận'}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - SUMMARY & TIMELINE */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Amount Card */}
          <div className="bg-timber-accent rounded-3xl p-8 shadow-md text-white relative overflow-hidden">
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
            <p className="font-body-md text-sm text-white/80 mb-1">Số tiền đặt cọc</p>
            <h3 className="font-display-lg text-4xl font-bold mb-6 tracking-tight">
              5.500.000 VNĐ
            </h3>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-black/15 border border-white/10 rounded-full backdrop-blur-sm text-sm font-label-md">
              <Clock className="w-4 h-4 text-white/90" />
              <span>Hết hạn trong <strong className="font-bold">23:54:04</strong></span>
            </div>
          </div>

          {/* Booking Summary Card */}
          <div className="bg-surface-container-lowest rounded-3xl overflow-hidden border border-outline-variant/30 shadow-sm">
            {/* Image header */}
            <div className="relative h-48 bg-surface-container">
              <img 
                src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80" 
                alt="Room" 
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4 bg-primary/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-bold font-label-md">
                Phòng Studio Cao cấp
              </div>
            </div>
            {/* Info */}
            <div className="p-6 space-y-5">
              <h4 className="font-headline-md text-lg font-bold text-on-surface">Phòng S101 - Giường A</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-on-surface-variant font-medium mb-0.5">Chi nhánh</p>
                  <p className="font-label-md text-sm font-semibold text-on-surface">Quận 1, TP. HCM</p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant font-medium mb-0.5">Loại phòng</p>
                  <p className="font-label-md text-sm font-semibold text-on-surface">Phòng đơn Cao cấp</p>
                </div>
              </div>
              
              <div className="border-t border-outline-variant/20 pt-4">
                <p className="text-xs text-on-surface-variant font-medium mb-0.5">Thời hạn thuê</p>
                <p className="font-label-md text-sm font-semibold text-on-surface">12 tháng (01/10/2024 - 01/10/2025)</p>
              </div>

              <div className="flex items-center gap-2 pt-2 text-status-success">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span className="font-label-md text-sm font-semibold">Đã áp dụng ưu đãi Green Living</span>
              </div>
            </div>
          </div>

          {/* Timeline Card */}
          <div className="bg-surface-container-lowest rounded-3xl p-6 md:p-8 border border-outline-variant/30 shadow-sm">
            <h2 className="text-xl font-bold font-headline-md text-primary mb-6">Trạng thái đặt cọc</h2>
            
            <div className="space-y-6">
              {/* Timeline Items */}
              {steps.map((step, index) => {
                const isActive = status === step;
                const isPast = steps.indexOf(status) > index;
                const isRejectedOrExpired = status === 'rejected' || status === 'expired';
                
                // Determine styling based on status
                let iconBg = 'bg-surface-container-high border-2 border-outline-variant/40';
                let iconColor = 'text-on-surface-variant';
                let lineClass = 'bg-outline-variant/30';
                let titleColor = 'text-on-surface-variant';

                if (isPast && !isRejectedOrExpired) {
                  iconBg = 'bg-primary-container border-none';
                  iconColor = 'text-primary';
                  lineClass = 'bg-primary-container';
                  titleColor = 'text-on-surface';
                } else if (isActive) {
                  iconBg = 'bg-primary border-none';
                  iconColor = 'text-white shadow-md shadow-primary/30';
                  titleColor = 'text-primary font-bold';
                }

                // Override for terminal error states (rejected, expired) if they map to current step
                if ((status === 'rejected' || status === 'expired') && step === 'submitted') {
                  // highlight the error state instead of normal steps
                  iconBg = 'bg-error border-none';
                  iconColor = 'text-white';
                  titleColor = 'text-error font-bold';
                }

                // Render Icon Type
                const getStepIcon = (s: DepositStatus) => {
                  if ((status === 'rejected' || status === 'expired') && s === 'submitted') {
                    return <span className="material-symbols-outlined text-[16px]">close</span>;
                  }
                  if (s === 'pending') return <CreditCard className="w-4 h-4" />;
                  if (s === 'submitted') return <FileText className="w-4 h-4" />;
                  if (s === 'approved') return <CheckCircle2 className="w-4 h-4" />;
                  return <Check className="w-4 h-4" />;
                };

                return (
                  <div key={step} className="relative flex items-start gap-4">
                    {/* Connecting line to next step */}
                    {index < steps.length - 1 && (
                      <div className={`absolute left-[19px] top-10 bottom-[-24px] w-0.5 ${lineClass}`} />
                    )}
                    
                    <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${iconBg} ${iconColor} transition-colors`}>
                      {getStepIcon(step)}
                    </div>
                    
                    <div className="pt-1.5 pb-2">
                      <h4 className={`font-label-md text-[15px] ${titleColor}`}>
                        {(status === 'rejected' && step === 'submitted') ? 'Từ chối minh chứng' :
                         (status === 'expired' && step === 'pending') ? 'Đã hết hạn' : 
                         statusMap[step].label}
                      </h4>
                      <p className="text-xs font-body-md text-on-surface-variant mt-0.5 opacity-90">
                        {statusMap[step].desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            
          </div>
        </div>
        
      </div>
    </div>
  );
}
