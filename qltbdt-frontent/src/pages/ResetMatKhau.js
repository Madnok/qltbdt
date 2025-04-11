import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { resetPasswordAPI } from '../api';
import { toast } from 'react-toastify';

const ResetPasswordPage = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); // Xóa lỗi cũ

        if (newPassword.length < 6) {
            setError("Mật khẩu mới phải ít nhất 6 ký tự.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setError("Mật khẩu xác nhận không khớp.");
            return;
        }

        setIsLoading(true);
        try {
            await resetPasswordAPI(token, newPassword);
            toast.success('Đặt lại mật khẩu thành công!');
            setSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setError(err.response?.data?.message || "Có lỗi xảy ra. Token có thể không hợp lệ hoặc đã hết hạn.");
            console.error("Lỗi reset password:", err);
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="w-full max-w-md p-8 space-y-4 text-center bg-white rounded-lg shadow-md">
                    <h2 className="text-2xl font-bold text-green-600">Thành công!</h2>
                    <p>Mật khẩu của bạn đã được đặt lại. Bạn có thể đăng nhập ngay bây giờ.</p>
                    <Link to="/login" className="inline-block px-4 py-2 mt-4 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700">
                        Đến trang Đăng nhập
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-center text-gray-900">Đặt Lại Mật Khẩu</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">Mật khẩu mới</label>
                        <input
                            id="newPassword" name="newPassword" type="password" required
                            value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                            className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>
                     <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Xác nhận mật khẩu mới</label>
                        <input
                            id="confirmPassword" name="confirmPassword" type="password" required
                            value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                            className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>

                    {error && <p className="p-3 text-sm text-center text-red-600 rounded-md bg-red-50">{error}</p>}

                    <div>
                        <button type="submit" disabled={isLoading} className="relative flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md group hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
                            {isLoading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ResetPasswordPage;