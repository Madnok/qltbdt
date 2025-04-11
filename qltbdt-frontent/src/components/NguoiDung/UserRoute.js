
import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../context/AuthProvider';
import { getUserFromApi, updateUser, uploadAvatar, updatePassword } from '../../api';
import { toast } from 'react-toastify';
import { getTinhTrangLabel } from '../../utils/constants'
import { formatDate } from '../../utils/helpers'
import { UserIcon, PencilIcon, CameraIcon, LockClosedIcon, ArrowPathIcon, XMarkIcon } from '@heroicons/react/24/outline';

// --- Component Popup Nội bộ (Tương tự như trong AdminRoute) ---
const LocalPopup = ({ isOpen, onClose, title, children, size = 'max-w-lg' }) => { // Thêm size prop
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div className={`bg-white rounded-lg shadow-xl w-full ${size} mx-4 my-8 transform transition-all duration-300 ease-in-out scale-100 opacity-100 overflow-hidden`} onClick={(e) => e.stopPropagation()} style={{ maxHeight: '90vh' }}>
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="p-1 text-gray-400 rounded-full hover:text-gray-600 hover:bg-gray-100"><XMarkIcon className="w-6 h-6" /></button>
        </div>
        <div className="p-4 overflow-y-auto md:p-6" style={{ maxHeight: 'calc(90vh - 65px)' }}>{children}</div>
      </div>
    </div>
  );
};

// --- Component Form Chỉnh sửa Thông tin ---
const EditProfileForm = ({ initialData, onClose, onUpdateSuccess }) => {
  const [formData, setFormData] = useState({
    hoTen: '',
    email: '',
    ngaySinh: '',
    gioiTinh: 'Nam',
    sDT: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({}); // Thêm state lỗi

  useEffect(() => {
    if (initialData) {
      setFormData({
        hoTen: initialData.hoTen || '',
        email: initialData.email || '', // Có thể không cho sửa email
        ngaySinh: initialData.ngaySinh ? new Date(initialData.ngaySinh).toISOString().split('T')[0] : '',
        gioiTinh: initialData.gioiTinh || 'Nam',
        sDT: initialData.sDT || '',
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors(prev => ({ ...prev, [e.target.name]: null })); // Xóa lỗi khi nhập
  };

  // Hàm validate đơn giản
  const validate = () => {
    const newErrors = {};
    if (!formData.hoTen.trim()) newErrors.hoTen = "Họ tên không được để trống";
    // Email thường không cho sửa, nếu cho sửa thì cần validate
    // if (!formData.email.trim()) newErrors.email = "Email không được để trống";
    // else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Email không hợp lệ";
    // Thêm validate khác nếu cần (SĐT, Ngày sinh)
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return; // Validate trước khi submit

    setIsSubmitting(true);
    try {
      const updatedUserData = await updateUser(initialData.id, formData); // Gọi API updateUser
      toast.success('Cập nhật thông tin thành công!');
      onUpdateSuccess(updatedUserData.user); // Gọi callback để cập nhật state ở cha
      onClose(); // Đóng popup
    } catch (error) {
      // Lỗi đã được hiển thị bởi interceptor trong api.js
      console.error("Lỗi cập nhật:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Trường Họ tên */}
      <div>
        <label htmlFor="hoTen" className="block mb-1 text-sm font-medium text-gray-700">Họ và Tên <span className="text-red-500">*</span></label>
        <input type="text" name="hoTen" id="hoTen" value={formData.hoTen} onChange={handleChange} required className={`w-full px-3 py-2 border ${errors.hoTen ? 'border-red-500' : 'border-gray-300'} rounded-md ...`} />
        {errors.hoTen && <p className="mt-1 text-xs text-red-500">{errors.hoTen}</p>}
      </div>
      {/* Trường Email (có thể để readonly) */}
      <div>
        <label htmlFor="email" className="block mb-1 text-sm font-medium text-gray-700">Email</label>
        <input type="email" name="email" id="email" value={formData.email} readOnly className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed ..." />
      </div>
      {/* Trường SĐT */}
      <div>
        <label htmlFor="sDT" className="block mb-1 text-sm font-medium text-gray-700">Số Điện Thoại</label>
        <input type="tel" name="sDT" id="sDT" value={formData.sDT} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md ..." />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Trường Ngày sinh */}
        <div>
          <label htmlFor="ngaySinh" className="block mb-1 text-sm font-medium text-gray-700">Ngày sinh</label>
          <input type="date" name="ngaySinh" id="ngaySinh" value={formData.ngaySinh} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md ..." />
        </div>
        {/* Trường Giới tính */}
        <div>
          <label htmlFor="gioiTinh" className="block mb-1 text-sm font-medium text-gray-700">Giới tính</label>
          <select name="gioiTinh" id="gioiTinh" value={formData.gioiTinh} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 bg-white rounded-md ...">
            <option value="Nam">Nam</option>
            <option value="Nữ">Nữ</option>
            <option value="Khác">Khác</option>
          </select>
        </div>
      </div>

      {/* Nút bấm */}
      <div className="flex justify-end pt-4 mt-6 space-x-3 border-t">
        <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 ...">Hủy</button>
        <button type="submit" disabled={isSubmitting} className="flex items-center px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">
          {isSubmitting && <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />}
          Lưu thay đổi
        </button>
      </div>
    </form>
  );
};

// --- Component Form Đổi Mật khẩu ---
const ChangePasswordForm = ({ onClose }) => {
  const [formData, setFormData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors(prev => ({ ...prev, [e.target.name]: null }));
    if (e.target.name === 'newPassword' && errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: null }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.currentPassword) newErrors.currentPassword = "Vui lòng nhập mật khẩu hiện tại";
    if (!formData.newPassword) newErrors.newPassword = "Vui lòng nhập mật khẩu mới";
    else if (formData.newPassword.length < 6) newErrors.newPassword = "Mật khẩu mới phải ít nhất 6 ký tự";
    if (!formData.confirmPassword) newErrors.confirmPassword = "Vui lòng xác nhận mật khẩu mới";
    else if (formData.newPassword && formData.confirmPassword !== formData.newPassword) newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await updatePassword(formData); // Gọi API đổi mật khẩu
      toast.success('Đổi mật khẩu thành công!');
      onClose(); // Đóng popup
    } catch (error) {
      // Lỗi đã được xử lý bởi interceptor
      console.error("Lỗi đổi mật khẩu:", error);
      // Có thể set lỗi cụ thể nếu backend trả về lỗi validate field
      if (error.response?.status === 401) { // Sai mật khẩu hiện tại
        setErrors(prev => ({ ...prev, currentPassword: error.response.data.message }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="currentPassword" className="block mb-1 text-sm font-medium text-gray-700">Mật khẩu hiện tại <span className="text-red-500">*</span></label>
        <input type="password" name="currentPassword" id="currentPassword" value={formData.currentPassword} onChange={handleChange} required className={`w-full px-3 py-2 border ${errors.currentPassword ? 'border-red-500' : 'border-gray-300'} rounded-md ...`} />
        {errors.currentPassword && <p className="mt-1 text-xs text-red-500">{errors.currentPassword}</p>}
      </div>
      <div>
        <label htmlFor="newPassword" className="block mb-1 text-sm font-medium text-gray-700">Mật khẩu mới <span className="text-red-500">*</span></label>
        <input type="password" name="newPassword" id="newPassword" value={formData.newPassword} onChange={handleChange} required className={`w-full px-3 py-2 border ${errors.newPassword ? 'border-red-500' : 'border-gray-300'} rounded-md ...`} />
        {errors.newPassword && <p className="mt-1 text-xs text-red-500">{errors.newPassword}</p>}
      </div>
      <div>
        <label htmlFor="confirmPassword" className="block mb-1 text-sm font-medium text-gray-700">Xác nhận mật khẩu mới <span className="text-red-500">*</span></label>
        <input type="password" name="confirmPassword" id="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required className={`w-full px-3 py-2 border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'} rounded-md ...`} />
        {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>}
      </div>
      {/* Nút bấm */}
      <div className="flex justify-end pt-4 mt-6 space-x-3 border-t">
        <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 ...">Hủy</button>
        <button type="submit" disabled={isSubmitting} className="flex items-center px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50">
          {isSubmitting && <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />}
          Đổi mật khẩu
        </button>
      </div>
    </form>
  );
};


// --- Component UserRoute chính ---
function UserRoute() {
  const { user: authUser, refreshUser } = useAuth(); // Lấy user từ context
  const [userData, setUserData] = useState(null); // State lưu trữ data user đầy đủ từ API
  const [isLoading, setIsLoading] = useState(true);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [showPasswordPopup, setShowPasswordPopup] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null); // File ảnh đã chọn
  const [avatarPreview, setAvatarPreview] = useState(null); // URL xem trước ảnh
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null); // Ref cho input file ẩn

  // Fetch data user khi component mount hoặc authUser thay đổi
  useEffect(() => {
    const fetchUserData = async () => {
      if (authUser?.id) { // Chỉ fetch nếu có user id từ context
        setIsLoading(true);
        try {
          // Dùng hàm mới gọi /auth/me hoặc /user/:id nếu cần
          const data = await getUserFromApi(); // Hoặc getUserById(authUser.id)
          if (data) {
            setUserData(data);
          } else {
            toast.error("Không thể lấy thông tin người dùng.");
          }
        } catch (error) {
          // Lỗi đã được xử lý bởi interceptor
          console.error("Lỗi fetch user data:", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false); // Không có user id, không load gì cả
        setUserData(null);
      }
    };
    fetchUserData();
  }, [authUser]); // Phụ thuộc vào authUser từ context

  // Xử lý chọn file ảnh
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Kiểm tra loại file (tùy chọn)
      if (!file.type.startsWith('image/')) {
        toast.error('Vui lòng chọn file ảnh hợp lệ.');
        return;
      }

      setAvatarFile(file);
      // Tạo URL xem trước
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Xử lý upload avatar
  const handleUploadAvatar = async () => {
    if (!avatarFile || !userData?.id) return;

    const formData = new FormData();
    formData.append('avatar', avatarFile); // Tên field phải khớp backend 'avatar'
    setIsUploadingAvatar(true);

    try {
      const result = await uploadAvatar(userData.id, formData);
      setUserData(prev => ({ ...prev, hinhAnh: result.avatar })); // Cập nhật avatar mới vào state
      setAvatarPreview(null); // Xóa preview
      setAvatarFile(null); // Xóa file đã chọn
      toast.success(result.message || 'Cập nhật ảnh đại diện thành công!');
      refreshUser(); // Làm mới user trong AuthContext nếu cần
    } catch (error) {
      // Lỗi đã được xử lý bởi interceptor
      console.error("Lỗi upload avatar:", error);
      setAvatarPreview(userData?.hinhAnh || null); // Trả về ảnh cũ nếu lỗi
      setAvatarFile(null);
    } finally {
      setIsUploadingAvatar(false);
      // Reset input file để có thể chọn lại cùng file
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Callback khi cập nhật thông tin thành công từ form
  // const handleUpdateSuccess = (updatedUser) => {
  //   setUserData(updatedUser); // Cập nhật state với dữ liệu mới nhất từ API
  //   refreshUser(); // Làm mới user trong AuthContext
  // };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen"><ArrowPathIcon className="w-8 h-8 text-blue-500 animate-spin" /></div>;
  }

  if (!userData) {
    return <div className="p-6 text-center text-red-500">Không thể tải thông tin người dùng.</div>;
  }

  const { username, role, hoTen, email, sDT, ngaySinh, gioiTinh, hinhAnh } = userData;

  return (
    <div className="min-h-screen bg-whit">
      <div className="flex items-center justify-between p-4 border-b ">
        <h1 className="text-2xl font-bold text-gray-800">Hồ sơ cá nhân</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-3">
        {/* --- Cột Avatar (Trái) --- */}
        <div className="lg:col-span-1">
          <div className="p-6 text-center bg-gray-200 rounded-lg shadow">
            <div className="relative inline-block mb-4">
              {/* Ảnh đại diện */}
              <div className="relative w-32 h-32 mx-auto">
                {avatarPreview || hinhAnh ? (
                  <img
                    src={avatarPreview || hinhAnh}
                    alt="Avatar"
                    className="object-cover w-full h-full border-4 border-gray-200 rounded-full shadow-sm"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "";
                    }}
                  />
                ) : (
                  <UserIcon className="w-full h-full border-4 border-gray-200 rounded-full shadow-sm" />
                )}
              </div>
              {/* Nút chọn ảnh */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 text-white bg-blue-500 border-2 border-white rounded-full shadow hover:bg-blue-600"
                title="Thay đổi ảnh đại diện"
              >
                <CameraIcon className="w-5 h-5" />
              </button>
              {/* Input file ẩn */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>

            {/* Nút Upload nếu có ảnh preview */}
            {avatarPreview && (
              <button
                onClick={handleUploadAvatar}
                disabled={isUploadingAvatar}
                className="flex items-center justify-center w-full px-4 py-2 mt-3 text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {isUploadingAvatar ? <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" /> : <></>}
                Tải ảnh lên
              </button>
            )}

            {/* Tên và Vai trò */}
            <div className="border-t border-white">
              <h2 className="mt-4 text-xl font-semibold">{hoTen || username}</h2>
              <p className="text-gray-500 capitalize">{getTinhTrangLabel(role)}</p>
            </div>
          </div>
        </div>

        {/* --- Cột Thông tin (Phải) --- */}
        <div className="space-y-4 lg:col-span-2">
          {/* Card Thông tin cá nhân & liên hệ */}
          <div className="p-6 bg-gray-200 rounded-lg shadow">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-white">
              <h3 className="text-lg font-semibold text-gray-700">Thông tin chi tiết</h3>
              <button onClick={() => setShowEditPopup(true)} className="flex items-center text-sm text-blue-600 hover:text-blue-800">
                <PencilIcon className="w-4 h-4 mr-1" /> Chỉnh sửa
              </button>
            </div>
            <dl className="grid grid-cols-1 text-sm md:grid-cols-2 gap-x-4 gap-y-4">
              <div className="col-span-1">
                <dt className="font-medium text-gray-500">Họ và tên</dt>
                <dd className="mt-1 text-gray-900">{hoTen || 'Chưa cập nhật'}</dd>
              </div>
              <div className="col-span-1">
                <dt className="font-medium text-gray-500">Tên đăng nhập</dt>
                <dd className="mt-1 text-gray-900">{username}</dd>
              </div>
              <div className="col-span-1">
                <dt className="font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-gray-900">{email || 'Chưa cập nhật'}</dd>
              </div>
              <div className="col-span-1">
                <dt className="font-medium text-gray-500">Số điện thoại</dt>
                <dd className="mt-1 text-gray-900">{sDT || 'Chưa cập nhật'}</dd>
              </div>
              <div className="col-span-1">
                <dt className="font-medium text-gray-500">Ngày sinh</dt>
                <dd className="mt-1 text-gray-900">{ngaySinh ? formatDate(new Date(ngaySinh), 'dd/MM/yyyy') : 'Chưa cập nhật'}</dd>
              </div>
              <div className="col-span-1">
                <dt className="font-medium text-gray-500">Giới tính</dt>
                <dd className="mt-1 text-gray-900">{gioiTinh || 'Chưa cập nhật'}</dd>
              </div>
            </dl>
          </div>

          {/* Card Bảo mật */}
          <div className="p-6 bg-gray-200 rounded-lg shadow">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-white">
              <h3 className="text-lg font-semibold text-gray-700">Bảo mật</h3>
            </div>
            <button
              onClick={() => setShowPasswordPopup(true)}
              className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm md:w-auto hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <LockClosedIcon className="w-5 h-5 mr-2 text-gray-500" />
              Đổi mật khẩu
            </button>
          </div>
        </div>
      </div>

      {/* Popup Chỉnh sửa Thông tin */}
      <LocalPopup
        isOpen={showEditPopup}
        onClose={() => setShowEditPopup(false)}
        title="Chỉnh sửa thông tin cá nhân"
      >
        <EditProfileForm
          initialData={userData}
          onClose={() => setShowEditPopup(false)}
          onUpdateSuccess={(updatedUser) => {
            // Cập nhật lại state userData sau khi thành công
            setUserData(updatedUser);
            // Có thể gọi refreshUser() từ AuthContext nếu cần thiết
            refreshUser();
          }}
        />
      </LocalPopup>

      {/* Popup Đổi mật khẩu */}
      <LocalPopup
        isOpen={showPasswordPopup}
        onClose={() => setShowPasswordPopup(false)}
        title="Đổi mật khẩu"
        size="max-w-md" // Kích thước nhỏ hơn cho form này
      >
        <ChangePasswordForm onClose={() => setShowPasswordPopup(false)} />
      </LocalPopup>

    </div>
  );
}

export default UserRoute;