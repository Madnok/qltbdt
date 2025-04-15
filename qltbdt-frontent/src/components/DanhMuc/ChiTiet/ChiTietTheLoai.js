import axios from "axios";
import { useEffect, useState } from "react";

const ChiTietTheLoai = ({ record, onClose, refreshData }) => {
    const [editData, setEditData] = useState({ theLoai: record.theLoai });
    const [dsThietBi, setDsThietBi] = useState([]);
    const [isEditing, setIsEditing] = useState(false); // Trạng thái chỉnh sửa

    useEffect(() => {
        axios.get(`${process.env.REACT_APP_API_URL}/api/theloai/${record.id}`, {withCredentials: true})
            .then(response => {
                setEditData({ theLoai: response.data.theLoai.theLoai });
                setDsThietBi(response.data.dsThietBi);
            })
            .catch(error => console.error("Lỗi tải chi tiết:", error));
    }, [record]);

    const handleChange = (e) => {
        setEditData({ ...editData, [e.target.name]: e.target.value });
    };

    // Cập nhật thể loại
    const handleSave = async () => {
        const config = {withCredentials: true}
        try {
            await axios.put(`${process.env.REACT_APP_API_URL}/api/theloai/${record.id}`, editData, config);
            alert("Cập nhật thành công!");
            setIsEditing(false); // Sau khi lưu, tắt chỉnh sửa
            refreshData(); // Cập nhật lại dữ liệu
            onClose();
        } catch (error) {
            console.error("Lỗi cập nhật:", error);
        }
    };

    // Xóa thể loại
    const handleDelete = async () => {
        if (!window.confirm("Bạn có chắc muốn xóa thể loại này không?")) return;
        try {
            await axios.delete(`${process.env.REACT_APP_API_URL}/api/theloai/${record.id}`, {withCredentials: true});
            alert("Xóa thành công!");
            refreshData();
            onClose();
        } catch (error) {
            console.error("Lỗi xóa thể loại:", error);
        }
    };

    // Cancel sửa đổi
    const handleCancel = () => {
        setEditData({ theLoai: record.theLoai }); // Reset lại dữ liệu gốc
        setIsEditing(false); // Tắt chế độ chỉnh sửa
    };

    // Toggle chỉnh sửa
    const toggleEdit = () => {
        setIsEditing(prev => !prev);
        setEditData({ theLoai: record.theLoai }); // Reset dữ liệu khi bật chỉnh sửa
    };

    return (
        <div className="flex flex-col h-full bg-white border-l shadow-md">
            {/* Header Chi tiết thể loại */}
            <div className="flex items-center justify-between p-4 bg-white shadow-md">
                <h2 className="text-lg font-semibold">Chi Tiết Thể Loại</h2>

                <div className="flex space-x-2">
                    {/* Nút Xóa */}
                    <button
                        className="flex items-center justify-center w-10 h-10 transition rounded-full hover:bg-red-500 hover:text-white"
                        onClick={handleDelete}
                    >
                        <i className="text-lg text-black fas fa-trash"></i>
                    </button>

                    {/* Nút Sửa */}
                    <button
                        className="flex items-center justify-center w-10 h-10 transition rounded-full hover:bg-yellow-500 hover:text-white"
                        onClick={toggleEdit}
                    >
                        <i className="text-lg text-black fas fa-edit"></i>
                    </button>

                    {/* Nút Đóng */}
                    <button
                        className="flex items-center justify-center w-10 h-10 transition rounded-full hover:bg-gray-300"
                        onClick={onClose}
                    >
                        <i className="text-lg text-black fas fa-times"></i>
                    </button>
                </div>
            </div>

            <div className="p-4">
                <p><strong>ID:</strong> {record.id}</p>
                <p><strong>Thể Loại:</strong> </p>
                <input
                    type="text"
                    name="theLoai"
                    value={editData.theLoai}
                    onChange={handleChange}
                    className={`w-full p-2 border ${isEditing ? "bg-white" : "bg-gray-100"}`}
                    disabled={!isEditing} 
                />

                <h3 className="mt-4 font-semibold">Danh Sách Thiết Bị</h3>
                <ul className="pl-5 list-disc">
                    {dsThietBi.map(tb => <li key={tb.id}>{tb.tenThietBi}</li>)}
                </ul>

                {/* Nút lưu & hủy chỉ hiện khi đang chỉnh sửa */}
                {isEditing && (
                    <div className="flex mt-4 space-x-2">
                        <button className="px-4 py-2 text-white bg-green-500 rounded" onClick={handleSave}>
                            Lưu
                        </button>
                        <button className="px-4 py-2 text-white bg-gray-500 rounded" onClick={handleCancel}>
                            Hủy
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChiTietTheLoai;
