import { useState, useEffect } from "react";
import { paginateData } from "../../utils/helpers";
import axios from "axios";

const ThongTinThietBi = ({ setSelectedRecord, refresh }) => {
    const [data, setData] = useState([]);
    const [phongList, setPhongList] = useState([]);

    const fetchData = () => {
        axios.get("http://localhost:5000/api/tttb")
            .then(response => setData(response.data))
            .catch(error => console.error("Lỗi tải thông tin dữ liệu:", error));

        axios.get("http://localhost:5000/api/tttb/phong-list")
            .then(response => setPhongList(response.data))
            .catch(error => console.error("Lỗi tải danh sách phòng:", error));
    };

    useEffect(() => {
        fetchData();
    }, [refresh]);

    const selectRecord = (record) => {
        setSelectedRecord(record);
    };

    const [currentPage, setCurrentPage] = useState(1);
    const { currentItems, totalPages, indexOfFirstItem } = paginateData(data, currentPage);

    const goToPage = (pageNumber) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
        }
    };

    // Hàm tìm tên phòng theo phong_id
    const getTenPhong = (phong_id) => {
        console.log("Danh sách phòng hiện tại:", phongList); 
        console.log("phong_id nhận vào:", phong_id);
    
        const phong = phongList.find(p => Number(p.id) === Number(phong_id));
        return phong ? phong.phong : "Chưa có";
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
                            <th className="px-4 py-2 border-b">Phòng</th>
                            <th className="px-4 py-2 border-b">Người Được Cấp</th>
                            <th className="px-4 py-2 border-b">Thông Tin Nhập</th>
                            <th className="px-4 py-2 border-b">Tình Trạng</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.map((record, index) => (
                            <tr key={record.id}
                                className="text-center cursor-pointer hover:bg-gray-100"
                                onClick={() => selectRecord(record)}
                            >
                                <td className="p-2 border">{indexOfFirstItem + index + 1}</td>
                                <td className="p-2 border">TTTB{record.id}</td>
                                <td className="p-2 border">{record.tenThietBi}</td>
                                <td className="p-2 border">{getTenPhong(record.phong_id)}</td>
                                <td className="p-2 border">{record.nguoiDuocCap}</td>
                                <td className="p-2 border">GN{record.phieunhap_id}</td>
                                <td className="p-2 border">{record.tinhTrang}</td>
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

export default ThongTinThietBi;
