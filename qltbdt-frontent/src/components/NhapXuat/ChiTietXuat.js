import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPhieuXuatByIdAPI, uploadChungTuXuatAPI } from '../../api';
import { formatDate, formatCurrency } from '../../utils/helpers';
import { getTinhTrangLabel } from '../../utils/constants';
import { toast } from 'react-toastify';
import {
    FaPaperclip, FaUpload,
    FaSpinner, FaFilePdf, FaFileImage
} from "react-icons/fa"; 

const ChiTietXuat = ({ phieuXuatId, onClose }) => {
    const queryClient = useQueryClient();
    const [selectedFiles, setSelectedFiles] = useState(null);
    const fileInputRef = useRef(null);

    // --- Fetch dữ liệu chi tiết Phiếu Xuất ---
    const { data: phieuXuatData, isLoading, error } = useQuery({
        queryKey: ['phieuXuatDetail', phieuXuatId],
        queryFn: () => getPhieuXuatByIdAPI(phieuXuatId),
        enabled: !!phieuXuatId,
        staleTime: 5 * 60 * 1000,
    });

    // --- Mutation Upload Chứng Từ ---
    const uploadMutation = useMutation({
        mutationFn: (formData) => uploadChungTuXuatAPI(phieuXuatId, formData),
        onSuccess: (data) => {
            toast.success(data.message || "Upload chứng từ thành công!");
            setSelectedFiles(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
            // Tải lại dữ liệu chi tiết phiếu xuất sau khi upload thành công
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
        if (files.length > 5) {
            toast.warn("Chỉ được phép upload tối đa 5 file.");
            if (fileInputRef.current) fileInputRef.current.value = ""; // Reset input
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
            // Key 'chungTuFiles' phải khớp với backend
            formData.append('chungTuFiles', file);
        });
        uploadMutation.mutate(formData);
    };

    // --- Helpers ---
    const renderFileIcon = (url = "") => {
        try {
            const extension = new URL(url).pathname.split('.').pop().toLowerCase();
            if (['pdf'].includes(extension)) {
                return <FaFilePdf className="text-red-500 mr-1.5 flex-shrink-0" size={14} />;
            } else if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(extension)) {
                return <FaFileImage className="text-blue-500 mr-1.5 flex-shrink-0" size={14} />;
            }
        } catch (e) { /* Ignore error */ }
        return <FaPaperclip className="text-gray-500 mr-1.5 flex-shrink-0" size={14} />; // Icon mặc định
    };

    const getFileNameFromUrl = (url = "") => {
        try {
            // Lấy phần cuối cùng sau dấu / và decode URI component
            return decodeURIComponent(url.substring(url.lastIndexOf('/') + 1));
        } catch (e) { return "file_chung_tu"; }
    };


    if (!phieuXuatId) {
        return <div className="p-4 text-center text-gray-500">Chọn một phiếu xuất để xem chi tiết.</div>;
    }

    if (isLoading) return <p className="text-center text-gray-500">Đang tải chi tiết phiếu xuất...</p>;;
    if (error) return <p className="p-4 text-red-500">Lỗi tải chi tiết phiếu xuất: {error.message}</p>;
    if (!phieuXuatData || !phieuXuatData.chiTietThietBi) {
        console.warn("Dữ liệu chi tiết phiếu xuất không hợp lệ hoặc chưa có:", phieuXuatData);
        return <p className="p-4 text-orange-500">Dữ liệu chi tiết phiếu xuất không đầy đủ hoặc không tìm thấy.</p>;
   }

    // Đã có dữ liệu hợp lệ
    const phieuXuat = phieuXuatData;
    const chiTietThietBi = phieuXuatData.chiTietThietBi;
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
        <div className="p-4 space-y-4 text-sm">
            {/* Thông tin chung phiếu xuất */}
            <div className="pb-3 mb-3 border-b">
                <h4 className="mb-2 text-base font-semibold text-purple-700">Thông tin Phiếu Xuất #{phieuXuat.id}</h4>
                <dl className="space-y-1.5">
                    <div className="flex">
                        <dt className="w-1/3 font-medium text-gray-500">Ngày xuất:</dt>
                        <dd className="w-2/3 text-gray-800">{formatDate(phieuXuat.ngayXuat)}</dd>
                    </div>
                    <div className="flex">
                        <dt className="w-1/3 font-medium text-gray-500">Người thực hiện:</dt>
                        <dd className="w-2/3 text-gray-800">{phieuXuat.tenNguoiThucHien}</dd>
                    </div>
                    <div className="flex">
                        <dt className="w-1/3 font-medium text-gray-500">Lý do xuất:</dt>
                        <dd className="w-2/3 text-gray-800">{getTinhTrangLabel(phieuXuat.lyDoXuat)}</dd>
                    </div>
                    {phieuXuat.giaTriThanhLy !== null && ( // Chỉ hiện nếu có giá trị
                        <div className="flex">
                            <dt className="w-1/3 font-medium text-gray-500">Giá trị thu về:</dt>
                            <dd className="w-2/3 font-semibold text-gray-800 ">{formatCurrency(phieuXuat.giaTriThanhLy)}</dd>
                        </div>
                    )}
                    <div className="flex">
                        <dt className="w-1/3 font-medium text-gray-500">Ghi chú:</dt>
                        <dd className="w-2/3 text-gray-700 whitespace-pre-wrap">{phieuXuat.ghiChu || '(Không có)'}</dd>
                    </div>
                </dl>
            </div>

            {/* Danh sách thiết bị đã xuất */}
            <div>
                <h4 className="mb-2 text-base font-semibold text-purple-700">Danh sách tài sản đã xuất ({chiTietThietBi?.length || 0})</h4>
                {chiTietThietBi && chiTietThietBi.length > 0 ? (
                    <ul className="p-3 space-y-1 overflow-y-auto text-gray-700 list-decimal list-inside border rounded max-h-60 bg-gray-50 custom-scrollbar">
                        {chiTietThietBi.map(item => (
                            <li key={item.thongtinthietbi_id}>
                                ID: {item.thongtinthietbi_id} {item.tenThietBi ? `- ${item.tenThietBi}` : ''} {/* Hiển thị tên nếu có */}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="italic text-gray-500">Không có chi tiết thiết bị.</p>
                )}
            </div>
            {/* Chứng từ đính kèm */}
            <div className="pt-4 border-t">
                <h3 className="inline-flex items-center mb-2 text-base font-semibold text-purple-700">Chứng từ đính kèm</h3>
                {/* Danh sách chứng từ */}
                <div className="mb-3 space-y-1">
                    {danhSachChungTuParsed.length > 0 ? (
                        danhSachChungTuParsed.map((url, index) => (
                            <a
                                key={index}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center text-xs text-purple-600 break-all hover:text-purple-800 hover:underline"
                                title={getFileNameFromUrl(url)}
                            >
                                {renderFileIcon(url)}
                                <span className="ml-1">{getFileNameFromUrl(url)}</span>
                            </a>
                        ))
                    ) : (
                        <p className="text-xs italic text-gray-500">Chưa có chứng từ nào.</p>
                    )}
                </div>
                {/* Form Upload */}
                <div className="flex items-center space-x-2">
                    <input
                        type="file"
                        multiple
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="block w-full text-xs text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-violet-50 file:text-purple-700 hover:file:bg-purple-100"
                        accept="image/*,.pdf"
                    />
                    <button
                        onClick={handleUploadSubmit}
                        disabled={!selectedFiles || selectedFiles.length === 0 || uploadMutation.isPending}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
                    >
                        {uploadMutation.isPending ? (<FaSpinner className="w-4 h-4 mr-2 -ml-1 animate-spin" />) : (<FaUpload className="mr-1.5 h-4 w-4" />)}
                        Upload
                    </button>
                </div>
                {selectedFiles && selectedFiles.length > 0 && (
                    <p className='mt-1 text-xs text-gray-500'>Đã chọn {selectedFiles.length} file.</p>
                )}
            </div>
        </div>
    );
};

export default ChiTietXuat;