import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import CustomerForm from '@/components/customers/CustomerForm';
import { Customer } from '@/types';
import { customerService } from '@/services/mockData';

const CreateCustomer: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: Partial<Customer>) => {
    setLoading(true);
    setError(null);
    
    try {
      const newCustomer = await customerService.create(formData);
      navigate(`/customers/${newCustomer.id}`);
    } catch (err) {
      setError('Müşteri oluşturulurken bir hata oluştu.');
      console.error('Error creating customer:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-4">
          <Link
            to="/customers"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Yeni Müşteri Ekle</h1>
            <p className="text-gray-600 mt-1">Müşteri bilgilerini girin ve kaydedin</p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Customer Form */}
      <CustomerForm
        onSubmit={handleSubmit}
        loading={loading}
      />
    </div>
  );
};

export default CreateCustomer;