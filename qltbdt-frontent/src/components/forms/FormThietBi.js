// src/components/forms/FormThietBi.js
import React, { useState, useEffect } from 'react';
import { FaSave, FaSpinner } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { createThietBi } from '../../api'; // Import API function

// Nhận props từ component cha (ThietBi.js)
const FormThietBi = ({ existingThietBi = null, onSuccess, onCancel, theLoaiList = [] }) => {
    const isEditMode = Boolean(existingThietBi); // Kiểm tra xem có phải chế độ sửa không
    const initialFormData = {
        theloai_id: existingThietBi?.theloai_id || '',
        tenThietBi: existingThietBi?.tenThietBi || '',
        moTa: existingThietBi?.moTa || '',
        donGia: existingThietBi?.donGia || '',
        // Các trường khác nếu cần sửa
    };

    const [formData, setFormData] = useState(initialFormData);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({}); // State lưu lỗi validation

    // Reset form nếu existingThietBi thay đổi (ví dụ khi mở lại popup)
    useEffect(() => {
        setFormData({
            theloai_id: existingThietBi?.theloai_id || '',
            tenThietBi: existingThietBi?.tenThietBi || '',
            moTa: existingThietBi?.moTa || '',
            donGia: existingThietBi?.donGia || '',
        });
        setErrors({}); // Xóa lỗi cũ
    }, [existingThietBi]);

    const validateForm = () => {
        const newErrors = {};
        if (!formData.tenThietBi.trim()) {
            newErrors.tenThietBi = 'Tên loại thiết bị là bắt buộc.';
        }
        if (!formData.theloai_id) {
            newErrors.theloai_id = 'Vui lòng chọn thể loại.';
        }
        if (formData.donGia && isNaN(Number(formData.donGia))) {
             newErrors.donGia = 'Đơn giá phải là một số.';
        } else if (formData.donGia && Number(formData.donGia) < 0) {
             newErrors.donGia = 'Đơn giá không được âm.';
        }
        // Thêm validation khác nếu cần

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0; // true nếu không có lỗi
    };


    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Xóa lỗi khi người dùng bắt đầu sửa
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            toast.warn('Vui lòng kiểm tra lại các trường dữ liệu.');
            return;
        }

        setLoading(true);
        setErrors({}); // Xóa lỗi cũ trước khi submit

        try {
            const dataToSend = {
                theloai_id: parseInt(formData.theloai_id, 10), // Đảm bảo là số nguyên
                tenThietBi: formData.tenThietBi.trim(),
                moTa: formData.moTa.trim(),
                donGia: formData.donGia ? Number(formData.donGia) : null,
                tonKho:0
            };

            if (isEditMode) {
                 console.log("Chế độ sửa chưa được implmented:", existingThietBi.id, dataToSend);
                 // await updateThietBi(existingThietBi.id, dataToSend); // Gọi API sửa
                 // toast.success('Cập nhật loại thiết bị thành công!');
                 // Tạm thời báo lỗi
                 toast.error("Chức năng sửa chưa được hỗ trợ!");

            } else {
                console.log("Submitting new ThietBi:", dataToSend);
                await createThietBi(dataToSend); // Gọi API tạo mới
                toast.success('Thêm loại thiết bị thành công!');
            }
            onSuccess(); // Gọi callback thành công từ cha
        } catch (error) {
             console.error("API Error:", error);
             const apiError = error.response?.data?.message || error.response?.data?.error || error.message || 'Đã xảy ra lỗi không mong muốn.';
             setErrors(prev => ({ ...prev, api: apiError })); // Lưu lỗi API vào state
             toast.error(`Thao tác thất bại: ${apiError}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        // Sử dụng form với onSubmit
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {/* Hiển thị lỗi API chung nếu có */}
            {errors.api && <p className="text-red-500 text-sm mb-4">{errors.api}</p>}

            {/* Thể Loại */}
            <div>
                <label htmlFor="theloai_id" className="block text-sm font-medium text-gray-700 mb-1">Thể Loại <span className="text-red-500">*</span></label>
                <select
                    id="theloai_id"
                    name="theloai_id"
                    value={formData.theloai_id}
                    onChange={handleChange}
                    className={`w-full p-2 border rounded-md shadow-sm ${errors.theloai_id ? 'border-red-500' : 'border-gray-300'} focus:ring-indigo-500 focus:border-indigo-500`}
                    disabled={theLoaiList.length === 0} // Disable nếu chưa có list
                >
                    <option value="">{theLoaiList.length > 0 ? '-- Chọn thể loại --' : 'Đang tải...'}</option>
                    {theLoaiList.map(tl => (
                        <option key={tl.id} value={tl.id}>{tl.theLoai}</option>
                    ))}
                </select>
                {errors.theloai_id && <p className="text-red-500 text-xs mt-1">{errors.theloai_id}</p>}
            </div>

            {/* Tên Thiết Bị */}
            <div>
                <label htmlFor="tenThietBi" className="block text-sm font-medium text-gray-700 mb-1">Tên Loại Thiết Bị <span className="text-red-500">*</span></label>
                <input
                    type="text"
                    id="tenThietBi"
                    name="tenThietBi"
                    value={formData.tenThietBi}
                    onChange={handleChange}
                    className={`w-full p-2 border rounded-md shadow-sm ${errors.tenThietBi ? 'border-red-500' : 'border-gray-300'} focus:ring-indigo-500 focus:border-indigo-500`}
                    maxLength={255}
                />
                 {errors.tenThietBi && <p className="text-red-500 text-xs mt-1">{errors.tenThietBi}</p>}
            </div>

            {/* Đơn Giá */}
            <div>
                <label htmlFor="donGia" className="block text-sm font-medium text-gray-700 mb-1">Đơn Giá Tham Khảo</label>
                 <div className="relative">
                    <input
                        type="number"
                        id="donGia"
                        name="donGia"
                        value={formData.donGia}
                        onChange={handleChange}
                        className={`w-full p-2 pr-8 border rounded-md shadow-sm ${errors.donGia ? 'border-red-500' : 'border-gray-300'} focus:ring-indigo-500 focus:border-indigo-500`}
                        min="0" // Ngăn giá trị âm từ trình duyệt
                        step="1000" // Bước nhảy (tùy chọn)
                    />
                     <span className="absolute text-gray-500 right-3 top-1/2 transform -translate-y-1/2">₫</span>
                 </div>
                 {errors.donGia && <p className="text-red-500 text-xs mt-1">{errors.donGia}</p>}
            </div>

            {/* Mô Tả */}
            <div>
                <label htmlFor="moTa" className="block text-sm font-medium text-gray-700 mb-1">Mô Tả</label>
                <textarea
                    id="moTa"
                    name="moTa"
                    value={formData.moTa}
                    onChange={handleChange}
                    rows={3}
                    className="w-full p-2 border rounded-md shadow-sm border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                ></textarea>
            </div>

            {/* Nút Bấm */}
            <div className="flex justify-end pt-4 space-x-3 border-t border-gray-200">
                 <button
                    type="button"
                    onClick={onCancel} // Nút Hủy giờ sẽ gọi onCancel từ props
                    disabled={loading}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
                >
                     Hủy
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                     {loading ? (
                        <> <FaSpinner className="animate-spin" /> Đang {isEditMode ? 'cập nhật' : 'thêm'}... </>
                    ) : (
                        <> <FaSave /> {isEditMode ? 'Lưu thay đổi' : 'Thêm Loại TB'} </>
                    )}
                </button>
            </div>
        </form>
    );
};

export default FormThietBi;