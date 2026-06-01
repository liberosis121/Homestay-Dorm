import React, { useRef } from 'react';
import { useDepositStore, DepositStatus } from './store/useDepositStore';
import { ArrowLeft, CheckCircle2, Clock, FileImage, CreditCard, Wallet, QrCode, Upload, XCircle, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const statusMap: Record<DepositStatus, { label: string; icon: any; color: string }> = {
  pending: { label: 'Chờ thanh toán', icon: Clock, color: 'text-amber-500 bg-amber-50' },
  submitted: { label: 'Đã gửi minh chứng', icon: FileImage, color: 'text-blue-500 bg-blue-50' },
  approved: { label: 'Hoàn tất', icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
  rejected: { label: 'Từ chối', icon: XCircle, color: 'text-red-500 bg-red-50' },
  expired: { label: 'Hết hạn', icon: AlertCircle, color: 'text-slate-500 bg-slate-50' },
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

  return (
    <div className="min-h-screen bg-[#faf9f6] text-[#1a1c1a] font-['Lexend',sans-serif] pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#faf9f6]/80 backdrop-blur-md border-b border-[#dcdedc] px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-[#f1f1ee] transition-colors">
            <ArrowLeft className="w-5 h-5 text-[#334537]" />
          </button>
          <h1 className="text-xl font-semibold text-[#1a1c1a]">Đăng ký Đặt cọc</h1>
        </div>
        
        {/* Demo Toolbar */}
        <select 
          className="text-xs p-1 border rounded"
          value={status}
          onChange={(e) => handleDemoStatus(e.target.value as DepositStatus)}
        >
          <option value="pending">Demo: Pending</option>
          <option value="submitted">Demo: Submitted</option>
          <option value="approved">Demo: Approved</option>
          <option value="rejected">Demo: Rejected</option>
          <option value="expired">Demo: Expired</option>
        </select>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-6 mt-4">
        
        {/* Status Badge */}
        <div className={`flex items-center gap-2 p-3 rounded-xl border ${statusMap[status].color} border-current/10`}>
          {React.createElement(statusMap[status].icon, { className: 'w-5 h-5' })}
          <span className="font-medium">{statusMap[status].label}</span>
        </div>

        {/* Booking Summary */}
        <section className="bg-white rounded-2xl p-5 shadow-[0_4px_20px_rgba(26,28,26,0.06)] border border-[#dcdedc]/50">
          <h2 className="text-sm font-semibold text-[#434843] mb-4 uppercase tracking-wider">Tóm tắt đặt phòng</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-[#5d5f5e]">Chi nhánh</span>
              <span className="font-medium">{depositInfo.branch}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#5d5f5e]">Loại phòng</span>
              <span className="font-medium">{depositInfo.roomName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#5d5f5e]">Giường</span>
              <span className="font-medium">{depositInfo.bedId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#5d5f5e]">Ngày nhận phòng</span>
              <span className="font-medium">{new Date(depositInfo.checkInDate).toLocaleDateString('vi-VN')}</span>
            </div>
          </div>
        </section>

        {/* Deposit Information */}
        <section className="bg-white rounded-2xl p-5 shadow-[0_4px_20px_rgba(26,28,26,0.06)] border border-[#dcdedc]/50">
          <h2 className="text-sm font-semibold text-[#434843] mb-4 uppercase tracking-wider">Thông tin tiền cọc</h2>
          <div className="flex items-end justify-between mb-4">
            <span className="text-[#5d5f5e]">Số tiền cần cọc</span>
            <span className="text-2xl font-semibold text-[#334537]">{depositInfo.depositAmount.toLocaleString()} VNĐ</span>
          </div>
          
          {(status === 'pending' || status === 'rejected') && (
            <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-xl text-sm">
              <Clock className="w-4 h-4" />
              <span>Thời hạn thanh toán: 24h</span>
            </div>
          )}
        </section>

        {/* Payment Methods (Only show if pending or rejected) */}
        {(status === 'pending' || status === 'rejected') && (
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-[#434843] uppercase tracking-wider">Phương thức thanh toán</h2>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'qr', label: 'Mã QR', icon: QrCode },
                { id: 'card', label: 'Thẻ ATM', icon: CreditCard },
                { id: 'wallet', label: 'Ví điện tử', icon: Wallet },
              ].map((method) => (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id as any)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                    paymentMethod === method.id 
                      ? 'border-[#334537] bg-[#f1f1ee]' 
                      : 'border-[#dcdedc] bg-white hover:bg-[#f7f7f5]'
                  }`}
                >
                  <method.icon className={`w-6 h-6 ${paymentMethod === method.id ? 'text-[#334537]' : 'text-[#737872]'}`} />
                  <span className={`text-xs font-medium ${paymentMethod === method.id ? 'text-[#334537]' : 'text-[#5d5f5e]'}`}>
                    {method.label}
                  </span>
                </button>
              ))}
            </div>

            {/* QR Payment Content */}
            {paymentMethod === 'qr' && (
              <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgba(26,28,26,0.06)] border border-[#dcdedc]/50 flex flex-col items-center">
                <div className="w-48 h-48 bg-slate-100 rounded-xl mb-6 flex items-center justify-center border-2 border-dashed border-[#dcdedc]">
                  {/* Mock QR Code Image */}
                  <QrCode className="w-16 h-16 text-[#c3c8c1]" />
                </div>
                <div className="w-full space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#5d5f5e]">Ngân hàng</span>
                    <span className="font-medium">Vietcombank</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5d5f5e]">Số tài khoản</span>
                    <span className="font-medium">0123456789</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5d5f5e]">Tên chủ tài khoản</span>
                    <span className="font-medium">HOMESTAY DORM VN</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5d5f5e]">Nội dung CK</span>
                    <span className="font-medium text-[#334537] bg-[#f1f1ee] px-2 py-0.5 rounded">COC G-102</span>
                  </div>
                </div>
              </div>
            )}

            {/* Upload Proof */}
            <div className="bg-white rounded-2xl p-5 shadow-[0_4px_20px_rgba(26,28,26,0.06)] border border-[#dcdedc]/50">
              <h3 className="text-sm font-medium mb-3">Tải ảnh minh chứng</h3>
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileUpload}
              />
              {proofImage ? (
                <div className="relative rounded-xl overflow-hidden aspect-video border border-[#dcdedc]">
                  <img src={proofImage} alt="Minh chứng" className="w-full h-full object-cover" />
                  <button 
                    onClick={() => setProofImage(null)}
                    className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-8 border-2 border-dashed border-[#c3c8c1] rounded-xl flex flex-col items-center gap-2 text-[#5d5f5e] hover:bg-[#f1f1ee] transition-colors"
                >
                  <Upload className="w-6 h-6" />
                  <span className="text-sm">Nhấn để tải ảnh lên (JPG, PNG)</span>
                </button>
              )}
            </div>
          </section>
        )}

        {/* Timeline (Always visible, highlights current state) */}
        <section className="bg-white rounded-2xl p-5 shadow-[0_4px_20px_rgba(26,28,26,0.06)] border border-[#dcdedc]/50">
          <h2 className="text-sm font-semibold text-[#434843] mb-6 uppercase tracking-wider">Tiến độ đặt cọc</h2>
          <div className="relative pl-6 space-y-6 before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
            
            {/* Step 1: Pending */}
            <div className="relative flex items-center gap-4">
              <div className={`absolute left-[-24px] w-5 h-5 rounded-full flex items-center justify-center border-2 bg-white ${
                status !== 'pending' ? 'border-[#334537] text-[#334537]' : 'border-[#334537] bg-[#334537] text-white'
              }`}>
                {status !== 'pending' && <CheckCircle2 className="w-3 h-3" />}
              </div>
              <div>
                <h4 className={`text-sm font-medium ${status === 'pending' ? 'text-[#1a1c1a]' : 'text-[#737872]'}`}>Chờ thanh toán</h4>
                <p className="text-xs text-[#737872]">Khách hàng cần thanh toán cọc</p>
              </div>
            </div>

            {/* Step 2: Submitted */}
            <div className="relative flex items-center gap-4">
              <div className={`absolute left-[-24px] w-5 h-5 rounded-full flex items-center justify-center border-2 bg-white ${
                ['approved', 'rejected'].includes(status) ? 'border-[#334537] text-[#334537]' :
                status === 'submitted' ? 'border-[#334537] bg-[#334537] text-white' : 'border-[#dcdedc]'
              }`}>
                {['approved', 'rejected'].includes(status) && <CheckCircle2 className="w-3 h-3" />}
              </div>
              <div>
                <h4 className={`text-sm font-medium ${status === 'submitted' ? 'text-[#1a1c1a]' : 'text-[#737872]'}`}>Đã gửi minh chứng</h4>
                <p className="text-xs text-[#737872]">Chờ BQL xác nhận</p>
              </div>
            </div>

            {/* Step 3: Approved / Rejected */}
            <div className="relative flex items-center gap-4">
              <div className={`absolute left-[-24px] w-5 h-5 rounded-full flex items-center justify-center border-2 bg-white ${
                status === 'approved' ? 'border-emerald-500 bg-emerald-500 text-white' : 
                status === 'rejected' ? 'border-red-500 bg-red-500 text-white' : 'border-[#dcdedc]'
              }`}>
                {status === 'approved' && <CheckCircle2 className="w-3 h-3" />}
                {status === 'rejected' && <XCircle className="w-3 h-3" />}
              </div>
              <div>
                <h4 className={`text-sm font-medium ${
                  status === 'approved' ? 'text-emerald-700' : 
                  status === 'rejected' ? 'text-red-700' : 'text-[#737872]'
                }`}>
                  {status === 'rejected' ? 'Đã từ chối' : 'Hoàn tất'}
                </h4>
                {status === 'rejected' ? (
                  <p className="text-xs text-red-600">Minh chứng không hợp lệ</p>
                ) : (
                  <p className="text-xs text-[#737872]">Xác nhận thành công</p>
                )}
              </div>
            </div>

          </div>
        </section>

        {/* Expired case message */}
        {status === 'expired' && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm border border-red-100 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>Đơn đặt cọc này đã hết hạn do không nhận được thanh toán trong thời gian quy định. Vui lòng tạo đặt phòng mới.</p>
          </div>
        )}

      </main>

      {/* Sticky Bottom Action */}
      {(status === 'pending' || status === 'rejected') && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#dcdedc] p-4 flex justify-center pb-safe">
          <div className="max-w-md w-full">
            <button
              onClick={() => {
                if (!proofImage) {
                  alert('Vui lòng tải ảnh minh chứng lên trước khi gửi!');
                  return;
                }
                submitDeposit();
              }}
              disabled={!proofImage}
              className={`w-full py-4 rounded-xl font-medium text-center transition-colors ${
                proofImage 
                  ? 'bg-[#334537] text-white hover:bg-[#253228]' 
                  : 'bg-[#e8e8e5] text-[#a0a3a0] cursor-not-allowed'
              }`}
            >
              Gửi xác nhận đặt cọc
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
