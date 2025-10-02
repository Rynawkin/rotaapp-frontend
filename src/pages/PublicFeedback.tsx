import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Star, CheckCircle, Loader, AlertCircle } from 'lucide-react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.yolpilot.com/api';

interface FeedbackFormData {
    token: string;
    customerName: string;
    customerAddress: string;
    driverName?: string;
    deliveryDate?: string;
    companyName: string;
    companyLogo?: string;
    alreadySubmitted: boolean;
    submittedAt?: string;
    rating?: number;
}

export default function PublicFeedback() {
    const { token } = useParams<{ token: string }>();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState<FeedbackFormData | null>(null);
    const [error, setError] = useState('');
    const [submitted, setSubmitted] = useState(false);

    // Form state
    const [overallRating, setOverallRating] = useState(0);
    const [deliverySpeed, setDeliverySpeed] = useState(0);
    const [driverBehavior, setDriverBehavior] = useState(0);
    const [packageCondition, setPackageCondition] = useState(0);
    const [comments, setComments] = useState('');
    const [submitterName, setSubmitterName] = useState('');
    const [submitterPhone, setSubmitterPhone] = useState('');
    const [submitterEmail, setSubmitterEmail] = useState('');

    useEffect(() => {
        if (token) {
            loadFeedbackForm();
        }
    }, [token]);

    const loadFeedbackForm = async () => {
        try {
            const response = await axios.get(`${API_URL}/feedback/${token}`);
            setFormData(response.data);

            if (response.data.alreadySubmitted) {
                setSubmitted(true);
            }
        } catch (error: any) {
            setError(error.response?.data?.message || 'Bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (overallRating === 0) {
            toast.error('Lütfen genel memnuniyet puanı verin');
            return;
        }

        if (!submitterName.trim()) {
            toast.error('Lütfen adınızı ve soyadınızı girin');
            return;
        }

        setSubmitting(true);
        try {
            await axios.post(`${API_URL}/feedback/submit`, {
                token,
                overallRating,
                deliverySpeedRating: deliverySpeed || null,
                driverBehaviorRating: driverBehavior || null,
                packageConditionRating: packageCondition || null,
                comments: comments || null,
                submitterName: submitterName.trim(),
                submitterPhone: submitterPhone.trim() || null,
                submitterEmail: submitterEmail.trim() || null
            });

            setSubmitted(true);
            toast.success('Değerlendirmeniz için teşekkür ederiz!');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Bir hata oluştu');
        } finally {
            setSubmitting(false);
        }
    };

    const renderStars = (rating: number, setRating: (value: number) => void, disabled: boolean = false) => {
        return (
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((value) => (
                    <button
                        key={value}
                        type="button"
                        disabled={disabled}
                        onClick={() => !disabled && setRating(value)}
                        className={`transition-all ${disabled ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
                    >
                        <Star
                            className={`w-8 h-8 ${value <= rating
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300'
                                }`}
                        />
                    </button>
                ))}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center">
                <div className="bg-white rounded-lg p-8">
                    <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                    <p className="mt-4 text-gray-600">Yükleniyor...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg p-8 max-w-md w-full text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-xl font-bold text-gray-900 mb-2">Hata</h1>
                    <p className="text-gray-600">{error}</p>
                </div>
            </div>
        );
    }

    if (submitted || formData?.alreadySubmitted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg p-8 max-w-md w-full text-center">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Değerlendirmeniz Alındı!
                    </h1>
                    <p className="text-gray-600 mb-6">
                        Geri bildiriminiz için teşekkür ederiz. Hizmet kalitemizi artırmak için görüşleriniz bizim için çok değerli.
                    </p>
                    {formData?.alreadySubmitted && formData.rating && (
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600 mb-2">Verdiğiniz puan:</p>
                            <div className="flex justify-center">
                                {renderStars(formData.rating, () => { }, true)}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 p-4">
            <Toaster position="top-right" />
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-lg shadow-xl overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-purple-700 p-6 text-white text-center">
                        <h1 className="text-2xl font-bold mb-2">Teslimat Değerlendirmesi</h1>
                        <p className="text-blue-100">{formData?.companyName || 'YolPilot'}</p>
                    </div>

                    {/* Customer Info */}
                    <div className="p-6 bg-gray-50 border-b">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-600">Müşteri</p>
                                <p className="font-medium text-gray-900">{formData?.customerName}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Adres</p>
                                <p className="font-medium text-gray-900">{formData?.customerAddress}</p>
                            </div>
                            {formData?.driverName && (
                                <div>
                                    <p className="text-sm text-gray-600">Teslimatı Yapan</p>
                                    <p className="font-medium text-gray-900">{formData.driverName}</p>
                                </div>
                            )}
                            {formData?.deliveryDate && (
                                <div>
                                    <p className="text-sm text-gray-600">Teslimat Tarihi</p>
                                    <p className="font-medium text-gray-900">
                                        {new Date(formData.deliveryDate).toLocaleDateString('tr-TR')}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Feedback Form */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Overall Rating */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Genel Memnuniyet <span className="text-red-500">*</span>
                            </label>
                            <div className="flex items-center gap-4">
                                {renderStars(overallRating, setOverallRating)}
                                <span className="text-gray-600">
                                    {overallRating > 0 && `${overallRating}/5`}
                                </span>
                            </div>
                        </div>

                        {/* Delivery Speed */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Teslimat Hızı
                            </label>
                            <div className="flex items-center gap-4">
                                {renderStars(deliverySpeed, setDeliverySpeed)}
                                {deliverySpeed > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setDeliverySpeed(0)}
                                        className="text-sm text-gray-500 hover:text-gray-700"
                                    >
                                        Temizle
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Driver Behavior */}
                        {formData?.driverName && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    Görevli Davranışı
                                </label>
                                <div className="flex items-center gap-4">
                                    {renderStars(driverBehavior, setDriverBehavior)}
                                    {driverBehavior > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => setDriverBehavior(0)}
                                            className="text-sm text-gray-500 hover:text-gray-700"
                                        >
                                            Temizle
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Package Condition */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Paket Durumu
                            </label>
                            <div className="flex items-center gap-4">
                                {renderStars(packageCondition, setPackageCondition)}
                                {packageCondition > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setPackageCondition(0)}
                                        className="text-sm text-gray-500 hover:text-gray-700"
                                    >
                                        Temizle
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Submitter Info */}
                        <div className="pt-4 border-t">
                            <h3 className="text-sm font-medium text-gray-900 mb-4">İletişim Bilgileriniz</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Ad Soyad <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={submitterName}
                                        onChange={(e) => setSubmitterName(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Adınız ve soyadınız"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Telefon
                                    </label>
                                    <input
                                        type="tel"
                                        value={submitterPhone}
                                        onChange={(e) => setSubmitterPhone(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="5xx xxx xx xx"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        E-posta
                                    </label>
                                    <input
                                        type="email"
                                        value={submitterEmail}
                                        onChange={(e) => setSubmitterEmail(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="ornek@email.com"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Comments */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Yorumlarınız
                            </label>
                            <textarea
                                value={comments}
                                onChange={(e) => setComments(e.target.value)}
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Teslimat hakkındaki görüş ve önerilerinizi paylaşabilirsiniz..."
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Loader className="w-5 h-5 animate-spin" />
                                    Gönderiliyor...
                                </span>
                            ) : (
                                'Değerlendirmeyi Gönder'
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <div className="text-center mt-6 text-white/80 text-sm">
                    <p>© 2024 {formData?.companyName || 'YolPilot'}. Tüm hakları saklıdır.</p>
                </div>
            </div>
        </div>
    );
}