import axios from "axios";
import { useState, useEffect } from "react";
import eventBus from "../../utils/eventBus";

const ThongTinBaoHong = () => {
    const [baoHongList, setBaoHongList] = useState([]);
    const [filteredBaoHongList, setFilteredBaoHongList] = useState([]);
    const [expandedRows, setExpandedRows] = useState([]);
    const [phongList, setPhongList] = useState([]);
    const [filter, setFilter] = useState({
        phong_id: "",
        loaithiethai: "",
        thiethai: "",
        dateOrder: "newest", // Giá trị mặc định: mới nhất
    });
    const [currentPage, setCurrentPage] = useState(1); // Trang hiện tại
    const rowsPerPage = 10; // Số hàng mỗi trang

    const refreshData = () => {
        // Gọi API lấy thông tin báo hỏng
        axios.get("http://localhost:5000/api/baohong")
            .then((response) => {
                setBaoHongList(response.data); // Lưu dữ liệu vào state
                setFilteredBaoHongList(response.data); // Sao chép danh sách để lọc
            })
            .catch((error) => {
                console.error("Lỗi khi tải thông tin báo hỏng:", error);
            });

        // Gọi API lấy danh sách phòng
        axios.get("http://localhost:5000/api/phong/phonglist")
            .then((response) => {
                setPhongList(response.data); // Lưu danh sách phòng vào state
            })
            .catch((error) => {
                console.error("Lỗi khi tải danh sách phòng:", error);
            });
    };

    useEffect(() => {
        refreshData();

        const handleBaoHongSubmitted = () => {
            refreshData();
        };

        eventBus.on('baoHongSubmitted', handleBaoHongSubmitted);

        return () => {
            eventBus.off('baoHongSubmitted', handleBaoHongSubmitted);
        };
    }, []);

    // Xử lý thay đổi bộ lọc
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        const updatedFilter = { ...filter, [name]: value };
        setFilter(updatedFilter);

        // Lọc danh sách dựa trên bộ lọc
        let filtered = baoHongList.filter((item) =>
            (updatedFilter.phong_id === "" || item.phong_id === parseInt(updatedFilter.phong_id)) &&
            (updatedFilter.loaithiethai === "" || item.loaithiethai === updatedFilter.loaithiethai) &&
            (updatedFilter.thiethai === "" || item.thiethai === updatedFilter.thiethai)
        );

        // Sắp xếp theo thứ tự ngày
        if (updatedFilter.dateOrder === "newest") {
            filtered = filtered.sort((a, b) => new Date(b.ngayBaoHong) - new Date(a.ngayBaoHong));
        } else if (updatedFilter.dateOrder === "oldest") {
            filtered = filtered.sort((a, b) => new Date(a.ngayBaoHong) - new Date(b.ngayBaoHong));
        }

        setFilteredBaoHongList(filtered);
        setCurrentPage(1); // Đặt lại trang về trang đầu
    };

    // Xử lý toggle hiển thị bảng con
    const toggleRow = (id) => {
        if (expandedRows.includes(id)) {
            setExpandedRows(expandedRows.filter((row) => row !== id));
        } else {
            setExpandedRows([...expandedRows, id]);
        }
    };

    // Phân trang
    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const currentRows = filteredBaoHongList.slice(indexOfFirstRow, indexOfLastRow);

    const totalPages = Math.ceil(filteredBaoHongList.length / rowsPerPage);

    return (
        <div className="p-6 bg-white">
            <h2 className="text-xl font-semibold mb-4">Danh Sách Báo Hỏng</h2>

            {/* Dropdown lọc */}
            <div className="flex flex-wrap space-x-4 mb-4">
                {/* Dropdown Phòng */}
                <div>
                    <label className="block mb-1 text-sm font-medium">Phòng</label>
                    <select
                        name="phong_id"
                        value={filter.phong_id}
                        onChange={handleFilterChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                        <option value="">Tất cả</option>
                        {phongList.map((phong) => (
                            <option key={phong.id} value={phong.id}>
                                {phong.phong}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Dropdown Loại Thiệt Hại */}
                <div>
                    <label className="block mb-1 text-sm font-medium">Loại Thiệt Hại</label>
                    <select
                        name="loaithiethai"
                        value={filter.loaithiethai}
                        onChange={handleFilterChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                        <option value="">Tất cả</option>
                        <option value="Kết Cấu">Kết Cấu</option>
                        <option value="Hệ Thống Điện">Hệ Thống Điện</option>
                        <option value="Hệ Thống Nước">Hệ Thống Nước</option>
                        <option value="Các Loại Thiết Bị">Các Loại Thiết Bị</option>
                        <option value="Khác">Khác</option>
                    </select>
                </div>

                {/* Dropdown Mức Độ */}
                <div>
                    <label className="block mb-1 text-sm font-medium">Mức Độ</label>
                    <select
                        name="thiethai"
                        value={filter.thiethai}
                        onChange={handleFilterChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                        <option value="">Tất cả</option>
                        <option value="Nhẹ">Nhẹ</option>
                        <option value="Vừa">Vừa</option>
                        <option value="Nặng">Nặng</option>
                    </select>
                </div>

                {/* Dropdown Ngày */}
                <div>
                    <label className="block mb-1 text-sm font-medium">Ngày</label>
                    <select
                        name="dateOrder"
                        value={filter.dateOrder}
                        onChange={handleFilterChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                        <option value="newest">Mới nhất</option>
                        <option value="oldest">Cũ nhất</option>
                    </select>
                </div>
            </div>

            <div className="overflow-y-auto" style={{ maxHeight: "500px" }}>
                <table className="w-full border-collapse border border-gray-300">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border px-4 py-2">STT</th>
                            <th className="border px-4 py-2">Phòng</th>
                            <th className="border px-4 py-2">Ngày Báo Hỏng</th>
                            <th className="border px-4 py-2">Loại Thiệt Hại</th>
                            <th className="border px-4 py-2">Mức Độ</th>
                            <th className="border px-4 py-2">Hành Động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentRows.map((item, index) => (
                            <>
                                {/* Bảng cha */}
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="border px-4 py-2 text-center">{indexOfFirstRow + index + 1}</td>
                                    <td className="border px-4 py-2">{item.phong_name}</td>
                                    <td className="border px-4 py-2">
                                        {new Date(item.ngayBaoHong).toLocaleString("vi-VN", {
                                            year: "numeric",
                                            month: "2-digit",
                                            day: "2-digit",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                            second: "2-digit",
                                        })}
                                    </td>
                                    <td className="border px-4 py-2">{item.loaithiethai}</td>
                                    <td className="border px-4 py-2">{item.thiethai}</td>
                                    <td className="border px-4 py-2 text-center">
                                        <button
                                            onClick={() => toggleRow(item.id)}
                                            className="text-blue-500 hover:underline"
                                        >
                                            {expandedRows.includes(item.id) ? "Thu Gọn" : "Xem Chi Tiết"}
                                        </button>
                                    </td>
                                </tr>

                                {/* Bảng con */}
                                {expandedRows.includes(item.id) && (
                                    <tr>
                                        <td colSpan={6} className="border px-4 py-2">
                                            <div>
                                                <p><strong>Mô Tả:</strong> {item.moTa || "Không có mô tả"}</p>
                                                <p>
                                                    <strong>Hình Ảnh:</strong>{" "}
                                                    {item.hinhAnh ? (
                                                        <img
                                                            src={item.hinhAnh}
                                                            alt="Thiệt Hại"
                                                            className="max-w-full h-auto mt-2 rounded-lg"
                                                        />
                                                    ) : (
                                                        "Không có hình ảnh"
                                                    )}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </>
                        ))}
                    </tbody>
                </table>
                <div className="flex justify-between items-center mt-4">
                    {/* Hiển thị trang hiện tại */}
                    <div>
                        Trang {currentPage}/{totalPages}
                    </div>

                    {/* Nút điều khiển phân trang */}
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                            Trước
                        </button>
                        <button
                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                            Tiếp
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ThongTinBaoHong;
