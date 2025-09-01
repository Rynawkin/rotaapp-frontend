import React from 'react';

const TermsOfService: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Kullanım Koşulları
        </h1>
        <p className="text-sm text-gray-600 mb-6">
          Son Güncelleme: 1 Eylül 2025
        </p>
        
        <div className="border-t pt-6 space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-blue-600 mb-3">
              1. Kabul ve Onay
            </h2>
            <p className="text-gray-700 leading-relaxed">
              YolPilot uygulamasını kullanarak bu kullanım koşullarını kabul etmiş olursunuz. 
              Bu koşulları kabul etmiyorsanız, uygulamayı kullanmamanız gerekmektedir.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-blue-600 mb-3">
              2. Hizmet Tanımı
            </h2>
            <p className="text-gray-700 leading-relaxed">
              YolPilot, teslimat ve rota optimizasyonu hizmeti sunan bir SaaS platformudur. 
              Hizmetlerimiz:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-700">
              <li>Rota planlama ve optimizasyon</li>
              <li>Teslimat takibi</li>
              <li>Sürücü ve araç yönetimi</li>
              <li>Müşteri bildirimleri</li>
              <li>Performans raporları</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-blue-600 mb-3">
              3. Hesap Sorumluluğu
            </h2>
            <ul className="list-disc pl-6 space-y-1 text-gray-700">
              <li>Hesap bilgilerinizin gizliliğinden siz sorumlusunuz</li>
              <li>Hesabınızda gerçekleşen tüm aktivitelerden sorumlusunuz</li>
              <li>Yetkisiz kullanımı derhal bildirmelisiniz</li>
              <li>18 yaşından büyük olmalı veya yasal temsilci onayı almalısınız</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-blue-600 mb-3">
              4. Kullanım Kuralları
            </h2>
            <p className="text-gray-700 leading-relaxed mb-2">
              Aşağıdaki davranışlar yasaktır:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700">
              <li>Yasalara aykırı kullanım</li>
              <li>Başkalarının haklarını ihlal eden içerik</li>
              <li>Spam veya kötü amaçlı yazılım dağıtımı</li>
              <li>Sistemi manipüle etme girişimleri</li>
              <li>Sahte veya yanıltıcı bilgi girişi</li>
              <li>Fikri mülkiyet haklarının ihlali</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-blue-600 mb-3">
              5. Ödeme ve Abonelik
            </h2>
            <ul className="list-disc pl-6 space-y-1 text-gray-700">
              <li>Abonelik ücretleri aylık olarak tahsil edilir</li>
              <li>Plan değişiklikleri bir sonraki fatura döneminde geçerli olur</li>
              <li>İptal durumunda dönem sonuna kadar hizmet devam eder</li>
              <li>Limit aşımları ek ücrete tabidir</li>
              <li>Fiyat değişiklikleri 30 gün önceden bildirilir</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-blue-600 mb-3">
              6. Fikri Mülkiyet
            </h2>
            <p className="text-gray-700 leading-relaxed">
              YolPilot'un tüm içeriği, logosu, tasarımı ve yazılımı fikri mülkiyet 
              haklarına tabidir. İzinsiz kopyalama, dağıtma veya değiştirme yasaktır.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-blue-600 mb-3">
              7. Veri ve İçerik
            </h2>
            <ul className="list-disc pl-6 space-y-1 text-gray-700">
              <li>Yüklediğiniz veriler size aittir</li>
              <li>Verilerinizin doğruluğundan siz sorumlusunuz</li>
              <li>YolPilot, hizmet sunmak için verilerinizi işleme hakkına sahiptir</li>
              <li>Yedekleme sorumluluğu size aittir</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-blue-600 mb-3">
              8. Hizmet Kesintileri
            </h2>
            <p className="text-gray-700 leading-relaxed">
              YolPilot, bakım veya teknik sorunlar nedeniyle geçici kesintiler yaşayabilir. 
              Planlı bakımlar önceden bildirilir. %99 uptime hedefliyoruz ancak garanti edilmez.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-blue-600 mb-3">
              9. Sorumluluk Sınırı
            </h2>
            <p className="text-gray-700 leading-relaxed">
              YolPilot, dolaylı, tesadüfi veya sonuç olarak ortaya çıkan zararlardan 
              sorumlu değildir. Maksimum sorumluluk, son ay ödenen abonelik ücreti kadardır.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-blue-600 mb-3">
              10. Hesap Sonlandırma
            </h2>
            <ul className="list-disc pl-6 space-y-1 text-gray-700">
              <li>İstediğiniz zaman hesabınızı kapatabilirsiniz</li>
              <li>Kural ihlallerinde hesap askıya alınabilir</li>
              <li>90 gün pasif hesaplar silinebilir</li>
              <li>Hesap kapatma sonrası veriler 30 gün saklanır</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-blue-600 mb-3">
              11. Değişiklikler
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Bu koşullar değiştirilebilir. Önemli değişiklikler 30 gün önceden bildirilir. 
              Kullanıma devam etmeniz, yeni koşulları kabul ettiğiniz anlamına gelir.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-blue-600 mb-3">
              12. Uygulanacak Hukuk
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Bu sözleşme Türkiye Cumhuriyeti kanunlarına tabidir. Uyuşmazlıklarda 
              İstanbul Mahkemeleri ve İcra Daireleri yetkilidir.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-blue-600 mb-3">
              13. İletişim
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Sorularınız için bizimle iletişime geçebilirsiniz:
            </p>
            <div className="mt-2 space-y-1 text-gray-700">
              <p>E-posta: info@yolpilot.com</p>
              <p>WhatsApp: 0530 178 35 70</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;