import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthProvider";
import { toast } from "react-toastify";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  // const [error, setError] = useState("");

  const navigate = useNavigate();
  const { user, setUser, loading } = useAuth();

  // State loading cục bộ cho nút đăng nhập
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      navigate("/nguoidung");
    }
  }, [user, loading, navigate]);


  const handleLogin = async (e) => {
    if (e) e.preventDefault();

    setIsLoggingIn(true);

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/login`,
        { identifier: username, password },
        { withCredentials: true }
      );
      if (response.data && response.data.user) {
        toast.success("Đăng nhập thành công!");
        setUser(response.data.user);
        navigate("/nguoidung");
      } else {
        toast.error("Đăng nhập không thành công, dữ liệu trả về không hợp lệ.");
      }
    } catch (err) {
      console.error("Login error:", err); // Giữ lại log lỗi để debug
      let errorMessage = "Lỗi không xác định!";
      if (err.response) {
        if (err.response.status === 403) {
          errorMessage = "Tài khoản của bạn đang bị khóa!";
        } else if (err.response.status === 429) {
          errorMessage = err.response.data || " Quá nhiều yêu cầu đăng nhập. Vui lòng thử lại sau 5 phút.";
        } else {
          errorMessage = err.response.data.message || "Sai tài khoản hoặc mật khẩu!";
        }
      } else if (err.request) {
        errorMessage = "Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng.";
      } else {
        errorMessage = `Lỗi: ${err.message}`;
      }
      toast.error(errorMessage);
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Đang tải...</div>;
  }

  return (
    <div
      className="flex items-center justify-center h-screen bg-center bg-cover"
      style={{ backgroundImage: "url('/iuh1.png')" }}
    >
      <div className="flex w-full max-w-4xl overflow-hidden bg-white rounded-lg shadow-lg bg-opacity-60"> {/* Thêm overflow-hidden nếu cần */}
        {/* Phần bên trái */}
        <div className="flex-col items-center justify-center hidden p-10 bg-gray-100 md:flex md:w-1/2 bg-opacity-70"> {/* Ẩn trên mobile, hiển thị từ md */}
          <div className="flex flex-col space-y-4 text-center">
            <h1 className="text-4xl font-extrabold text-black">IUHelp</h1>
            <h2 className="text-3xl font-extrabold text-black">Facility Management</h2>
            <img
              src="./img/logoiuh.png"
              alt="Logo IUH"
              className="object-contain w-48 h-auto mx-auto" // Điều chỉnh kích thước logo
            />
            <p className="text-lg text-black">
              Chưa có tài khoản?{" "}
              <span
                className="font-semibold text-blue-600 cursor-pointer hover:text-blue-900"
                onClick={() => navigate("/")} // Đảm bảo route '/' là trang báo hỏng/góp ý
              >
                Góp Ý - Báo Hỏng
              </span>{" "}
              tại đây.
            </p>
          </div>
        </div>

        {/* Phần bên phải - Form đăng nhập */}
        <div className="w-full p-8 md:w-1/2 md:p-10"> {/* Responsive width */}
          <h2 className="mb-6 text-3xl font-bold text-center text-black">Đăng Nhập</h2>

          {/* 4. Bỏ phần hiển thị lỗi inline */}
          {/* {error && <p className="mb-4 text-center text-red-500">{error}</p>} */}

          <form onSubmit={handleLogin}> {/* Sử dụng form để có thể submit bằng Enter */}
            <input
              type="text"
              placeholder="Tên đăng nhập hoặc Email"
              className="w-full p-3 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" // Cải thiện focus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required // Thêm required cho validation cơ bản
            />
            <input
              type="password"
              placeholder="Mật khẩu"
              className="w-full p-3 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" // Cải thiện focus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required // Thêm required
            />
            <div className="flex items-center justify-end mb-4 text-sm">
              <Link
                to="/forgot-password" // Đảm bảo route này tồn tại
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Quên mật khẩu?
              </Link>
            </div>
            <button
              type="submit" // Đặt type là submit
              className={`w-full p-3 text-white bg-gray-800 rounded-lg opacity-90 hover:bg-black transition duration-200 ${isLoggingIn ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={!isLoggingIn ? handleLogin : undefined} // Gọi handleLogin khi click nếu không phải form submit
              disabled={isLoggingIn} // Vô hiệu hóa nút khi đang xử lý
            >
              {isLoggingIn ? 'Đang xử lý...' : 'Đăng Nhập'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login
