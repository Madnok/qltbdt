import axios from "axios";
import { useEffect, useState } from "react";
import { getTinhTrangLabel } from "../../../utils/constants";

const ChiTietTTTB = ({ onClose, record, refreshData }) => {
    const [phongList, setPhongList] = useState([]);
    const [thietBiList, setThietBiList] = useState([]);
    const [editData, setEditData] = useState(record);
    const [isEditing, setIsEditing] = useState(false);

   
    const tinhTrangList = ["chua_dung", "dang_dung"].map(value => ({
        value,
        label: getTinhTrangLabel(value),
    }));

    useEffect(() => {
        axios.get("http://localhost:5000/api/tttb/phong-list")
            .then(response => setPhongList(response.data))
            .catch(error => console.error("Lỗi tải danh sách phòng:", error));

        axios.get("http://localhost:5000/api/tttb/thietbi-list")
            .then(response => setThietBiList(response.data))
            .catch(error => console.error("Lỗi tải danh sách thiết bị:", error));
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditData({
            ...editData,
            ...editData,
            [name]: ["phong_id", "thietbi_id"].includes(name) ? parseInt(value) : value,
        });
    };

    const toggleEdit = () => {
        setIsEditing(prev => !prev);
        setEditData(record);
    };

    const handleSave = async () => {
        try {
            await axios.put(`http://localhost:5000/api/tttb/${record.id}`, editData, { withCredentials: true });
            alert("Cập nhật thông tin thiết bị thành công!");
            setIsEditing(false);
            refreshData();
            onClose();
        } catch (error) {
            console.error("Lỗi khi cập nhật thông tin thiết bị:", error);
            alert("Có lỗi xảy ra khi cập nhật thông tin thiết bị!");
        }
    };

    const handleDelete = async () => {
        if (window.confirm("Bạn có chắc chắn muốn xóa thông tin thiết bị này?")) {
            try {
                await axios.delete(`http://localhost:5000/api/tttb/${record.id}`, { withCredentials: true });
                alert("Xóa thông tin thiết bị thành công!");
                refreshData();
                onClose();
            } catch (error) {
                console.error("Lỗi khi xóa thông tin thiết bị:", error);
                alert("Có lỗi xảy ra khi xóa thông tin thiết bị!");
            }
        }
    };

    const handleCancel = () => {
        setEditData(record);
        setIsEditing(false);
    };

    const getTenThietBi = (thietbi_id) => {
        const thietBi = thietBiList.find(t => Number(t.id) === Number(thietbi_id));
        return thietBi ? thietBi.tenThietBi : "";
    };

    return (
        <div className="flex flex-col h-full bg-white shadow-md">
            <div className="flex items-center justify-between py-4 pb-4 pl-2 shadow-md">
                <h2 className="text-lg font-semibold">Chi Tiết TT Thiết Bị</h2>

                <div className="flex space-x-2">
                    {/* xóa */}
                    <button className="w-10 h-10 rounded-full hover:bg-red-500 hover:text-white"
                        onClick={handleDelete}>
                        <i className="text-lg text-black fas fa-trash"></i>
                    </button>
                    {/* nút sửa */}
                    <button className="w-10 h-10 rounded-full hover:bg-yellow-500 hover:text-white"
                        onClick={toggleEdit}>
                        <i className="text-lg text-black fas fa-edit"></i>
                    </button>
                    {/* Nút đóng rightpanel */}
                    <button className="w-10 h-10 rounded-full hover:bg-gray-300"
                        onClick={onClose}>
                        <i className="text-lg text-black fas fa-times"></i>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2 p-2 pb-8">
                {/* ID */}
                <div>
                    <label className="font-semibold">ID Thông Tin TB:</label>
                    <input type="text" value={`TTTB${record.id}`} className="w-full p-2 bg-gray-100 border" disabled />
                </div>

                {/* ID thiết bị */}
                <div>
                    <label className="font-semibold">ID Thiết Bị:</label>
                    <input type="text" value={`TB${isEditing ? editData.thietbi_id : record.thietbi_id}`} className="w-full p-2 bg-gray-100 border" disabled />
                </div>

                {/* ID Phiếu Nhập */}
                <div>
                    <label className="font-semibold">ID Phiếu Nhập:</label>
                    <input type="text" value={`GN${record.phieunhap_id}`} className="w-full p-2 bg-gray-100 border" disabled />
                </div>

                {/* Chọn Tên Thiết Bị */}
                <div>
                    <label className="font-semibold">Tên Thiết Bị:</label>
                    {isEditing ? (
                        <select
                            name="thietbi_id"
                            value={editData.thietbi_id}
                            onChange={handleChange}
                            className="w-full p-2 border"
                        >
                            {thietBiList.map(tb => (
                                <option key={tb.id} value={tb.id}>{tb.tenThietBi}</option>
                            ))}
                        </select>
                    ) : (
                        <input
                            type="text"
                            value={getTenThietBi(record.thietbi_id)}
                            className="w-full p-2 border"
                            disabled
                        />
                    )}
                </div>

                {/* Chọn Phòng */}
                <div>
                    <label className="font-semibold">Phòng:</label>
                    {isEditing ? (
                        <select name="phong_id"
                            value={editData.phong_id || ""}
                            onChange={handleChange}
                            className="w-full p-2 border"
                        >
                            <option value="">Chưa có</option>
                            {phongList.map(p => (
                                <option key={p.id} value={p.id}>{p.phong}</option>
                            ))}
                        </select>

                    ) : (
                        <input
                            type="text"
                            value={record && phongList.length > 0 ? phongList.find(p => p.id === record.phong_id)?.phong || "" : ""}
                            className="w-full p-2 border"
                            disabled
                        />
                    )}
                </div>

                {/* Chọn Trạng Thái */}
                <div>
                    <label className="font-semibold">Trạng Thái:</label>
                    {isEditing ? (
                        <select name="tinhTrang" value={editData.tinhTrang} onChange={handleChange} className="w-full p-2 border">
                            {tinhTrangList.map(tt => (
                                <option key={tt.value} value={tt.value}>{tt.label}</option>
                            ))}
                        </select>
                    ) : (
                        <input type="text" value={getTinhTrangLabel(record.tinhTrang)} className="w-full p-2 border" disabled />
                    )}
                </div>

                {/* Người Được Cấp */}
                <div className="col-span-2">
                    <label className="font-semibold">Người Được Cấp:</label>
                    {isEditing ? (
                        <input
                            type="text"
                            name="nguoiDuocCap"
                            value={editData.nguoiDuocCap || ""}
                            onChange={handleChange}
                            className="w-full p-2 border"
                        />

                    ) : (
                        <input
                            type="text"
                            name="nguoiDuocCap"
                            value={record.nguoiDuocCap || ""}
                            className="w-full p-2 border"
                            disabled />
                    )}

                </div>

                {/* Nút Lưu & Hủy */}
                {isEditing && (
                    <div className="flex items-start justify-center pl-2 mt-2 space-x-6 col-span-2">
                        <button className="px-4 py-2 text-white bg-green-500 rounded"
                            onClick={handleSave}>Lưu</button>
                        <button className="px-4 py-2 text-white bg-gray-500 rounded"
                            onClick={handleCancel}>Hủy</button>
                    </div>
                )}
            </div>
            <div className="flex items-center justify-between py-4 pl-2 border-y">
                <h2 className="text-lg font-semibold">Thông Tin Nhập</h2>
            </div>
            <div className="px-2 py-4">
                <p>nội dung nhập</p>
            </div>

            <div className="flex items-center justify-between py-4 pl-2 border-y">
                <h2 className="text-lg font-semibold">Thông Tin Xuất</h2>
            </div>
            <div className="px-2 py-4">
                <p>nội dung xuất</p>
            </div>
        </div>
    )
}

export default ChiTietTTTB;