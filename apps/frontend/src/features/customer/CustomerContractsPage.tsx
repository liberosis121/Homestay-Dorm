import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, FileText, Printer, Download, CreditCard,
  Building2, ShieldCheck, AlertCircle,
  FileSignature, ClipboardList
} from 'lucide-react';
import CustomSelect from '../../components/ui/CustomSelect';
import { useAuthStore } from '../../stores/authStore';
import { fetchMyContracts } from './services/contract.service';

export interface ContractData {
  id: string;
  contractCode: string;
  signDate: string;
  startDate: string;
  endDate: string;
  duration: string;
  status: 'active' | 'expired' | 'terminated';
  statusLabel: string;
  // Room
  branch: string;
  roomCode: string;
  bedCode: string;
  roomType: string;
  roomImage: string;
  // Finance
  rentPrice: number;
  depositAmount: number;
  serviceFee: number;
  // Terms
  terms: string;
  paymentPolicy: string;
  terminationPolicy: string;
  // Timeline
  monthsPassed: number;
  totalMonths: number;
  remainingDays: number;
  managerName: string;
  managerPhone: string;
  managerImage: string;
}

export default function CustomerContractsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [contractsList, setContractsList] = useState<ContractData[]>([]);
  const [selectedContractId, setSelectedContractId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.email) {
      setLoading(true);
      fetchMyContracts(user.email)
        .then((data) => {
          setContractsList(data || []);
          if (data && data.length > 0) {
            setSelectedContractId(data[0].id);
          }
          setError(null);
        })
        .catch((err) => {
          console.error('Error fetching contracts:', err);
          setError(err.message || 'Không thể kết nối với máy chủ API');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="max-w-container-max mx-auto px-4 md:px-8 py-32 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="text-on-surface-variant font-semibold text-sm">Đang tải thông tin hợp đồng...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-container-max mx-auto px-4 md:px-8 py-16 space-y-6">
        <button
          type="button"
          onClick={() => navigate('/profile')}
          className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3.5 py-2 text-sm font-semibold text-primary/80 transition-all hover:border-primary/25 hover:bg-primary/10 hover:text-primary active:scale-[0.98] cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </button>
        <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center max-w-xl mx-auto space-y-4 shadow-sm">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto" />
          <h2 className="text-lg font-bold text-red-800">Không thể tải hợp đồng</h2>
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition active:scale-95 cursor-pointer shadow-sm"
          >
            Thử tải lại
          </button>
        </div>
      </div>
    );
  }

  if (contractsList.length === 0) {
    return (
      <div className="max-w-container-max mx-auto px-4 md:px-8 py-16 space-y-6">
        <button
          type="button"
          onClick={() => navigate('/profile')}
          className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3.5 py-2 text-sm font-semibold text-primary/80 transition-all hover:border-primary/25 hover:bg-primary/10 hover:text-primary active:scale-[0.98] cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </button>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-12 text-center max-w-xl mx-auto space-y-4 shadow-sm">
          <FileText className="w-16 h-16 text-primary/40 mx-auto" />
          <h2 className="text-xl font-bold text-primary">Không tìm thấy hợp đồng</h2>
          <p className="text-sm text-on-surface-variant max-w-md mx-auto">
            Hiện tại bạn chưa có hợp đồng thuê phòng nào được ký kết hoặc kích hoạt trong hệ thống. Vui lòng liên hệ nhân viên Sale để được hỗ trợ làm hợp đồng.
          </p>
        </div>
      </div>
    );
  }

  const contract = contractsList.find((c) => c.id === selectedContractId) || contractsList[0];

  const getStatusBadge = (status: 'active' | 'expired' | 'terminated') => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
            Đang hiệu lực
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f3f4f6] text-[#4b5563] text-xs font-bold border border-[#e5e7eb]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#9ca3af]"></span>
            Đã hết hạn
          </span>
        );
      case 'terminated':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-bold border border-red-200">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
            Đã thanh lý
          </span>
        );
    }
  };

  return (
    <div className="max-w-container-max mx-auto px-4 md:px-8 pt-0 pb-8 space-y-6 animate-fade-in-up">

      {/* Styles for animation */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .contract-document-preview {
          scrollbar-width: thin;
          scrollbar-color: rgba(74, 101, 73, 0.38) rgba(232, 225, 211, 0.45);
        }
        .contract-document-preview::-webkit-scrollbar {
          width: 6px;
        }
        .contract-document-preview::-webkit-scrollbar-track {
          background: rgba(232, 225, 211, 0.45);
          border-radius: 999px;
        }
        .contract-document-preview::-webkit-scrollbar-thumb {
          background: rgba(74, 101, 73, 0.42);
          border-radius: 999px;
        }
        .contract-document-preview::-webkit-scrollbar-thumb:hover {
          background: rgba(74, 101, 73, 0.62);
        }
      `}</style>

      {/* Page Header & Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#d1c4b9] pb-6">
        <div>
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3.5 py-2 text-sm font-semibold text-primary/80 transition-all hover:border-primary/25 hover:bg-primary/10 hover:text-primary active:scale-[0.98] cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </button>
          <h1 className="font-headline-lg text-2xl font-bold text-primary flex items-center gap-2 flex-wrap">
            <FileText className="w-7 h-7 text-primary" />
            Hợp đồng thuê phòng
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Xem chi tiết các điều khoản, thông tin phòng và tình trạng hợp đồng thuê của bạn.
          </p>
        </div>

        {/* Contract Dropdown Selector */}
        <div className="flex flex-col gap-1.5 shrink-0 sm:flex-row sm:items-center sm:gap-2">
          <span className="text-xs font-bold text-on-surface-variant uppercase">Chọn hợp đồng:</span>
          <CustomSelect
            value={selectedContractId}
            onChange={setSelectedContractId}
            options={contractsList.map((c) => ({
              value: c.id,
              label: `${c.contractCode} (${c.statusLabel} - ${c.branch})`,
            }))}
            className="w-full sm:w-[320px]"
            triggerClassName="rounded-xl border-outline-variant bg-white px-4 py-2 text-sm font-bold text-primary hover:bg-primary/5 active:scale-[0.99]"
            dropdownClassName="min-w-[320px]"
          />
        </div>
      </div>

      {/* Overview Card */}
      <section className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0 border border-primary/20">
            <FileSignature className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-on-surface-variant font-bold">Mã hợp đồng:</span>
              <span className="text-base font-extrabold text-primary font-mono">{contract.contractCode}</span>
            </div>
            <div className="mt-1">
              {getStatusBadge(contract.status)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:flex gap-6 md:gap-8 border-t md:border-t-0 pt-4 md:pt-0 border-[#eee7e1]">
          <div className="flex flex-col">
            <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Ngày ký</span>
            <span className="text-sm font-bold text-on-surface mt-0.5">{contract.signDate}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Ngày hiệu lực</span>
            <span className="text-sm font-bold text-on-surface mt-0.5">
              {contract.startDate} - {contract.endDate}
            </span>
          </div>
          <div className="flex flex-col col-span-2 md:col-span-1">
            <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Thời hạn</span>
            <span className="text-sm font-bold text-on-surface mt-0.5">{contract.duration}</span>
          </div>
        </div>
      </section>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (Main details) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Room Info */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 shadow-sm space-y-4 hover:shadow-md transition">
            <h3 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2 border-b border-[#eee7e1] pb-2">
              <Building2 className="w-5 h-5 text-primary" />
              Thông tin phòng thuê
            </h3>
            
            <div className="flex flex-col md:flex-row gap-6">
              <img
                src={contract.roomImage}
                alt={contract.roomCode}
                className="w-full md:w-52 h-36 object-cover rounded-2xl bg-surface-variant border border-outline-variant/50 shadow-sm"
              />
              <div className="grid grid-cols-2 gap-y-4 gap-x-6 grow">
                <div>
                  <p className="text-[10px] text-on-surface-variant uppercase font-semibold">Tên phòng / Mã phòng</p>
                  <p className="text-sm font-bold text-on-surface mt-0.5">{contract.roomCode}</p>
                </div>
                <div>
                  <p className="text-[10px] text-on-surface-variant uppercase font-semibold">Chi nhánh</p>
                  <p className="text-sm font-bold text-on-surface mt-0.5">{contract.branch}</p>
                </div>
                <div>
                  <p className="text-[10px] text-on-surface-variant uppercase font-semibold">Vị trí giường</p>
                  <span className="inline-flex items-center px-2 py-0.5 bg-primary/10 text-primary text-xs font-extrabold rounded-md mt-0.5 border border-primary/20">
                    {contract.bedCode}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] text-on-surface-variant uppercase font-semibold">Loại phòng</p>
                  <p className="text-sm font-bold text-on-surface mt-0.5">{contract.roomType}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Info */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 shadow-sm space-y-4 hover:shadow-md transition">
            <h3 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2 border-b border-[#eee7e1] pb-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Thông tin tài chính
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-surface rounded-2xl border border-outline-variant/30 hover:border-primary/30 transition">
                <p className="text-[10px] text-on-surface-variant uppercase font-semibold">Giá thuê hàng tháng</p>
                <p className="text-base font-extrabold text-primary mt-1">
                  {contract.rentPrice.toLocaleString('vi-VN')} VNĐ
                </p>
              </div>
              <div className="p-4 bg-surface rounded-2xl border border-outline-variant/30 hover:border-primary/30 transition">
                <p className="text-[10px] text-on-surface-variant uppercase font-semibold">Tiền đặt cọc cọc</p>
                <p className="text-base font-extrabold text-tertiary mt-1">
                  {contract.depositAmount.toLocaleString('vi-VN')} VNĐ
                </p>
              </div>
              <div className="p-4 bg-surface rounded-2xl border border-outline-variant/30 hover:border-primary/30 transition">
                <p className="text-[10px] text-on-surface-variant uppercase font-semibold">Phí dịch vụ cố định</p>
                <p className="text-base font-extrabold text-on-surface-variant mt-1">
                  {contract.serviceFee.toLocaleString('vi-VN')} VNĐ
                </p>
              </div>
            </div>
          </div>

          {/* Contract Legal Text */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 shadow-sm space-y-4 hover:shadow-md transition">
            <div className="flex justify-between items-center border-b border-[#eee7e1] pb-2 flex-wrap gap-2">
              <h3 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                Điều khoản hợp đồng thuê
              </h3>
              <span className="text-[10px] text-on-surface-variant italic font-semibold">Văn bản pháp lý có hiệu lực</span>
            </div>
            
            <div className="bg-surface border border-outline-variant/60 rounded-2xl p-5 h-87.5 overflow-y-auto custom-scrollbar font-body-md text-on-surface leading-relaxed text-sm space-y-4">
              <div className="max-w-prose mx-auto">
                <h4 className="font-extrabold text-center text-on-surface tracking-wide">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h4>
                <p className="text-center font-bold text-xs text-on-surface-variant mt-0.5">Độc lập - Tự do - Hạnh phúc</p>
                
                <div className="h-px bg-outline-variant/50 my-5"></div>
                
                <h5 className="font-bold text-primary uppercase mt-4 flex items-center gap-1.5">
                  <span className="w-1.5 h-3 bg-primary rounded-full"></span>
                  ĐIỀU 1: ĐỐI TƯỢNG HỢP ĐỒNG
                </h5>
                <p className="text-on-surface/90 pl-3 mt-1.5 text-xs">
                  {contract.terms}
                </p>
                
                <h5 className="font-bold text-primary uppercase mt-5 flex items-center gap-1.5">
                  <span className="w-1.5 h-3 bg-primary rounded-full"></span>
                  ĐIỀU 2: GIÁ THUÊ VÀ THANH TOÁN
                </h5>
                <p className="text-on-surface/90 pl-3 mt-1.5 text-xs">
                  {contract.paymentPolicy}
                </p>
                
                <h5 className="font-bold text-primary uppercase mt-5 flex items-center gap-1.5">
                  <span className="w-1.5 h-3 bg-primary rounded-full"></span>
                  ĐIỀU 3: TRÁCH NHIỆM BẢO QUẢN TÀI SẢN
                </h5>
                <p className="text-on-surface/90 pl-3 mt-1.5 text-xs">
                  Bên B có trách nhiệm bảo quản và giữ gìn các tài sản, trang thiết bị đi kèm giường thuê. Mọi hư hỏng do lỗi chủ quan phải bồi thường theo thời giá thị trường. Không tự ý đóng đinh, đục khoét tường hoặc thay đổi vị trí giường/tủ cá nhân.
                </p>
                
                <h5 className="font-bold text-primary uppercase mt-5 flex items-center gap-1.5">
                  <span className="w-1.5 h-3 bg-primary rounded-full"></span>
                  ĐIỀU 4: NỘI QUY CHUNG & CHẤM DỨT HỢP ĐỒNG
                </h5>
                <p className="text-on-surface/90 pl-3 mt-1.5 text-xs">
                  {contract.terminationPolicy} Tuân thủ nghiêm ngặt giờ giấc sinh hoạt tập thể, nội quy phòng chống cháy nổ và bảo đảm vệ sinh chung.
                </p>
                
                <p className="mt-8 italic text-on-surface-variant text-[11px] text-center">--- Văn bản lưu trữ nội bộ HomeStay Dorm ---</p>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column (Sidebar widgets) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Progress Timeline Widget */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 shadow-sm hover:shadow-md transition space-y-4">
            <h3 className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-1.5 border-b border-[#eee7e1] pb-2">
              Tiến độ hợp đồng
            </h3>

            {contract.status === 'active' ? (
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="text-2xl font-extrabold text-primary">
                      {contract.monthsPassed}/{contract.totalMonths}
                    </span>
                    <span className="text-[10px] text-on-surface-variant font-medium">tháng đã trôi qua</span>
                  </div>
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                    {Math.round((contract.monthsPassed / contract.totalMonths) * 100)}%
                  </span>
                </div>
                
                {/* Progress bar */}
                <div className="w-full bg-surface-container h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-500"
                    style={{ width: `${(contract.monthsPassed / contract.totalMonths) * 100}%` }}
                  ></div>
                </div>

                <div className="pt-3 border-t border-[#eee7e1] space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Số ngày còn lại:</span>
                    <strong className="text-primary">{contract.remainingDays} ngày</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Ngày hết hạn:</span>
                    <span className="font-semibold text-on-surface">{contract.endDate}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-on-surface-variant space-y-2">
                <AlertCircle className="w-10 h-10 text-on-surface-variant/40 mx-auto" />
                <p className="font-bold text-sm text-on-surface">Hợp đồng không còn hoạt động</p>
                <p className="text-xs">Hợp đồng này đã hết hạn hiệu lực hoặc đã được thực hiện thanh lý xong.</p>
              </div>
            )}
          </div>

          {/* Action Card */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 shadow-sm hover:shadow-md transition space-y-3">
            <h3 className="text-xs font-bold text-primary uppercase tracking-widest border-b border-[#eee7e1] pb-2">
              Hành động nhanh
            </h3>
            
            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => window.print()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-primary text-primary font-bold text-xs rounded-xl hover:bg-primary/5 transition active:scale-95 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Tải xuống PDF Hợp đồng
              </button>
              <button
                onClick={() => window.print()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white font-bold text-xs rounded-xl hover:bg-[#334537] transition active:scale-95 cursor-pointer shadow-sm"
              >
                <Printer className="w-4 h-4" />
                In bản hợp đồng
              </button>
              {contract.status === 'active' && (
                <button
                  onClick={() => navigate('/customer/checkout-request', { state: { contractId: contract.id } })}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#b87d4b] hover:bg-[#9c663b] text-white font-bold text-xs rounded-xl transition active:scale-95 cursor-pointer shadow-sm"
                >
                  <ClipboardList className="w-4 h-4" />
                  Đăng ký trả phòng
                </button>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
