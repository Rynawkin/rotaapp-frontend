import React from 'react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Gizlilik Politikası
        </h1>
        <p className="text-sm text-gray-600 mb-6">
          Son Güncelleme: 1 Eylül 2025
        </p>
        
        <div className="border-t pt-6 space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-blue-600 mb-3">
              1. Toplanan Bilgiler
            </h2>
            <p className="text-gray-700 leading-relaxed">
              YolPilot uygulaması, hizmetlerimizi sunabilmek için aşağıdaki bilgileri toplar:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-700">
              <li>Ad, soyad ve e-posta adresi</li>
              <li>Telefon numarası (isteğe bağlı)</li>
              <li>Konum bilgileri (teslimat takibi için)</li>
              <li>Teslimat adresleri ve müşteri bilgileri</li>
              <li>Araç ve sürücü bilgileri</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-blue-600 mb-3">
              2. Bilgilerin Kullanımı
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Topladığımız bilgiler şu amaçlarla kullanılır:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-700">
              <li>Rota optimizasyonu ve teslimat yönetimi</li>
              <li>Müşteri bildirimleri ve iletişim</li>
              <li>Performans raporları ve analizler</li>
              <li>Hizmet kalitesinin iyileştirilmesi</li>
              <li>Yasal yükümlülüklerin yerine getirilmesi</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-blue-600 mb-3">
              3. Bilgi Güvenliği
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Verileriniz, endüstri standardı güvenlik önlemleri ile korunmaktadır:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-700">
              <li>SSL/TLS şifreleme</li>
              <li>Güvenli bulut altyapısı (Microsoft Azure)</li>
              <li>Düzenli güvenlik güncellemeleri</li>
              <li>Erişim kontrolü ve yetkilendirme</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-blue-600 mb-3">
              4. Konum Verileri
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Uygulama, teslimat takibi için konum verilerinizi kullanır. Konum izni:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-700">
              <li>Sadece çalışma saatleri içinde aktiftir</li>
              <li>İstediğiniz zaman devre dışı bırakılabilir</li>
              <li>Sadece teslimat optimizasyonu için kullanılır</li>
              <li>Üçüncü taraflarla paylaşılmaz</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-blue-600 mb-3">
              5. Veri Paylaşımı
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Verileriniz aşağıdaki durumlar dışında üçüncü taraflarla paylaşılmaz:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-700">
              <li>Yasal zorunluluklar</li>
              <li>Açık izniniz olması durumunda</li>
              <li>Anonim ve toplu istatistikler</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-blue-600 mb-3">
              6. Çerezler
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Uygulama, oturum yönetimi ve tercihlerinizi hatırlamak için çerezler kullanır. 
              Bu çerezler cihazınızda yerel olarak saklanır ve kişisel bilgi içermez.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-blue-600 mb-3">
              7. Veri Saklama
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Verileriniz, hesabınız aktif olduğu sürece saklanır. Hesap kapatma talebinde 
              bulunduğunuzda, yasal saklama süreleri hariç tüm verileriniz 30 gün içinde silinir.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-blue-600 mb-3">
              8. KVKK Hakları
            </h2>
            <p className="text-gray-700 leading-relaxed">
              6698 sayılı KVKK kapsamında aşağıdaki haklara sahipsiniz:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-700">
              <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
              <li>İşlenen veriler hakkında bilgi talep etme</li>
              <li>Verilerin işlenme amacını öğrenme</li>
              <li>Verilerin düzeltilmesini veya silinmesini isteme</li>
              <li>Verilerin aktarıldığı üçüncü kişileri bilme</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-blue-600 mb-3">
              9. Çocukların Gizliliği
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Hizmetlerimiz 18 yaş altı bireylere yönelik değildir. 18 yaş altı bireylerden 
              bilerek kişisel veri toplamayız.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-blue-600 mb-3">
              10. Değişiklikler
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Bu gizlilik politikası zaman zaman güncellenebilir. Önemli değişiklikler 
              e-posta ile bildirilecektir.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-blue-600 mb-3">
              11. İletişim
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Gizlilik politikamız hakkında sorularınız için:
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

export default PrivacyPolicy;