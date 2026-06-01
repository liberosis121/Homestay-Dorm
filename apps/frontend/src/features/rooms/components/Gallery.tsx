import { useState } from 'react';
import { Camera, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  images: string[];
  roomName: string;
}

export default function Gallery({ images, roomName }: Props) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);

  // Fallback image if list is empty
  const galleryImages = images.length > 0 ? images : [
    'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80'
  ];

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLightboxIdx((prev) => (prev + 1) % galleryImages.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLightboxIdx((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  return (
    <div className="space-y-4">
      {/* Main Image View */}
      <div 
        onClick={() => {
          setLightboxIdx(activeIdx);
          setLightboxOpen(true);
        }}
        className="relative aspect-[16/9] rounded-[24px] overflow-hidden group cursor-pointer border border-outline-variant/30 shadow-md bg-surface-container"
      >
        <img 
          src={galleryImages[activeIdx]} 
          alt={roomName} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
        />
        
        {/* Glassmorphic Overlay Tag */}
        <div className="absolute bottom-4 right-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 border border-white/20 shadow-lg text-on-surface hover:bg-white dark:hover:bg-slate-900 transition-colors">
          <Camera className="w-4 h-4 text-primary" />
          <span className="text-label-md font-label-md">Xem {galleryImages.length} ảnh</span>
        </div>
      </div>

      {/* Thumbnail List */}
      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
        {galleryImages.map((img, idx) => (
          <button
            key={idx}
            onClick={() => setActiveIdx(idx)}
            className={`relative w-24 h-24 rounded-2xl overflow-hidden border-2 transition-all flex-shrink-0 cursor-pointer ${
              activeIdx === idx 
                ? 'border-primary scale-[0.98] shadow-md' 
                : 'border-transparent opacity-70 hover:opacity-100'
            }`}
          >
            <img 
              src={img} 
              alt={`${roomName} thumbnail ${idx + 1}`} 
              className="w-full h-full object-cover" 
            />
          </button>
        ))}
      </div>

      {/* Lightbox Dialog (Fullscreen Zoom View) */}
      {lightboxOpen && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-[200] flex items-center justify-center p-4 select-none">
          {/* Close Area / Button */}
          <button 
            onClick={() => setLightboxOpen(false)}
            className="absolute top-6 right-6 text-white/70 hover:text-white bg-white/10 p-3 rounded-full hover:bg-white/20 transition-all cursor-pointer z-10"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Previous Button */}
          <button 
            onClick={handlePrev}
            className="absolute left-6 text-white/70 hover:text-white bg-white/10 p-4 rounded-full hover:bg-white/20 transition-all cursor-pointer z-10"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>

          {/* Main Slide Image */}
          <div className="max-w-5xl max-h-[80vh] w-full flex flex-col items-center gap-4">
            <img 
              src={galleryImages[lightboxIdx]} 
              alt={`${roomName} full view`} 
              className="max-w-full max-h-[70vh] rounded-2xl object-contain shadow-2xl animate-fade-in"
            />
            {/* Caption */}
            <div className="text-white/80 font-label-md text-center bg-white/10 px-4 py-2 rounded-full backdrop-blur-md">
              Ảnh {lightboxIdx + 1} / {galleryImages.length} - {roomName}
            </div>
          </div>

          {/* Next Button */}
          <button 
            onClick={handleNext}
            className="absolute right-6 text-white/70 hover:text-white bg-white/10 p-4 rounded-full hover:bg-white/20 transition-all cursor-pointer z-10"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </div>
      )}
    </div>
  );
}
