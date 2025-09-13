// EditCustomer.tsx - Düzeltilmiş hali
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import CustomerForm from '@/components/customers/CustomerForm';
import { Customer, CustomerContact } from '@/types';
import { customerService } from '@/services/customer.service';

const EditCustomer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCustomer();
  }, [id]);

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
    } catch (error: any) {
      const errorMessage = error.userFriendlyMessage || error.response?.data?.message || 'Müşteri yüklenirken bir hata oluştu';
      setError(errorMessage);
      console.error('Error loading customer:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData: Partial<Customer>, contacts?: CustomerContact[]) => {
    if (!id) return;
    
    setSaving(true);
    setError(null);
    
    try {
      await customerService.update(id, formData);
      navigate(`/customers/${id}`);
    } catch (error: any) {
      const errorMessage = error.userFriendlyMessage || error.response?.data?.message || 'Müşteri güncellenirken bir hata oluştu.';
      setError(errorMessage);
      console.error('Error updating customer:', error);
    } finally {
      setSaving(false);
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Müşteri Bulunamadı</h2>
        <p className="text-gray-600 mb-4">İstediğiniz müşteri bulunamadı veya silinmiş olabilir.</p>
        <Link
          to="/customers"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Müşterilere Dön
        </Link>
      </div>
    );
  }

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
            <h1 className="text-2xl font-bold text-gray-900">Müşteri Düzenle</h1>
            <p className="text-gray-600 mt-1">{customer.name}</p>
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
        initialData={customer}
        onSubmit={handleSubmit}
        loading={saving}
        isEdit
      />

    </div>
  );
};

export default EditCustomer;