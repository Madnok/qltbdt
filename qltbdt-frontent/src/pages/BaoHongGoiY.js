import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";
import Footer from "../components/layout/Footer";
import BaoHong from "../components/BaoHongGopY/BaoHong";
import GopY from "../components/BaoHongGopY/GopY";
import '@fortawesome/fontawesome-free/css/all.css';

const BaoHongGoiY = () => {
    return (
        <div className="flex flex-col min-h-screen bg-gray-100">
            <Header />
            <div className="flex-grow p-6 font-inter">
                <div className="max-w-6xl mx-auto space-y-8">
                    <div className="grid gap-8 md:grid-rows-2">
                        {/* Báo Hỏng */}
                        <BaoHong />
                        {/* Gợi Ý */}
                        <GopY />
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

const Header = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [isOpen, setIsOpen] = useState(false); // State cho dropdown menu
    const notificationCount = 12; // TODO: Lấy từ API sau
    const handleTitleClick = () => {
        if (user) {
            navigate("/nguoidung");
        } else {
            navigate("/login");
        }
    };
    return (
        <header className="px-6 py-4 text-gray-300 bg-gray-900 shadow-lg">
            <div className="flex items-center justify-between max-w-6xl mx-auto">
                <div className="flex items-center space-x-4">
                    <h1 className="text-xl font-bold cursor-pointer" onClick={handleTitleClick}>
                        Quản Lý Cơ Sở Vật Chất
                    </h1>
                </div>
                <nav>
                    <ul className="flex space-x-6 justify-between">
                        <li className="list-none hover:shadow-lg space-x-10">
                            {!user ? (
                                <>
                                    <button className="py-2 rounded  transition-transform  hover:bg-gray-700 hover:scale-105">
                                        Báo Hỏng
                                    </button>
                                    <button className="p-2 rounded  transition-transform  hover:bg-gray-700 hover:scale-105">
                                        Góp Ý
                                    </button>
                                    <button
                                        onClick={() => navigate(user ? "/nguoidung" : "/login")}
                                        className="py-2 rounded  transition-transform  hover:bg-gray-700 hover:scale-105"
                                    >
                                        {"Đăng Nhập"}
                                    </button>
                                </>
                            ) : (
                                <div className="relative">
                                    <button
                                        onClick={() => setIsOpen(!isOpen)}
                                        className="relative flex items-center p-2 space-x-3 rounded-lg hover:bg-gray-700 focus:outline-none"
                                    >
                                        {/* Avatar (có badge thông báo) */}
                                        <div className="relative">
                                            {user?.hinhAnh ? (
                                                <img
                                                    src={user.hinhAnh}
                                                    alt="Avatar"
                                                    className="object-cover w-10 h-10 border-2 border-white rounded-full shadow-md"
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center w-10 h-10 text-lg font-bold text-white bg-gray-500 rounded-full">
                                                    <i className="fas fa-user"></i>
                                                </div>
                                            )}

                                            {/* Badge thông báo */}
                                            {notificationCount > 0 && (
                                                <span className="absolute flex items-center justify-center w-5 h-5 text-xs text-white bg-red-500 rounded-full -top-1 -right-1">
                                                    {notificationCount > 9 ? "9+" : notificationCount}
                                                </span>
                                            )}
                                        </div>

                                        {/* Username + Icon Dropdown */}
                                        <span className="hidden text-white sm:block">
                                            {user?.username || "Khách"}
                                        </span>
                                        <i className={`text-white fas fa-caret-down transition-transform ${isOpen ? "rotate-180" : "rotate-0"}`}></i>
                                    </button>

                                    {/* Dropdown menu */}
                                    {isOpen && (
                                        <div className="absolute right-0 w-48 mt-3 bg-white rounded-lg shadow-lg">
                                            <ul className="text-gray-800">
                                                {user ? (
                                                    <>
                                                        <li
                                                            className="px-4 py-2 text-sm transition-all cursor-pointer hover:bg-gray-100"
                                                            onClick={() => navigate("/nguoidung")}
                                                        >
                                                            <i className="mr-2 fas fa-user"></i> Tài khoản
                                                        </li>
                                                        <li
                                                            className="px-4 py-2 text-sm transition-all cursor-pointer hover:bg-gray-100"
                                                        >
                                                            <i className="mr-2 fas fa-solid fa-triangle-exclamation"></i> Báo Hỏng
                                                        </li>
                                                        <li
                                                            className="px-4 py-2 text-sm transition-all cursor-pointer hover:bg-gray-100"
                                                        >
                                                            <i className="mr-2 fas fa-comment-alt"></i> Góp Ý
                                                        </li>
                                                        <li
                                                            className="px-4 py-2 text-sm transition-all cursor-pointer hover:bg-gray-100"
                                                            onClick={logout}
                                                        >
                                                            <i className="mr-2 fas fa-sign-out-alt"></i> Đăng xuất
                                                        </li>
                                                    </>
                                                ) : (
                                                    <li
                                                        className="px-4 py-2 text-sm transition-all cursor-pointer hover:bg-gray-100"
                                                        onClick={() => navigate("/login")}
                                                    >
                                                        <i className="mr-2 fas fa-sign-in-alt"></i> Đăng nhập
                                                    </li>
                                                )}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </li>
                    </ul>
                </nav>
            </div>
        </header>
    );
};

export default BaoHongGoiY