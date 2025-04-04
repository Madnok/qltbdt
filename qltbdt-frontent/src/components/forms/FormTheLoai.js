import { useState } from "react";
import axios from "axios";

const FormTheLoai = ({ onClose, refreshData }) => {
    const [tenTheLoai, setTenTheLoai] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Gọi API để lấy danh sách thể loại hiện có
        console.log("Dữ liệu gửi:", { theLoai: tenTheLoai }); // Xem dữ liệu gửi đi

        try {
            const response = await axios.get("http://localhost:5000/api/theloai", { withCredentials: true });
            const currentLength = response.data.length; // Độ dài hiện tại
            const newId = currentLength + 1;// Tạo ID mới dựa trên độ dài mảng + 1

            await axios.post("http://localhost:5000/api/theloai", { id: newId, theLoai: tenTheLoai }, {
                headers: { "Content-Type": "application/json" } // Đảm bảo gửi JSON
                , withCredentials: true
            });
            alert("Thêm thể loại thành công!");
            refreshData();
            onClose();
        } catch (error) {
            console.error("Lỗi thêm thể loại:", error.response?.data || error.message);
        }
    };



    return (
        <div className="flex flex-col h-full bg-white border-l shadow-md">
            {/* Header riêng của Right Panel */}
            <div className="flex items-center justify-between p-4 bg-white shadow-md">
                <h2 className="text-xl font-semibold">Thêm Thể Loại</h2>
                <div className="flex space-x-2">
                    {/* Nút Đóng */}
                    <button className="flex items-center justify-center w-10 h-10 transition rounded-full hover:bg-gray-300"
                        onClick={onClose}>
                        <i className="text-lg text-black fas fa-times"></i>
                    </button>
                </div>
            </div>
            <div className="p-4">
                <form onSubmit={handleSubmit}>
                    {/* <div>
                        <label className="block font-medium">ID Thể Loại Hiện Tại</label>
                        <input type="text" value={`TL${Id}`} disabled className="w-full p-2 mt-1 bg-gray-100 border rounded" ></input>
                    </div> */}
                    <input
                        type="text"
                        value={tenTheLoai}
                        onChange={(e) => setTenTheLoai(e.target.value)}
                        placeholder="Nhập tên thể loại"
                        className="w-full p-2 mb-2 border"
                        required
                    />
                    <div className="flex space-x-2">
                        <button type="submit" className="px-4 py-2 text-white bg-green-500 rounded">Lưu</button>
                        <button type="button" className="px-4 py-2 bg-gray-300 rounded" onClick={onClose}>Hủy</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FormTheLoai;
