import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DepotForm from '@/components/depots/DepotForm';
import { depotService } from '@/services/depot.service';
import { Depot } from '@/types';
import { PageAlert, PageHeader } from '@/components/ui/PageChrome';

const CreateDepot: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: Partial<Depot>) => {
    setLoading(true);
    setError(null);

    try {
      await depotService.create(data);
      navigate('/depots');
    } catch (submitError: any) {
      const errorMessage =
        submitError.userFriendlyMessage ||
        submitError.response?.data?.message ||
        'Depo oluşturulurken bir hata oluştu.';
      setError(errorMessage);
      console.error('Error creating depot:', submitError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        backTo="/depots"
        backLabel="Depolara Dön"
        eyebrow="Depo Yönetimi"
        title="Yeni Depo"
        description="Depo kaydını oluşturun, konum bilgisini doğrulayın ve operasyon alanlarını eksiksiz tutun."
      />

      {error && <PageAlert message={error} />}

      <DepotForm onSubmit={handleSubmit} onCancel={() => navigate('/depots')} loading={loading} />
    </div>
  );
};

export default CreateDepot;
