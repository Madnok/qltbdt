import { useAuth } from "../../context/AuthProvider";
import React, { useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { Navigate, Outlet } from "react-router-dom";
import Header from "../layout/Header";
import Sidebar from "../layout/Sidebar";
import Footer from "../layout/Footer";
import { useSidebar } from "../../utils/helpers";
import { toast } from 'react-toastify';

const AppLayout = () => {
  const { user, loading, logout } = useAuth();
  const { isSidebarOpen, toggleSidebar } = useSidebar();
  const socketContext = useSocket(); // Lấy context object
  const socket = socketContext?.socket; // Lấy socket an toàn

  useEffect(() => {
    if (socket) {
      const handleStatusChange = (data) => {
        if (data?.newStatus === 'off') {
          toast.error(data?.message || 'Tài khoản của bạn đã bị khóa!', {
            duration: 6000, icon: '🔒',
          });
          setTimeout(() => { logout(); }, 1500);
        }
      };
      // Lắng nghe user bị khóa
      socket.on('status_changed', handleStatusChange);

      const handleNewBaoHong = (data) => { toast.info(`Có báo hỏng mới tại ${data.phong_name}`); };
      socket.on('new_baohong', handleNewBaoHong);

      // Hàm cleanup
      return () => {
        socket.off('status_changed', handleStatusChange);
        socket.off('new_baohong', handleNewBaoHong);
      };
    } else {
      console.log('[AppLayout] Socket is null, listeners not attached.');
    }
  }, [socket, logout]); // Dependencies

  // Hiển thị loading khi đang kiểm tra user
  if (loading) {
    return <div className="flex items-center justify-center h-screen text-gray-600">Đang tải thông tin xác thực...</div>;
  }

  if (!user) {
    console.log("[AppLayout] No user found, navigating to login.");
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex flex-col h-screen">
      <Header toggleSidebar={toggleSidebar} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <main className="flex-1 p-2 overflow-y-auto bg-gray-100">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default AppLayout;
