import React from 'react';
import { useRoomSearchStore } from '../store/useRoomSearchStore';

export default function ExtendedFilters() {
  const { 
    amenities, toggleAmenity,
    priceRange, setPriceRange,
    capacity, setCapacity,
    onlyAvailable, setOnlyAvailable
  } = useRoomSearchStore();

  const amenityOptions = [
    { id: 'AC', label: 'Điều hòa nhiệt độ' },
    { id: 'Wifi', label: 'Wifi tốc độ cao' },
    { id: 'Private WC', label: 'WC riêng biệt' },
    { id: 'Kitchen', label: 'Bếp chung' }
  ];

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Simple slider for max price for demonstration
    setPriceRange([1000000, parseInt(e.target.value)]);
  };

  return (
    <div className="mt-6 pt-6 border-t border-[#c3c8bf] grid grid-cols-1 md:grid-cols-4 gap-8 animate-fade-in-up">
      <div>
        <p className="font-label-md mb-4 text-[#191c1a]">Tiện ích</p>
        <div className="space-y-3">
          {amenityOptions.map(am => (
            <label key={am.id} className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={amenities.includes(am.id)}
                onChange={() => toggleAmenity(am.id)}
                className="w-5 h-5 rounded border-[#c3c8bf] text-primary focus:ring-primary" 
              />
              <span className="text-[#434841] group-hover:text-primary transition-colors font-body-md">
                {am.label}
              </span>
            </label>
          ))}
        </div>
      </div>
      
      <div>
        <p className="font-label-md mb-4 text-[#191c1a]">Khoảng giá cao nhất (VND)</p>
        <input 
          type="range" 
          min="1000000" 
          max="10000000" 
          step="500000"
          value={priceRange[1]}
          onChange={handlePriceChange}
          className="w-full accent-primary" 
        />
        <div className="flex justify-between mt-2 text-caption text-[#434841]">
          <span>1.000.000</span>
          <span>{priceRange[1].toLocaleString('vi-VN')}</span>
        </div>
      </div>
      
      <div>
        <p className="font-label-md mb-4 text-[#191c1a]">Sức chứa</p>
        <div className="flex gap-2">
          {['1', '2', '4', '6+'].map(cap => (
            <button 
              key={cap}
              onClick={() => setCapacity(capacity === cap ? '' : cap)}
              className={`px-4 py-2 border rounded-full text-caption transition-colors ${
                capacity === cap 
                  ? 'border-primary bg-primary text-white' 
                  : 'border-[#c3c8bf] text-[#434841] hover:border-primary hover:text-primary'
              }`}
            >
              {cap}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex items-end">
        <label className="flex items-center gap-3 cursor-pointer">
          <div className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={onlyAvailable}
              onChange={(e) => setOnlyAvailable(e.target.checked)}
              className="sr-only peer" 
            />
            <div className="w-11 h-6 bg-[#c3c8bf] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </div>
          <span className="font-label-md text-[#191c1a]">Chỉ hiện phòng trống</span>
        </label>
      </div>
    </div>
  );
}
