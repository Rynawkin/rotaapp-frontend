// src/components/payment/PaymentHistory.tsx

import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar, CreditCard, Loader2, RefreshCw } from 'lucide-react';
import { paymentService, type InvoiceResponse } from '../../services/payment.service';

interface PaymentHistoryProps {
  className?: string;
}

export const PaymentHistory: React.FC<PaymentHistoryProps> = ({ className = '' }) => {
  const [invoices, setInvoices] = useState<InvoiceResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const data = await paymentService.getInvoices();
      setInvoices(data);
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadInvoices(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Paid':
        return <div className="w-2 h-2 bg-green-500 rounded-full" />;
      case 'Pending':
        return <div className="w-2 h-2 bg-yellow-500 rounded-full" />;
      case 'Failed':
        return <div className="w-2 h-2 bg-red-500 rounded-full" />;
      case 'Cancelled':
        return <div className="w-2 h-2 bg-gray-500 rounded-full" />;
      default:
        return <div className="w-2 h-2 bg-gray-300 rounded-full" />;
    }
  };

  const handleDownloadInvoice = (invoice: InvoiceResponse) => {
    // TODO: Implement invoice download functionality
    console.log('Download invoice:', invoice.invoiceNumber);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-medium text-gray-900">Ödeme Geçmişi</h2>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
            Yenile
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {invoices.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-sm font-medium text-gray-900 mb-2">Henüz fatura yok</h3>
            <p className="text-sm text-gray-500">
              İlk faturanız oluşturulduktan sonra burada görüntülenir.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Status indicator */}
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(invoice.status)}
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${paymentService.getInvoiceStatusColor(
                          invoice.status
                        )}`}
                      >
                        {paymentService.getInvoiceStatusDisplayName(invoice.status)}
                      </span>
                    </div>

                    {/* Invoice details */}
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-medium text-gray-900">
                          {invoice.invoiceNumber}
                        </h3>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${paymentService.getPlanColor(
                            invoice.planType
                          )}`}
                        >
                          {paymentService.getPlanDisplayName(invoice.planType)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {paymentService.formatDate(invoice.periodStart)} -{' '}
                            {paymentService.formatDate(invoice.periodEnd)}
                          </span>
                        </div>
                        <span>Son ödeme: {paymentService.formatDate(invoice.dueDate)}</span>
                        {invoice.paidDate && (
                          <span>Ödendi: {paymentService.formatDate(invoice.paidDate)}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Amount and actions */}
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-900">
                        {paymentService.formatPrice(invoice.total)}
                      </div>
                      {invoice.tax > 0 && (
                        <div className="text-sm text-gray-500">
                          ({paymentService.formatPrice(invoice.amount)} + %{((invoice.tax / invoice.amount) * 100).toFixed(0)} KDV)
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleDownloadInvoice(invoice)}
                      className="inline-flex items-center px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                      title="Faturayı İndir"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Payment method info */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <CreditCard className="h-4 w-4" />
                    <span>Oluşturma: {paymentService.formatDate(invoice.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};