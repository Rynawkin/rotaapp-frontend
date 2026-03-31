import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle, Copy, Phone, Shield } from 'lucide-react';
import DriverForm from '@/components/drivers/DriverForm';
import { driverService } from '@/services/driver.service';
import { PageHeader } from '@/components/ui/PageChrome';

const CreateDriver: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdDriver, setCreatedDriver] = useState<any>(null);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      const response = await driverService.create(data);

      if (response.isUserCreated) {
        setCreatedDriver({
          ...response,
          tempPassword: response.generatedPassword || data.password
        });
        setShowSuccess(true);
      } else {
        navigate('/drivers');
      }
    } catch (submitError: any) {
      console.error('Error creating driver:', submitError);
      const errorMessage =
        submitError.userFriendlyMessage ||
        submitError.response?.data?.message ||
        'Sürücü oluşturulurken bir hata oluştu';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Panoya kopyalandı');
  };

  if (showSuccess && createdDriver) {
    return (
      <div className="space-y-6">
        <PageHeader
          backTo="/drivers"
          backLabel="Sürücülere Dön"
          eyebrow="Sürücü Yönetimi"
          title="Sürücü Başarıyla Oluşturuldu"
          description="Mobil uygulama erişimi için giriş bilgileri aşağıda hazır. Bu ekran operasyon ekiplerinin kullanıcıyı hemen devreye almasını hedefler."
        />

        <div className="app-surface p-6 lg:p-7">
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6">
              <div className="app-subcard p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-2xl bg-emerald-100 p-2 text-emerald-700">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-950">Sürücü Bilgileri</h2>
                    <p className="text-sm text-slate-500">Operasyon kaydı oluşturuldu.</p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Ad Soyad</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{createdDriver.name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Telefon</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{createdDriver.phone}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">E-posta</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{createdDriver.email}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Ehliyet No</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{createdDriver.licenseNumber}</p>
                  </div>
                </div>
              </div>

              <div className="app-subcard p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-slate-600" />
                  <h2 className="text-lg font-bold text-slate-950">Giriş Bilgileri</h2>
                </div>
                <div className="space-y-3">
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Email / Kullanıcı Adı</p>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <p className="font-mono text-sm font-semibold text-slate-900">{createdDriver.loginEmail || createdDriver.email}</p>
                      <button type="button" onClick={() => copyToClipboard(createdDriver.loginEmail || createdDriver.email)} className="app-button-secondary !px-3 !py-2">
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {createdDriver.tempPassword && (
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Geçici Şifre</p>
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <p className="font-mono text-sm font-semibold text-slate-900">{createdDriver.tempPassword}</p>
                        <button type="button" onClick={() => copyToClipboard(createdDriver.tempPassword)} className="app-button-secondary !px-3 !py-2">
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[26px] border border-emerald-200 bg-emerald-50/90 p-5">
                <p className="text-sm font-semibold text-emerald-900">Hoş geldin e-postası gönderildi</p>
                <p className="mt-2 text-sm leading-6 text-emerald-800">
                  {createdDriver.email} adresine giriş bilgileri ve mobil uygulama yönlendirmesi iletildi.
                </p>
              </div>

              <div className="rounded-[26px] border border-amber-200 bg-amber-50/90 p-5">
                <p className="text-sm font-semibold text-amber-900">Operasyon notu</p>
                <p className="mt-2 text-sm leading-6 text-amber-800">
                  Bu bilgileri sürücüye ayrıca telefon veya mesaj ile iletmeniz gerekebilir. Şifre ilk girişte değiştirilebilir olmalı.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowSuccess(false);
                    setCreatedDriver(null);
                    window.location.reload();
                  }}
                  className="app-button-secondary"
                >
                  Yeni Sürücü Ekle
                </button>
                <button type="button" onClick={() => alert('SMS gönderme özelliği henüz aktif değil')} className="app-button-secondary">
                  <Phone className="h-4 w-4" />
                  SMS Gönder
                </button>
                <Link to="/drivers" className="app-button-primary">
                  Sürücüler Listesi
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        backTo="/drivers"
        backLabel="Sürücülere Dön"
        eyebrow="Sürücü Yönetimi"
        title="Yeni Sürücü"
        description="Sürücü kaydını ve mobil erişim akışını oluşturun. Gerekli operasyon alanları tasarım mockup'ında görünmese bile korunur."
      />

      <DriverForm onSubmit={handleSubmit} loading={loading} isEdit={false} />
    </div>
  );
};

export default CreateDriver;
