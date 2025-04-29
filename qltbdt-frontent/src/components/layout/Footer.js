import { FaFacebookF, FaGithub, FaGlobe } from 'react-icons/fa';

const Footer = () => {
    return (
        <footer className="bg-gray-900 text-gray-300 border-t border-gray-800 pt-10 pb-6 px-4 sm:px-8">
            <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8">
                {/* Logo và tên thương hiệu */}
                <div className="flex flex-col items-center sm:items-start space-y-3">
                    <div className="flex items-center space-x-2">
                        <span className="text-xl font-semibold text-white">IUHelp Facility Management</span>
                    </div>
                    <p className="text-sm text-gray-400 break-words text-center sm:text-left">
                        Đồng hành cùng bạn trong từng bước quản lý, nâng tầm chất lượng vận hành toàn diện.
                    </p>
                </div>

                {/* Liên hệ */}
                <div className="flex flex-col space-y-2 text-center sm:text-center">
                    <h3 className="text-white font-semibold mb-1">Liên hệ</h3>
                    <p>Địa chỉ: Số 12 Nguyễn Văn Bảo, Phường 4, Quận Gò Vấp, Thành phố Hồ Chí Minh.</p>
                    <p>SĐT: 0123 456 789</p>
                    <p>
                        Email: <a href={`mailto:${process.env.REACT_APP_CONTACT_EMAIL}`} className="hover:text-blue-400 underline">support@iuhelp.com</a>
                    </p>
                </div>

                {/* Mạng xã hội */}
                <div className="flex flex-col items-center sm:items-end space-y-3">
                    <h3 className="text-white font-semibold">Kết nối với chúng tôi</h3>
                    <div className="flex space-x-4">
                        {[{
                            icon: <FaFacebookF />,
                            href: process.env.REACT_APP_FACEBOOK_URL,
                            label: "Facebook"
                        }, {
                            icon: <FaGithub />,
                            href: process.env.REACT_APP_GITHUB_URL,
                            label: "GitHub"
                        }, {
                            icon: <FaGlobe />,
                            href: process.env.REACT_APP_WEBSITE_URL,
                            label: "Website"
                        }].map((item, idx) => (
                            <a
                                key={idx}
                                href={item.href}
                                className="w-9 h-9 rounded-full bg-gray-800 hover:bg-blue-500 hover:text-white flex items-center justify-center shadow-md transition transform hover:-translate-y-1"
                                title={item.label}
                            >
                                {item.icon}
                            </a>
                        ))}
                    </div>
                </div>
            </div>

            {/* Đường kẻ và bản quyền */}
            <div className="mt-8 border-t border-gray-700 pt-4 text-center text-xs text-gray-500">
                &copy; 2025 IUHelp Facility Management. All rights reserved.
            </div>
        </footer>
    );
};

export default Footer;
