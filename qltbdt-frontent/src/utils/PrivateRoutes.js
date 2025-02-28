import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";

const PrivateRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return <p>Đang kiểm tra quyền...</p>;
  if (!user) return <Navigate to="/" />;

  if (!allowedRoles.includes(user.role)) {
    alert("❌ Bạn không có quyền truy cập!");
    return <Navigate to="/" />;
  }

  return <Outlet />;
};

export default PrivateRoute;
