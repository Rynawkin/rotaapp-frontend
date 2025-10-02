import React, { useState, useEffect } from 'react';
import { Cloud, Droplets, Wind, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { weatherService, WeatherData } from '@/services/weather.service';
import { Depot } from '@/types';

interface WeatherWidgetProps {
  depots: Depot[];
  className?: string;
}

const WeatherWidget: React.FC<WeatherWidgetProps> = ({ depots, className = '' }) => {
  const [weatherData, setWeatherData] = useState<WeatherData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDepotIndex, setSelectedDepotIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    loadWeatherData();
  }, [depots]);

  const loadWeatherData = async () => {
    setLoading(true);
    const weatherPromises: Promise<WeatherData | null>[] = [];

    if (depots.length > 0) {
      // Depolar varsa, her depot için hava durumu al
      depots.forEach(depot => {
        if (depot.latitude && depot.longitude) {
          weatherPromises.push(
            weatherService.getWeatherByCoordinates(
              depot.latitude,
              depot.longitude,
              depot.name || depot.address,
              depot.id
            )
          );
        }
      });
    } else {
      // Depot yoksa, kaydedilmiş tercih edilen şehri kullan veya default İstanbul
      const preferredCity = weatherService.getPreferredCity() || 'Istanbul';
      weatherPromises.push(weatherService.getWeatherByCity(preferredCity));
    }

    try {
      const results = await Promise.all(weatherPromises);
      const validWeather = results.filter((w): w is WeatherData => w !== null);
      setWeatherData(validWeather);
    } catch (error) {
      console.error('Hava durumu yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-xl shadow-sm p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-32"></div>
        </div>
      </div>
    );
  }

  if (weatherData.length === 0) {
    return null;
  }

  const currentWeather = weatherData[selectedDepotIndex];

  return (
    <div className={`bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-sm p-6 text-white ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Cloud className="w-5 h-5 mr-2" />
          <h3 className="font-semibold">Hava Durumu</h3>
        </div>
        {weatherData.length > 1 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg transition-colors flex items-center"
          >
            {weatherData.length} Lokasyon
            {isExpanded ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
          </button>
        )}
      </div>

      {/* Lokasyon Seçici - Birden fazla depot varsa */}
      {weatherData.length > 1 && !isExpanded && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {weatherData.map((weather, index) => (
            <button
              key={index}
              onClick={() => setSelectedDepotIndex(index)}
              className={`px-3 py-1 rounded-lg text-sm whitespace-nowrap transition-colors ${
                selectedDepotIndex === index
                  ? 'bg-white text-blue-600 font-medium'
                  : 'bg-white/20 hover:bg-white/30'
              }`}
            >
              {weather.location}
            </button>
          ))}
        </div>
      )}

      {/* Tüm Lokasyonlar - Expanded */}
      {isExpanded ? (
        <div className="space-y-4">
          {weatherData.map((weather, index) => (
            <div key={index} className="bg-white/10 rounded-lg p-4">
              <WeatherCard weather={weather} compact />
            </div>
          ))}
        </div>
      ) : (
        /* Seçili Lokasyon Detay */
        <WeatherCard weather={currentWeather} />
      )}
    </div>
  );
};

interface WeatherCardProps {
  weather: WeatherData;
  compact?: boolean;
}

const WeatherCard: React.FC<WeatherCardProps> = ({ weather, compact = false }) => {
  return (
    <>
      {/* Lokasyon */}
      <div className="flex items-center mb-3">
        <MapPin className="w-4 h-4 mr-1" />
        <span className="text-sm font-medium">{weather.location}</span>
      </div>

      {/* Mevcut Hava Durumu */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center">
            <span className="text-5xl font-bold">{weather.temperature}°</span>
            <span className="text-3xl ml-2">{weather.icon}</span>
          </div>
          <p className="text-sm text-blue-100 mt-1">{weather.description}</p>
          <p className="text-xs text-blue-100">Hissedilen: {weather.feelsLike}°</p>
        </div>
        <div className="text-right space-y-2 text-sm">
          <div className="flex items-center justify-end">
            <Droplets className="w-4 h-4 mr-1" />
            <span>Nem: {weather.humidity}%</span>
          </div>
          <div className="flex items-center justify-end">
            <Wind className="w-4 h-4 mr-1" />
            <span>Rüzgar: {weather.windSpeed} km/s</span>
          </div>
        </div>
      </div>

      {/* 3 Günlük Tahmin */}
      {!compact && weather.forecast.length > 0 && (
        <>
          <div className="border-t border-white/20 pt-4 mt-4">
            <h4 className="text-sm font-semibold mb-3">3 Günlük Tahmin</h4>
            <div className="grid grid-cols-3 gap-2">
              {weather.forecast.map((day, index) => (
                <div key={index} className="bg-white/10 rounded-lg p-3 text-center">
                  <p className="text-xs font-medium mb-1">{day.dayName}</p>
                  <p className="text-2xl mb-1">{day.icon}</p>
                  <p className="text-sm font-semibold">
                    {day.tempMax}° / {day.tempMin}°
                  </p>
                  {day.rainChance > 0 && (
                    <div className="flex items-center justify-center text-xs mt-1">
                      <Droplets className="w-3 h-3 mr-1" />
                      {day.rainChance}%
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Compact view için mini tahmin */}
      {compact && weather.forecast.length > 0 && (
        <div className="flex gap-2 mt-2">
          {weather.forecast.slice(0, 2).map((day, index) => (
            <div key={index} className="flex items-center text-xs">
              <span className="mr-1">{day.dayName}:</span>
              <span className="mr-1">{day.icon}</span>
              <span>{day.tempMax}°/{day.tempMin}°</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default WeatherWidget;
