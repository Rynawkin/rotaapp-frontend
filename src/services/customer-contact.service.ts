import { api } from './api';
import { CustomerContact } from '@/types';

export interface CreateCustomerContactDto {
  customerId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string; // Optional field
  role: string;
  isActive: boolean;
  isPrimary: boolean;
  receiveJourneyStart: boolean;
  receiveJourneyCheckIn: boolean;
  receiveDeliveryCompleted: boolean;
  receiveDeliveryFailed: boolean;
  receiveJourneyAssigned: boolean;
  receiveJourneyCancelled: boolean;
}

export interface UpdateCustomerContactDto extends CreateCustomerContactDto {
  id: number;
}

class CustomerContactService {
  // Get all contacts for a customer
  async getByCustomerId(customerId: number): Promise<CustomerContact[]> {
    try {
      const response = await api.get(`/CustomerContact/customer/${customerId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching customer contacts:', error);
      throw error;
    }
  }

  // Get single contact by ID
  async getById(id: number): Promise<CustomerContact> {
    try {
      const response = await api.get(`/CustomerContact/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching customer contact:', error);
      throw error;
    }
  }

  // Create new contact
  async create(data: CreateCustomerContactDto): Promise<CustomerContact> {
    try {
      const response = await api.post('/CustomerContact', data);
      return response.data;
    } catch (error) {
      console.error('Error creating customer contact:', error);
      throw error;
    }
  }

  // Update contact
  async update(id: number, data: UpdateCustomerContactDto): Promise<void> {
    try {
      await api.put(`/CustomerContact/${id}`, data);
    } catch (error) {
      console.error('Error updating customer contact:', error);
      throw error;
    }
  }

  // Delete contact (soft delete)
  async delete(id: number): Promise<void> {
    try {
      await api.delete(`/CustomerContact/${id}`);
    } catch (error) {
      console.error('Error deleting customer contact:', error);
      throw error;
    }
  }

  // Bulk create contacts for a customer
  async bulkCreate(customerId: number, contacts: CustomerContact[]): Promise<void> {
    try {
      await api.post(`/CustomerContact/bulk-create/${customerId}`, contacts);
    } catch (error) {
      console.error('Error bulk creating customer contacts:', error);
      throw error;
    }
  }

  // Get available roles
  async getRoles(): Promise<Array<{ key: string; value: string }>> {
    try {
      const response = await api.get('/CustomerContact/roles');
      return response.data;
    } catch (error) {
      console.error('Error fetching customer contact roles:', error);
      throw error;
    }
  }
}

export const customerContactService = new CustomerContactService();