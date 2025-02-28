import axios from "axios";
import { useState, useEffect } from "react";
import {maxTangTheoToa} from "../../../utils/constants";

const ChiTietPhong = ({ record, onClose, refreshData }) => {
    const [editData, setEditData] = useState(record);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        setEditData(record);
    }, [record]);

    // Cập nhật dữ liệu khi người dùng thay đổi giá trị input
    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditData({ ...editData, [name]: value });
    };

    // Bật/Tắt chế độ chỉnh sửa
    const toggleEdit = () => {
        setIsEditing((prev) => !prev);
        setEditData(record);
    };

    // Lưu cập nhật phòng
    const handleSave = async () => {
        try {
            await axios.put(`http://localhost:5000/api/phong/${record.id}`, editData);
            alert("Cập nhật phòng thành công!");
            refreshData();
            setIsEditing(false);
            onClose();
        } catch (error) {
            console.error("Lỗi cập nhật phòng:", error);
        }
    };

    // Xóa phòng
    const handleDelete = async () => {
        if (!window.confirm("Bạn có chắc muốn xóa phòng này không?")) return;
        try {
            await axios.delete(`http://localhost:5000/api/phong/${record.id}`);
            alert("Xóa phòng thành công!");
            refreshData();
            onClose();
        } catch (error) {
            console.error("Lỗi xóa phòng:", error);
        }
    };

    // Hủy chỉnh sửa
    const handleCancel = () => {
        setEditData(record);
        setIsEditing(false);
    };

    return (
        <div className="flex flex-col h-full bg-white border-l shadow-md">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-white shadow-md">
                <h2 className="text-xl font-semibold">Chi Tiết Phòng</h2>
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
            <div className="grid grid-cols-2 gap-2 p-4">
                {/* ID */}
                <div>
                    <label className="font-semibold">ID Phòng:</label>
                    <input type="text" value={`P${record.id}`} className="w-full p-2 bg-gray-100 border" disabled />
                </div>

                {/* Cơ sở */}
                <div>
                    <label className="font-semibold">Cơ Sở:</label>
                    <input type="text" value={editData.coSo} className="w-full p-2 bg-gray-100 border" disabled />
                </div>

                {/* Tòa */}
                <div>
                    <label className="font-semibold">Tòa:</label>
                    <input type="text" value={editData.toa} className="w-full p-2 bg-gray-100 border" disabled />
                </div>

                {/* Tầng (Dropdown) */}
                <div>
                    <label className="font-semibold">Tầng:</label>
                    {isEditing ? (
                        <select name="tang" value={editData.tang} onChange={handleChange}
                            className="w-full p-2 border">
                            {Array.from({ length: maxTangTheoToa[editData.toa] || 1 }, (_, i) => (
                                <option key={i + 1} value={i + 1}>{i + 1}</option>
                            ))}
                        </select>
                    ) : (
                        <input type="number" value={editData.tang} className="w-full p-2 bg-gray-100 border" disabled />
                    )}
                </div>

                {/* Số Phòng (Dropdown) */}
                <div>
                    <label className="font-semibold">Số Phòng:</label>
                    {isEditing ? (
                        <select name="soPhong" value={editData.soPhong} onChange={handleChange}
                            className="w-full p-2 border">
                            {Array.from({ length: 20 }, (_, i) => (
                                <option key={i + 1} value={i + 1}>{i + 1}</option>
                            ))}
                        </select>
                    ) : (
                        <input type="number" value={editData.soPhong} className="w-full p-2 bg-gray-100 border" disabled />
                    )}
                </div>

                {/* Chức Năng */}
                <div className="col-span-2">
                    <label className="font-semibold">Chức Năng:</label>
                    <input type="text" name="chucNang" value={editData.chucNang}
                        onChange={handleChange} className="w-full p-2 border"
                        disabled={!isEditing} />
                </div>
            </div>

            {/* Nút Lưu & Hủy */}
            {isEditing && (
                <div className="flex p-4 space-x-2">
                    <button className="px-4 py-2 text-white bg-green-500 rounded"
                        onClick={handleSave}>Lưu</button>
                    <button className="px-4 py-2 text-white bg-gray-500 rounded"
                        onClick={handleCancel}>Hủy</button>
                </div>
            )}
        </div>
    );
};

export default ChiTietPhong;
