// frontend/src/components/journey/StopCard.tsx
import React, { useState } from 'react';
import { 
  MapPin, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Camera, 
  Edit3, 
  AlertCircle,
  ChevronRight,
  Phone,
  Mail,
  Navigation
} from 'lucide-react';
import { JourneyStop } from '../../types';
import { SignaturePad } from './SignaturePad';
import { PhotoCapture } from './PhotoCapture';
import { formatters } from '../../utils/formatters';

interface StopCardProps {
  stop: JourneyStop;
  isActive: boolean;
  onCheckIn?: () => void;
  onComplete?: (data: FormData) => void;
  onFail?: (reason: string) => void;
  onNavigate?: () => void;
  onCall?: () => void;
  onEmail?: () => void;
}

export const StopCard: React.FC<StopCardProps> = ({
  stop,
  isActive,
  onCheckIn,
  onComplete,
  onFail,
  onNavigate,
  onCall,
  onEmail
}) => {
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);
  const [failReason, setFailReason] = useState('');
  const [showFailDialog, setShowFailDialog] = useState(false);
  const [signature, setSignature] = useState<Blob | null>(null);
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [notes, setNotes] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusColor = () => {
    switch (stop.status) {
      case 'Completed':
        return 'bg-green-50 border-green-200';
      case 'Failed':
        return 'bg-red-50 border-red-200';
      case 'InProgress':
        return 'bg-blue-50 border-blue-200';
      case 'Skipped':
        return 'bg-gray-50 border-gray-200';
      default:
        return isActive ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-200';
    }
  };

  const getStatusIcon = () => {
    switch (stop.status) {
      case 'Completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'Failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'InProgress':
        return <div className="w-5 h-5 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />;
      case 'Skipped':
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
    }
  };

  const handleComplete = () => {
    if (!onComplete) return;

    const formData = new FormData();
    
    if (signature) {
      formData.append('signature', signature, 'signature.png');
    }
    
    if (photo) {
      formData.append('photo', photo, 'photo.jpg');
    }
    
    if (notes) {
      formData.append('notes', notes);
    }

    onComplete(formData);
    
    // Reset states
    setSignature(null);
    setPhoto(null);
    setNotes('');
  };

  const handleFail = () => {
    if (!onFail || !failReason.trim()) return;
    
    onFail(failReason);
    setShowFailDialog(false);
    setFailReason('');
  };

  return (
    <>
      <div className={`border rounded-lg p-4 transition-all ${getStatusColor()}`}>
        <div 
          className="flex items-start justify-between cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-start gap-3 flex-1">
            <div className="mt-1">
              {getStatusIcon()}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-gray-900">
                  Durak #{stop.order}
                </h4>
                {isActive && (
                  <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                    Aktif
                  </span>
                )}
              </div>
              
              <div className="mt-1 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{stop.endAddress}</span>
                </div>
                
                <div className="flex items-center gap-1 mt-1">
                  <Clock className="w-4 h-4" />
                  <span>
                    Tahmini: {stop.estimatedArrivalTime}
                    {stop.arriveBetweenStart && stop.arriveBetweenEnd && (
                      <span className="ml-1 text-gray-500">
                        ({stop.arriveBetweenStart} - {stop.arriveBetweenEnd})
                      </span>
                    )}
                  </span>
                </div>
                
                {stop.actualArrivalTime && (
                  <div className="text-xs text-gray-500 mt-1">
                    Gerçek: {formatters.formatDate(stop.actualArrivalTime)}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
        </div>

        {isExpanded && (
          <div className="mt-4 pt-4 border-t">
            <div className="grid grid-cols-2 gap-2 text-sm mb-3">
              <div>
                <span className="text-gray-500">Mesafe:</span>
                <span className="ml-1 font-medium">{stop.distance} km</span>
              </div>
              <div>
                <span className="text-gray-500">Durum:</span>
                <span className="ml-1 font-medium">{stop.status}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
              {stop.status === 'Pending' && isActive && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCheckIn?.();
                    }}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    Check-in
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate?.();
                    }}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Navigation className="w-4 h-4" />
                  </button>
                </>
              )}

              {stop.status === 'InProgress' && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowPhotoCapture(true);
                    }}
                    className="flex items-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  >
                    <Camera className="w-4 h-4" />
                    {photo ? 'Fotoğraf Değiştir' : 'Fotoğraf'}
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowSignaturePad(true);
                    }}
                    className="flex items-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  >
                    <Edit3 className="w-4 h-4" />
                    {signature ? 'İmza Değiştir' : 'İmza'}
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleComplete();
                    }}
                    className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    Tamamla
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowFailDialog(true);
                    }}
                    className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                  >
                    Başarısız
                  </button>
                </>
              )}

              {/* Contact buttons */}
              {onCall && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCall();
                  }}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Phone className="w-4 h-4" />
                </button>
              )}
              
              {onEmail && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEmail();
                  }}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Mail className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Notes input for InProgress */}
            {stop.status === 'InProgress' && (
              <div className="mt-3">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notlar (opsiyonel)"
                  className="w-full px-3 py-2 border rounded-lg text-sm resize-none"
                  rows={2}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}

            {/* Status badges */}
            <div className="mt-3 flex flex-wrap gap-2">
              {photo && (
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                  ✓ Fotoğraf eklendi
                </span>
              )}
              {signature && (
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                  ✓ İmza eklendi
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Signature Pad Modal */}
      {showSignaturePad && (
        <SignaturePad
          onSave={(blob) => {
            setSignature(blob);
            setShowSignaturePad(false);
          }}
          onCancel={() => setShowSignaturePad(false)}
        />
      )}

      {/* Photo Capture Modal */}
      {showPhotoCapture && (
        <PhotoCapture
          onCapture={(blob) => {
            setPhoto(blob);
            setShowPhotoCapture(false);
          }}
          onCancel={() => setShowPhotoCapture(false)}
        />
      )}

      {/* Fail Dialog */}
      {showFailDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Teslimat Başarısız</h3>
            <textarea
              value={failReason}
              onChange={(e) => setFailReason(e.target.value)}
              placeholder="Başarısızlık sebebini yazın..."
              className="w-full px-3 py-2 border rounded-lg resize-none"
              rows={4}
              autoFocus
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {
                  setShowFailDialog(false);
                  setFailReason('');
                }}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleFail}
                disabled={!failReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Onayla
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};