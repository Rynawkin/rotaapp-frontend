import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import RouteForm from '@/components/routes/RouteForm';
import { Route } from '@/types';
import { routeService } from '@/services/route.service';
import { PageAlert, PageEmptyState, PageHeader, PageLoading } from '@/components/ui/PageChrome';

const EditRoute: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [route, setRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRoute = async () => {
      if (!id) {
        setError('Rota ID bulunamadı');
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const data = await routeService.getById(id);
        if (data) {
          setRoute(data);
        } else {
          setError('Rota bulunamadı');
        }
      } catch (loadError: any) {
        const errorMessage =
          loadError.userFriendlyMessage ||
          loadError.response?.data?.message ||
          'Rota yüklenirken bir hata oluştu';
        setError(errorMessage);
        console.error('Error loading route:', loadError);
      } finally {
        setLoading(false);
      }
    };

    loadRoute();
  }, [id]);

  const handleSubmit = async (formData: Partial<Route>) => {
    if (!id) return;

    setSaving(true);
    setError(null);

    try {
      await routeService.update(id, formData);
      navigate(`/routes/${id}`);
    } catch (submitError: any) {
      const errorMessage =
        submitError.userFriendlyMessage ||
        submitError.response?.data?.message ||
        'Rota güncellenirken bir hata oluştu.';
      setError(errorMessage);
      console.error('Error updating route:', submitError);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAsDraft = async (formData: Partial<Route>) => {
    if (!id) return;

    setSaving(true);
    setError(null);

    try {
      await routeService.update(id, {
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
      setSaving(false);
    }
  };

  if (loading) {
    return <PageLoading label="Rota yükleniyor..." />;
  }

  if (!route) {
    return (
      <PageEmptyState
        title="Rota bulunamadı"
        description={error || 'İstediğiniz rota bulunamadı veya silinmiş olabilir.'}
        backTo="/routes"
        backLabel="Rotalara Dön"
      />
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        backTo="/routes"
        backLabel="Rotalara Dön"
        eyebrow="Rota Planlama"
        title="Rota Düzenle"
        description={route.name}
      />

      {error && <PageAlert message={error} />}

      <RouteForm
        initialData={route}
        onSubmit={handleSubmit}
        onSaveAsDraft={handleSaveAsDraft}
        loading={saving}
        isEdit
      />
    </div>
  );
};

export default EditRoute;
