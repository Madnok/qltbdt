import { paginateData } from "../../utils/helpers";
import { useState } from "react";
import { getTinhTrangLabel } from "../../utils/constants";
import { useQuery } from '@tanstack/react-query';
import { getAllPhieuNhapAPI } from '../../api';
import Pagination from '../layout/Pagination';

const ITEMS_PER_PAGE_NHAP = 15;

const BangNhap = ({ setSelectedRecord, refreshData, selectedRowId }) => {
    const [currentPage, setCurrentPage] = useState(1);

    const { data: allPhieuNhap = [], isLoading, error } = useQuery({
        queryKey: ['phieuNhapList', refreshData],
        queryFn: getAllPhieuNhapAPI,
    });

    const { currentItems, totalPages, indexOfFirstItem } = paginateData(
        allPhieuNhap,
        currentPage,
        ITEMS_PER_PAGE_NHAP
    );
    const selectRecord = (record) => {
        setSelectedRecord(record); // Truyền cả record hoặc chỉ record.id tùy vào ChiTietNhap
    };

    // Hàm xử lý chuyển trang (truyền vào component Pagination)
    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
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

    if (isLoading) return <div className="flex items-center justify-center h-12">Đang Tải...</div>; // Hiển thị loading khi đang fetch
    if (error) return <p className="text-red-500">Lỗi tải danh sách phiếu nhập: {error.message}</p>;

    return (
        <div className="p-2 bg-white">
            <div className="flex items-center justify-between mt-4 mb-2">
                <h2 className="text-xl text-green-700 font-semibold">Danh sách Phiếu Nhập</h2>
            </div>
            <div className="overflow-x-auto border border-gray-200 rounded-md">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-2 text-xs font-medium tracking-wider text-left text-green-700 uppercase">STT</th>
                            <th className="px-4 py-2 text-xs font-medium tracking-wider text-left text-green-700 uppercase">IDPN</th>
                            <th className="px-4 py-2 text-xs font-medium tracking-wider text-left text-green-700 uppercase">Ngày tạo</th>
                            <th className="px-4 py-2 text-xs font-medium tracking-wider text-left text-green-700 uppercase">Người tạo</th>
                            <th className="px-4 py-2 text-xs font-medium tracking-wider text-left text-green-700 uppercase">Ghi chú</th>
                            <th className="px-4 py-2 text-xs font-medium tracking-wider text-left text-green-700 uppercase">Trường hợp nhập</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {currentItems.map((record, index) =>
                            <tr
                                key={record.id}
                                className={`text-sm hover:bg-gray-50 cursor-pointer ${selectedRowId === record.id ? 'bg-indigo-50' : ''}`}
                                onClick={() => selectRecord(record)}
                            >
                                <td className="px-4 py-2 whitespace-nowrap">{indexOfFirstItem + index + 1}</td>
                                <td className="px-4 py-2 font-medium text-green-600 whitespace-nowrap">PN{record.id}</td>
                                <td className="px-4 py-2 text-gray-500 whitespace-nowrap">{formatDate(record.ngayTao)}</td>
                                <td className="px-4 py-2 text-gray-500 whitespace-nowrap">{record.nguoiTao}</td>
                                <td className="px-4 py-2 text-gray-500 whitespace-nowrap">{record.ghiChu && record.ghiChu.trim() !== "" ? record.ghiChu : "-"}</td>
                                <td className="px-4 py-2 text-gray-500 whitespace-nowrap">{getTinhTrangLabel(record.truongHopNhap)}</td>
                            </tr>
                        )}
                        {allPhieuNhap.length === 0 && (
                            <tr><td colSpan="5" className="py-4 text-sm text-center text-gray-500">Chưa có phiếu nhập nào.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            {/* Phân trang */}
            {totalPages > 1 && (
                <div className="flex justify-center mt-4">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                    />
                </div>
            )}
        </div>
    );
};

export default BangNhap;
