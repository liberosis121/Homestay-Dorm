import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, Copy, UploadCloud, Clock, QrCode, CreditCard, Wallet, FileText, Check, ArrowLeft, X } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { getMyDepositsApi, DepositRequest } from './deposit.api';
import { fetchMyInvoices, payInvoiceApi } from './services/invoice.service';

export type DepositStatus = 'pending' | 'submitted' | 'approved' | 'rejected' | 'expired';

const statusMap: Record<DepositStatus, { label: string; desc: string }> = {
  pending: { label: 'Đang chờ thanh toán', desc: 'Vui lòng thực hiện chuyển khoản thanh toán cọc' },
  submitted: { label: 'Đã nộp minh chứng', desc: 'Đang chờ Quản lý duyệt giao dịch' },
  approved: { label: 'Hoàn tất', desc: 'Đặt cọc thành công' },
  rejected: { label: 'Từ chối', desc: 'Minh chứng giao dịch không hợp lệ' },
  expired: { label: 'Hết hạn', desc: 'Yêu cầu đặt cọc đã hết hạn hoặc bị hủy' },
};

export default function DepositRegistrationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [depositRequest, setDepositRequest] = useState<DepositRequest | null>(location.state?.depositRequest || null);
  const [isLoading, setIsLoading] = useState(!depositRequest);
  const [paymentMethod, setPaymentMethod] = useState<'qr' | 'card' | 'wallet'>('qr');
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<'stk' | 'ndck' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localStatus, setLocalStatus] = useState<DepositStatus | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!depositRequest) {
      setIsLoading(true);
      getMyDepositsApi()
        .then((deposits) => {
          const found = deposits.find(d => d.status === 'invoice_created') || deposits[0];
          if (found) {
            setDepositRequest(found);
          } else {
            navigate('/customer/deposit-history');
          }
        })
        .catch(() => navigate('/customer/deposit-history'))
        .finally(() => setIsLoading(false));
    }
  }, [depositRequest, user, navigate]);

  const status = useMemo((): DepositStatus => {
    if (localStatus) return localStatus;
    if (!depositRequest) return 'pending';
    if (depositRequest.status === 'paid') return 'approved';
    if (depositRequest.status === 'rejected') return 'rejected';
    if (depositRequest.status === 'cancelled') return 'expired';
    return 'pending';
  }, [depositRequest, localStatus]);

  const depositInfo = useMemo(() => {
    if (!depositRequest) return null;
    return {
      roomId: depositRequest.room_id,
      roomName: depositRequest.room_name,
      roomType: depositRequest.room_name.includes('Studio') 
        ? 'Phòng Studio' 
        : depositRequest.room_name.includes('Twin') 
          ? 'Phòng Twin' 
          : 'Phòng KTX / Dorm',
      bedNames: [depositRequest.bed_id ? `Giường ID: ${depositRequest.bed_id.substring(0, 6).toUpperCase()}` : 'Giường'],
      branch: depositRequest.branch_name,
      checkInDate: depositRequest.expected_move_in_date,
      depositAmount: depositRequest.deposit_amount,
      deadline: depositRequest.payment_deadline,
    };
  }, [depositRequest]);

  const copyToClipboard = (text: string, type: 'stk' | 'ndck') => {
    navigator.clipboard.writeText(text);
    setCopiedText(type);
    setTimeout(() => setCopiedText(null), 2000);
  };

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

  const submitDeposit = async () => {
    if (!depositRequest || !user?.email) return;
    setIsSubmitting(true);
    try {
      const invoices = await fetchMyInvoices(user.email);
      const invoice = invoices.find((inv: any) => 
        inv.deposit_id === depositRequest.id || 
        inv.id === `HDTT-DEP-${depositRequest.id}`
      );
      
      const invoiceId = invoice?.id || `HDTT-DEP-${depositRequest.id}`;
      const methodLabel = paymentMethod === 'card' ? 'Thẻ tín dụng' : paymentMethod === 'wallet' ? 'Ví điện tử' : 'Chuyển khoản ngân hàng';

      await payInvoiceApi(user.email, invoiceId, methodLabel);

      setLocalStatus('approved');
      alert('Thanh toán đặt cọc thành công! Hệ thống đã ghi nhận cọc giữ chỗ của bạn.');
      
      setTimeout(() => {
        navigate('/customer/deposit-history');
      }, 2000);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Lỗi khi thực hiện thanh toán cọc.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps: DepositStatus[] = ['pending', 'submitted', 'approved'];

  const getStepState = (stepIndex: number, currentStatus: DepositStatus) => {
    if (currentStatus === 'expired') {
      if (stepIndex === 0) return 'expired';
      return 'disabled';
    }
    
    if (currentStatus === 'rejected') {
      if (stepIndex === 0) return 'completed';
      if (stepIndex === 1) return 'rejected';
      return 'disabled';
    }
    
    const currentFlowIndex = ['pending', 'submitted', 'approved'].indexOf(currentStatus);
    
    if (stepIndex < currentFlowIndex) {
      return 'completed';
    }
    if (stepIndex === currentFlowIndex) {
      return 'active';
    }
    return 'future';
  };

  if (isLoading || !depositInfo || !depositRequest) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 py-32 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="text-on-surface-variant font-semibold text-sm">Đang tải thông tin đặt cọc...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto px-4 md:px-10 theme-customer">
      <button
        type="button"
        onClick={() => navigate('/customer/deposit-history')}
        className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3.5 py-2 text-sm font-semibold text-primary/80 transition-all hover:border-primary/25 hover:bg-primary/10 hover:text-primary active:scale-[0.98] cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" />
        Lịch sử đặt cọc
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pb-20">
        
        {/* LEFT COLUMN - MAIN CONTENT */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Header section */}
          <div>
            <h1 className="text-3xl font-bold font-headline-lg text-primary mb-2">Thanh toán đặt cọc</h1>
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
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`STK: 1029384756 | Ngan hang: Vietcombank | Chu TK: HOMESTAY DORM CO. | So tien: ${depositInfo.depositAmount} VNĐ | Noi dung: HS DORM ${depositInfo.roomName.replace(/\s+/g, '')} DC`)}&color=2c524b&bgcolor=ffffff`} alt="QR Code" className="w-full h-full object-cover rounded-lg border-4 border-white shadow-md mix-blend-screen" />
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
                      <button 
                        onClick={() => copyToClipboard('1029384756', 'stk')}
                        className="text-primary hover:bg-primary/10 p-1 rounded transition-colors flex items-center justify-center" 
                        title="Copy"
                      >
                        {copiedText === 'stk' ? (
                          <Check className="w-3.5 h-3.5 text-status-success" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-outline-variant/20">
                    <span className="text-on-surface-variant text-sm font-medium">Chủ tài khoản</span>
                    <span className="font-bold text-on-surface font-label-md">HOMESTAY DORM CO.</span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-on-surface-variant text-sm font-medium whitespace-nowrap">Nội dung chuyển khoản:</span>
                    <div className="flex items-center gap-2 ml-2">
                      <span className="font-bold text-timber-accent font-label-md bg-timber-accent/10 px-3 py-1 rounded-md text-sm">
                        {`HS DORM ${depositInfo.roomName.replace(/\s+/g, '')} DC`}
                      </span>
                      <button 
                        onClick={() => copyToClipboard(`HS DORM ${depositInfo.roomName.replace(/\s+/g, '')} DC`, 'ndck')}
                        className="text-primary hover:bg-primary/10 p-1 rounded transition-colors flex items-center justify-center" 
                        title="Copy"
                      >
                        {copiedText === 'ndck' ? (
                          <Check className="w-3.5 h-3.5 text-status-success" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
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
                    <X className="w-4 h-4 text-white" />
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
                onClick={submitDeposit}
                disabled={(!proofImage && status === 'pending') || isSubmitting || status === 'approved'}
                className={`px-8 py-3.5 rounded-full font-label-md font-bold text-[15px] shadow-md transition-all ${
                  ((proofImage && status === 'pending') && !isSubmitting)
                    ? 'bg-primary text-white hover:bg-[#253228] hover:shadow-lg hover:-translate-y-0.5' 
                    : 'bg-surface-container-high text-on-surface-variant cursor-not-allowed opacity-70'
                }`}
              >
                {isSubmitting ? 'Đang gửi...' : status === 'pending' ? 'Xác nhận đã thanh toán' : 'Đã hoàn tất thanh toán'}
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
              {depositInfo.depositAmount.toLocaleString('vi-VN')} VNĐ
            </h3>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-black/15 border border-white/10 rounded-full backdrop-blur-sm text-sm font-label-md">
              <Clock className="w-4 h-4 text-white/90" />
              <span>Thời hạn thanh toán: <strong className="font-bold">{new Date(depositInfo.deadline).toLocaleDateString('vi-VN')}</strong></span>
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
                {depositInfo.roomType}
              </div>
            </div>
            {/* Info */}
            <div className="p-6 space-y-5">
              <h4 className="font-headline-md text-lg font-bold text-on-surface">
                {depositInfo.roomName}
              </h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-on-surface-variant font-medium mb-0.5">Chi nhánh</p>
                  <p className="font-label-md text-sm font-semibold text-on-surface">{depositInfo.branch}</p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant font-medium mb-0.5">Loại giường/phòng</p>
                  <p className="font-label-md text-sm font-semibold text-on-surface">{depositInfo.bedNames.join(', ')}</p>
                </div>
              </div>
              
              <div className="border-t border-outline-variant/20 pt-4">
                <p className="text-xs text-on-surface-variant font-medium mb-0.5">Ngày dự kiến nhận phòng</p>
                <p className="font-label-md text-sm font-semibold text-on-surface">{new Date(depositInfo.checkInDate).toLocaleDateString('vi-VN')}</p>
              </div>

              <div className="flex items-center gap-2 pt-2 text-status-success">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span className="font-label-md text-sm font-semibold">Bảo lưu vị trí phòng 24 giờ sau duyệt</span>
              </div>
            </div>
          </div>

          {/* Timeline Card */}
          <div className="bg-surface-container-lowest rounded-3xl p-6 md:p-8 border border-outline-variant/30 shadow-sm">
            <h2 className="text-xl font-bold font-headline-md text-primary mb-6">Trạng thái đặt cọc</h2>
            
            <div className="space-y-6">
              {/* Timeline Items */}
              {steps.map((step, index) => {
                const stepState = getStepState(index, status);
                
                let iconBg = '';
                let iconColor = '';
                let lineClass = '';
                let titleColor = '';
                let descColor = '';
                let itemOpacity = 'opacity-100';
                let stepIcon: React.ReactNode = null;
                let stepLabel = statusMap[step].label;
                let stepDesc = statusMap[step].desc;

                switch (stepState) {
                  case 'completed':
                    iconBg = 'bg-status-success';
                    iconColor = 'text-white border-none';
                    lineClass = 'bg-status-success';
                    titleColor = 'text-on-surface font-semibold';
                    descColor = 'text-on-surface-variant';
                    stepIcon = <Check className="w-4.5 h-4.5" />;
                    if (step === 'pending') {
                      stepLabel = 'Đăng ký đặt cọc';
                      stepDesc = 'Đã gửi yêu cầu';
                    }
                    break;
                  case 'active':
                    iconBg = 'bg-primary border-none';
                    iconColor = 'text-white shadow-md shadow-primary/30';
                    lineClass = 'bg-outline-variant/30';
                    titleColor = 'text-primary font-bold';
                    descColor = 'text-on-surface-variant';
                    if (step === 'pending') stepIcon = <CreditCard className="w-4 h-4" />;
                    else if (step === 'submitted') stepIcon = <FileText className="w-4 h-4" />;
                    else stepIcon = <CheckCircle2 className="w-4 h-4" />;
                    break;
                  case 'rejected':
                    iconBg = 'bg-status-error';
                    iconColor = 'text-white border-none';
                    lineClass = 'bg-outline-variant/30';
                    titleColor = 'text-status-error font-bold';
                    descColor = 'text-status-error/80';
                    stepIcon = <span className="material-symbols-outlined text-[16px]">close</span>;
                    stepLabel = 'Từ chối minh chứng';
                    stepDesc = statusMap.rejected.desc;
                    break;
                  case 'expired':
                    iconBg = 'bg-status-error';
                    iconColor = 'text-white border-none';
                    lineClass = 'bg-outline-variant/30';
                    titleColor = 'text-status-error font-bold';
                    descColor = 'text-status-error/80';
                    stepIcon = <span className="material-symbols-outlined text-[16px]">close</span>;
                    stepLabel = 'Đã hết hạn';
                    stepDesc = statusMap.expired.desc;
                    break;
                  case 'future':
                    iconBg = 'bg-surface-container-high border-2 border-outline-variant/40';
                    iconColor = 'text-on-surface-variant';
                    lineClass = 'bg-outline-variant/30';
                    titleColor = 'text-on-surface-variant';
                    descColor = 'text-on-surface-variant/60';
                    if (step === 'pending') stepIcon = <CreditCard className="w-4 h-4" />;
                    else if (step === 'submitted') stepIcon = <FileText className="w-4 h-4" />;
                    else stepIcon = <CheckCircle2 className="w-4 h-4" />;
                    break;
                  case 'disabled':
                    iconBg = 'bg-surface-container border border-outline-variant/20';
                    iconColor = 'text-on-surface-variant/40';
                    lineClass = 'bg-outline-variant/20';
                    titleColor = 'text-on-surface-variant/40';
                    descColor = 'text-on-surface-variant/30';
                    itemOpacity = 'opacity-40';
                    if (step === 'pending') stepIcon = <CreditCard className="w-4 h-4" />;
                    else if (step === 'submitted') stepIcon = <FileText className="w-4 h-4" />;
                    else stepIcon = <CheckCircle2 className="w-4 h-4" />;
                    break;
                }

                return (
                  <div key={step} className={`relative flex items-start gap-4 ${itemOpacity} transition-opacity`}>
                    {/* Connecting line to next step */}
                    {index < steps.length - 1 && (
                      <div className={`absolute left-[19px] top-10 bottom-[-24px] w-0.5 ${lineClass}`} />
                    )}
                    
                    <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${iconBg} ${iconColor} transition-colors`}>
                      {stepIcon}
                    </div>
                    
                    <div className="pt-1.5 pb-2">
                      <h4 className={`font-label-md text-[15px] ${titleColor}`}>
                        {stepLabel}
                      </h4>
                      <p className={`text-xs font-body-md mt-0.5 opacity-90 ${descColor}`}>
                        {stepDesc}
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
