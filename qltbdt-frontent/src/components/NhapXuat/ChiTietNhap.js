import React, { useState, useMemo, useRef } from 'react';
import { useQuery, useMutation/*, useQueryClient */ } from '@tanstack/react-query';
import { getPhieuNhapByIdAPI, uploadChungTuNhap } from '../../api';
import { formatCurrency } from '../../utils/helpers';
import { getTinhTrangLabel } from "../../utils/constants";
import { toast } from 'react-toastify';
import {
    FaChevronDown, FaChevronUp,
    FaUpload, FaSpinner, FaFilePdf, FaFileImage,
} from "react-icons/fa";

const ChiTietNhap = ({ phieuNhapId, onClose }) => {
    const formatPrice = formatCurrency;
    // const queryClient = useQueryClient();
    const [selectedFiles, setSelectedFiles] = useState(null);
    const fileInputRef = useRef(null);
    const [expandedRows, setExpandedRows] = useState([]);

    // --- Fetch dữ liệu chi tiết ---
    const { data: phieuNhapData, isLoading, error, refetch } = useQuery({
        queryKey: ['phieuNhapDetail', phieuNhapId],
        queryFn: () => getPhieuNhapByIdAPI(phieuNhapId),
        enabled: !!phieuNhapId,
        staleTime: 5 * 60 * 1000,
    });

    // --- Mutation Upload Chứng Từ ---
    const uploadMutation = useMutation({
        mutationFn: (formData) => uploadChungTuNhap(phieuNhapId, formData),
        onSuccess: (data) => {
            toast.success(data.message || "Upload chứng từ thành công!");
            setSelectedFiles(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
            refetch();
        },
        onError: (error) => {
            console.error("Lỗi upload chứng từ:", error);
            toast.error(`Lỗi upload: ${error.response?.data?.error || error.message}`);
        }
    });

    const handleFileChange = (event) => {
        setSelectedFiles(event.target.files);
    };

    const handleUploadSubmit = () => {
        if (!selectedFiles || selectedFiles.length === 0) {
            toast.warn("Vui lòng chọn file để upload.");
            return;
        }
        const formData = new FormData();
        // Lặp qua các file đã chọn và append vào FormData
        for (let i = 0; i < selectedFiles.length; i++) {
            formData.append('chungTuFiles', selectedFiles[i]);
        }
        uploadMutation.mutate(formData);
    };

    const toggleRow = (id) => {
        setExpandedRows(prev => prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]);
    };

    const renderFileIcon = (url) => {
        try {
            const extension = new URL(url).pathname.split('.').pop().toLowerCase();
            if (['pdf'].includes(extension)) {
                return <FaFilePdf className="mr-2 text-red-500" />;
            } else if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(extension)) {
                return <FaFileImage className="mr-2 text-blue-500" />;
            }
        } catch (e) { /* Ignore error */ }
        return <FaFileImage className="mr-2 text-gray-500" />;
    };

    // Hàm lấy tên file từ URL
    const getFileNameFromUrl = (url) => {
        try {
            return decodeURIComponent(new URL(url).pathname.split('/').pop());
        } catch (e) { return "file_chung_tu"; }
    }

    // --- Gom nhóm dữ liệu cho bảng ---
    const groupedData = useMemo(() => {
        const thietBiList = phieuNhapData?.thongTinThietBi || [];
        return thietBiList.reduce((acc, item) => {
            const existing = acc.find((tb) => tb.thietbi_id === item.thietbi_id);
            if (existing) {
                existing.soLuong += 1;
                existing.tongTien += item.donGia || 0;
                existing.chiTiet.push(item);
            } else {
                acc.push({
                    thietbi_id: item.thietbi_id,
                    tenThietBi: item.tenThietBi,
                    thoiGianBaoHanh: item.thoiGianBaoHanh,
                    donGia: item.donGia || 0,
                    soLuong: 1,
                    tongTien: item.donGia || 0,
                    chiTiet: [item],
                });
            }
            return acc;
        }, []);
    }, [phieuNhapData?.thongTinThietBi]);

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
    if (!phieuNhapId) return null; // Không render gì nếu không có ID
    if (isLoading) return <div className="p-4"><p>Chờ tải dữ liệu...</p></div>;
    if (error) return <p className="p-4 text-red-500">Lỗi tải chi tiết: {error.message}</p>;
    if (!phieuNhapData || !phieuNhapData.phieuNhap || !phieuNhapData.thongTinThietBi) {
        console.error("Dữ liệu trả về từ API getPhieuNhapById không đúng cấu trúc:", phieuNhapData);
        return <p className="p-4 text-orange-500">Dữ liệu chi tiết phiếu nhập không hợp lệ hoặc không tìm thấy.</p>;
    }

    const { phieuNhap, thongTinThietBi } = phieuNhapData;

    return (
        <div className="space-y-4 text-sm">
            {/* Thông tin phiếu nhập */}
            <div className="p-4">
                <h3 className="mb-2 text-base font-semibold text-green-700">Thông tin chung</h3>
                <dl className="space-y-1.5">
                    <div className="flex">
                        <dt className="w-1/3 font-medium text-gray-500">ID Phiếu Nhập:</dt>
                        <dd className="w-2/3 font-medium text-green-800 ">PN{phieuNhap.id}</dd>
                    </div>
                    <div className="flex">
                        <dt className="w-1/3 font-medium text-gray-500">Ngày tạo:</dt>
                        <dd className="w-2/3 text-gray-800">{formatDate(phieuNhap.ngayTao)}</dd>
                    </div>
                    <div className="flex">
                        <dt className="w-1/3 font-medium text-gray-500">Người Tạo:</dt>
                        <dd className="w-2/3 text-gray-800">{phieuNhap.nguoiTao || "Chưa có"}</dd>
                    </div>
                    <div className="flex">
                        <dt className="w-1/3 font-medium text-gray-500">Trường Hợp Nhập:</dt>
                        {/* Chỉ hiển thị text, không cần select */}
                        <dd className="w-2/3 text-gray-800">{getTinhTrangLabel(phieuNhap.truongHopNhap)}</dd>
                    </div>
                </dl>
            </div>

            {/* Danh sách thiết bị nhập */}
            <div className="p-4 border-t">
                <h3 className="mb-2 text-base font-semibold text-green-700 ">Danh Sách Thiết Bị Nhập (Tổng {thongTinThietBi?.length || 0} TB)</h3>
                {groupedData.length > 0 ? (
                    <div className="overflow-x-auto border rounded-md">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên Thiết Bị</th>
                                    <th class="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Số Lượng</th>
                                    <th class="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">BH (Tháng)</th>
                                    <th class="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Đơn Giá</th>
                                    <th class="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Tổng Tiền</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {groupedData.map((tb) => (
                                    <React.Fragment key={tb.thietbi_id}>
                                        <tr className="text-sm">
                                            <td className="px-3 py-2 whitespace-nowrap">
                                                <button onClick={() => toggleRow(tb.thietbi_id)} className="flex items-center hover:text-indigo-600">
                                                    {expandedRows.includes(tb.thietbi_id) ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
                                                    <span className="ml-2 font-medium">{tb.tenThietBi}</span>
                                                </button>
                                            </td>
                                            <td className="px-3 py-2 text-center whitespace-nowrap">{tb.soLuong}</td>
                                            <td className="px-3 py-2 text-center whitespace-nowrap">{tb.thoiGianBaoHanh}</td>
                                            <td className="px-3 py-2 text-right border-b">{formatPrice(tb.donGia)}</td>
                                            <td className="px-3 py-2 font-medium text-right border-b">{formatPrice(tb.tongTien)}</td>
                                        </tr>
                                        {/* Bảng con chi tiết */}
                                        {expandedRows.includes(tb.thietbi_id) && (
                                            <tr className="bg-gray-50">
                                                <td colSpan="5" className="px-3 py-2 border-t">
                                                    <div className="pl-6">
                                                        <p className="mb-1 text-xs font-medium text-gray-600">Mã định danh chi tiết:</p>
                                                        <ul className="list-disc list-inside space-y-0.5 text-xs text-gray-500">
                                                            {tb.chiTiet.map((detail) => (
                                                                <li key={detail.id}>ID: {detail.id}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="italic text-gray-500">Phiếu nhập này chưa có thiết bị.</p>
                )}
            </div>

            {/* === Phần Chứng từ đính kèm === */}
            <div className="p-4 border-t">
                <h3 className="mb-2 text-base font-semibold text-green-700">Chứng từ đính kèm</h3>
                {/* Danh sách chứng từ đã upload */}
                <div className="mb-3 space-y-1">
                    {(phieuNhap?.danhSachChungTu && phieuNhap.danhSachChungTu.length > 0) ? (
                        phieuNhap.danhSachChungTu.map((url, index) => (
                            <a
                                key={index}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center text-xs text-indigo-600 break-all hover:text-indigo-800 hover:underline"
                                title={getFileNameFromUrl(url)}
                            >
                                {renderFileIcon(url)}
                                {getFileNameFromUrl(url)}
                            </a>
                        ))
                    ) : (
                        <p className="text-xs italic text-gray-500">Chưa có chứng từ nào.</p>
                    )}
                </div>

                {/* Form upload chứng từ mới */}
                <div className="flex items-center space-x-2">
                    <input
                        type="file"
                        multiple 
                        ref={fileInputRef} 
                        onChange={handleFileChange}
                        className="block w-full text-xs text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-green-700 hover:file:bg-indigo-100"
                        accept="image/*,.pdf"
                    />
                    <button
                        onClick={handleUploadSubmit}
                        disabled={!selectedFiles || selectedFiles.length === 0 || uploadMutation.isPending}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-700 disabled:opacity-50"
                    >
                        {uploadMutation.isPending ? (
                            <FaSpinner className="w-4 h-4 mr-2 -ml-1 animate-spin" />
                        ) : (
                            <FaUpload className="mr-1.5 h-4 w-4" />
                        )}
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

export default ChiTietNhap;
