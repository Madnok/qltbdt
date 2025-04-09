import { useAuth } from "../../context/AuthProvider";
import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import PropTypes from 'prop-types';

Header.propTypes = {
  toggleSidebar: PropTypes.func, // toggleSidebar là một hàm và không bắt buộc
  scrollToBaoHong: PropTypes.func,
  scrollToGopY: PropTypes.func,
  scrollToGioiThieu: PropTypes.func,
};

function Header({ toggleSidebar, scrollToBaoHong, scrollToGopY, scrollToGioiThieu }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const notificationCount = 8; // TODO: Lấy từ API sau
  const dropdownRef = useRef(null); // Ref cho khu vực dropdown

  const isBaoHongGopYPage = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      if (isBaoHongGopYPage) {
        setIsScrolled(window.scrollY > 10);
      } else {
        setIsScrolled(true);
      }
    };

    handleScroll();

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [location.pathname, isBaoHongGopYPage]);

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
    if (isBaoHongGopYPage && typeof scrollToGioiThieu === 'function') {
      scrollToGioiThieu(); // Cuộn về đầu trang nếu đang ở trang đó
      setIsUserMenuOpen(false);
    } else {
      navigate(user ? "/nguoidung" : "/"); // Điều hướng nếu ở trang khác
      setIsUserMenuOpen(false);
    }
  };

  // Xử lý click nút Báo Hỏng (trong dropdown hoặc khi chưa đăng nhập)
  const handleBaoHongClick = () => {
    if (isBaoHongGopYPage && typeof scrollToBaoHong === 'function') {
      scrollToBaoHong(); // Cuộn đến section báo hỏng
      setIsUserMenuOpen(false);
    } else {
      navigate("/"); // Chuyển về trang chủ nếu đang ở trang khác
      // Có thể lưu trạng thái để tự cuộn sau khi chuyển trang (phức tạp hơn)
      setIsUserMenuOpen(false);
    }
  };

  // Xử lý click nút Góp Ý (trong dropdown hoặc khi chưa đăng nhập)
  const handleGopYClick = () => {
    if (isBaoHongGopYPage && typeof scrollToGopY === 'function') {
      scrollToGopY(); // Cuộn đến section góp ý
      setIsUserMenuOpen(false);
    } else {
      navigate("/"); // Chuyển về trang chủ
      setIsUserMenuOpen(false);
    }
  };

  // Xác định class CSS cho header dựa trên trạng thái
  const headerBaseClasses = "flex items-center justify-between w-full py-3 transition-colors duration-300 ease-in-out"; // Thêm position: fixed, z-index, transition
  const headerBgClass = (isBaoHongGopYPage && !isScrolled)
    ? 'bg-gray-900 bg-opacity-30 text-white shadow-none fixed top-0 left-0 right-0 z-40 transition-all duration-500 ease-in-out'
    : 'bg-gray-900 bg-opacity-100'

  const headerPaddingClass = "px-4 md:px-4";

  return (
    // flex items-center justify-between w-full py-3 text-gray-200 bg-gray-900 shadow-md md:px-2
    <header className={`${headerBaseClasses} ${headerBgClass} ${headerPaddingClass}`}>

      {/* Phần Bên Trái: Chỉ còn nút Menu (nếu user tồn tại và có hàm toggle) */}
      <div className="flex items-center justify-start md:w-60">
        {user && typeof toggleSidebar === 'function' && (
          <button
            onClick={toggleSidebar}
            // Thêm class text-white khi nền trong suốt
            className={`rounded-md transition-colors duration-200 focus:outline-none focus:bg-gray-700 ${(isBaoHongGopYPage && !isScrolled) ? 'text-white hover:bg-white/20' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
            aria-label="Toggle sidebar"
          >
            <i className="text-xl fas fa-bars"></i>
          </button>
        )}
        {/* Nếu không có nút menu, vẫn giữ div để cân bằng */}
        {(!user || typeof toggleSidebar !== 'function') && <div className="w-10 h-10"></div>}
      </div>

      <div className="flex-grow text-center">
        {!isBaoHongGopYPage && (
          <h1
            className={`text-xl font-bold tracking-wider cursor-pointer md:text-2xl transition-colors duration-300 ${!isBaoHongGopYPage ? (isScrolled ? 'text-white' : 'text-white') : 'hidden'
              }`}
            onClick={handleTitleClick}
          >
            IUHelp Facility Management
          </h1>
        )}
      </div>

      {/* Phần Bên Phải: Thông báo, Avatar/Login - Đặt chiều rộng cố định */}
      <div className="flex items-center justify-end w-auto min-w-[64px] space-x-2 md:space-x-4" ref={dropdownRef}>

        {/* Avatar + Dropdown + badge tbao (Nếu đã đăng nhập) HOẶC Nút Đăng nhập (Nếu chưa) */}
        {user ? (
          // --- Phần hiển thị khi ĐÃ ĐĂNG NHẬP ---
          <>
            {/* Nút thông báo */}
            <button className="relative p-2 text-gray-400 transition-colors duration-200 rounded-full hover:bg-gray-700 hover:text-gray-100 focus:outline-none focus:bg-gray-700">
              <span className="sr-only">View notifications</span>
              <i className="text-lg fas fa-bell"></i>
              {notificationCount > 0 && (
                <span className="absolute top-0 right-0 flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-red-600 rounded-full">
                  {notificationCount > 9 ? "!" : notificationCount}
                </span>
              )}
            </button>

            {/* Dropdown User */}
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
                <span className="hidden text-sm font-medium text-white lg:block">{user.hoTen || user.username}</span>
                <i className={`hidden lg:block text-gray-400 fas fa-chevron-down text-xs transition-transform duration-200 ${isUserMenuOpen ? "rotate-180" : ""}`}></i>
              </button>

              {/* Dropdown menu */}
              <div
                className={`absolute right-0 z-20 w-56 mt-2 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none transition ease-out duration-100 ${isUserMenuOpen ? 'transform opacity-100 scale-100' : 'transform opacity-0 scale-95 pointer-events-none'}`}
                role="menu" aria-orientation="vertical" aria-labelledby="user-menu-button"
              >
                <div className="py-1" role="none">
                  {/* Nút Tài khoản */}
                  <button
                    onClick={() => { navigate("/nguoidung"); setIsUserMenuOpen(false); }}
                    className="flex items-center w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
                    role="menuitem"
                  >
                    <i className="w-5 mr-3 text-gray-500 fas fa-user-circle"></i> Tài khoản
                  </button>
                  {/* Nút Báo Hỏng */}
                  <button
                    onClick={handleBaoHongClick}
                    className="flex items-center w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
                    role="menuitem"
                  >
                    <i className="w-5 mr-3 text-red-500 fas fa-exclamation-triangle"></i> Báo Hỏng
                  </button>
                  {/* Nút Góp Ý */}
                  <button
                    onClick={handleGopYClick}
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
              onClick={handleBaoHongClick}
              className="px-3 py-2 text-sm font-medium text-gray-300 transition-colors duration-200 rounded-md hover:bg-gray-700 hover:text-white focus:outline-none focus:bg-gray-700"
            >
              Báo Hỏng
            </button>
            <button
              onClick={handleGopYClick}
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