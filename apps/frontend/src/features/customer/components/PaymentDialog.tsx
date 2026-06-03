import React, { useState } from 'react';
import { Invoice } from '../store/useInvoiceStore';
import { X, QrCode, CreditCard, Wallet, Copy, Check, Clock, Loader2, CheckCircle2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  invoice: Invoice | null;
  onClose: () => void;
  onSuccess: (method: 'qr' | 'wallet' | 'card') => void;
}

type TabType = 'qr' | 'wallet' | 'card';

export default function PaymentDialog({ isOpen, invoice, onClose, onSuccess }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>('qr');
  const [copiedField, setCopiedField] = useState<'stk' | 'ndck' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Card Form State
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  if (!isOpen || !invoice) return null;

  const handleCopy = (text: string, field: 'stk' | 'ndck') => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const startPaymentSimulation = (method: 'qr' | 'wallet' | 'card') => {
    setIsProcessing(true);
    // Simulate API delay
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      // Wait for success animation before calling callback
      setTimeout(() => {
        setIsSuccess(false);
        onSuccess(method);
      }, 2000);
    }, 1800);
  };

  const handleCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardNumber || !cardExpiry || !cardCvv) {
      alert('Vui lòng điền đầy đủ thông tin thẻ để thực hiện thanh toán!');
      return;
    }
    startPaymentSimulation('card');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-inverse-surface/60 backdrop-blur-sm p-4">
      {/* Modal Card */}
      <div className="bg-surface rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl border border-outline-variant/30 flex flex-col max-h-[90vh] animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20 bg-surface-container-low">
          <div>
            <h2 className="text-lg font-bold text-primary font-headline-md">Thanh toán hóa đơn</h2>
            <p className="text-xs text-on-surface-variant mt-0.5">Mã giao dịch: {invoice.id}</p>
          </div>
          <button 
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 hover:bg-surface-variant/50 rounded-full transition-colors cursor-pointer text-on-surface-variant"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Processing State Overlay */}
        {isProcessing && (
          <div className="p-12 flex flex-col items-center justify-center text-center space-y-4 flex-1">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <h3 className="font-bold text-lg text-primary">Đang kết nối cổng thanh toán...</h3>
            <p className="text-xs text-on-surface-variant max-w-sm">
              Vui lòng không tắt cửa sổ trình duyệt hoặc nhấn nút quay lại. Yêu cầu giao dịch đang được xử lý an toàn.
            </p>
          </div>
        )}

        {/* Success State Overlay */}
        {isSuccess && (
          <div className="p-12 flex flex-col items-center justify-center text-center space-y-4 flex-1">
            <div className="w-16 h-16 bg-status-success/10 text-status-success rounded-full flex items-center justify-center animate-bounce shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="font-bold text-xl text-status-success">Thanh toán thành công!</h3>
            <p className="text-sm text-on-surface-variant max-w-xs">
              Hóa đơn **{invoice.id}** đã được thanh toán hoàn tất. Hệ thống đang cập nhật hóa đơn của bạn.
            </p>
          </div>
        )}

        {/* Content Tabs & Panes */}
        {!isProcessing && !isSuccess && (
          <>
            {/* Tabs */}
            <div className="flex border-b border-outline-variant/20">
              {[
                { id: 'qr', label: 'CHUYỂN KHOẢN QR', icon: QrCode },
                { id: 'wallet', label: 'VÍ ĐIỆN TỬ', icon: Wallet },
                { id: 'card', label: 'THẺ NỘI ĐỊA/QT', icon: CreditCard },
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`flex-1 py-4 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border-b-4 transition-all cursor-pointer ${
                      isActive 
                        ? 'text-primary border-primary bg-primary/5' 
                        : 'text-on-surface-variant border-transparent hover:bg-surface-container-low/50'
                    }`}
                  >
                    <tab.icon className="w-4 h-4 shrink-0" />
                    <span className="hidden xs:inline">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Scrollable Container */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* QR Panel */}
              {activeTab === 'qr' && (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-6 items-center">
                    {/* QR graphic container */}
                    <div className="bg-white p-4 rounded-xl shadow-md border border-outline-variant/30 w-full max-w-[200px] flex-shrink-0 flex items-center justify-center">
                      <img 
                        alt="Vietcombank QR Code" 
                        className="w-full aspect-square" 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`Vietcombank | STK: 1012345678 | Chu TK: HOMESTAY DORM CO. | So tien: ${invoice.totalAmount} VNĐ | Noi dung: HOMESTAY ${invoice.id}`)}&color=334537&bgcolor=ffffff`}
                      />
                    </div>
                    
                    {/* Bank Transfer fields */}
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
                          title="Sao chép"
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
                          title="Sao chép"
                        >
                          {copiedField === 'ndck' ? <Check className="w-4 h-4 text-status-success" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-3.5 bg-status-warning/10 text-status-warning border border-status-warning/20 rounded-xl">
                    <Clock className="w-4 h-4 shrink-0 mt-0.5 animate-pulse" />
                    <p className="text-xs font-semibold leading-relaxed">
                      Lưu ý: Chuyển khoản đúng số tiền **{invoice.totalAmount.toLocaleString('vi-VN')}đ** và nội dung chuyển khoản để hệ thống tự động ghi nhận trong vòng 2-5 phút.
                    </p>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => startPaymentSimulation('qr')}
                      className="px-6 py-2.5 bg-primary hover:bg-[#253228] text-white text-sm font-bold rounded-lg shadow-md transition-all cursor-pointer"
                    >
                      Tôi đã chuyển khoản thành công
                    </button>
                  </div>
                </div>
              )}

              {/* Wallet Panel */}
              {activeTab === 'wallet' && (
                <div className="space-y-6 py-4">
                  <p className="text-xs text-on-surface-variant text-center mb-4 font-medium">
                    Vui lòng chọn ví điện tử để tiến hành quét mã thanh toán hóa đơn giá trị **{invoice.totalAmount.toLocaleString('vi-VN')}đ**.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => startPaymentSimulation('wallet')}
                      className="flex flex-col items-center gap-3 p-6 border-2 border-outline-variant/30 rounded-2xl hover:border-primary hover:bg-primary/5 active:scale-98 transition-all cursor-pointer group"
                    >
                      <div className="h-16 w-16 bg-[#A50064] rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-md group-hover:scale-105 transition-transform">
                        MoMo
                      </div>
                      <span className="font-bold text-sm text-on-surface">Ví điện tử MoMo</span>
                    </button>
                    <button 
                      onClick={() => startPaymentSimulation('wallet')}
                      className="flex flex-col items-center gap-3 p-6 border-2 border-outline-variant/30 rounded-2xl hover:border-primary hover:bg-primary/5 active:scale-98 transition-all cursor-pointer group"
                    >
                      <div className="h-16 w-16 bg-[#0081E0] rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-md group-hover:scale-105 transition-transform">
                        ZaloPay
                      </div>
                      <span className="font-bold text-sm text-on-surface">Ví điện tử ZaloPay</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Credit Card Form */}
              {activeTab === 'card' && (
                <form onSubmit={handleCardSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant mb-1">Số thẻ ngân hàng</label>
                    <input 
                      required
                      type="text" 
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').substring(0, 16))}
                      className="w-full border border-outline-variant/30 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary text-sm font-medium bg-surface-container-low" 
                      placeholder="4123 4567 8901 2345" 
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-on-surface-variant mb-1">Ngày hết hạn</label>
                      <input 
                        required
                        type="text" 
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value.substring(0, 5))}
                        className="w-full border border-outline-variant/30 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary text-sm font-medium bg-surface-container-low text-center" 
                        placeholder="MM/YY" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-on-surface-variant mb-1">CVV / CVC</label>
                      <input 
                        required
                        type="password" 
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').substring(0, 3))}
                        className="w-full border border-outline-variant/30 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary text-sm font-medium bg-surface-container-low text-center" 
                        placeholder="***" 
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <button 
                      type="submit" 
                      className="w-full py-3.5 bg-primary hover:bg-[#253228] text-white rounded-xl font-bold text-sm shadow-md transition-all active:scale-[0.98] cursor-pointer"
                    >
                      Xác nhận thanh toán {invoice.totalAmount.toLocaleString('vi-VN')}đ
                    </button>
                  </div>
                </form>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
