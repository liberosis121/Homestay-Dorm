import React from 'react';
import { Check, X, FileText, Home, Calculator, Coins, CheckCircle2 } from 'lucide-react';
import { CheckoutRequest } from '../store/useCheckoutStore';

interface CheckoutTimelineProps {
  status: CheckoutRequest['status'];
  rejectReason?: string;
}

interface StepItem {
  key: CheckoutRequest['status'] | 'completed';
  label: string;
  description: string;
  icon: React.ComponentType<any>;
}

export const CheckoutTimeline: React.FC<CheckoutTimelineProps> = ({ status, rejectReason }) => {
  const steps: StepItem[] = [
    { key: 'submitted', label: 'Gửi yêu cầu', description: 'Đã tiếp nhận đơn', icon: FileText },
    { key: 'inventory_checking', label: 'Kiểm kê phòng', description: 'Kiểm tra hư hại', icon: Home },
    { key: 'accounting_matching', label: 'Đối soát tài chính', description: 'Tính toán công nợ', icon: Calculator },
    { key: 'refunding', label: 'Hoàn trả cọc', description: 'Chuyển khoản hoàn cọc', icon: Coins },
    { key: 'completed', label: 'Hoàn tất', description: 'Giao dịch hoàn tất', icon: CheckCircle2 },
  ];

  // Trả về số thứ tự bước hiện tại (1-indexed)
  const getActiveStepIndex = (currentStatus: CheckoutRequest['status']): number => {
    switch (currentStatus) {
      case 'submitted':
        return 1;
      case 'inventory_checking':
        return 2;
      case 'accounting_matching':
        return 3;
      case 'refunding':
        return 4;
      case 'completed':
        return 5;
      case 'rejected':
        return 2; // Giả định bị từ chối ở bước kiểm kê phòng
      default:
        return 1;
    }
  };

  const activeIndex = getActiveStepIndex(status);
  const isRejected = status === 'rejected';

  return (
    <div className="bg-white rounded-3xl border border-[#ecebe6] shadow-sm p-6 md:p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-2">
        {steps.map((step, idx) => {
          const stepNum = idx + 1;
          const isCompleted = stepNum < activeIndex && !isRejected;
          const isActive = stepNum === activeIndex && !isRejected;
          const isFailed = stepNum === activeIndex && isRejected;
          const isFuture = stepNum > activeIndex || (isRejected && stepNum > activeIndex);

          // Định hình Style cho Icon Box
          let bgClass = 'bg-[#faf9f6] text-[#8c9a8e] border-[#ecebe6]';
          let borderClass = 'border-2';
          
          if (isCompleted) {
            bgClass = 'bg-[#334537] text-white border-[#334537]';
          } else if (isActive) {
            bgClass = 'bg-[#f5f2eb] text-[#334537] border-[#334537]';
            borderClass = 'border-2 animate-pulse';
          } else if (isFailed) {
            bgClass = 'bg-red-50 text-red-600 border-red-500';
            borderClass = 'border-2';
          }

          const StepIcon = step.icon;

          return (
            <React.Fragment key={step.key}>
              {/* STEP CARD */}
              <div className={`flex flex-row md:flex-col items-center gap-4 md:gap-3 flex-1 transition duration-300 ${isFuture ? 'opacity-40' : 'opacity-100'}`}>
                {/* Icon Container */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${bgClass} ${borderClass} shadow-inner`}>
                  {isCompleted ? (
                    <Check className="w-5 h-5 stroke-[3]" />
                  ) : isFailed ? (
                    <X className="w-5 h-5 stroke-[3]" />
                  ) : (
                    <StepIcon className="w-5 h-5" />
                  )}
                </div>

                {/* Text Labels */}
                <div className="text-left md:text-center">
                  <p className={`text-sm font-semibold ${isFailed ? 'text-red-600' : 'text-[#334537]'}`}>
                    {isFailed ? 'Bị từ chối' : step.label}
                  </p>
                  <p className="text-xs text-[#8c9a8e] mt-0.5">{step.description}</p>
                </div>
              </div>

              {/* CONNECTOR LINE (Chỉ hiển thị giữa các bước) */}
              {idx < steps.length - 1 && (
                <div className="hidden md:block flex-1 h-0.5 mx-2 bg-[#ecebe6] relative">
                  <div
                    className={`absolute inset-0 bg-[#334537] transition-all duration-500 ${
                      isCompleted ? 'w-full' : 'w-0'
                    }`}
                  />
                  {isFailed && stepNum === activeIndex - 1 && (
                    <div className="absolute inset-0 bg-red-400 w-full" />
                  )}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* THÔNG BÁO CHI TIẾT KHI BỊ TỪ CHỐI */}
      {isRejected && rejectReason && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-4 animate-fadeIn">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
            <X className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-red-900">Yêu cầu trả phòng bị từ chối</h4>
            <p className="text-sm text-red-700 mt-1 leading-relaxed">{rejectReason}</p>
            <p className="text-xs text-red-500 mt-2 font-medium">
              Vui lòng liên hệ với Quản lý chi nhánh để giải quyết hoặc gửi lại yêu cầu mới sau khi khắc phục.
            </p>
          </div>
        </div>
      )}

      {/* THÔNG BÁO CHO CÁC BƯỚC KHÁC */}
      {!isRejected && status === 'submitted' && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-blue-900">Yêu cầu của bạn đã được gửi</h4>
            <p className="text-sm text-blue-700 mt-1 leading-relaxed">
              Hệ thống đã tiếp nhận đơn yêu cầu trả phòng. Quản lý chi nhánh sẽ liên hệ với bạn để hẹn lịch kiểm kê tài sản phòng trong vòng 24 - 48 giờ làm việc.
            </p>
          </div>
        </div>
      )}

      {!isRejected && status === 'inventory_checking' && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <Home className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-amber-900">Đang tiến hành kiểm kê tài sản</h4>
            <p className="text-sm text-amber-700 mt-1 leading-relaxed">
              Quản lý tòa nhà đang thực hiện đối soát cơ sở vật chất phòng (giường, tủ, thiết bị điện nước). Vui lòng dọn dẹp vệ sinh phòng sạch sẽ và chuẩn bị bàn giao chìa khóa/thẻ từ phòng.
            </p>
          </div>
        </div>
      )}

      {!isRejected && status === 'accounting_matching' && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-amber-900">Đang quyết toán công nợ tài chính</h4>
            <p className="text-sm text-amber-700 mt-1 leading-relaxed">
              Bộ phận kế toán đang tổng hợp các hóa đơn dịch vụ chưa thanh toán (nếu có) và đối chiếu công nợ cuối cùng để khấu trừ vào tiền cọc hoàn trả của bạn.
            </p>
          </div>
        </div>
      )}

      {!isRejected && status === 'refunding' && (
        <div className="bg-green-50 border border-green-100 rounded-2xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 shrink-0">
            <Coins className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-green-950">Đang xử lý chuyển khoản hoàn cọc</h4>
            <p className="text-sm text-green-800 mt-1 leading-relaxed">
              Thủ tục tài chính đã duyệt. Kế toán đang thực hiện chuyển khoản số tiền cọc được hoàn vào tài khoản ngân hàng bạn đã đăng ký. Bạn sẽ nhận được tiền trong vòng tối đa 24 giờ.
            </p>
          </div>
        </div>
      )}

      {!isRejected && status === 'completed' && (
        <div className="bg-green-100 border border-green-200 rounded-2xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-green-200 flex items-center justify-center text-green-800 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-green-950">Đã hoàn tất toàn bộ thủ tục trả phòng</h4>
            <p className="text-sm text-green-800 mt-1 leading-relaxed">
              Yêu cầu trả phòng và hoàn trả tiền đặt cọc đã kết thúc thành công. Cảm ơn bạn đã lựa chọn lưu trú tại HomeStay Dorm. Chúc bạn gặp nhiều may mắn và gặt hái nhiều thành công trong tương lai!
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
