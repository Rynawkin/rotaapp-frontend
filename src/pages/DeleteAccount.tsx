import React from 'react';

const DeleteAccount = () => {
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">
                    Hesap Silme Talebi
                </h1>

                <div className="space-y-4 text-gray-700">
                    <p>
                        YolPilot hesabınızı ve tüm ilişkili verilerinizi silmek için aşağıdaki adımları takip edin:
                    </p>

                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                        <p className="font-semibold">Email ile talep:</p>
                        <p className="mt-2">
                            Kayıtlı email adresinizden <a href="mailto:support@yolpilot.com" className="text-blue-600 underline">support@yolpilot.com</a> adresine mail gönderin.
                        </p>
                    </div>

                    <div className="bg-gray-100 rounded p-4">
                        <p className="font-semibold mb-2">Email'de belirtmeniz gerekenler:</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li>Kayıtlı email adresiniz</li>
                            <li>Şirket/Workspace adınız</li>
                            <li>"Hesap silme talebi" konusu</li>
                        </ul>
                    </div>

                    <div className="border-t pt-4">
                        <p className="text-sm text-gray-600">
                            <strong>Not:</strong> Talebiniz KVKK/GDPR uyarınca 30 gün içinde işleme alınacaktır.
                            Hesap silme işlemi geri alınamaz ve tüm verileriniz kalıcı olarak silinir.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeleteAccount;