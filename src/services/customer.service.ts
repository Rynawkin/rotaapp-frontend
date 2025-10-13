import { api } from './api';
import { Customer } from '@/types';

export interface CreateCustomerDto {
  code?: string;
  name: string;
  address: string;
  phone: string;
  email?: string;
  latitude: number;
  longitude: number;
  priority: 'high' | 'normal' | 'low';
  estimatedServiceTime: number;
  notes?: string;
  tags?: string[];
  timeWindow?: {
    start: string;
    end: string;
  };
}

export interface UpdateCustomerDto extends CreateCustomerDto {
  id: number;
}

export interface BulkImportDto {
  customers: Partial<CreateCustomerDto>[];
}

export interface BulkImportResponse {
  totalCount: number;
  successCount: number;
  failedCount: number;
  errors: string[];
  importedCustomers: Customer[];
}

class CustomerService {
  // Get all customers
  async getAll(): Promise<Customer[]> {
    try {
      // Request larger page size (1000) to get most customers in workspace
      // Backend default is 50, which is too small for route creation
      const response = await api.get('/workspace/customers', {
        params: {
          pageSize: 1000
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }
  }

  // Get single customer by ID
  async getById(id: number | string): Promise<Customer> {
    try {
      const response = await api.get(`/workspace/customers/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching customer:', error);
      throw error;
    }
  }

  // Search customers
  async search(query: string): Promise<Customer[]> {
    try {
      const response = await api.get('/workspace/customers/search', {
        params: { query }
      });
      return response.data;
    } catch (error) {
      console.error('Error searching customers:', error);
      throw error;
    }
  }

  // Create new customer
  async create(data: Partial<CreateCustomerDto>): Promise<Customer> {
    try {
      const response = await api.post('/workspace/customers', data);
      return response.data;
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  }

  // Update customer
  async update(id: number | string, data: Partial<UpdateCustomerDto>): Promise<Customer> {
    try {
      const numericId = typeof id === 'string' ? parseInt(id) : id;
      const response = await api.put(`/workspace/customers/${id}`, { ...data, id: numericId });
      return response.data;
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  }

  // Delete customer
  async delete(id: number | string): Promise<void> {
    try {
      await api.delete(`/workspace/customers/${id}`);
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  }

  // Bulk import customers
  async bulkImport(customers: Partial<CreateCustomerDto>[]): Promise<BulkImportResponse> {
    try {
      const response = await api.post('/workspace/customers/bulk', { customers });
      return response.data;
    } catch (error) {
      console.error('Error bulk importing customers:', error);
      throw error;
    }
  }

  // Get customers by IDs (batch)
  async getByIds(ids: (number | string)[]): Promise<Customer[]> {
    try {
      const customers = await this.getAll();
      return customers.filter(c => ids.includes(c.id));
    } catch (error) {
      console.error('Error fetching customers by IDs:', error);
      throw error;
    }
  }

  // Get customers by tags
  async getByTags(tags: string[]): Promise<Customer[]> {
    try {
      const customers = await this.getAll();
      return customers.filter(c => 
        c.tags && tags.some(tag => c.tags?.includes(tag))
      );
    } catch (error) {
      console.error('Error fetching customers by tags:', error);
      throw error;
    }
  }

  // Get high priority customers
  async getHighPriority(): Promise<Customer[]> {
    try {
      const customers = await this.getAll();
      return customers.filter(c => c.priority === 'high');
    } catch (error) {
      console.error('Error fetching high priority customers:', error);
      throw error;
    }
  }

  // Get customers with time windows
  async getWithTimeWindows(): Promise<Customer[]> {
    try {
      const customers = await this.getAll();
      return customers.filter(c => c.timeWindow !== undefined);
    } catch (error) {
      console.error('Error fetching customers with time windows:', error);
      throw error;
    }
  }

  // Export customers to CSV (client-side)
  exportToCSV(customers: Customer[]): void {
    const csvHeaders = ['Kod', 'İsim', 'Adres', 'Telefon', 'Email', 'Öncelik', 'Zaman Penceresi', 'Etiketler', 'Notlar'];
    
    const csvData = customers.map(customer => [
      customer.code,
      customer.name,
      customer.address,
      customer.phone,
      customer.email || '',
      this.getPriorityLabel(customer.priority),
      customer.timeWindow ? `${customer.timeWindow.start}-${customer.timeWindow.end}` : '',
      customer.tags?.join(', ') || '',
      customer.notes || ''
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `musteriler_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  // Helper: Get priority label in Turkish
  private getPriorityLabel(priority: string): string {
    switch (priority) {
      case 'high':
        return 'Yüksek';
      case 'normal':
        return 'Normal';
      case 'low':
        return 'Düşük';
      default:
        return priority;
    }
  }
}

// Export singleton instance
export const customerService = new CustomerService();