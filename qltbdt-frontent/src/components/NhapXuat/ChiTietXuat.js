import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchPhieuXuatDetailsAPI, uploadChungTuXuatAPI } from '../../api';
import { formatCurrency } from '../../utils/helpers';
import { getTinhTrangLabel } from '../../utils/constants';
import { toast } from 'react-toastify';
import {
    FaPaperclip, FaUpload, FaSpinner, FaFilePdf, FaFileImage, FaDownload, FaFileAlt
} from "react-icons/fa";

const ChiTietXuat = ({ phieuXuatId }) => {
    const queryClient = useQueryClient();
    const [selectedFiles, setSelectedFiles] = useState([]);
    const fileInputRef = useRef(null);

    // --- Fetch dữ liệu chi tiết Phiếu Xuất ---
    const { data: phieuXuatDetailsData, isLoading, error, isFetching } = useQuery({
        queryKey: ['phieuXuatDetail', phieuXuatId],
        queryFn: () => fetchPhieuXuatDetailsAPI(phieuXuatId),
        enabled: !!phieuXuatId,
        staleTime: 1 * 60 * 1000,
    });

    // --- Mutation Upload Chứng Từ ---
    const uploadMutation = useMutation({
        mutationFn: (formData) => uploadChungTuXuatAPI(phieuXuatId, formData),
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
    const handleFileChange = (event) => {
        const files = Array.from(event.target.files);
        if (files.length === 0) return;

        const currentFileCount = danhSachChungTuParsed?.length || 0;
        const newFileCount = files.length;
        const totalFiles = currentFileCount + newFileCount;

        if (totalFiles > 5) {
            toast.warn(`Chỉ được phép có tối đa 5 chứng từ. Hiện có ${currentFileCount}, bạn đã chọn thêm ${newFileCount}.`);
            if (fileInputRef.current) fileInputRef.current.value = "";
            setSelectedFiles([]);
            return;
        }

        // Kiểm tra loại file và kích thước
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
        const maxSize = 5 * 1024 * 1024; // 5MB
        const invalidFiles = files.filter(file => !allowedTypes.includes(file.type) || file.size > maxSize);
        if (invalidFiles.length > 0) {
            toast.warn(`File không hợp lệ hoặc quá lớn (tối đa 5MB): ${invalidFiles.map(f => f.name).join(', ')}`);
            if (fileInputRef.current) fileInputRef.current.value = "";
            setSelectedFiles([]);
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
            formData.append('chungTuFiles', file);
        });
        uploadMutation.mutate(formData);
    };

    // --- Helpers ---
    const renderFileIcon = (url = "") => {
        try {
            const extension = new URL(url).pathname.split('.').pop().toLowerCase();
            if (['pdf'].includes(extension)) return <FaFilePdf className="text-red-500 mr-1.5 flex-shrink-0" size={14} />;
            if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(extension)) return <FaFileImage className="text-blue-500 mr-1.5 flex-shrink-0" size={14} />;
            if (['doc', 'docx'].includes(extension)) return <FaFileAlt className="text-blue-700 mr-1.5 flex-shrink-0" size={14} />;
            if (['xls', 'xlsx'].includes(extension)) return <FaFileAlt className="text-green-700 mr-1.5 flex-shrink-0" size={14} />;
        } catch (e) { }
        return <FaPaperclip className="text-gray-500 mr-1.5 flex-shrink-0" size={14} />;
    };

    const getFileNameFromUrl = (url = "") => {
        try {
            return decodeURIComponent(url.substring(url.lastIndexOf('/') + 1));
        } catch (e) { return "file_chung_tu"; }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${day}-${month}-${year} ${hours}:${minutes}`;
    };

    // --- Render ---
    if (!phieuXuatId) {
        return <div className="p-6 text-center text-gray-500">Chọn một phiếu xuất để xem chi tiết.</div>;
    }
    if (isLoading) return <div className="p-6 text-center"><FaSpinner className="animate-spin inline mr-2" /> Đang tải...</div>;
    if (error) return <div className="p-6 text-center text-red-500">Lỗi: {error.message}</div>;
    if (!phieuXuatDetailsData || !phieuXuatDetailsData.phieuXuat) {
        return <div className="p-6 text-center text-orange-500">Không tìm thấy dữ liệu.</div>;
    }

    const { phieuXuat, chiTiet: chiTietThietBi = [] } = phieuXuatDetailsData;

    const danhSachChungTuParsed = phieuXuat.danhSachChungTu || [];

    const isCancelled = phieuXuat.trangThaiPhieu === 'DaHuy';

    return (
        // Thêm padding và màu tím chủ đạo
        <div className="p-5 space-y-5 text-sm bg-white h-full overflow-y-auto custom-scrollbar">
            {/* Thông tin chung phiếu xuất */}
            <div className="pb-4 mb-4 border-b border-purple-100">
                <h4 className="mb-2 text-base font-semibold text-purple-800">Thông tin Phiếu Xuất #{phieuXuat.id}</h4>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                    {/* Sử dụng grid để dễ dàn layout */}
                    <div className="flex"><dt className="w-28 font-medium text-gray-500 shrink-0">Ngày xuất:</dt><dd className="text-gray-800">{formatDate(phieuXuat.ngayXuat)}</dd></div>
                    <div className="flex"><dt className="w-28 font-medium text-gray-500 shrink-0">Người tạo:</dt><dd className="text-gray-800">{phieuXuat.tenNguoiThucHien}</dd></div>
                    <div className="flex"><dt className="w-28 font-medium text-gray-500 shrink-0">Lý do:</dt><dd className="text-gray-800">{getTinhTrangLabel(phieuXuat.lyDoXuat)}</dd></div>
                    {phieuXuat.giaTriThanhLy !== null && (
                        <div className="flex"><dt className="w-28 font-medium text-gray-500 shrink-0">Giá trị thu về:</dt><dd className="font-semibold text-purple-700">{formatCurrency(phieuXuat.giaTriThanhLy)}</dd></div>
                    )}
                    <div className="flex col-span-1 md:col-span-2"><dt className="w-28 font-medium text-gray-500 shrink-0">Ghi chú:</dt><dd className="text-gray-700 whitespace-pre-wrap">{phieuXuat.ghiChu || '(Không có)'}</dd></div>
                </dl>
            </div>

            {/* Danh sách thiết bị đã xuất */}
            <div className="pb-4 mb-4 border-b border-purple-100">
                 <h4 className="mb-2 text-base font-semibold text-purple-800">Danh Sách Thiết Bị Xuất ({chiTietThietBi?.length || 0})</h4>
                 <div className="overflow-x-auto border rounded max-h-48 custom-scrollbar">
                     {chiTietThietBi.length > 0 ? (
                         <table className="min-w-full text-xs">
                             <thead className="sticky top-0 bg-purple-50 z-10">
                                 <tr>
                                     <th className="px-2 py-1.5 text-left font-medium text-purple-700 w-16">Mã Định Danh</th>
                                     <th className="px-2 py-1.5 text-left font-medium text-purple-700">Tên Thiết Bị</th>
                                     <th className="px-2 py-1.5 text-right font-medium text-purple-700">Giá trị BĐ</th>
                                 </tr>
                             </thead>
                             <tbody className="bg-white divide-y divide-gray-100">
                                {chiTietThietBi.map(item => (
                                     <tr key={item.thongtinthietbi_id}>
                                         <td className="px-2 py-1.5 text-purple-600 font-medium">{item.thongtinthietbi_id}</td>
                                         <td className="px-2 py-1.5 text-gray-800">{item.tenThietBi}</td>
                                         <td className="px-2 py-1.5 text-gray-600 text-right">{item.giaTriBanDau ? formatCurrency(item.giaTriBanDau) : '-'}</td>
                                     </tr>
                                 ))}
                            </tbody>
                         </table>
                    ) : ( <p className="p-3 italic text-gray-500 text-center">Không có chi tiết thiết bị.</p> )}
                 </div>
            </div>

            {/* Chứng từ đính kèm */}
            <div>
                 <h4 className="inline-flex items-center mb-2 text-base font-semibold text-purple-800">Chứng từ đính kèm</h4>
                 {isFetching && <FaSpinner className="inline animate-spin ml-2 text-purple-600" />}
                 <div className={`mb-3 space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar pr-2 ${isCancelled ? 'opacity-70' : ''}`}>
                     {danhSachChungTuParsed.length > 0 ? (
                         danhSachChungTuParsed.map((url, index) => (
                             <a key={index} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center px-2 py-1 text-xs text-purple-600 truncate border border-purple-100 rounded hover:bg-purple-50 hover:text-purple-800 group" title={`Tải xuống: ${getFileNameFromUrl(url)}`} >
                                 {renderFileIcon(url)}
                                 <span className="ml-1 truncate flex-grow">{getFileNameFromUrl(url)}</span>
                                 <FaDownload className="ml-2 text-gray-400 group-hover:text-purple-600 flex-shrink-0" />
                             </a>
                         ))
                     ) : ( <p className="text-xs italic text-gray-500">Chưa có chứng từ nào.</p> )}
                 </div>
                 {/* Form Upload - Chỉ hiển thị khi phiếu chưa hủy và số lượng file < 5 */}
                 {!isCancelled && (danhSachChungTuParsed?.length || 0) < 5 && (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 space-y-2 sm:space-y-0">
                        <label htmlFor={`chungtu-upload-${phieuXuatId}`} className='sr-only'>Chọn file chứng từ</label>
                        <input
                            type="file"
                            id={`chungtu-upload-${phieuXuatId}`}
                            multiple
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="block w-full text-xs text-gray-500 border border-gray-300 rounded-lg cursor-pointer file:hidden focus:outline-none focus:border-purple-300 focus:ring focus:ring-purple-200 focus:ring-opacity-50 px-2 py-1.5 before:content-['Chọn_file...'] before:mr-2 before:py-0.5 before:px-2 before:rounded-md before:border-0 before:text-xs before:font-semibold before:bg-purple-50 before:text-purple-700 hover:before:bg-purple-100 disabled:opacity-50"
                            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                            disabled={uploadMutation.isLoading}
                        />
                        <button
                            onClick={handleUploadSubmit}
                            disabled={!selectedFiles || selectedFiles.length === 0 || uploadMutation.isLoading || (danhSachChungTuParsed?.length || 0) >= 5}
                            className="inline-flex items-center justify-center w-full sm:w-auto px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 flex-shrink-0" // Thêm flex-shrink-0
                        >
                             {uploadMutation.isLoading ? (<FaSpinner className="w-4 h-4 mr-2 -ml-1 animate-spin" />) : (<FaUpload className="mr-1.5 h-3 w-3" />)}
                            Upload
                        </button>
                    </div>
                )}
                 {selectedFiles && selectedFiles.length > 0 && !uploadMutation.isLoading && (
                     <p className='mt-1 text-xs text-gray-500'>Đã chọn {selectedFiles.length} file mới.</p>
                )}
                 {/* Cảnh báo về định dạng/kích thước */}
                 {!isCancelled && (danhSachChungTuParsed?.length || 0) < 5 && (
                    <p className="mt-1 text-xs text-gray-400">Tối đa 5 file (ảnh/PDF/Word/Excel), mỗi file không quá 5MB.</p>
                 )}
                 {/* Thông báo đã đủ số lượng file */}
                {(danhSachChungTuParsed?.length || 0) >= 5 && (
                     <p className='mt-1 text-xs text-orange-600'>Đã đạt số lượng chứng từ tối đa (5 file).</p>
                )}
            </div>
        </div>
    );
};

export default ChiTietXuat;