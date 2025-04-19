import React, { useState, useEffect } from 'react';
import { FaSpinner, FaExclamationTriangle } from 'react-icons/fa';
import { getTTTBById } from '../../../api';
import { formatDate } from '../../../utils/helpers';
import { getTinhTrangLabel } from '../../../utils/constants';
import Popup from '../../layout/Popup';

const ChiTietThongTinThietBi = ({ tttbId, onClose }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!tttbId) return; // Không làm gì nếu không có ID

    const fetchDetails = async () => {
      setLoading(true);
      setError(null);
      setDetails(null); // Xóa chi tiết cũ
      try {
        const data = await getTTTBById(tttbId);
        setDetails(data);
      } catch (err) {
        setError(err.message || 'Không thể tải chi tiết tài sản.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [tttbId]); // Fetch lại khi tttbId thay đổi

  // Helper để hiển thị giá trị hoặc placeholder
  const displayValue = (value, placeholder = 'N/A') => {
    return value !== null && value !== undefined && value !== '' 
        ? getTinhTrangLabel(value)
        : <span className="text-gray-400 italic">{placeholder}</span>;
};


  const displayCurrency = (value) => {
    if (value === null || value === undefined) return displayValue(value);
    return `${Number(value).toLocaleString('vi-VN')} ₫`;
  }

  const displayStatus = (status) => {
    // Copy logic từ ChiTietTaiSanRow nếu muốn hiển thị icon + màu
    const label = getTinhTrangLabel(status);
    // Có thể thêm màu sắc/icon ở đây
    return displayValue(label);
  }

  return (
    <Popup isOpen={true} title={`Chi tiết Tài sản #${tttbId}`} onClose={onClose}>
      <div className="p-2 min-w-[300px] max-w-[90%] sm:min-w-[400px]">
        {loading && (
          <div className="text-center py-10">
            <FaSpinner className="animate-spin text-2xl text-gray-500 mx-auto" />
            <p className="mt-2 text-sm text-gray-500">Đang tải chi tiết...</p>
          </div>
        )}
        {error && (
          <div className="text-center py-10 text-red-600 bg-red-50 p-4 rounded border border-red-200">
            <FaExclamationTriangle className="text-2xl mx-auto mb-2" />
            <p className="font-medium">Lỗi:</p>
            <p className="text-sm">{error}</p>
          </div>
        )}
        {!loading && !error && details && (
          <dl className="space-y-3">
            {/* Thông tin cơ bản TTTB */}
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-500">Mã Định Danh (TTTB ID)</dt>
              <dd className="text-sm text-gray-900 font-semibold">{displayValue(details.id)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-500">Tình trạng</dt>
              <dd className="text-sm text-gray-900">{displayStatus(details.tinhTrang)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-500">Phòng</dt>
              <dd className="text-sm text-gray-900">{displayValue(details.phong_name)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-500">Người được cấp</dt>
              <dd className="text-sm text-gray-900">{displayValue(details.nguoiDuocCap)}</dd>
            </div>

            {/* Thông tin Loại Thiết Bị */}
            <hr className="my-3" />
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-500">Loại Thiết Bị</dt>
              <dd className="text-sm text-gray-900">{displayValue(details.thietBi?.tenThietBi)} (ID: {displayValue(details.thietBi?.id)})</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-500">Thể Loại</dt>
              <dd className="text-sm text-gray-900">{displayValue(details.thietBi?.theLoai?.theLoai)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-500">Mô tả loại</dt>
              <dd className="text-sm text-gray-900 text-right">{displayValue(details.thietBi?.moTa)}</dd>
            </div>


            {/* Thông tin Nhập/Bảo hành */}
            <hr className="my-3" />
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-500">Phiếu nhập</dt>
              <dd className="text-sm text-gray-900">ID: {displayValue(details.phieuNhap?.id)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-500">Trường Hợp Nhập</dt>
              <dd className="text-sm text-gray-900">
                {displayValue(details.truongHopNhap)} 
                {details.truongHopNhap}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-500">Ngày nhập kho</dt>
              <dd className="text-sm text-gray-900">{details.ngayNhapKho ? formatDate(details.ngayNhapKho) : displayValue(null)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-500">Ngày hết hạn bảo hành</dt>
              <dd className="text-sm text-gray-900">{details.ngayBaoHanhKetThuc ? formatDate(details.ngayBaoHanhKetThuc) : displayValue(null)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-500">Giá trị ban đầu</dt>
              <dd className="text-sm text-gray-900 font-semibold">{displayCurrency(details.giaTriBanDau)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-500">Ngày dự kiến trả (nếu đang BH)</dt>
              <dd className="text-sm text-gray-900">{details.ngayDuKienTra ? formatDate(details.ngayDuKienTra) : displayValue(null)}</dd>
            </div>

          </dl>
        )}
        {!loading && !error && !details && (
          <p className="text-center text-gray-500 py-10">Không có dữ liệu chi tiết.</p>
        )}

        {/* Nút đóng */}
        <div className="mt-5 text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Đóng
          </button>
        </div>
      </div>
    </Popup>
  );
};

export default ChiTietThongTinThietBi;