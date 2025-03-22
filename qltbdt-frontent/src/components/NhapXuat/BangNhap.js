import axios from "axios";
import { paginateData } from "../../utils/helpers";
import { useEffect, useState } from "react";
import { getTinhTrangLabel } from "../../utils/constants";

const BangNhap = ({ setSelectedRecord, refreshData }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [data, setData] = useState([]);
    const [soLuongTB, setSoLuongTB] = useState({}); // Lưu số lượng thiết bị

    const { currentItems, totalPages, indexOfFirstItem } = paginateData(data, currentPage);

    const selectRecord = (record) => {
        setSelectedRecord(record);
    };

    // Hàm lấy danh sách phiếu nhập
    const fetchData = () => {
        axios.get("http://localhost:5000/api/nhap/")
            .then(response => {
                setData(response.data);
                response.data.forEach(record => fetchSoLuongThietBi(record.id));
            })
            .catch(error => console.error("Lỗi tải dữ liệu:", error));
    };

    // Hàm lấy số lượng thiết bị trong phiếu nhập
    const fetchSoLuongThietBi = (phieuNhapId) => {
        axios.get(`http://localhost:5000/api/nhap/${phieuNhapId}/thongtinthietbi`)
            .then(response => {
                setSoLuongTB(prevState => ({
                    ...prevState,
                    [phieuNhapId]: response.data.length // Đếm số lượng thiết bị
                }));
            })
            .catch(error => console.error(`Lỗi tải thiết bị của PN ${phieuNhapId}:`, error));
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line
    }, [refreshData]);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${day}-${month}-${year} ${hours}:${minutes}`;
    };

    const goToPage = (pageNumber) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
        }
    };

    return (
        <div className="w-full overflow-auto">
            <div className="max-h-full overflow-x-auto overflow-y-auto">
                <table className="w-full border min-w-[600px]">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="px-4 py-2 border-b">STT</th>
                            <th className="px-4 py-2 border-b">IDPN</th>
                            <th className="px-4 py-2 border-b">Ngày tạo</th>
                            <th className="px-4 py-2 border-b">Người tạo</th>
                            <th className="px-4 py-2 border-b">Trường hợp</th>
                            <th className="px-4 py-2 border-b text-sm">Tổng Số Loại TB</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.map((record, index) => (
                            <tr
                                key={record.id} className="text-center cursor-pointer hover:bg-gray-100"
                                onClick={() => selectRecord(record)}
                            >
                                <td className="p-2 border">{indexOfFirstItem + index + 1}</td>
                                <td className="p-2 border">GN{record.id}</td>
                                <td className="p-2 border">{formatDate(record.ngayTao)}</td>
                                <td className="p-2 border">{record.nguoiTao}</td>
                                <td className="p-2 border">{getTinhTrangLabel(record.truongHopNhap)}</td>
                                <td className="p-2 border">
                                    {soLuongTB[record.id] !== undefined ? soLuongTB[record.id] : "Đang tải..."}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Phân trang */}
                {totalPages > 1 && (
                    <div className="flex justify-center my-4 space-x-2">
                        {currentPage > 1 && (
                            <button className="px-4 py-2 bg-gray-200 border rounded hover:bg-gray-300"
                                onClick={() => goToPage(currentPage - 1)}>← Trước</button>
                        )}
                        {[...Array(totalPages)].map((_, i) => (
                            <button key={i} className={`px-4 py-2 border rounded 
                            ${currentPage === i + 1 ? "bg-blue-500 text-white" : "bg-gray-200 hover:bg-gray-300"}`}
                                onClick={() => goToPage(i + 1)}>{i + 1}</button>
                        ))}
                        {currentPage < totalPages && (
                            <button className="px-4 py-2 bg-gray-200 border rounded hover:bg-gray-300"
                                onClick={() => goToPage(currentPage + 1)}>Sau →</button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BangNhap;
