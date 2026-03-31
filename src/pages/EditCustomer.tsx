import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import CustomerForm from '@/components/customers/CustomerForm';
import { Customer, CustomerContact } from '@/types';
import { customerService } from '@/services/customer.service';
import { PageAlert, PageEmptyState, PageHeader, PageLoading } from '@/components/ui/PageChrome';

const EditCustomer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCustomer = async () => {
      if (!id) return;

      setLoading(true);
      try {
        const data = await customerService.getById(id);
        if (data) {
          setCustomer(data);
        } else {
          setError('Müşteri bulunamadı');
        }
      } catch (loadError: any) {
        const errorMessage =
          loadError.userFriendlyMessage ||
          loadError.response?.data?.message ||
          'Müşteri yüklenirken bir hata oluştu';
        setError(errorMessage);
        console.error('Error loading customer:', loadError);
      } finally {
        setLoading(false);
      }
    };

    loadCustomer();
  }, [id]);

  const handleSubmit = async (formData: Partial<Customer>, _contacts?: CustomerContact[]) => {
    if (!id) return;

    setSaving(true);
    setError(null);

    try {
      await customerService.update(id, formData);
      window.location.href = `/customers/${id}`;
    } catch (submitError: any) {
      const errorMessage =
        submitError.userFriendlyMessage ||
        submitError.response?.data?.message ||
        'Müşteri güncellenirken bir hata oluştu.';
      setError(errorMessage);
      console.error('Error updating customer:', submitError);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <PageLoading label="Müşteri yükleniyor..." />;
  }

  if (!customer) {
    return (
      <PageEmptyState
        title="Müşteri bulunamadı"
        description={error || 'İstediğiniz müşteri bulunamadı veya silinmiş olabilir.'}
        backTo="/customers"
        backLabel="Müşterilere Dön"
      />
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        backTo="/customers"
        backLabel="Müşterilere Dön"
        eyebrow="Müşteri Yönetimi"
        title="Müşteri Düzenle"
        description={customer.name}
      />

      {error && <PageAlert message={error} />}

      <CustomerForm initialData={customer} onSubmit={handleSubmit} loading={saving} isEdit />
    </div>
  );
};

export default EditCustomer;
