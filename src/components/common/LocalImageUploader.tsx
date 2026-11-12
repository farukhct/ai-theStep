import React, { useState, useRef } from 'react';
import { UploadCloud, HardDrive, Image as ImageIcon, CheckCircle2, AlertCircle, Loader2, Sparkles, X } from 'lucide-react';
import { optimizeLocalImage, formatBytes, OptimizedImageResult } from '../../utils/imageUtils';

interface LocalImageUploaderProps {
  onImagesUploaded: (dataUrls: string[]) => void;
  multiple?: boolean;
  maxFiles?: number;
  label?: string;
  description?: string;
}

export const LocalImageUploader: React.FC<LocalImageUploaderProps> = ({
  onImagesUploaded,
  multiple = true,
  maxFiles = 8,
  label = 'Upload from Local Drive',
  description = 'Supports PNG, JPG, WebP, AVIF, SVG (Auto-optimized for e-commerce catalog)'
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recentUploads, setRecentUploads] = useState<OptimizedImageResult[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleProcessFiles = async (files: FileList | File[]) => {
    const fileList = Array.from(files).filter(f => f.type.startsWith('image/'));
    
    if (fileList.length === 0) {
      setErrorMsg('No valid image files found in selection.');
      return;
    }

    if (!multiple && fileList.length > 1) {
      fileList.splice(1);
    }

    setErrorMsg(null);
    setIsProcessing(true);

    const successfulResults: OptimizedImageResult[] = [];
    const newUrls: string[] = [];

    try {
      for (const file of fileList) {
        try {
          const res = await optimizeLocalImage(file, {
            maxWidth: 1200,
            maxHeight: 1500,
            quality: 0.85
          });
          successfulResults.push(res);
          newUrls.push(res.dataUrl);
        } catch (err: any) {
          console.error(`Error processing ${file.name}:`, err);
        }
      }

      if (successfulResults.length > 0) {
        setRecentUploads(prev => [...successfulResults, ...prev].slice(0, 10));
        onImagesUploaded(newUrls);
      } else {
        setErrorMsg('Failed to decode the selected image file(s).');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while uploading local files.');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleProcessFiles(e.target.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFiles(e.dataTransfer.files);
    }
  };

  const handleTriggerPicker = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-3">
      {/* Hidden native input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/avif,image/svg+xml,image/gif"
        multiple={multiple}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Drag & Drop Surface */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleTriggerPicker}
        className={`relative border-2 border-dashed rounded-xl p-5 sm:p-6 transition-all cursor-pointer text-center group ${
          isDragging
            ? 'border-neutral-950 bg-neutral-100 scale-[1.01] shadow-md'
            : 'border-neutral-300 hover:border-neutral-800 bg-neutral-50/70 hover:bg-white'
        }`}
      >
        <div className="flex flex-col items-center justify-center space-y-2.5">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors shadow-xs ${
            isDragging ? 'bg-neutral-950 text-white' : 'bg-white text-neutral-800 border border-neutral-200 group-hover:border-neutral-400 group-hover:scale-105'
          }`}>
            {isProcessing ? (
              <Loader2 className="w-6 h-6 animate-spin text-neutral-900" />
            ) : (
              <HardDrive className="w-6 h-6 text-neutral-900" />
            )}
          </div>

          <div>
            <p className="text-xs sm:text-sm font-bold text-neutral-950 flex items-center justify-center gap-1.5">
              <span>{isProcessing ? 'Processing local drive files...' : label}</span>
              <span className="text-[10px] font-mono font-normal px-2 py-0.5 rounded bg-neutral-200 text-neutral-700">
                Local Drive
              </span>
            </p>
            <p className="text-[11px] text-neutral-500 mt-1 max-w-sm mx-auto">
              Drag & drop photos directly from your computer, or click to browse hard drive
            </p>
          </div>

          <div className="pt-1 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              disabled={isProcessing}
              onClick={(e) => {
                e.stopPropagation();
                handleTriggerPicker();
              }}
              className="px-3.5 py-1.5 bg-neutral-950 hover:bg-neutral-800 disabled:bg-neutral-300 text-white font-bold text-xs rounded-lg transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Browse Files</span>
            </button>
            <span className="text-[10px] text-neutral-400">
              {multiple ? `Up to ${maxFiles} images at once` : 'Single image'}
            </span>
          </div>

          <p className="text-[10px] text-neutral-400">
            {description}
          </p>
        </div>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
          <button 
            type="button" 
            onClick={() => setErrorMsg(null)} 
            className="ml-auto text-rose-400 hover:text-rose-700 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Recent Local Upload Summary Chips */}
      {recentUploads.length > 0 && (
        <div className="p-3 bg-neutral-100/70 rounded-xl border border-neutral-200 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-neutral-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Successfully Inserted from Local Drive ({recentUploads.length})</span>
            </span>
            <button
              type="button"
              onClick={() => setRecentUploads([])}
              className="text-[10px] text-neutral-500 hover:text-neutral-900 underline cursor-pointer"
            >
              Clear Log
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            {recentUploads.slice(0, 4).map((up, i) => {
              const savings = Math.max(0, Math.round(((up.originalSize - up.optimizedSize) / up.originalSize) * 100));
              return (
                <div key={i} className="flex items-center gap-2 p-1.5 bg-white rounded-lg border border-neutral-200 shadow-2xs">
                  <img src={up.dataUrl} alt={up.fileName} className="w-8 h-8 rounded object-cover shrink-0 bg-neutral-100" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-neutral-900 truncate">{up.fileName}</p>
                    <p className="text-[10px] text-neutral-400">
                      {formatBytes(up.originalSize)} → <span className="text-emerald-700 font-bold">{formatBytes(up.optimizedSize)}</span> ({savings}% saved)
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
