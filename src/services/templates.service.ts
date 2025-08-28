import { api } from './api';
import { MessageTemplate, TemplateType, TemplateChannel } from '@/types/templates';

interface PreviewTemplateRequest {
  sampleData: Record<string, any>;
}

interface PreviewTemplateResponse {
  subject?: string;
  body: string;
}

class TemplatesService {
  async getTemplates(): Promise<MessageTemplate[]> {
    const response = await api.get('/workspace/templates');
    return response.data;
  }

  async getTemplate(id: number): Promise<MessageTemplate> {
    const response = await api.get(`/workspace/templates/${id}`);
    return response.data;
  }

  async createTemplate(template: Omit<MessageTemplate, 'id' | 'isDefault' | 'createdAt' | 'updatedAt'>): Promise<MessageTemplate> {
    const response = await api.post('/workspace/templates', template);
    return response.data;
  }

  async updateTemplate(id: number, template: Partial<MessageTemplate>): Promise<MessageTemplate> {
    const response = await api.put(`/workspace/templates/${id}`, template);
    return response.data;
  }

  async deleteTemplate(id: number): Promise<void> {
    await api.delete(`/workspace/templates/${id}`);
  }

  async previewTemplate(id: number, sampleData: Record<string, any>): Promise<PreviewTemplateResponse> {
    const response = await api.post(`/workspace/templates/${id}/preview`, { sampleData });
    return response.data;
  }

  async getAvailableVariables(): Promise<Record<string, string[]>> {
    const response = await api.get('/workspace/templates/variables');
    return response.data;
  }

  // Helper method to generate sample data for preview
  generateSampleData(templateType: TemplateType): Record<string, any> {
    const commonData = {
      workspace: {
        name: 'ABC Lojistik',
        email: 'info@abclojistik.com',
        phoneNumber: '0850 123 45 67'
      },
      currentDate: new Date().toLocaleDateString('tr-TR'),
      currentTime: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    };

    switch (templateType) {
      case TemplateType.WelcomeEmail:
        return {
          ...commonData,
          user: { fullName: 'Ahmet Yılmaz', email: 'ahmet@sirket.com' },
          loginUrl: 'https://app.yolpilot.com/login'
        };
      
      case TemplateType.JourneyStart:
        return {
          ...commonData,
          customer: { name: 'Mehmet Demir' },
          journey: { date: new Date().toLocaleDateString('tr-TR') },
          driver: { name: 'Ali Veli', phone: '0555 123 45 67' },
          vehicle: { brand: 'Ford', model: 'Transit', plateNumber: '34 ABC 123' },
          estimatedCompletionTime: '16:30',
          trackingUrl: 'https://app.yolpilot.com/tracking/123'
        };
      
      case TemplateType.CheckIn:
        return {
          ...commonData,
          customer: { name: 'Ayşe Kaya', address: 'Atatürk Cad. No:15 Kadıköy/İstanbul' },
          stop: { estimatedArrivalTime: '10-15 dakika' },
          driver: { name: 'Ali Veli', phone: '0555 123 45 67' },
          trackingUrl: 'https://app.yolpilot.com/tracking/123'
        };
      
      case TemplateType.DeliveryCompleted:
        return {
          ...commonData,
          customer: { name: 'Fatma Yıldız', address: 'İnönü Mah. 5. Sok. Beşiktaş/İstanbul' },
          completedTime: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
          driver: { name: 'Ali Veli' },
          signatureUrl: 'https://cdn.yolpilot.com/sample-signature.png',
          photoUrl: 'https://cdn.yolpilot.com/sample-photo.jpg',
          stop: { notes: 'Kapıcıya teslim edildi' },
          feedbackUrl: 'https://app.yolpilot.com/feedback/123'
        };
      
      case TemplateType.DeliveryFailed:
        return {
          ...commonData,
          customer: { name: 'Can Özkan', address: 'Cumhuriyet Bulvarı No:45 Şişli/İstanbul' },
          failureReason: 'Müşteri adreste bulunamadı',
          failureTime: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
          driver: { name: 'Ali Veli', phone: '0555 123 45 67' },
          rescheduleUrl: 'https://app.yolpilot.com/reschedule/123'
        };
      
      default:
        return commonData;
    }
  }
}

export const templatesService = new TemplatesService();