import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

const Sidebar = ({ isOpen = true }) => {
  const [user, setUser] = useState(null);
  const location = useLocation(); // Lấy đường dẫn hiện tại

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/auth/me", { withCredentials: true });
        setUser(response.data.user);
      } catch (error) {
        console.error("Không thể lấy thông tin người dùng:", error);
        setUser(null);
      }
    };
    fetchUser();
  }, []);

  if (user === null) {
    return <div className="flex items-center justify-center w-56 h-screen bg-white shadow-md">Loading...</div>;
  }

  const menuItems = [
    { path: "/nguoidung", icon: "fas fa-user", text: "Người Dùng", roles: ["admin", "nhanvien", "nguoidung"] },
    { path: "/nhapxuat", icon: "fas fa-exchange-alt", text: "Nhập Xuất", roles: ["admin"] },
    { path: "/danhmuc", icon: "fas fa-list", text: "Danh Mục", roles: ["admin", "nhanvien"] },
    { path: "/baotri", icon: "fas fa-tools", text: "Bảo Trì", roles: ["admin", "nhanvien"] },
    { path: "/lichtruc", icon: "fas fa-calendar-alt", text: "Lịch Trực", roles: ["admin", "nhanvien"] },
    { path: "/thongke", icon: "fas fa-chart-bar", text: "Thống Kê", roles: ["admin"] },
    { path: "/", icon: "fas fa-exclamation-triangle", text: "Báo Hỏng & Góp Ý", roles: ["admin", "nhanvien"] }
  ];

  return (
    <div className={`bg-white border-whiteshadow-md max-h-screen ${isOpen ? "w-56" : "w-12"} transition-all duration-300`}>
      <ul className="space-y-2">
        {menuItems
          .filter(item => item.roles.includes(user.role))
          .map((item, index) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={index} className="relative group">
                <Link
                  to={item.path}
                  className={`flex items-center p-4 transition-all duration-200
                    ${isActive ? "bg-gray-800 text-white" : "hover:bg-gray-200"}`}
                >
                  <i className={`${item.icon} mr-2`}></i>
                  {isOpen && item.text}
                </Link>
                {!isOpen && (
                  <span className="absolute px-2 py-1 ml-2 text-xs text-white transition-opacity -translate-y-1/2 bg-gray-800 rounded-lg opacity-0 left-full top-1/2 group-hover:opacity-100">
                    {item.text}
                  </span>
                )}
              </li>
            );
          })}
      </ul>
    </div>
  );
};

export default Sidebar;
