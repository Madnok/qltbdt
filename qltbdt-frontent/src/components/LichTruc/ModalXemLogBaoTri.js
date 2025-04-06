import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getBaoHongLogAPI } from '../../api';
import moment from 'moment';
import {
    FaTimesCircle, FaUserTie, FaClock, FaWrench, FaCheckCircle,
    FaBan, FaShippingFast, FaExclamationCircle,
    FaImage, FaPaperclip
} from 'react-icons/fa';

const ModalXemLogBaoTri = ({ baoHongId, phongName, onClose }) => {
    const { data: logs = [], isLoading, isError, error } = useQuery({
        queryKey: ['baoHongLog', baoHongId],
        queryFn: () => getBaoHongLogAPI(baoHongId),
        enabled: !!baoHongId,
    });

    const renderKetQuaIcon = (ketQua) => {
        switch (ketQua) {
            case 'Đã sửa chữa xong': return <FaCheckCircle className="text-green-500" />;
            case 'Đã gửi bảo hành': return <FaShippingFast className="text-blue-500" />;
            case 'Đề xuất thanh lý': return <FaBan className="text-red-500" />;
            case 'Không tìm thấy lỗi / Không cần xử lý': return <FaExclamationCircle className="text-yellow-500" />;
            case 'Chuyển cho bộ phận khác': return <FaWrench className="text-gray-500" /> // Ví dụ thêm icon
            default: return <FaWrench />;
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black bg-opacity-60">
            <div className="w-full max-w-3xl bg-white rounded-lg shadow-xl max-h-[85vh] flex flex-col">
                {/* Header Modal */}
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-xl font-semibold">Lịch sử Bảo trì - {phongName} (BH ID: {baoHongId})</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <FaTimesCircle size={24} />
                    </button>
                </div>

                {/* Body Modal (Scrollable) */}
                <div className="flex-grow p-4 overflow-y-auto">
                    {isLoading && <p className="text-center text-gray-500">Đang tải lịch sử...</p>}
                    {isError && <p className="text-center text-red-500">Lỗi khi tải lịch sử: {error.message}</p>}
                    {!isLoading && !isError && logs.length === 0 && <p className="italic text-center text-gray-500">Chưa có ghi nhận hoạt động nào.</p>}
                    {!isLoading && !isError && logs.length > 0 && (
                        <ul className="space-y-5"> {/* Tăng khoảng cách giữa các log */}
                            {logs.map(log => (
                                <li key={log.id} className="p-4 bg-white border rounded-lg shadow-sm">
                                    {/* Dòng 1: Tên NV và Thời gian */}
                                    <div className="flex flex-wrap items-center justify-between mb-2 text-sm text-gray-600">
                                        <span className="flex items-center mr-4 font-medium"><FaUserTie className="mr-1.5 text-gray-500" /> {log.tenNhanVien}</span>
                                        <span className="flex items-center text-gray-500"><FaClock className="mr-1.5" /> {moment(log.thoiGian).format('DD/MM/YYYY HH:mm:ss')}</span>
                                    </div>

                                    {/* Dòng 2: Hoạt động */}
                                    <div className="mb-3">
                                        <p className="text-sm font-medium text-gray-800 mb-0.5">Hoạt động:</p>
                                        <p className="pl-4 text-sm text-gray-700 whitespace-pre-wrap">{log.hoatdong || <span className="italic">Không có mô tả</span>}</p>
                                    </div>

                                    {/* Dòng 3: Kết quả */}
                                    <div className="mb-3">
                                        <p className="text-sm font-medium text-gray-800 mb-0.5">Kết quả:</p>
                                        <p className="flex items-center pl-4 text-sm">
                                            {renderKetQuaIcon(log.ketQuaXuLy)}
                                            <span className="ml-1.5">{log.ketQuaXuLy || <span className="italic">Chưa xác định</span>}</span>
                                        </p>
                                    </div>

                                    {/* Dòng 4: Thông tin Vật tư (Luôn hiển thị mục này) */}
                                    <div className="p-3 mt-3 text-sm border border-dashed rounded bg-gray-50">
                                        <p className="mb-1 font-medium text-gray-800">Thông tin Vật tư/Dịch vụ:</p>
                                        {log.suDungVatTu ? (
                                            <>
                                                <p className="pl-4 mb-1 text-gray-700 whitespace-pre-wrap">{log.ghiChuVatTu || <span className="italic">Không có ghi chú vật tư</span>}</p>
                                                {/* Phần chi phí chỉ hiển thị bên trong nếu có dùng vật tư */}
                                                <p className="pl-4 text-gray-700">
                                                    <strong>Chi phí:</strong>
                                                    {(typeof log.chiPhi === 'number' && log.chiPhi > 0) ? (
                                                        ` ${log.chiPhi.toLocaleString('vi-VN')} VND`
                                                    ) : (
                                                        ` 0 VND`
                                                    )}
                                                </p>
                                            </>
                                        ) : (
                                            // Hiển thị nếu không dùng vật tư
                                            <p className="pl-4 italic text-gray-500">Không sử dụng vật tư/dịch vụ.</p>
                                        )}
                                    </div>

                                    {/* Dòng 5: Hình ảnh Hóa đơn/Chứng từ (Luôn hiển thị mục này) */}
                                    <div className="mt-3">
                                        <p className="mb-1 text-sm font-medium text-gray-800">Hóa đơn/Chứng từ:</p>
                                        <div className="pl-4">
                                            {/* Chỉ hiển thị link nếu có dùng vật tư VÀ có urls */}
                                            {(log.suDungVatTu && log.hinhAnhHoaDonUrls && log.hinhAnhHoaDonUrls.length > 0) ? (
                                                <div className="flex flex-wrap gap-3">
                                                    {log.hinhAnhHoaDonUrls.map((url, idx) => (
                                                        <a
                                                            key={idx}
                                                            href={url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center px-2 py-1 text-xs text-blue-600 border border-blue-300 rounded hover:bg-blue-50"
                                                            title={`Xem file ${idx + 1}`}
                                                        >
                                                            {/\.(jpe?g|png|gif)$/i.test(url) ? <FaImage className="mr-1" /> : <FaPaperclip className="mr-1" />}
                                                            File {idx + 1}
                                                        </a>
                                                    ))}
                                                </div>
                                            ) : (
                                                // Hiển thị "Không có" nếu không dùng vật tư HOẶC mảng rỗng
                                                <span className="text-sm italic text-gray-500">Không có</span>
                                            )}
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Footer Modal */}
                <div className="px-4 py-3 border-t bg-gray-50 sm:px-6">
                    <button
                        type="button"
                        className="inline-flex justify-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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