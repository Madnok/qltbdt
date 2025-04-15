import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthProvider";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

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
        `${process.env.REACT_APP_API_URL}/api/auth/login`,
        { identifier: username, password },
        { withCredentials: true }
      );
      if (response.data) {
        alert("✅ Đăng nhập thành công!");
        setUser(response.data.user);
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

  return (
    <div
      className="flex items-center justify-center h-screen bg-center bg-cover"
      style={{ backgroundImage: "url('/iuh1.png')" }}
    >
      <div className="flex w-full max-w-4xl bg-white rounded-lg shadow-lg bg-opacity-60">
        <div className="w-1/2 h-full p-10">
          <div className="flex flex-col space-y-2">
            <div>
              <h1 className="text-4xl font-extrabold text-center text-black">IUHelp</h1>
              <h2 className="text-3xl font-extrabold text-center text-black">Facility Management</h2>
            </div>
            <div className="flex items-center justify-center">
              <img
                src="./img/logoiuh.png"
                alt="Logo"
                className="w-[256px] h-[128px] object-contain"
              />
            </div>
            <p className="mb-8 text-lg text-center text-black">
              Chưa có tài khoản? <span className="font-semibold text-blue-600 cursor-pointer hover:text-blue-900" onClick={() => navigate("/")}>Góp Ý - Báo Hỏng </span> ở đây.
            </p>
          </div>
        </div>
        <div className="w-1/2 p-10 rounded-lg shadow-md bg-opacity-60">
          <h2 className="mb-6 text-3xl font-bold text-center text-black">Đăng Nhập</h2>
          {error && <p className="text-center text-red-500">{error}</p>}
          <input type="text" placeholder="Tên đăng nhập hoặc Email" className="w-full p-3 mb-4 border rounded-lg" value={username} onChange={(e) => setUsername(e.target.value)} />
          <input type="password" placeholder="Mật khẩu" className="w-full p-3 mb-4 border rounded-lg" value={password} onChange={(e) => setPassword(e.target.value)} />
          <div className="flex items-center justify-end mb-4 text-sm">
            <Link
              to="/forgot-password"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Quên mật khẩu?
            </Link>
          </div>
          <button className="w-full p-3 text-white bg-gray-800 rounded-lg opacity-90 hover:bg-black" onClick={handleLogin}>Đăng Nhập</button>
        </div>
      </div>
    </div>
  );
};

export default Login
