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

  const getActiveStepIndex = (currentStatus: CheckoutRequest['status']): number => {
    switch (currentStatus) {
      case 'submitted': return 1;
      case 'inventory_checking': return 2;
      case 'accounting_matching': return 3;
      case 'refunding': return 4;
      case 'completed': return 5;
      case 'rejected': return 2;
      default: return 1;
    }
  };

  const activeIndex = getActiveStepIndex(status);
  const isRejected = status === 'rejected';

  return (
    <div className="bg-surface-container-lowest rounded-24 border border-outline-variant/40 shadow-sm p-6 md:p-8 space-y-8">
      {/* TIMELINE STEPS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-2">
        {steps.map((step, idx) => {
          const stepNum = idx + 1;
          const isCompleted = stepNum < activeIndex && !isRejected;
          const isActive = stepNum === activeIndex && !isRejected;
          const isFailed = stepNum === activeIndex && isRejected;
          const isFuture = stepNum > activeIndex || (isRejected && stepNum > activeIndex);

          let iconCls = 'bg-surface-container text-on-surface-variant border-outline-variant/40 border-2';
          if (isCompleted) {
            iconCls = 'bg-primary text-on-primary border-primary border-2';
          } else if (isActive) {
            iconCls = 'bg-primary/10 text-primary border-primary border-2 animate-pulse';
          } else if (isFailed) {
            iconCls = 'bg-error-container text-error border-error border-2';
          }

          const StepIcon = step.icon;

          return (
            <React.Fragment key={step.key}>
              <div className={`flex flex-row md:flex-col items-center gap-4 md:gap-3 flex-1 transition duration-300 ${isFuture ? 'opacity-35' : 'opacity-100'}`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm shrink-0 ${iconCls}`}>
                  {isCompleted ? (
                    <Check className="w-5 h-5 stroke-[3]" />
                  ) : isFailed ? (
                    <X className="w-5 h-5 stroke-[3]" />
                  ) : (
                    <StepIcon className="w-5 h-5" />
                  )}
                </div>
                <div className="text-left md:text-center">
                  <p className={`text-sm font-semibold ${isFailed ? 'text-error' : isCompleted || isActive ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                    {isFailed ? 'Bị từ chối' : step.label}
                  </p>
                  <p className="text-xs text-on-surface-variant mt-0.5">{step.description}</p>
                </div>
              </div>

              {/* CONNECTOR */}
              {idx < steps.length - 1 && (
                <div className="hidden md:block flex-1 h-0.5 mx-2 bg-outline-variant/40 relative overflow-hidden">
                  <div
                    className={`absolute inset-0 bg-primary transition-all duration-500 ${isCompleted ? 'w-full' : 'w-0'}`}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* STATUS MESSAGES */}
      {isRejected && rejectReason && (
        <div className="bg-error-container/30 border border-error/20 rounded-2xl p-5 flex items-start gap-4 animate-fade-in">
          <div className="w-10 h-10 rounded-full bg-error-container flex items-center justify-center text-error shrink-0">
            <X className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-error mb-1">Yêu cầu trả phòng bị từ chối</h4>
            <p className="text-sm text-on-surface leading-relaxed">{rejectReason}</p>
            <p className="text-xs text-on-surface-variant mt-2">
              Vui lòng liên hệ Quản lý chi nhánh để giải quyết hoặc gửi lại yêu cầu mới sau khi khắc phục.
            </p>
          </div>
        </div>
      )}

      {!isRejected && status === 'submitted' && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-blue-900 mb-1">Yêu cầu của bạn đã được gửi</h4>
            <p className="text-sm text-blue-700 leading-relaxed">
              Hệ thống đã tiếp nhận đơn yêu cầu trả phòng. Quản lý chi nhánh sẽ liên hệ để hẹn lịch kiểm kê tài sản trong vòng 24–48 giờ làm việc.
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
            <h4 className="text-sm font-semibold text-amber-900 mb-1">Đang tiến hành kiểm kê tài sản</h4>
            <p className="text-sm text-amber-700 leading-relaxed">
              Quản lý tòa nhà đang thực hiện đối soát cơ sở vật chất phòng. Vui lòng dọn dẹp vệ sinh phòng và chuẩn bị bàn giao chìa khóa/thẻ từ.
            </p>
          </div>
        </div>
      )}

      {!isRejected && status === 'accounting_matching' && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-indigo-900 mb-1">Đang quyết toán công nợ tài chính</h4>
            <p className="text-sm text-indigo-700 leading-relaxed">
              Bộ phận kế toán đang tổng hợp các hóa đơn chưa thanh toán và đối chiếu công nợ cuối kỳ để khấu trừ vào tiền cọc hoàn trả.
            </p>
          </div>
        </div>
      )}

      {!isRejected && status === 'refunding' && (
        <div className="bg-primary/5 border border-primary/15 rounded-2xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Coins className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-primary mb-1">Đang xử lý chuyển khoản hoàn cọc</h4>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Thủ tục tài chính đã được duyệt. Kế toán đang chuyển khoản tiền cọc hoàn vào tài khoản ngân hàng bạn đã đăng ký. Bạn sẽ nhận được trong tối đa 24 giờ.
            </p>
          </div>
        </div>
      )}

      {!isRejected && status === 'completed' && (
        <div className="bg-status-success/8 border border-status-success/20 rounded-2xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-status-success/15 flex items-center justify-center text-status-success shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-status-success mb-1">Đã hoàn tất toàn bộ thủ tục trả phòng</h4>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Yêu cầu trả phòng và hoàn trả tiền đặt cọc đã kết thúc thành công. Cảm ơn bạn đã lựa chọn lưu trú tại HomeStay Dorm!
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
