import { useAuth } from "../../context/AuthProvider";
import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import PropTypes from 'prop-types';

Header.propTypes = {
  toggleSidebar: PropTypes.func,
  scrollToBaoHong: PropTypes.func,
  scrollToGopY: PropTypes.func,
  scrollToGioiThieu: PropTypes.func,
};

function Header({ toggleSidebar, scrollToBaoHong, scrollToGopY, scrollToGioiThieu }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const notificationCount = 8;
  const dropdownRef = useRef(null);
  const headerRef = useRef(null);
  const lastScrollY = useRef(0);

  const isBaoHongGopYPage = location.pathname === '/';

  // Logic scroll và ẩn/hiện header 
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollThreshold = 10;
      setIsScrolled(currentScrollY > scrollThreshold);
      if (currentScrollY <= scrollThreshold) {
        setHeaderVisible(true);
      } else if (currentScrollY > lastScrollY.current) {
        if (headerVisible) setHeaderVisible(false);
      } else {
        if (!headerVisible) setHeaderVisible(true);
      }
      lastScrollY.current = currentScrollY <= 0 ? 0 : currentScrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [headerVisible]);

  // Logic đóng dropdown 
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };
    if (isUserMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isUserMenuOpen]);

  //--- Hàm xử lý click ---

  // Click vào Tên App (chỉ dùng khi ở trang '/')
  const handleAppNameClick = () => {
    // Chỉ thực hiện hành động nếu đang ở trang BaoHongGoiY
    if (isBaoHongGopYPage && typeof scrollToGioiThieu === 'function') {
      scrollToGioiThieu();
    }
    // Không cần navigate hay đóng menu ở đây vì nó chỉ hiện ở trang '/'
  };

  // Click nút Báo Hỏng 
  const handleBaoHongClick = () => {
    if (isBaoHongGopYPage && typeof scrollToBaoHong === 'function') {
      scrollToBaoHong();
    } else {
      navigate("/");
    }
    setIsUserMenuOpen(false);
  };

  // Click nút Góp Ý 
  const handleGopYClick = () => {
    if (isBaoHongGopYPage && typeof scrollToGopY === 'function') {
      scrollToGopY();
    } else {
      navigate("/");
    }
    setIsUserMenuOpen(false);
  };

  // --- Classes và Styles ---
  const headerBaseClasses = "fixed top-0 left-0 right-0 z-50 flex items-center justify-between w-full transition-transform duration-300 ease-in-out";
  const headerHeightClass = "h-16";
  const headerStyleClass = (isBaoHongGopYPage && !isScrolled)
    ? 'bg-transparent text-white shadow-none transition-colors duration-500'
    : 'bg-gray-900 text-white shadow-md transition-colors duration-300';
  const headerVisibilityClass = headerVisible ? 'translate-y-0' : '-translate-y-full';

  return (
    <header ref={headerRef} className={`${headerBaseClasses} ${headerHeightClass} ${headerStyleClass} ${headerVisibilityClass} `}>

      {/* Phần Bên Trái: Điều chỉnh hiển thị Tên App hoặc Nút Menu */}
      <div className="flex items-center space-x-3 md:space-x-4 min-w-[60px]">

        {/* Trường hợp 1: Đang ở trang BaoHongGoiY ('/') -> Hiển thị Tên App */}
        {isBaoHongGopYPage && (
          <button
            onClick={handleAppNameClick}
            className={`px-4 sm:px-6 lg:px-8 text-2xl sm:text-2xl font-bold tracking-wide focus:outline-none transition-colors duration-300 ${!isScrolled ? 'text-white' : 'text-white'}`}
          >
            IUHelp
          </button>
        )}

        {/* Trường hợp 2: Trang khác & Đã đăng nhập -> Nút Menu */}
        {!isBaoHongGopYPage && user && typeof toggleSidebar === 'function' && (
          <>
            <button
              onClick={toggleSidebar}
              className="px-4 sm:px-4 lg:px-4 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white text-gray-300 hover:bg-gray-700 hover:text-white"
              aria-label="Toggle sidebar"
            >
              <i className="text-xl fas fa-bars"></i>
            </button>
            <span className="font-bold text-2xl md:hidden">
              IUHelp
            </span>
          </>
        )}

        {/* Trường hợp 3: KHÔNG ở trang BaoHongGoiY VÀ User CHƯA đăng nhập (hoặc không có toggle) -> Hiển thị placeholder */}
        {!isBaoHongGopYPage && (!user || typeof toggleSidebar !== 'function') && (
          <div className="w-10 h-10"></div> // Placeholder để giữ layout
        )}
      </div>

      {/* Phần Giữa: Tiêu đề trang */}
      {!isBaoHongGopYPage && (

        <div className="hidden sm:flex flex-grow justify-center items-center px-4 overflow-hidden">
          <h1 className="text-xl font-bold tracking-wider text-white truncate">
            <span className="hidden md:inline">IUHelp Facility Management</span>
          </h1>
        </div>
      )}
      {/* Placeholder khi ở trang chủ */}
      {isBaoHongGopYPage && (
        <div className="hidden sm:flex flex-grow px-4"></div>
      )}

      {/* Phần Bên Phải: Thông báo, Avatar/Login (giữ nguyên) */}
      <div className="flex items-center justify-end sm:px-6 md:px-6 lg:px-6 space-x-2 md:space-x-4" ref={dropdownRef}>
        {user ? (
          <>
            {/* Nút thông báo */}
            <button className="relative p-2 text-gray-300 transition-colors duration-200 rounded-full hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-white">
              <span className="sr-only">View notifications</span>
              <i className="text-lg fas fa-bell"></i>
              {notificationCount > 0 && (
                <span className="absolute top-0 right-0 flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-red-600 rounded-full transform translate-x-1/4 -translate-y-1/4">
                  {notificationCount > 9 ? "!" : notificationCount}
                </span>
              )}
            </button>

            {/* Dropdown User */}
            <div className="relative">
              {/* Nút mở dropdown (Avatar) */}
              <button
                id="user-menu-button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center p-1 space-x-2 transition-colors duration-200 rounded-full focus:outline-none hover:bg-gray-700"
                aria-expanded={isUserMenuOpen}
                aria-haspopup="true"
              >
                {/* Avatar */}
                {user.hinhAnh ? (
                  <img src={user.hinhAnh} alt="User Avatar" className="object-cover border-2 border-transparent rounded-full w-9 h-9" />
                ) : (
                  <div className="flex items-center justify-center text-lg font-bold text-white bg-gray-600 rounded-full w-9 h-9"><i className="fas fa-user"></i></div>
                )}
                <span className="hidden text-sm font-medium text-white lg:block">{user.hoTen || user.username}</span>
                <i className={`hidden lg:block text-gray-400 fas fa-chevron-down text-xs transition-transform duration-200 ${isUserMenuOpen ? "rotate-180" : ""}`}></i>
              </button>

              {/* Menu Dropdown */}
              <div
                className={`absolute right-0 z-30 w-56 mt-2 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none transition ease-out duration-100 ${isUserMenuOpen ? 'transform opacity-100 scale-100' : 'transform opacity-0 scale-95 pointer-events-none'}`}
                role="menu" aria-orientation="vertical" aria-labelledby="user-menu-button"
              >
                <div className="py-1" role="none">
                  <button onClick={() => { navigate("/nguoidung"); setIsUserMenuOpen(false); }} className="flex items-center w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100" role="menuitem"><i className="w-5 mr-3 text-gray-500 fas fa-user-circle"></i> Tài khoản</button>
                  <button onClick={handleBaoHongClick} className="flex items-center w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100" role="menuitem"><i className="w-5 mr-3 text-red-500 fas fa-exclamation-triangle"></i> Báo Hỏng</button>
                  <button onClick={handleGopYClick} className="flex items-center w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100" role="menuitem"><i className="w-5 mr-3 text-blue-500 fas fa-comment-alt"></i> Góp Ý</button>
                  <div className="my-1 border-t border-gray-100"></div>
                  <button onClick={() => { logout(); setIsUserMenuOpen(false); }} className="flex items-center w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100" role="menuitem"><i className="w-5 mr-3 text-gray-500 fas fa-sign-out-alt"></i> Đăng xuất</button>
                </div>
              </div>
            </div>
          </>
        ) : (
          // --- Hiển thị khi CHƯA ĐĂNG NHẬP ---
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigate("/login")}
              // Cập nhật lại style nút đăng nhập cho đúng
              className={`px-4 py-2 text-sm font-medium transition-colors duration-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-white ${isBaoHongGopYPage && !isScrolled ? ' text-white hover:bg-gray-900' : 'bg-gray-900 text-white hover:bg-gray-600'}`}
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