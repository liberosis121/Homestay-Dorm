import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useCheckoutStore, CheckoutRequest } from './store/useCheckoutStore';
import { CheckoutForm } from './components/CheckoutForm';
import { CheckoutTimeline } from './components/CheckoutTimeline';
import { MOCK_CONTRACTS, ContractData } from './CustomerContractsPage';
import {
  FileText,
  Calendar,
  Info,
  History,
  AlertTriangle,
  ShieldCheck,
  HelpCircle,
  ArrowLeft,
  ClipboardList,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  X,
  Trash2,
} from 'lucide-react';

const mapContractToRentInfo = (c: ContractData) => ({
  branchName: c.branch,
  roomName: `Phòng ${c.roomCode} (${c.roomType})`,
  bedName: `Giường ${c.bedCode}`,
  contractId: c.contractCode,
  depositAmount: c.depositAmount,
  dueDate: c.endDate,
});

const getStatusConfig = (status: CheckoutRequest['status']) => {
  switch (status) {
    case 'submitted':
      return { label: 'Đã gửi – Chờ xử lý', cls: 'bg-blue-50 text-blue-700 border-blue-200', icon: Clock };
    case 'inventory_checking':
      return { label: 'Đang kiểm kê phòng', cls: 'bg-amber-50 text-amber-700 border-amber-200', icon: Loader2 };
    case 'accounting_matching':
      return { label: 'Đang đối soát công nợ', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: Loader2 };
    case 'refunding':
      return { label: 'Đang hoàn cọc', cls: 'bg-primary/10 text-primary border-primary/20', icon: Loader2 };
    case 'completed':
      return { label: 'Hoàn tất', cls: 'bg-status-success/10 text-status-success border-status-success/20', icon: CheckCircle2 };
    case 'rejected':
      return { label: 'Bị từ chối', cls: 'bg-error-container text-error border-error/20', icon: XCircle };
    default:
      return { label: 'Không rõ', cls: 'bg-surface-container text-on-surface-variant border-outline-variant', icon: Info };
  }
};

export const CustomerCheckoutPage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const stateContractId = location.state?.contractId;
  const { requests, submitRequest, cancelRequest } = useCheckoutStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Lọc danh sách hợp đồng hợp lệ để trả phòng
  const eligibleContracts = MOCK_CONTRACTS.filter(c => c.status === 'active' || c.status === 'expired');

  const selectedContract =
    eligibleContracts.find(c => c.id === stateContractId) ||
    eligibleContracts.find(c => c.status === 'active') ||
    eligibleContracts[0];

  const currentRentInfo = selectedContract
    ? mapContractToRentInfo(selectedContract)
    : { branchName: 'Chưa chọn', roomName: 'Chưa chọn', bedName: 'Chưa chọn', contractId: 'Chưa chọn', depositAmount: 0, dueDate: '' };

  const currentUserId = user?.id || 'u-5';
  const currentUserName = user?.full_name || 'Lê Lâm Trí Đức';

  const userRequests = requests.filter(r => r.customerId === currentUserId);

  // Yêu cầu đang hoạt động
  const activeRequest = userRequests.find(r => r.status !== 'completed' && r.status !== 'rejected');

  // Lịch sử: chỉ rejected (đã bị từ chối)
  const historyRequests = userRequests.filter(r => r.status === 'completed' || r.status === 'rejected');

  const contractForActiveRequest = activeRequest
    ? MOCK_CONTRACTS.find(c => c.contractCode === activeRequest.contractId)
    : null;

  const displayedDueDate = activeRequest
    ? contractForActiveRequest?.endDate || ''
    : currentRentInfo.dueDate;

  const displayedInfo = activeRequest
    ? { branchName: activeRequest.branchName, roomName: activeRequest.roomName, bedName: activeRequest.bedName, contractId: activeRequest.contractId, depositAmount: activeRequest.depositAmount }
    : currentRentInfo;

  const handleFormSubmit = (formData: any) => {
    setIsSubmitting(true);
    setTimeout(() => {
      submitRequest({
        customerId: currentUserId,
        customerName: currentUserName,
        branchName: currentRentInfo.branchName,
        roomName: currentRentInfo.roomName,
        bedName: currentRentInfo.bedName,
        contractId: currentRentInfo.contractId,
        depositAmount: currentRentInfo.depositAmount,
        ...formData,
      });
      setIsSubmitting(false);
    }, 1200);
  };

  const activeStatusCfg = activeRequest ? getStatusConfig(activeRequest.status) : null;
  const ActiveIcon = activeStatusCfg?.icon || Info;

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-8 pb-12">

      {/* HEADER – giống InvoicesDashboardPage */}
      <header className="mb-8">
        <button
          type="button"
          onClick={() => navigate('/profile')}
          className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3.5 py-2 text-sm font-semibold text-primary/80 transition-all hover:border-primary/25 hover:bg-primary/10 hover:text-primary active:scale-[0.98] cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </button>
        <h1 className="text-3xl font-bold font-headline-lg text-primary mb-2">Đăng ký trả phòng</h1>
        <p className="text-on-surface-variant font-body-md text-[15px]">
          Gửi yêu cầu trả phòng, theo dõi quy trình kiểm kê và nhận lại tiền cọc sau khi hợp đồng kết thúc.
        </p>
      </header>

      {/* KPI CARDS */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 shadow-sm hover:translate-y-[-3px] transition-transform duration-300">
          <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-3">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Tiền cọc</h3>
          <p className="text-2xl font-bold text-primary">
            {displayedInfo.depositAmount > 0 ? displayedInfo.depositAmount.toLocaleString('vi-VN') : '—'}
            {displayedInfo.depositAmount > 0 && <span className="text-sm font-medium text-on-surface-variant ml-1">VNĐ</span>}
          </p>
          <p className="text-xs text-on-surface-variant mt-1">Hoàn sau khi trừ công nợ</p>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 shadow-sm hover:translate-y-[-3px] transition-transform duration-300">
          <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-3">
            <FileText className="w-5 h-5" />
          </div>
          <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Hợp đồng</h3>
          <p className="text-xl font-bold text-on-surface">
            {displayedInfo.contractId !== 'Chưa chọn' ? displayedInfo.contractId : '—'}
          </p>
          <div className="flex items-center gap-1 text-xs text-on-surface-variant mt-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>{displayedDueDate ? `Hết hạn: ${displayedDueDate}` : 'Chưa xác định'}</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 shadow-sm hover:translate-y-[-3px] transition-transform duration-300">
          <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-3">
            <Info className="w-5 h-5" />
          </div>
          <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Trạng thái</h3>
          {activeRequest && activeStatusCfg ? (
            <>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${activeStatusCfg.cls}`}>
                <ActiveIcon className="w-3 h-3" />
                {activeStatusCfg.label}
              </span>
              <p className="text-[11px] text-on-surface-variant mt-1.5">Mã: {activeRequest.id}</p>
            </>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border bg-surface-container text-on-surface-variant border-outline-variant">
              Chưa có yêu cầu
            </span>
          )}
        </div>
      </section>

      {/* NỘI DUNG CHÍNH */}
      <div className="space-y-6">
        {activeRequest ? (
          // TIẾN TRÌNH XỬ LÝ
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                Tiến độ xử lý trả phòng
              </h2>
            </div>

            <CheckoutTimeline
              status={activeRequest.status}
              rejectReason={activeRequest.rejectReason}
            />

            {/* CHI TIẾT ĐƠN */}
            <div className="bg-surface-container-lowest rounded-24 border border-outline-variant/40 shadow-sm p-6 space-y-5">
              <h3 className="text-sm font-bold text-on-surface border-b border-outline-variant/40 pb-3 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-primary" />
                Chi tiết đơn yêu cầu – {activeRequest.id}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm">
                <div>
                  <span className="block text-xs text-on-surface-variant mb-0.5">Ngày dự kiến trả phòng</span>
                  <span className="font-semibold text-on-surface">
                    {new Date(activeRequest.expectedDate).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                <div>
                  <span className="block text-xs text-on-surface-variant mb-0.5">Lý do trả phòng</span>
                  <span className="font-semibold text-on-surface">{activeRequest.reason}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="block text-xs text-on-surface-variant mb-0.5">Ghi chú thêm</span>
                  <span className="text-on-surface">{activeRequest.note || 'Không có ghi chú.'}</span>
                </div>
                <div className="sm:col-span-2 border-t border-outline-variant/30 pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <span className="block text-xs text-on-surface-variant mb-0.5">Ngân hàng hoàn cọc</span>
                    <span className="font-bold text-on-surface">{activeRequest.bankName}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-on-surface-variant mb-0.5">Số tài khoản</span>
                    <span className="font-bold text-on-surface">{activeRequest.bankAccount}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-on-surface-variant mb-0.5">Chủ tài khoản</span>
                    <span className="font-bold text-on-surface">{activeRequest.bankOwner}</span>
                  </div>
                </div>
              </div>

              {/* NÚT HỦY YÊU CẦU – nổi bật, để ở cuối detail card */}
              {activeRequest.status === 'submitted' && (
                <div className="pt-4 border-t border-outline-variant/40">
                  <div className="bg-error-container/30 border border-error/15 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-error">Hủy yêu cầu trả phòng</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        Chỉ có thể hủy khi đơn đang ở trạng thái "Đã gửi". Sau khi hủy, bạn có thể gửi lại yêu cầu mới.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowCancelConfirm(true)}
                      className="inline-flex items-center gap-2 bg-error hover:bg-error/90 text-white font-semibold text-sm px-5 py-2.5 rounded-full transition whitespace-nowrap cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                      Hủy yêu cầu
                    </button>
                  </div>
                </div>
              )}

              {activeRequest.status === 'rejected' && (
                <div className="pt-4 border-t border-outline-variant/40 flex justify-end">
                  <button
                    onClick={() => cancelRequest(activeRequest.id)}
                    className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-on-primary font-semibold text-sm px-5 py-2.5 rounded-full transition cursor-pointer"
                  >
                    <ClipboardList className="w-4 h-4" />
                    Tạo yêu cầu mới
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : eligibleContracts.length === 0 ? (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-on-surface">
              Đơn đăng ký trả phòng
            </h2>
            <div className="bg-surface-container-lowest rounded-24 border border-outline-variant/40 shadow-sm p-6">
              <p className="text-sm text-error font-medium bg-error-container/30 border border-error/20 p-4 rounded-xl">
                Bạn không có hợp đồng nào đang hoạt động để đăng ký trả phòng.
              </p>
            </div>
          </div>
        ) : (
          // FORM ĐĂNG KÝ MỚI
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-on-surface">
              Đơn đăng ký trả phòng
            </h2>
            <CheckoutForm
              currentInfo={currentRentInfo}
              onSubmit={handleFormSubmit}
              isLoading={isSubmitting}
            />
          </div>
        )}

        {/* NÚT XEM LỊCH SỬ */}
        {historyRequests.length > 0 && (
          <div className="pt-2">
            <button
              onClick={() => setShowHistory(true)}
              className="inline-flex items-center gap-2.5 rounded-full border border-outline-variant bg-surface-container-lowest px-5 py-2.5 text-sm font-semibold text-on-surface-variant transition-all hover:border-primary/30 hover:text-primary hover:bg-primary/5 cursor-pointer"
            >
              <History className="w-4 h-4" />
              Xem lịch sử yêu cầu
              <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center">
                {historyRequests.length}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* MODAL LỊCH SỬ */}
      {showHistory && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
          onClick={(e) => { if (e.target === e.currentTarget) setShowHistory(false); }}
        >
          <div className="bg-surface w-full max-w-lg rounded-32 shadow-2xl border border-surface-variant overflow-hidden animate-fade-in-up max-h-[80vh] flex flex-col">
            {/* Header modal */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-outline-variant/40 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <History className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-on-surface">Lịch sử yêu cầu</h3>
                  <p className="text-xs text-on-surface-variant">Các đơn đã hoàn tất hoặc bị từ chối</p>
                </div>
              </div>
              <button
                onClick={() => setShowHistory(false)}
                className="p-2 rounded-full hover:bg-surface-container-low text-on-surface-variant hover:text-on-surface transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body modal */}
            <div className="overflow-y-auto p-4 space-y-3">
              {historyRequests.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
                    <HelpCircle className="w-6 h-6" />
                  </div>
                  <p className="text-sm text-on-surface-variant font-medium">Chưa có lịch sử yêu cầu.</p>
                </div>
              ) : (
                historyRequests.map((req) => {
                  const cfg = getStatusConfig(req.status);
                  const ReqIcon = cfg.icon;
                  return (
                    <div
                      key={req.id}
                      className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 p-4 hover:border-outline-variant transition-all"
                    >
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-sm font-bold text-on-surface">{req.id}</span>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${cfg.cls}`}>
                          <ReqIcon className="w-3 h-3" />
                          {cfg.label}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs text-on-surface-variant">
                        <p className="flex justify-between">
                          <span>Phòng</span>
                          <span className="text-on-surface font-semibold">{req.roomName}</span>
                        </p>
                        <p className="flex justify-between">
                          <span>Ngày gửi</span>
                          <span className="text-on-surface">{new Date(req.createdAt).toLocaleDateString('vi-VN')}</span>
                        </p>
                        <p className="flex justify-between">
                          <span>Ngày trả dự kiến</span>
                          <span className="text-on-surface">{new Date(req.expectedDate).toLocaleDateString('vi-VN')}</span>
                        </p>
                        <p className="flex justify-between">
                          <span>Hoàn cọc</span>
                          <span className="text-primary font-semibold">{req.depositAmount.toLocaleString('vi-VN')} VNĐ</span>
                        </p>
                      </div>

                      {req.rejectReason && req.status === 'rejected' && (
                        <div className="mt-3 pt-3 border-t border-error/10 bg-error-container/20 rounded-xl p-3 text-[11px] text-error">
                          <p className="font-bold flex items-center gap-1 mb-0.5">
                            <AlertTriangle className="w-3 h-3 shrink-0" />
                            Lý do từ chối:
                          </p>
                          <p className="leading-relaxed">{req.rejectReason}</p>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL XÁC NHẬN HỦY */}
      {showCancelConfirm && activeRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface w-full max-w-sm rounded-32 shadow-2xl border border-surface-variant p-6 space-y-5 animate-fade-in-up">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-error-container rounded-full flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-error" />
              </div>
              <div>
                <h3 className="font-bold text-on-surface mb-1">Xác nhận hủy yêu cầu</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  Bạn có chắc chắn muốn hủy yêu cầu trả phòng <span className="font-bold text-on-surface">{activeRequest.id}</span> không? Hành động này không thể hoàn tác.
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="px-5 py-2.5 rounded-full border border-outline-variant text-on-surface-variant text-sm font-semibold hover:bg-surface-container-low transition cursor-pointer"
              >
                Giữ lại
              </button>
              <button
                onClick={() => {
                  cancelRequest(activeRequest.id);
                  setShowCancelConfirm(false);
                }}
                className="px-5 py-2.5 rounded-full bg-error hover:bg-error/90 text-white text-sm font-semibold transition cursor-pointer"
              >
                Hủy yêu cầu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerCheckoutPage;
