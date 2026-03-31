import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DriverForm from '@/components/drivers/DriverForm';
import { driverService } from '@/services/driver.service';
import { Driver } from '@/types';
import { PageAlert, PageEmptyState, PageHeader, PageLoading } from '@/components/ui/PageChrome';

const EditDriver: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDriver = async () => {
      if (!id) return;

      setLoading(true);
      try {
        const data = await driverService.getById(id);
        if (data) {
          setDriver(data);
        } else {
          setError('Sürücü bulunamadı');
        }
      } catch (loadError: any) {
        const errorMessage =
          loadError.userFriendlyMessage ||
          loadError.response?.data?.message ||
          'Sürücü yüklenirken bir hata oluştu';
        setError(errorMessage);
        console.error('Error loading driver:', loadError);
      } finally {
        setLoading(false);
      }
    };

    loadDriver();
  }, [id]);

  const handleSubmit = async (data: Partial<Driver>) => {
    if (!id) return;

    setSaving(true);
    setError(null);

    try {
      await driverService.update(id, data);
      navigate('/drivers');
    } catch (submitError: any) {
      const errorMessage =
        submitError.userFriendlyMessage ||
        submitError.response?.data?.message ||
        'Sürücü güncellenirken bir hata oluştu';
      setError(errorMessage);
      console.error('Error updating driver:', submitError);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <PageLoading label="Sürücü yükleniyor..." />;
  }

  if (!driver) {
    return (
      <PageEmptyState
        title="Sürücü bulunamadı"
        description={error || 'İstediğiniz sürücü bulunamadı veya silinmiş olabilir.'}
        backTo="/drivers"
        backLabel="Sürücülere Dön"
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        backTo="/drivers"
        backLabel="Sürücülere Dön"
        eyebrow="Sürücü Yönetimi"
        title="Sürücü Düzenle"
        description={`${driver.name} kaydını ve operasyon atamalarını güncelleyin.`}
      />

      {error && <PageAlert message={error} />}

      <DriverForm initialData={driver} onSubmit={handleSubmit} loading={saving} isEdit />
    </div>
  );
};

export default EditDriver;
