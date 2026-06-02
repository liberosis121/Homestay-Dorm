import { create } from 'zustand';

interface RoomSearchState {
  keyword: string;
  branch: string;
  roomType: string;
  gender: string;
  sortBy: string;
  
  // Extended filters
  amenities: string[];
  priceRange: [number, number];
  capacity: string;
  onlyAvailable: boolean;

  // Actions
  setKeyword: (keyword: string) => void;
  setBranch: (branch: string) => void;
  setRoomType: (roomType: string) => void;
  setGender: (gender: string) => void;
  setSortBy: (sortBy: string) => void;
  
  toggleAmenity: (amenity: string) => void;
  setPriceRange: (range: [number, number]) => void;
  setCapacity: (capacity: string) => void;
  setOnlyAvailable: (only: boolean) => void;
  
  resetFilters: () => void;
}

const initialState = {
  keyword: '',
  branch: 'Tất cả chi nhánh',
  roomType: 'Loại phòng',
  gender: 'Giới tính',
  sortBy: 'Mới nhất',
  
  amenities: [],
  priceRange: [1000000, 10000000] as [number, number],
  capacity: '',
  onlyAvailable: false,
};

export const useRoomSearchStore = create<RoomSearchState>((set) => ({
  ...initialState,
  
  setKeyword: (keyword) => set({ keyword }),
  setBranch: (branch) => set({ branch }),
  setRoomType: (roomType) => set({ roomType }),
  setGender: (gender) => set({ gender }),
  setSortBy: (sortBy) => set({ sortBy }),
  
  toggleAmenity: (amenity) => set((state) => ({
    amenities: state.amenities.includes(amenity)
      ? state.amenities.filter((a) => a !== amenity)
      : [...state.amenities, amenity],
  })),
  setPriceRange: (priceRange) => set({ priceRange }),
  setCapacity: (capacity) => set({ capacity }),
  setOnlyAvailable: (onlyAvailable) => set({ onlyAvailable }),
  
  resetFilters: () => set(initialState),
}));
