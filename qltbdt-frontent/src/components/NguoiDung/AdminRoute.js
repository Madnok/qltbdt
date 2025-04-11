import React, { useState, useEffect, useCallback } from 'react';
import { getUsersPaginated, deleteUser, updateUserStatus } from '../../api';
import FormTaoTaiKhoan from '../forms/FormTaoTaiKhoan';
import Pagination from '../layout/Pagination';
import {
  UserPlusIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  PencilSquareIcon,
  TrashIcon,
  PowerIcon,
  UserIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

// --- Component Avatar được cập nhật ---
const Avatar = ({ src, alt, size = 'h-10 w-10' }) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false); // Reset lỗi khi src thay đổi
  }, [src]);

  const handleError = () => {
    setImgError(true);
  };

  if (!src || imgError) { // Nếu không có src hoặc ảnh bị lỗi
    return (
      <div className={`flex items-center justify-center ${size} rounded-full bg-gray-200 text-gray-500 border border-gray-300`}>
        <UserIcon className="w-6 h-6" /> {/* Hiển thị UserIcon */}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt || 'Avatar'}
      className={`${size} rounded-full object-cover border border-gray-200`}
      onError={handleError} // Gọi handleError nếu ảnh không load được
    />
  );
};

// --- Component Popup Nội bộ ---
const LocalPopup = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    // Overlay
    <div
      className="fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ease-in-out bg-black bg-opacity-50"
      onClick={onClose} // Click ngoài để đóng
    >
      {/* Content */}
      <div
        className="w-full max-w-lg mx-4 my-8 overflow-hidden transition-all duration-300 ease-in-out transform scale-100 bg-white rounded-lg shadow-xl opacity-100"
        onClick={(e) => e.stopPropagation()} // Ngăn click vào content đóng popup
        style={{ maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 rounded-full hover:text-gray-600 hover:bg-gray-100"
            aria-label="Đóng"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        {/* Body */}
        <div className="p-4 overflow-y-auto md:p-6" style={{ maxHeight: 'calc(90vh - 110px)' }}>
          {children}
        </div>
      </div>
    </div>
  );
};
// --- Kết thúc Popup Nội bộ ---


function AdminRoute() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [togglingStatus, setTogglingStatus] = useState({});
  const [editingUser, setEditingUser] = useState(null); // State lưu user đang sửa (null nếu tạo mới)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLocalPopup, setShowLocalPopup] = useState(false);

  const fetchUsers = useCallback(async (page = 1, search = searchTerm) => {
    setLoading(true);
    setError(null);
    try {
      // Gọi hàm API mới lấy dữ liệu phân trang
      const response = await getUsersPaginated(page, 10, search); // <<< Gọi hàm mới

      // Xử lý cấu trúc trả về chuẩn từ backend
      if (response && response.data && response.data.data && Array.isArray(response.data.data.users)) {
        setUsers(response.data.data.users); // <<< Lấy users từ response.data.data.users
        setTotalPages(response.data.data.totalPages || 1); // <<< Lấy totalPages
        setCurrentPage(response.data.data.currentPage || 1); // <<< Lấy currentPage
      } else {
        console.error("Cấu trúc dữ liệu API phân trang không đúng:", response);
        throw new Error("Dữ liệu người dùng trả về không hợp lệ.");
      }
    } catch (err) {
      console.error("Lỗi fetch users:", err);
      const message = err.response?.data?.message || err.message || "Không thể tải danh sách người dùng."; // Lấy lỗi chi tiết hơn
      setError(message);
      setUsers([]);
      setTotalPages(1);
      setCurrentPage(1);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchUsers(currentPage);
  }, [currentPage, fetchUsers]);

  // --- Các hàm xử lý sự kiện ---
  const handleSearchChange = (event) => setSearchTerm(event.target.value);
  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setCurrentPage(1);
    fetchUsers(1);
  };
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  // --- Logic Mở Form ---
  const handleOpenCreatePopup = () => {
    setEditingUser(null);
    setShowLocalPopup(true);
  };

  const handleOpenEditPopup = (user) => {
    setEditingUser(user);
    setShowLocalPopup(true);
  };

  // --- Logic Đóng Form ---
  const handleClosePopup = (shouldRefresh = false) => {
    const wasEditing = !!editingUser;
    setShowLocalPopup(false);
    setEditingUser(null);
    setIsSubmitting(false);
    if (shouldRefresh) {
      fetchUsers(currentPage);
      toast.success(wasEditing ? "Cập nhật thành công!" : "Tạo thành công!");
    }
  };
  // --- Logic Xóa User ---
  const handleDeleteUser = async (userId, username) => {
    if (userId === 1) {
      toast.error("Không thể xóa tài khoản Quản trị viên gốc!");
      return;
    }
    if (window.confirm(`Bạn có chắc chắn muốn xóa người dùng "${username}" (ID: ${userId})?`)) {
      try {
        await deleteUser(userId); // Gọi API deleteUser
        toast.success(`Xóa người dùng "${username}" thành công!`);
        if (users.filter(u => u.id !== 1).length === 1 && currentPage > 1) { // Kiểm tra sau khi đã filter ID 1
          setCurrentPage(currentPage - 1);
        } else {
          fetchUsers(currentPage);
        }
      } catch (err) {
        console.error("Lỗi xóa user:", err);
        const message = err.response?.data?.message || "Không thể xóa người dùng.";
        toast.error(`Lỗi: ${message}`);
        setError(message);
      }
    }
  };

  const handleToggleStatus = async (userToToggle) => {
    const { id, tinhTrang: currentStatus, username } = userToToggle;

    // Không cho thay đổi trạng thái admin ID 1
    if (id === 1) {
      toast.error("Không thể thay đổi trạng thái của Quản trị viên gốc!");
      return;
    }

    const newStatus = currentStatus === 'on' ? 'off' : 'on'; // Đảo ngược trạng thái

    // Bắt đầu loading cho user này
    setTogglingStatus(prev => ({ ...prev, [id]: true }));

    // 1. Cập nhật giao diện trước (Optimistic Update)
    setUsers(currentUsers =>
      currentUsers.map(user =>
        user.id === id ? { ...user, tinhTrang: newStatus } : user
      )
    );

    try {
      await updateUserStatus(id, newStatus);
      toast.success(`Đã ${newStatus === 'on' ? 'mở khóa' : 'khóa'} tài khoản "${username}"`);
    } catch (err) {
      console.error("Lỗi cập nhật trạng thái:", err);
      toast.error(`Lỗi khi ${newStatus === 'on' ? 'mở khóa' : 'khóa'} tài khoản "${username}". Vui lòng thử lại.`);
      setUsers(currentUsers =>
        currentUsers.map(user =>
          user.id === id ? { ...user, tinhTrang: currentStatus } : user
        )
      );
      setError(`Lỗi cập nhật trạng thái cho ${username}.`);
    } finally {
      setTogglingStatus(prev => ({ ...prev, [id]: false }));
    }
  };

  // Lọc danh sách users để hiển thị (loại bỏ ID 1)
  const displayedUsers = users.filter(user => user.id !== 1);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex items-center justify-between p-4 bg-white border">
        <h2 className="text-2xl font-bold text-gray-800">Quản lý Người Dùng</h2>
      </div>

      {/* Thanh công cụ: Tìm kiếm và Nút Tạo */}
      <div className="flex flex-col gap-4 p-4 my-6 bg-white rounded-lg shadow-sm md:flex-row md:items-center md:justify-between">
        {/* Form tìm kiếm */}
        <form onSubmit={handleSearchSubmit} className="flex items-center flex-grow overflow-hidden border rounded-md">
          <input type="text" placeholder="Tìm kiếm..." value={searchTerm} onChange={handleSearchChange} className="flex-grow p-2 border-none focus:ring-0" />
          <button type="submit" className="p-2 text-white transition duration-200 bg-blue-500 hover:bg-blue-600" aria-label="Tìm kiếm">
            <MagnifyingGlassIcon className="w-5 h-5" />
          </button>
          <button type="button" onClick={() => fetchUsers(currentPage)} className="p-2 ml-1 text-gray-600 transition duration-200 bg-gray-200 hover:bg-gray-300" aria-label="Tải lại" disabled={loading}>
            <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </form>
        {/* Nút Tạo Tài Khoản */}
        <button
          onClick={handleOpenCreatePopup}
          className="flex items-center justify-center flex-shrink-0 px-4 py-2 font-semibold text-white transition duration-200 ease-in-out bg-green-500 rounded-md shadow hover:bg-green-600 hover:shadow-md"
        >
          <UserPlusIcon className="w-5 h-5 mr-2" />
          Tạo tài khoản
        </button>
      </div>

      {/* Hiển thị lỗi */}
      {error && <div className="p-4 mb-4 text-red-700 bg-red-100 border border-red-300 rounded-md">{error}</div>}

      {/* Bảng hiển thị người dùng */}
      {loading ? (
        /* Loading indicator */
        <div className="py-10 text-center">...Loading...</div>
      ) : displayedUsers.length > 0 ? ( // Sử dụng displayedUsers đã lọc
        <div className="p-4 overflow-x-auto bg-white shadow">
          <table className="min-w-full border divide-y divide-gray-200 rounded-lg">
            <thead className="bg-gray-100">
              <tr>
                {/* Headers */}
                <th scope="col" className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">#</th>
                <th scope="col" className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Ảnh</th>
                <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Username</th>
                <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Họ và Tên</th>
                <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Ngày sinh</th>
                <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Giới tính</th>
                <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Vai trò</th>
                <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">Tình trạng</th>                <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">Hành động</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Duyệt qua displayedUsers đã lọc */}
              {displayedUsers.map((user, index) => (
                <tr key={user.id} className="transition duration-150 ease-in-out hover:bg-gray-50">
                  {/* STT */}
                  <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">
                    {(currentPage - 1) * 10 + index + 1}
                  </td>
                  {/* Ảnh (dùng component Avatar đã sửa) */}
                  <td className="px-4 py-2 whitespace-nowrap">
                    <Avatar src={user.hinhAnh} alt={user.hoTen || user.username} />
                  </td>
                  {/* Username */}
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">{user.username}</td>
                  {/* Họ Tên */}
                  <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">{user.hoTen || <span className='italic text-gray-400'>Chưa cập nhật</span>}</td>
                  {/* Email */}
                  <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">{user.email || <span className='italic text-gray-400'>Chưa cập nhật</span>}</td>
                  {/* Ngày sinh */}
                  <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                    {user.ngaySinh ? format(new Date(user.ngaySinh), 'dd/MM/yyyy') : 'N/A'} {/* <<< FORMAT NGÀY */}
                  </td>
                  {/* Giới tính */}
                  <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">{user.gioiTinh || 'N/A'}</td>
                  {/* Vai trò */}
                  <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      /* Styling */
                      user.role === 'admin' ? 'bg-red-100 text-red-800' :
                        user.role === 'nhanvien' ? 'bg-blue-100 text-blue-800' :
                          user.role === 'nguoidung' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                      }`}>
                      {/* Text */}
                      {user.role === 'admin' ? 'Quản trị viên' : user.role === 'nhanvien' ? 'Nhân viên' : user.role === 'nguoidung' ? 'Người dùng' : user.role}
                    </span>
                  </td>
                  {/* Tình trạng */}
                  <td className="px-6 py-4 text-sm text-center whitespace-nowrap">
                    <button
                      onClick={() => handleToggleStatus(user)}
                      disabled={togglingStatus[user.id] || user.id === 1} // Disable khi đang xử lý hoặc là user ID 1
                      className={`p-1 rounded-full transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed
                                                ${user.tinhTrang === 'on'
                          ? 'bg-green-100 text-green-700 hover:bg-green-200 focus:ring-green-500'
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300 focus:ring-gray-400'
                        }
                                                ${togglingStatus[user.id] ? 'animate-pulse' : ''} // Thêm hiệu ứng pulse khi loading
                                            `}
                      title={user.tinhTrang === 'on' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                    >
                      {togglingStatus[user.id] ? (
                        <ArrowPathIcon className="w-5 h-5 animate-spin" />
                      ) : (
                        <PowerIcon className="w-5 h-5" />
                      )}
                    </button>
                    <span className={`ml-2 text-xs font-semibold ${user.tinhTrang === 'on' ? 'text-green-800' : 'text-gray-700'}`}>
                      {user.tinhTrang === 'on' ? 'Hoạt động' : 'Đã khóa'}
                    </span>
                  </td>
                  {/* Hành động */}
                  <td className="px-6 py-4 text-sm font-medium text-center whitespace-nowrap">
                    {/* Nút Sửa */}
                    <button
                      onClick={() => handleOpenEditPopup(user)}
                      className="p-1 mr-3 text-indigo-600 transition duration-150 ease-in-out rounded hover:text-indigo-900 hover:bg-indigo-100"
                      aria-label="Chỉnh sửa" title="Chỉnh sửa"
                    >
                      <PencilSquareIcon className="w-5 h-5" />
                    </button>
                    {/* Nút Xóa -> Gọi handleDeleteUser */}
                    <button
                      onClick={() => handleDeleteUser(user.id, user.username)} // <<< Đảm bảo gọi đúng hàm này
                      className="p-1 text-red-600 transition duration-150 ease-in-out rounded hover:text-red-900 hover:bg-red-100"
                      aria-label="Xóa" title="Xóa"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        !loading && <p className="py-10 text-center text-gray-500 bg-white rounded-lg shadow">Không tìm thấy người dùng nào phù hợp.</p>
      )}

      {/* Phân trang */}
      {!loading && displayedUsers.length > 0 && totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
        </div>
      )}

      <LocalPopup
        isOpen={showLocalPopup}
        title={editingUser ? `Chỉnh sửa: ${editingUser.username}` : 'Tạo Tài khoản mới'}
        onClose={() => handleClosePopup(false)}
      >
        <FormTaoTaiKhoan
          userToEdit={editingUser}
          onClose={handleClosePopup}
          isSubmitting={isSubmitting}
          setIsSubmitting={setIsSubmitting}
          key={editingUser ? `edit-${editingUser.id}` : 'create'}
        />
      </LocalPopup>
    </div>
  );
}

export default AdminRoute;