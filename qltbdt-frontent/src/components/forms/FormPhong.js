import axios from "axios";
import { useEffect, useState } from "react";
import { maxTangTheoToa, toaTheoCoSo } from "../../utils/constants";

const FormPhong = ({ onClose, refreshData }) => {
    // eslint-disable-next-line
    const [newId, setNewId] = useState(0); // ID phòng mới
    const [formData, setFormData] = useState({
        coSo: "",
        toa: "",
        tang: "",
        soPhong: "",
        chucNang: "",
    });

    // Lấy số lượng phòng để tạo ID mới
    useEffect(() => {
        axios.get("http://localhost:5000/api/phong")
            .then(response => setNewId(response.data.length + 1)) // ID mới = số lượng phòng + 1
            .catch(error => console.error("Lỗi tải danh sách phòng:", error));
    }, []);

    // Xử lý thay đổi input
    const handleChange = (e) => {
        const { name, value } = e.target;
        let updatedFormData = { ...formData, [name]: value };

        // Reset tầng nếu tòa thay đổi
        if (name === "toa") {
            updatedFormData.tang = ""; // Reset tầng
        }

        setFormData(updatedFormData);
    };

    // Xử lý lưu phòng
    const handleSubmit = (e) => {
        e.preventDefault();
        axios.post("http://localhost:5000/api/phong", formData)
            .then(() => {
                alert("Thêm phòng thành công!");
                refreshData();
                onClose();
            })
            .catch(error => console.error("Lỗi thêm phòng:", error));
    };

    // Xử lý nút Hủy
    const handleReset = () => {
        setFormData({
            coSo: "",
            toa: "",
            tang: "",
            soPhong: "",
            chucNang: "",
        });
    };

    return (
        <div className="flex flex-col h-full bg-white border-l shadow-md">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-white shadow-md">
                <h2 className="text-lg font-semibold">Thêm Phòng</h2>
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
                {/* ID Phòng */}
                {/* <div>
                    <label className="block font-medium">ID Phòng</label>
                    <input type="text" value={`P${newId}`} disabled className="w-full p-2 mt-1 bg-gray-100 border rounded" />
                </div> */}

                {/* Cơ sở */}
                <div>
                    <label className="block font-medium">Cơ Sở</label>
                    <select name="coSo" value={formData.coSo} onChange={handleChange} className="w-full p-2 mt-1 border rounded">
                        <option value="">Chọn cơ sở</option>
                        <option value="Chính">Chính</option>
                        <option value="Phụ">Phụ</option>
                    </select>
                </div>

                {/* Tòa */}
                <div>
                    <label className="block font-medium">Tòa</label>
                    <select name="toa" value={formData.toa} onChange={handleChange} className="w-full p-2 mt-1 border rounded"
                        disabled={!formData.coSo}>
                        <option value="">Chọn tòa</option>
                        {formData.coSo && toaTheoCoSo[formData.coSo].map(toa => (
                            <option key={toa} value={toa}>{toa}</option>
                        ))}
                    </select>
                </div>

                {/* Tầng */}
                <div>
                    <label className="block font-medium">Tầng</label>
                    <select name="tang" value={formData.tang} onChange={handleChange} className="w-full p-2 mt-1 border rounded"
                        disabled={!formData.toa}>
                        <option value="">Chọn tầng</option>
                        {formData.toa && Array.from({ length: maxTangTheoToa[formData.toa] }, (_, i) => (
                            <option key={i + 1} value={i + 1}>{i + 1}</option>
                        ))}
                    </select>
                </div>

                {/* Số Phòng */}
                <div>
                    <label className="block font-medium">Số Phòng</label>
                    <select name="soPhong" value={formData.soPhong} onChange={handleChange} className="w-full p-2 mt-1 border rounded"
                        disabled={!formData.tang}>
                        <option value="">Chọn số phòng</option>
                        {Array.from({ length: 20 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>{i + 1}</option>
                        ))}
                    </select>
                </div>

                {/* Chức Năng */}
                <div>
                    <label className="block font-medium">Chức Năng</label>
                    <input type="text" name="chucNang" value={formData.chucNang} onChange={handleChange} className="w-full p-2 mt-1 border rounded" />
                </div>
            </form>
        </div>
    );
};

export default FormPhong;
