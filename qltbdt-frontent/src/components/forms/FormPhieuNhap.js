import axios from "axios";
import { useEffect, useState } from "react";
// import { FaExchangeAlt } from "react-icons/fa";

const FormPhieuNhap = ({ onClose, refreshData, onAddThietBi }) => {
    const [thietBiList, setThietBiList] = useState([]);
    const [selectedThietBi, setSelectedThietBi] = useState(null);
    const [soLuong, setSoLuong] = useState(1);
    const [donGia, setDonGia] = useState(0);
    // const [isEditingMap, setIsEditingMap] = useState({}); // Quản lý trạng thái chỉnh sửa riêng từng thiết bị
    const [thoiGianBaoHanh, setThoiGianBaoHanh] = useState(0); // Thêm thời gian bảo hành

    useEffect(() => {
        axios.get("http://localhost:5000/api/tttb/thietbi-list")
            .then((response) => setThietBiList(response.data))
            .catch((error) => console.error("ERROR", error));
    }, []);

    const handleThietBiChange = (e) => {
        const selectedId = parseInt(e.target.value, 10); // ID của thiết bị được chọn
        const selectedDevice = thietBiList.find((tb) => tb.id === selectedId); // Tìm thiết bị trong danh sách

        if (selectedDevice) {
            setSelectedThietBi(selectedDevice); // Cập nhật thiết bị được chọn
            setDonGia(selectedDevice.donGia); // Cập nhật đơn giá của thiết bị
        } else {
            setSelectedThietBi(null);
            setDonGia(0);
        }
    };

    // const toggleEditing = (deviceId) => {
    //     setIsEditingMap((prevMap) => ({
    //         ...prevMap,
    //         [deviceId]: !prevMap[deviceId], // Chuyển đổi trạng thái chỉnh sửa cho thiết bị cụ thể
    //     }));
    // };

    const handleAdd = () => {
        if (!selectedThietBi) {
            alert("Vui lòng chọn thiết bị!");
            return;
        }
        if (thoiGianBaoHanh <= 0 || isNaN(thoiGianBaoHanh)) {
            alert("Vui lòng nhập thời gian bảo hành hợp lệ (lớn hơn 0)!");
            return;
        }

        const newThietBi = {
            id: selectedThietBi.id,
            thietbi_id: selectedThietBi.id,
            tenThietBi: selectedThietBi.tenThietBi,
            soLuong: soLuong,
            donGia: donGia,
            thoiGianBaoHanh: thoiGianBaoHanh,
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
                {/* Chọn Thiết Bị */}
                <div>
                    <label className="block font-medium required:*">
                        Chọn Thiết Bị: <span className="text-red-500">*</span>
                    </label>
                    <select
                        className="w-full p-2 mt-1 border rounded"
                        onChange={handleThietBiChange}
                    >
                        <option value="">Chọn Thiết Bị</option>
                        {thietBiList.map((tb) => (
                            <option key={tb.id} value={tb.id}>
                                {tb.tenThietBi}
                            </option>
                        ))}
                    </select>
                </div>
                
                {/* Đơn Giá */}
                <div>
                    <label className="block font-medium">Đơn Giá
                        <span className="pl-1 ">
                            hiện tại của thiết bị {" "}
                            {selectedThietBi ? (
                                <strong className="font-bold text-red-400">{selectedThietBi.tenThietBi}</strong>
                            ) : (
                                "X"
                            )} {" "}
                            là: {donGia.toLocaleString()} VND
                        </span>
                    </label>
                    {/* <div className="grid grid-cols-10 items-center gap-2">
                        {isEditingMap[selectedThietBi?.id] ? (
                            <input
                                type="number"
                                value={donGia}
                                min="0"
                                onChange={(e) => setDonGia(Number(e.target.value))}
                                className="w-full p-2 mt-1 border rounded col-span-9"
                            />
                        ) : (
                            <input
                                type="number"
                                value={donGia}
                                className="w-full p-2 mt-1 border rounded bg-gray-200 col-span-9 items-center"
                                disabled
                            />
                        )}
                        <button
                            type="button"
                            className="p-3 mt-1 border rounded hover:bg-gray-300"
                            onClick={() => toggleEditing(selectedThietBi?.id)}
                        >
                            <FaExchangeAlt />
                        </button>
                    </div> */}
                </div>


                {/* Số Lượng */}
                <div>
                    <label className="block font-medium">Số Lượng: </label>
                    <input
                        type="number"
                        value={soLuong}
                        min="1"
                        onChange={(e) => setSoLuong(Number(e.target.value))}
                        className="w-full p-2 mt-1 border rounded"
                    />
                </div>
                {/* Thời Gian Bảo Hành */}
                <div>
                    <label className="block font-medium required">
                        Thời Gian Bảo Hành (tháng): <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        value={thoiGianBaoHanh}
                        min="1"
                        required
                        onChange={(e) => setThoiGianBaoHanh(Number(e.target.value))}
                        className="w-full p-2 mt-1 border rounded"
                    />
                </div>

                {/* Buttons */}
                <div className="grid grid-cols-2 start-2 space-x-2">
                    <button
                        type="button"
                        className="px-4 py-2 text-white bg-yellow-500 rounded"
                        onClick={handleAdd}
                    >
                        Thêm Thiết Bị Khác
                    </button>
                    <button
                        type="button"
                        className="px-4 py-2 bg-gray-300 rounded"
                        onClick={onClose}
                    >
                        Hủy
                    </button>
                </div>
            </form>
        </div>
    );
};

export default FormPhieuNhap;
