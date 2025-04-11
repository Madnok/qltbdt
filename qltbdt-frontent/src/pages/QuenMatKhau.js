import React, { useState } from 'react';
 import { toast } from 'react-toastify';
 import { forgotPasswordAPI } from '../api';
import { Link } from 'react-router-dom';

 const ForgotPasswordPage = () => {
     const [email, setEmail] = useState('');
     const [isLoading, setIsLoading] = useState(false);
     const [message, setMessage] = useState('');

     const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');
        try {
            const data = await forgotPasswordAPI(email);
            setMessage("Nếu email bạn cung cấp tồn tại trong hệ thống, một liên kết đặt lại mật khẩu đã được gửi.");
            toast.success("Yêu cầu đã được gửi.");
            setEmail('');
        } catch (error) {
            console.error("Lỗi forgot password:", error);
            setMessage("Có lỗi xảy ra khi gửi yêu cầu. Vui lòng thử lại."); 
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-center text-gray-900">Quên Mật Khẩu</h2>
                <p className="text-sm text-center text-gray-600">
                    Nhập địa chỉ email đã đăng ký của bạn. Chúng tôi sẽ gửi cho bạn một liên kết để đặt lại mật khẩu.
                </p>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Địa chỉ Email
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="block w-full px-3 py-2 mt-1 placeholder-gray-400 border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>

                    {message && <p className="p-3 text-sm text-center text-green-600 rounded-md bg-green-50">{message}</p>}

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="relative flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md group hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {isLoading ? 'Đang xử lý...' : 'Gửi yêu cầu'}
                        </button>
                    </div>
                </form>
                 <div className="text-sm text-center">
                    <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                       Quay lại Đăng nhập
                    </Link>
                </div>
            </div>
        </div>
    );
}

 export default ForgotPasswordPage;