import { useEffect, useState } from "react";
import { paginateData } from "../../utils/helpers";

import axios from "axios";
import { useAuth } from "../../context/AuthProvider";

const AdminRoute = ({ setSelectedRecord }) => {
  // eslint-disable-next-line
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const { currentItems, totalPages } = paginateData(users, currentPage);

  const goToPage = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };
  
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/user", { withCredentials: true })
      .then((response) => setUsers(response.data))
      .catch((error) => console.error("Lỗi khi tải danh sách người dùng:", error));
  }, []);

  return (
    <div className="flex flex-col">
      <div className={`bg-white p-4 border-b flex justify-between items-center`}>
        <h2 className="text-xl font-semibold">
          Quản Lý Người Dùng
        </h2>
      </div>
        <div className="max-h-full pt-2 overflow-x-auto overflow-y-auto">
          <table className="w-full border min-w-[600px]">
            <thead>
              <tr className=" bg-gray-200 ">
                <th className="p-3 text-center border-b">ID</th>
                <th className="p-3 text-center border-b">Tên</th>
                <th className="p-3 text-center border-b">Email</th>
                <th className="p-3 text-center border-b">Vai trò</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? (
                currentItems.map((record, index) => (
                  <tr key={record.id} className="border-y text-center border-gray-200 hover:bg-gray-50">
                    <td className="p-3 border">{record.id}</td>
                    <td className="p-3 border">{record.username}</td>
                    <td className="p-3 border">{record.email}</td>
                    <td className="p-3 border">{record.role}</td>
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
          {/* Phân trang */}
          {totalPages > 1 && (
            <div className="flex justify-center my-4 space-x-2">
              {/* Nút "Trước" - Ẩn khi ở trang đầu tiên */}
              {currentPage > 1 && (
                <button className="px-4 py-2 bg-gray-200 border rounded hover:bg-gray-300"
                  onClick={() => goToPage(currentPage - 1)}>← Trước</button>
              )}

              {/* Hiển thị số trang */}
              {[...Array(totalPages)].map((_, i) => (
                <button key={i} className={`px-4 py-2 border rounded 
                              ${currentPage === i + 1 ? "bg-blue-500 text-white" : "bg-gray-200 hover:bg-gray-300"}`}
                  onClick={() => goToPage(i + 1)}>{i + 1}</button>
              ))}

              {/* Nút "Sau" - Ẩn khi ở trang cuối */}
              {currentPage < totalPages && (
                <button className="px-4 py-2 bg-gray-200 border rounded hover:bg-gray-300"
                  onClick={() => goToPage(currentPage + 1)}>Sau →</button>
              )}
            </div>
          )}
        </div>
    </div>  
  );
};

export default AdminRoute;
