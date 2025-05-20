import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const hasRole = (role) => { 
    return user && user.role === role;
  };


  // Gọi API để lấy user khi app load
  useEffect(() => {
    refreshUser();
  }, []);

  // Hàm gọi API lấy thông tin user
  const refreshUser = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/auth/me`, { withCredentials: true });
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
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/auth/login`, credentials, { withCredentials: true });
      setUser(res.data.user); // Cập nhật user 
      navigate('/');
      return res.data;
    } catch (err) {
      console.error("Lỗi đăng nhập:", err);
      throw err;
    }
  };

  // Hàm đăng xuất
  const logout = async () => {
    await axios.post(`${process.env.REACT_APP_API_URL}/auth/logout`, {}, { withCredentials: true });
    setUser(null);
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, refreshUser, loading, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
