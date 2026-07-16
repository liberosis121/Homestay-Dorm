import { formatShortId } from '../../lib/utils';
import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useInvoiceStore } from './store/useInvoiceStore';
import { useAuthStore } from '../../stores/authStore';
import { 
  ArrowLeft, 
  QrCode, 
  CreditCard, 
  Wallet, 
  Copy, 
  Check, 
  Clock, 
  Loader2, 
  CheckCircle2, 
  AlertCircle
} from 'lucide-react';

type TabType = 'qr' | 'wallet' | 'card';

export default function InvoicePaymentPage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { invoices, payInvoice } = useInvoiceStore();

  const [activeTab, setActiveTab] = useState<TabType>('qr');
  const [copiedField, setCopiedField] = useState<'stk' | 'ndck' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Card Form State
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  const isCardFormValid = useMemo(() => {
    return cardNumber.length === 16 && cardExpiry.length === 5 && cardCvv.length === 3;
  }, [cardNumber, cardExpiry, cardCvv]);

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 4) val = val.slice(0, 4);
    if (val.length > 2) {
      val = val.slice(0, 2) + '/' + val.slice(2);
    }
    setCardExpiry(val);
  };

  // Fetch current invoice
  const invoice = useMemo(() => {
    return invoices.find((inv) => inv.id === invoiceId) || null;
  }, [invoices, invoiceId]);

  if (!invoice) {
    return (
      <div className="max-w-md mx-auto my-12 text-center p-8 bg-white dark:bg-slate-900 border border-outline-variant/30 rounded-3xl shadow-xl">
        <AlertCircle className="w-12 h-12 text-status-error mx-auto mb-4" />
        <h2 className="text-xl font-bold text-on-surface mb-2">Không tìm thấy hóa đơn</h2>
        <p className="text-sm text-on-surface-variant mb-6">
          Mã hóa đơn này không tồn tại trong hệ thống của bạn hoặc đã bị hủy bỏ.
        </p>
        <Link 
          to="/customer/invoices"
          className="inline-flex py-3 px-6 bg-primary text-white rounded-xl font-bold text-sm hover:bg-[#253228] transition-colors"
        >
          Quay lại danh sách hóa đơn
        </Link>
      </div>
    );
  }

  const handleCopy = (text: string, field: 'stk' | 'ndck') => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const startPaymentSimulation = async (method: 'qr' | 'wallet' | 'card') => {
    if (!user?.email) {
      alert('Không tìm thấy thông tin tài khoản đăng nhập!');
      return;
    }
    setIsProcessing(true);
    try {
      await payInvoice(user.email, invoice.id, method);
      setIsSuccess(true);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi thực hiện thanh toán');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCardFormValid) return;
    alert('Chức năng thanh toán thẻ nội địa/quốc tế đang được phát triển. Vui lòng thanh toán bằng phương thức Chuyển khoản QR!');
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-8">
      {/* Back link */}
      <div className="mb-6">
        <Link 
          to="/customer/invoices"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-transparent rounded-full hover:border-primary/20 hover:bg-primary/5 transition-all text-primary font-bold text-xs sm:text-sm group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Quay lại danh mục hóa đơn
        </Link>
      </div>

      {isSuccess ? (
        /* Success Screen Graphic */
        <div className="max-w-xl mx-auto bg-surface-container-lowest p-8 md:p-12 border border-outline-variant/30 rounded-3xl text-center shadow-xl space-y-6 animate-fade-in-up">
          <div className="w-20 h-20 bg-status-success/15 text-status-success rounded-full flex items-center justify-center mx-auto shadow-inner animate-bounce">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-primary font-headline-lg">Thanh toán thành công!</h2>
            <p className="text-on-surface-variant font-body-md text-[15px]">
              Giao dịch của bạn đã được đối soát tự động thành công. Hóa đơn <span className="font-bold text-primary">{formatShortId(invoice.id, 'invoice')}</span> hiện đã cập nhật trạng thái là <span className="font-bold text-primary">Đã thanh toán</span>.
            </p>
          </div>

          <div className="p-6 bg-surface-container-low border border-outline-variant/20 rounded-2xl text-left space-y-3">
            <div className="flex justify-between text-xs sm:text-sm font-semibold">
              <span className="text-on-surface-variant">Hóa đơn thanh toán</span>
              <span className="text-primary">{formatShortId(invoice.id, 'invoice')}</span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm font-semibold">
              <span className="text-on-surface-variant">Tổng số tiền</span>
              <span className="text-primary">{invoice.totalAmount.toLocaleString('vi-VN')} VNĐ</span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm font-semibold">
              <span className="text-on-surface-variant">Phương thức thanh toán</span>
              <span className="text-primary uppercase">{activeTab === 'qr' ? 'QR Banking' : activeTab === 'wallet' ? 'Ví điện tử' : 'Thẻ ngân hàng'}</span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm font-semibold">
              <span className="text-on-surface-variant">Thời gian thực hiện</span>
              <span className="text-primary">{new Date().toLocaleString('vi-VN')}</span>
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <button 
              onClick={() => navigate('/customer/invoices')}
              className="flex-1 py-3.5 bg-primary hover:bg-[#253228] text-white rounded-xl font-bold text-sm shadow-md transition-all active:scale-[0.98] cursor-pointer"
            >
              Về trang hóa đơn
            </button>
          </div>
        </div>
      ) : isProcessing ? (
        /* Processing state */
        <div className="max-w-xl mx-auto bg-surface-container-lowest p-12 border border-outline-variant/30 rounded-3xl text-center shadow-xl space-y-6">
          <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto" />
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-primary font-headline-md">Đang đối soát giao dịch trực tuyến...</h2>
            <p className="text-on-surface-variant text-sm">
              Hệ thống đang kết nối ngân hàng để xác nhận khoản tiền cọc/hóa đơn dịch vụ của bạn. Vui lòng giữ nguyên màn hình này.
            </p>
          </div>
        </div>
      ) : (
        /* Split Screen Checkout Mode */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Payment Form Tabs */}
          <div className="lg:col-span-7 bg-surface-container-lowest border border-outline-variant/30 rounded-3xl shadow-sm overflow-hidden flex flex-col">
            {/* Header info bar */}
            <div className="p-6 border-b border-outline-variant/20 bg-surface-container-low">
              <h2 className="text-lg font-bold text-primary font-headline-md">Chọn phương thức thanh toán</h2>
              <p className="text-xs text-on-surface-variant mt-0.5">Vui lòng hoàn tất thanh toán để ghi nhận hóa đơn định kỳ.</p>
            </div>

            {/* Methods Tabs selection */}
            <div className="flex border-b border-outline-variant/20">
              {[
                { id: 'qr', label: 'CHUYỂN KHOẢN QR', icon: QrCode },
                { id: 'wallet', label: 'VÍ ĐIỆN TỬ', icon: Wallet },
                { id: 'card', label: 'THẺ NỘI ĐỊA/QT', icon: CreditCard },
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    type="button"
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`flex-1 py-4 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border-b-4 transition-all cursor-pointer ${
                      isActive 
                        ? 'text-primary border-primary bg-primary/5' 
                        : 'text-on-surface-variant border-transparent hover:bg-surface-container-low/50'
                    }`}
                  >
                    <tab.icon className="w-4 h-4 shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Methods Panels */}
            <div className="p-6 md:p-8">
              {/* QR Panel */}
              {activeTab === 'qr' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row gap-6 items-center">
                    {/* QR code generator */}
                    <div className="bg-white p-4 rounded-2xl shadow-md border border-outline-variant/30 w-full max-w-[200px] flex-shrink-0 flex items-center justify-center">
                      <img 
                        alt="Vietcombank QR Code" 
                        className="w-full aspect-square" 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`Vietcombank | STK: 1012345678 | Chu TK: HOMESTAY DORM CO. | So tien: ${invoice.totalAmount} VNĐ | Noi dung: HOMESTAY ${invoice.id}`)}&color=334537&bgcolor=ffffff`}
                      />
                    </div>
                    
                    {/* Transfer fields */}
                    <div className="flex-1 w-full space-y-3">
                      <div className="p-3 bg-primary/5 border border-primary/10 rounded-xl">
                        <p className="text-[10px] text-primary/70 font-semibold uppercase tracking-wider mb-0.5">Ngân hàng thụ hưởng</p>
                        <p className="font-bold text-on-surface text-sm">VIETCOMBANK (VCB)</p>
                      </div>
                      
                      <div className="p-3 bg-surface-container rounded-xl flex justify-between items-center">
                        <div>
                          <p className="text-[10px] text-on-surface-variant/85 font-semibold uppercase tracking-wider mb-0.5">Số tài khoản</p>
                          <p className="font-bold text-on-surface text-sm tracking-wide">1012345678</p>
                        </div>
                        <button 
                          onClick={() => handleCopy('1012345678', 'stk')}
                          className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
                        >
                          {copiedField === 'stk' ? <Check className="w-4 h-4 text-status-success" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>

                      <div className="p-3 bg-surface-container rounded-xl flex justify-between items-center">
                        <div>
                          <p className="text-[10px] text-on-surface-variant/85 font-semibold uppercase tracking-wider mb-0.5">Nội dung chuyển khoản</p>
                          <p className="font-bold text-on-surface text-sm">{`HOMESTAY ${invoice.id}`}</p>
                        </div>
                        <button 
                          onClick={() => handleCopy(`HOMESTAY ${invoice.id}`, 'ndck')}
                          className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
                        >
                          {copiedField === 'ndck' ? <Check className="w-4 h-4 text-status-success" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-3.5 bg-status-warning/10 text-status-warning border border-status-warning/20 rounded-xl">
                    <Clock className="w-4 h-4 shrink-0 mt-0.5 animate-pulse" />
                    <p className="text-xs font-semibold leading-relaxed">
                      Lưu ý: Bạn phải chuyển khoản chính xác số tiền <span className="font-extrabold">{invoice.totalAmount.toLocaleString('vi-VN')}đ</span> và đúng nội dung chuyển khoản để hệ thống đối soát tự động.
                    </p>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => startPaymentSimulation('qr')}
                      className="w-full sm:w-auto px-8 py-3.5 bg-primary hover:bg-[#253228] text-white text-sm font-bold rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer"
                    >
                      Tôi đã chuyển khoản thành công
                    </button>
                  </div>
                </div>
              )}

              {/* Wallet Panel */}
              {activeTab === 'wallet' && (
                <div className="space-y-6">
                  <p className="text-xs text-on-surface-variant text-center mb-2 font-medium">
                    Nhấp chọn ví điện tử của bạn để liên kết và quét mã thanh toán.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button 
                      type="button"
                      onClick={() => alert('Chức năng ví điện tử MoMo đang được phát triển. Vui lòng thanh toán bằng phương thức Chuyển khoản QR!')}
                      className="flex flex-col items-center gap-3 p-6 border-2 border-outline-variant/30 rounded-2xl hover:border-primary hover:bg-primary/5 active:scale-98 transition-all cursor-pointer group"
                    >
                      <svg className="w-16 h-16 shadow-md rounded-2xl group-hover:scale-105 transition-transform shrink-0" viewBox="0 0 100 100">
                        <defs>
                          <linearGradient id="momoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#e02076" />
                            <stop offset="100%" stopColor="#a50064" />
                          </linearGradient>
                        </defs>
                        <rect width="100" height="100" rx="24" fill="url(#momoGrad)" />
                        <text x="50" y="58" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="24" fill="#FFFFFF" textAnchor="middle" letterSpacing="-1">momo</text>
                      </svg>
                      <span className="font-bold text-sm text-on-surface">Ví điện tử MoMo</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => alert('Chức năng ví điện tử ZaloPay đang được phát triển. Vui lòng thanh toán bằng phương thức Chuyển khoản QR!')}
                      className="flex flex-col items-center gap-3 p-6 border-2 border-outline-variant/30 rounded-2xl hover:border-primary hover:bg-primary/5 active:scale-98 transition-all cursor-pointer group"
                    >
                      <svg className="w-16 h-16 shadow-md rounded-2xl group-hover:scale-105 transition-transform shrink-0" viewBox="0 0 100 100">
                        <defs>
                          <linearGradient id="zalopayGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#00b4f0" />
                            <stop offset="100%" stopColor="#0076e0" />
                          </linearGradient>
                        </defs>
                        <rect width="100" height="100" rx="24" fill="url(#zalopayGrad)" />
                        <text x="50" y="48" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="20" fill="#FFFFFF" textAnchor="middle" letterSpacing="-0.5">Zalo</text>
                        <text x="50" y="72" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="18" fill="#14ff76" textAnchor="middle" letterSpacing="-0.5">Pay</text>
                      </svg>
                      <span className="font-bold text-sm text-on-surface">Ví điện tử ZaloPay</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Credit Card Form */}
              {activeTab === 'card' && (
                <form onSubmit={handleCardSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                      Số thẻ ngân hàng <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input 
                      required
                      type="text" 
                      inputMode="numeric"
                      autoComplete="cc-number"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').substring(0, 16))}
                      className="relative z-10 w-full border border-outline-variant/30 rounded-xl px-4 py-3 text-left focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary text-sm font-medium bg-surface-container-low pointer-events-auto" 
                      placeholder="4123 4567 8901 2345" 
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                        Ngày hết hạn <span className="text-red-500 font-bold">*</span>
                      </label>
                      <input 
                        required
                        type="text" 
                        inputMode="numeric"
                        autoComplete="cc-exp"
                        value={cardExpiry}
                        onChange={handleExpiryChange}
                        className="relative z-10 w-full border border-outline-variant/30 rounded-xl px-4 py-3 text-left focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary text-sm font-medium bg-surface-container-low pointer-events-auto" 
                        placeholder="mm/dd" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                        CVV / CVC <span className="text-red-500 font-bold">*</span>
                      </label>
                      <input 
                        required
                        type="password" 
                        inputMode="numeric"
                        autoComplete="cc-csc"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').substring(0, 3))}
                        className="relative z-10 w-full border border-outline-variant/30 rounded-xl px-4 py-3 text-left focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary text-sm font-medium bg-surface-container-low pointer-events-auto" 
                        placeholder="***" 
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <button 
                      type="submit" 
                      disabled={!isCardFormValid}
                      className="w-full py-3.5 bg-primary hover:bg-[#253228] text-white rounded-xl font-bold text-sm shadow-md transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary"
                    >
                      Xác nhận thanh toán {invoice.totalAmount.toLocaleString('vi-VN')}đ
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Right: Checkout Receipts Summary */}
          <div className="lg:col-span-5 bg-surface-container-lowest border border-outline-variant/30 rounded-3xl shadow-sm overflow-hidden sticky top-24">
            <div className="bg-primary p-6 text-on-primary">
              <span className="inline-flex rounded-full border border-surface/40 bg-surface/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-primary shadow-sm">
                Tóm tắt thanh toán
              </span>
              <h3 className="text-lg font-bold font-headline-md mt-2">Hóa đơn: {formatShortId(invoice.id, 'invoice')}</h3>
              <p className="text-xs opacity-90">Kỳ thanh toán: {invoice.billingPeriod}</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="space-y-3">
                {invoice.roomPrice > 0 && (
                  <div className="flex justify-between text-xs sm:text-sm font-medium border-b border-outline-variant/10 pb-2">
                    <span className="text-on-surface-variant">Tiền thuê phòng</span>
                    <span className="font-bold">{invoice.roomPrice.toLocaleString('vi-VN')}đ</span>
                  </div>
                )}
                
                {invoice.electricityPrice > 0 && (
                  <div className="flex justify-between text-xs sm:text-sm font-medium border-b border-outline-variant/10 pb-2">
                    <span className="text-on-surface-variant">Tiền điện ({invoice.electricityUsage.split('(')[1]?.replace(')', '') || 'kWh'})</span>
                    <span className="font-bold">{invoice.electricityPrice.toLocaleString('vi-VN')}đ</span>
                  </div>
                )}

                {invoice.waterPrice > 0 && (
                  <div className="flex justify-between text-xs sm:text-sm font-medium border-b border-outline-variant/10 pb-2">
                    <span className="text-on-surface-variant">Tiền nước</span>
                    <span className="font-bold">{invoice.waterPrice.toLocaleString('vi-VN')}đ</span>
                  </div>
                )}

                {invoice.servicePrice > 0 && (
                  <div className="flex justify-between text-xs sm:text-sm font-medium pb-2">
                    <span className="text-on-surface-variant">{invoice.serviceDetails}</span>
                    <span className="font-bold">{invoice.servicePrice.toLocaleString('vi-VN')}đ</span>
                  </div>
                )}
              </div>

              <div className="border-t border-outline-variant/20 pt-4 flex justify-between items-baseline mb-2">
                <span className="text-sm font-bold text-primary">Tổng tiền thanh toán</span>
                <span className="text-xl font-bold text-primary">
                  {invoice.totalAmount.toLocaleString('vi-VN')} VNĐ
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
