

export default function RoomListSkeleton() {
  return (
    <div className="bg-[#f1f4f0] rounded-[24px] overflow-hidden animate-pulse">
      <div className="aspect-[4/3] bg-[#e0e3df]"></div>
      <div className="p-6 space-y-4">
        <div className="h-4 w-1/4 bg-[#e0e3df] rounded"></div>
        <div className="h-6 w-3/4 bg-[#e0e3df] rounded"></div>
        <div className="h-4 w-1/2 bg-[#e0e3df] rounded"></div>
        
        <div className="flex gap-2">
          <div className="h-8 w-16 bg-[#e0e3df] rounded-lg"></div>
          <div className="h-8 w-16 bg-[#e0e3df] rounded-lg"></div>
        </div>
        
        <div className="pt-4 border-t border-[#c3c8bf] flex justify-between items-center">
          <div className="h-8 w-24 bg-[#e0e3df] rounded"></div>
          <div className="h-6 w-16 bg-[#e0e3df] rounded"></div>
        </div>
      </div>
    </div>
  );
}
