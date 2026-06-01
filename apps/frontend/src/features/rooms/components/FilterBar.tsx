
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
      <div className="lg:col-span-4 relative">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#737970]">search</span>
        <input 
          type="text" 
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Tìm tên phòng, khu vực..." 
          className="w-full pl-12 pr-4 py-3 bg-white border border-[#c3c8bf] rounded-[24px] focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-body-md text-on-surface"
        />
      </div>

      {/* Quick Selectors */}
      <div className="lg:col-span-6 flex flex-wrap gap-2">
        <select 
          value={branch}
          onChange={(e) => setBranch(e.target.value)}
          className="bg-white border border-[#c3c8bf] px-4 py-3 rounded-[24px] font-label-md text-[#434841] outline-none focus:ring-2 focus:ring-primary appearance-none pr-10 cursor-pointer"
        >
          <option>Tất cả chi nhánh</option>
          <option value="b-1">Quận 1 - Đinh Tiên Hoàng</option>
          <option value="b-2">Quận 7 - Phú Mỹ Hưng</option>
          <option value="b-3">Thủ Đức - Làng Đại Học</option>
        </select>
        
        <select 
          value={roomType}
          onChange={(e) => setRoomType(e.target.value)}
          className="bg-white border border-[#c3c8bf] px-4 py-3 rounded-[24px] font-label-md text-[#434841] outline-none focus:ring-2 focus:ring-primary cursor-pointer"
        >
          <option>Loại phòng</option>
          <option value="Studio">Studio</option>
          <option value="Twin">Twin</option>
          <option value="Dorm">KTX (Dorm)</option>
        </select>
        
        <select 
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          className="bg-white border border-[#c3c8bf] px-4 py-3 rounded-[24px] font-label-md text-[#434841] outline-none focus:ring-2 focus:ring-primary cursor-pointer"
        >
          <option>Giới tính</option>
          <option value="Male">Nam</option>
          <option value="Female">Nữ</option>
          <option value="All">Tất cả</option>
        </select>
        
        <button 
          onClick={onToggleFilters}
          className={`flex items-center gap-2 px-6 py-3 border border-primary rounded-[24px] font-label-md transition-colors ${
            showExtended ? 'bg-primary text-white' : 'text-primary hover:bg-primary/5'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">
            {showExtended ? 'close' : 'tune'}
          </span>
          Bộ lọc
        </button>
      </div>

      {/* Sort */}
      <div className="lg:col-span-2">
        <select 
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="w-full bg-[#f1f4f0] border-none px-4 py-3 rounded-[24px] font-label-md text-on-surface outline-none focus:ring-2 focus:ring-primary cursor-pointer"
        >
          <option>Mới nhất</option>
          <option>Giá thấp nhất</option>
          <option>Giá cao nhất</option>
          <option>Trống nhiều nhất</option>
        </select>
      </div>
    </div>
  );
}
