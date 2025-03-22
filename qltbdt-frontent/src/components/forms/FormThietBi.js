import axios from "axios";
import { useEffect, useState } from "react";

const FormThietBi = ({ onClose, refreshData }) => {
    const [newId, setNewId] = useState(0); // ID thiết bị mới
    const [dsTheLoai, setDsTheLoai] = useState([]); // Danh sách thể loại
    const [formData, setFormData] = useState({
        theloai_id: "",
        tenThietBi: "",
        moTa: "",
        donGia: "",
    });

    // Lấy số lượng thiết bị để tạo ID mới
    useEffect(() => {
        axios.get("http://localhost:5000/api/thietbi")
            .then(response => {
                setNewId(response.data.length + 1); // ID mới = số lượng thiết bị + 1
            })
            .catch(error => console.error("Lỗi tải danh sách thiết bị:", error));
    }, []);

    // Lấy danh sách thể loại
    useEffect(() => {
        axios.get("http://localhost:5000/api/theloai")
            .then(response => {
                setDsTheLoai(response.data);
            })
            .catch(error => console.error("Lỗi tải thể loại:", error));
    }, []);

    // Xử lý thay đổi input
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Xử lý lưu thiết bị
    const handleSubmit = (e) => {
        e.preventDefault();
        const dataToSend = {
            id: newId,
            theloai_id: formData.theloai_id,
            tenThietBi: formData.tenThietBi,
            moTa: formData.moTa,
            donGia: formData.donGia,
            tonKho: 0,  // Mặc định là 0
        };

        axios.post("http://localhost:5000/api/thietbi", dataToSend)
            .then(() => {
                alert("Thêm thiết bị thành công!");
                refreshData();
                onClose();
            })
            .catch(error => console.error("Lỗi thêm thiết bị:", error));
    };

    // Xử lý nút Hủy (Xóa trắng dữ liệu nhập)
    const handleReset = () => {
        setFormData({
            theloai_id: "",
            tenThietBi: "",
            moTa: "",
            donGia: "",
        });
    };

    return (
        <div className="flex flex-col h-full bg-white border-l shadow-md">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-white shadow-md">
                <h2 className="overflow-hidden text-lg font-semibold">Thêm Thiết Bị</h2>
                <div className="flex space-x-4">
                    <button type="submit" onClick={handleSubmit} className="px-4 py-2 text-white bg-green-500 rounded">Thêm</button>
                    <button type="button" className="px-4 py-2 bg-gray-300 rounded" onClick={handleReset}>Hủy</button>
                    <button className="flex items-center justify-center w-10 h-10 transition rounded-full hover:bg-gray-300" onClick={onClose}>
                        <i className="text-lg text-black fas fa-times"></i>
                    </button>
                </div>
            </div>

            {/* Form nhập dữ liệu */}
            <form className="p-4 space-y-4">
                {/* ID Thiết Bị */}
                {/* <div>
                    <label className="block font-medium">ID Thiết Bị</label>
                    <input type="text" value={`TB${newId}`} disabled className="w-full p-2 mt-1 bg-gray-100 border rounded" ></input>
                </div> */}

                {/* Thể Loại */}
                <div>
                    <label className="block font-medium">Thể Loại</label>
                    <select name="theloai_id" value={formData.theloai_id} onChange={handleChange} className="w-full p-2 mt-1 border rounded">
                        <option value="">Chọn thể loại</option>
                        {dsTheLoai.map(tl => (
                            <option key={tl.id} value={tl.id}>{tl.theLoai}</option>
                        ))}
                    </select>
                </div>

                {/* Tên Thiết Bị */}
                <div>
                    <label className="block font-medium">Tên Thiết Bị</label>
                    <input type="text" name="tenThietBi" value={formData.tenThietBi} onChange={handleChange} className="w-full p-2 mt-1 border rounded" />
                </div>

                {/* Đơn Giá */}
                <div>
                    <label className="block font-medium">Đơn Giá</label>
                    <div className="relative">
                        <input type="number" name="donGia" value={formData.donGia} onChange={handleChange} className="w-full p-2 mt-1 border rounded" />
                        <span className="absolute text-gray-500 right-3 top-3">₫</span>
                    </div>
                </div>

                {/* Tồn Kho */}
                <div>
                    <label className="block font-medium">Tồn Kho</label>
                    <input type="number" value="0" disabled className="w-full p-2 mt-1 bg-gray-100 border rounded" />
                </div>

                {/* Mô Tả */}
                <div>
                    <label className="block font-medium">Mô Tả</label>
                    <textarea name="moTa" value={formData.moTa} onChange={handleChange} className="w-full p-2 mt-1 border rounded"></textarea>
                </div>

            </form>
        </div>
    );
};

export default FormThietBi;
