// frontend/src/components/journey/SignaturePad.tsx
import React, { useRef, useState, useEffect } from 'react';
import { X, RotateCcw, Check } from 'lucide-react';

interface SignaturePadProps {
  onSave: (signatureBlob: Blob) => void;
  onCancel: () => void;
  width?: number;
  height?: number;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  onSave,
  onCancel,
  width = 400,
  height = 200
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas setup
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#000000';

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
  }, [width, height]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsDrawing(true);
    setHasSignature(true);

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let x, y;
    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let x, y;
    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    setHasSignature(false);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (blob) {
        onSave(blob);
      }
    }, 'image/png');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold">İmza Ekle</h3>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="mb-2">
            <p className="text-sm text-gray-600">Lütfen aşağıdaki alana imzanızı çizin:</p>
          </div>

          <div className="border-2 border-gray-300 rounded-lg overflow-hidden mb-4">
            <canvas
              ref={canvasRef}
              width={width}
              height={height}
              className="w-full cursor-crosshair touch-none"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              style={{ touchAction: 'none' }}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={clearSignature}
              disabled={!hasSignature}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Temizle
            </button>
            <button
              onClick={saveSignature}
              disabled={!hasSignature}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              Kaydet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};