import { useAuth } from "../../context/AuthProvider";
import { Navigate, Outlet } from "react-router-dom";
import Header from "../layout/Header";
import Sidebar from "../layout/Sidebar";
import Footer from "../layout/Footer";
import { useSidebar} from "../../utils/helpers";

const AppLayout = () => {
  const { user, loading } = useAuth();
  const { isSidebarOpen, toggleSidebar } = useSidebar();
  if (loading) return <div>Loading...</div>; // Hiển thị loading khi user chưa load xong

  if (!user) return <Navigate to="/" replace />; // Nếu chưa đăng nhập, chuyển về login

  return (
    <div className="flex flex-col h-screen">
      <Header toggleSidebar={toggleSidebar} />
      <div className="flex flex-1">
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <main className="flex-1 p-2 bg-gray-100 overflow-auto">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default AppLayout;
