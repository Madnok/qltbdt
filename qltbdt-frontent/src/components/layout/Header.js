import { useAuth } from "../../context/AuthProvider";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Header = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false); // State cho dropdown menu
  const notificationCount = 12; // TODO: Lấy từ API sau

  return (
    <div className="flex items-center justify-between p-4 bg-gray-900 shadow-md">
      {/* Nút Toggle Sidebar */}
      <button
        onClick={toggleSidebar}
        className="text-white transition-all rounded-lg hover:bg-gray-700"
      >
        <i className="text-2xl fas fa-bars"></i>
      </button>

      {/* Tiêu đề */}
      <h1 className="text-lg font-bold tracking-wide text-white">
        QUẢN LÝ CƠ SỞ VẬT CHẤT
      </h1>

      {/* Ô tìm kiếm */}
      <div className="relative hidden w-80 md:block">
        <input
          type="text"
          placeholder="Tìm kiếm thiết bị, phòng học..."
          className="w-full px-4 py-2 text-sm text-gray-900 bg-white border rounded-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        <i className="absolute text-gray-500 transform -translate-y-1/2 right-4 top-1/2 fas fa-search"></i>
      </div>

      {/* Avatar + Dropdown */}
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
    </div>
  );
};

export default Header;
