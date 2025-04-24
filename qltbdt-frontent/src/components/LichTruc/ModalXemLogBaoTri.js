// import React from 'react';
// import { useQuery } from '@tanstack/react-query';
// import { fetchBaoTriByThietBiAPI } from '../../api';
// import moment from 'moment';
// import {
//     FaTimesCircle, FaUserTie, FaClock, FaWrench, FaCheckCircle,
//     FaBan, FaShippingFast, FaExclamationCircle,
//     FaImage, FaPaperclip, FaCamera, FaRoute, FaInfoCircle,
//     FaHashtag, FaQuestionCircle, FaPlay 
// } from 'react-icons/fa';

// const ModalXemLogBaoTri = ({ isOpen, lichbaoduongId, thongtinthietbiId, tenThietBi, phongName, onClose }) => {
//     const { data: logs = [], isLoading, isError, error } = useQuery({

//         queryKey: ['lichSuThietBi', thongtinthietbiId],
//         queryFn: () => fetchBaoTriByThietBiAPI(thongtinthietbiId),
//         enabled: !!thongtinthietbiId,
//     });

//     const renderKetQuaIcon = (ketQua) => {
//         switch (ketQua) {
//             case 'Đã sửa chữa xong': return <FaCheckCircle className="text-green-500" />;
//             case 'Đã gửi bảo hành': return <FaShippingFast className="text-blue-500" />;
//             case 'Đề xuất thanh lý': return <FaBan className="text-red-500" />;
//             case 'Không tìm thấy lỗi / Không cần xử lý': return <FaExclamationCircle className="text-yellow-500" />;
//             case 'Chuyển cho bộ phận khác': return <FaWrench className="text-gray-500" /> // Ví dụ thêm icon
//             default: return <FaWrench />;
//         }
//     };

//     return (
//         <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black bg-opacity-60">
//             <div className="w-full max-w-4xl bg-white rounded-lg shadow-xl max-h-[90vh] flex flex-col">
//                 {/* Header Modal */}
//                 <div className="flex items-start justify-between p-4 border-b">
//                     <div>
//                         {/* Tiêu đề mới */}
//                         <h2 className="text-xl font-semibold">Lịch sử Bảo trì Thiết bị</h2>
//                         {/* Hiển thị thông tin thiết bị và phòng */}
//                         <p className="mt-1 text-sm text-gray-600">
//                             Thiết bị: <span className="font-medium">{tenThietBi || 'Không rõ tên'} (ID: {thongtinthietbiId})</span>
//                         </p>
//                         <p className="text-sm text-gray-600">
//                             Phòng: <span className="font-medium">{phongName || 'Không rõ'}</span>
//                         </p>
//                     </div>
//                     <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
//                         <FaTimesCircle size={24} />
//                     </button>
//                 </div>

//                 {/* Body Modal */}
//                 <div className="flex-grow p-4 overflow-y-auto">
//                     {isLoading && <p className="text-center text-gray-500">Đang tải lịch sử...</p>}
//                     {isError && <p className="text-center text-red-500">Lỗi khi tải lịch sử: {error?.response?.data?.message || error.message}</p>}
//                     {!isLoading && !isError && logs.length === 0 && <p className="italic text-center text-gray-500">Thiết bị này chưa có lịch sử bảo trì.</p>}
//                     {!isLoading && !isError && logs.length > 0 && (
//                         <ul className="space-y-5">
//                             {logs.map(log => (
//                                 <li key={log.id} className="p-4 bg-white border rounded-lg shadow-sm">
//                                     {/* Dòng 0: Tên NV và Thời gian */}
//                                     <div className="flex flex-wrap items-center justify-between mb-2 text-sm text-gray-600">
//                                         <span className="flex items-center mr-4 font-medium">
//                                             <FaUserTie className="mr-1.5 text-gray-500" />
//                                             {log.tenNhanVienThucHien || (log.nhanvien_id ? `NV ID: ${log.nhanvien_id}` : <span className='italic'>Không rõ</span>)}
//                                         </span>
//                                         <span className="flex items-center text-gray-500"><FaClock className="mr-1.5" /> {moment(log.thoiGian).format('DD/MM/YYYY HH:mm:ss')}</span>
//                                     </div>

//                                     {/* Dòng 1: Hiển thị ID báo hỏng gốc nếu có */}
//                                     <div className="mb-3 text-xs text-gray-500">
//                                         <span className="flex items-center">
//                                             <FaHashtag className="mr-1.5" />
//                                             ID Báo Hỏng Liên Quan: {log.baohong_id || <span className="italic" > N/A (Đã xóa)</span>}
//                                             {/* Có thể thêm link tới báo hỏng gốc nếu nó chưa bị xóa */}
//                                             {log.moTaBaoHongGoc && log.baohong_id && <span className='ml-2 italic truncate' title={log.moTaBaoHongGoc}>Mô Tả Báo Hỏng: "{log.moTaBaoHongGoc}"</span>}
//                                         </span>
//                                     </div>

//                                     {/* Dòng 2: Hoạt động */}
//                                     <div className="mb-3">
//                                         <p className="flex items-center text-sm font-medium text-gray-800 mb-0.5"><FaPlay className="mr-1.5 text-gray-500" />Hoạt động:</p>
//                                         <p className="pl-4 text-sm text-gray-700 whitespace-pre-wrap">{log.hoatdong || <span className="italic">Không có mô tả</span>}</p>
//                                     </div>

//                                     {/* Dòng 3: Ảnh xác nhận hỏng hóc === */}
//                                     <div className="mb-3">
//                                         <p className="flex items-center mb-1 text-sm font-medium text-gray-800"><FaCamera className="mr-1.5 text-gray-500" /> Ảnh xác nhận hỏng hóc:</p>
//                                         <div className="pl-4">
//                                             {log.hinhAnhHongHocUrls && log.hinhAnhHongHocUrls.length > 0 ? (
//                                                 <div className="flex flex-wrap gap-3">
//                                                     {log.hinhAnhHongHocUrls.map((url, idx) => (
//                                                         <a key={idx}
//                                                             href={url}
//                                                             target="_blank"
//                                                             rel="noopener noreferrer"
//                                                             className="inline-flex items-center px-2 py-1 text-xs text-blue-600 border border-blue-300 rounded hover:bg-blue-50"
//                                                             title={`Xem file ${idx + 1}`}
//                                                         >
//                                                             {/\.(jpe?g|png|gif)$/i.test(url) ? <FaImage className="mr-1" /> : <FaPaperclip className="mr-1" />}
//                                                             Ảnh {idx + 1}
//                                                         </a>
//                                                     ))}
//                                                 </div>
//                                             ) : (
//                                                 <span className="text-sm italic text-gray-500">Không có</span>
//                                             )}
//                                         </div>
//                                     </div>

//                                     {/* Dòng 4: Phương án xử lý */}
//                                     <div className="mb-3">
//                                         <p className="flex items-center text-sm font-medium text-gray-800 mb-0.5"><FaRoute className="mr-1.5 text-gray-500" /> Phương án xử lý:</p>
//                                         <p className="pl-4 text-sm text-gray-700">{log.phuongAnXuLy || <span className="italic">Chưa chọn</span>}</p>
//                                         {/* Hiển thị chi tiết nếu là 'Khác' */}
//                                         {log.phuongAnXuLy === 'Khác' && log.phuongAnKhacChiTiet && (
//                                             <p className="flex items-start pl-8 mt-1 text-xs text-gray-600">
//                                                 <FaInfoCircle className="mr-1 mt-0.5 flex-shrink-0" /> Chi tiết: {log.phuongAnKhacChiTiet}
//                                             </p>
//                                         )}
//                                     </div>

//                                     {/* Dòng 5: Kết quả */}
//                                     <div className="mb-3">
//                                         <p className="flex items-center text-sm font-medium text-gray-800 mb-0.5"><FaQuestionCircle className="mr-1.5 text-gray-500" />Kết quả:</p>
//                                         <p className="flex items-center pl-4 text-sm">
//                                             {renderKetQuaIcon(log.ketQuaXuLy)}
//                                             <span className="ml-1.5">{log.ketQuaXuLy || <span className="italic">Chưa xác định</span>}</span>
//                                         </p>
//                                     </div>

//                                     {/* Dòng 6: Thông tin Vật tư (Luôn hiển thị mục này) */}
//                                     <div className="p-3 mt-3 text-sm border border-dashed rounded bg-gray-50">
//                                         <p className="mb-1 font-medium text-gray-800">Thông tin Vật tư/Dịch vụ:</p>
//                                         {log.suDungVatTu ? (
//                                             <>
//                                                 {/* ... (Hiển thị ghi chú vật tư, chi phí) ... */}
//                                                 <p className="pl-4 mb-1 text-gray-700 whitespace-pre-wrap">{log.ghiChuVatTu || <span className="italic">Không có ghi chú vật tư</span>}</p>
//                                                 <p className="pl-4 text-gray-700"><strong>Chi phí:</strong>
//                                                     {(typeof log.chiPhi === 'number' && log.chiPhi > 0) ? (
//                                                         ` ${log.chiPhi.toLocaleString('vi-VN')} VND`
//                                                     ) : (
//                                                         ` 0 VND`
//                                                     )}
//                                                 </p>

//                                                 <div className="mt-2">
//                                                     <p className="mb-1 text-xs font-semibold text-gray-600">Hóa đơn/Chứng từ:</p>
//                                                     <div className="pl-4">
//                                                         {(log.hinhAnhHoaDonUrls && log.hinhAnhHoaDonUrls.length > 0) ? (
//                                                             <div className="flex flex-wrap gap-3">
//                                                                 {log.hinhAnhHoaDonUrls.map((url, idx) => (
//                                                                     <a
//                                                                         key={idx}
//                                                                         href={url}
//                                                                         target="_blank"
//                                                                         rel="noopener noreferrer"
//                                                                         className="inline-flex items-center px-2 py-1 text-xs text-blue-600 border border-blue-300 rounded hover:bg-blue-50"
//                                                                         title={`Xem file ${idx + 1}`}
//                                                                     >
//                                                                         {/\.(jpe?g|png|gif)$/i.test(url) ? <FaImage className="mr-1" /> : <FaPaperclip className="mr-1" />}
//                                                                         File {idx + 1}
//                                                                     </a>
//                                                                 ))}
//                                                             </div>
//                                                         ) : (
//                                                             <span className="text-sm italic text-gray-500">Không có</span>
//                                                         )}
//                                                     </div>
//                                                 </div>
//                                             </>
//                                         ) : (
//                                             <p className="pl-4 italic text-gray-500">Không sử dụng vật tư/dịch vụ.</p>
//                                         )}
//                                     </div>
//                                 </li>

//                             ))}
//                         </ul>
//                     )}
//                 </div>

//                 {/* Footer Modal */}
//                 <div className="px-4 py-3 border-t bg-gray-50 sm:px-6">
//                     <button
//                         type="button"
//                         className="inline-flex justify-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
//                         onClick={onClose}
//                     >
//                         Đóng
//                     </button>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default ModalXemLogBaoTri;

import React from 'react';
import { useQuery } from '@tanstack/react-query';
// Sửa đổi import: Import đủ các hàm API cần dùng
import {
    fetchBaoTriByThietBiAPI,
    getBaoTriLogsByLichBaoDuongIdAPI, // Hàm mới đã thêm ở api.js
    getBaoHongLogAPI                 // Hàm đã có ở api.js
} from '../../api'; // Đảm bảo đường dẫn '../../api' chính xác
import moment from 'moment';
import {
    FaTimesCircle, FaUserTie, FaClock, FaWrench, FaCheckCircle,
    FaBan, FaShippingFast, FaExclamationCircle, FaSpinner, // Thêm spinner
    FaImage, FaPaperclip, FaCamera, FaRoute, FaInfoCircle,
    FaHashtag, FaQuestionCircle, FaPlay
} from 'react-icons/fa';

// Sửa đổi Props: Thêm baohongId, bỏ isOpen vì component tự quản lý hiển thị
const ModalXemLogBaoTri = ({ lichbaoduongId, baohongId, thongtinthietbiId, tenThietBi, phongName, onClose }) => {

    // Xác định query key và query function dựa trên ID được cung cấp
    let queryKey;
    let queryFn;
    let idToUse; // Biến lưu ID đang dùng để fetch

    if (lichbaoduongId) {
        queryKey = ['lichBaoDuongLog', lichbaoduongId];
        queryFn = () => getBaoTriLogsByLichBaoDuongIdAPI(lichbaoduongId); // Gọi trực tiếp hàm import
        idToUse = lichbaoduongId;
    } else if (baohongId) {
        queryKey = ['baoHongLog', baohongId];
        queryFn = () => getBaoHongLogAPI(baohongId); // Gọi trực tiếp hàm import
        idToUse = baohongId;
    } else if (thongtinthietbiId) {
        queryKey = ['lichSuThietBi', thongtinthietbiId];
        queryFn = () => fetchBaoTriByThietBiAPI(thongtinthietbiId); // Gọi trực tiếp hàm import
        idToUse = thongtinthietbiId;
    } else {
        // Trường hợp không có ID nào hợp lệ, không fetch
        queryKey = ['noLogId'];
        queryFn = () => Promise.resolve([]); // Trả về mảng rỗng
        idToUse = null;
    }

    // Sửa enabled: Chỉ cần kiểm tra idToUse có giá trị hay không
    const { data: logs = [], isLoading, isError, error } = useQuery({
        queryKey: queryKey,
        queryFn: queryFn,
        enabled: !!idToUse, // Fetch khi có ID hợp lệ
        staleTime: 5 * 60 * 1000, // Cache 5 phút
    });

    // Xác định tiêu đề Modal dựa trên context
    let modalTitle = "Lịch sử Bảo trì"; // Tiêu đề mặc định
    if (lichbaoduongId) modalTitle = `Lịch sử cho Lịch Bảo Dưỡng ID: ${lichbaoduongId}`;
    else if (baohongId) modalTitle = `Lịch sử xử lý Báo Hỏng ID: ${baohongId}`;
    else if (thongtinthietbiId) modalTitle = `Lịch sử Bảo trì Thiết bị (ID: ${thongtinthietbiId})`;

    const renderKetQuaIcon = (ketQua) => {
        switch (ketQua) {
            case 'Đã sửa chữa xong': return <FaCheckCircle className="text-green-500" />;
            case 'Đã gửi bảo hành': return <FaShippingFast className="text-blue-500" />;
            case 'Đề xuất thanh lý': return <FaBan className="text-red-500" />;
            case 'Không tìm thấy lỗi / Không cần xử lý': return <FaExclamationCircle className="text-yellow-500" />;
            case 'Chuyển cho bộ phận khác': return <FaWrench className="text-gray-500" />;
            default: return <FaWrench />;
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm"> {/* Thêm backdrop-blur-sm nếu muốn */}
            <div className="w-full max-w-4xl bg-white rounded-lg shadow-xl max-h-[90vh] flex flex-col">
                {/* Header Modal */}
                <div className="flex items-start justify-between p-4 border-b sticky top-0 bg-white z-10"> {/* Thêm sticky header */}
                    <div>
                        <h2 className="text-xl font-semibold">{modalTitle}</h2>
                        {/* Hiển thị thông tin context */}
                        {tenThietBi && <p className="mt-1 text-sm text-gray-600">Thiết bị: <span className="font-medium">{tenThietBi} {thongtinthietbiId ? `(ID: ${thongtinthietbiId})` : ''}</span></p>}
                        {phongName && <p className="text-sm text-gray-600">Phòng: <span className="font-medium">{phongName}</span></p>}
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <FaTimesCircle size={24} />
                    </button>
                </div>

                {/* Body Modal */}
                <div className="flex-grow p-4 overflow-y-auto"> {/* Đảm bảo body có thể scroll */}
                    {isLoading && (
                         <div className="flex justify-center items-center p-8">
                             <FaSpinner className="animate-spin text-2xl text-blue-500" />
                             <span className="ml-2">Đang tải lịch sử...</span>
                         </div>
                     )}
                    {isError && <p className="text-center text-red-500">Lỗi khi tải lịch sử: {error?.response?.data?.message || error.message}</p>}
                    {!isLoading && !isError && logs.length === 0 && <p className="italic text-center text-gray-500">Không có lịch sử nào được ghi nhận.</p>}
                    {!isLoading && !isError && logs.length > 0 && (
                        <ul className="space-y-5">
                            {logs.map(log => (
                                <li key={log.id} className="p-4 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
                                    {/* Hiển thị ID liên quan nếu xem theo thiết bị */}
                                    {thongtinthietbiId && log.lichbaoduong_id &&
                                        <p className="text-xs text-purple-600 mb-1">Thuộc Lịch B.Dưỡng ID: {log.lichbaoduong_id}</p>
                                    }
                                    {thongtinthietbiId && log.baohong_id &&
                                        <p className="text-xs text-orange-600 mb-1">Từ Báo Hỏng ID: {log.baohong_id}</p>
                                    }
                                    {/* Dòng 0: Tên NV và Thời gian */}
                                    <div className="flex flex-wrap items-center justify-between mb-2 text-sm text-gray-600">
                                        <span className="flex items-center mr-4 font-medium">
                                            <FaUserTie className="mr-1.5 text-gray-500" />
                                            {/* Sửa: Đảm bảo truy cập đúng tên NV */}
                                            {log.tenNhanVien || (log.nhanvien_id ? `NV ID: ${log.nhanvien_id}` : <span className='italic'>Không rõ</span>)}
                                        </span>
                                        <span className="flex items-center text-gray-500"><FaClock className="mr-1.5" /> {moment(log.thoiGian).format('DD/MM/YYYY HH:mm:ss')}</span>
                                    </div>

                                    {/* Dòng 1: Hiển thị ID báo hỏng/lịch bảo dưỡng gốc (nếu xem theo ID kia hoặc thiết bị) */}
                                    {(lichbaoduongId || thongtinthietbiId) && log.baohong_id && (
                                        <div className="mb-3 text-xs text-gray-500">
                                            <span className="flex items-center">
                                                <FaHashtag className="mr-1.5" /> ID Báo Hỏng Liên Quan: {log.baohong_id}
                                            </span>
                                        </div>
                                    )}
                                    {(baohongId || thongtinthietbiId) && log.lichbaoduong_id && (
                                        <div className="mb-3 text-xs text-gray-500">
                                            <span className="flex items-center">
                                                <FaHashtag className="mr-1.5" /> ID Lịch B.Dưỡng Liên Quan: {log.lichbaoduong_id}
                                            </span>
                                        </div>
                                    )}

                                    {/* Dòng 2: Hoạt động */}
                                    <div className="mb-3">
                                        <p className="flex items-center text-sm font-medium text-gray-800 mb-0.5"><FaPlay className="mr-1.5 text-gray-500" />Hoạt động:</p>
                                        <p className="pl-4 text-sm text-gray-700 whitespace-pre-wrap">{log.hoatdong || <span className="italic">Không có mô tả</span>}</p>
                                    </div>

                                    {/* Dòng 3: Ảnh xác nhận hỏng hóc */}
                                    <div className="mb-3">
                                        <p className="flex items-center mb-1 text-sm font-medium text-gray-800"><FaCamera className="mr-1.5 text-gray-500" /> Ảnh xác nhận hỏng hóc:</p>
                                        <div className="pl-4">
                                            {(log.hinhAnhHongHocUrls && log.hinhAnhHongHocUrls.length > 0) ? (
                                                <div className="flex flex-wrap gap-3">
                                                    {log.hinhAnhHongHocUrls.map((url, idx) => (
                                                        <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-2 py-1 text-xs text-blue-600 border border-blue-300 rounded hover:bg-blue-50" title={`Xem file ${idx + 1}`}>
                                                            {/\.(jpe?g|png|gif)$/i.test(url) ? <FaImage className="mr-1" /> : <FaPaperclip className="mr-1" />} Ảnh {idx + 1}
                                                        </a>
                                                    ))}
                                                </div>
                                            ) : (<span className="text-sm italic text-gray-500">Không có</span>)}
                                        </div>
                                    </div>

                                    {/* Dòng 4: Phương án xử lý */}
                                    <div className="mb-3">
                                        <p className="flex items-center text-sm font-medium text-gray-800 mb-0.5"><FaRoute className="mr-1.5 text-gray-500" /> Phương án xử lý:</p>
                                        <p className="pl-4 text-sm text-gray-700">{log.phuongAnXuLy || <span className="italic">Chưa chọn</span>}</p>
                                        {log.phuongAnXuLy === 'Khác' && log.phuongAnKhacChiTiet && (
                                            <p className="flex items-start pl-8 mt-1 text-xs text-gray-600">
                                                <FaInfoCircle className="mr-1 mt-0.5 flex-shrink-0" /> Chi tiết: {log.phuongAnKhacChiTiet}
                                            </p>
                                        )}
                                    </div>

                                    {/* Dòng 5: Kết quả */}
                                    <div className="mb-3">
                                        <p className="flex items-center text-sm font-medium text-gray-800 mb-0.5"><FaQuestionCircle className="mr-1.5 text-gray-500" />Kết quả:</p>
                                        <p className="flex items-center pl-4 text-sm">
                                            {renderKetQuaIcon(log.ketQuaXuLy)}
                                            <span className="ml-1.5">{log.ketQuaXuLy || <span className="italic">Chưa xác định</span>}</span>
                                        </p>
                                    </div>

                                    {/* Dòng 6: Thông tin Vật tư */}
                                    <div className="p-3 mt-3 text-sm border border-dashed rounded bg-gray-50">
                                        <p className="mb-1 font-medium text-gray-800">Thông tin Vật tư/Dịch vụ:</p>
                                        {log.suDungVatTu ? (
                                            <>
                                                <p className="pl-4 mb-1 text-gray-700 whitespace-pre-wrap">{log.ghiChuVatTu || <span className="italic">Không có ghi chú vật tư</span>}</p>
                                                <p className="pl-4 text-gray-700"><strong>Chi phí:</strong>
                                                     {/* Sửa: Kiểm tra kiểu number và giá trị */}
                                                    {(typeof log.chiPhi === 'number' && !isNaN(log.chiPhi)) ? ` ${log.chiPhi.toLocaleString('vi-VN')} VND` : ` 0 VND`}
                                                </p>
                                                <div className="mt-2">
                                                    <p className="mb-1 text-xs font-semibold text-gray-600">Hóa đơn/Chứng từ:</p>
                                                    <div className="pl-4">
                                                        {(log.hinhAnhHoaDonUrls && log.hinhAnhHoaDonUrls.length > 0) ? (
                                                            <div className="flex flex-wrap gap-3">
                                                                {log.hinhAnhHoaDonUrls.map((url, idx) => (
                                                                    <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-2 py-1 text-xs text-blue-600 border border-blue-300 rounded hover:bg-blue-50" title={`Xem file ${idx + 1}`}>
                                                                        {/\.(jpe?g|png|gif)$/i.test(url) ? <FaImage className="mr-1" /> : <FaPaperclip className="mr-1" />} File {idx + 1}
                                                                    </a>
                                                                ))}
                                                            </div>
                                                        ) : (<span className="text-sm italic text-gray-500">Không có</span>)}
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <p className="pl-4 italic text-gray-500">Không sử dụng vật tư/dịch vụ.</p>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Footer Modal */}
                <div className="px-4 py-3 border-t bg-gray-50 text-right sticky bottom-0 z-10"> {/* Thêm sticky footer */}
                    <button
                        type="button"
                        className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        onClick={onClose}
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModalXemLogBaoTri;