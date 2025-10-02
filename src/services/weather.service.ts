// OpenWeatherMap ücretsiz API kullanıyoruz (günlük 1000 request ücretsiz)
const WEATHER_API_KEY = '4d8fb5b93d4af21d66a2948710284366'; // Free tier API key
const WEATHER_API_BASE = 'https://api.openweathermap.org/data/2.5';
const CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 saat (milisaniye cinsinden)

export interface WeatherData {
  location: string;
  depotId?: string | number;
  temperature: number;
  feelsLike: number;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  rainChance?: number;
  forecast: DailyForecast[];
}

export interface DailyForecast {
  date: Date;
  dayName: string;
  tempMin: number;
  tempMax: number;
  description: string;
  icon: string;
  rainChance: number;
}

interface CachedWeatherData {
  data: WeatherData;
  timestamp: number;
}

class WeatherService {
  /**
   * Cache key oluştur
   */
  private getCacheKey(lat: number, lon: number): string {
    return `weather_${lat.toFixed(2)}_${lon.toFixed(2)}`;
  }

  /**
   * Cache'den veri al
   */
  private getFromCache(lat: number, lon: number): WeatherData | null {
    try {
      const cacheKey = this.getCacheKey(lat, lon);
      const cached = localStorage.getItem(cacheKey);

      if (!cached) return null;

      const cachedData: CachedWeatherData = JSON.parse(cached);
      const now = Date.now();

      // 12 saat geçmişse cache'i temizle
      if (now - cachedData.timestamp > CACHE_DURATION) {
        localStorage.removeItem(cacheKey);
        return null;
      }

      console.log(`✅ Cache'den yüklendi: ${cacheKey} (${Math.round((CACHE_DURATION - (now - cachedData.timestamp)) / 3600000)} saat kaldı)`);
      return cachedData.data;
    } catch (error) {
      console.error('Cache okuma hatası:', error);
      return null;
    }
  }

  /**
   * Cache'e veri kaydet
   */
  private saveToCache(lat: number, lon: number, data: WeatherData): void {
    try {
      const cacheKey = this.getCacheKey(lat, lon);
      const cachedData: CachedWeatherData = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(cacheKey, JSON.stringify(cachedData));
      console.log(`💾 Cache'e kaydedildi: ${cacheKey}`);
    } catch (error) {
      console.error('Cache yazma hatası:', error);
    }
  }

  /**
   * Koordinatlara göre hava durumu bilgisi al (12 saat cache ile)
   */
  async getWeatherByCoordinates(lat: number, lon: number, locationName: string, depotId?: string | number): Promise<WeatherData | null> {
    // Önce cache'e bak
    const cachedData = this.getFromCache(lat, lon);
    if (cachedData) {
      return {
        ...cachedData,
        location: locationName, // Lokasyon adını güncelle
        depotId
      };
    }

    try {
      // Cache yoksa API'den çek
      console.log(`🌐 API'den çekiliyor: ${locationName} (${lat}, ${lon})`);

      // Mevcut hava durumu
      const currentResponse = await fetch(
        `${WEATHER_API_BASE}/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric&lang=tr`
      );

      if (!currentResponse.ok) {
        console.error('Hava durumu API hatası:', currentResponse.status);
        return null;
      }

      const currentData = await currentResponse.json();

      // 3 günlük tahmin
      const forecastResponse = await fetch(
        `${WEATHER_API_BASE}/forecast?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric&lang=tr`
      );

      let forecast: DailyForecast[] = [];

      if (forecastResponse.ok) {
        const forecastData = await forecastResponse.json();
        forecast = this.processForecastData(forecastData);
      }

      const weatherData: WeatherData = {
        location: locationName,
        depotId,
        temperature: Math.round(currentData.main.temp),
        feelsLike: Math.round(currentData.main.feels_like),
        description: this.capitalizeFirst(currentData.weather[0].description),
        icon: this.getWeatherIcon(currentData.weather[0].icon),
        humidity: currentData.main.humidity,
        windSpeed: Math.round(currentData.wind.speed * 3.6), // m/s to km/h
        rainChance: currentData.rain ? Math.round((currentData.rain['1h'] || 0) * 10) : 0,
        forecast
      };

      // Cache'e kaydet
      this.saveToCache(lat, lon, weatherData);

      return weatherData;
    } catch (error) {
      console.error('Hava durumu alınırken hata:', error);
      return null;
    }
  }

  /**
   * Şehir adına göre hava durumu al
   */
  async getWeatherByCity(cityName: string): Promise<WeatherData | null> {
    try {
      const response = await fetch(
        `${WEATHER_API_BASE}/weather?q=${cityName},TR&appid=${WEATHER_API_KEY}&units=metric&lang=tr`
      );

      if (!response.ok) {
        console.error('Şehir bulunamadı:', cityName);
        return null;
      }

      const data = await response.json();
      return this.getWeatherByCoordinates(data.coord.lat, data.coord.lon, cityName);
    } catch (error) {
      console.error('Hava durumu alınırken hata:', error);
      return null;
    }
  }

  /**
   * Tahmin verilerini işle - günlük bazda grupla
   */
  private processForecastData(forecastData: any): DailyForecast[] {
    const dailyData = new Map<string, any[]>();

    // 5 günlük 3 saatlik verileri günlük bazda grupla
    forecastData.list.forEach((item: any) => {
      const date = new Date(item.dt * 1000);
      const dateKey = date.toISOString().split('T')[0];

      if (!dailyData.has(dateKey)) {
        dailyData.set(dateKey, []);
      }
      dailyData.get(dateKey)!.push(item);
    });

    // İlk 3 günü al (bugün dahil)
    const days = Array.from(dailyData.entries()).slice(0, 3);
    const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

    return days.map(([dateKey, items]) => {
      const date = new Date(dateKey);
      const temps = items.map(item => item.main.temp);
      const tempMin = Math.round(Math.min(...temps));
      const tempMax = Math.round(Math.max(...temps));

      // Gün ortası verisi al (en yakın öğlen vakti)
      const noonItem = items.reduce((prev, curr) => {
        const prevHour = new Date(prev.dt * 1000).getHours();
        const currHour = new Date(curr.dt * 1000).getHours();
        return Math.abs(currHour - 12) < Math.abs(prevHour - 12) ? curr : prev;
      });

      // Yağış ihtimali hesapla (pop - probability of precipitation)
      const rainChance = Math.round(Math.max(...items.map((item: any) => item.pop || 0)) * 100);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const isToday = date.getTime() === today.getTime();

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const isTomorrow = date.getTime() === tomorrow.getTime();

      let dayName = dayNames[date.getDay()];
      if (isToday) dayName = 'Bugün';
      else if (isTomorrow) dayName = 'Yarın';

      return {
        date,
        dayName,
        tempMin,
        tempMax,
        description: this.capitalizeFirst(noonItem.weather[0].description),
        icon: this.getWeatherIcon(noonItem.weather[0].icon),
        rainChance
      };
    });
  }

  /**
   * OpenWeatherMap icon kodunu emoji'ye çevir
   */
  private getWeatherIcon(iconCode: string): string {
    const iconMap: { [key: string]: string } = {
      '01d': '☀️', // clear sky day
      '01n': '🌙', // clear sky night
      '02d': '⛅', // few clouds day
      '02n': '☁️', // few clouds night
      '03d': '☁️', // scattered clouds
      '03n': '☁️',
      '04d': '☁️', // broken clouds
      '04n': '☁️',
      '09d': '🌧️', // shower rain
      '09n': '🌧️',
      '10d': '🌦️', // rain day
      '10n': '🌧️', // rain night
      '11d': '⛈️', // thunderstorm
      '11n': '⛈️',
      '13d': '❄️', // snow
      '13n': '❄️',
      '50d': '🌫️', // mist
      '50n': '🌫️'
    };

    return iconMap[iconCode] || '🌤️';
  }

  /**
   * İlk harfi büyüt
   */
  private capitalizeFirst(text: string): string {
    return text.charAt(0).toLocaleUpperCase('tr-TR') + text.slice(1);
  }

  /**
   * LocalStorage'dan kaydedilmiş hava durumu tercihini al
   */
  getPreferredCity(): string | null {
    return localStorage.getItem('preferredWeatherCity');
  }

  /**
   * Kullanıcının tercih ettiği şehri kaydet
   */
  setPreferredCity(city: string): void {
    localStorage.setItem('preferredWeatherCity', city);
  }

  /**
   * Tercih edilen şehri temizle
   */
  clearPreferredCity(): void {
    localStorage.removeItem('preferredWeatherCity');
  }
}

export const weatherService = new WeatherService();
