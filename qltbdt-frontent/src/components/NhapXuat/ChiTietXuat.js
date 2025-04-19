import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// Đảm bảo import đúng API functions
import { fetchPhieuXuatDetailsAPI, uploadChungTuXuatAPI } from '../../api';
import { formatDate, formatCurrency } from '../../utils/helpers';
// import { getTinhTrangLabel } from '../../utils/constants'; // Không cần ở đây nếu chỉ hiển thị lý do
import { toast } from 'react-toastify';
import {
    FaPaperclip, FaUpload, FaSpinner, FaFilePdf, FaFileImage, FaDownload
} from "react-icons/fa"; // Thêm FaDownload

const ChiTietXuat = ({ phieuXuatId }) => { // Bỏ props onClose nếu panel tự đóng khi chuyển tab
    const queryClient = useQueryClient();
    const [selectedFiles, setSelectedFiles] = useState(null);
    const fileInputRef = useRef(null);

    // --- Fetch dữ liệu chi tiết Phiếu Xuất ---
    const { data: phieuXuatDetailsData, isLoading, error } = useQuery({
        queryKey: ['phieuXuatDetail', phieuXuatId],
        // Sử dụng API lấy chi tiết
        queryFn: () => fetchPhieuXuatDetailsAPI(phieuXuatId),
        enabled: !!phieuXuatId, // Chỉ fetch khi có phieuXuatId
        staleTime: 5 * 60 * 1000,
    });

    // --- Mutation Upload Chứng Từ ---
    const uploadMutation = useMutation({
        mutationFn: (formData) => uploadChungTuXuatAPI(phieuXuatId, formData), // Cần API endpoint này ở backend
        onSuccess: (data) => {
            toast.success(data.message || "Upload chứng từ thành công!");
            setSelectedFiles(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
            queryClient.invalidateQueries({ queryKey: ['phieuXuatDetail', phieuXuatId] });
        },
        onError: (error) => {
            console.error("Lỗi upload chứng từ phiếu xuất:", error);
            toast.error(`Lỗi upload: ${error.response?.data?.error || error.message}`);
        }
    });

    // --- Handlers ---
    // handleFileChange, handleUploadSubmit giữ nguyên

     const handleFileChange = (event) => {
         const files = Array.from(event.target.files);
         if (files.length > 5) {
             toast.warn("Chỉ được phép upload tối đa 5 file.");
             if (fileInputRef.current) fileInputRef.current.value = "";
             setSelectedFiles(null);
             return;
         }
         // Kiểm tra định dạng và kích thước (ví dụ)
         const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
         const maxSize = 5 * 1024 * 1024; // 5MB
         const invalidFiles = files.filter(file => !allowedTypes.includes(file.type) || file.size > maxSize);
         if (invalidFiles.length > 0) {
             toast.warn(`File không hợp lệ hoặc quá lớn (tối đa 5MB, chỉ ảnh/PDF): ${invalidFiles.map(f => f.name).join(', ')}`);
             if (fileInputRef.current) fileInputRef.current.value = "";
             setSelectedFiles(null);
             return;
         }

         setSelectedFiles(files);
     };

     const handleUploadSubmit = () => {
         if (!selectedFiles || selectedFiles.length === 0) {
             toast.warn("Vui lòng chọn file để upload.");
             return;
         }
         const formData = new FormData();
         selectedFiles.forEach(file => {
             formData.append('chungTuFiles', file); // Key phải khớp backend
         });
         uploadMutation.mutate(formData);
     };

    // --- Helpers ---
    // renderFileIcon, getFileNameFromUrl giữ nguyên
    const renderFileIcon = (url = "") => {
        try {
            const extension = new URL(url).pathname.split('.').pop().toLowerCase();
            if (['pdf'].includes(extension)) {
                return <FaFilePdf className="text-red-500 mr-1.5 flex-shrink-0" size={14} />;
            } else if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(extension)) {
                return <FaFileImage className="text-blue-500 mr-1.5 flex-shrink-0" size={14} />;
            }
        } catch (e) { /* Ignore error */ }
        return <FaPaperclip className="text-gray-500 mr-1.5 flex-shrink-0" size={14} />;
    };

    const getFileNameFromUrl = (url = "") => {
        try {
            return decodeURIComponent(url.substring(url.lastIndexOf('/') + 1));
        } catch (e) { return "file_chung_tu"; }
    };

     // Hàm lấy label cho Lý do xuất (giống BangXuat)
     const getLyDoXuatLabel = (lyDo) => {
        switch(lyDo) {
            case 'thanh_ly': return 'Thanh lý';
            case 'mat_mat': return 'Báo mất/hỏng';
            case 'xuat_tra': return 'Xuất trả NCC';
            case 'dieu_chuyen': return 'Điều chuyển';
            default: return lyDo;
        }
    }

    // --- Render Logic ---
    if (!phieuXuatId) {
        return <div className="p-6 text-center text-gray-500">Chọn một phiếu xuất để xem chi tiết.</div>; // Thêm padding
    }

    if (isLoading) return <div className="p-6 text-center text-gray-500">Đang tải chi tiết...</div>;
    if (error) return <div className="p-6 text-center text-red-500">Lỗi: {error.message}</div>;
    // Dữ liệu trả về từ API getPhieuXuatDetailsAPI có cấu trúc { phieuXuat: {...}, chiTiet: [...] }
    if (!phieuXuatDetailsData || !phieuXuatDetailsData.phieuXuat || !phieuXuatDetailsData.chiTiet) {
        console.warn("Dữ liệu chi tiết phiếu xuất không hợp lệ:", phieuXuatDetailsData);
        return <div className="p-6 text-center text-orange-500">Không tìm thấy dữ liệu chi tiết cho phiếu xuất này.</div>;
    }

    const { phieuXuat, chiTiet: chiTietThietBi } = phieuXuatDetailsData;

    // Parse danh sách chứng từ (lấy từ phieuXuat.danhSachChungTu)
     let danhSachChungTuParsed = [];
     if (phieuXuat.danhSachChungTu) {
         if (typeof phieuXuat.danhSachChungTu === 'string') {
             try {
                 danhSachChungTuParsed = JSON.parse(phieuXuat.danhSachChungTu);
                 if (!Array.isArray(danhSachChungTuParsed)) danhSachChungTuParsed = [];
             } catch (e) { danhSachChungTuParsed = []; }
         } else if (Array.isArray(phieuXuat.danhSachChungTu)) {
             danhSachChungTuParsed = phieuXuat.danhSachChungTu;
         }
     }

    return (
         // Thêm padding và màu tím chủ đạo
        <div className="p-5 space-y-5 text-sm bg-white h-full">
            {/* Thông tin chung phiếu xuất */}
            <div className="pb-4 mb-4 border-b border-purple-100">
                 {/* Giữ màu tím cho tiêu đề */}
                <h4 className="mb-2 text-base font-semibold text-purple-800">Thông tin Phiếu Xuất #{phieuXuat.id}</h4>
                <dl className="space-y-1.5">
                    <div className="grid grid-cols-3 gap-x-4">
                        <dt className="font-medium text-gray-500">Ngày xuất:</dt>
                        <dd className="col-span-2 text-gray-800">{formatDate(phieuXuat.ngayXuat)}</dd>
                    </div>
                    <div className="grid grid-cols-3 gap-x-4">
                        <dt className="font-medium text-gray-500">Người thực hiện:</dt>
                        <dd className="col-span-2 text-gray-800">{phieuXuat.tenNguoiThucHien}</dd>
                    </div>
                    <div className="grid grid-cols-3 gap-x-4">
                        <dt className="font-medium text-gray-500">Lý do xuất:</dt>
                         {/* Sử dụng helper label */}
                        <dd className="col-span-2 text-gray-800">{getLyDoXuatLabel(phieuXuat.lyDoXuat)}</dd>
                    </div>
                    {phieuXuat.giaTriThanhLy !== null && (
                         <div className="grid grid-cols-3 gap-x-4">
                            <dt className="font-medium text-gray-500">Giá trị thu về:</dt>
                             {/* Màu tím cho giá trị */}
                            <dd className="col-span-2 font-semibold text-purple-700">{formatCurrency(phieuXuat.giaTriThanhLy)}</dd>
                         </div>
                    )}
                    <div className="grid grid-cols-3 gap-x-4">
                        <dt className="font-medium text-gray-500">Ghi chú:</dt>
                        <dd className="col-span-2 text-gray-700 whitespace-pre-wrap">{phieuXuat.ghiChu || '(Không có)'}</dd>
                    </div>
                </dl>
            </div>

            {/* Danh sách thiết bị đã xuất */}
            <div className="pb-4 mb-4 border-b border-purple-100">
                 <h4 className="mb-2 text-base font-semibold text-purple-800">Danh sách tài sản đã xuất ({chiTietThietBi?.length || 0})</h4>
                {chiTietThietBi && chiTietThietBi.length > 0 ? (
                     <div className="overflow-x-auto border rounded max-h-60 custom-scrollbar">
                         <table className="min-w-full text-xs ">
                            <thead className="bg-purple-50">
                                 <tr>
                                     <th className="px-2 py-1.5 text-left font-medium text-purple-700">Mã ĐD</th>
                                     <th className="px-2 py-1.5 text-left font-medium text-purple-700">Tên Thiết Bị</th>
                                     <th className="px-2 py-1.5 text-right font-medium text-purple-700">Giá trị ban đầu</th>
                                 </tr>
                             </thead>
                             <tbody className="bg-white divide-y divide-gray-200">
                                {chiTietThietBi.map(item => (
                                    <tr key={item.thongtinthietbi_id}>
                                        <td className="px-2 py-1.5 text-gray-700">{item.thongtinthietbi_id}</td>
                                        <td className="px-2 py-1.5 text-gray-900">{item.tenThietBi}</td>
                                         <td className="px-2 py-1.5 text-gray-500 text-right">
                                            {item.giaTriBanDau ? formatCurrency(item.giaTriBanDau) : '-'}
                                        </td>
                                    </tr>
                                ))}
                             </tbody>
                         </table>
                     </div>
                ) : (
                    <p className="italic text-gray-500">Không có chi tiết thiết bị.</p>
                )}
            </div>

            {/* Chứng từ đính kèm */}
            <div>
                 <h4 className="inline-flex items-center mb-2 text-base font-semibold text-purple-800">Chứng từ đính kèm</h4>
                {/* Danh sách chứng từ */}
                <div className="mb-3 space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar pr-2"> {/* Cho phép cuộn nếu nhiều file */}
                    {danhSachChungTuParsed.length > 0 ? (
                        danhSachChungTuParsed.map((url, index) => (
                            <a
                                key={index}
                                href={url} // API backend cần trả về URL đầy đủ
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center px-2 py-1 text-xs text-purple-600 truncate border border-purple-100 rounded hover:bg-purple-50 hover:text-purple-800"
                                title={`Tải xuống: ${getFileNameFromUrl(url)}`}
                            >
                                {renderFileIcon(url)}
                                <span className="ml-1 truncate flex-grow">{getFileNameFromUrl(url)}</span>
                                <FaDownload className="ml-2 text-gray-400 flex-shrink-0 hover:text-purple-600" />
                            </a>
                        ))
                    ) : (
                        <p className="text-xs italic text-gray-500">Chưa có chứng từ nào.</p>
                    )}
                </div>
                {/* Form Upload */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 space-y-2 sm:space-y-0">
                     <label htmlFor={`chungtu-upload-${phieuXuatId}`} className='sr-only'>Chọn file chứng từ</label> {/* Label ẩn cho accessibility */}
                    <input
                        type="file"
                         id={`chungtu-upload-${phieuXuatId}`} // ID duy nhất nếu có nhiều chi tiết mở
                        multiple
                        ref={fileInputRef}
                        onChange={handleFileChange}
                         // Style input file cho đẹp hơn
                         className="block w-full text-xs text-gray-500 border border-gray-300 rounded-lg cursor-pointer file:hidden focus:outline-none focus:border-purple-300 focus:ring focus:ring-purple-200 focus:ring-opacity-50
                                     px-2 py-1.5 // Style như text input
                                     before:content-['Chọn_file...'] before:mr-2 before:py-0.5 before:px-2 before:rounded-md before:border-0 before:text-xs before:font-semibold before:bg-purple-50 before:text-purple-700 hover:before:bg-purple-100"
                        accept="image/*,.pdf" // Chỉ chấp nhận ảnh và PDF
                        disabled={uploadMutation.isLoading} // Disable khi đang upload
                    />
                    <button
                        onClick={handleUploadSubmit}
                        disabled={!selectedFiles || selectedFiles.length === 0 || uploadMutation.isLoading}
                        className="inline-flex items-center justify-center w-full sm:w-auto px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
                    >
                        {uploadMutation.isLoading ? (<FaSpinner className="w-4 h-4 mr-2 -ml-1 animate-spin" />) : (<FaUpload className="mr-1.5 h-3 w-3" />)}
                        Upload
                    </button>
                </div>
                {selectedFiles && selectedFiles.length > 0 && !uploadMutation.isLoading && (
                    <p className='mt-1 text-xs text-gray-500'>Đã chọn {selectedFiles.length} file.</p>
                )}
                 {/* Có thể thêm cảnh báo về định dạng/kích thước */}
                 <p className="mt-1 text-xs text-gray-400">Tối đa 5 file (ảnh/PDF), mỗi file không quá 5MB.</p>
            </div>
        </div>
    );
};

export default ChiTietXuat;