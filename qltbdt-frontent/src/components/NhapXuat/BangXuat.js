import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchPhieuXuatListAPI } from '../../api'; 
import { formatDate, formatCurrency } from '../../utils/helpers';
// import { toast } from 'react-toastify';

const BangXuat = ({ onRowSelect, selectedRowId, refreshKey }) => { 

  // Sử dụng refreshKey trong queryKey để trigger refetch
  const { data: phieuXuatList = [], isLoading, error/*, refetch*/ } = useQuery({
    // Thêm refreshKey vào queryKey
    queryKey: ['phieuXuatList', refreshKey],
    // API function lấy danh sách phiếu xuất
    queryFn: fetchPhieuXuatListAPI,
    staleTime: 5 * 60 * 1000, // Cache 5 phút
    refetchOnWindowFocus: false,
  });

  // Tự động refetch khi refreshKey thay đổi
  // useEffect(() => {
  //     refetch();
  // }, [refreshKey, refetch]);


  // Hàm lấy label cho Lý do xuất (có thể đặt trong constants)
  const getLyDoXuatLabel = (lyDo) => {
    switch (lyDo) {
      case 'thanh_ly': return 'Thanh lý';
      case 'mat_mat': return 'Báo mất';
      case 'xuat_tra': return 'Xuất trả NCC';
      case 'dieu_chuyen': return 'Điều chuyển';
      default: return lyDo;
    }
  }

  if (isLoading) return <p className="p-4 text-center text-gray-500">Đang tải danh sách phiếu xuất..</p>;
  if (error) return <p className="p-4 text-center text-red-500">Lỗi tải danh sách phiếu xuất: {error.message}</p>;

  return (
    <div className="p-2 bg-white">
      <div className="flex items-center justify-between mt-4 mb-2">
        <h2 className="text-xl text-purple-700 font-semibold">Danh sách Phiếu Xuất</h2>
      </div>
      <div className="overflow-x-auto border border-gray-200 rounded-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-purple-50">
            <tr>
              {/* <th scope="col" className="px-4 py-2 text-xs font-medium tracking-wider text-left text-purple-700 uppercase">STT</th> */}
              <th scope="col" className="px-4 py-2 text-xs font-medium tracking-wider text-left text-purple-700 uppercase">IDPX</th>
              <th scope="col" className="px-4 py-2 text-xs font-medium tracking-wider text-left text-purple-700 uppercase">Ngày Xuất</th>
              <th scope="col" className="px-4 py-2 text-xs font-medium tracking-wider text-left text-purple-700 uppercase">Người Thực Hiện</th>
              <th scope="col" className="px-4 py-2 text-xs font-medium tracking-wider text-left text-purple-700 uppercase">Lý Do Xuất</th>
              <th scope="col" className="px-4 py-2 text-xs font-medium tracking-wider text-center text-purple-700 uppercase">SL Thiết Bị</th>
              <th scope="col" className="px-4 py-2 text-xs font-medium tracking-wider text-right text-purple-700 uppercase">Giá Trị Thu Về</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {phieuXuatList && phieuXuatList.length > 0 ? (
              phieuXuatList.map((phieu, index) => (
                <tr
                  key={phieu.id}
                  onClick={() => onRowSelect(phieu.id)}
                  // Giữ màu tím nhẹ khi chọn
                  className={`hover:bg-purple-50 cursor-pointer ${selectedRowId === phieu.id ? 'bg-purple-100' : ''}`}
                >
                  {/* <td className="px-4 py-2 text-sm text-gray-500 whitespace-nowrap">{index + 1}</td> */}
                  <td className="px-4 py-2 text-sm font-medium text-purple-700 whitespace-nowrap">PX{phieu.id}</td>
                  <td className="px-4 py-2 text-sm text-gray-500 whitespace-nowrap">{formatDate(phieu.ngayXuat)}</td>
                  <td className="px-4 py-2 text-sm text-gray-500 whitespace-nowrap">{phieu.tenNguoiThucHien}</td>
                  {/* Sử dụng helper hoặc switch case để hiển thị label lý do */}
                  <td className="px-4 py-2 text-sm text-gray-500 whitespace-nowrap">{getLyDoXuatLabel(phieu.lyDoXuat)}</td>
                  {/* Hiển thị số lượng TB */}
                  <td className="px-4 py-2 text-sm text-center text-gray-500 whitespace-nowrap">{phieu.soLuongThietBi !== undefined ? phieu.soLuongThietBi : 'N/A'}</td>
                  {/* Hiển thị giá trị thu về */}
                  <td className="px-4 py-2 text-sm text-right text-gray-500 whitespace-nowrap">
                    {phieu.giaTriThanhLy !== null && phieu.giaTriThanhLy !== undefined ? formatCurrency(phieu.giaTriThanhLy) : '-'}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                {/* Điều chỉnh colSpan cho phù hợp với số cột */}
                <td colSpan="6" className="py-4 text-sm text-center text-gray-500">Chưa có phiếu xuất nào.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* Thêm Pagination nếu cần */}
    </div>
  );
};

export default BangXuat;