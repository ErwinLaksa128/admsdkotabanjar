import React, { useRef, useState, useCallback } from 'react';
import { Camera, RefreshCw } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
  initialImage?: string;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, initialImage }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(initialImage || null);
  const [error, setError] = useState<string>('');

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
        setError('');
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError('Tidak dapat mengakses kamera. Pastikan izin diberikan.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsStreaming(false);
    }
  };

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const dataUrl = canvas.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
        onCapture(dataUrl);
        stopCamera();
      }
    }
  }, [onCapture]);

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  React.useEffect(() => {
    // Clean up on unmount
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative h-64 w-64 overflow-hidden rounded-full border-4 border-white shadow-lg bg-gray-200">
        {!capturedImage ? (
          <>
            {!isStreaming && !error && (
              <div className="flex h-full w-full flex-col items-center justify-center text-gray-500">
                <Camera size={48} />
                <button 
                  onClick={startCamera}
                  className="mt-2 text-sm text-blue-600 hover:underline"
                >
                  Aktifkan Kamera
                </button>
              </div>
            )}
            {error && (
               <div className="flex h-full w-full flex-col items-center justify-center text-center text-red-500 p-4">
                 <p className="text-xs">{error}</p>
                 <button 
                  onClick={startCamera}
                  className="mt-2 text-xs text-blue-600 hover:underline"
                >
                  Coba Lagi
                </button>
               </div>
            )}
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted
              className={`h-full w-full object-cover ${!isStreaming ? 'hidden' : ''}`}
            />
          </>
        ) : (
          <img 
            src={capturedImage} 
            alt="Profile" 
            className="h-full w-full object-cover" 
          />
        )}
      </div>

      <div className="flex gap-2">
        {!capturedImage && isStreaming && (
          <button
            onClick={capturePhoto}
            className="flex items-center gap-2 rounded-full bg-blue-600 px-6 py-2 text-white shadow hover:bg-blue-700"
          >
            <Camera size={20} />
            Ambil Foto
          </button>
        )}
        
        {capturedImage && (
          <button
            onClick={retakePhoto}
            className="flex items-center gap-2 rounded-full bg-gray-600 px-6 py-2 text-white shadow hover:bg-gray-700"
          >
            <RefreshCw size={20} />
            Foto Ulang
          </button>
        )}
      </div>
      
      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraCapture;
