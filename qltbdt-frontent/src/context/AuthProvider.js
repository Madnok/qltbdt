import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate(); // Hook điều hướng

  // Khi app load, gọi API /me để lấy thông tin người dùng từ cookie
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/auth/me", { withCredentials: true })
      .then((res) => {
        console.log(" User từ API:", res.data.user);
        setUser(res.data.user);
      })
      .catch((err) => {
        console.error("Lỗi lấy user:", err);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  // Hàm logout và điều hướng về trang đăng nhập
  const logout = async () => {
    await axios.post("http://localhost:5000/api/auth/logout", {}, { withCredentials: true });
    setUser(null);
    navigate("/login"); // Chuyển hướng về trang đăng nhập
  };

  // Hàm Làm mới user
  const refreshUser = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/auth/me", { withCredentials: true });
      setUser(res.data.user);
    } catch (err) {
      console.error("Lỗi làm mới user:", err);
      setUser(null);
    }
  };

  // Hàm cập nhật user
  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };


  return (
    <AuthContext.Provider value={{ user, setUser, logout,refreshUser, loading, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
