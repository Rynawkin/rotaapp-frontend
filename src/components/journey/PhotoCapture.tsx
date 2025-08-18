// frontend/src/components/journey/PhotoCapture.tsx
import React, { useRef, useState, useCallback } from 'react';
import { Camera, X, Upload, RotateCcw, Check } from 'lucide-react';

interface PhotoCaptureProps {
  onCapture: (photoBlob: Blob) => void;
  onCancel: () => void;
  maxSizeMB?: number;
}

export const PhotoCapture: React.FC<PhotoCaptureProps> = ({
  onCapture,
  onCancel,
  maxSizeMB = 5
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'camera' | 'upload'>('camera');

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      
      setStream(mediaStream);
      setIsLoading(false);
    } catch (err) {
      console.error('Camera error:', err);
      setError('Kamera erişimi sağlanamadı. Lütfen kamera izinlerini kontrol edin.');
      setIsLoading(false);
      setMode('upload');
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  // Capture photo from camera
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    // Set canvas size to video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Get image data URL
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(imageDataUrl);
    
    // Stop camera after capture
    stopCamera();
  }, [stopCamera]);

  // Handle file upload
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`Dosya boyutu ${maxSizeMB}MB'dan büyük olamaz.`);
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('Lütfen geçerli bir resim dosyası seçin.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setCapturedImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, [maxSizeMB]);

  // Retake photo
  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    setError(null);
    if (mode === 'camera') {
      startCamera();
    }
  }, [mode, startCamera]);

  // Save photo
  const savePhoto = useCallback(() => {
    if (!capturedImage) return;

    // Convert data URL to blob
    fetch(capturedImage)
      .then(res => res.blob())
      .then(blob => {
        onCapture(blob);
        stopCamera();
      })
      .catch(err => {
        console.error('Error converting image:', err);
        setError('Resim kaydedilemedi. Lütfen tekrar deneyin.');
      });
  }, [capturedImage, onCapture, stopCamera]);

  // Cleanup on unmount
  React.useEffect(() => {
    if (mode === 'camera' && !capturedImage) {
      startCamera();
    }

    return () => {
      stopCamera();
    };
  }, [mode]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white">
          <h3 className="text-lg font-semibold">Fotoğraf Ekle</h3>
          <button
            onClick={() => {
              stopCamera();
              onCancel();
            }}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {!capturedImage && (
            <div className="mb-4">
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setMode('camera')}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                    mode === 'camera' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  Kamera
                </button>
                <button
                  onClick={() => setMode('upload')}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                    mode === 'upload' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  Dosya Yükle
                </button>
              </div>

              {mode === 'camera' ? (
                <div className="relative bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-auto"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  
                  {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                      <div className="text-white">Kamera açılıyor...</div>
                    </div>
                  )}
                  
                  {stream && (
                    <button
                      onClick={capturePhoto}
                      className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-6 py-3 bg-white text-gray-900 rounded-full hover:bg-gray-100 transition-colors flex items-center gap-2 shadow-lg"
                    >
                      <Camera className="w-5 h-5" />
                      Fotoğraf Çek
                    </button>
                  )}
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex flex-col items-center justify-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <Upload className="w-12 h-12" />
                    <span className="text-sm">Fotoğraf seçmek için tıklayın</span>
                    <span className="text-xs text-gray-500">Maksimum {maxSizeMB}MB</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {capturedImage && (
            <div className="mb-4">
              <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                <img 
                  src={capturedImage} 
                  alt="Captured" 
                  className="w-full h-auto"
                />
              </div>
            </div>
          )}

          {capturedImage && (
            <div className="flex gap-2">
              <button
                onClick={retakePhoto}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Tekrar Çek
              </button>
              <button
                onClick={savePhoto}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Kaydet
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};