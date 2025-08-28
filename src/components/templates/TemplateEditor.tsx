import React, { useState, useEffect, useRef } from 'react';
import {
  Mail,
  MessageSquare,
  Save,
  Eye,
  X,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Check,
  AlertCircle,
  ChevronRight,
  FileText,
  Variable,
  Code,
  Loader2
} from 'lucide-react';
import {
  MessageTemplate,
  TemplateType,
  TemplateChannel,
  TEMPLATE_VARIABLES,
  TEMPLATE_TYPE_LABELS,
  TEMPLATE_CHANNEL_LABELS
} from '@/types/templates';
import { templatesService } from '@/services/templates.service';
import toast from 'react-hot-toast';

export const TemplateEditor: React.FC = () => {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState<{ subject?: string; body: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TemplateType>(TemplateType.WelcomeEmail);
  const bodyTextAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await templatesService.getTemplates();
      setTemplates(data);
    } catch (error) {
      toast.error('Şablonlar yüklenemedi');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = () => {
    setEditingTemplate({
      templateType: activeTab,
      channel: TemplateChannel.Email,
      name: '',
      subject: '',
      body: '',
      variables: [],
      isActive: true,
      isDefault: false
    });
    setShowModal(true);
  };

  const handleEditTemplate = (template: MessageTemplate) => {
    setEditingTemplate({ ...template });
    setShowModal(true);
  };

  const handleDeleteTemplate = async (id: number) => {
    if (!confirm('Bu şablonu silmek istediğinizden emin misiniz?')) return;
    
    try {
      await templatesService.deleteTemplate(id);
      await loadTemplates();
      toast.success('Şablon silindi');
    } catch (error) {
      toast.error('Şablon silinemedi');
    }
  };

  const handleSaveTemplate = async () => {
    if (!editingTemplate) return;
    
    if (!editingTemplate.name) {
      toast.error('Şablon adı gereklidir');
      return;
    }
    
    if (!editingTemplate.body) {
      toast.error('Şablon içeriği gereklidir');
      return;
    }
    
    setSaving(true);
    try {
      if (editingTemplate.id) {
        await templatesService.updateTemplate(editingTemplate.id, editingTemplate);
        toast.success('Şablon güncellendi');
      } else {
        await templatesService.createTemplate(editingTemplate);
        toast.success('Şablon oluşturuldu');
      }
      await loadTemplates();
      setShowModal(false);
      setEditingTemplate(null);
    } catch (error) {
      toast.error('Şablon kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = async () => {
    if (!editingTemplate) return;
    
    try {
      const sampleData = templatesService.generateSampleData(editingTemplate.templateType as TemplateType);
      
      // Eğer template kaydedilmişse API'den preview al
      if (editingTemplate.id) {
        const preview = await templatesService.previewTemplate(editingTemplate.id, sampleData);
        setPreviewContent(preview);
      } else {
        // Kaydedilmemiş template için client-side preview
        const processedBody = processTemplate(editingTemplate.body, sampleData);
        const processedSubject = editingTemplate.subject ? processTemplate(editingTemplate.subject, sampleData) : undefined;
        setPreviewContent({ subject: processedSubject, body: processedBody });
      }
      setShowPreview(true);
    } catch (error) {
      toast.error('Önizleme oluşturulamadı');
    }
  };

  const processTemplate = (template: string, data: Record<string, any>): string => {
    let result = template;
    
    // {{variable}} formatındaki değişkenleri değiştir
    const regex = /\{\{([^}]+)\}\}/g;
    result = result.replace(regex, (match, key) => {
      const trimmedKey = key.trim();
      const parts = trimmedKey.split('.');
      
      let value: any = data;
      for (const part of parts) {
        value = value?.[part];
      }
      
      return value?.toString() || match;
    });
    
    return result;
  };

  const insertVariable = (variable: string) => {
    if (!bodyTextAreaRef.current || !editingTemplate) return;
    
    const textarea = bodyTextAreaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    
    const newText = text.substring(0, start) + `{{${variable}}}` + text.substring(end);
    
    setEditingTemplate({
      ...editingTemplate,
      body: newText
    });
    
    // Cursor'ı eklenen değişkenin sonuna taşı
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + variable.length + 4;
      textarea.focus();
    }, 0);
  };

  const duplicateTemplate = async (template: MessageTemplate) => {
    const newTemplate = {
      ...template,
      name: `${template.name} (Kopya)`,
      isDefault: false
    };
    delete newTemplate.id;
    
    try {
      await templatesService.createTemplate(newTemplate);
      await loadTemplates();
      toast.success('Şablon kopyalandı');
    } catch (error) {
      toast.error('Şablon kopyalanamadı');
    }
  };

  const getTemplatesByType = (type: TemplateType) => {
    return templates.filter(t => t.templateType === type);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 border-b pb-3">Mesaj Şablonları</h2>
        <button
          onClick={handleCreateTemplate}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Yeni Şablon
        </button>
      </div>

      {/* Template Type Tabs */}
      <div className="border-b">
        <div className="flex space-x-8">
          {Object.values(TemplateType).map(type => (
            <button
              key={type}
              onClick={() => setActiveTab(type)}
              className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === type
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {TEMPLATE_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      </div>

      {/* Templates List */}
      <div className="space-y-4">
        {getTemplatesByType(activeTab).length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">Bu tip için henüz şablon oluşturulmamış</p>
            <button
              onClick={handleCreateTemplate}
              className="mt-3 text-blue-600 hover:text-blue-700 font-medium"
            >
              İlk şablonu oluştur
            </button>
          </div>
        ) : (
          getTemplatesByType(activeTab).map(template => (
            <div key={template.id} className="border rounded-lg p-4 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-medium text-gray-900">{template.name}</h3>
                    {template.isDefault && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                        Varsayılan
                      </span>
                    )}
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      template.channel === TemplateChannel.Email
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {template.channel === TemplateChannel.Email ? (
                        <Mail className="w-3 h-3 inline mr-1" />
                      ) : (
                        <MessageSquare className="w-3 h-3 inline mr-1" />
                      )}
                      {TEMPLATE_CHANNEL_LABELS[template.channel]}
                    </span>
                    {template.isActive ? (
                      <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                        Aktif
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                        Pasif
                      </span>
                    )}
                  </div>
                  {template.subject && (
                    <p className="text-sm text-gray-600 mt-1">
                      <span className="font-medium">Konu:</span> {template.subject}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 mt-1">
                    {template.body.substring(0, 150)}...
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => duplicateTemplate(template)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    title="Kopyala"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEditTemplate(template)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    title="Düzenle"
                    disabled={template.isDefault}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {!template.isDefault && (
                    <button
                      onClick={() => handleDeleteTemplate(template.id!)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      title="Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Modal */}
      {showModal && editingTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingTemplate.id ? 'Şablonu Düzenle' : 'Yeni Şablon Oluştur'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingTemplate(null);
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="flex flex-1 overflow-hidden">
              {/* Left Side - Form */}
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Şablon Adı
                      </label>
                      <input
                        type="text"
                        value={editingTemplate.name}
                        onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Örn: Varsayılan Hoş Geldin Maili"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Kanal
                      </label>
                      <select
                        value={editingTemplate.channel}
                        onChange={(e) => setEditingTemplate({ 
                          ...editingTemplate, 
                          channel: e.target.value as TemplateChannel 
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value={TemplateChannel.Email}>E-posta</option>
                        <option value={TemplateChannel.WhatsApp}>WhatsApp</option>
                      </select>
                    </div>
                  </div>

                  {editingTemplate.channel === TemplateChannel.Email && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        E-posta Konusu
                      </label>
                      <input
                        type="text"
                        value={editingTemplate.subject || ''}
                        onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Örn: Teslimatınız yola çıktı!"
                      />
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-gray-700">
                        {editingTemplate.channel === TemplateChannel.Email ? 'E-posta İçeriği' : 'Mesaj İçeriği'}
                      </label>
                      {editingTemplate.channel === TemplateChannel.WhatsApp && (
                        <span className="text-xs text-gray-500">Max 1024 karakter</span>
                      )}
                    </div>
                    <textarea
                      ref={bodyTextAreaRef}
                      value={editingTemplate.body}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, body: e.target.value })}
                      rows={editingTemplate.channel === TemplateChannel.Email ? 15 : 8}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                      placeholder={editingTemplate.channel === TemplateChannel.Email 
                        ? 'HTML içerik yazabilirsiniz...' 
                        : 'WhatsApp mesaj içeriği...'}
                    />
                    {editingTemplate.channel === TemplateChannel.WhatsApp && (
                      <div className="mt-1 text-xs text-gray-500">
                        Karakter: {editingTemplate.body.length} / 1024
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={editingTemplate.isActive}
                        onChange={(e) => setEditingTemplate({ ...editingTemplate, isActive: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Bu şablonu aktif olarak kullan</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Right Side - Variables */}
              <div className="w-80 border-l bg-gray-50 p-4 overflow-y-auto">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Variable className="w-4 h-4" />
                  Kullanılabilir Değişkenler
                </h4>
                
                <div className="space-y-3">
                  {TEMPLATE_VARIABLES[editingTemplate.templateType as TemplateType]?.map(group => (
                    <div key={group.name} className="bg-white rounded-lg p-3">
                      <h5 className="font-medium text-sm text-gray-700 mb-2">{group.name}</h5>
                      <div className="space-y-1">
                        {group.variables.map(variable => (
                          <button
                            key={variable.key}
                            onClick={() => insertVariable(variable.key)}
                            className="w-full text-left px-2 py-1.5 text-xs hover:bg-blue-50 rounded transition-colors group"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-blue-600">
                                {`{{${variable.key}}}`}
                              </span>
                              <ChevronRight className="w-3 h-3 text-gray-400 group-hover:text-blue-600" />
                            </div>
                            <div className="text-gray-500 mt-0.5">{variable.label}</div>
                            {variable.example && (
                              <div className="text-gray-400 text-xs mt-0.5">
                                Örnek: {variable.example}
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                    <div className="text-xs text-blue-800">
                      <p className="font-medium mb-1">Değişken Kullanımı</p>
                      <p>Değişkenleri metne eklemek için üzerine tıklayın veya manuel olarak <code className="bg-blue-100 px-1 rounded">{`{{degisken.adi}}`}</code> formatında yazın.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t flex items-center justify-between bg-gray-50">
              <button
                onClick={handlePreview}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-colors flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Önizle
              </button>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingTemplate(null);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={handleSaveTemplate}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Kaydediliyor...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Kaydet
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && previewContent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Şablon Önizlemesi</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {previewContent.subject && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Konu</label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    {previewContent.subject}
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">İçerik</label>
                <div className="p-4 bg-gray-50 rounded-lg border">
                  {editingTemplate?.channel === TemplateChannel.Email ? (
                    <div dangerouslySetInnerHTML={{ __html: previewContent.body }} />
                  ) : (
                    <div className="whitespace-pre-wrap">{previewContent.body}</div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t flex justify-end bg-gray-50">
              <button
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};