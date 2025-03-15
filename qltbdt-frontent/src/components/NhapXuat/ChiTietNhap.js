import { useState, useEffect } from "react";
import axios from "axios";
import { getTinhTrangLabel } from "../../utils/constants";
import { useFormattedPrice } from "../../utils/helpers";


const ChiTietNhap = ({ selectedRecord, onClose}) => {
    const formatPrice = useFormattedPrice();
    const [thietBiNhapData, setThietBiNhapData] = useState([]);


    useEffect(() => {
        if (selectedRecord?.id) {
            axios.get(`http://localhost:5000/api/nhap/${selectedRecord.id}/thongtinthietbi`)
                .then((response) => {
                    console.log("Danh sách thiết bị nhập:", response.data);
                    setThietBiNhapData(response.data || []);
                })
                .catch((error) => console.error("Lỗi tải thiết bị nhập:", error));
        }
    }, [selectedRecord]);

    const formatDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        date.setHours(date.getHours() + 7); // Chuyển sang GMT+7
        return date.toISOString().slice(0, 16).replace("T", " ");
    };

    const handleDelete = async () => {
        if (!window.confirm("Bạn có chắc muốn xóa phiếu nhập này không?")) return;
    
        try {
            await axios.delete(`http://localhost:5000/api/nhap/${selectedRecord.id}`);
            alert("Xóa phiếu nhập thành công!");
            onClose(); // Đóng chi tiết nhập sau khi xóa
        } catch (error) {
            console.error("Lỗi khi xóa phiếu nhập:", error);
            alert("Xóa thất bại, vui lòng thử lại!");
        }
    };
    

    return (
        <div className="flex flex-col h-full bg-white border-l shadow-md">
            {/* Header */}
            <div className="flex items-center justify-between p-2 bg-white border-b">
                <h2 className="text-xl font-semibold">Chi tiết ghi nhập</h2>
                <div className="flex space-x-2">
                    {/* Nút Xóa */}
                    <button
                        className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-red-500 hover:text-white"
                        onClick={handleDelete}
                    >
                        <i className="text-lg text-black fas fa-trash"></i>
                    </button>

                    {/* Nút Sửa */}
                    <button
                        className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-yellow-500 hover:text-white"
                    >
                        <i className="text-lg text-black fas fa-edit"></i>
                    </button>

                    {/* Nút Đóng */}
                    <button className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-300" onClick={onClose}
                    >
                        <i className="text-lg text-black fas fa-times"></i>
                    </button>
                </div>
            </div>

            {/* Thông tin phiếu nhập */}
            <div className="grid grid-cols-2 gap-2 p-4">
                <div>
                    <label className="font-semibold">ID Phiếu Nhập:</label>
                    <input type="text" value={`GN${selectedRecord.id || ""}`} className="w-full p-2 bg-gray-100 border" disabled />
                </div>
                <div>
                    <label className="font-semibold">Ngày tạo:</label>
                    <input type="text" value={formatDate(selectedRecord.ngayTao)} className="w-full p-2 bg-gray-100 border" disabled />
                </div>
                <div>
                    <label className="font-semibold">Người Tạo:</label>
                    <input type="text" value={selectedRecord.nguoiTao || "Chưa có"} className="w-full p-2 bg-gray-100 border" disabled />
                </div>
                <div>
                    <label className="font-semibold">Trường hợp nhập:</label>
                    <input type="text" value={getTinhTrangLabel(selectedRecord.truongHopNhap) || "Không rõ"} className="w-full p-2 bg-gray-100 border" disabled />
                </div>
            </div>

            {/* Danh sách thiết bị nhập */}
            <div className="p-4 overflow-auto">
                <h3 className="text-lg font-semibold">Danh Sách Thiết Bị Nhập</h3>
                <table className="w-full mt-2 border">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="px-4 py-2 border-b">TB ID</th>
                            <th className="px-4 py-2 border-b">Tên Thiết Bị</th>
                            <th className="px-4 py-2 border-b">Số Lượng</th>
                            <th className="px-4 py-2 border-b">Đơn Giá</th>
                        </tr>
                    </thead>
                    <tbody>
                        {thietBiNhapData.length > 0 ? (
                            thietBiNhapData.map((tb) => (
                                <tr key={tb.id} className="text-center">
                                    <td className="p-2 border">{tb.thietbi_id}</td>
                                    <td className="p-2 border">{tb.tenThietBi}</td>
                                    <td className="p-2 border">{tb.soLuong}</td>
                                    <td className="p-2 border">{formatPrice(tb.donGia)}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="p-2 text-center border">Không có thiết bị nào</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ChiTietNhap;
