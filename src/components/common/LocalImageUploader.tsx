import React, { useState, useRef } from 'react';
import { UploadCloud, HardDrive, Image as ImageIcon, CheckCircle2, AlertCircle, Loader2, Sparkles, X } from 'lucide-react';
import { optimizeLocalImage, formatBytes, OptimizedImageResult } from '../../utils/imageUtils';

interface LocalImageUploaderProps {
  onImagesUploaded: (dataUrls: string[]) => void;
  multiple?: boolean;
  maxFiles?: number;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  label?: string;
  description?: string;
}

export const LocalImageUploader: React.FC<LocalImageUploaderProps> = ({
  onImagesUploaded,
  multiple = true,
  maxFiles = 8,
  maxWidth = 960,
  maxHeight = 1200,
  quality = 0.78,
  label = 'Upload from Local Drive',
  description = 'Supports PNG, JPG, WebP, AVIF, SVG (Auto-optimized for e-commerce catalog)'
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recentUploads, setRecentUploads] = useState<OptimizedImageResult[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleProcessFiles = async (files: FileList | File[]) => {
    const fileList = Array.from(files).filter(f => f.type.startsWith('image/')).slice(0, maxFiles);
    
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
            maxWidth,
            maxHeight,
            quality
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
        className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-8 transition-all cursor-pointer text-center group ${
          isDragging
            ? 'border-[#465FFF] bg-[#ECF3FF]/60 dark:bg-[#465FFF]/10 scale-[1.005] shadow-md'
            : 'border-gray-300 dark:border-gray-700 hover:border-[#465FFF] dark:hover:border-[#7592FF] bg-gray-50/70 dark:bg-white/[0.02] hover:bg-white dark:hover:bg-white/[0.04]'
        }`}
      >
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className={`w-13 h-13 rounded-2xl flex items-center justify-center transition-all shadow-xs ${
            isDragging
              ? 'bg-[#465FFF] text-white'
              : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 group-hover:border-[#465FFF]/50 group-hover:scale-105'
          }`}>
            {isProcessing ? (
              <Loader2 className="w-6 h-6 animate-spin text-[#465FFF]" />
            ) : (
              <HardDrive className="w-6 h-6 text-[#465FFF] dark:text-[#7592FF]" />
            )}
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white flex items-center justify-center gap-2">
              <span>{isProcessing ? 'Optimizing local drive files...' : label}</span>
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-md mx-auto">
              Drag and drop photos directly from your computer, or click to browse your local drive
            </p>
          </div>

          <div className="pt-1 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              disabled={isProcessing}
              onClick={(e) => {
                e.stopPropagation();
                handleTriggerPicker();
              }}
              className="px-4 py-2 bg-[#465FFF] hover:bg-[#3641F5] disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-semibold text-xs rounded-lg transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Browse Local Files</span>
            </button>
            <span className="text-[11px] font-mono-num text-gray-500 dark:text-gray-400">
              {multiple ? `Up to ${maxFiles} images at once` : 'Single image'}
            </span>
          </div>

          <p className="text-[11px] text-gray-400 dark:text-gray-500">
            {description}
          </p>
        </div>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="ml-auto text-rose-400 hover:text-rose-700 dark:hover:text-rose-200 font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Recent Local Upload Summary Chips */}
      {recentUploads.length > 0 && (
        <div className="p-3.5 bg-gray-50 dark:bg-white/[0.03] rounded-xl border border-gray-200 dark:border-gray-800 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Inserted from Local Drive ({recentUploads.length})</span>
            </span>
            <button
              type="button"
              onClick={() => setRecentUploads([])}
              className="text-[11px] text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white underline cursor-pointer"
            >
              Clear Log
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            {recentUploads.slice(0, 4).map((up, i) => {
              const savings = Math.max(0, Math.round(((up.originalSize - up.optimizedSize) / up.originalSize) * 100));
              return (
                <div key={i} className="flex items-center gap-2.5 p-2 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
                  <img src={up.dataUrl} alt={up.fileName} className="w-9 h-9 rounded-md object-cover shrink-0 bg-gray-100 dark:bg-gray-800" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 dark:text-white truncate">{up.fileName}</p>
                    <p className="text-[10px] font-mono-num text-gray-500 dark:text-gray-400">
                      {formatBytes(up.originalSize)} → <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{formatBytes(up.optimizedSize)}</span> ({savings}% saved)
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
