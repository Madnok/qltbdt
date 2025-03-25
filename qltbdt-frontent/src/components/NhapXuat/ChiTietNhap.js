import { useState, useEffect } from "react";
import axios from "axios";
import { useFormattedPrice } from "../../utils/helpers";

const ChiTietNhap = ({ selectedRecord, onClose, refreshData }) => {
    const formatPrice = useFormattedPrice();
    const [thietBiNhapData, setThietBiNhapData] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [backupThietBiNhapData, setBackupThietBiNhapData] = useState([]);
    const [backupTruongHopNhap, setBackupTruongHopNhap] = useState("");
    const [backupThoiGianBaoHanh, setBackupThoiGianBaoHanh] = useState("");
    const [truongHopNhap, setTruongHopNhap] = useState(selectedRecord.truongHopNhap);
    const [thoiGianBaoHanh, setThoiGianBaoHanh] = useState("");

    useEffect(() => {
        if (selectedRecord?.id) {
            axios
                .get(`http://localhost:5000/api/nhap/${selectedRecord.id}/thongtinthietbi`)
                .then((response) => {
                    const data = response.data || [];
                    setThietBiNhapData(data);

                    // Lấy thời gian bảo hành của thiết bị đầu tiên nếu có
                    if (data.length > 0) {
                        setThoiGianBaoHanh(data[0].thoiGianBaoHanh || "");
                    } else {
                        setThoiGianBaoHanh("");
                    }
                })
                .catch((error) => console.error("Lỗi tải thiết bị nhập:", error));
        }
    }, [selectedRecord]);

    const handleEdit = () => {
        setBackupThietBiNhapData([...thietBiNhapData]); // Sao lưu danh sách thiết bị
        setBackupTruongHopNhap(truongHopNhap); // Sao lưu trường hợp nhập
        setBackupThoiGianBaoHanh(thoiGianBaoHanh);
        setIsEditing(true);
    };

    const handleDeleteDevice = (thietbi_id) => {
        setThietBiNhapData((prev) => prev.filter((tb) => tb.thietbi_id !== thietbi_id));
    };

    const handleUpdateThietBi = (thietbi_id, field, value) => {
        setThietBiNhapData((prev) =>
            prev.map((tb) =>
                tb.thietbi_id === thietbi_id ? { ...tb, [field]: value } : tb
            )
        );
    };

    const handleSaveChanges = () => {

        if (thietBiNhapData.length === 0) {
            alert("Bạn không thể để phiếu nhập rỗng! Nếu muốn xóa thiết bị này, vui lòng xóa phiếu nhập!");
            return;
        }

        axios
            .put(`http://localhost:5000/api/nhap/${selectedRecord.id}`, {
                truongHopNhap,
                thoiGianBaoHanh,
                thietBiNhap: thietBiNhapData,
            })
            .then(() => {
                alert("Cập nhật phiếu nhập thành công!");
                setIsEditing(false);
                refreshData();
            })
            .catch((error) => console.error("Lỗi khi cập nhật phiếu nhập:", error));
    };

    const handleCancelEdit = () => {
        setThietBiNhapData([...backupThietBiNhapData]); // Phục hồi danh sách thiết bị
        setTruongHopNhap(backupTruongHopNhap); // Phục hồi trường hợp nhập
        setBackupThoiGianBaoHanh(backupThoiGianBaoHanh);
        setIsEditing(false);
    };
  

    const handleDeletePhieuNhap = () => {
        if (window.confirm("Bạn có chắc chắn muốn xóa phiếu nhập này?")) {
            axios
                .delete(`http://localhost:5000/api/nhap/${selectedRecord.id}`)
                .then(() => {
                    alert("Xóa phiếu nhập thành công!");
                    refreshData();
                    onClose();
                })
                .catch((error) => console.error("Lỗi khi xóa phiếu nhập:", error));
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        date.setHours(date.getHours() + 7); // Chuyển sang GMT+7
        return date.toISOString().slice(0, 16).replace("T", " ");
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
                        onClick={handleDeletePhieuNhap}
                    >
                        <i className="text-lg text-black fas fa-trash"></i>
                    </button>

                    {/* Nút Sửa */}
                    <button
                        className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-yellow-500 hover:text-white"
                        onClick={handleEdit}
                    >
                        <i className="text-lg text-black fas fa-edit"></i>
                    </button>
                    {/* Nút Đóng */}
                    <button
                        className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-300"
                        onClick={onClose}
                    >
                        <i className="text-lg text-black fas fa-times"></i>
                    </button>
                </div>
            </div>

            {/* Thông tin phiếu nhập */}
            <div className="grid grid-cols-2 gap-2 p-4">
                <div>
                    <label className="font-semibold">ID Phiếu Nhập:</label>
                    <input
                        type="text"
                        value={`GN${selectedRecord.id || ""}`}
                        className="w-full p-2 bg-gray-100 border"
                        disabled
                    />
                </div>
                <div>
                    <label className="font-semibold">Ngày tạo:</label>
                    <input
                        type="text"
                        value={formatDate(selectedRecord.ngayTao)}
                        className="w-full p-2 bg-gray-100 border"
                        disabled
                    />
                </div>
                <div>
                    <label className="font-semibold">Người Tạo:</label>
                    <input
                        type="text"
                        value={selectedRecord.nguoiTao || "Chưa có"}
                        className="w-full p-2 bg-gray-100 border"
                        disabled
                    />
                </div>
                <div>
                    <label className="block font-medium">Trường Hợp Nhập:</label>
                    {isEditing ? (
                        <select
                            value={truongHopNhap}
                            onChange={(e) => setTruongHopNhap(e.target.value)}
                            className="w-full p-2 border rounded"
                        >
                            <option value="muaMoi">Mua Mới</option>
                            <option value="taiTro">Được Tài Trợ</option>
                        </select>
                    ) : (
                        <input
                            type="text"
                            value={truongHopNhap === "muaMoi" ? "Mua Mới" : "Được Tài Trợ"}
                            className="w-full p-2 bg-gray-100 border"
                            disabled
                        />
                    )}
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
                            <th className="px-4 py-2 border-b text-sm grid-cols-2">Bảo Hành <span className="text-sm text-gray-500">(Tháng)</span></th>
                            <th className="px-4 py-2 border-b">Đơn Giá</th>
                            {isEditing ? (
                                <th className="px-4 py-2 border-b">Thao Tác</th>
                            ) : (
                                <th className="px-4 py-2 border-b">Tổng Tiền</th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {thietBiNhapData.length > 0 ? (
                            thietBiNhapData.map((tb) => (
                                <tr key={tb.id} className="text-center">
                                    <td className="p-2 border">{tb.thietbi_id}</td>
                                    <td className="p-2 border">{tb.tenThietBi}</td>
                                    <td className="p-2 border">
                                        {isEditing ? (
                                            <input
                                                type="number"
                                                value={tb.soLuong}
                                                min="1"
                                                onChange={(e) =>
                                                    handleUpdateThietBi(tb.thietbi_id, "soLuong", Number(e.target.value))
                                                }
                                                className="w-1/2 p-1 border rounded"
                                            />
                                        ) : (
                                            tb.soLuong
                                        )}
                                    </td>
                                    <td className="p-2 border">
                                        {isEditing ? (
                                            <input
                                                type="number"
                                                value={tb.thoiGianBaoHanh || 1}
                                                min="1"
                                                onChange={(e) => handleUpdateThietBi(tb.thietbi_id, "thoiGianBaoHanh", Number(e.target.value))}
                                                className="w-1/2 p-1 border rounded"
                                            />
                                        ) : (
                                            tb.thoiGianBaoHanh || "Chưa Có"
                                        )}
                                    </td>
                                    <td className="p-2 border">{formatPrice(tb.donGia)}</td>
                                    {isEditing ? (
                                        <td className="p-2 border">
                                            <button
                                                className="px-3 py-1 text-white bg-red-500 rounded"
                                                onClick={() => handleDeleteDevice(tb.thietbi_id)}
                                            >
                                                Xóa
                                            </button>
                                        </td>
                                    ) : (
                                        <td className="p-2 border">{formatPrice(tb.soLuong * tb.donGia)}</td>
                                    )}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="p-2 text-center border">
                                    Không có thiết bị nào
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
                {isEditing && (
                    <div className="grid grid-cols-2 gap-4 mt-4">
                        <button
                            className="px-4 py-2 text-white bg-gray-500 rounded"
                            onClick={handleCancelEdit}
                        >
                            Hủy
                        </button>
                        <button
                            className="px-4 py-2 text-white bg-green-500 rounded"
                            onClick={() => handleSaveChanges()} // Mở FormPhieuNhap
                        >
                            Lưu Thay Đổi
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChiTietNhap;


