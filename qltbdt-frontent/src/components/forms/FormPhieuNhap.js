import axios from "axios";
import { useEffect, useState } from "react";

const FormPhieuNhap = ({ onClose, refreshData, onAddThietBi }) => {

    const [thietBiList, setThietBiList] = useState([]);
    const [selectedThietBi, setSelectedThietBi] = useState("");
    const [soLuong, setSoLuong] = useState(1);
    const [donGia, setDonGia] = useState(0);

    useEffect(() => {
        axios.get("http://localhost:5000/api/tttb/thietbi-list")
            .then(response => setThietBiList(response.data))
            .catch(error => console.error("ERROR", error));

    }, []);

    const [nextId] = useState(() => thietBiList.length > 0 ? Math.max(...thietBiList.map(tb => tb.id)) + 1 : 1);
    const handleAdd = () => {
        if (!selectedThietBi) {
            alert("Vui lòng chọn thiết bị!");
            return;
        }

        const newThietBi = {
            id: nextId,
            thietbi_id: selectedThietBi,
            tenThietBi: thietBiList.find(tb => tb.id === Number(selectedThietBi))?.tenThietBi || "Không rõ",
            soLuong: soLuong,
            donGia: donGia
        };

        console.log("Thêm thiết bị:", newThietBi);
        onAddThietBi(newThietBi);
        onClose();
    };

    return (
        <div className="w-1/2 bg-white rounded-lg shadow-lg">
            <div className="flex items-center justify-between p-4 bg-gray-100 border-b">
                <h2 className="text-lg font-semibold">Form Phiếu Nhập Thiết Bị</h2>
                <button className="w-10 h-10 rounded-full hover:bg-gray-300" onClick={onClose}>
                    <i className="text-lg text-black fas fa-times"></i>
                </button>
            </div>

            <form className="p-4 space-y-4">
                <div>
                    <label className="block font-medium">ID</label>
                    <input type="text" value={nextId} readOnly className="w-full p-2 mt-1 bg-gray-200 border rounded" />
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
                    <label className="block font-medium">Số Lượng</label>
                    <input type="number" value={soLuong} min="1"
                        onChange={(e) => setSoLuong(Number(e.target.value))}
                        className="w-full p-2 mt-1 border rounded"
                    />
                </div>

                <div>
                    <label className="block font-medium">Đơn Giá</label>
                    <input type="number" value={donGia} min="0"
                        onChange={(e) => setDonGia(Number(e.target.value))}
                        className="w-full p-2 mt-1 border rounded"
                    />
                </div>

                <div className="flex justify-end space-x-2">
                    <button type="button" className="px-4 py-2 text-white bg-yellow-500 rounded" onClick={handleAdd}>
                        Thêm Thiết Bị Khác
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
