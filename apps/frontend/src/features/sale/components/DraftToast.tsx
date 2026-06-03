import { CheckCircle2, FileText, Clock, AlertCircle, X } from 'lucide-react';
import { useEffect } from 'react';

interface Props {
  show: boolean;
  onClose: () => void;
  onViewDrafts: () => void;
}

export default function DraftToast({ show, onClose, onViewDrafts }: Props) {
  useEffect(() => {
    if (!show) return;
    const timer = setTimeout(onClose, 4500);
    return () => clearTimeout(timer);
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-[200] max-w-sm w-full animate-slide-in-right"
      style={{ animation: 'slideInRight 0.35s cubic-bezier(0.34,1.56,0.64,1)' }}
    >
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(100%) scale(0.95); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
      `}</style>
      <div className="bg-white rounded-2xl shadow-2xl border border-[#d1c4b9] overflow-hidden">
        {/* Progress bar */}
        <div
          className="h-1 bg-[#2d6a4f] origin-left"
          style={{ animation: 'shrink 4.5s linear forwards' }}
        />
        <style>{`
          @keyframes shrink {
            from { transform: scaleX(1); }
            to { transform: scaleX(0); }
          }
        `}</style>

        <div className="px-4 py-3.5 flex items-start gap-3">
          {/* Icon */}
          <div className="w-9 h-9 rounded-xl bg-[#d8f3dc] flex items-center justify-center shrink-0 mt-0.5">
            <CheckCircle2 className="w-5 h-5 text-[#2d6a4f]" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[#1e1b17] text-sm">Đã lưu bản nháp!</p>
            <p className="text-xs text-[#4e453c] mt-0.5">
              Bản nháp hợp đồng đã được lưu thành công.
            </p>
            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={() => { onClose(); onViewDrafts(); }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#6f583c] text-white text-xs font-bold hover:bg-[#5c4830] transition"
              >
                <FileText className="w-3 h-3" />
                Xem bản nháp
              </button>
              <div className="flex items-center gap-1 text-[10px] text-[#9d8879]">
                <Clock className="w-3 h-3" />
                Tự đóng sau 4 giây
              </div>
            </div>
          </div>

          {/* Close */}
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-full flex items-center justify-center text-[#9d8879] hover:text-[#4e453c] hover:bg-[#eee7e1] transition shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Warning note */}
        <div className="px-4 pb-3 flex items-center gap-1.5 text-[10px] text-[#d97706]">
          <AlertCircle className="w-3 h-3 shrink-0" />
          Bản nháp chỉ lưu tạm thời trong phiên làm việc này.
        </div>
      </div>
    </div>
  );
}
