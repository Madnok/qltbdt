import React, { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FaTimesCircle, FaPaperclip } from 'react-icons/fa';
import { createLogBaoTriAPI, uploadInvoiceImagesAPI as uploadImagesAPI } from '../../api';
import { toast } from 'react-toastify';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

const FormLogBaoTri = ({ baoHongInfo, onClose }) => {
    const [hoatdong, setHoatdong] = useState('');
    const [ketQuaXuLy, setKetQuaXuLy] = useState('');
    const [suDungVatTu, setSuDungVatTu] = useState(false);
    const [ghiChuVatTu, setGhiChuVatTu] = useState('');
    const [chiPhi, setChiPhi] = useState('');
    const [invoiceFiles, setInvoiceFiles] = useState([]); // Lưu trữ File objects
    const [invoicePreviews, setInvoicePreviews] = useState([]); // Lưu trữ data URLs để xem trước
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [phuongAnXuLy, setPhuongAnXuLy] = useState(''); // State cho phương án xử lý
    const [phuongAnKhacChiTiet, setPhuongAnKhacChiTiet] = useState(''); // State cho chi tiết phương án khác
    const [damageFiles, setDamageFiles] = useState([]); // State cho file ảnh hỏng hóc
    const [damagePreviews, setDamagePreviews] = useState([]); // State cho preview ảnh hỏng hóc

    const queryClient = useQueryClient();

    const createLogMutation = useMutation({
        mutationFn: createLogBaoTriAPI,
        onSuccess: () => {
            toast.success('Ghi nhận hoạt động thành công!');
            queryClient.invalidateQueries({ queryKey: ['baotriMyTasks'] }); // Làm mới danh sách task
            queryClient.invalidateQueries({ queryKey: ['baohongLog', baoHongInfo.id] }); // Làm mới log của báo hỏng này
            queryClient.invalidateQueries({ queryKey: ['baoHongList'] }); // Làm mới danh sách báo hỏng chung
            // Có thể cần invalidate chi tiết thiết bị nếu trạng thái thay đổi
            if (baoHongInfo.thongtinthietbi_id) {
                queryClient.invalidateQueries({ queryKey: ['thongTinThietBi', baoHongInfo.thongtinthietbi_id] });
                queryClient.invalidateQueries({ queryKey: ['taiSanList'] });
            }
            onClose(); // Đóng form
        },
        onError: (err) => {
            setError(`Lỗi: ${err.response?.data?.error || err.message}`);
            setUploading(false);
        },
        onSettled: () => {
        }
    });

    // --- Hàm xử lý upload file  dùng chung ---
    const handleFileChange = (e, setFilesFunc, setPreviewsFunc, maxFiles = 5) => {
        const files = Array.from(e.target.files);
        if ((files.length + setFilesFunc(prev => prev.length)) > maxFiles) {
            toast.error(`Chỉ được tải lên tối đa ${maxFiles} ảnh.`);
            e.target.value = null;
            return;
        }
        const newFiles = [];
        const newPreviews = [];
        files.forEach(file => {
            if (file.size > 10 * 1024 * 1024) {
                toast.error(`File "${file.name}" quá lớn (tối đa 10MB).`);
                return;
            }
            newFiles.push(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                // Thêm vào mảng preview mới
                newPreviews.push({ name: file.name, url: reader.result });
                // Cập nhật state preview một lần sau khi đọc xong tất cả file mới
                if (newPreviews.length === files.length - (files.length - newFiles.length)) { // Đảm bảo tất cả file hợp lệ đã đọc xong
                    setPreviewsFunc(prev => [...prev, ...newPreviews]);
                }
            };
            reader.onerror = () => {
                toast.error(`Lỗi đọc file ${file.name}`);
            };
            reader.readAsDataURL(file);
        });
        setFilesFunc(prev => [...prev, ...newFiles]);
        setError('');
        e.target.value = null;
    };

    const removePreview = (fileName, setFilesFunc, setPreviewsFunc) => {
        setFilesFunc(prev => prev.filter(file => file.name !== fileName));
        setPreviewsFunc(prev => prev.filter(preview => preview.name !== fileName));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // --- Validation ---
        if (!hoatdong || !ketQuaXuLy || !phuongAnXuLy) {
            setError('Vui lòng nhập hoạt động, chọn kết quả xử lý và phương án xử lý.');
            return;
        }
        if (phuongAnXuLy === 'Khác' && !phuongAnKhacChiTiet.trim()) {
            setError("Vui lòng nhập chi tiết cho phương án xử lý 'Khác'.");
            return;
        }
        if (suDungVatTu && (!ghiChuVatTu.trim() || invoiceFiles.length === 0)) {
            setError('Khi sử dụng vật tư, vui lòng nhập chi tiết và tải lên ảnh hóa đơn.');
            return;
        }
        if (phuongAnXuLy === 'Bảo hành' && ketQuaXuLy === 'Đã sửa chữa xong') {
            setError('Vui lòng chọn "Đã gửi bảo hành".');
            return;
        }

        setUploading(true); // Bắt đầu trạng thái upload/lưu
        let uploadedInvoiceUrls = [];
        let uploadedDamageUrls = [];

        try {
            // Upload ảnh hóa đơn (nếu có)
            if (suDungVatTu && invoiceFiles.length > 0) {
                uploadedInvoiceUrls = await uploadImagesAPI(invoiceFiles); // Dùng hàm upload chung
            }
            // Upload ảnh hỏng hóc (nếu có)
            if (damageFiles.length > 0) {
                uploadedDamageUrls = await uploadImagesAPI(damageFiles); // Dùng hàm upload chung
            }

            // Gọi mutation để lưu log
            createLogMutation.mutate({
                baohong_id: baoHongInfo.id,
                thongtinthietbi_id: baoHongInfo.thongtinthietbi_id || null,
                phong_id: baoHongInfo.phong_id,
                hoatdong,
                ketQuaXuLy,
                phuongAnXuLy: phuongAnXuLy,
                phuongAnKhacChiTiet: phuongAnXuLy === 'Khác' ? phuongAnKhacChiTiet.trim() : null,
                suDungVatTu,
                ghiChuVatTu: suDungVatTu ? ghiChuVatTu.trim() : null,
                chiPhi: suDungVatTu && chiPhi ? parseInt(chiPhi) : null,
                hinhAnhHoaDonUrls: uploadedInvoiceUrls,
                hinhAnhHongHocUrls: uploadedDamageUrls,
            });

        } catch (uploadErr) {
            console.error("Lỗi upload ảnh:", uploadErr);
            setError(`Lỗi upload ảnh: ${uploadErr.response?.data?.error || uploadErr.message}`);
        }
    };

    // --- Lọc options cho Kết quả xử lý ---
    const availableKetQuaOptions = useMemo(() => {
        const options = [
            { value: "Đã sửa chữa xong", label: "Đã sửa chữa xong" },
            { value: "Đã gửi bảo hành", label: "Đã gửi bảo hành" },
            { value: "Đề xuất thanh lý", label: "Đề xuất thanh lý" },
            { value: "Không tìm thấy lỗi / Không cần xử lý", label: "Không tìm thấy lỗi / Không cần xử lý" },
            { value: "Chuyển cho bộ phận khác", label: "Chuyển cho bộ phận khác" }
        ];

        if (phuongAnXuLy === 'Bảo hành') {
            // Nếu là Bảo hành, chỉ cho chọn "Đã gửi bảo hành" hoặc "Không tìm thấy lỗi"
            return options.filter(opt => opt.value === 'Đã gửi bảo hành' || opt.value === 'Không tìm thấy lỗi / Không cần xử lý');
        } else if (phuongAnXuLy === 'Tự Sửa Chữa') {
             // Nếu Tự sửa, ẩn "Đã gửi bảo hành" và "Chuyển bộ phận khác"
             return options.filter(opt => opt.value !== 'Đã gửi bảo hành' && opt.value !== 'Chuyển cho bộ phận khác');
        } else if (phuongAnXuLy === 'Bàn Giao Cho Bộ Phận Khác') {
            // Nếu Bàn giao, chỉ cho chọn "Chuyển cho bộ phận khác" hoặc "Không tìm thấy lỗi"
            return options.filter(opt => opt.value === 'Chuyển cho bộ phận khác'/* || opt.value === 'Không tìm thấy lỗi / Không cần xử lý' */);
        } else if (phuongAnXuLy === 'Khác') {
            // Nếu Khác, có thể cho chọn nhiều loại kết quả hơn?
            return options.filter(opt => opt.value !== 'Đã gửi bảo hành' && opt.value !== 'Chuyển cho bộ phận khác');
        }

        // Mặc định trả về gần như đủ (trừ gửi BH và chuyển BP nếu chưa chọn phương án)
        return options.filter(opt => opt.value !== 'Đã gửi bảo hành' && opt.value !== 'Chuyển cho bộ phận khác');
    }, [phuongAnXuLy]); // Tính toán lại khi phương án thay đổi

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="w-full max-w-2xl p-6 bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-3 mb-4 border-b">
                    <h2 className="text-xl font-semibold">Ghi nhận Hoạt động Bảo trì</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700"> <FaTimesCircle size={24} /> </button>
                </div>

                {/* Hiển thị thông tin báo hỏng gốc */}
                <div className="p-3 mb-4 text-sm border rounded-md bg-gray-50">
                    <p><strong>Phòng:</strong> {baoHongInfo.phong_name}</p>
                    {baoHongInfo.tenThietBi && <p><strong>Thiết bị:</strong> {baoHongInfo.tenThietBi} (MDD: {baoHongInfo.thongtinthietbi_id})</p>}
                    <p><strong>Mô tả hỏng:</strong> {baoHongInfo.moTa}</p>
                    {baoHongInfo.ghiChuAdmin && <p className="mt-1 text-red-600"><strong>Admin yêu cầu:</strong> {baoHongInfo.ghiChuAdmin}</p>}
                </div>

                {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Hoạt động đã thực hiện */}
                    <div>
                        <label htmlFor="hoatdong" className="block mb-1 text-sm font-medium text-gray-700">Hoạt động đã thực hiện <span className="text-red-500">*</span></label>
                        <textarea
                            id="hoatdong" value={hoatdong} onChange={(e) => setHoatdong(e.target.value)}
                            className="w-full p-2 border rounded-md min-h-[100px]" required
                        />
                    </div>

                    {/* Xác nhận hỏng hóc bằng hình ảnh (Tùy chọn)*/}
                    <div>
                        <label htmlFor="damage-upload" className="block mb-1 text-sm font-medium text-gray-700">Ảnh xác nhận hỏng hóc (Tùy chọn, tối đa 2 ảnh):</label>
                        <input
                            type="file" id="damage-upload" multiple accept="image/*"
                            onChange={(e) => handleFileChange(e, setDamageFiles, setDamagePreviews, 2)} // Giới hạn 2 ảnh
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                        />
                        {/* Preview ảnh hỏng hóc */}
                        <div className="flex flex-wrap gap-2 mt-2">
                            {damagePreviews.map((preview, index) => (
                                <div key={index} className="relative">
                                    <img src={preview.url} alt={`Preview ${preview.name}`} className="object-cover w-20 h-20 border rounded" />
                                    <button type="button" onClick={() => removePreview(preview.name, setDamageFiles, setDamagePreviews)} className="absolute top-0 right-0 p-0.5 text-white bg-red-500 rounded-full text-xs">X</button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Phương án xử lý */}
                    <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">Phương án xử lý <span className="text-red-500">*</span></label>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                            {['Bảo hành', 'Tự Sửa Chữa', 'Bàn Giao Cho Bộ Phận Khác', 'Khác'].map(option => (
                                <label key={option} className="flex items-center text-sm">
                                    <input type="radio" name="phuongAnXuLy" value={option} checked={phuongAnXuLy === option} onChange={(e) => { setPhuongAnXuLy(e.target.value); setKetQuaXuLy(''); /* Reset kết quả khi đổi PA */ }} className="mr-1.5" required /> {option}
                                </label>
                            ))}
                        </div>
                        {/* Input chi tiết khi chọn 'Khác' */}
                        {phuongAnXuLy === 'Khác' && (
                            <div className='mt-2'>
                                <label htmlFor="phuongAnKhacChiTiet" className="block mb-1 text-xs font-medium text-gray-600">Chi tiết phương án khác: <span className="text-red-500">*</span></label>
                                <input type="text" id="phuongAnKhacChiTiet" value={phuongAnKhacChiTiet} onChange={(e) => setPhuongAnKhacChiTiet(e.target.value)} className="w-full p-2 text-sm border rounded-md" required />
                            </div>
                        )}
                    </div>

                    {/* Kết quả xử lý */}
                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700">Kết quả xử lý <span className="text-red-500">*</span></label>
                        <select value={ketQuaXuLy} onChange={(e) => setKetQuaXuLy(e.target.value)} className="w-full p-2 bg-white border rounded-md" required disabled={!phuongAnXuLy} /* Disable nếu chưa chọn phương án */ >
                            <option value="">-- Chọn kết quả --</option>
                            {availableKetQuaOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Sử dụng Vật tư? */}
                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700">Sử dụng Vật tư/Dịch vụ? <span className="text-red-500">*</span></label>
                        <div className="flex gap-4">
                            <label className="flex items-center">
                                <input type="radio" name="suDungVatTu" checked={suDungVatTu === false} onChange={() => setSuDungVatTu(false)} className="mr-1" /> Không
                            </label>
                            <label className="flex items-center">
                                <input type="radio" name="suDungVatTu" checked={suDungVatTu === true} onChange={() => setSuDungVatTu(true)} className="mr-1" /> Có
                            </label>
                        </div>
                    </div>

                    {/* Chi tiết Vật tư (hiện khi suDungVatTu là true) */}
                    {suDungVatTu && (
                        <>
                            <div>
                                <label htmlFor="ghiChuVatTu" className="block mb-1 text-sm font-medium text-gray-700">Chi tiết Vật tư/Dịch vụ <span className="text-red-500">*</span></label>
                                <textarea
                                    id="ghiChuVatTu" value={ghiChuVatTu} onChange={(e) => setGhiChuVatTu(e.target.value)}
                                    className="w-full p-2 border rounded-md min-h-[80px]" required={suDungVatTu}
                                    placeholder="Ghi rõ tên vật tư, số lượng, đơn giá hoặc dịch vụ thuê ngoài..."
                                />
                            </div>
                            <div>
                                <label htmlFor="chiPhi" className="block mb-1 text-sm font-medium text-gray-700">Chi phí (Nếu có)</label>
                                <input type="number" id="chiPhi" value={chiPhi} onChange={(e) => setChiPhi(e.target.value)} className="w-full p-2 border rounded-md" min="0" step="5000" />
                            </div>

                            {/* Upload Hóa đơn */}
                            <div>
                                <label htmlFor="invoice-upload" className="block mb-1 text-sm font-medium text-gray-700">Ảnh Hóa đơn/Chứng từ <span className="text-red-500">*</span></label>
                                <input
                                    type="file" id="invoice-upload" multiple accept="image/*,application/pdf"
                                    onChange={(e) => handleFileChange(e, setInvoiceFiles, setInvoicePreviews, 5)}
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    required={suDungVatTu && invoiceFiles.length === 0}
                                />
                                {/* Xem trước ảnh */}
                                <div className="flex flex-wrap gap-2 mt-2">
                                {invoicePreviews.map((preview, index) => (
                                         <div key={index} className="relative">
                                             {preview.url.startsWith('data:image') ? ( <img src={preview.url} alt={preview.name} className="object-cover w-20 h-20 border rounded" /> ) : ( <div className="flex items-center justify-center w-20 h-20 text-xs text-center text-gray-500 border rounded bg-gray-50"><FaPaperclip className="mb-1 mr-1" /> {preview.name}</div> )}
                                             <button type="button" onClick={() => removePreview(preview.name, setInvoiceFiles, setInvoicePreviews)} className="absolute top-0 right-0 p-0.5 text-white bg-red-500 rounded-full text-xs leading-none">X</button>
                                         </div>
                                     ))}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Nút Submit */}
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Hủy</button>
                        <button type="submit" disabled={uploading || createLogMutation.isPending} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">
                        {(uploading || createLogMutation.isPending) && <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />}
                        {uploading ? 'Đang xử lý...' : (createLogMutation.isPending ? 'Đang lưu...' : 'Lưu hoạt động')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FormLogBaoTri;