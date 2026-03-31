import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomerForm from '@/components/customers/CustomerForm';
import { Customer, CustomerContact } from '@/types';
import { customerService } from '@/services/customer.service';
import { customerContactService } from '@/services/customer-contact.service';
import { PageAlert, PageHeader } from '@/components/ui/PageChrome';

const CreateCustomer: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: Partial<Customer>, contacts?: CustomerContact[]) => {
    setLoading(true);
    setError(null);

    try {
      const newCustomer = await customerService.create(formData);

      if (contacts && contacts.length > 0) {
        for (const contact of contacts) {
          if (contact.firstName && contact.lastName && contact.email && contact.phone) {
            await customerContactService.create({
              ...contact,
              customerId: newCustomer.id,
              isActive: true
            });
          }
        }
      }

      navigate(`/customers/${newCustomer.id}`);
    } catch (submitError: any) {
      const errorMessage =
        submitError.userFriendlyMessage ||
        submitError.response?.data?.message ||
        'Müşteri oluşturulurken bir hata oluştu.';
      setError(errorMessage);
      console.error('Error creating customer:', submitError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        backTo="/customers"
        backLabel="Müşterilere Dön"
        eyebrow="Müşteri Yönetimi"
        title="Yeni Müşteri"
        description="Operasyonel müşteri kaydını oluşturun. Gerçek ürün alanları tasarım mockup'ında görünmese bile korunacaktır."
      />

      {error && <PageAlert message={error} />}

      <CustomerForm onSubmit={handleSubmit} loading={loading} />
    </div>
  );
};

export default CreateCustomer;
