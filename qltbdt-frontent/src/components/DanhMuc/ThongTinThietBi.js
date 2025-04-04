import { useState, useEffect } from "react";
import { paginateData } from "../../utils/helpers";
import { getTinhTrangLabel } from "../../utils/constants";
import { FaEye, FaChevronDown, FaChevronUp } from "react-icons/fa";
import axios from "axios";

const ThongTinThietBi = ({ setSelectedRecord, refresh }) => {
    const [data, setData] = useState([]);
    const [thietBiList, setThietBiList] = useState([]);
    const [expandedRows, setExpandedRows] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);

    // Hàm tải dữ liệu
    const fetchData = async () => {
        try {
            const responseData = await axios.get("http://localhost:5000/api/tttb",{withCredentials:true});
            setData(responseData.data);

            const thietBiResponse = await axios.get("http://localhost:5000/api/tttb/thietbi-list",{withCredentials:true});
            setThietBiList(thietBiResponse.data);
        } catch (error) {
            console.error("Lỗi tải thông tin:", error);
        }
    };

    useEffect(() => {
        fetchData();
    }, [refresh]);

    // Lấy tên thiết bị từ danh sách thiết bị
    const getTenThietBi = (thietbi_id) => {
        const thietBi = thietBiList.find((t) => Number(t.id) === Number(thietbi_id));
        return thietBi ? thietBi.tenThietBi : "Không xác định";
    };

    // Xử lý toggle hiển thị chi tiết
    const toggleRow = (thietbi_id) => {
        if (expandedRows.includes(thietbi_id)) {
            setExpandedRows(expandedRows.filter((rowId) => rowId !== thietbi_id));
        } else {
            setExpandedRows([...expandedRows, thietbi_id]);
        }
    };

    // Nhóm dữ liệu theo `thietbi_id` và `phieunhap_id`
    const groupedData = data.reduce((acc, item) => {
        const existing = acc.find(
            (tb) => tb.thietbi_id === item.thietbi_id && tb.phieunhap_id === item.phieunhap_id
        );

        if (existing) {
            existing.soLuong += 1; // Cộng số lượng
            existing.tinhTrang = item.tinhTrang;
            existing.chiTiet.push(item);
        } else {
            acc.push({
                thietbi_id: item.thietbi_id,
                tenThietBi: getTenThietBi(item.thietbi_id),
                phieunhap_id: item.phieunhap_id,
                soLuong: 1,
                tinhTrang: item.tinhTrang,
                ngayBaoHanhKetThuc: item.ngayBaoHanhKetThuc,
                thoiGianBaoHanh: item.thoiGianBaoHanh,
                chiTiet: [item],
            });
        }
        return acc;
    }, []);

    // Phân trang dữ liệu
    const { currentItems, totalPages, indexOfFirstItem } = paginateData(groupedData, currentPage);

    const goToPage = (pageNumber) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
        }
    };

    const selectRecord = (record) => {
        setSelectedRecord(record);
    };

    return (
        <div className="w-full overflow-auto">
            <div className="max-h-full overflow-x-auto overflow-y-auto">
                <table className="w-full border min-w-[600px] min-h-[200px]">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="px-4 py-2 border-b">STT</th>
                            <th className="px-4 py-2 border-b">ID Thiết Bị</th>
                            <th className="px-4 py-2 border-b">Tên Thiết Bị</th>
                            <th className="px-4 py-2 border-b">Thông Tin Nhập</th>
                            <th className="px-4 py-2 border-b">Tình Trạng</th>
                            <th className="px-4 py-2 border-b">Số Lượng</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.map((tb, index) => (
                            <>
                                {/* Hàng tổng quát */}
                                <tr
                                    key={`${tb.thietbi_id}-${tb.phieunhap_id}`}
                                    className="text-center bg-white"
                                >
                                    <td className="p-2 border">{indexOfFirstItem + index + 1}</td>
                                    <td className="p-2 border">TB{tb.thietbi_id}</td>
                                    <td className="p-2 border">
                                        <div className="flex items-center justify-between">
                                            {tb.tenThietBi}
                                            <button onClick={() => toggleRow(tb.thietbi_id)} className="ml-2">
                                                {expandedRows.includes(tb.thietbi_id) ? (
                                                    <FaChevronUp />
                                                ) : (
                                                    <FaChevronDown />
                                                )}
                                            </button>
                                        </div>
                                    </td>
                                    <td className="p-2 border">GN{tb.phieunhap_id}</td>
                                    <td className="p-2 border">
                                        {getTinhTrangLabel(tb.tinhTrang)} ({tb.thoiGianBaoHanh} Tháng)
                                    </td>
                                    <td className="p-2 border">{tb.soLuong}</td>
                                </tr>

                                {/* Hàng chi tiết */}
                                {expandedRows.includes(tb.thietbi_id) && (
                                    <tr className="bg-gray-100">
                                        <td colSpan="2"></td>
                                        <td colSpan="3" className="p-2 text-center border">
                                            <table className="w-full border">
                                                <thead>
                                                    <tr className="bg-gray-200">
                                                        <th className="p-2 border">{tb.tenThietBi}
                                                            <div>
                                                                <input
                                                                    type="text"
                                                                    placeholder="Tìm Kiếm..."
                                                                    className="w-2/3 px-1 py-1 text-sm text-gray-500 bg-white border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                                />
                                                            </div>
                                                        </th>
                                                        <th className="p-2 border">Hạn BH</th>
                                                        <th className="p-2 border">Xem Chi Tiết</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {tb.chiTiet.map((detail, idx) => (
                                                        <tr key={detail.id} className="text-center bg-white">
                                                            <td className="p-2 border">
                                                                <span className="text-sm text-gray-500">No.{idx + 1} Mã định danh:</span> {detail.id}
                                                            </td>
                                                            <td className="p-2 text-sm border">
                                                                {detail.ngayBaoHanhKetThuc.split("T")[0]}
                                                            </td>
                                                            <td className="p-2 border">
                                                                <button
                                                                    className="p-1 text-white transition duration-200 ease-in-out bg-blue-500 rounded-md hover:bg-green-500 hover:scale-110"
                                                                    onClick={() => selectRecord(detail)}
                                                                >
                                                                    <FaEye className="text-lg" />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </td>
                                        <td colSpan="1"></td>
                                    </tr>
                                )}
                            </>
                        ))}
                    </tbody>
                </table>

                {/* Phân trang */}
                {totalPages > 1 && (
                    <div className="flex justify-center my-4 space-x-2">
                        {currentPage > 1 && (
                            <button
                                className="px-4 py-2 bg-gray-200 border rounded hover:bg-gray-300"
                                onClick={() => goToPage(currentPage - 1)}
                            >
                                ← Trước
                            </button>
                        )}
                        {[...Array(totalPages)].map((_, i) => (
                            <button
                                key={i}
                                className={`px-4 py-2 border rounded ${currentPage === i + 1
                                    ? "bg-blue-500 text-white"
                                    : "bg-gray-200 hover:bg-gray-300"
                                    }`}
                                onClick={() => goToPage(i + 1)}
                            >
                                {i + 1}
                            </button>
                        ))}
                        {currentPage < totalPages && (
                            <button
                                className="px-4 py-2 bg-gray-200 border rounded hover:bg-gray-300"
                                onClick={() => goToPage(currentPage + 1)}
                            >
                                Sau →
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ThongTinThietBi;
