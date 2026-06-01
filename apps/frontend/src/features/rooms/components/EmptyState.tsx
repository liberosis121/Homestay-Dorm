
import { useRoomSearchStore } from '../store/useRoomSearchStore';

export default function EmptyState() {
  const resetFilters = useRoomSearchStore(state => state.resetFilters);

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center max-w-md mx-auto animate-fade-in-up">
      <div className="w-48 h-48 bg-[#E8EDE7] rounded-full flex items-center justify-center mb-8">
        <span className="material-symbols-outlined text-[80px] text-primary/40">holiday_village</span>
      </div>
      <h2 className="font-headline-lg text-3xl font-medium text-on-surface mb-2">
        Rất tiếc, không tìm thấy phòng!
      </h2>
      <p className="text-on-surface-variant font-body-md mb-8">
        Chúng tôi không tìm thấy kết quả phù hợp với các tiêu chí lọc của bạn. Hãy thử thay đổi bộ lọc hoặc xem thêm ở các chi nhánh khác.
      </p>
      <button 
        onClick={resetFilters}
        className="bg-primary text-on-primary px-8 py-3 rounded-full font-label-md hover:opacity-90 transition-all"
      >
        Xóa tất cả bộ lọc
      </button>
    </div>
  );
}
