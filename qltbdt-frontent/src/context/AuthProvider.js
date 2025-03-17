import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Gọi API để lấy user khi app load
  useEffect(() => {
    refreshUser();
  }, []);

  // Hàm gọi API lấy thông tin user
  const refreshUser = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/auth/me", { withCredentials: true });
      setUser(res.data.user);
    } catch (err) {
      console.error("Lỗi lấy user:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Hàm đăng nhập
  const login = async (credentials) => {
    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", credentials, { withCredentials: true });
      setUser(res.data.user); // Cập nhật user ngay lập tức
      window.location.reload();
      await refreshUser(); // Gọi lại API để đảm bảo đồng bộ dữ liệu
      return res.data;
    } catch (err) {
      console.error("Lỗi đăng nhập:", err);
      throw err;
    }
  };

  // Hàm đăng xuất
  const logout = async () => {
    await axios.post("http://localhost:5000/api/auth/logout", {}, { withCredentials: true });
    setUser(null);
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, refreshUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
