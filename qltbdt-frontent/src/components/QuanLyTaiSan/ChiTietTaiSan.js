import React from 'react';
import { formatDate, formatCurrency } from '../../utils/helpers';
import NotFound from '../../pages/NotFound';
import { getTinhTrangLabel } from '../../utils/constants';
import { FaCheckCircle, FaTimesCircle, FaClock, FaWrench, FaTrashAlt, FaTimes, FaHistory } from 'react-icons/fa';


const ChiTietTaiSan = ({ taiSanData, onClose, triggerRefetch, onOpenLogModal }) => { 
    if (!taiSanData) return <NotFound />; 

    const renderTinhTrang = (tinhTrang) => {
        const label = getTinhTrangLabel(tinhTrang);
        switch (tinhTrang) {
            case 'con_bao_hanh': return <span className="inline-flex items-center font-semibold text-green-600"><FaCheckCircle className="mr-1" /> {label}</span>;
            case 'het_bao_hanh': return <span className="inline-flex items-center font-semibold text-red-600"><FaTimesCircle className="mr-1" /> {label}</span>;
            case 'dang_bao_hanh': return <span className="inline-flex items-center font-semibold text-blue-600"><FaWrench className="mr-1" /> {label}</span>;
            case 'cho_thanh_ly': return <span className="inline-flex items-center font-semibold text-yellow-600"><FaClock className="mr-1" /> {label}</span>;
            case 'da_thanh_ly': return <span className="inline-flex items-center font-semibold text-gray-500"><FaTrashAlt className="mr-1" /> {label}</span>;
            default: return label;
        }
    };

    return (
        <div className="relative p-4 space-y-3 text-sm">
            <div className="flex flex-row items-center justify-between pb-4 mb-3 border-b">
                <h3 className="text-xl font-bold">Chi Tiết Tài Sản</h3>
                {/* Nút đóng ở góc trên bên phải */}
                <button
                    onClick={onClose}
                    className="text-xl text-gray-500 hover:text-gray-700"
                    aria-label="Đóng chi tiết"
                >
                    <FaTimes />
                </button>
            </div>
            <h3 className="mb-2 text-lg font-bold">{taiSanData.tenLoaiThietBi || 'Chi tiết tài sản'}</h3>
            <dl className="space-y-2">
                <div className="flex">
                    <dt className="w-1/3 font-medium text-gray-500">Mã Định Danh:</dt>
                    <dd className="w-2/3 text-gray-800">{taiSanData.id}</dd>
                </div>
                <div className="flex">
                    <dt className="w-1/3 font-medium text-gray-500">ID thiết bị gốc:</dt>
                    <dd className="w-2/3 text-gray-800">{taiSanData.thietbi_id}</dd>
                </div>
                <div className="flex">
                    <dt className="w-1/3 font-medium text-gray-500">Thể loại:</dt>
                    <dd className="w-2/3 text-gray-800">{taiSanData.tenTheLoai}</dd>
                </div>
                {/* <div className="flex">
                    <dt className="w-1/3 font-medium text-gray-500">Loại thiết bị:</dt>
                    <dd className="w-2/3 text-gray-800">{taiSanData.tenLoaiThietBi}</dd>
                </div> */}
                <div className="flex">
                    <dt className="w-1/3 font-medium text-gray-500">Trạng thái:</dt>
                    <dd className="w-2/3 text-gray-800">{renderTinhTrang(taiSanData.tinhTrang)}</dd>
                </div>
                <div className="flex">
                    <dt className="w-1/3 font-medium text-gray-500">Vị trí hiện tại:</dt>
                    <dd className="w-2/3 text-gray-800">{taiSanData.phong_name || 'Chưa phân bổ'}</dd>
                </div>
                <div className="flex">
                    <dt className="w-1/3 font-medium text-gray-500">Người được cấp:</dt>
                    <dd className="w-2/3 text-gray-800">{taiSanData.tenNguoiCap || 'Chưa cấp'}</dd>
                </div>
                <hr />
                <div className="flex">
                    <dt className="w-1/3 font-medium text-gray-500">Ngày nhập kho:</dt>
                    <dd className="w-2/3 text-gray-800">{formatDate(taiSanData.ngayNhapKho)}</dd>
                </div>
                <div className="flex">
                    <dt className="w-1/3 font-medium text-gray-500">Trường hợp nhập:</dt>
                    <dd className="w-2/3 text-gray-800">{getTinhTrangLabel(taiSanData.truongHopNhap)}</dd>
                </div>
                <hr />
                <div className="flex">
                    <dt className="w-1/3 font-medium text-gray-500">Ngày hết hạn BH:</dt>
                    <dd className="w-2/3 text-gray-800">{formatDate(taiSanData.ngayBaoHanhKetThuc)}</dd>
                </div>
                <div className="flex">
                    <dt className="w-1/3 font-medium text-gray-500">Số ngày BH còn lại:</dt>
                    <dd className="w-2/3 text-gray-800">{taiSanData.ngayBaoHanhConLaiRaw ?? 'N/A'}</dd>
                </div>
                <div className="flex">
                    <dt className="w-1/3 font-medium text-gray-500">Thời gian sử dụng (tháng):</dt>
                    <dd className="w-2/3 text-gray-800">{taiSanData.tuoiThoThang ?? 'N/A'}</dd>
                </div>
                <hr />
                <div className="flex">
                    <dt className="w-1/3 font-medium text-gray-500">Ghi chú:</dt>
                    <dd className="w-2/3 text-gray-800">{taiSanData.ghiChu || 'Không có'}</dd>
                </div>
                <div className="flex">
                    <dt className="w-1/3 font-medium text-gray-500">Giá Trị:</dt>
                    <dd className="w-2/3 text-gray-800">{formatCurrency(taiSanData.giaTriBanDau) || '0'}</dd>
                </div>
                <div className="flex items-center pt-2 border-t mt-3">
                     <dt className="w-1/3 font-medium text-gray-500">Lịch sử bảo trì:</dt>
                     <dd className="w-2/3">
                         <button
                             onClick={() => onOpenLogModal(taiSanData)} 
                             className="flex items-center px-3 py-1 text-sm text-blue-700 border border-blue-300 rounded-md bg-blue-50 hover:bg-blue-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                             title="Xem toàn bộ lịch sử bảo trì/sửa chữa của thiết bị này"
                             disabled={!onOpenLogModal}
                         >
                             <FaHistory className="mr-1.5" /> Xem Log
                         </button>
                     </dd>
                 </div>
            </dl>
        </div>
    );
};

export default ChiTietTaiSan;
