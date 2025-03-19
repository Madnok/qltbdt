import axios from "axios";
import { useState, useEffect } from "react";
import { maxTangTheoToa } from "../../../utils/constants";
import { BsTrash, BsSearch } from "react-icons/bs";

const ChiTietPhong = ({ record, onClose, refreshData }) => {
    const [thietBiList, setThietBiList] = useState([]);
    const [filteredThietBiList, setFilteredThietBiList] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [editData, setEditData] = useState(record);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        setEditData(record);

        const fetchData = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/api/tttb/phong/${record.id}`);
                setThietBiList(response.data);
                setFilteredThietBiList(response.data);
            } catch (error) {
                console.error("Lỗi khi lấy danh sách thiết bị:", error);
            }
        };

        fetchData();
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
    // Tìm kiếm  
    const handleSearch = (e) => {
        const value = e.target.value?.toLowerCase?.() || ""; // Kiểm tra giá trị đầu vào
        setSearchTerm(value);

        const filtered = thietBiList.filter((tb) => {
            // Kiểm tra `tenThietBi` và `theLoai` có tồn tại trước khi gọi `toLowerCase`
            const tenThietBi = tb.tenThietBi?.toLowerCase?.() || "";
            const theLoai = tb.theLoai?.toLowerCase?.() || "";

            return tenThietBi.includes(value) || theLoai.includes(value);
        });

        setFilteredThietBiList(filtered);
    };

    // Xóa thiết bị trong phòng
    const handleDeleteThietBi = async (id) => {
        console.log("Gỡ thiết bị ID:", id);
        if (!window.confirm("Bạn có chắc chắn muốn gỡ thiết bị này khỏi phòng không?")) return;

        try {
            await axios.put(`http://localhost:5000/api/tttb/thietbi/${id}/remove-from-phong`);

            // Gọi lại API để cập nhật danh sách thiết bị
            const response = await axios.get(`http://localhost:5000/api/tttb/phong/${record.id}`);
            setThietBiList(response.data);
            setFilteredThietBiList(response.data);

            alert("Xóa Thiết Bị Khỏi Phòng Thành Công!");
        } catch (error) {
            console.error("Lỗi khi gỡ thiết bị khỏi phòng:", error);
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
            <div className="grid grid-cols-2 gap-2 px-4 py-2">
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
                <div>
                    <label className="font-semibold">Chức Năng:</label>
                    <input type="text" name="chucNang" value={editData.chucNang}
                        onChange={handleChange} className="w-full p-2 border"
                        disabled={!isEditing} />
                </div>
            </div>

            {/* Nút Lưu & Hủy */}
            {isEditing && (
                <div className="grid grid-cols-3 gap-2 p-2">
                    <p></p>
                    <div className="space-x-2 flex flex-row">
                        <button className="px-2 py-2 w-1/2 text-white bg-green-500 rounded"
                            onClick={handleSave}>Lưu</button>
                        <button className="px-2 py-2 w-1/2 text-white bg-gray-500 rounded"
                            onClick={handleCancel}>Hủy</button>
                    </div>
                </div>
            )}
            <div className="p-4 bg-white rounded-lg">
                <div className="grid grid-cols-2 gap-2">
                    <h3 className="text-xl font-semibold mb-4">Các Thiết Bị Có Trong Phòng</h3>
                    <div className="pb-4 flex flex-col md:flex-row justify-between items-center gap-4 relative">
                        <input
                            type="text"
                            placeholder="Tìm Kiếm..."
                            value={searchTerm}
                            onChange={handleSearch}
                            className="md:w-80 pl-10 pr-4 py-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <BsSearch className="absolute left-3 top-2 text-gray-400" />
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-2 pb-4">
                    <select name="theloai" className="w-full p-2 border rounded-lg">
                        <option>Thể Loại 1</option>
                        <option>Thể Loại 2</option>
                        <option>Thể Loại 3</option>
                        <option>Thể Loại 4</option>
                        <option>Thể Loại 5</option>
                        <option>Thể Loại 6</option>
                    </select>
                    <select name="thietbi" className="w-full p-2 border rounded-lg">
                        <option>Thiết bị 1</option>
                        <option>Thiết bị 2</option>
                        <option>Thiết bị 3</option>
                    </select>
                    <button className=" items-center gap-2 px-4 w-full py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                        Thêm
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full table-auto border border-gray-300">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-4 py-2 border">Tên Thiết Bị</th>
                                <th className="px-4 py-2 border">Số Lượng</th>
                                <th className="px-4 py-2 border">Hành Động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredThietBiList.length > 0 ? (
                                filteredThietBiList.map((tb) => (
                                    <tr key={tb.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-2 border">{tb.tenThietBi}</td>
                                        <td className="px-4 py-2 border text-center">{tb.soLuong}</td>
                                        <td className="px-4 py-2 border text-center">
                                            <button
                                                onClick={() => handleDeleteThietBi(tb.id)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <BsTrash />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="px-4 py-2 text-center text-gray-500">
                                        Không có thiết bị nào trong phòng này.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ChiTietPhong;
