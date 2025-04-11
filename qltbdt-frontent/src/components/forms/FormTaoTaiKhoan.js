import React, { useState, useEffect } from 'react';
import { createUser, updateUser } from '../../api';
// import { toast } from 'react-toastify';

// Nhận thêm props: userToEdit, isSubmitting, setIsSubmitting
function FormTaoTaiKhoan({ userToEdit, onClose, isSubmitting, setIsSubmitting }) {
    const [formData, setFormData] = useState({
        username: '',
        password: '', 
        confirmPassword: '',
        hoTen: '',
        email: '',
        role: 'nguoidung', 
        gioiTinh: 'Nam', 
        ngaySinh: '',
        sDT: '',
    });
    const [errors, setErrors] = useState({});

    const isEditing = !!userToEdit; // Xác định chế độ sửa hay tạo

    // useEffect để điền dữ liệu khi ở chế độ sửa
    useEffect(() => {
        if (isEditing) {
            setFormData({
                username: userToEdit.username || '',
                password: '', // Luôn để trống password khi sửa
                confirmPassword: '',
                hoTen: userToEdit.hoTen || '',
                email: userToEdit.email || '',
                role: userToEdit.role || 'nguoidung',
                gioiTinh: userToEdit.gioiTinh || 'Nam',
                ngaySinh: userToEdit.ngaySinh ? userToEdit.ngaySinh.split('T')[0] : '', // Định dạng YYYY-MM-DD
                sDT: userToEdit.sDT || '',
            });
        } else {
            // Reset form khi tạo mới (đảm bảo key prop ở AdminRoute.js)
             setFormData({
                username: '', password: '', confirmPassword: '', hoTen: '', email: '',
                role: 'nguoidung', gioiTinh: 'Nam', ngaySinh: '', sDT: '',
            });
        }
        setErrors({}); // Reset lỗi khi đổi user hoặc chế độ
    }, [userToEdit, isEditing]); // Chạy lại khi userToEdit thay đổi

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
         if (name === 'password' && errors.confirmPassword) {
            setErrors(prev => ({ ...prev, confirmPassword: null }));
        }
    };

    // --- Thêm hàm validate ---
    const validateForm = () => {
        const newErrors = {};
        if (!formData.username.trim() && !isEditing) newErrors.username = 'Username là bắt buộc.'; // Chỉ bắt buộc khi tạo
        if (!isEditing && !formData.password) newErrors.password = 'Mật khẩu là bắt buộc khi tạo mới.';
        if (formData.password && formData.password.length < 6) newErrors.password = 'Mật khẩu phải ít nhất 6 ký tự.';
        if (formData.password && formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp.';
        if (!formData.hoTen.trim()) newErrors.hoTen = 'Họ và tên là bắt buộc.';
        if (!formData.email.trim()) newErrors.email = 'Email là bắt buộc.';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email không hợp lệ.';
        // Thêm validate cho giới tính, vai trò nếu cần
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSubmitting(true);
        setErrors({});

        try {
            const dataToSend = {
                hoTen: formData.hoTen,
                email: formData.email,
                role: formData.role,
                gioiTinh: formData.gioiTinh,
                ngaySinh: formData.ngaySinh || null,
                sDT: formData.sDT || null,
            };

            if (isEditing) {
                 // Nếu có nhập password mới thì mới gửi
                if (formData.password) {
                     dataToSend.password = formData.password;
                 }
                 // Gọi API updateUser - chỉ gửi các trường cho phép update
                 await updateUser(userToEdit.id, dataToSend);

            } else {
                dataToSend.username = formData.username;
                dataToSend.password = formData.password;
                await createUser(dataToSend);
            }

            onClose(true); 

        } catch (error) {
            console.error("Lỗi lưu tài khoản:", error);
            const errorMessage = error.response?.data?.message || (isEditing ? 'Cập nhật thất bại!' : 'Tạo thất bại!');
            setErrors(prev => ({ ...prev, form: errorMessage }));
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
             {errors.form && <div className="p-3 text-sm text-red-600 bg-red-100 border border-red-200 rounded-md">{errors.form}</div>}

            <div>
                <label htmlFor="username" className="block mb-1 text-sm font-medium text-gray-700">Username {!isEditing && <span className="text-red-500">*</span>}</label>
                <input
                    type="text" name="username" id="username"
                    value={formData.username} onChange={handleChange}
                    required={!isEditing}
                    disabled={isEditing} 
                    className={`w-full px-3 py-2 border ${errors.username ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${isEditing ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                />
                {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username}</p>}
            </div>

             <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                    <label htmlFor="password" className="block mb-1 text-sm font-medium text-gray-700">
                        Mật khẩu {!isEditing && <span className="text-red-500">*</span>} {isEditing && <span className="text-xs text-gray-500">(Để trống nếu không đổi)</span>}
                    </label>
                    <input
                        type="password" name="password" id="password"
                        value={formData.password} onChange={handleChange}
                        required={!isEditing}
                        className={`w-full px-3 py-2 border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                        autoComplete="new-password"
                     />
                      {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                </div>
                 <div>
                    <label htmlFor="confirmPassword" className="block mb-1 text-sm font-medium text-gray-700">
                        Xác nhận MK {formData.password && <span className="text-red-500">*</span>}
                    </label>
                    <input
                         type="password" name="confirmPassword" id="confirmPassword"
                         value={formData.confirmPassword} onChange={handleChange}
                         required={!!formData.password}
                         className={`w-full px-3 py-2 border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                         autoComplete="new-password"
                     />
                      {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
                </div>
            </div>

            {/* Họ tên */}
            <div>
                <label htmlFor="hoTen" className="block mb-1 text-sm font-medium text-gray-700">Họ và Tên <span className="text-red-500">*</span></label>
                <input type="text" name="hoTen" id="hoTen" value={formData.hoTen} onChange={handleChange} required
                       className={`w-full px-3 py-2 border ${errors.hoTen ? 'border-red-500' : 'border-gray-300'} ...`} />
                {errors.hoTen && <p className="mt-1 text-sm text-red-600">{errors.hoTen}</p>}
            </div>

            {/* Email */}
            <div>
                <label htmlFor="email" className="block mb-1 text-sm font-medium text-gray-700">Email <span className="text-red-500">*</span></label>
                <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} required
                       className={`w-full px-3 py-2 border ${errors.email ? 'border-red-500' : 'border-gray-300'} ...`} />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

             {/* Giới tính và Vai trò */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                 {/* Giới tính */}
                <div>
                    <label htmlFor="gioiTinh" className="block mb-1 text-sm font-medium text-gray-700">Giới tính</label>
                    <select name="gioiTinh" id="gioiTinh" value={formData.gioiTinh} onChange={handleChange}
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                        <option value="Khác">Khác</option>
                    </select>
                     {errors.gioiTinh && <p className="mt-1 text-sm text-red-600">{errors.gioiTinh}</p>}
                </div>
                {/* Vai trò */}
                <div>
                    <label htmlFor="role" className="block mb-1 text-sm font-medium text-gray-700">Vai trò</label>
                    <select name="role" id="role" value={formData.role} onChange={handleChange}
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                        {/* Chỉ admin mới thấy và chọn được admin? Tùy logic */}
                        <option value="admin">Admin</option>
                        <option value="nhanvien">Nhân viên</option>
                        <option value="nguoidung">Người dùng</option>
                    </select>
                    {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role}</p>}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Ngày sinh */}
                 <div>
                     <label htmlFor="ngaySinh" className="block mb-1 text-sm font-medium text-gray-700">Ngày sinh</label>
                     <input
                        type="date"
                        name="ngaySinh" id="ngaySinh"
                        value={formData.ngaySinh} onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                 </div>

                {/* Giới tính */}
                 <div>
                     <label htmlFor="sDT" className="...">Số Điện Thoại</label>
                     <input
                        type="number"
                        name="sDT" id="sDT"
                        value={formData.sDT} onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                 </div>
             </div>

            {/* Nút Submit và Hủy */}
            <div className="flex justify-end pt-4 mt-6 space-x-3 border-t border-gray-200">
                 <button type="button" onClick={() => onClose(false)} disabled={isSubmitting}
                         className="px-4 py-2 text-gray-800 transition duration-200 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50">
                     Hủy
                 </button>
                 <button type="submit" disabled={isSubmitting}
                         className="flex items-center justify-center px-4 py-2 text-white transition duration-200 bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                     {isSubmitting ? 'Đang xử lý...' : (isEditing ? 'Lưu thay đổi' : 'Tạo tài khoản')}
                 </button>
             </div>
        </form>
    );
}

export default FormTaoTaiKhoan;