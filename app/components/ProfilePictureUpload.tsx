'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '../context/ThemeContext';

interface ProfilePictureUploadProps {
  currentImage?: string;
  originalImage?: string;
  onImageSelect: (file: File, originalFile?: File) => void;
  className?: string;
}

export const ProfilePictureUpload: React.FC<ProfilePictureUploadProps> = ({
  currentImage,
  originalImage,
  onImageSelect,
  className = '',
}) => {
  const { currentTheme } = useTheme();
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [liveOffset, setLiveOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const editorImageRef = useRef<HTMLImageElement>(null);
  const dragStartRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  const displayImage = previewImage || currentImage;

  const triggerFileSelect = () => fileInputRef.current?.click();

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const previewUrl = URL.createObjectURL(file);
      setRawImage(previewUrl);
      setRawFile(file);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      setImageLoaded(false);
      setIsEditorOpen(true);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const clampOffset = (next: { x: number; y: number }) => {
    const container = editorRef.current;
    const img = editorImageRef.current;
    if (!container || !img || !imageLoaded) return next;
    const size = container.clientWidth;
    const baseScale = Math.max(size / img.naturalWidth, size / img.naturalHeight);
    const scale = baseScale * zoom;
    const displayW = img.naturalWidth * scale;
    const displayH = img.naturalHeight * scale;
    const minX = size / 2 - displayW / 2;
    const maxX = displayW / 2 - size / 2;
    const minY = size / 2 - displayH / 2;
    const maxY = displayH / 2 - size / 2;
    return {
      x: Math.min(Math.max(next.x, minX), maxX),
      y: Math.min(Math.max(next.y, minY), maxY),
    };
  };

  useEffect(() => {
    if (rawImage) {
      setOffset((prev) => {
        const next = clampOffset(prev);
        setLiveOffset(next);
        return next;
      });
    }
  }, [zoom, rawImage, imageLoaded]);

  const beginDrag = (x: number, y: number) => {
    dragStartRef.current = { x, y, ox: offset.x, oy: offset.y };
    setIsDragging(true);
  };

  const updateDrag = (x: number, y: number) => {
    if (!dragStartRef.current) return;
    const dx = x - dragStartRef.current.x;
    const dy = y - dragStartRef.current.y;
    setLiveOffset(clampOffset({ x: dragStartRef.current.ox + dx, y: dragStartRef.current.oy + dy }));
  };

  const endDrag = () => {
    dragStartRef.current = null;
    setIsDragging(false);
    setOffset(clampOffset(liveOffset));
  };

  const openEditorFromOriginal = async () => {
    if (!originalImage) return;
    try {
      const resp = await fetch(originalImage, { mode: 'cors' });
      const blob = await resp.blob();
      const file = new File([blob], 'profile-original', { type: blob.type || 'image/jpeg' });
      const previewUrl = URL.createObjectURL(blob);
      setRawImage(previewUrl);
      setRawFile(file);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      setImageLoaded(false);
      setIsEditorOpen(true);
    } catch (e) {
      // Fallback: let user pick a new file if the original can't be fetched
      triggerFileSelect();
    }
  };

  const applyCrop = async () => {
    const container = editorRef.current;
    const img = editorImageRef.current;
    if (!container || !img || !rawFile || !imageLoaded) return;
    const size = container.clientWidth;
    const baseScale = Math.max(size / img.naturalWidth, size / img.naturalHeight);
    const scale = baseScale * zoom;
    const displayW = img.naturalWidth * scale;
    const displayH = img.naturalHeight * scale;
    const left = size / 2 - displayW / 2 + offset.x;
    const top = size / 2 - displayH / 2 + offset.y;
    const sx = Math.max(0, (0 - left) / scale);
    const sy = Math.max(0, (0 - top) / scale);
    const sw = Math.min(img.naturalWidth, size / scale);
    const sh = Math.min(img.naturalHeight, size / scale);

    const canvas = document.createElement('canvas');
    const outputSize = 512;
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outputSize, outputSize);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, rawFile.type || 'image/jpeg', 0.92)
    );
    if (!blob) return;
    const croppedFile = new File([blob], rawFile.name, { type: blob.type });
    const previewUrl = canvas.toDataURL(blob.type);
    setPreviewImage(previewUrl);
    setRawImage(null);
    setRawFile(null);
    setIsEditorOpen(false);
    onImageSelect(croppedFile, rawFile);
  };

  return (
    <div className={`relative ${className} aspect-square`} style={{ aspectRatio: '1 / 1' }}>
      <div
        className={`relative w-full h-full aspect-square rounded-full overflow-hidden ${displayImage ? 'border-0 bg-transparent' : 'border-4'} cursor-pointer transition-all duration-200 ${
          displayImage ? '' : isDragging ? `${currentTheme.border} bg-gray-100` : `border-gray-600 ${currentTheme.borderHover}`
        }`}
        onClick={() => {
          if (originalImage || currentImage) {
            openEditorFromOriginal();
          } else {
            triggerFileSelect();
          }
        }}
      >
        {displayImage ? (
          <img src={displayImage} alt="Profile" className="w-full h-full object-cover rounded-full" />
        ) : (
          <div
            className={`w-full h-full ${currentTheme.gradientHover.replace('from-', 'bg-gradient-to-br from-').replace('to-', 'to-')} flex items-center justify-center`}
          >
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
        )}
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

      <p className="text-xs text-gray-400 mt-2 text-center">Click to edit or upload</p>

      {isEditorOpen && rawImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-white font-semibold mb-4">Adjust profile photo</h3>
            <div
              ref={editorRef}
              className="relative mx-auto w-56 h-56 rounded-full overflow-hidden border-2 border-gray-600 bg-black"
              onMouseDown={(e) => beginDrag(e.clientX, e.clientY)}
              onMouseMove={(e) => updateDrag(e.clientX, e.clientY)}
              onMouseUp={endDrag}
              onMouseLeave={endDrag}
              onTouchStart={(e) => beginDrag(e.touches[0].clientX, e.touches[0].clientY)}
              onTouchMove={(e) => updateDrag(e.touches[0].clientX, e.touches[0].clientY)}
              onTouchEnd={endDrag}
            >
              <img
                ref={editorImageRef}
                src={rawImage}
                alt="Crop"
                crossOrigin="anonymous"
                className="w-full h-full object-cover"
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageLoaded(true)}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: `translate(-50%, -50%) translate(${liveOffset.x}px, ${liveOffset.y}px) scale(${zoom})`,
                  transformOrigin: 'center',
                  transition: isDragging ? 'none' : 'transform 120ms ease-out',
                }}
              />
              {/* Crop grid overlay */}
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-1/3 top-0 h-full w-px bg-white/20" />
                <div className="absolute left-2/3 top-0 h-full w-px bg-white/20" />
                <div className="absolute top-1/3 left-0 h-px w-full bg-white/20" />
                <div className="absolute top-2/3 left-0 h-px w-full bg-white/20" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <span className="text-xs text-gray-400">Zoom</span>
              <input
                type="range"
                min="1"
                max="3"
                step="0.01"
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1"
              />
            </div>
            <p className="text-xs text-gray-400 text-center mt-2">Drag to position</p>
            <div className="mt-4 flex items-center justify-between gap-2">
              <button
                onClick={triggerFileSelect}
                className="px-3 py-1 text-xs rounded-md text-gray-300 border border-gray-600"
              >
                Choose new
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsEditorOpen(false);
                    setRawImage(null);
                    setRawFile(null);
                    endDrag();
                  }}
                  className="px-3 py-1 text-xs rounded-md text-gray-300 border border-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={applyCrop}
                  className="px-3 py-1 text-xs rounded-md text-gray-900"
                  style={{ background: currentTheme.primary }}
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
