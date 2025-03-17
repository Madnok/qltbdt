import { useEffect, useState } from "react";
import { paginateData } from "../../utils/helpers";
import { Dialog } from "@headlessui/react";
import { getTinhTrangLabel } from "../../utils/constants";

import axios from "axios";
import { FaEdit, FaTrash, FaPlus, FaToggleOn, FaToggleOff, FaSave, FaTimes } from "react-icons/fa";

const AdminRoute = ({ setSelectedRecord }) => {
  const [users, setUsers] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    email: "",
    hoTen: "",
    sDT: "",
    tinhTrang: "",
    role: "nguoidung"
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [editingUserId, setEditingUserId] = useState(null);
  const [editedData, setEditedData] = useState({});
  const { currentItems, totalPages } = paginateData(users.filter(user => user.id !== 1), currentPage);

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
  }, [refresh]);

  const handleCreateUser = () => {
    if (!newUser.username || !newUser.password || !newUser.hoTen || !newUser.email) {
      alert("Vui lòng nhập đầy đủ thông tin bắt buộc: Họ tên, Tài khoản, Mật khẩu, Email.");
      return;
    }

    axios.post("http://localhost:5000/api/user", newUser, { withCredentials: true })
      .then((response) => {
        setUsers([...users, { ...newUser, id: response.data.userId }]);
        setIsOpen(false);
        setNewUser({
          username: "",
          password: "",
          email: "",
          hoTen: "",
          sDT: "",
          ngaySinh: "",
          gioiTinh: "",
          role: "nguoidung",
          tinhTrang: newUser.tinhTrang || "on",
        });
        setRefresh(!refresh);
      })
      .catch((error) => {
        if (error.response && error.response.status === 400 && error.response.data.message === "Tên đăng nhập đã tồn tại!") {
          alert("Tên tài khoản đã tồn tại! Vui lòng chọn tên khác.");
        } else {
          console.error("Lỗi khi tạo tài khoản:", error);
        }
      });
  };

  const handleEditClick = (record) => {
    setEditingUserId(record.id);
    setEditedData({ ...record });
  };

  const handleDelete = (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa người dùng này?")) {
      axios.delete(`http://localhost:5000/api/user/${id}`, { withCredentials: true })
        .then(() => {
          setUsers(users.filter(user => user.id !== id));
          setRefresh(!refresh);
        })
        .catch(error => console.error("Lỗi khi xóa người dùng:", error));
    }
  };

  const handleToggleStatus = (id) => {
    axios.put(`http://localhost:5000/api/user/status/${id}`, {}, { withCredentials: true })
      .then((response) => {
        setUsers(users.map(user =>
          user.id === id ? { ...user, tinhTrang: response.data.newStatus } : user
        ));
      })
      .catch(error => console.error("Lỗi khi cập nhật tình trạng:", error));
  };


  const handleUpdateUser = async () => {
    try {
      await axios.put(`http://localhost:5000/api/user/${editingUserId}`, editedData, { withCredentials: true });
      setUsers(users.map(user => user.id === editingUserId ? { ...user, ...editedData } : user));
      handleCancelEdit();
      setRefresh(!refresh);
    } catch (error) {
      console.error("Lỗi khi cập nhật người dùng:", error);
    }
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditedData({});
  };

  const handleChange = (e, field) => {
    let value = e.target.value;

    if (field === "ngaySinh") {
      value = value.split("T")[0];
    }

    setEditedData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };


  return (
    <div className="flex flex-col">
      <div className="bg-white p-4 border-b flex justify-between items-center">
        <h2 className="text-xl font-semibold">Quản Lý Người Dùng</h2>
      </div>
      <div className="max-h-full pt-2 overflow-x-auto overflow-y-auto">
        <table className="w-full border min-w-[600px]">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-3 text-center border-b">ID</th>
              <th className="p-3 text-center border-b">Tài Khoản</th>
              <th className="p-3 text-center border-b">Họ Tên</th>
              <th className="p-3 text-center border-b">Ngày Sinh</th>
              <th className="p-3 text-center border-b">Email</th> 
              <th className="p-3 text-center border-b">Vai trò</th>
              <th className="p-3 text-center border-b">Giới Tính</th>
              <th className="p-3 text-center border-b">Tình Trạng</th>
              <th className="p-3 text-center border-b">Chức Năng</th>
            </tr>
          </thead>
          <tbody>
            {/* Hiển thị admin riêng biệt */}
            {users.some(user => user.id === 1) && (
              <tr key="admin" className="border-y text-center bg-gray-100 ">
                <td className="p-3 border font-bold cursor-not-allowed">{users.find(user => user.id === 1)?.id}</td>
                <td className="p-3 border font-bold cursor-not-allowed">{users.find(user => user.id === 1)?.username}</td>
                <td className="p-3 border text-gray-400 cursor-not-allowed">-</td>
                <td className="p-3 border text-gray-400 cursor-not-allowed">-</td>
                <td className="p-3 border text-gray-400 cursor-not-allowed">-</td>
                <td className="p-3 border text-black font-bold cursor-not-allowed">{getTinhTrangLabel(users.find(user => user.id === 1)?.role)}</td>
                <td className="p-3 border text-gray-400 cursor-not-allowed">-</td>
                <td className="p-3 border text-gray-400 cursor-not-allowed">-</td>
                <td className="p-3 border text-gray-400 ">
                  <button className="p-2 text-green-500 hover:text-green-700"
                    title="Thêm mới"
                    onClick={() => setIsOpen(true)}>

                    <FaPlus />
                  </button>
                </td>
              </tr>
            )}

            {/* Hiển thị danh sách người dùng bình thường */}
            {users.length > 1 ? (
              currentItems.map((record) => (
                <tr key={record.id} className="border-y text-center border-gray-200 hover:bg-gray-50">
                  <td className="p-3 border">{record.id}</td>
                  <td className="p-3 border">{record.username}</td>

                  {/* Nếu đang chỉnh sửa thì hiển thị input */}
                  <td className="p-3 border">
                    {editingUserId === record.id ? (
                      <input
                        type="text"
                        className="border rounded p-1 w-full"
                        value={editedData.hoTen}
                        onChange={(e) => handleChange(e, "hoTen")}
                      />
                    ) : (
                      record.hoTen
                    )}
                  </td>

                  <td className="p-3 border">
                    {editingUserId === record.id ? (
                      <input
                        type="date" // Để hiển thị đúng định dạng ngày trong input
                        className="border rounded p-1 w-full"
                        value={editedData.ngaySinh}
                        onChange={(e) => handleChange(e, "ngaySinh")}
                      />
                    ) : (
                      record.ngaySinh ? record.ngaySinh.split("T")[0] : "" // Chỉ hiển thị phần ngày
                    )}
                  </td>

                  <td className="p-3 border">
                    {editingUserId === record.id ? (
                      <input
                        type="email"
                        className="border rounded p-1 w-full"
                        value={editedData.email}
                        onChange={(e) => handleChange(e, "email")}
                      />
                    ) : (
                      record.email
                    )}
                  </td>

                  <td className="p-3 border">
                    {editingUserId === record.id ? (
                      <select
                        className="border rounded p-1 w-full"
                        value={editedData.role}
                        onChange={(e) => handleChange(e, "role")}
                      >
                        {["admin", "nguoidung", "nhanvien"]
                          .filter((r) => r !== record.role) // Chỉ hiển thị các role khác với role hiện tại
                          .map((r) => (
                            <option key={r} value={r}>
                              {getTinhTrangLabel(r)}
                            </option>
                          ))}
                      </select>
                    ) : (
                      getTinhTrangLabel(record.role)
                    )}
                  </td>

                  <td className="p-3 border">
                    {editingUserId === record.id ? (
                      <select
                        className="border rounded p-1 w-full"
                        value={editedData.gioiTinh}
                        onChange={(e) => handleChange(e, "gioiTinh")}
                      >
                        {["Nam", "Nữ", "Khác"]
                          .filter((g) => g !== record.gioiTinh)
                          .map((g) => (
                            <option key={g} value={g}>
                              {g}
                            </option>
                          ))}
                      </select>
                    ) : (
                      record.gioiTinh
                    )}
                  </td>

                  <td className="p-2 border">
                    <button onClick={() => handleToggleStatus(record.id)} className="text-xl">
                      {record.tinhTrang === "on" ? (
                        <FaToggleOn className="text-green-500" />
                      ) : (
                        <FaToggleOff className="text-red-500" />
                      )}
                    </button>
                  </td>

                  <td className="p-3 border">
                    <div className="flex justify-center space-x-2">
                      {editingUserId === record.id ? (
                        <>
                          <button
                            className="p-2 text-green-500 hover:text-green-700"
                            onClick={handleUpdateUser}
                            title="Lưu"
                          >
                            <FaSave />
                          </button>
                          <button
                            className="p-2 text-red-500 hover:text-red-700"
                            onClick={handleCancelEdit}
                            title="Hủy"
                          >
                            <FaTimes />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="p-2 text-blue-500 hover:text-blue-700"
                            onClick={() => handleEditClick(record)}
                            title="Chỉnh sửa"
                          >
                            <FaEdit />
                          </button>
                          <button
                            className="p-2 text-red-500 hover:text-red-700"
                            onClick={() => handleDelete(record.id)}
                            title="Xóa"
                          >
                            <FaTrash />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="p-3 text-center text-gray-500">
                  Không có dữ liệu người dùng
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {/* Popover Form */}
        <Dialog open={isOpen} onClose={() => setIsOpen(false)} className="relative z-50">
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded-lg w-96 shadow-lg">
              <Dialog.Title className="text-lg font-semibold text-center mb-4">Tạo Tài Khoản Mới</Dialog.Title>
              <div className="grid grid-cols-1 gap-3">
                <input type="text" placeholder="Tên tài khoản *" className="border p-2 rounded"
                  value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} />
                <input type="password" placeholder="Mật khẩu *" className="border p-2 rounded"
                  value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
                <input type="text" placeholder="Họ tên *" className="border p-2 rounded"
                  value={newUser.hoTen} onChange={(e) => setNewUser({ ...newUser, hoTen: e.target.value })} />
                <input type="email" placeholder="Email" className="border p-2 rounded"
                  value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
                <input type="text" placeholder="Số điện thoại" className="border p-2 rounded"
                  value={newUser.sDT} onChange={(e) => setNewUser({ ...newUser, sDT: e.target.value })} />

                <select className="border p-2 rounded" value={newUser.gioiTinh}
                  onChange={(e) => setNewUser({ ...newUser, gioiTinh: e.target.value })}
                  >
                    <option value="Khác">Khác</option>
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                </select>

                <select className="border p-2 rounded" value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}>
                  {["nhanvien", "nguoidung", "admin"].map((r) => (
                    <option key={r} value={r}>{getTinhTrangLabel(r)}</option>
                  ))}
                </select>

                <select
                  className="border p-2 rounded" value={newUser.tinhTrang}
                  onChange={(e) => setNewUser({ ...newUser, tinhTrang: e.target.value })}
                >
                  <option value="on">Hoạt động</option>
                  <option value="off">Ngừng hoạt động</option>
                </select>

              </div>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <button className="bg-green-500 text-white p-2 rounded" onClick={handleCreateUser}>Tạo tài khoản</button>
                <button className="bg-red-500 text-white p-2 rounded" onClick={() => setIsOpen(false)}>Hủy Bỏ</button>
              </div>
            </div>
          </div>
        </Dialog>
        {/* Phân trang */}
        {totalPages > 1 && (
          <div className="flex justify-center my-4 space-x-2">
            {currentPage > 1 && (
              <button className="px-4 py-2 bg-gray-200 border rounded hover:bg-gray-300"
                onClick={() => goToPage(currentPage - 1)}>← Trước</button>
            )}
            {[...Array(totalPages)].map((_, i) => (
              <button key={i} className={`px-4 py-2 border rounded 
                            ${currentPage === i + 1 ? "bg-blue-500 text-white" : "bg-gray-200 hover:bg-gray-300"}`}
                onClick={() => goToPage(i + 1)}>{i + 1}</button>
            ))}
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



