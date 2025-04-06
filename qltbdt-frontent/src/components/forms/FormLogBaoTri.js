import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FaTimesCircle, FaPaperclip } from 'react-icons/fa';
import { createLogBaoTriAPI, uploadInvoiceImagesAPI } from '../../api';

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

    const queryClient = useQueryClient();

    const createLogMutation = useMutation({
        mutationFn: createLogBaoTriAPI,
        onSuccess: () => {
            alert('Ghi nhận hoạt động thành công!');
            queryClient.invalidateQueries({ queryKey: ['baotriMyTasks'] }); // Làm mới danh sách task
            queryClient.invalidateQueries({ queryKey: ['baohongLog', baoHongInfo.id] }); // Làm mới log của báo hỏng này
            queryClient.invalidateQueries({ queryKey: ['baoHongList'] }); // Làm mới danh sách báo hỏng chung
            // Có thể cần invalidate chi tiết thiết bị nếu trạng thái thay đổi
            if (baoHongInfo.thongtinthietbi_id) {
                 queryClient.invalidateQueries({ queryKey: ['thongTinThietBi', baoHongInfo.thongtinthietbi_id] });
            }
            onClose(); // Đóng form
        },
        onError: (err) => {
            setError(`Lỗi: ${err.response?.data?.error || err.message}`);
        }
    });

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 5) {
            alert("Chỉ được tải lên tối đa 5 ảnh.");
            return;
        }
        const newFiles = [];
        // const currentPreviews = [...invoicePreviews];

        files.forEach(file => {
            if (file.size > 10 * 1024 * 1024) {
                alert(`File "${file.name}" quá lớn (tối đa 10MB).`);
                return;
            }
            newFiles.push(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                // Cập nhật state preview một cách an toàn
                setInvoicePreviews(prev => [...prev, { name: file.name, url: reader.result }]);
            };
            reader.readAsDataURL(file);
        });
        setInvoiceFiles(prev => [...prev, ...newFiles]);
        setError(''); // Xóa lỗi nếu có
    };

    const removePreview = (fileName) => {
        setInvoiceFiles(prev => prev.filter(file => file.name !== fileName));
        setInvoicePreviews(prev => prev.filter(preview => preview.name !== fileName));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // --- Validation ---
        if (!hoatdong || !ketQuaXuLy) {
            setError('Vui lòng nhập hoạt động đã thực hiện và chọn kết quả xử lý.');
            return;
        }
        if (suDungVatTu && (!ghiChuVatTu || invoiceFiles.length === 0)) {
            setError('Vui lòng nhập chi tiết vật tư và tải lên ảnh hóa đơn.');
            return;
        }

        setUploading(true); // Bắt đầu trạng thái upload/lưu
        let uploadedImageUrls = [];

        try {
            // Upload ảnh hóa đơn nếu có
            if (suDungVatTu && invoiceFiles.length > 0) {
                uploadedImageUrls = await uploadInvoiceImagesAPI(invoiceFiles);
            }

            // Gọi mutation để lưu log
            createLogMutation.mutate({
                baohong_id: baoHongInfo.id,
                thongtinthietbi_id: baoHongInfo.thongtinthietbi_id,
                phong_id: baoHongInfo.phong_id,
                hoatdong,
                ketQuaXuLy,
                suDungVatTu,
                ghiChuVatTu: suDungVatTu ? ghiChuVatTu : null,
                chiPhi: chiPhi ? parseFloat(chiPhi) : null,
                hinhAnhHoaDonUrls: uploadedImageUrls,
            });

        } catch (uploadErr) {
            console.error("Lỗi upload ảnh hóa đơn:", uploadErr);
            setError(`Lỗi upload ảnh: ${uploadErr.response?.data?.error || uploadErr.message}`);
            setUploading(false); // Kết thúc trạng thái upload
        }
        // createLogMutation.onError sẽ xử lý lỗi từ API createLog, không cần finally ở đây
    };

    // Lấy trạng thái thiết bị để quyết định option nào được hiển thị
    const isDeviceFaulty = baoHongInfo.thongtinthietbi_id != null; // Ví dụ, logic có thể phức tạp hơn
    const isDeviceUnderWarranty = isDeviceFaulty && baoHongInfo.thoiGianBaoHanh !== null && baoHongInfo.thoiGianBaoHanh <= new Date(); // Cần logic kiểm tra ngày bảo hành thực tế

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
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

                    {/* Kết quả xử lý */}
                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700">Kết quả xử lý <span className="text-red-500">*</span></label>
                        <select value={ketQuaXuLy} onChange={(e) => setKetQuaXuLy(e.target.value)} className="w-full p-2 border rounded-md" required>
                            <option value="">-- Chọn kết quả --</option>
                            <option value="Đã sửa chữa xong">Đã sửa chữa xong</option>
                            {/* Chỉ hiện khi có thiết bị và còn BH */}
                            {isDeviceFaulty && isDeviceUnderWarranty && <option value="Đã gửi bảo hành">Đã gửi bảo hành</option>}
                            {/* Chỉ hiện khi có thiết bị và hết BH (hoặc logic khác) */}
                            {isDeviceFaulty && !isDeviceUnderWarranty && <option value="Đề xuất thanh lý">Đề xuất thanh lý</option>}
                            <option value="Không tìm thấy lỗi / Không cần xử lý">Không tìm thấy lỗi / Không cần xử lý</option>
                            {/* <option value="Chuyển cho bộ phận khác">Chuyển cho bộ phận khác</option> */}
                        </select>
                    </div>

                    {/* Sử dụng Vật tư? */}
                    <div>
                         <label className="block mb-1 text-sm font-medium text-gray-700">Sử dụng Vật tư/Dịch vụ? <span className="text-red-500">*</span></label>
                         <div className="flex gap-4">
                             <label className="flex items-center">
                                 <input type="radio" name="suDungVatTu" checked={suDungVatTu === false} onChange={() => setSuDungVatTu(false)} className="mr-1"/> Không
                             </label>
                             <label className="flex items-center">
                                 <input type="radio" name="suDungVatTu" checked={suDungVatTu === true} onChange={() => setSuDungVatTu(true)} className="mr-1"/> Có
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
                                 <input type="number" id="chiPhi" value={chiPhi} onChange={(e) => setChiPhi(e.target.value)} className="w-full p-2 border rounded-md" min="0" step="1000"/>
                             </div>

                             {/* Upload Hóa đơn */}
                              <div>
                                 <label htmlFor="invoice-upload" className="block mb-1 text-sm font-medium text-gray-700">Ảnh Hóa đơn/Chứng từ <span className="text-red-500">*</span></label>
                                 <input
                                     type="file" id="invoice-upload" multiple accept="image/*,application/pdf"
                                     onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                     required={suDungVatTu && invoiceFiles.length === 0}
                                 />
                                 {/* Xem trước ảnh */}
                                 <div className="flex flex-wrap gap-2 mt-2">
                                     {invoicePreviews.map((preview, index) => (
                                         <div key={index} className="relative">
                                              {preview.url.startsWith('data:image') ? (
                                                 <img src={preview.url} alt={`Preview ${preview.name}`} className="object-cover w-20 h-20 border rounded" />
                                             ) : (
                                                 <div className="flex items-center justify-center w-20 h-20 text-xs text-center text-gray-500 border rounded bg-gray-50">
                                                     <FaPaperclip className="mb-1 mr-1"/> {preview.name}
                                                 </div>
                                             )}
                                             <button type="button" onClick={() => removePreview(preview.name)} className="absolute top-0 right-0 p-0.5 text-white bg-red-500 rounded-full text-xs">X</button>
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
                            {uploading ? 'Đang xử lý...' : (createLogMutation.isPending ? 'Đang lưu...' : 'Lưu hoạt động')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FormLogBaoTri;