import { useAuth } from "../../context/AuthProvider";
import { useState, useEffect, useRef } from "react"; // Thêm useEffect và useRef
import { useNavigate } from "react-router-dom";
import PropTypes from 'prop-types';
Header.propTypes = {
  toggleSidebar: PropTypes.func, // toggleSidebar là một hàm và không bắt buộc
};

function Header({ toggleSidebar }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const notificationCount = 12; // TODO: Lấy từ API sau
  const dropdownRef = useRef(null); // Ref cho khu vực dropdown

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        const userMenuButton = document.getElementById('user-menu-button');
        if (userMenuButton && !userMenuButton.contains(event.target)) {
          setIsUserMenuOpen(false);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  const handleTitleClick = () => {
    navigate(user ? "/nguoidung" : "/login");
  };

  // Hàm điều hướng đến trang Báo hỏng/Góp ý
  const navigateToBaoHongGopY = () => {
    navigate("/"); // Đảm bảo route này đúng
    setIsUserMenuOpen(false); // Đóng dropdown
  };

  return (
    <header className="flex items-center justify-between w-full px-4 py-3 text-gray-200 bg-gray-900 shadow-md md:px-2">
      <div className="flex items-center space-x-4">
        {/* Nút Toggle Sidebar - Chỉ hiển thị khi đã đăng nhập VÀ có hàm toggleSidebar được truyền vào */}
        {user && typeof toggleSidebar === 'function' && (
          <button
            onClick={toggleSidebar}
            className="p-2 text-gray-300 transition-colors duration-200 rounded-md hover:bg-gray-700 hover:text-white focus:outline-none focus:bg-gray-700"
            aria-label="Toggle sidebar"
          >
            <i className="text-xl fas fa-bars"></i>
          </button>
        )}

        {/* Tiêu đề/Logo - Luôn hiển thị, có thể click */}
        <h1
          className="text-xl font-semibold tracking-tight text-white cursor-pointer"
          onClick={handleTitleClick}
        >
          QUẢN LÝ CSVC
        </h1>
      </div>

      {/* === Phần Ở Giữa === */}
      <div className="flex-grow mx-4 md:mx-8 lg:mx-16">
        <div className="relative w-full max-w-lg mx-auto">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <i className="text-gray-500 fas fa-search"></i>
          </span>
          <input
            type="text"
            placeholder="Tìm kiếm..."
            className="w-full py-2 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-500 bg-gray-100 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent"
          />
        </div>
      </div>

      {/* === Phần Bên Phải: Thông báo, Avatar/Login === */}
      <div className="flex items-center space-x-4" ref={dropdownRef}>

        {/* Ngăn cách */}
        <div className="hidden w-px h-6 md:block"></div>

        {/* Avatar + Dropdown + badge tbao (Nếu đã đăng nhập) HOẶC Nút Đăng nhập (Nếu chưa) */}
        {user ? (
          // --- Phần hiển thị khi ĐÃ ĐĂNG NHẬP ---
          <>
            <button className="relative p-2 text-gray-400 transition-colors duration-200 rounded-full hover:bg-gray-700 hover:text-gray-100 focus:outline-none focus:bg-gray-700">
              <span className="sr-only">View notifications</span> {/* Cho screen reader */}
              <i className="text-lg fas fa-bell"></i>
              {/* Badge thông báo */}
              {notificationCount > 0 && (
                <span className="absolute top-0 right-0 flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-red-600 rounded-full">
                  {notificationCount > 9 ? "!" : notificationCount}
                </span>
              )}
            </button>
            <div className="relative">
              <button
                id="user-menu-button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center p-1 space-x-2 transition-colors duration-200 rounded-full focus:outline-none hover:bg-gray-700"
                aria-expanded={isUserMenuOpen}
                aria-haspopup="true"
              >
                {/* Avatar */}
                {user.hinhAnh ? (
                  <img
                    src={user.hinhAnh}
                    alt="User Avatar"
                    className="object-cover border border-gray-600 rounded-full shadow w-9 h-9"
                  />
                ) : (
                  <div className="flex items-center justify-center text-lg font-bold text-white bg-gray-600 border border-gray-500 rounded-full w-9 h-9">
                    <i className="fas fa-user"></i>
                  </div>
                )}
                {/* Tên người dùng */}
                <span className="hidden text-sm font-medium text-white lg:block">
                  {user.hoTen || user.username}
                </span>
                {/* Icon Dropdown */}
                <i className={`hidden lg:block text-gray-400 fas fa-chevron-down text-xs transition-transform duration-200 ${isUserMenuOpen ? "rotate-180" : ""}`}></i>
              </button>

              {/* Dropdown menu */}
              <div
                className={`absolute right-0 z-10 w-56 mt-2 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none transition ease-out duration-100 ${isUserMenuOpen ? 'transform opacity-100 scale-100' : 'transform opacity-0 scale-95 pointer-events-none'}`}
                role="menu" aria-orientation="vertical" aria-labelledby="user-menu-button"
              >
                <div className="py-1" role="none">
                  <button
                    onClick={() => { navigate("/nguoidung"); setIsUserMenuOpen(false); }}
                    className="flex items-center w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
                    role="menuitem"
                  >
                    <i className="w-5 mr-3 text-gray-500 fas fa-user-circle"></i> Tài khoản
                  </button>
                  <button
                    onClick={navigateToBaoHongGopY}
                    className="flex items-center w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
                    role="menuitem"
                  >
                    <i className="w-5 mr-3 text-red-500 fas fa-exclamation-triangle"></i> Báo Hỏng
                  </button>
                  <button
                    onClick={navigateToBaoHongGopY}
                    className="flex items-center w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
                    role="menuitem"
                  >
                    <i className="w-5 mr-3 text-blue-500 fas fa-comment-alt"></i> Góp Ý
                  </button>
                  {/* Ngăn cách trước khi đăng xuất */}
                  <div className="my-1 border-t border-gray-100"></div>
                  <button
                    onClick={() => { logout(); setIsUserMenuOpen(false); }}
                    className="flex items-center w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
                    role="menuitem"
                  >
                    <i className="w-5 mr-3 text-gray-500 fas fa-sign-out-alt"></i> Đăng xuất
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          // --- Phần hiển thị khi CHƯA ĐĂNG NHẬP ---
          <div className="flex items-center space-x-2">
            <button
              onClick={navigateToBaoHongGopY}
              className="px-3 py-2 text-sm font-medium text-gray-300 transition-colors duration-200 rounded-md hover:bg-gray-700 hover:text-white focus:outline-none focus:bg-gray-700"
            >
              Báo Hỏng
            </button>
            <button
              onClick={navigateToBaoHongGopY}
              className="px-3 py-2 text-sm font-medium text-gray-300 transition-colors duration-200 rounded-md hover:bg-gray-700 hover:text-white focus:outline-none focus:bg-gray-700"
            >
              Góp ý
            </button>
            <button
              onClick={() => navigate("/login")}
              className="px-4 py-2 text-sm font-medium text-gray-300 transition-colors duration-200 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-white"
            >
              Đăng Nhập
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;