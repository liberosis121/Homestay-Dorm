
import { useRoomSearchStore } from '../store/useRoomSearchStore';

interface Props {
  onToggleFilters: () => void;
  showExtended: boolean;
}

export default function FilterBar({ onToggleFilters, showExtended }: Props) {
  const { 
    keyword, setKeyword,
    branch, setBranch,
    roomType, setRoomType,
    gender, setGender,
    sortBy, setSortBy
  } = useRoomSearchStore();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
      {/* Keyword Search */}
      <div className="lg:col-span-3 relative">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#737970]">search</span>
        <input 
          type="text" 
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Tìm tên, khu vực..." 
          className="w-full pl-11 pr-4 py-2.5 bg-white border border-[#c3c8bf] rounded-[24px] focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-body-md text-on-surface text-sm"
        />
      </div>

      {/* Quick Selectors */}
      <div className="lg:col-span-7 flex flex-wrap lg:flex-nowrap gap-2">
        <div className="relative flex-1 min-w-[140px]">
          <select 
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            className="w-full bg-white border border-[#c3c8bf] pl-3 pr-8 py-2.5 rounded-[24px] font-label-md text-[#434841] outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer text-sm"
          >
            <option>Tất cả chi nhánh</option>
            <option value="b-1">Quận 1 - Đinh Tiên Hoàng</option>
            <option value="b-2">Quận 7 - Phú Mỹ Hưng</option>
            <option value="b-3">Thủ Đức - Làng Đại Học</option>
          </select>
          <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[#737970] text-[18px]">expand_more</span>
        </div>
        
        <div className="relative flex-1 min-w-[120px]">
          <select 
            value={roomType}
            onChange={(e) => setRoomType(e.target.value)}
            className="w-full bg-white border border-[#c3c8bf] pl-3 pr-8 py-2.5 rounded-[24px] font-label-md text-[#434841] outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer text-sm"
          >
            <option>Loại phòng</option>
            <option value="Studio">Studio</option>
            <option value="Twin">Twin</option>
            <option value="Dorm">KTX (Dorm)</option>
          </select>
          <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[#737970] text-[18px]">expand_more</span>
        </div>
        
        <div className="relative flex-1 min-w-[100px]">
          <select 
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="w-full bg-white border border-[#c3c8bf] pl-3 pr-8 py-2.5 rounded-[24px] font-label-md text-[#434841] outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer text-sm"
          >
            <option>Giới tính</option>
            <option value="Male">Nam</option>
            <option value="Female">Nữ</option>
            <option value="All">Tất cả</option>
          </select>
          <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[#737970] text-[18px]">expand_more</span>
        </div>
        
        <button 
          onClick={onToggleFilters}
          className={`flex items-center justify-center whitespace-nowrap gap-1.5 px-4 py-2.5 border border-primary rounded-[24px] font-label-md transition-colors text-sm ${
            showExtended ? 'bg-primary text-white' : 'text-primary hover:bg-primary/5'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            {showExtended ? 'close' : 'tune'}
          </span>
          Bộ lọc
        </button>
      </div>

      {/* Sort */}
      <div className="lg:col-span-2 relative">
        <select 
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="w-full bg-[#f1f4f0] border-none pl-3 pr-8 py-2.5 rounded-[24px] font-label-md text-on-surface outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer text-sm"
        >
          <option>Mới nhất</option>
          <option>Giá thấp nhất</option>
          <option>Giá cao nhất</option>
          <option>Trống nhiều nhất</option>
        </select>
        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#737970] text-[20px]">expand_more</span>
      </div>
    </div>
  );
}
