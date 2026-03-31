import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DepotForm from '@/components/depots/DepotForm';
import { depotService } from '@/services/depot.service';
import { Depot } from '@/types';
import { PageEmptyState, PageHeader, PageLoading } from '@/components/ui/PageChrome';

const EditDepot: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [depot, setDepot] = useState<Depot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDepot = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const data = await depotService.getById(id);
        setDepot(data);
      } catch (error) {
        console.error('Depo yüklenirken hata:', error);
        setDepot(null);
      } finally {
        setLoading(false);
      }
    };

    loadDepot();
  }, [id]);

  const handleSubmit = async (data: Partial<Depot>) => {
    if (!id) return;
    await depotService.update(id, data);
  };

  if (loading) {
    return <PageLoading label="Depo yükleniyor..." />;
  }

  if (!depot) {
    return (
      <PageEmptyState
        title="Depo bulunamadı"
        description="İstediğiniz depo bulunamadı veya silinmiş olabilir."
        backTo="/depots"
        backLabel="Depolara Dön"
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        backTo="/depots"
        backLabel="Depolara Dön"
        eyebrow="Depo Yönetimi"
        title="Depo Düzenle"
        description={`${depot.name} kaydını ve konum bilgisini güncelleyin.`}
      />

      <DepotForm depot={depot} onSubmit={handleSubmit} onCancel={() => navigate('/depots')} />
    </div>
  );
};

export default EditDepot;
