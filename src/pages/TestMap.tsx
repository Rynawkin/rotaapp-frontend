import React, { useState } from 'react';
import { AlertCircle, CheckCircle, MapPin, Loader2 } from 'lucide-react';

const TestMap: React.FC = () => {
  const [status, setStatus] = useState<'checking' | 'success' | 'error'>('checking');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [mapLoaded, setMapLoaded] = useState(false);
  
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // API Key kontrolü
  const checkApiKey = () => {
    if (!apiKey) {
      return { valid: false, message: 'API Key bulunamadı! .env dosyasını kontrol edin.' };
    }
    if (apiKey === 'your_google_maps_api_key_here') {
      return { valid: false, message: 'Varsayılan API key değiştirilmemiş!' };
    }
    if (apiKey.includes(' ')) {
      return { valid: false, message: 'API Key boşluk içeriyor!' };
    }
    if (apiKey.length < 30) {
      return { valid: false, message: 'API Key çok kısa görünüyor!' };
    }
    return { valid: true, message: 'API Key formatı doğru görünüyor.' };
  };

  // Basit harita yükle
  React.useEffect(() => {
    const keyCheck = checkApiKey();
    if (!keyCheck.valid) {
      setStatus('error');
      setErrorMessage(keyCheck.message);
      return;
    }

    // Google Maps'i manuel yükle
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        console.log('✅ Google Maps yüklendi!');
        setStatus('success');
        setMapLoaded(true);
        initMap();
      };
      
      script.onerror = () => {
        console.error('❌ Google Maps yüklenemedi!');
        setStatus('error');
        setErrorMessage('Google Maps yüklenemedi. API Key\'i kontrol edin.');
      };
      
      document.head.appendChild(script);
    } else {
      setStatus('success');
      setMapLoaded(true);
      initMap();
    }
  }, []);

  const initMap = () => {
    const mapDiv = document.getElementById('test-map');
    if (mapDiv && window.google) {
      const map = new google.maps.Map(mapDiv, {
        center: { lat: 40.9869, lng: 29.0252 },
        zoom: 11
      });

      // Test marker
      new google.maps.Marker({
        position: { lat: 40.9869, lng: 29.0252 },
        map: map,
        title: 'Kadıköy'
      });

      console.log('✅ Harita oluşturuldu!');
    }
  };

  // API'leri test et
  const testGoogleServices = async () => {
    const results = [];
    
    // 1. Geocoding Test
    try {
      const geocoder = new google.maps.Geocoder();
      const response = await geocoder.geocode({ address: 'Kadıköy, İstanbul' });
      results.push('✅ Geocoding API çalışıyor');
    } catch (e) {
      results.push('❌ Geocoding API çalışmıyor');
    }

    // 2. Directions Test
    try {
      const directionsService = new google.maps.DirectionsService();
      results.push('✅ Directions API yüklendi');
    } catch (e) {
      results.push('❌ Directions API yüklenemedi');
    }

    // 3. Distance Matrix Test
    try {
      const distanceService = new google.maps.DistanceMatrixService();
      results.push('✅ Distance Matrix API yüklendi');
    } catch (e) {
      results.push('❌ Distance Matrix API yüklenemedi');
    }

    alert(results.join('\n'));
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Google Maps API Test Sayfası</h1>
      
      {/* Status Card */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">API Durumu</h2>
        
        <div className="space-y-3">
          {/* API Key Status */}
          <div className="flex items-center space-x-3">
            {status === 'checking' && <Loader2 className="w-5 h-5 animate-spin text-blue-600" />}
            {status === 'success' && <CheckCircle className="w-5 h-5 text-green-600" />}
            {status === 'error' && <AlertCircle className="w-5 h-5 text-red-600" />}
            <div>
              <p className="font-medium">Google Maps API Key</p>
              <p className="text-sm text-gray-600">
                {status === 'checking' && 'Kontrol ediliyor...'}
                {status === 'success' && `Key aktif: ${apiKey?.substring(0, 10)}...`}
                {status === 'error' && errorMessage}
              </p>
            </div>
          </div>

          {/* Map Load Status */}
          <div className="flex items-center space-x-3">
            {mapLoaded ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-gray-400" />
            )}
            <div>
              <p className="font-medium">Harita Yükleme</p>
              <p className="text-sm text-gray-600">
                {mapLoaded ? 'Harita başarıyla yüklendi' : 'Harita henüz yüklenmedi'}
              </p>
            </div>
          </div>
        </div>

        {/* Test Button */}
        {mapLoaded && (
          <button
            onClick={testGoogleServices}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            API Servislerini Test Et
          </button>
        )}
      </div>

      {/* Debug Info */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="font-semibold mb-2">Debug Bilgileri:</h3>
        <pre className="text-xs text-gray-600">
          {JSON.stringify({
            apiKeyLength: apiKey?.length || 0,
            googleLoaded: typeof window !== 'undefined' && !!window.google,
            mapsLoaded: typeof window !== 'undefined' && !!window.google?.maps,
            env: import.meta.env.MODE
          }, null, 2)}
        </pre>
      </div>

      {/* Test Map */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-4">Test Haritası</h2>
        <div 
          id="test-map" 
          className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center"
        >
          {!mapLoaded && (
            <div className="text-center">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">Harita yükleniyor...</p>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Sorun Giderme:</h3>
        <ol className="text-sm text-blue-800 space-y-1">
          <li>1. Console'da (F12) kırmızı hata var mı kontrol edin</li>
          <li>2. API Key'in doğru yazıldığından emin olun</li>
          <li>3. Google Cloud Console'da API'lerin aktif olduğunu kontrol edin</li>
          <li>4. API Key kısıtlamalarını kontrol edin (localhost:5173 eklendi mi?)</li>
        </ol>
      </div>
    </div>
  );
};

export default TestMap;