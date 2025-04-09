import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAllPhieuXuatAPI } from '../../api';
import { formatDate } from '../../utils/helpers';
import { getTinhTrangLabel } from '../../utils/constants';
import { toast } from 'react-toastify';

const BangXuat = ({ onRowSelect, selectedRowId }) => {

  const { data: phieuXuatList, isLoading, error } = useQuery({
    queryKey: ['phieuXuat'],
    queryFn: () => getAllPhieuXuatAPI().then(res => res.data)
  });

  if (isLoading) return <p className="text-center text-gray-500">Đang tải danh sách phiếu xuất..</p>;
  if (error) return <p className="text-red-500">Lỗi tải danh sách phiếu xuất: {error.message}</p>;

  return (
    <div className="p-2 bg-white">
      <div className="flex items-center justify-between mt-4 mb-2">
        <h2 className="text-xl font-semibold">Danh sách Phiếu Xuất</h2>
        <button
          // onClick={onAddPhieuXuat} // Nếu có form tạo phiếu xuất riêng
          onClick={() => toast.info('Chức năng tạo phiếu xuất trực tiếp từ đây chưa được hỗ trợ.')} // Thông báo tạm
          className="px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        >
          Tạo Phiếu Xuất
        </button>
      </div>
      <div className="overflow-x-auto border border-gray-200 rounded-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-2 text-xs font-medium tracking-wider text-left text-purple-700 uppercase">STT</th>
              <th scope="col" className="px-4 py-2 text-xs font-medium tracking-wider text-left text-purple-700 uppercase">IDPX</th>
              <th scope="col" className="px-4 py-2 text-xs font-medium tracking-wider text-left text-purple-700 uppercase">Ngày Xuất</th>
              <th scope="col" className="px-4 py-2 text-xs font-medium tracking-wider text-left text-purple-700 uppercase">Người Thực Hiện</th>
              <th scope="col" className="px-4 py-2 text-xs font-medium tracking-wider text-left text-purple-700 uppercase">Lý Do Xuất</th>
              {/* Thêm cột số lượng nếu API trả về */}
              {/* <th scope="col" className="px-4 py-2 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">Số Lượng TB</th> */}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {phieuXuatList && phieuXuatList.length > 0 ? (
              phieuXuatList.map((phieu) => (
                <tr
                  key={phieu.id}
                  onClick={() => onRowSelect(phieu.id)}
                  className={`hover:bg-gray-50 cursor-pointer ${selectedRowId === phieu.id ? 'bg-indigo-50' : ''}`}
                >
                  <th className="px-4 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">1</th>
                  <td className="px-4 py-2 text-sm font-medium text-purple-700 whitespace-nowrap">PX{phieu.id}</td>
                  <td className="px-4 py-2 text-sm text-gray-500 whitespace-nowrap">{formatDate(phieu.ngayXuat)}</td>
                  <td className="px-4 py-2 text-sm text-gray-500 whitespace-nowrap">{phieu.tenNguoiThucHien}</td>
                  <td className="px-4 py-2 text-sm text-gray-500 whitespace-nowrap">{getTinhTrangLabel(phieu.lyDoXuat)}</td>
                  {/* <td className="px-4 py-2 text-sm text-center text-gray-500 whitespace-nowrap">{phieu.soLuongThietBi || 'N/A'}</td> */}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="py-4 text-sm text-center text-gray-500">Chưa có phiếu xuất nào.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* Thêm Pagination nếu danh sách phiếu xuất dài */}
    </div>
  );
};

export default BangXuat;