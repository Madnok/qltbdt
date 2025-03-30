import axios from "axios";
import { useState, useEffect } from "react";
import { maxTangTheoToa, getTinhTrangLabel } from "../../../utils/constants";
import { BsTrash, BsSearch } from "react-icons/bs";

const ChiTietPhong = ({ record, onClose, refreshData }) => {
    const [thietBiList, setThietBiList] = useState([]);
    const [filteredThietBiList, setFilteredThietBiList] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [editData, setEditData] = useState(record);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (!record) return;

        setEditData(record);

        const fetchData = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/api/phong/danhsach-thietbi/${record.id}`);
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
    const handleDeleteThietBi = async (thietbi_id, soLuong) => {
        console.log("Gỡ thiết bị ID:", thietbi_id, "Số lượng:", soLuong);
    
        if (!window.confirm("Bạn có chắc chắn muốn gỡ thiết bị này khỏi phòng không?")) return;
    
        try {
            await axios.post("http://localhost:5000/api/phong/xoathietbi", {
                phong_id: record.id,
                thietbi_id,
                soLuong,
            });
    
            // Cập nhật danh sách thiết bị sau khi xóa
            const updatedThietBiList = thietBiList.filter(tb => tb.thietbi_id !== thietbi_id);
            setThietBiList(updatedThietBiList);
            setFilteredThietBiList(updatedThietBiList);
    
            alert("Xóa Thiết Bị Khỏi Phòng Thành Công!");
            refreshData();
        } catch (error) {
            console.error("Lỗi khi gỡ thiết bị khỏi phòng:", error);
        }
    };
    

    const handleDelete = async () => {
        if (!window.confirm("Bạn có chắc muốn xóa phòng này không?")) return;
    
        try {
            await axios.delete(`http://localhost:5000/api/phong/${record.id}`);
            alert("Xóa phòng thành công!");
            refreshData();
            onClose();
        } catch (error) {
            console.error("Lỗi xóa phòng:", error);
    
            if (error.response) {
                const { status, data } = error.response;
    
                if (status === 400) {
                    alert(`Không thể xóa phòng: ${data.error}`);
                } else if (status === 404) {
                    alert("Phòng không tồn tại hoặc đã bị xóa!");
                } else if (status === 500) {
                    alert("Lỗi server! Vui lòng thử lại sau.");
                } else {
                    alert(`Đã xảy ra lỗi: ${data.error || "Không xác định"}`);
                }
            } else {
                alert("Không thể kết nối đến server! Kiểm tra kết nối mạng.");
            }
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
                        onChange={handleChange} className="w-full p-2 bg-gray-100 border"
                        disabled={!isEditing} />
                </div>
            </div>

            {/* Nút Lưu & Hủy */}
            {isEditing && (
                <div className="grid grid-cols-3 gap-2 p-2">
                    <p></p>
                    <div className="flex flex-row space-x-2">
                        <button className="w-1/2 px-2 py-2 text-white bg-green-500 rounded"
                            onClick={handleSave}>Lưu</button>
                        <button className="w-1/2 px-2 py-2 text-white bg-gray-500 rounded"
                            onClick={handleCancel}>Hủy</button>
                    </div>
                </div>
            )}
            <div className="p-4 bg-white rounded-lg">
                <div className="grid items-center grid-cols-2 gap-2 overflow-x-auto ">
                    <h3 className="mb-4 text-xl font-semibold">Các Thiết Bị Có Trong Phòng</h3>
                    <div className="relative flex flex-col justify-between gap-4 pb-4 md:flex-row">
                        <input
                            type="text"
                            placeholder="Tìm Kiếm..."
                            value={searchTerm}
                            onChange={handleSearch}
                            className="py-1 pl-10 pr-4 border rounded-lg md:w-full focus:inline-none"
                        />
                        <BsSearch className="absolute text-gray-400 left-3 top-2" />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full border border-gray-300 table-auto">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-4 py-2 border">Tên Thiết Bị</th>
                                <th className="px-4 py-2 border">Số Lượng</th>
                                <th className="px-4 py-2 border">Tình Trạng</th>
                                <th className="px-4 py-2 border">Hành Động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredThietBiList.length > 0 ? (
                                filteredThietBiList.map((tb) => (
                                    <tr key={tb.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-2 border">{tb.tenThietBi}</td>
                                        <td className="px-4 py-2 text-center border">{tb.soLuong}</td>
                                        <td className="px-4 py-2 text-center border">{getTinhTrangLabel(tb.tinhTrang)}</td>
                                        <td className="px-4 py-2 text-center border">
                                            <button
                                                onClick={() => handleDeleteThietBi(tb.thietbi_id, tb.soLuong)}
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
