import axios from "axios";
import { useState, useEffect } from "react";
import eventBus from "../utils/eventBus";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import moment from "moment";

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
    const [sortOrder, setSortOrder] = useState(null); // Trạng thái mặc định: chưa sắp xếp
    const handleFilterChange = (e, sortOrder = null) => {
        const updatedFilter = sortOrder
            ? { ...filter, dateOrder: sortOrder }
            : { ...filter, [e.target.name]: e.target.value };

        setFilter(updatedFilter);

        let filtered = baoHongList.filter((item) => {
            const ngayBaoHong = moment(item.ngayBaoHong).format("YYYY-MM-DD"); // Dùng Moment.js để chuẩn hóa định dạng ngày
            const specificDate = updatedFilter.specificDate;

            return (
                (updatedFilter.phong_id === "" || item.phong_id === parseInt(updatedFilter.phong_id)) &&
                (updatedFilter.loaithiethai === "" || item.loaithiethai === updatedFilter.loaithiethai) &&
                (updatedFilter.thiethai === "" || item.thiethai === updatedFilter.thiethai) &&
                (specificDate === "" || ngayBaoHong === specificDate) // So sánh ngày
            );
        });

        // Sắp xếp theo thứ tự ngày
        filtered.sort((a, b) => {
            const dateA = moment(a.ngayBaoHong);
            const dateB = moment(b.ngayBaoHong);

            return updatedFilter.dateOrder === "newest"
                ? dateB - dateA // Mới nhất trước
                : dateA - dateB; // Cũ nhất trước
        });

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

    // Xử lý check box 
    const [selectAll, setSelectAll] = useState(false); // Trạng thái chọn tất cả
    const [selectedRows, setSelectedRows] = useState([]); // Danh sách các dòng được chọn

    // Hàm toggle trạng thái tất cả
    const handleSelectAll = () => {
        if (selectAll) {
            // Xóa toàn bộ danh sách được chọn
            setSelectedRows([]);
        } else {
            // Chọn tất cả các dòng hiện tại
            const allRowIds = currentRows.map((item) => item.id); // Đảm bảo lấy tất cả ID từ currentRows
            setSelectedRows(allRowIds);
        }
        setSelectAll(!selectAll); // Toggle trạng thái nút
    };

    // Hàm toggle từng dòng
    const toggleRowSelection = (id) => {
        if (selectedRows.includes(id)) {
            // Nếu ID đã có trong danh sách, xóa nó
            setSelectedRows(selectedRows.filter((rowId) => rowId !== id));
        } else {
            // Nếu ID chưa có, thêm nó vào danh sách
            setSelectedRows([...selectedRows, id]);
        }
    };


    // Phân trang
    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const currentRows = filteredBaoHongList.slice(indexOfFirstRow, indexOfLastRow);

    const totalPages = Math.ceil(filteredBaoHongList.length / rowsPerPage);

    return (
        <div className="flex flex-col w-full h-screen min-h-screen overflow-auto bg-white border-r shadow-md">
            <div className={`bg-white shadow-md flex flex-col`}>
                <div className="flex items-center justify-between p-4 bg-white border-b">
                    <h2 className="text-xl font-semibold">
                        Thông Tin Báo Hỏng
                    </h2>
                </div>
            </div>
            <div className="p-6 bg-white">
                {/* Dropdown lọc */}
                <div className="flex flex-wrap mb-4 gap-x-4 gap-y-4">
                    {/* Dropdown Phòng */}
                    <div className="w-44">
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
                    <div className="w-44">
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
                    <div className="w-44">
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
                    <div className="w-44">
                        <label className="block mb-1 text-sm font-medium">Chọn Ngày</label>
                        <input
                            type="date"
                            name="specificDate"
                            value={filter.specificDate}
                            onChange={handleFilterChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                    </div>
                </div>

                {/* Bảng Dữ liệu */}
                <div className="overflow-y-auto" style={{ maxHeight: "1000px" }}>
                    <table className="w-full border border-collapse border-gray-300">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="px-4 py-2 border">STT</th>
                                <th className="px-4 py-2 border">Phòng</th>
                                <th className="flex items-center justify-center px-2 py-2">
                                    Ngày Báo Hỏng
                                    {sortOrder === "oldest" ? (
                                        <button
                                            onClick={() => {
                                                setSortOrder("newest");
                                                handleFilterChange(null, "newest");
                                            }}
                                            className="ml-2 text-black hover:text-gray-600"
                                            title="Mới nhất"
                                        >

                                            <FaChevronDown />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                setSortOrder("oldest");
                                                handleFilterChange(null, "oldest");
                                            }}
                                            className="ml-2 text-black hover:text-gray-600"
                                            title="Cũ nhất"
                                        >
                                            <FaChevronUp />
                                        </button>
                                    )}
                                </th>
                                <th className="px-4 py-2 border">Loại Thiệt Hại</th>
                                <th className="px-4 py-2 border">Mức Độ</th>
                                <th className="px-4 py-2 border">Ưu Tiên</th>
                                <th className="px-4 py-2 border">
                                    <div className="flex items-center justify-center">
                                        <span>Chọn Tất Cả </span>
                                        <input
                                            type="checkbox"
                                            checked={selectedRows.length === currentRows.length && currentRows.length > 0} // Đã chọn tất cả
                                            onChange={handleSelectAll}
                                            className="mx-2" // Thêm khoảng cách giữa checkbox và label
                                        />
                                    </div>
                                </th>
                                <th className="px-4 py-2 border">Người Xử Lý</th>
                                <th className="px-4 py-2 border">Hành Động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentRows.map((item, index) => (
                                <>
                                    {/* Bảng cha */}
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-2 text-center border">{indexOfFirstRow + index + 1}</td>
                                        <td className="px-4 py-2 border">{item.phong_name}</td>
                                        <td className="px-4 py-2 border">
                                            {moment(item.ngayBaoHong).format("DD/MM/YYYY HH:mm")}
                                        </td>
                                        <td className="px-4 py-2 border">{item.loaithiethai}</td>
                                        <td className="px-4 py-2 border">{item.thiethai}</td>
                                        <td className="px-4 py-2 text-center border">
                                            <select value={item.mucDoUuTien} disabled>
                                                <option value="Trung Bình">Trung Bình</option>
                                                <option value="Cao">Cao</option>
                                                <option value="Thấp">Thấp</option>
                                            </select>
                                        </td>
                                        <td className="px-4 py-2 text-center border">
                                            {/* Checkbox cho mỗi dòng */}
                                            <input
                                                type="checkbox"
                                                checked={selectedRows.includes(item.id)}
                                                onChange={() => toggleRowSelection(item.id)}
                                            />
                                        </td>
                                        <td className="px-4 py-2 border">{item.nhanvien_id}</td>
                                        <td className="grid grid-cols-3 px-4 py-2 text-center border">
                                            {/* Nút Xem Chi Tiết */}
                                            <div>
                                                <button
                                                    onClick={() => toggleRow(item.id)}
                                                    className="text-blue-500 hover:underline"
                                                    title={expandedRows.includes(item.id) ? "Thu Gọn" : "Xem Chi Tiết"}
                                                >
                                                    {expandedRows.includes(item.id) ? (
                                                        <i className="fas fa-chevron-up"></i> // Icon Thu Gọn
                                                    ) : (
                                                        <i className="fas fa-chevron-down"></i> // Icon Xem Chi Tiết
                                                    )}
                                                </button>
                                            </div>

                                            {/* Nút Xóa Đơn */}
                                            <div>
                                                <button
                                                    onClick={() => {
                                                        // Hàm xử lý xóa đơn (tùy theo logic của bạn)
                                                        console.log(`Xóa đơn với ID: ${item.id}`);
                                                    }}
                                                    className="text-red-500 hover:text-red-700"
                                                    title="Xóa Đơn"
                                                >
                                                    <i className="fas fa-trash-alt"></i> {/* Icon Xóa Đơn */}
                                                </button>
                                            </div>

                                            <div>
                                                {item.trangThai === "Chờ Duyệt" ? (
                                                    <button className="px-2 py-2 text-sm text-white bg-green-500 rounded hover:bg-green-700">
                                                        Duyệt
                                                    </button>
                                                ) : (
                                                    <span>{item.trangThai}</span>
                                                )}
                                            </div>
                                        </td>

                                    </tr>

                                    {/* Bảng con */}
                                    {expandedRows.includes(item.id) && (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-2 border">
                                                <div>
                                                    <p><strong>Mô Tả:</strong> {item.moTa || "Không có mô tả"}</p>
                                                    <p>
                                                        <strong>Hình Ảnh:</strong>{" "}
                                                        {item.hinhAnh ? (
                                                            <img
                                                                src={item.hinhAnh}
                                                                alt="Thiệt Hại"
                                                                className="h-auto max-w-full mt-2 rounded-lg"
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
                    <div className="flex items-center justify-between mt-4">
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
        </div>
    );
};

export default ThongTinBaoHong;
