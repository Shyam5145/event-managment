import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Image as ImageIcon, 
  Trash2, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  X,
  FileImage
} from 'lucide-react';
import { 
  uploadEventPoster, 
  replaceEventPoster, 
  deleteEventPoster, 
  validatePosterFile 
} from '../../services/storageService.js';
import Button from '../common/Button';

export const PosterUpload = ({
  currentPosterUrl = '',
  eventId = 'new-event',
  onUploadSuccess,
  onRemove,
  disabled = false,
  label = 'Event Poster / Cover Banner',
}) => {
  const [previewUrl, setPreviewUrl] = useState(currentPosterUrl);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Sync preview when parent updates currentPosterUrl
  React.useEffect(() => {
    if (currentPosterUrl && currentPosterUrl !== previewUrl) {
      setPreviewUrl(currentPosterUrl);
    }
  }, [currentPosterUrl]);

  const handleFile = async (file) => {
    if (!file) return;

    setError(null);
    const validation = validatePosterFile(file);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    // Local instant preview
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);

    setUploading(true);
    setProgress(0);

    try {
      let uploadResult;
      if (currentPosterUrl && currentPosterUrl.includes('firebasestorage')) {
        // Replace existing storage file and clean up old one
        uploadResult = await replaceEventPoster(file, eventId, currentPosterUrl, (pct) => {
          setProgress(pct);
        });
      } else {
        // Upload new file
        uploadResult = await uploadEventPoster(file, eventId, (pct) => {
          setProgress(pct);
        });
      }

      setPreviewUrl(uploadResult.url);
      if (onUploadSuccess) {
        onUploadSuccess(uploadResult.url, uploadResult.path);
      }
    } catch (err) {
      console.error('Poster upload failed:', err);
      setError(err?.message || 'Failed to upload event poster. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled || uploading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled && !uploading) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleRemove = async () => {
    if (previewUrl && previewUrl.includes('firebasestorage')) {
      deleteEventPoster(previewUrl).catch((err) => {
        console.warn('Could not delete storage file:', err.message);
      });
    }

    setPreviewUrl('');
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onRemove) {
      onRemove();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-main">{label}</label>
        <span className="text-[11px] text-secondary">Max 5MB &bull; JPG, PNG, WebP, GIF</span>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={handleInputChange}
        disabled={disabled || uploading}
        className="hidden"
      />

      {/* Upload Zone / Active Preview */}
      {previewUrl ? (
        <div className="relative rounded-2xl overflow-hidden border border-border shadow-xs bg-slate-950 group">
          <img
            src={previewUrl}
            alt="Event Poster Preview"
            className="w-full h-48 sm:h-56 object-cover opacity-90 transition-opacity group-hover:opacity-95"
          />

          {/* Action Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/90 text-white backdrop-blur-md shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Poster Attached
              </span>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  icon={RefreshCw}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || disabled}
                  className="bg-white/90 hover:bg-white text-slate-900 border-none font-bold text-xs"
                >
                  Replace Poster
                </Button>

                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  icon={Trash2}
                  onClick={handleRemove}
                  disabled={uploading || disabled}
                  className="text-xs font-bold"
                >
                  Remove
                </Button>
              </div>
            </div>
          </div>

          {/* Progress Bar Overlay when uploading */}
          {uploading && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center p-6 space-y-3 z-20">
              <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <div className="text-center space-y-1 w-full max-w-xs">
                <p className="text-xs font-bold text-white">Uploading to Firebase Storage...</p>
                <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-[11px] text-white/80 font-mono">{progress}% Complete</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all cursor-pointer ${
            isDragOver
              ? 'border-primary bg-primary-light/40 scale-[1.01]'
              : 'border-border bg-slate-50/70 hover:bg-slate-100/70 hover:border-slate-300'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {uploading ? (
            <div className="space-y-3 max-w-xs mx-auto">
              <div className="w-9 h-9 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
              <p className="text-xs font-bold text-main">Uploading to Firebase Storage...</p>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-[10px] text-secondary font-mono">{progress}%</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="w-12 h-12 rounded-2xl bg-primary-light text-primary flex items-center justify-center mx-auto shadow-xs">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-main">
                  Click to upload or drag & drop event poster
                </p>
                <p className="text-xs text-secondary mt-0.5">
                  High quality 16:9 banner recommended (e.g. 1280x720)
                </p>
              </div>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary bg-white px-3 py-1 rounded-full border border-border">
                <FileImage className="w-3.5 h-3.5" />
                <span>PNG, JPG, WebP, GIF up to 5MB</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Feedback Banner */}
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-800">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span className="font-medium flex-1">{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-rose-400 hover:text-rose-600 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default PosterUpload;

