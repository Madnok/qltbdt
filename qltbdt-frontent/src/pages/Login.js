import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthProvider"; // Sử dụng AuthContext

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showRegister, setShowRegister] = useState(false);
  const [registerData, setRegisterData] = useState({ username: "", password: "", hoTen: "" });

  const navigate = useNavigate();
  const { user, setUser, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate("/nguoidung");
    }
  }, [user, loading, navigate]);

  const handleLogin = async () => {
    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/login",
        { username, password },
        { withCredentials: true }
      );
      if (response.data) {
        alert("✅ Đăng nhập thành công!");
        setUser(response.data.user); // Cập nhật user trong context
        navigate("/nguoidung");
      }
    } catch (err) {
      if (err.response) {
        if (err.response.status === 403) {
          setError("🚫 Tài khoản của bạn đang bị khóa!");
        } else {
          setError(err.response.data.message || "❌ Sai tài khoản hoặc mật khẩu!");
        }
      } else {
        setError("❌ Lỗi kết nối đến máy chủ!");
      }
    }
  };

  const handleRegister = async () => {
    if (!registerData.username || !registerData.password || !registerData.hoTen) {
      alert("⚠️ Vui lòng nhập đầy đủ thông tin!");
      return;
    }
    try {
      // eslint-disable-next-line 
      const response = await axios.post("http://localhost:5000/api/auth/register", registerData);
      alert("✅ Đăng ký thành công! Hãy đăng nhập.");
      setShowRegister(false);
    } catch (err) {
      setError(err.response?.data?.message || "❌ Lỗi khi đăng ký, thử lại!");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="flex w-full max-w-4xl bg-white rounded-lg shadow-lg">
        <div className="w-1/2 h-full p-10">
          <h1 className="text-3xl font-bold text-center text-gray-900">Trang Quản Lý Thiết Bị Cơ Sở Vật Chất</h1>
          <div className="text-center my-9">
            <p className="mb-8 text-base text-gray-700">
              Tài khoản chưa được kích hoạt? Vẫn có thể báo hỏng và góp ý ở đây.
            </p>
            <button
              className="w-full p-3 text-white transition duration-300 bg-blue-600 rounded-lg hover:bg-blue-700"
              onClick={() => navigate("/")}
            >
              Góp Ý - Báo Hỏng
            </button>
            <p className="mt-4 text-center text-gray-600">
              <span className="text-blue-500 cursor-pointer">Quên Mật Khẩu ?</span>
            </p>
          </div>
        </div>
        <div className="w-1/2 p-10 bg-white rounded-lg shadow-md">
          <h2 className="mb-6 text-2xl font-bold text-center text-gray-800">Đăng Nhập</h2>
          {error && <p className="text-center text-red-500">{error}</p>}
          <input type="text" placeholder="Tên đăng nhập" className="w-full p-3 mb-4 border rounded-lg" value={username} onChange={(e) => setUsername(e.target.value)} />
          <input type="password" placeholder="Mật khẩu" className="w-full p-3 mb-4 border rounded-lg" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button className="w-full p-3 text-white bg-gray-800 rounded-lg hover:bg-gray-500" onClick={handleLogin}>Đăng Nhập</button>
          <p className="mt-4 text-center text-gray-600">
            Chưa có tài khoản? <span className="text-blue-500 cursor-pointer" onClick={() => setShowRegister(true)}>Đăng Ký Ngay.</span>
          </p>
        </div>
      </div>
      {showRegister && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="p-6 bg-white rounded-lg shadow-lg w-96">
            <h2 className="mb-4 text-2xl font-bold text-center text-gray-800">Đăng Ký Tài Khoản</h2>
            <input type="text" placeholder="Tên đăng nhập" className="w-full p-3 mb-3 border rounded-lg" value={registerData.username} onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })} />
            <input type="password" placeholder="Mật khẩu" className="w-full p-3 mb-3 border rounded-lg" value={registerData.password} onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })} />
            <input type="text" placeholder="Họ Và Tên" className="w-full p-3 mb-3 border rounded-lg" value={registerData.hoTen} onChange={(e) => setRegisterData({ ...registerData, hoTen: e.target.value })} />
            <button className="w-full p-3 text-white bg-green-600 rounded-lg hover:bg-green-700" onClick={handleRegister}>Đăng Ký</button>
            <button className="w-full p-3 mt-2 text-white bg-gray-400 rounded-lg hover:bg-gray-500" onClick={() => setShowRegister(false)}>Hủy</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
