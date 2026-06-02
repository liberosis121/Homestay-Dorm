import React, { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useCheckoutStore, CheckoutRequest } from './store/useCheckoutStore';
import { CheckoutForm } from './components/CheckoutForm';
import { CheckoutTimeline } from './components/CheckoutTimeline';
import { 
  FileText, 
  Calendar, 
  Info, 
  History, 
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  HelpCircle
} from 'lucide-react';

const MOCK_CURRENT_RENT = {
  branchName: 'Chi nhánh Quận 1',
  roomName: 'Phòng 101 (Nam)',
  bedName: 'Giường A1',
  contractId: 'HĐ-2025-0045',
  depositAmount: 3000000,
  dueDate: '2026-12-31',
};

export const CustomerCheckoutPage: React.FC = () => {
  const { user } = useAuthStore();
  const { requests, submitRequest, cancelRequest, updateRequestStatus } = useCheckoutStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [demoRejectReason, setDemoRejectReason] = useState('Chưa thanh toán hết hóa đơn tiền điện tháng 05/2026 (còn nợ 350.000đ).');

  // Lấy danh sách yêu cầu của user hiện tại (mặc định là u-5 nếu chưa đăng nhập)
  const currentUserId = user?.id || 'u-5';
  const currentUserName = user?.full_name || 'Lê Lâm Trí Đức';
  
  const userRequests = requests.filter(r => r.customerId === currentUserId);
  
  // Yêu cầu đang hoạt động (chưa hoàn tất)
  const activeRequest = userRequests.find(r => r.status !== 'completed');

  // Xử lý gửi đơn mới
  const handleFormSubmit = (formData: any) => {
    setIsSubmitting(true);
    // Giả lập gửi lên server mất 1.2s
    setTimeout(() => {
      submitRequest({
        customerId: currentUserId,
        customerName: currentUserName,
        branchName: MOCK_CURRENT_RENT.branchName,
        roomName: MOCK_CURRENT_RENT.roomName,
        bedName: MOCK_CURRENT_RENT.bedName,
        contractId: MOCK_CURRENT_RENT.contractId,
        depositAmount: MOCK_CURRENT_RENT.depositAmount,
        ...formData,
      });
      setIsSubmitting(false);
    }, 1200);
  };

  // Trả về badge màu sắc cho trạng thái yêu cầu
  const getStatusBadge = (status: CheckoutRequest['status']) => {
    switch (status) {
      case 'submitted':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-100">Đã gửi</span>;
      case 'inventory_checking':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-100">Đang kiểm kê</span>;
      case 'accounting_matching':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">Đang đối soát</span>;
      case 'refunding':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-50 text-green-700 border border-green-100">Đang hoàn cọc</span>;
      case 'completed':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 border border-green-200">Hoàn tất</span>;
      case 'rejected':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-50 text-red-700 border border-red-100">Bị từ chối</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* TIÊU ĐỀ TRANG */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#334537] tracking-tight">
            Đăng ký trả phòng & Hoàn cọc
          </h1>
          <p className="text-sm text-[#8c9a8e] mt-1">
            Gửi yêu cầu trả phòng, kiểm kê tài sản và nhận lại tiền cọc hợp đồng trực tuyến.
          </p>
        </div>
      </div>

      {/* CHẾ ĐỘ DEMO GIẢ LẬP TRẠNG THÁI (Chỉ xuất hiện khi có yêu cầu đang chờ xử lý) */}
      {activeRequest && (
        <div className="bg-[#f5f2eb] border border-[#ecebe6] rounded-3xl p-5 md:p-6 space-y-4">
          <div className="flex items-center gap-2 text-[#334537]">
            <Sparkles className="w-5 h-5 text-[#b87d4b]" />
            <h4 className="font-semibold text-sm">Thanh công cụ Demo Trạng thái xử lý (Nhân viên/Kế toán)</h4>
          </div>
          <p className="text-xs text-[#8c9a8e]">
            Bạn đang có yêu cầu trả phòng mã <span className="font-bold text-[#334537]">{activeRequest.id}</span>. Nhấp vào các nút dưới đây để giả lập quy trình duyệt đơn của các bộ phận liên quan:
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={() => updateRequestStatus(activeRequest.id, 'submitted')}
              className={`px-3 py-2 text-xs font-semibold rounded-xl border transition ${
                activeRequest.status === 'submitted'
                  ? 'bg-[#334537] text-white border-[#334537]'
                  : 'bg-white text-[#334537] border-[#ecebe6] hover:bg-[#faf9f6]'
              }`}
            >
              1. Gửi đơn
            </button>
            <button
              onClick={() => updateRequestStatus(activeRequest.id, 'inventory_checking')}
              className={`px-3 py-2 text-xs font-semibold rounded-xl border transition ${
                activeRequest.status === 'inventory_checking'
                  ? 'bg-[#334537] text-white border-[#334537]'
                  : 'bg-white text-[#334537] border-[#ecebe6] hover:bg-[#faf9f6]'
              }`}
            >
              2. Kiểm kê phòng
            </button>
            <button
              onClick={() => updateRequestStatus(activeRequest.id, 'accounting_matching')}
              className={`px-3 py-2 text-xs font-semibold rounded-xl border transition ${
                activeRequest.status === 'accounting_matching'
                  ? 'bg-[#334537] text-white border-[#334537]'
                  : 'bg-white text-[#334537] border-[#ecebe6] hover:bg-[#faf9f6]'
              }`}
            >
              3. Đối soát nợ
            </button>
            <button
              onClick={() => updateRequestStatus(activeRequest.id, 'refunding')}
              className={`px-3 py-2 text-xs font-semibold rounded-xl border transition ${
                activeRequest.status === 'refunding'
                  ? 'bg-[#334537] text-white border-[#334537]'
                  : 'bg-white text-[#334537] border-[#ecebe6] hover:bg-[#faf9f6]'
              }`}
            >
              4. Chờ hoàn cọc
            </button>
            <button
              onClick={() => updateRequestStatus(activeRequest.id, 'completed')}
              className="px-3 py-2 text-xs font-semibold rounded-xl border bg-green-50 hover:bg-green-100 text-green-700 border-green-200 transition"
            >
              5. Hoàn tất (Đóng yêu cầu)
            </button>
            <button
              onClick={() => updateRequestStatus(activeRequest.id, 'rejected', demoRejectReason)}
              className="px-3 py-2 text-xs font-semibold rounded-xl border bg-red-50 hover:bg-red-100 text-red-700 border-red-200 transition"
            >
              Từ chối (Từ chối duyệt)
            </button>
          </div>
          {activeRequest.status === 'rejected' && (
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-3">
              <span className="text-xs text-[#8c9a8e] shrink-0 font-medium">Lý do từ chối mẫu để test:</span>
              <input
                type="text"
                value={demoRejectReason}
                onChange={(e) => setDemoRejectReason(e.target.value)}
                placeholder="Nhập lý do bị từ chối để test..."
                className="flex-1 bg-white border border-[#ecebe6] text-xs text-[#334537] rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#8c9a8e]"
              />
            </div>
          )}
        </div>
      )}

      {/* KHU VỰC WIDGETS KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Thẻ 1: Tiền đặt cọc */}
        <div className="bg-white rounded-3xl border border-[#ecebe6] shadow-sm p-6 flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#faf9f6] flex items-center justify-center text-[#b87d4b] border border-[#ecebe6] shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-[#8c9a8e] font-semibold uppercase tracking-wider">Tiền cọc giữ chỗ</p>
            <p className="text-2xl font-bold text-[#b87d4b]">{MOCK_CURRENT_RENT.depositAmount.toLocaleString('vi-VN')} VNĐ</p>
            <p className="text-xs text-[#8c9a8e] mt-1">Sẽ được hoàn sau khi trừ các công nợ phát sinh.</p>
          </div>
        </div>

        {/* Thẻ 2: Hợp đồng & Thời hạn */}
        <div className="bg-white rounded-3xl border border-[#ecebe6] shadow-sm p-6 flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#faf9f6] flex items-center justify-center text-[#334537] border border-[#ecebe6] shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-[#8c9a8e] font-semibold uppercase tracking-wider">Hợp đồng hiện tại</p>
            <p className="text-lg font-bold text-[#334537]">{MOCK_CURRENT_RENT.contractId}</p>
            <div className="flex items-center gap-1.5 text-xs text-[#8c9a8e] mt-0.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Hết hạn: {new Date(MOCK_CURRENT_RENT.dueDate).toLocaleDateString('vi-VN')}</span>
            </div>
          </div>
        </div>

        {/* Thẻ 3: Trạng thái yêu cầu */}
        <div className="bg-white rounded-3xl border border-[#ecebe6] shadow-sm p-6 flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#faf9f6] flex items-center justify-center text-[#334537] border border-[#ecebe6] shrink-0">
            <Info className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-[#8c9a8e] font-semibold uppercase tracking-wider">Trạng thái yêu cầu</p>
            <div className="pt-1">
              {activeRequest ? (
                <div className="flex flex-col gap-1">
                  <div>{getStatusBadge(activeRequest.status)}</div>
                  <span className="text-[10px] text-[#8c9a8e] font-medium">Mã đơn: {activeRequest.id}</span>
                </div>
              ) : (
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-50 text-gray-500 border border-gray-200">
                  Chưa gửi yêu cầu
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* BỐ CỤC CHÍNH (2 CỘT) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* CỘT CHÍNH (FORM HOẶC TIMELINE TIẾN ĐỘ) */}
        <div className="lg:col-span-2 space-y-8">
          {activeRequest ? (
            /* HIỂN THỊ TIẾN TRÌNH XỬ LÝ (TIMELINE) */
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-[#334537] flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-600 animate-ping" />
                  Tiến độ xử lý trả phòng
                </h2>
                {activeRequest.status === 'submitted' && (
                  <button
                    onClick={() => {
                      if (window.confirm('Bạn có chắc chắn muốn hủy yêu cầu trả phòng này không?')) {
                        cancelRequest(activeRequest.id);
                      }
                    }}
                    className="text-xs font-bold text-red-600 hover:text-red-700 underline focus:outline-none"
                  >
                    Hủy yêu cầu
                  </button>
                )}
              </div>

              <CheckoutTimeline 
                status={activeRequest.status} 
                rejectReason={activeRequest.rejectReason} 
              />

              {/* TÓM TẮT ĐƠN ĐANG XỬ LÝ */}
              <div className="bg-white rounded-3xl border border-[#ecebe6] p-6 space-y-6">
                <h3 className="text-md font-bold text-[#334537] pb-3 border-b border-[#ecebe6]">
                  Chi tiết đơn yêu cầu đang hoạt động ({activeRequest.id})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm">
                  <div>
                    <span className="text-[#8c9a8e] block text-xs">Ngày dự kiến trả phòng</span>
                    <span className="font-semibold text-[#334537]">
                      {new Date(activeRequest.expectedDate).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#8c9a8e] block text-xs">Lý do chính</span>
                    <span className="font-semibold text-[#334537]">{activeRequest.reason}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-[#8c9a8e] block text-xs">Ghi chú thêm</span>
                    <span className="text-[#334537]">{activeRequest.note || 'Không có ghi chú.'}</span>
                  </div>
                  <div className="sm:col-span-2 border-t border-[#faf9f6] pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <span className="text-[#8c9a8e] block text-xs">Tài khoản nhận hoàn cọc</span>
                      <span className="font-bold text-[#334537]">{activeRequest.bankName}</span>
                    </div>
                    <div>
                      <span className="text-[#8c9a8e] block text-xs">Số tài khoản</span>
                      <span className="font-bold text-[#334537]">{activeRequest.bankAccount}</span>
                    </div>
                    <div>
                      <span className="text-[#8c9a8e] block text-xs">Chủ tài khoản</span>
                      <span className="font-bold text-[#334537]">{activeRequest.bankOwner}</span>
                    </div>
                  </div>
                </div>

                {activeRequest.status === 'rejected' && (
                  <div className="pt-4 border-t border-[#ecebe6] flex justify-end">
                    <button
                      onClick={() => cancelRequest(activeRequest.id)}
                      className="bg-[#334537] hover:bg-[#253228] text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition duration-200"
                    >
                      Tạo yêu cầu mới
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* HIỂN THỊ FORM ĐĂNG KÝ MỚI */
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-[#334537] flex items-center gap-2">
                <span className="w-1.5 h-5 bg-[#334537] rounded-full" />
                Đơn đăng ký trả phòng & Nhận lại cọc
              </h2>
              <CheckoutForm 
                currentInfo={MOCK_CURRENT_RENT} 
                onSubmit={handleFormSubmit} 
                isLoading={isSubmitting} 
              />
            </div>
          )}
        </div>

        {/* CỘT PHỤ (LỊCH SỬ CÁC YÊU CẦU CŨ) */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-[#334537] flex items-center gap-2">
            <History className="w-5 h-5 text-[#8c9a8e]" />
            Lịch sử yêu cầu
          </h2>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
            {userRequests.length === 0 ? (
              <div className="bg-white rounded-3xl border border-[#ecebe6] p-8 text-center space-y-3">
                <HelpCircle className="w-10 h-10 text-[#8c9a8e] mx-auto opacity-60" />
                <p className="text-sm text-[#8c9a8e] font-medium">Bạn chưa từng gửi yêu cầu trả phòng nào.</p>
              </div>
            ) : (
              userRequests.map((req) => (
                <div 
                  key={req.id} 
                  className={`bg-white rounded-2xl border border-[#ecebe6] p-5 shadow-sm transition hover:border-[#8c9a8e]/50 ${
                    activeRequest?.id === req.id ? 'ring-2 ring-[#334537]/20 border-[#334537]' : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#334537]">{req.id}</span>
                    <div>{getStatusBadge(req.status)}</div>
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs text-[#8c9a8e] font-medium">
                    <p className="flex justify-between">
                      <span>Phòng:</span> 
                      <span className="text-[#334537] font-semibold">{req.roomName}</span>
                    </p>
                    <p className="flex justify-between">
                      <span>Ngày gửi đơn:</span> 
                      <span className="text-[#334537]">{new Date(req.createdAt).toLocaleDateString('vi-VN')}</span>
                    </p>
                    <p className="flex justify-between">
                      <span>Ngày trả dự kiến:</span> 
                      <span className="text-[#334537]">{new Date(req.expectedDate).toLocaleDateString('vi-VN')}</span>
                    </p>
                    <p className="flex justify-between">
                      <span>Hoàn cọc:</span> 
                      <span className="text-[#b87d4b] font-semibold">{req.depositAmount.toLocaleString('vi-VN')} VNĐ</span>
                    </p>
                  </div>

                  {req.rejectReason && req.status === 'rejected' && (
                    <div className="mt-3 pt-3 border-t border-red-100 bg-red-50/50 p-2.5 rounded-lg text-[11px] text-red-700">
                      <p className="font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        Lý do từ chối:
                      </p>
                      <p className="mt-0.5 leading-relaxed">{req.rejectReason}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerCheckoutPage;
