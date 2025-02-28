import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthProvider";

const UserRoute = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/user", { withCredentials: true })
      .then((response) => setUsers(response.data))
      .catch((error) => console.error("Lỗi khi tải danh sách người dùng:", error));
  }, []);

  return (
    <div className="max-w-4xl p-6 mx-auto mt-6 bg-white rounded-lg shadow-lg">
      <h2 className="mb-4 text-2xl font-bold text-gray-700">
        Quản Lý Người Dùng
      </h2>
      <p className="mb-4 text-gray-600">
        Chào mừng, <span className="font-semibold text-blue-600">{user?.username}</span>! Đây là khu vực dành cho bạn.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full bg-gray-100 border-collapse rounded-lg shadow-md">
          <thead>
            <tr className="text-white bg-blue-500">
              <th className="p-3 text-left">ID</th>
              <th className="p-3 text-left">Tên</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Vai trò</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map((u) => (
                <tr key={u.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="p-3">{u.id}</td>
                  <td className="p-3">{u.username}</td>
                  <td className="p-3">{u.email}</td>
                  <td className="p-3">{u.role}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="p-3 text-center text-gray-500">
                  Không có dữ liệu người dùng
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserRoute;
