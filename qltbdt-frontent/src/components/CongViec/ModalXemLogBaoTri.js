import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchLogsAPI } from '../../api';
import moment from 'moment';
import {
    FaTimesCircle, FaUserTie, FaClock, FaWrench, FaCheckCircle,
    FaBan, FaShippingFast, FaExclamationCircle, FaSpinner,
    FaPaperclip, FaCamera, FaRoute, FaInfoCircle,
    FaHashtag, FaQuestionCircle, FaPlay
} from 'react-icons/fa';

// Props giữ nguyên
const ModalXemLogBaoTri = ({ lichbaoduongId, baohongId, thongtinthietbiId, tenThietBi, phongName, onClose }) => {

    // **Xác định params và queryKey cho useQuery dựa trên props**
    const queryParams = useMemo(() => {
        if (lichbaoduongId) return { lichbaoduong_id: lichbaoduongId };
        if (baohongId) return { baohong_id: baohongId };
        if (thongtinthietbiId) return { thongtinthietbi_id: thongtinthietbiId };
        return null; // Không có ID hợp lệ
    }, [baohongId, lichbaoduongId, thongtinthietbiId]);

    // **Cập nhật useQuery để gọi hàm API hợp nhất**
    const { data: logs = [], isLoading, isError, error } = useQuery({
        // queryKey nên bao gồm params để phân biệt cache
        queryKey: ['baotriLogs', queryParams],
        // queryFn gọi hàm fetchLogsAPI duy nhất với params đã xác định
        queryFn: () => fetchLogsAPI(queryParams),
        // Chỉ chạy khi có params hợp lệ (queryParams không phải null)
        enabled: !!queryParams,
        staleTime: 5 * 60 * 1000, // Cache 5 phút (tùy chọn)
    });

    // Xác định tiêu đề Modal (logic giữ nguyên)
    const modalTitle = useMemo(() => {
        if (queryParams?.lichbaoduong_id) return `Lịch sử Bảo dưỡng (Lịch ID: ${queryParams.lichbaoduong_id})`;
        if (queryParams?.baohong_id) return `Lịch sử Sửa chữa (Báo hỏng ID: ${queryParams.baohong_id})`;
        if (queryParams?.thongtinthietbi_id) return `Lịch sử Thiết bị: ${tenThietBi || `ID ${queryParams.thongtinthietbi_id}`}`;
        return 'Lịch sử Bảo trì';
    }, [queryParams, tenThietBi]);

    // Hàm render icon kết quả (giữ nguyên)
    const renderKetQuaIcon = (ketQua) => {
        switch (ketQua) {
            case 'Đã sửa chữa xong': return <FaCheckCircle className="text-green-500" />;
            case 'Đã gửi bảo hành': return <FaShippingFast className="text-blue-500" />;
            case 'Đã nhận từ bảo hành': return <FaCheckCircle className="text-teal-500" />; 
            case 'Đề xuất thanh lý': return <FaBan className="text-red-500" />;
            case 'Không tìm thấy lỗi / Không cần xử lý': return <FaExclamationCircle className="text-yellow-500" />;
            case 'Chuyển cho bộ phận khác': return <FaWrench className="text-gray-500" />;
            default: return <FaQuestionCircle className='text-gray-400' />; // Icon mặc định
        }
    };

    // Hàm render file preview (ảnh hoặc link)
    const renderFilePreview = (url, keyPrefix) => {
        const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
        // Trích xuất tên file gốc nếu có thể (sau ký tự cuối cùng '/')
        const fileNameMatch = url.match(/[^/]+$/);
        const fileName = fileNameMatch ? fileNameMatch[0] : 'file'; // Fallback

        // Giới hạn độ dài tên file hiển thị nếu cần
        const displayFileName = fileName.length > 20 ? fileName.substring(0, 17) + '...' : fileName;

        if (isImage) {
            return (
                <a key={`${keyPrefix}-${fileName}`} href={url} target="_blank" rel="noopener noreferrer" title={`Xem ảnh: ${fileName}`}>
                    <img src={url} alt={`Ảnh ${fileName}`} className="object-cover w-16 h-16 border rounded cursor-pointer hover:opacity-80 transition-opacity" />
                </a>
            );
        } else {
            // Giả sử các file khác là PDF hoặc link download
            return (
                <a key={`${keyPrefix}-${fileName}`} href={url} target="_blank" rel="noopener noreferrer" title={`Tải/Xem file: ${fileName}`} className="flex flex-col items-center justify-center w-16 h-16 text-xs text-center text-blue-600 border rounded bg-gray-50 hover:bg-blue-100 transition-colors">
                    <FaPaperclip className="w-5 h-5 mb-1 text-gray-500" />
                    <span className="block overflow-hidden whitespace-nowrap text-ellipsis w-full px-1">{displayFileName}</span>
                </a>
            );
        }
    };


    // Component Popup giờ chỉ cần quản lý isOpen và onClose
    return (
        <div
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="w-full max-w-4xl bg-white rounded-lg shadow-xl max-h-[90vh] flex flex-col overflow-hidden" // Thêm overflow-hidden
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header Modal */}
                <div className="flex items-start justify-between p-4 border-b sticky top-0 bg-white z-10 shrink-0"> {/* Header không scroll */}
                    <div>
                        <h2 className="text-xl font-semibold">{modalTitle}</h2>
                        {/* Thông tin context */}
                        {tenThietBi && <p className="mt-1 text-sm text-gray-600">Thiết bị: <span className="font-medium">{tenThietBi} {thongtinthietbiId ? `(ID: ${thongtinthietbiId})` : ''}</span></p>}
                        {phongName && <p className="text-sm text-gray-600">Phòng: <span className="font-medium">{phongName}</span></p>}
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <FaTimesCircle size={24} />
                    </button>
                </div>
                {/* Body Modal */}
                <div className="flex-grow p-4 overflow-y-auto">
                    {isLoading && (<div className="flex justify-center items-center p-8"><FaSpinner className="animate-spin text-2xl text-blue-500" /> <span className="ml-2">Đang tải lịch sử...</span> </div>)}
                    {isError && <p className="text-center text-red-500">Lỗi khi tải lịch sử: {error?.response?.data?.message || error.message}</p>}
                    {!isLoading && !isError && logs.length === 0 && <p className="italic text-center text-gray-500">Không có lịch sử nào được ghi nhận.</p>}
                    {!isLoading && !isError && logs.length > 0 && (
                        <ul className="space-y-5">
                            {logs.map(log => (
                                <li key={log.id} className="p-4 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
                                    {/* Phần hiển thị chi tiết log giữ nguyên */}
                                    {queryParams?.thongtinthietbi_id && log.lichbaoduong_id && <p className="text-xs text-purple-600 mb-1 flex items-center"><FaHashtag className='mr-1' /> Thuộc Lịch BD ID: {log.lichbaoduong_id}</p>}
                                    {queryParams?.thongtinthietbi_id && log.baohong_id && <p className="text-xs text-orange-600 mb-1 flex items-center"><FaHashtag className='mr-1' /> Từ Báo Hỏng ID: {log.baohong_id}</p>}
                                    <div className="flex flex-wrap items-center justify-between mb-2 text-sm text-gray-600"> <span className="flex items-center mr-4 font-medium"><FaUserTie className="mr-1.5 text-gray-500" /> {log.tenNhanVien || (log.nhanvien_id ? `NV ID: ${log.nhanvien_id}` : <span className='italic'>Không rõ</span>)} </span> <span className="flex items-center text-gray-500"><FaClock className="mr-1.5" /> {moment(log.thoiGian).format('DD/MM/YYYY HH:mm:ss')}</span> </div>
                                    {log.moTaGoc && <p className="mb-2 text-xs italic text-gray-500">Mô tả gốc: {log.moTaGoc}</p>}
                                    <div className="mb-3"> <p className="flex items-center text-sm font-medium text-gray-800 mb-0.5"><FaPlay className="mr-1.5 text-gray-500" />Hoạt động:</p> <p className="pl-4 text-sm text-gray-700 whitespace-pre-wrap">{log.hoatdong || <span className="italic">Không có mô tả</span>}</p> </div>
                                    {log.hinhAnhHongHocUrls && log.hinhAnhHongHocUrls.length > 0 && (<div className="mb-3"> <p className="flex items-center mb-1 text-sm font-medium text-gray-800"><FaCamera className="mr-1.5 text-gray-500" /> Ảnh xác nhận/công việc:</p> <div className="pl-4 flex flex-wrap gap-2"> {log.hinhAnhHongHocUrls.map((url, idx) => renderFilePreview(url, `damage-${log.id}-${idx}`))} </div> </div>)}
                                    <div className="mb-3"> <p className="flex items-center text-sm font-medium text-gray-800 mb-0.5"><FaRoute className="mr-1.5 text-gray-500" /> Phương án xử lý:</p> <p className="pl-4 text-sm text-gray-700">{log.phuongAnXuLy || <span className="italic">Chưa chọn</span>}</p> {log.phuongAnXuLy === 'Khác' && log.phuongAnKhacChiTiet && (<p className="flex items-start pl-8 mt-1 text-xs text-gray-600"> <FaInfoCircle className="mr-1 mt-0.5 flex-shrink-0" /> Chi tiết: {log.phuongAnKhacChiTiet} </p>)} </div>
                                    <div className="mb-3"> <p className="flex items-center text-sm font-medium text-gray-800 mb-0.5"><FaQuestionCircle className="mr-1.5 text-gray-500" />Kết quả:</p> <p className="flex items-center pl-4 text-sm"> {renderKetQuaIcon(log.ketQuaXuLy)} <span className="ml-1.5">{log.ketQuaXuLy || <span className="italic">Chưa xác định</span>}</span> </p> </div>
                                    <div className="p-3 mt-3 text-sm border border-dashed rounded bg-gray-50"> <p className="mb-1 font-medium text-gray-800">Thông tin Vật tư/Dịch vụ:</p> {log.suDungVatTu ? (<> <p className="pl-4 mb-1 text-gray-700 whitespace-pre-wrap">{log.ghiChuVatTu || <span className="italic">Không có ghi chú vật tư</span>}</p> <p className="pl-4 text-gray-700"><strong>Chi phí:</strong> {(typeof log.chiPhi === 'number' && !isNaN(log.chiPhi)) ? ` ${log.chiPhi.toLocaleString('vi-VN')} VND` : ` 0 VND`} </p> {log.hinhAnhHoaDonUrls && log.hinhAnhHoaDonUrls.length > 0 && (<div className="mt-2"> <p className="mb-1 text-xs font-semibold text-gray-600">Hóa đơn/Chứng từ:</p> <div className="pl-4 flex flex-wrap gap-2"> {log.hinhAnhHoaDonUrls.map((url, idx) => renderFilePreview(url, `invoice-${log.id}-${idx}`))} </div> </div>)} </>) : (<p className="pl-4 italic text-gray-500">Không sử dụng vật tư/dịch vụ.</p>)} </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Footer Modal */}
                <div className="px-4 py-3 border-t bg-gray-50 text-right shrink-0"> 
                    <button type="button" className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" onClick={onClose}> Đóng </button>
                </div>
            </div>
        </div>
    );
};

export default ModalXemLogBaoTri;