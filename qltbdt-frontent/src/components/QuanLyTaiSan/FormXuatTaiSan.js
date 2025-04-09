import React, { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPhieuXuatAPI, uploadChungTuXuatAPI } from '../../api';
import Popup from '../layout/Popup';
import { toast } from 'react-toastify';
import { FaPaperclip, FaTrash, FaSpinner } from 'react-icons/fa'; // Thêm icon
// import { formatCurrency } from '../../utils/helpers';

const FormXuatTaiSan = ({ isOpen, onClose, itemsToExport = [], triggerRefetch }) => {
    // itemsToExport là mảng các object tài sản đã được chọn và có trạng thái 'cho_thanh_ly'
    const [lyDoXuat, setLyDoXuat] = useState('thanh_ly'); // Mặc định là thanh lý
    const [ghiChu, setGhiChu] = useState('');
    const [giaTriThanhLy, setGiaTriThanhLy] = useState('');
    const [selectedFiles, setSelectedFiles] = useState([]);
    const fileInputRef = useRef(null); // <-- Ref cho input file
    const [isSaving, setIsSaving] = useState(false);
    const queryClient = useQueryClient();

    // Mutation để tạo phiếu xuất
    const createMutation = useMutation({
        mutationFn: createPhieuXuatAPI,
    });

    // Xử lý khi nhấn nút Xác nhận
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (itemsToExport.length === 0) {
            toast.warn('Không có tài sản nào được chọn để xuất.');
            onClose();
            return;
        }

        if (selectedFiles.length === 0) {
            toast.warn("Vui lòng đính kèm ít nhất một file chứng từ cho phiếu xuất.");
            return;
        }

        setIsSaving(true); // Bắt đầu lưu
        toast.info("Đang xử lý tạo phiếu xuất...");

        // Lấy danh sách ID từ các item được chọn
        const danhSachThietBiIds = itemsToExport.map(item => item.id);

        // Chuẩn bị dữ liệu gửi lên API
        const phieuXuatPayload = {
            lyDoXuat,
            ghiChu,
            giaTriThanhLy: lyDoXuat === 'thanh_ly' && giaTriThanhLy ? parseFloat(giaTriThanhLy) : null, // Chỉ lưu giá trị nếu bán
            danhSachThietBiIds,
        };

        try {
            // --- Bước 1: Tạo Phiếu Xuất ---
            const createResponse = await createMutation.mutateAsync(phieuXuatPayload);
            const createdPhieuXuatId = createResponse?.data?.phieuXuatId;

            if (!createdPhieuXuatId) {
                throw new Error("Không nhận được ID phiếu xuất sau khi tạo.");
            }
            console.log(`Phiếu xuất ID ${createdPhieuXuatId} đã được tạo.`);

            // --- Bước 2: Upload Chứng từ ---
            console.log(`Đang upload ${selectedFiles.length} chứng từ cho phiếu xuất ID: ${createdPhieuXuatId}`);
            const formData = new FormData();
            selectedFiles.forEach(file => {
                formData.append('chungTuFiles', file); // Key phải khớp backend
            });

            try {
                // Gọi API upload chứng từ Xuất
                await uploadChungTuXuatAPI(createdPhieuXuatId, formData);
                console.log("Upload chứng từ phiếu xuất thành công!");
                toast.success("Tạo phiếu xuất và upload chứng từ thành công!");

            } catch (uploadError) {
                console.error("Lỗi upload chứng từ phiếu xuất:", uploadError);
                toast.error(`Tạo phiếu xuất thành công, nhưng gặp lỗi khi upload chứng từ: ${uploadError.response?.data?.error || uploadError.message}`);
                // Vẫn nên tiếp tục vì phiếu xuất đã tạo
            }
            triggerRefetch(); // Làm mới bảng Quản lý tài sản
            queryClient.invalidateQueries({ queryKey: ['phieuXuat'] }); // Làm mới danh sách phiếu xuất (nếu cần)
            onClose(); // Đóng modal

        } catch (error) {
            console.error("Lỗi khi tạo phiếu xuất:", error);
            toast.error(`Lỗi tạo phiếu xuất: ${error.response?.data?.error || error.message}`);
        } finally {
            setIsSaving(false); // Kết thúc lưu
        }
    };

    const handleFileChange = (event) => {
        const files = Array.from(event.target.files);
        if (files.length > 5) { /* ... alert ... */ return; }
        setSelectedFiles(files);
    };
    const handleRemoveFile = (fileName) => {
        setSelectedFiles(prevFiles => prevFiles.filter(file => file.name !== fileName));
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // Tính tổng giá trị các thiết bị được chọn (nếu cần hiển thị)
    // const totalValue = useMemo(() => itemsToExport.reduce((sum, item) => sum + (item.giaTriBanDau || 0), 0), [itemsToExport]);

    return (
        <Popup isOpen={isOpen} onClose={onClose} title="Tạo Phiếu Xuất Tài Sản" >
            <form onSubmit={handleSubmit}>
                {/* Nội dung form được style lại */}
                <div className="p-2 space-y-4"> {/* Thêm padding và space giữa các mục */}
                    <div>
                        <p className="mb-1 text-sm text-gray-600">Bạn đang chuẩn bị xuất <strong>{itemsToExport.length}</strong> tài sản:</p>
                        <div className="p-2 overflow-y-auto text-xs border rounded max-h-24 bg-gray-50 custom-scrollbar"> {/* Thu nhỏ, thêm scrollbar đẹp (cần css) */}
                            <ul>
                                {itemsToExport.map(item => (
                                    <li key={item.id}>ID: {item.id} - {item.tenLoaiThietBi}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    {/* <p className="text-sm text-gray-600">Tổng giá trị ban đầu (ước tính): {formatCurrency(totalValue)}</p> */}

                    <div>
                        <label htmlFor="lyDoXuat" className="block mb-1 text-sm font-medium text-gray-700">Lý do xuất <span className="text-red-500">*</span></label>
                        <select id="lyDoXuat" value={lyDoXuat} onChange={(e) => setLyDoXuat(e.target.value)} className="block w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500" required>
                            <option value="thanh_ly">Thanh Lý</option>
                            <option value="dieu_chuyen">Điều Chuyển</option>
                            <option value="xuat_tra">Xuất Trả</option>
                            <option value="hong_mat">Mất Mát</option>
                        </select>
                    </div>

                    {lyDoXuat === 'thanh_ly' && (
                        <div>
                            <label htmlFor="giaTriThanhLy" className="block mb-1 text-sm font-medium text-gray-700">Giá trị thu về (VNĐ)</label>
                            <input
                                type="number"
                                id="giaTriThanhLy"
                                value={giaTriThanhLy}
                                onChange={(e) => setGiaTriThanhLy(e.target.value)}
                                className="block w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                                placeholder="Nhập số tiền nếu bán được"
                                min="0"
                            />
                        </div>
                    )}

                    <div>
                        <label htmlFor="ghiChu" className="block mb-1 text-sm font-medium text-gray-700">Ghi chú</label>
                        <textarea
                            id="ghiChu"
                            rows="3"
                            value={ghiChu}
                            onChange={(e) => setGhiChu(e.target.value)}
                            // Style textarea nhỏ gọn hơn
                            className="block w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 resize-none" // Thêm resize-none nếu muốn cố định kích thước
                            placeholder="Thêm ghi chú nếu cần..."
                        ></textarea>
                    </div>


                    {/*  Input chọn file chứng từ  */}
                    <div className="pt-2">
                        <label className="block mb-1 text-sm font-medium text-gray-700">Chứng Từ Kèm Theo <span className="text-red-500">*</span> (Tối đa 5 file):</label>
                        <input
                            type="file"
                            multiple
                            accept=".pdf,.jpg,.jpeg,.png" // Giới hạn file
                            onChange={handleFileChange}
                            ref={fileInputRef}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 border border-gray-300 rounded-md cursor-pointer focus:outline-none"
                        />
                        {/* Hiển thị file đã chọn */}
                        {selectedFiles.length > 0 && (
                            <div className="mt-2 space-y-1 text-xs">
                                <p className="font-medium">File đã chọn:</p>
                                <ul className="pl-5 list-disc">
                                    {selectedFiles.map((file, index) => (
                                        <li key={index} className="flex items-center justify-between">
                                            <span className="truncate"><FaPaperclip className="inline mr-1" />{file.name}</span>
                                            <button type="button" onClick={() => handleRemoveFile(file.name)} className="ml-2 text-red-500 hover:text-red-700" title="Xóa file"><FaTrash size={12} /></button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Footer của modal với nút bấm */}
                    <div className="flex items-center justify-end p-3 space-x-2 border-t border-gray-200 rounded-b-lg bg-gray-50">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                            disabled={createMutation.isPending}
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className="inline-flex items-center px-4 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-70 disabled:cursor-not-allowed"
                            disabled={selectedFiles.length === 0 || isSaving}
                        >
                            {isSaving ? (<><FaSpinner className="w-4 h-4 mr-2 -ml-1 animate-spin" /> Đang xử lý...</>) : 'Xác nhận Xuất'}
                        </button>
                    </div>
                </div>
            </form>
        </Popup>
    );
};

export default FormXuatTaiSan;