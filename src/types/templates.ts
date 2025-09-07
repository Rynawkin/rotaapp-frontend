export interface MessageTemplate {
  id?: number;
  templateType: TemplateType;
  channel: TemplateChannel;
  name: string;
  subject?: string;
  body: string;
  variables?: string[];
  isActive: boolean;
  isDefault: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export enum TemplateType {
  WelcomeEmail = 'WelcomeEmail',
  JourneyStart = 'JourneyStart',
  CheckIn = 'CheckIn',
  DeliveryCompleted = 'DeliveryCompleted',
  DeliveryFailed = 'DeliveryFailed'
}

export enum TemplateChannel {
  Email = 'Email',
  WhatsApp = 'WhatsApp'
}

export interface TemplateVariable {
  key: string;
  label: string;
  description?: string;
  example?: string;
}

export interface TemplateVariableGroup {
  name: string;
  variables: TemplateVariable[];
}

export const TEMPLATE_VARIABLES: Record<TemplateType, TemplateVariableGroup[]> = {
  [TemplateType.WelcomeEmail]: [
    {
      name: 'Kullanıcı',
      variables: [
        { key: 'user.fullName', label: 'Kullanıcı Adı', example: 'Ahmet Yılmaz' },
        { key: 'user.email', label: 'Kullanıcı Email', example: 'ahmet@sirket.com' }
      ]
    },
    {
      name: 'Şirket',
      variables: [
        { key: 'workspace.name', label: 'Şirket Adı', example: 'ABC Lojistik' },
        { key: 'workspace.email', label: 'Şirket Email', example: 'info@abclojistik.com' },
        { key: 'workspace.phoneNumber', label: 'Şirket Telefon', example: '0850 123 45 67' }
      ]
    },
    {
      name: 'Sistem',
      variables: [
        { key: 'loginUrl', label: 'Giriş Linki', example: 'https://app.yolpilot.com/login' }
      ]
    }
  ],
  [TemplateType.JourneyStart]: [
    {
      name: 'Müşteri',
      variables: [
        { key: 'customer.name', label: 'Müşteri Adı', example: 'Mehmet Demir' }
      ]
    },
    {
      name: 'Teslimat',
      variables: [
        { key: 'journey.date', label: 'Teslimat Tarihi', example: '15 Mart 2024' },
        { key: 'estimatedCompletionTime', label: 'Tahmini Bitiş', example: '16:30' },
        { key: 'trackingUrl', label: 'Takip Linki', example: 'https://app.yolpilot.com/tracking/123' }
      ]
    },
    {
      name: 'Sürücü',
      variables: [
        { key: 'driver.name', label: 'Sürücü Adı', example: 'Ali Veli' },
        { key: 'driver.phone', label: 'Sürücü Telefon', example: '0555 123 45 67' }
      ]
    },
    {
      name: 'Araç',
      variables: [
        { key: 'vehicle.brand', label: 'Araç Marka', example: 'Ford' },
        { key: 'vehicle.model', label: 'Araç Model', example: 'Transit' },
        { key: 'vehicle.plateNumber', label: 'Plaka', example: '34 ABC 123' }
      ]
    }
  ],
  [TemplateType.CheckIn]: [
    {
      name: 'Müşteri',
      variables: [
        { key: 'customer.name', label: 'Müşteri Adı', example: 'Ayşe Kaya' },
        { key: 'customer.address', label: 'Teslimat Adresi', example: 'Atatürk Cad. No:15' }
      ]
    },
    {
      name: 'Teslimat',
      variables: [
        { key: 'stop.estimatedArrivalTime', label: 'Tahmini Varış', example: '10-15 dakika' },
        { key: 'trackingUrl', label: 'Takip Linki', example: 'https://app.yolpilot.com/tracking/123' }
      ]
    },
    {
      name: 'Sürücü',
      variables: [
        { key: 'driver.name', label: 'Sürücü Adı', example: 'Ali Veli' },
        { key: 'driver.phone', label: 'Sürücü Telefon', example: '0555 123 45 67' }
      ]
    }
  ],
  [TemplateType.DeliveryCompleted]: [
    {
      name: 'Müşteri',
      variables: [
        { key: 'customer.name', label: 'Müşteri Adı', example: 'Fatma Yıldız' },
        { key: 'customer.address', label: 'Teslimat Adresi', example: 'İnönü Mah. 5. Sok.' }
      ]
    },
    {
      name: 'Teslimat',
      variables: [
        { key: 'completedTime', label: 'Tamamlanma Saati', example: '14:25' },
        { key: 'receiverName', label: 'Teslim Alan Kişi', example: 'Mehmet Öz' }, // ✅ YENİ EKLENDİ
        { key: 'signatureUrl', label: 'İmza Görüntüsü', example: 'https://cdn.yolpilot.com/signature.png' },
        { key: 'photoUrl', label: 'Fotoğraf', example: 'https://cdn.yolpilot.com/photo.jpg' },
        { key: 'stop.notes', label: 'Teslimat Notları', example: 'Kapıcıya teslim edildi' },
        { key: 'trackingUrl', label: 'Takip Linki', example: 'https://app.yolpilot.com/tracking/123' },
        { key: 'feedbackUrl', label: 'Geri Bildirim Linki', example: 'https://app.yolpilot.com/feedback/123' }
      ]
    },
    {
      name: 'Sürücü',
      variables: [
        { key: 'driver.name', label: 'Sürücü Adı', example: 'Ali Veli' }
      ]
    }
  ],
  [TemplateType.DeliveryFailed]: [
    {
      name: 'Müşteri',
      variables: [
        { key: 'customer.name', label: 'Müşteri Adı', example: 'Can Özkan' },
        { key: 'customer.address', label: 'Teslimat Adresi', example: 'Cumhuriyet Bulvarı No:45' }
      ]
    },
    {
      name: 'Teslimat',
      variables: [
        { key: 'failureReason', label: 'Başarısızlık Nedeni', example: 'Müşteri adreste bulunamadı' },
        { key: 'failureTime', label: 'Başarısızlık Saati', example: '15:45' },
        { key: 'rescheduleUrl', label: 'Yeniden Planlama Linki', example: 'https://app.yolpilot.com/reschedule/123' }
      ]
    },
    {
      name: 'Sürücü',
      variables: [
        { key: 'driver.name', label: 'Sürücü Adı', example: 'Ali Veli' },
        { key: 'driver.phone', label: 'Sürücü Telefon', example: '0555 123 45 67' }
      ]
    }
  ]
};

export const TEMPLATE_TYPE_LABELS: Record<TemplateType, string> = {
  [TemplateType.WelcomeEmail]: 'Hoş Geldin Maili',
  [TemplateType.JourneyStart]: 'Teslimat Başladı',
  [TemplateType.CheckIn]: 'Teslimat Yaklaştı',
  [TemplateType.DeliveryCompleted]: 'Teslimat Tamamlandı',
  [TemplateType.DeliveryFailed]: 'Teslimat Başarısız'
};

export const TEMPLATE_CHANNEL_LABELS: Record<TemplateChannel, string> = {
  [TemplateChannel.Email]: 'E-posta',
  [TemplateChannel.WhatsApp]: 'WhatsApp'
};