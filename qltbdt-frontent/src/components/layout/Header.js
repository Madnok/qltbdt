import { useAuth } from "../../context/AuthProvider";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Header = ({ toggleSidebar }) => {
  const { user, logout} = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false); // State cho dropdown menu
  const notificationCount = 12; // TODO: Thay bằng số thông báo thực tế từ API
  const [userData, setUserData] = useState(user); // State để cập nhật user

  useEffect(() => {
    setUserData(user); // Cập nhật user mỗi khi thay đổi
  }, [user]);

  return (
    <div className="flex items-center justify-between p-3 bg-gray-800 shadow-md">
      {/* Nút Toggle Sidebar */}
      <button
        onClick={toggleSidebar}
        className="p-2 text-white transition-all rounded-lg hover:bg-gray-700"
      >
        <i className="text-xl fas fa-bars"></i>
      </button>

      {/* Tiêu đề */}
      <h1 className="text-lg font-semibold tracking-wide text-white">
        QUẢN LÝ CƠ SỞ VẬT CHẤT
      </h1>

      {/* Ô tìm kiếm */}
      <div className="relative w-80">
        <input
          type="text"
          placeholder="Tìm kiếm..."
          className="w-full px-4 py-2 text-sm text-gray-800 bg-white border rounded-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        <i className="absolute text-gray-400 transform -translate-y-1/2 right-3 top-1/2 fas fa-search"></i>
      </div>

      {/* Avatar + Dropdown */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative flex items-center p-2 space-x-3 rounded-lg hover:bg-gray-700 focus:outline-none"
        >
          {/* Avatar (có badge thông báo) */}
          <div className="relative">
            {userData?.hinhAnh ? (
              <img
                src={userData.hinhAnh}
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
          <span className="text-white">
            {userData?.hoTen || userData?.username || "Khách"}
          </span>
          <i className={`text-white fas fa-caret-down transition-transform ${isOpen ? "rotate-180" : "rotate-0"}`}></i>
        </button>

        {/* Dropdown menu */}
        {isOpen && (
          <div className="absolute right-0 mt-3 bg-white rounded-lg shadow-lg w-44">
            <ul className="text-gray-800">
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
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Header;

