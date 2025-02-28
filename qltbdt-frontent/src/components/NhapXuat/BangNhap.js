import { paginateData } from "../../utils/helpers";
import { useState } from "react";
const BangNhap = ({ setSelectedRecord }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const data = [
        { id: "GN1", date: "26/4/2023 20:35", type: "Mua mới", device: "Máy chiếu YG650" },
        { id: "GN2", date: "26/4/2023 21:48", type: "Tài trợ", device: "Laptop Dell XPS" },
        { id: "GN1", date: "26/4/2023 20:35", type: "Mua mới", device: "Máy chiếu YG650" },
        { id: "GN2", date: "26/4/2023 21:48", type: "Tài trợ", device: "Laptop Dell XPS" },
        { id: "GN1", date: "26/4/2023 20:35", type: "Mua mới", device: "Máy chiếu YG650" },
        { id: "GN2", date: "26/4/2023 21:48", type: "Tài trợ", device: "Laptop Dell XPS" },
        { id: "GN1", date: "26/4/2023 20:35", type: "Mua mới", device: "Máy chiếu YG650" },
        { id: "GN2", date: "26/4/2023 21:48", type: "Tài trợ", device: "Laptop Dell XPS" },
        { id: "GN1", date: "26/4/2023 20:35", type: "Mua mới", device: "Máy chiếu YG650" },
        { id: "GN2", date: "26/4/2023 21:48", type: "Tài trợ", device: "Laptop Dell XPS" },
        { id: "GN1", date: "26/4/2023 20:35", type: "Mua mới", device: "Máy chiếu YG650" },
        { id: "GN2", date: "26/4/2023 21:48", type: "Tài trợ", device: "Laptop Dell XPS" },
    ];

    const { currentItems, totalPages } = paginateData(data, currentPage);

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
                            <th className="px-4 py-2 border-b">ID</th>
                            <th className="px-4 py-2 border-b">Ngày tạo</th>
                            <th className="px-4 py-2 border-b">Trường hợp</th>
                            <th className="px-4 py-2 border-b">Thiết bị</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.map((record, index) => (
                            <tr
                                key={record.id} className="text-center cursor-pointer hover:bg-gray-100"
                                onClick={() => setSelectedRecord(record)}
                            >
                                <td className="p-2 border">{record.id}</td>
                                <td className="p-2 border">{record.date}</td>
                                <td className="p-2 border">{record.type}</td>
                                <td className="p-2 border">{record.device}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Phân trang */}
                {totalPages > 1 && (
                    <div className="flex justify-center my-4 space-x-2">
                        {/* Nút "Trước" - Ẩn khi ở trang đầu tiên */}
                        {currentPage > 1 && (
                            <button className="px-4 py-2 bg-gray-200 border rounded hover:bg-gray-300"
                                onClick={() => goToPage(currentPage - 1)}>← Trước</button>
                        )}

                        {/* Hiển thị số trang */}
                        {[...Array(totalPages)].map((_, i) => (
                            <button key={i} className={`px-4 py-2 border rounded 
                            ${currentPage === i + 1 ? "bg-blue-500 text-white" : "bg-gray-200 hover:bg-gray-300"}`}
                                onClick={() => goToPage(i + 1)}>{i + 1}</button>
                        ))}

                        {/* Nút "Sau" - Ẩn khi ở trang cuối */}
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
