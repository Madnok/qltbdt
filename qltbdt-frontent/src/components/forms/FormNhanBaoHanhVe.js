import React, { useState } from 'react';
import { useMutation,/* useQueryClient*/ } from '@tanstack/react-query';
import { FaTimesCircle } from 'react-icons/fa';
import { createLogBaoTriAPI, updateTinhTrangTaiSanAPI, updateBaoHongAPI, uploadInvoiceImagesAPI as uploadImagesAPI } from '../../api'; // Giả sử uploadImagesAPI dùng chung
import { toast } from 'react-toastify';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

const FormNhanBaoHanhVe = ({ deviceInfo, onClose, onSuccess }) => {
    const [ketQuaNhanHang, setKetQuaNhanHang] = useState('tot');
    const [hoatdong, setHoatdong] = useState(
        `Nhận thiết bị ${deviceInfo?.tenThietBi || `ID ${deviceInfo?.id}` || 'N/A'} từ bảo hành về.` +
        (deviceInfo?.relatedBaoHongId ? ` (Báo hỏng gốc ID: ${deviceInfo.relatedBaoHongId})` : '')
    );
    const [damageFiles, setDamageFiles] = useState([]);
    const [damagePreviews, setDamagePreviews] = useState([]);
    // const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    // const queryClient = useQueryClient();

    // --- Mutations ---
    const createLogMutation = useMutation({ mutationFn: createLogBaoTriAPI });
    const updateDeviceStatusMutation = useMutation({ // Đổi tên biến để rõ ràng hơn
        mutationFn: (variables) => {
            const { id, data } = variables;
            if (id === undefined || data === undefined) {
                return Promise.reject(new Error("Thiếu ID hoặc data cho updateDeviceStatusMutation"));
            }
            return updateTinhTrangTaiSanAPI(id, data); // Gọi API cập nhật trạng thái TTTB
        },
    });
    const updateBaoHongStatusMutation = useMutation({ mutationFn: updateBaoHongAPI });

    // --- Upload ảnh ---
    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + damageFiles.length > 2) {
            toast.error("Chỉ được tải lên tối đa 2 ảnh.");
            e.target.value = null;
            return;
        }
        // (Thêm validation size, type nếu cần)
        setDamageFiles(prev => [...prev, ...files]);
        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setDamagePreviews(prev => [...prev, { name: file.name, url: reader.result }]);
            };
            reader.readAsDataURL(file);
        });
        e.target.value = null;
    };

    const removePreview = (fileName) => {
        setDamageFiles(prev => prev.filter(file => file.name !== fileName));
        setDamagePreviews(prev => prev.filter(preview => preview.name !== fileName));
    };

    // --- Submit ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); // Reset lỗi trước khi submit

        // --- Validation --- (Giữ nguyên)
        if (!deviceInfo?.relatedBaoHongId) {
            setError('Lỗi: Không tìm thấy ID báo hỏng gốc liên kết.');
            return;
        }
        if (!hoatdong.trim() || !ketQuaNhanHang) {
            setError('Vui lòng nhập hoạt động và chọn kết quả nhận hàng.');
            return;
        }
        if (!deviceInfo?.id) {
            setError('Lỗi: Không xác định được ID thiết bị.');
            return;
        }

        // Bắt đầu xử lý, disable nút
        let uploadedDamageUrls = [];

        try {
            // --- 1. Upload ảnh (Nếu có) ---
            if (damageFiles.length > 0) {
                console.log("Uploading damage images...");
                uploadedDamageUrls = await uploadImagesAPI(damageFiles); // Đảm bảo API này đúng
                console.log("Damage images uploaded:", uploadedDamageUrls);
            }

            // --- 2. Tạo Log ---
            const ketQuaXuLyLog = 'Đã nhận từ bảo hành'; // Kết quả cho log bảo trì
            let hoatdongText = hoatdong.trim(); // Lấy text hoạt động
            // Bổ sung chi tiết kết quả nhận hàng vào hoạt động log
            if (ketQuaNhanHang === 'con_loi') hoatdongText += ' - Tình trạng ghi nhận: Vẫn còn lỗi.';
            else if (ketQuaNhanHang === 'gui_lai') hoatdongText += ' - Hành động tiếp theo: Gửi lại bảo hành.';
            else if (ketQuaNhanHang === 'thanh_ly') hoatdongText += ' - Hành động tiếp theo: Đề xuất thanh lý.';
            else hoatdongText += ' - Tình trạng ghi nhận: Hoạt động tốt.';

            const logData = {
                baohong_id: deviceInfo.relatedBaoHongId,
                thongtinthietbi_id: deviceInfo.id,
                phong_id: deviceInfo.phong_id || null, // Lấy phong_id từ deviceInfo
                hoatdong: hoatdongText,
                ketQuaXuLy: ketQuaXuLyLog,
                phuongAnXuLy: 'Bảo hành', // Có thể ghi là 'Bảo hành' hoặc 'Khác' tùy logic bạn muốn
                phuongAnKhacChiTiet: `Nhận lại thiết bị sau bảo hành - Kết quả: ${ketQuaNhanHang}`, // Ghi rõ hơn
                suDungVatTu: false,
                hinhAnhHongHocUrls: uploadedDamageUrls, // Ảnh tình trạng lúc nhận
                // Các trường khác để null hoặc false
                ghiChuVatTu: null,
                chiPhi: null,
                hinhAnhHoaDonUrls: null,
                ngayDuKienTra: null
            };
            console.log("Creating log with data:", logData);
            await createLogMutation.mutateAsync(logData);
            console.log("Log created successfully.");

            // 3. Cập nhật trạng thái thiết bị
            let newDeviceStatus = 'da_bao_hanh';
            if (ketQuaNhanHang === 'gui_lai') newDeviceStatus = 'dang_bao_hanh';
            else if (ketQuaNhanHang === 'thanh_ly') newDeviceStatus = 'de_xuat_thanh_ly';
            const deviceUpdateData = { tinhTrang: newDeviceStatus };
            console.log(`[FormNhanVe] Updating device ${deviceInfo.id} status to:`, deviceUpdateData);
            await updateDeviceStatusMutation.mutateAsync({ id: deviceInfo.id, data: deviceUpdateData });
            console.log("[FormNhanVe] Device status updated successfully.");

            // --- 4. Cập nhật trạng thái Báo Hỏng gốc ---
            const baoHongUpdateData = { trangThai: 'Chờ Xem Xét' };
            // *** THÊM LOG Ở ĐÂY ***
            console.log(`[FormNhanVe] Attempting to update BaoHong ${deviceInfo.relatedBaoHongId} status with:`, baoHongUpdateData);
            await updateBaoHongStatusMutation.mutateAsync({
                id: deviceInfo.relatedBaoHongId,
                updateData: baoHongUpdateData
            });
            // Log này chỉ chạy nếu await ở trên thành công
            console.log("[FormNhanVe] BaoHong status update mutation awaited successfully.");

            // --- 5. Thành công ---
            console.log("[FormNhanVe] All steps completed successfully.");
            toast.success(`Đã ghi nhận nhận thiết bị ${deviceInfo.id}. Báo hỏng chuyển sang 'Chờ Xem Xét'.`);
            if (typeof onSuccess === 'function') { onSuccess(); }
            onClose();

        } catch (err) {
            console.error("!!! Lỗi xảy ra trong quá trình nhận hàng bảo hành:", err.response?.data || err.message || err);
            let errorMsg = 'Có lỗi xảy ra trong quá trình xử lý.';
            if (err.response?.data?.error) {
                errorMsg = err.response.data.error;
            } else if (err.response?.data?.message) {
                errorMsg = err.response.data.message;
            } else if (err.message) {
                errorMsg = err.message;
            }
            setError(`Lỗi: ${errorMsg}`);
            toast.error(`Thất bại: ${errorMsg}`);
        }
    };

    // Tính toán trạng thái loading tổng hợp từ các mutation
    const isProcessing = createLogMutation.isPending || updateDeviceStatusMutation.isPending || updateBaoHongStatusMutation.isPending;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="w-full max-w-lg p-6 bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-3 mb-4 border-b">
                    <h2 className="text-xl font-semibold">Nhận Thiết Bị Bảo Hành Về</h2>
                    {/* Cho phép đóng modal ngay cả khi đang xử lý */}
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700"> <FaTimesCircle size={24} /> </button>
                </div>

                {/* Thông tin thiết bị */}
                <div className="p-3 mb-4 text-sm border rounded-md bg-gray-50">
                    <p><strong>Thiết bị:</strong> {deviceInfo?.tenThietBi || 'N/A'} (MĐD: {deviceInfo?.id})</p>
                    <p><strong>Phòng gốc:</strong> {deviceInfo?.phong_name || 'N/A'}</p>
                    {deviceInfo?.relatedBaoHongId && <p><strong>Báo hỏng gốc ID:</strong> {deviceInfo.relatedBaoHongId}</p>}
                </div>

                {/* Hiển thị lỗi nếu có */}
                {error && <p className="p-2 mb-4 text-sm text-red-600 bg-red-100 rounded">{error}</p>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Hoạt động thực hiện */}
                    <div>
                        <label htmlFor="hoatdong-nhanhang" className="block mb-1 text-sm font-medium text-gray-700">Hoạt động thực hiện <span className="text-red-500">*</span></label>
                        <textarea
                            id="hoatdong-nhanhang" value={hoatdong} onChange={(e) => setHoatdong(e.target.value)}
                            className="w-full p-2 border rounded-md min-h-[80px]" required
                            placeholder="Ghi rõ tình trạng thiết bị khi nhận, kiểm tra..."
                            disabled={isProcessing} // Disable nếu đang xử lý
                        />
                    </div>

                    {/* Kết quả nhận hàng */}
                    <div>
                        <label htmlFor="ketqua-nhanhang" className="block mb-1 text-sm font-medium text-gray-700">Kết quả nhận hàng <span className="text-red-500">*</span></label>
                        <select id="ketqua-nhanhang" value={ketQuaNhanHang} onChange={(e) => setKetQuaNhanHang(e.target.value)} className="w-full p-2 bg-white border rounded-md" required disabled={isProcessing}>
                            <option value="tot">Hoạt động tốt</option>
                            <option value="con_loi">Vẫn còn lỗi</option>
                            <option value="gui_lai">Gửi lại bảo hành</option>
                            <option value="thanh_ly">Đề xuất thanh lý</option>
                        </select>
                        <p className="mt-1 text-xs text-gray-500">
                            Trạng thái thiết bị và báo hỏng sẽ được cập nhật tương ứng.
                        </p>
                    </div>

                    {/* Ảnh tình trạng lúc nhận */}
                    <div>
                        <label htmlFor="damage-upload-nhanhang" className="block mb-1 text-sm font-medium text-gray-700">Ảnh tình trạng thiết bị khi nhận (Tùy chọn, tối đa 2 ảnh):</label>
                        <input
                            type="file" id="damage-upload-nhanhang" multiple accept="image/*"
                            onChange={handleFileChange}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                            disabled={isProcessing || damageFiles.length >= 2} // Disable nếu đang xử lý hoặc đủ ảnh
                        />
                        {/* Preview ảnh */}
                        <div className="flex flex-wrap gap-2 mt-2">
                            {damagePreviews.map((preview, index) => (
                                <div key={index} className="relative">
                                    <img src={preview.url} alt={`Preview ${preview.name}`} className="object-cover w-20 h-20 border rounded" />
                                    {/* Cho phép xóa preview ngay cả khi đang xử lý */}
                                    <button type="button" onClick={() => removePreview(preview.name)} className="absolute top-0 right-0 p-0.5 text-white bg-red-500 rounded-full text-xs leading-none">X</button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Nút Submit */}
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50" disabled={isProcessing}>Hủy</button>
                        {/* Disable nút khi isProcessing là true */}
                        <button type="submit" disabled={isProcessing} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                            {isProcessing ? <ArrowPathIcon className="inline-block w-4 h-4 mr-2 animate-spin" /> : null}
                            {isProcessing ? 'Đang xử lý...' : 'Xác nhận nhận hàng'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FormNhanBaoHanhVe;