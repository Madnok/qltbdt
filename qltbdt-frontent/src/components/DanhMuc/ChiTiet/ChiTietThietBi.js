import axios from "axios";
import { useEffect, useState } from "react";
import { useFormattedPrice } from "../../../utils/helpers";

const ChiTietThietBi = ({ onClose, record, refreshData }) => {
    const [editData, setEditData] = useState(record);
    const formatPrice = useFormattedPrice();
    const [isEditing, setIsEditing] = useState(false);
    const [danhSachTheLoai, setDanhSachTheLoai] = useState([]);

    useEffect(() => {
        axios.get(`http://localhost:5000/api/thietbi/${record.id}`)
            .then(response => setEditData(response.data))
            .catch(error => console.error("Lỗi tải chi tiết:", error));

        axios.get("http://localhost:5000/api/theloai")
            .then(response => setDanhSachTheLoai(response.data))
            .catch(error => console.error("Lỗi lấy danh sách thể loại:", error));
    }, [record]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditData({
            ...editData,
            [name]: name === "theloai_id" ? parseInt(value) : value,
        });
    };

    const toggleEdit = () => {
        setIsEditing(prev => !prev);
        setEditData(record);
    };

    const handleSave = async () => {
        try {
            await axios.put(`http://localhost:5000/api/thietbi/${record.id}`, editData);
            alert("Cập nhật thành công!");
            setIsEditing(false);
            refreshData();
            onClose();
        } catch (error) {
            console.error("Lỗi cập nhật:", error);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("Bạn có chắc muốn xóa thiết bị này không?")) return;
        try {
            await axios.delete(`http://localhost:5000/api/thietbi/${record.id}`);
            alert("Xóa thành công!");
            refreshData();
            onClose();
        } catch (error) {
            console.error("Lỗi xóa thiết bị:", error);
        }
    };

    const handleCancel = () => {
        setEditData(record);
        setIsEditing(false);
    };

    return (
        <div className="flex flex-col h-full bg-white border-l shadow-md">
            {/* Header */}
            <div className="flex items-center justify-between py-4 pb-4 pl-2 shadow-md">
                <h2 className="text-lg font-semibold">Chi Tiết Thiết Bị</h2>

                <div className="flex space-x-2">
                    <button className="w-10 h-10 rounded-full hover:bg-red-500 hover:text-white"
                        onClick={handleDelete}>
                        <i className="text-lg text-black fas fa-trash"></i>
                    </button>

                    <button className="w-10 h-10 rounded-full hover:bg-yellow-500 hover:text-white"
                        onClick={toggleEdit}>
                        <i className="text-lg text-black fas fa-edit"></i>
                    </button>

                    <button className="w-10 h-10 rounded-full hover:bg-gray-300"
                        onClick={onClose}>
                        <i className="text-lg text-black fas fa-times"></i>
                    </button>
                </div>
            </div>

            {/* Body */}
            <div className="grid grid-cols-2 gap-2 p-2 ">
                {/* ID */}
                <div>
                    <label className="font-semibold">ID:</label>
                    <input type="text" value={`TB${record.id}`} className="w-full p-2 bg-gray-100 border" disabled />
                </div>

                {/* Thể Loại */}
                <div>
                    <label className="font-semibold">Thể Loại:</label>
                    {isEditing ? (
                        <select
                            name="theloai_id"
                            value={editData.theloai_id || ""}
                            onChange={handleChange}
                            className="w-full p-2 border"
                        >
                            {danhSachTheLoai.map((loai) => (
                                <option key={loai.id} value={loai.id}>
                                    {loai.theLoai}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <input type="text"
                            value={danhSachTheLoai.find((loai) => loai.id === editData.theloai_id)?.theLoai || "Không xác định"}
                            className="w-full p-2 bg-gray-100 border"
                            disabled />
                    )}
                </div>

                {/* Tên Thiết Bị */}
                <div className="col-span-2">
                    <label className="font-semibold">Tên Thiết Bị:</label>
                    <input type="text" name="tenThietBi" value={editData.tenThietBi}
                        onChange={handleChange} className="w-full p-2 border"
                        disabled={!isEditing} />
                </div>

                {/* Tồn Kho */}
                <div>
                    <label className="font-semibold">Tồn Kho:</label>
                    <input type="number" name="tonKho" value={editData.tonKho}
                        onChange={handleChange} className="w-full p-2 border"
                        disabled={!isEditing} />
                </div>

                {/* Đơn Giá */}
                <div>
                    <label className="font-semibold">Đơn Giá:</label>
                    <input
                        type="text"
                        name="donGia"
                        value={isEditing ? editData.donGia : formatPrice(editData.donGia)}
                        onChange={(e) => {
                            const rawValue = e.target.value.replace(/\D/g, "");
                            handleChange({ target: { name: "donGia", value: rawValue } });
                        }}
                        className="w-full p-2 border"
                        disabled={!isEditing}
                    />
                </div>

                {/* Tồn Kho */}
                <div>
                    <label className="font-semibold">Tổng Tiền:</label>
                    <input type="text" name="tonKho" value={formatPrice(editData.tonKho * editData.donGia)}
                        className="w-full p-2 border" disabled />
                </div>

                {/* Mô Tả */}
                <div className="col-span-2">
                    <label className="font-semibold">Mô Tả:</label>
                    <input type="text" name="moTa" value={editData.moTa}
                        onChange={handleChange} className="w-full p-2 border"
                        disabled={!isEditing} />
                </div>
            </div>

            {/* Nút Lưu & Hủy */}
            {isEditing && (
                <div className="flex pl-2 mt-4 space-x-2">
                    <button className="px-4 py-2 text-white bg-green-500 rounded"
                        onClick={handleSave}>Lưu</button>
                    <button className="px-4 py-2 text-white bg-gray-500 rounded"
                        onClick={handleCancel}>Hủy</button>
                </div>
            )}
        </div>
    );
};

export default ChiTietThietBi;
