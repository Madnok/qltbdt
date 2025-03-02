import axios from "axios";
import { useEffect, useState } from "react";

const FormPhieuNhap = ({ onClose , refreshData }) => {
    const [nextId, setNextId] = useState("");
    const [thietBiList, setThietBiList] = useState([]);
    const [phongList, setPhongList] = useState([]);
    const [selectedThietBi, setSelectedThietBi] = useState("");
    const [selectedPhong, setSelectedPhong] = useState("");
    const [nguoiDuocCap, setNguoiDuocCap] = useState("");
    const [tinhTrang, setTinhTrang] = useState("dang_dung");

    useEffect(() => {
        axios.get("http://localhost:5000/api/tttb/next-id")
            .then(response => setNextId(response.data.nextId))
            .catch(error => console.error("ERROR", error));
    
        axios.get("http://localhost:5000/api/tttb/thietbi-list")
            .then(response => setThietBiList(response.data))
            .catch(error => console.error("ERROR", error));
    
        axios.get("http://localhost:5000/api/tttb/phong-list")
            .then(response => setPhongList(response.data))
            .catch(error => console.error("ERROR", error));
    }, []);
    

    const handleSubmit = async () => {
        const data = {
            thietbi_id: selectedThietBi,
            phong_id: selectedPhong || null,
            nguoiDuocCap: nguoiDuocCap || null,
            phieunhap_id: null, // ID phiếu nhập, cần lấy từ context hoặc props
            tinhTrang: tinhTrang
        };

        try {
            await axios.post("http://localhost:5000/api/tttb", data);
            alert("Lưu thành công!");
            refreshData();
            onClose();
        } catch (error) {
            alert("Lỗi khi lưu!");
        }
    };

    return (
        <div className="w-1/2 bg-white rounded-lg shadow-lg">
            <div className="flex items-center justify-between p-4 bg-gray-100 border-b">
                <h2 className="text-lg font-semibold">Chi Tiết Thiết Bị</h2>
                <button className="w-10 h-10 rounded-full hover:bg-gray-300" onClick={onClose}>
                    <i className="text-lg text-black fas fa-times"></i>
                </button>
            </div>

            <form className="p-4 space-y-4">
                <div>
                    <label className="block font-medium">ID</label>
                    <input type="text" value={nextId} readOnly className="w-full p-2 mt-1 border rounded bg-gray-200"/>
                </div>

                <div>
                    <label className="block font-medium">Chọn Thiết Bị</label>
                    <select className="w-full p-2 mt-1 border rounded" onChange={e => setSelectedThietBi(e.target.value)}>
                        <option value="">Chọn Thiết Bị</option>
                        {thietBiList.map(tb => (
                            <option key={tb.id} value={tb.id}>{tb.tenThietBi}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block font-medium">Phòng</label>
                    <select className="w-full p-2 mt-1 border rounded" onChange={e => setSelectedPhong(e.target.value)}>
                        <option value="">Chọn Phòng (Tòa - Tầng - Phòng)</option>
                        {phongList.map(ph => (
                            <option key={ph.id} value={ph.id}>{ph.phong}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block font-medium">Người Được Cấp</label>
                    <input type="text" value={nguoiDuocCap} onChange={e => setNguoiDuocCap(e.target.value)} className="w-full p-2 mt-1 border rounded" />
                </div>

                <div>
                    <label className="block font-medium">Tình Trạng</label>
                    <select className="w-full p-2 mt-1 border rounded" value={tinhTrang} onChange={e => setTinhTrang(e.target.value)}>
                        <option value="dang_dung">Đang Dùng</option>
                        <option value="chua_dung">Chưa Dùng</option>
                    </select>
                </div>

                <div className="flex justify-end space-x-2">
                    <button type="button" className="px-4 py-2 text-white bg-green-500 rounded" onClick={handleSubmit}>
                        Lưu
                    </button>
                    <button type="button" className="px-4 py-2 bg-gray-300 rounded" onClick={onClose}>
                        Hủy
                    </button>
                </div>
            </form>
        </div>
    );
};

export default FormPhieuNhap;
