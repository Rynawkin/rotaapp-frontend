import { Mail, Phone, MessageCircle, HelpCircle, Clock } from 'lucide-react';
import { useState } from 'react';

export default function Support() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const mailtoLink = `mailto:info@yolpilot.com?subject=${encodeURIComponent(formData.subject)}&body=${encodeURIComponent(
      `Ad Soyad: ${formData.name}\nE-posta: ${formData.email}\n\nMesaj:\n${formData.message}`
    )}`;
    
    window.location.href = mailtoLink;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            YolPilot Sürücü - Destek
          </h1>
          <p className="text-xl text-gray-600">
            Size yardımcı olmak için buradayız. Sorularınız için bize ulaşın.
          </p>
        </div>

        {/* Contact Methods */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-4">
              <Mail className="h-8 w-8 text-blue-600 mr-3" />
              <h2 className="text-2xl font-semibold text-gray-900">E-posta Desteği</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Teknik destek ve genel sorularınız için e-posta gönderin.
            </p>
            <a 
              href="mailto:info@yolpilot.com"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              info@yolpilot.com
            </a>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-4">
              <Phone className="h-8 w-8 text-green-600 mr-3" />
              <h2 className="text-2xl font-semibold text-gray-900">Telefon Desteği</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Acil durumlar ve hızlı çözüm için bizi arayın.
            </p>
            <a 
              href="tel:+905301783570"
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              +90 530 178 35 70
            </a>
          </div>
        </div>

        {/* Support Hours */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center mb-4">
            <Clock className="h-8 w-8 text-orange-600 mr-3" />
            <h2 className="text-2xl font-semibold text-gray-900">Destek Saatleri</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Hafta İçi</h3>
              <p className="text-gray-600">Pazartesi - Cuma: 09:00 - 18:00</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Hafta Sonu</h3>
              <p className="text-gray-600">Cumartesi - Pazar: 10:00 - 16:00</p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center mb-6">
            <HelpCircle className="h-8 w-8 text-purple-600 mr-3" />
            <h2 className="text-2xl font-semibold text-gray-900">Sık Sorulan Sorular</h2>
          </div>
          
          <div className="space-y-6">
            <div className="border-b pb-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Uygulamaya nasıl kayıt olabilirim?
              </h3>
              <p className="text-gray-600">
                Yeni kullanıcı kayıtları web panelimizden yapılmaktadır. 
                <a href="https://app.yolpilot.com" className="text-blue-600 hover:underline ml-1">
                  https://app.yolpilot.com
                </a> adresinden kayıt olabilir veya yöneticiniz ile iletişime geçebilirsiniz.
              </p>
            </div>

            <div className="border-b pb-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Şifremi unuttum, ne yapmalıyım?
              </h3>
              <p className="text-gray-600">
                Uygulama giriş ekranında "Şifremi Unuttum" bağlantısını tıklayın. 
                E-posta adresinizi girerek şifre sıfırlama bağlantısı alabilirsiniz.
              </p>
            </div>

            <div className="border-b pb-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                GPS konumum doğru çalışmıyor, ne yapmalıyım?
              </h3>
              <p className="text-gray-600">
                Cihazınızın konum servislerinin açık olduğundan emin olun. 
                Uygulama ayarlarından konum izinlerini kontrol edin ve gerekirse yeniden başlatın.
              </p>
            </div>

            <div className="border-b pb-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Teslimat fotoğrafı çekemiyorum, sorun nedir?
              </h3>
              <p className="text-gray-600">
                Cihazınızın kamera izinlerinin YolPilot uygulaması için açık olduğundan emin olun. 
                Ayarlar &gt; Gizlilik &gt; Kamera bölümünden izinleri kontrol edebilirsiniz.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Uygulama çöküyor veya yavaş çalışıyor
              </h3>
              <p className="text-gray-600">
                Öncelikle uygulamayı tamamen kapatıp yeniden açmayı deneyin. 
                Sorun devam ederse cihazınızı yeniden başlatın ve uygulamanın son sürümünü kullandığınızdan emin olun.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center mb-6">
            <MessageCircle className="h-8 w-8 text-indigo-600 mr-3" />
            <h2 className="text-2xl font-semibold text-gray-900">Bize Mesaj Gönderin</h2>
          </div>
          
          <form 
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ad Soyad
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Adınızı ve soyadınızı girin"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  E-posta Adresi
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="E-posta adresinizi girin"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Konu
              </label>
              <select 
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Konu seçin</option>
                <option value="Teknik Destek">Teknik Destek</option>
                <option value="Hesap Sorunları">Hesap Sorunları</option>
                <option value="Özellik İsteği">Özellik İsteği</option>
                <option value="Hata Bildirimi">Hata Bildirimi</option>
                <option value="Diğer">Diğer</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mesajınız
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                rows={5}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Sorununuzu veya mesajınızı detaylarıyla yazın"
              ></textarea>
            </div>
            
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Mesajı Gönder
            </button>
            
          </form>
        </div>

      </div>
    </div>
  );
}