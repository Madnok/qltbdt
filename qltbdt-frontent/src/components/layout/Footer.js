const Footer = () => {
    return (
        <footer className="py-4 text-center text-gray-300 bg-gray-900 border-t border-gray-700">
            <div className="flex flex-col items-center space-y-2">
                <p className="text-xs">&copy; 2025 QLCSVC. Phạm Minh Hùng - Đinh Lê Khải</p>
                <div className="flex space-x-4">
                    {/* eslint-disable-next-line*/}
                    <a href="#" className="text-blue-400 transition hover:text-blue-500"> 
                        <i className="fas fa-envelope"></i> Liên hệ
                    </a>
                    {/* eslint-disable-next-line*/}
                    <a href="#" className="text-blue-400 transition hover:text-blue-500">
                        <i className="fab fa-github"></i> GitHub
                    </a>
                    {/* eslint-disable-next-line*/}
                    <a href="#" className="text-blue-400 transition hover:text-blue-500">
                        <i className="fab fa-facebook"></i> Facebook
                    </a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
