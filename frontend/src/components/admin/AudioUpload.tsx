import { useState, useRef } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import apiClient from '@/api/client';

interface AudioUploadProps {
  onUploadComplete: (url: string) => void;
  currentUrl?: string;
  language?: string;
}

const ALLOWED_EXTENSIONS = ['mp3', 'aac', 'm4a', 'ogg', 'wav', 'flac', 'opus'];

export const AudioUpload = ({ onUploadComplete, currentUrl, language }: AudioUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(currentUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const validateFile = (file: File): boolean => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
      toast.error(`Invalid audio format. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`);
      return false;
    }
    if (file.size > 500 * 1024 * 1024) {
      toast.error('Audio file size must be less than 500MB');
      return false;
    }
    return true;
  };

  const uploadFile = async (file: File) => {
    if (!validateFile(file)) return;

    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('audio', file);
      
      const response = await apiClient.uploadFile(
        '/videos/audio/upload',
        file,
        (progressValue) => {
          setProgress(progressValue);
        }
      );

      setProgress(100);
      const audioUrl = response.url;
      setUploadedUrl(audioUrl);
      onUploadComplete(audioUrl);
      toast.success('Audio file uploaded successfully!');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload audio file');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const audioFile = files.find(f => {
      const ext = f.name.split('.').pop()?.toLowerCase();
      return ext && ALLOWED_EXTENSIONS.includes(ext);
    });

    if (audioFile) {
      uploadFile(audioFile);
    } else {
      toast.error('Please drop a valid audio file');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  const handleRemove = () => {
    setUploadedUrl(null);
    onUploadComplete('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      {uploadedUrl ? (
        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="flex-shrink-0">
              <Upload className="w-4 h-4 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-green-800 truncate">
                {language ? `${language} Audio` : 'Audio File'} ✅
              </p>
              <p className="text-xs text-green-600 truncate">{uploadedUrl}</p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            className="flex-shrink-0 text-red-500 hover:text-red-700"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
            isDragging
              ? 'border-primary bg-primary/10'
              : 'border-gray-300 hover:border-primary bg-gray-50 hover:bg-primary/5'
          } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
          onClick={() => !uploading && fileInputRef.current?.click()}
        >
          {uploading ? (
            <div className="space-y-2">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
              <p className="text-sm text-muted-foreground">Uploading...</p>
              {progress > 0 && (
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </div>
          ) : (
            <>
              <Upload className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium mb-1 text-gray-700">
                🎵 Drop audio file here or click to browse
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                Supported formats: {ALLOWED_EXTENSIONS.join(', ').toUpperCase()}
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                Max file size: 500MB
              </p>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                📁 Select Audio File
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_EXTENSIONS.map(ext => `.${ext}`).join(',')}
                onChange={handleFileSelect}
                className="hidden"
              />
            </>
          )}
        </div>
      )}
    </div>
  );
};
