import { useEffect, useState } from 'react';
import { useRoomSearchStore } from '../store/useRoomSearchStore';
import CustomSelect from '../../../components/ui/CustomSelect';
import { getBranchesApi, Branch } from '../rooms.api';

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

  const [branches, setBranches] = useState<Branch[]>([]);

  useEffect(() => {
    getBranchesApi()
      .then(setBranches)
      .catch(err => console.error('Lỗi khi lấy chi nhánh:', err));
  }, []);

  const branchOptions = [
    { value: 'Tất cả chi nhánh', label: 'Tất cả chi nhánh' },
    ...branches.map(b => ({ value: b.id, label: b.name }))
  ];


  const roomTypeOptions = [
    { value: 'Loại phòng', label: 'Loại phòng' },
    { value: 'Studio', label: 'Studio' },
    { value: 'Twin', label: 'Twin' },
    { value: 'Dorm', label: 'KTX (Dorm)' },
  ];

  const genderOptions = [
    { value: 'Giới tính', label: 'Giới tính' },
    { value: 'Male', label: 'Nam' },
    { value: 'Female', label: 'Nữ' },
    { value: 'All', label: 'Tất cả' },
  ];

  const sortOptions = [
    'Mới nhất',
    'Giá thấp nhất',
    'Giá cao nhất',
    'Trống nhiều nhất',
  ];

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
        <CustomSelect
          value={branch}
          onChange={setBranch}
          options={branchOptions}
          pill={true}
          className="flex-1 min-w-[140px]"
        />
        
        <CustomSelect
          value={roomType}
          onChange={setRoomType}
          options={roomTypeOptions}
          pill={true}
          className="flex-1 min-w-[120px]"
        />
        
        <CustomSelect
          value={gender}
          onChange={setGender}
          options={genderOptions}
          pill={true}
          className="flex-1 min-w-[100px]"
        />
        
        <button 
          onClick={onToggleFilters}
          className={`flex items-center justify-center whitespace-nowrap gap-1.5 px-4 py-2.5 border border-primary rounded-[24px] font-label-md transition-colors text-sm cursor-pointer ${
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
      <div className="lg:col-span-2">
        <CustomSelect
          value={sortBy}
          onChange={setSortBy}
          options={sortOptions}
          pill={true}
          triggerClassName="bg-[#f1f4f0] border-none"
        />
      </div>
    </div>
  );
}
