import { useEffect, useState } from "react";
import axios from "axios";
import { useFormattedPrice } from "../../utils/helpers";

const ThietBi = ({ setSelectedRecord, refresh }) => {
    const formatPrice = useFormattedPrice();
    const [data, setData] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10; // Giới hạn 10 dòng mỗi trang

    // Hàm tải dữ liệu
    const fetchData = () => {
        axios.get("http://localhost:5000/api/thietbi")
            .then(response => setData(response.data))
            .catch(error => console.error("Lỗi tải dữ liệu:", error));
    };

    useEffect(() => {
        fetchData();
    }, [refresh]);

    const selectRecord = (record) => {
        setSelectedRecord(record);
    };

    // Tính toán dữ liệu cho trang hiện tại
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = data.slice(indexOfFirstItem, indexOfLastItem);

    // Xử lý chuyển trang
    const totalPages = Math.ceil(data.length / itemsPerPage);
    const goToPage = (pageNumber) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
        }
    };

    return (
        <div className="w-full overflow-auto">
            <div className="max-h-full overflow-x-auto overflow-y-auto border">
                <table className="w-full border min-w-[600px]">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="px-4 py-2 border-b ">STT</th>
                            <th className="px-4 py-2 border-b">ID</th>
                            <th className="px-4 py-2 border-b">Tên Thiết Bị</th>
                            <th className="px-4 py-2 border-b">Mô Tả</th>
                            <th className="px-4 py-2 border-b">Số Lượng</th>
                            <th className="px-4 py-2 border-b">Tồn Kho</th>
                            <th className="px-4 py-2 border-b">Đơn Giá</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.map((record, index) => (
                            <tr key={record.id}
                                className="text-center cursor-pointer hover:bg-gray-100"
                                onClick={() => selectRecord(record)}
                            >
                                <td className="p-2 border">{indexOfFirstItem + index + 1}</td>
                                <td className="p-2 border">TB{record.id}</td>
                                <td className="p-2 border">{record.tenThietBi}</td>
                                <td className="p-2 border">{record.moTa}</td>
                                <td className="p-2 border">{record.soLuong}</td>
                                <td className="p-2 border">{record.tonKho}</td>
                                <td className="p-2 border">{formatPrice(record.donGia)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Phân trang */}
            {totalPages > 1 && (
                <div className="flex justify-center my-4 space-x-2 ">
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
                            className={`px-4 py-2 border rounded ${currentPage === i + 1 ? "bg-blue-500 text-white" : "bg-gray-200 hover:bg-gray-300"}`}
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
    );
};

export default ThietBi;
