import { useState, useRef } from 'react';
import { Upload, X, Film, CheckCircle, Loader2, Link, Cloud, Play, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import apiClient from '@/api/client';
import { toast } from 'sonner';

interface VideoUploadProps {
  onUploadComplete: (url: string) => void;
  currentUrl?: string;
}

const ALLOWED_EXTENSIONS = ['mp4', 'webm', 'mkv', 'avi', 'mov', 'flv', '3gp', 'm4v'];

export const VideoUpload = ({ onUploadComplete, currentUrl }: VideoUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [externalUrl, setExternalUrl] = useState('');
  const [activeTab, setActiveTab] = useState<string>('upload');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewStatus, setPreviewStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [previewError, setPreviewError] = useState('');
  const [selectedFileFormat, setSelectedFileFormat] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);

  const validateFile = (file: File): boolean => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
      toast.error(`Invalid file format. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`);
      return false;
    }
    if (file.size > 5 * 1024 * 1024 * 1024) {
      toast.error('File size must be less than 5GB');
      return false;
    }
    return true;
  };

  const uploadFile = async (file: File) => {
    if (!validateFile(file)) return;

    // Detect file format for guidance
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    setSelectedFileFormat(extension);

    setUploading(true);
    setProgress(0);
    setFileName(file.name);

    try {
      const response = await apiClient.uploadFile(
        '/videos/upload',
        file,
        (progressValue) => {
          setProgress(progressValue);
        }
      );

      setProgress(100);
      const videoUrl = response.url;
      setUploadedUrl(videoUrl);
      onUploadComplete(videoUrl);
      toast.success('Video uploaded successfully!');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload video');
      setFileName(null);
    } finally {
      setUploading(false);
    }
  };

  const openPreview = () => {
    if (!externalUrl.trim()) {
      toast.error('Please enter a URL first');
      return;
    }
    
    try {
      new URL(externalUrl);
    } catch {
      toast.error('Please enter a valid URL');
      return;
    }

    setPreviewUrl(externalUrl);
    setPreviewStatus('loading');
    setPreviewError('');
    setPreviewOpen(true);
  };

  const handlePreviewLoad = () => {
    setPreviewStatus('success');
  };

  const handlePreviewError = () => {
    setPreviewStatus('error');
    setPreviewError('Video failed to load. Check the URL or CORS settings on your server.');
  };

  const confirmAndSave = () => {
    setUploadedUrl(previewUrl);
    setFileName('External video');
    onUploadComplete(previewUrl);
    setPreviewOpen(false);
    toast.success('Video URL confirmed and saved!');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const videoFile = files.find(f => {
      const ext = f.name.split('.').pop()?.toLowerCase();
      return ext && ALLOWED_EXTENSIONS.includes(ext);
    });

    if (videoFile) {
      uploadFile(videoFile);
    } else {
      toast.error('Please drop a valid video file');
      setSelectedFileFormat(null);
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

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Upload File</TabsTrigger>
          <TabsTrigger value="url">External URL</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            } ${uploading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => !uploading && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_EXTENSIONS.map(ext => `.${ext}`).join(',')}
              onChange={handleFileSelect}
              className="hidden"
            />

            {uploading ? (
              <div className="space-y-4">
                <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Uploading {fileName}...</p>
                  <Progress value={progress} className="w-full" />
                  <p className="text-xs text-muted-foreground">{Math.round(progress)}%</p>
                </div>
              </div>
            ) : uploadedUrl ? (
              <div className="space-y-2">
                <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
                <p className="text-sm font-medium text-green-500">Upload Complete</p>
                <p className="text-xs text-muted-foreground truncate">{fileName}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setUploadedUrl(null);
                    setFileName(null);
                    setSelectedFileFormat(null);
                  }}
                >
                  Upload Another
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {ALLOWED_EXTENSIONS.map(ext => ext.toUpperCase()).join(', ')} (max 5GB)
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {/* Format Compatibility Notice */}
          {selectedFileFormat === 'mkv' && !uploading && !uploadedUrl && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-amber-700 dark:text-amber-300">
                <p className="font-medium mb-1">MKV Format Notice</p>
                <p>MKV files have limited browser support. For best compatibility across all browsers, we recommend using MP4 format (H.264 codec). MKV files may not play on Safari and some mobile browsers.</p>
              </div>
            </div>
          )}
          
          {/* Format Recommendation */}
          {!selectedFileFormat && !uploading && !uploadedUrl && (
            <div className="flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
              <Cloud className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-700 dark:text-blue-300">
                <strong>Tip:</strong> MP4 format (H.264 codec) provides the best compatibility across all browsers and devices.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="url" className="space-y-4">
          <div className="space-y-2">
            <Input
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              placeholder="https://example.com/video.m3u8 or direct video URL"
              className="font-mono text-sm"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={openPreview}
                disabled={!externalUrl.trim()}
              >
                <Play className="h-4 w-4 mr-2" />
                Preview
              </Button>
              {externalUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setUploadedUrl(externalUrl);
                    setFileName('External video');
                    onUploadComplete(externalUrl);
                    toast.success('External video URL saved!');
                  }}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Use URL
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Enter HLS (.m3u8) or direct video URL. Make sure the URL is accessible and supports CORS.
            </p>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Preview Video</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {previewStatus === 'loading' && (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            )}
            {previewStatus === 'error' && (
              <div className="flex flex-col items-center justify-center h-64 space-y-2 text-destructive">
                <AlertCircle className="h-8 w-8" />
                <p className="text-sm">{previewError}</p>
              </div>
            )}
            {previewStatus === 'success' && (
              <video
                ref={previewVideoRef}
                src={previewUrl}
                controls
                className="w-full rounded-lg"
                onLoadedData={handlePreviewLoad}
                onError={handlePreviewError}
              />
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPreviewOpen(false)}>
                Cancel
              </Button>
              <Button onClick={confirmAndSave} disabled={previewStatus !== 'success'}>
                Confirm & Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
