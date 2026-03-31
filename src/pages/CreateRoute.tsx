import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RouteForm from '@/components/routes/RouteForm';
import { Route } from '@/types';
import { routeService } from '@/services/route.service';
import { PageAlert, PageHeader } from '@/components/ui/PageChrome';

const CreateRoute: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);

  const handleSubmit = async (formData: Partial<Route>) => {
    setLoading(true);
    setError(null);

    try {
      const route = formData.id
        ? await routeService.update(formData.id, formData)
        : await routeService.create(formData);

      localStorage.removeItem('createRouteFormData');
      setFormKey((prev) => prev + 1);

      const userChoice = window.confirm(
        'Rota başarıyla oluşturuldu.\n\nOluşturulan rotayı görmek ister misiniz?\n\nEvet: Rota detayına git\nHayır: Yeni rota oluşturmaya devam et'
      );

      if (userChoice) {
        navigate(`/routes/${route.id || formData.id}`);
      }
    } catch (submitError: any) {
      const errorMessage =
        submitError.userFriendlyMessage ||
        submitError.response?.data?.message ||
        'Rota işleminde bir hata oluştu.';
      setError(errorMessage);
      console.error('Error processing route:', submitError);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAsDraft = async (formData: Partial<Route>) => {
    setLoading(true);
    setError(null);

    try {
      await routeService.create({
        ...formData,
        status: 'draft'
      });
      navigate('/routes');
    } catch (draftError: any) {
      const errorMessage =
        draftError.userFriendlyMessage ||
        draftError.response?.data?.message ||
        'Taslak kaydedilirken bir hata oluştu.';
      setError(errorMessage);
      console.error('Error saving draft:', draftError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        backTo="/routes"
        backLabel="Rotalara Dön"
        eyebrow="Rota Planlama"
        title="Yeni Rota"
        description="Sürücü, araç, depo ve durak planını yeni tasarım sistemi içinde oluşturun. Mockup'ta görünmese bile araç kilometresi gibi operasyon alanları korunur."
      />

      {error && <PageAlert message={error} />}

      <RouteForm
        key={formKey}
        onSubmit={handleSubmit}
        onSaveAsDraft={handleSaveAsDraft}
        loading={loading}
      />
    </div>
  );
};

export default CreateRoute;
