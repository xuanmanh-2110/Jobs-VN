import React, { useState, useRef, useEffect } from 'react';
import { Move, X, Check } from 'lucide-react';

const AvatarCropper = ({ imageSrc, onCrop, onCancel }) => {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
      imageRef.current = img;
    };
  }, [imageSrc]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - offset.x,
        y: e.touches[0].clientY - offset.y
      });
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    setOffset({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleApplyCrop = () => {
    if (!imageRef.current || imageSize.width === 0) return;

    const canvas = document.createElement('canvas');
    const outputSize = 400; // High quality 400x400 avatar
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext('2d');

    const viewportSize = 260; // Size of the crop window in UI
    const baseScale = Math.max(viewportSize / imageSize.width, viewportSize / imageSize.height);
    const finalScale = baseScale * zoom;

    const renderedWidth = imageSize.width * finalScale;
    const renderedHeight = imageSize.height * finalScale;

    // Viewport center
    const vpCenterX = viewportSize / 2;
    const vpCenterY = viewportSize / 2;

    // Image center with offset
    const imgCenterX = vpCenterX + offset.x;
    const imgCenterY = vpCenterY + offset.y;

    const imgTopLeftX = imgCenterX - renderedWidth / 2;
    const imgTopLeftY = imgCenterY - renderedHeight / 2;

    // Calculate source crop region on natural image
    const ratio = outputSize / viewportSize;
    
    // Clear and draw full square without circular clip so no black corners are generated
    ctx.clearRect(0, 0, outputSize, outputSize);
    ctx.drawImage(
      imageRef.current,
      imgTopLeftX * ratio,
      imgTopLeftY * ratio,
      renderedWidth * ratio,
      renderedHeight * ratio
    );

    const croppedBase64 = canvas.toDataURL('image/jpeg', 0.92);
    onCrop(croppedBase64);
  };

  return (
    <div className="fixed inset-0 z-999 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in" onClick={onCancel}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-slate-800 animate-slide-up" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-5 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Cắt ảnh đại diện</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Kéo và thu phóng để căn chỉnh góc đẹp nhất</p>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {/* Cropper Viewport */}
        <div className="p-6 flex flex-col items-center bg-gray-900 dark:bg-slate-950 select-none">
          <div 
            className="relative w-[260px] h-[260px] rounded-3xl overflow-hidden border-2 border-white/90 shadow-2xl cursor-grab active:cursor-grabbing touch-none ring-4 ring-blue-500/40"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {imageSrc && imageSize.width > 0 && (
              <img
                src={imageSrc}
                alt="Crop preview"
                draggable={false}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  width: `${imageSize.width * Math.max(260 / imageSize.width, 260 / imageSize.height) * zoom}px`,
                  height: `${imageSize.height * Math.max(260 / imageSize.width, 260 / imageSize.height) * zoom}px`,
                  maxWidth: 'none',
                  maxHeight: 'none',
                  transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                  pointerEvents: 'none'
                }}
              />
            )}
            <div className="absolute inset-0 pointer-events-none border border-white/30 rounded-3xl"></div>
          </div>

          <p className="text-[11px] text-gray-400 dark:text-slate-400 mt-3 flex items-center gap-1.5">
            <Move className="w-3.5 h-3.5 text-gray-400 shrink-0" /> Kéo ảnh để đổi vị trí • Dùng thanh trượt bên dưới để thu phóng
          </p>
        </div>

        {/* Controls */}
        <div className="p-5 bg-gray-50 dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 space-y-4">
          {/* Zoom Slider */}
          <div className="flex items-center gap-3">
            <button 
              type="button"
              onClick={() => setZoom(z => Math.max(1, +(z - 0.2).toFixed(1)))}
              className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-200 flex items-center justify-center font-bold text-base hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer"
              title="Thu nhỏ"
            >
              -
            </button>
            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="flex-1 accent-blue-600 h-2 bg-gray-200 dark:bg-slate-700 rounded-lg cursor-pointer"
            />
            <button 
              type="button"
              onClick={() => setZoom(z => Math.min(3, +(z + 0.2).toFixed(1)))}
              className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-200 flex items-center justify-center font-bold text-base hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer"
              title="Phóng to"
            >
              +
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-xs font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleApplyCrop}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-sm hover:shadow transition-all cursor-pointer flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              Áp dụng & Lưu ảnh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvatarCropper;
