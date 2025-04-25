
import React, { useState, useEffect } from 'react'; // Thêm useMemo, useEffect
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FaTimesCircle, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import { createLogBaoTriAPI, uploadInvoiceImagesAPI } from '../../api';
import { toast } from 'react-toastify';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

const FormNhanBaoHanhVe = ({ deviceInfo, onClose, onSuccess }) => {
    const isFromMaintenance = !!deviceInfo?.relatedLichBaoDuongId;
    const relatedTaskId = isFromMaintenance ? deviceInfo.relatedLichBaoDuongId : deviceInfo.relatedBaoHongId;
    const taskTypeLabel = isFromMaintenance ? `Lịch BD gốc ID: ${relatedTaskId}` : `Báo hỏng gốc ID: ${relatedTaskId}`;

    const [ketQuaNhanHang, setKetQuaNhanHang] = useState('tot'); 
    const [hoatdong, setHoatdong] = useState(
        `Nhận thiết bị ${deviceInfo?.tenThietBi || `ID ${deviceInfo?.id}` || 'N/A'} từ bảo hành về. (${taskTypeLabel})`
    );
    const [damageFiles, setDamageFiles] = useState([]);
    const [damagePreviews, setDamagePreviews] = useState([]);
    const [error, setError] = useState('');
    const [isProcessing, setIsProcessing] = useState(false); 
    const queryClient = useQueryClient();

    // Cập nhật hoạt động khi kết quả thay đổi
    useEffect(() => {
        const baseText = `Nhận thiết bị ${deviceInfo?.tenThietBi || `ID ${deviceInfo?.id}` || 'N/A'} từ bảo hành về. (${taskTypeLabel})`;
        const suffix = ketQuaNhanHang === 'tot' ? ' - Tình trạng ghi nhận: Hoạt động tốt.' : ' - Tình trạng ghi nhận: Vẫn còn lỗi.';
        setHoatdong(baseText + suffix);
    }, [ketQuaNhanHang, deviceInfo, taskTypeLabel]);

    // Mutation tạo log
    const createLogMutation = useMutation({
        mutationFn: createLogBaoTriAPI,
        onSuccess: (data) => {
            toast.success(data.message || `Đã ghi nhận việc nhận thiết bị từ bảo hành.`);
            // **Invalidate query cho cả hai loại công việc**
            queryClient.invalidateQueries({ queryKey: ['assignedBaoDuongTasks'] });
            queryClient.invalidateQueries({ queryKey: ['assignedBaoHongTasks'] });
            queryClient.invalidateQueries({ queryKey: ['lichBaoDuongList'] });
            queryClient.invalidateQueries({ queryKey: ['baoHongList'] });
            if (deviceInfo?.id) { // Invalidate dựa trên deviceInfo.id (là thongtinthietbi_id)
                queryClient.invalidateQueries({ queryKey: ['thongTinThietBi', deviceInfo.id] });
                queryClient.invalidateQueries({ queryKey: ['taiSanList'] });
                queryClient.invalidateQueries({ queryKey: ['baoTriLogDetailUnified', { thongtinthietbi_id: deviceInfo.id }] }); // Invalidate log theo TTTB
                queryClient.invalidateQueries({ queryKey: ['baoTriLogsByThietBi', deviceInfo.id] }); // Giữ lại key cũ nếu dùng
            }
             // Invalidate log chi tiết của task gốc nếu có ID
            if (deviceInfo?.relatedBaoHongId) queryClient.invalidateQueries({ queryKey: ['baotriLogDetailUnified', { baohong_id: deviceInfo.relatedBaoHongId }] });
            if (deviceInfo?.relatedLichBaoDuongId) queryClient.invalidateQueries({ queryKey: ['baotriLogDetailUnified', { lichbaoduong_id: deviceInfo.relatedLichBaoDuongId }] });

            onSuccess(); // Gọi callback thành công (nếu có)
            onClose();
        },
        onError: (err) => {
            setError(`Lỗi: ${err.response?.data?.error || err.message}`);
        },
        onSettled: () => {
            setIsProcessing(false); // Luôn tắt trạng thái xử lý khi hoàn tất
        }
    });

    // Hàm xử lý upload file (Tương tự FormLogBaoTri)
     const handleFileChange = (e) => {
         const files = Array.from(e.target.files);
         const maxFiles = 2; // Giới hạn 2 ảnh xác nhận lỗi
         if (files.length + damageFiles.length > maxFiles) {
             toast.error(`Chỉ được tải lên tối đa ${maxFiles} ảnh xác nhận lỗi.`);
             e.target.value = null;
             return;
         }
         const addedFiles = [];
         files.forEach(file => {
             if (file.size > 10 * 1024 * 1024) { toast.error(`File "${file.name}" quá lớn.`); return; }
             if (!file.type.startsWith('image/')) { toast.warn(`File "${file.name}" không phải ảnh.`); return; }
             addedFiles.push(file);
             const reader = new FileReader();
             reader.onloadend = () => setDamagePreviews(prev => [...prev, { name: file.name, url: reader.result }]);
             reader.readAsDataURL(file);
         });
         if (addedFiles.length > 0) setDamageFiles(prev => [...prev, ...addedFiles]);
         setError('');
         e.target.value = null;
     };
     const removePreview = (fileName) => {
         setDamageFiles(prev => prev.filter(file => file.name !== fileName));
         setDamagePreviews(prev => prev.filter(preview => preview.name !== fileName));
     };


    // Hàm Submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Kiểm tra nếu chọn 'Lỗi' thì phải có ảnh
        if (ketQuaNhanHang === 'loi' && damageFiles.length === 0) {
            setError('Vui lòng tải lên ảnh để xác nhận tình trạng lỗi.');
            return;
        }

        setIsProcessing(true); // Bắt đầu xử lý
        let uploadedDamageUrls = [];

        try {
            // Upload ảnh lỗi nếu có
            if (damageFiles.length > 0) {
                // Sử dụng API upload chung hoặc riêng nếu cần
                uploadedDamageUrls = await uploadInvoiceImagesAPI(damageFiles);
            }

            // **Tạo Payload chính xác**
            const payload = {
                // Đặt ID báo hỏng hoặc lịch bảo dưỡng
                baohong_id: isFromMaintenance ? null : relatedTaskId,
                lichbaoduong_id: isFromMaintenance ? relatedTaskId : null,
                // Thông tin chung
                thongtinthietbi_id: deviceInfo.id,
                phong_id: deviceInfo.phong_id,
                hoatdong: hoatdong.trim(), // Hoạt động đã cập nhật theo kết quả
                ketQuaXuLy: 'Đã nhận từ bảo hành', // Kết quả cố định
                phuongAnXuLy: 'Bảo hành',          // Phương án cố định
                // Các trường khác thường không cần khi nhận hàng về
                phuongAnKhacChiTiet: null,
                suDungVatTu: false,
                ghiChuVatTu: null,
                chiPhi: null,
                hinhAnhHoaDonUrls: [], // Không có hóa đơn khi nhận về
                hinhAnhHongHocUrls: uploadedDamageUrls, // Ảnh xác nhận (nếu có lỗi)
                ngayDuKienTra: null // Không cần ngày dự kiến trả nữa
            };

            console.log("Submitting NhanHangVe Payload:", payload);
            createLogMutation.mutate(payload);

        } catch (uploadErr) {
            console.error("Lỗi upload ảnh:", uploadErr);
            setError(`Lỗi upload ảnh: ${uploadErr.response?.data?.error || uploadErr.message}`);
            setIsProcessing(false); // Dừng xử lý nếu upload lỗi
        }
        // Không setIsProcessing(false) ở đây, mutation sẽ xử lý
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="w-full max-w-lg p-6 bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto animate-modal-scale-in">
                <div className="flex items-center justify-between pb-3 mb-4 border-b">
                    <h2 className="text-xl font-semibold">Xác nhận Nhận Thiết bị từ Bảo hành</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600" disabled={isProcessing}> <FaTimesCircle size={24} /> </button>
                </div>

                {/* Thông tin thiết bị */}
                <div className="p-3 mb-4 text-sm border rounded-md bg-gray-50">
                    <p><strong>Thiết bị:</strong> {deviceInfo?.tenThietBi || `ID ${deviceInfo?.id}` || 'N/A'}</p>
                    <p><strong>Phòng gốc:</strong> {deviceInfo?.phong_name || 'N/A'}</p>
                    <p><strong>Task gốc:</strong> {taskTypeLabel}</p>
                </div>

                {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Chọn Kết quả Nhận hàng */}
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-700">Tình trạng thiết bị khi nhận về <span className="text-red-500">*</span></label>
                        <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-4">
                            <label className="flex items-center px-3 py-2 border rounded-md cursor-pointer hover:bg-gray-50">
                                <input
                                    type="radio"
                                    name="ketQuaNhanHang"
                                    value="tot"
                                    checked={ketQuaNhanHang === 'tot'}
                                    onChange={(e) => setKetQuaNhanHang(e.target.value)}
                                    className="mr-2"
                                />
                                <FaCheck className="mr-1 text-green-500"/> Hoạt động tốt
                            </label>
                            <label className="flex items-center px-3 py-2 border rounded-md cursor-pointer hover:bg-gray-50">
                                <input
                                    type="radio"
                                    name="ketQuaNhanHang"
                                    value="loi"
                                    checked={ketQuaNhanHang === 'loi'}
                                    onChange={(e) => setKetQuaNhanHang(e.target.value)}
                                    className="mr-2"
                                />
                                <FaExclamationTriangle className="mr-1 text-red-500"/> Vẫn còn lỗi
                            </label>
                        </div>
                    </div>

                    {/* Textarea Hoạt động (readOnly hoặc ẩn đi nếu muốn) */}
                    <div>
                        <label htmlFor="hoatdongNhanHang" className="block mb-1 text-sm font-medium text-gray-700">Nội dung ghi nhận (tự động)</label>
                        <textarea
                            id="hoatdongNhanHang" value={hoatdong} readOnly
                            className="w-full p-2 border rounded-md bg-gray-100 min-h-[80px] text-sm text-gray-600"
                        />
                    </div>

                    {/* Upload Ảnh nếu chọn 'Lỗi' */}
                    {ketQuaNhanHang === 'loi' && (
                        <div>
                            <label htmlFor="damage-upload-nhanhang" className="block mb-1 text-sm font-medium text-gray-700">
                                Ảnh xác nhận tình trạng lỗi <span className="text-red-500">*</span> (Tối đa 2)
                            </label>
                             <input type="file" id="damage-upload-nhanhang" multiple accept="image/*" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100" />
                             {/* Preview */}
                            <div className="flex flex-wrap gap-2 mt-2">
                                {damagePreviews.map((preview, index) => (
                                    <div key={index} className="relative">
                                        <img src={preview.url} alt={`Lỗi ${index+1}`} className="object-cover w-20 h-20 border rounded" />
                                        <button type="button" onClick={() => removePreview(preview.name)} className="absolute top-0 right-0 p-0.5 text-white bg-red-500 rounded-full text-xs leading-none">X</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Nút Submit */}
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50" disabled={isProcessing}>Hủy</button>
                        <button type="submit" disabled={isProcessing || (ketQuaNhanHang === 'loi' && damageFiles.length === 0)} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                            {isProcessing ? <ArrowPathIcon className="inline-block w-4 h-4 mr-2 animate-spin" /> : null}
                            {isProcessing ? 'Đang xử lý...' : 'Xác nhận nhận hàng'}
                        </button>
                    </div>
                </form>
            </div>
            {/* Animation */}
             <style>{` @keyframes modal-scale-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } } .animate-modal-scale-in { animation: modal-scale-in 0.2s ease-out forwards; } `}</style>
        </div>
    );
};

export default FormNhanBaoHanhVe;