import { useEffect, useState } from "react";
import axios from "axios";

const TheLoai = ({ setSelectedRecord, refresh }) => {
    const [data, setData] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Hàm tải dữ liệu
    const fetchData = () => {
        axios.get(`${process.env.REACT_APP_API_URL}/theloai`,{withCredentials: true})
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
                            <th className="px-4 py-2 border-b">SLTL</th>
                            <th className="px-4 py-2 border-b">ID</th>
                            <th className="px-4 py-2 border-b">Thể Loại</th>
                            <th className="px-4 py-2 border-b">Danh Sách Thiết Bị</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.map((record, index) => (
                            <tr key={record.id}
                                className="text-center cursor-pointer hover:bg-gray-100"
                                onClick={() => selectRecord(record)}
                            >
                                <td className="p-2 border">{indexOfFirstItem + index + 1}</td>
                                <td className="p-2 border">{record.id}</td>
                                <td className="p-2 border">{record.theLoai}</td>
                                <td className="p-2 border">Xem chi tiết</td>
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

export default TheLoai;
