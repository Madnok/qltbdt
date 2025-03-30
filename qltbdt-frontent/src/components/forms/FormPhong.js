import axios from "axios";
import { useEffect, useState } from "react";
import { maxTangTheoToa, toaTheoCoSo } from "../../utils/constants";
import { BsTrash } from "react-icons/bs";

const FormPhong = ({ onClose, refreshData }) => {
    const [activeTab, setActiveTab] = useState("themPhong"); // Quản lý tab đang hiển thị
    // eslint-disable-next-line
    const [newId, setNewId] = useState(0); // ID phòng mới
    const [formData, setFormData] = useState({
        coSo: "",
        toa: "",
        tang: "",
        soPhong: "",
        chucNang: "",
    });

    const [phongList, setPhongList] = useState([]);
    const [theLoaiList, setTheLoaiList] = useState([]);
    const [selectedTheLoai, setSelectedTheLoai] = useState("");
    const [selectedThietBi, setSelectedThietBi] = useState("");
    const [selectedPhong, setSelectedPhong] = useState("");
    const [dsThietBi, setDsThietBi] = useState([]);
    const [thietBiTrongPhong, setThietBiTrongPhong] = useState([]);
    const [initialDsThietBi, setInitialDsThietBi] = useState([]); // Thông tin tồn kho ban đầu

    useEffect(() => {
        Promise.all([
            axios.get("http://localhost:5000/api/phong"),
            axios.get("http://localhost:5000/api/phong/phonglist"),
            axios.get("http://localhost:5000/api/theloai"),
            axios.get("http://localhost:5000/api/thietbi/thietbiconlai")
        ])
            .then(([phongRes, phongListRes, theLoaiRes, remainingRes]) => {
                setNewId(phongRes.data.length + 1);
                setPhongList(phongListRes.data);
                setTheLoaiList(theLoaiRes.data);
                setInitialDsThietBi(remainingRes.data); // Lưu thông tin tồn kho ban đầu
                setDsThietBi(remainingRes.data); // Cập nhật danh sách thiết bị hiện tại
                console.log("Dữ liệu thiết bị còn lại:", remainingRes.data);
            })
            .catch(error => console.error("Lỗi tải dữ liệu:", error));
    }, []);

    // Khi chọn thể loại, lấy danh sách thiết bị
    useEffect(() => {
        if (selectedTheLoai) {
            axios.get(`http://localhost:5000/api/theloai/${selectedTheLoai}`)
                .then(response => {
                    console.log("Danh sách thiết bị:", response.data.dsThietBi);
                    // Lọc danh sách thiết bị từ thông tin tồn kho ban đầu
                    const filteredThietBi = initialDsThietBi.filter(tb =>
                        response.data.dsThietBi.some(selectedTb => selectedTb.id === tb.id)
                    );
                    setDsThietBi(filteredThietBi);
                })
                .catch(error => console.error("Lỗi tải thiết bị:", error));
        }
    }, [selectedTheLoai, initialDsThietBi]); // Chạy khi selectedTheLoai hoặc initialDsThietBi thay đổi


    // Xử lý thay đổi input Phòng
    const handleChange = (e) => {
        const { name, value } = e.target;
        let updatedFormData = { ...formData, [name]: value };

        // Reset tầng nếu tòa thay đổi
        if (name === "toa") {
            updatedFormData.tang = ""; // Reset tầng
        }

        setFormData(updatedFormData);
    };

    // Xử lý thay đổi input Thiết Bị
    const handleThietBiChange = (e) => {
        const thietBi = dsThietBi.find(tb => tb.id === parseInt(e.target.value));
        setSelectedThietBi(thietBi || "");
    };

    // Xử lý thêm thiết bị vào bảng dữ liệu chờ để lưu
    const handleAddThietBi = () => {
        const selectedPhongDetails = phongList.find(p => p.id === parseInt(selectedPhong, 10));
        const thietBiDetails = dsThietBi.find(tb => tb.id === selectedThietBi.id);

        if (!selectedPhongDetails || !thietBiDetails) {
            console.error("Phòng hoặc thiết bị chưa được chọn.");
            return;
        }

        if (thietBiDetails.remainingStock <= 0) {
            alert(`Không thể thêm thiết bị vì tồn kho đã hết.`);
            return;
        }

        // Cập nhật tồn kho
        const updatedThietBiList = dsThietBi.map(tb =>
            tb.id === selectedThietBi.id
                ? { ...tb, remainingStock: tb.remainingStock - 1 }
                : tb
        );
        setDsThietBi(updatedThietBiList);

        // Kiểm tra nếu thiết bị cùng tên đã tồn tại trong danh sách chờ
        const existingIndex = thietBiTrongPhong.findIndex(item => item.ten === selectedThietBi.tenThietBi);

        if (existingIndex !== -1) {
            // Nếu thiết bị đã tồn tại, tăng số lượng
            const updatedThietBiTrongPhong = thietBiTrongPhong.map((item, index) =>
                index === existingIndex
                    ? { ...item, soLuong: item.soLuong + 1 }
                    : item
            );
            setThietBiTrongPhong(updatedThietBiTrongPhong);
        } else {
            // Nếu thiết bị chưa tồn tại, thêm dòng mới
            const newEntry = {
                phong: selectedPhongDetails.phong,
                ten: selectedThietBi.tenThietBi,
                thongtinthietbi_id: selectedThietBi.thongtinthietbi_id,
                soLuong: 1,
                tonKho: selectedThietBi.tonKho
            };
            setThietBiTrongPhong([...thietBiTrongPhong, newEntry]);
        }
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

    // Xóa phần tử tại vị trí index
    const handleDelete = (index) => {
        // Lấy thông tin dòng bị xóa
        const removedItem = thietBiTrongPhong[index];

        // Cộng lại vào số lượng thực còn lại (remainingStock)
        const updatedDsThietBi = dsThietBi.map(tb =>
            tb.tenThietBi === removedItem.ten
                ? { ...tb, remainingStock: tb.remainingStock + removedItem.soLuong } // Cộng lại số lượng vào remainingStock
                : tb
        );
        setDsThietBi(updatedDsThietBi);

        // Xóa dòng khỏi bảng
        const updatedList = thietBiTrongPhong.filter((_, i) => i !== index);
        setThietBiTrongPhong(updatedList);
    };


    // Xử lý nhập liệu số lượng
    const handleInputChange = (e, index) => {
        const newSoLuong = parseInt(e.target.value) || 1; // Đảm bảo giá trị hợp lệ
        const currentItem = thietBiTrongPhong[index]; // Lấy dòng hiện tại trong bảng
        const thietBiDetails = dsThietBi.find(tb => tb.tenThietBi === currentItem.ten); // Lấy thông tin số lượng thực còn lại (remainingStock)

        if (!thietBiDetails) {
            console.error("Không tìm thấy thông tin số lượng còn lại của thiết bị.");
            return;
        }

        // Tính sự khác biệt (delta) giữa số lượng mới và số lượng cũ
        const delta = newSoLuong - currentItem.soLuong;

        // Nếu số lượng mới vượt quá số lượng thực còn lại, dừng lại
        if (delta > 0 && delta > thietBiDetails.remainingStock) {
            alert(`Số lượng vượt quá giới hạn còn lại! (Số lượng còn lại: ${thietBiDetails.remainingStock})`);
            return;
        }

        // Cập nhật remainingStock của thiết bị
        const updatedDsThietBi = dsThietBi.map(tb =>
            tb.tenThietBi === currentItem.ten
                ? { ...tb, remainingStock: tb.remainingStock - delta } // Giảm hoặc tăng số lượng còn lại dựa trên delta
                : tb
        );
        setDsThietBi(updatedDsThietBi);

        // Cập nhật số lượng trong bảng
        const updatedList = thietBiTrongPhong.map((item, i) =>
            i === index ? { ...item, soLuong: newSoLuong } : item
        );
        setThietBiTrongPhong(updatedList);
    };


    // Lưu thiết bị vào phòng
    const handleSaveThietBi = async () => {
        if (!selectedPhong || thietBiTrongPhong.length === 0) {
            alert("Vui lòng chọn phòng và thêm ít nhất một thiết bị!");
            return;
        }

        try {
            const requestData = await Promise.all(
                thietBiTrongPhong.map(async (item) => {
                    const thietBi = dsThietBi.find(tb => tb.tenThietBi === item.ten);

                    if (!thietBi) {
                        console.error("Không tìm thấy thiết bị:", item.ten);
                        return null;
                    }

                    // Lấy danh sách thiết bị chưa phân bổ từ bảng thongtinthietbi
                    const response = await axios.get(`http://localhost:5000/api/tttb/unassigned`, {
                        params: { thietbi_id: thietBi.id }
                    }).catch(error => {
                        console.error("Lỗi khi lấy danh sách thiết bị chưa phân bổ:", error);
                        alert(`Không thể lấy danh sách thiết bị (${item.ten}).`);
                        return null;
                    });

                    if (!response || !response.data || response.data.length === 0) {
                        alert(`Không có thiết bị chưa phân bổ khả dụng cho ${item.ten}.`);
                        return null;
                    }

                    const thongTinThietBiList = response.data;

                    // Kiểm tra số lượng yêu cầu với số lượng thực tế
                    if (item.soLuong > thongTinThietBiList.length) {
                        alert(`Số lượng yêu cầu vượt quá giới hạn cho ${item.ten} (Số lượng còn lại: ${thongTinThietBiList.length}).`);
                        return null;
                    }

                    // Lấy đúng số lượng thiết bị chưa được phân bổ (theo input từ người dùng)
                    return thongTinThietBiList.slice(0, item.soLuong).map((device) => ({
                        phong_id: selectedPhong,            // ID phòng được chọn
                        thietbi_id: device.thietbi_id,      // ID thiết bị
                        thongtinthietbi_id: device.id       // Mã định danh thiết bị (thongtinthietbi_id)
                    }));
                })
            );

            const validData = requestData.filter(item => item !== null).flat(); // Làm phẳng mảng các thiết bị

            if (!validData || validData.length === 0) {
                alert("Không có thiết bị hợp lệ để lưu!");
                return;
            }

            // Gửi danh sách thiết bị đã phân bổ đến API
            const response = await axios.post("http://localhost:5000/api/phong/add-thietbi", validData);

            if (response.data.success) {
                alert("Lưu thành công!");
                setThietBiTrongPhong([]);
                await refreshRemainingStock(); // Làm mới danh sách tồn kho
                await refreshData(); // Làm mới danh sách thiết bị trong phòng
            } else {
                throw new Error(response.data.message);
            }
        } catch (error) {
            console.error("Lỗi khi lưu thiết bị:", error);
            alert(`Lưu thất bại! Lỗi: ${error.message}`);
        }
    };


    // Hàm làm mới danh sách thiết bị còn lại
    const refreshRemainingStock = async () => {
        try {
            const response = await axios.get("http://localhost:5000/api/thietbi/thietbiconlai");
            setDsThietBi(response.data); // Cập nhật danh sách thiết bị còn lại
        } catch (error) {
            console.error("Lỗi khi tải lại danh sách thiết bị:", error);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white border-l shadow-md">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-white border-b">
                <h2 className="text-lg font-semibold">Các Chức Năng Của Phòng</h2>
                <div className="flex space-x-4">
                    <button className="flex items-center justify-center w-10 h-10 transition rounded-full hover:bg-gray-300" onClick={onClose}>
                        <i className="text-lg text-black fas fa-times"></i>
                    </button>
                </div>
            </div>
            <div className="flex items-center bg-white">
                {/* Tabs */}
                <div className="flex flex-1 bg-white border-b">
                    <button
                        className={`flex-1 text-center py-4 font-semibold ${activeTab === "themPhong" ? "border-b-4 border-green-500 text-green-500" : "text-gray-400"}`}
                        onClick={() => setActiveTab("themPhong")}
                    >
                        Thêm Phòng
                    </button>
                    <button
                        className={`flex-1 text-center py-4 font-semibold ${activeTab === "themThietBi" ? "border-b-4 border-blue-500 text-blue-500" : "text-gray-400"}`}
                        onClick={() => setActiveTab("themThietBi")}
                    >
                        Thêm Thiết Bị Vào Phòng
                    </button>
                </div>
            </div>
            {/* Dữ Liệu Thêm Phòng Mới */}
            {activeTab === "themPhong" && (
                <div className="grid grid-cols-2 gap-2 p-2 mb-2 space-2">
                    {/* Cơ sở */}
                    <div>
                        <label className="block font-medium">Cơ Sở</label>
                        <select name="coSo" value={formData.coSo} onChange={handleChange} className="w-full p-1 mt-1 border rounded">
                            <option value="">Chọn cơ sở</option>
                            <option value="Chính">Chính</option>
                            <option value="Phụ">Phụ</option>
                        </select>
                    </div>

                    {/* Tòa */}
                    <div>
                        <label className="block font-medium">Tòa</label>
                        <select name="toa" value={formData.toa} onChange={handleChange} className="w-full p-1 mt-1 border rounded"
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
                        <select name="tang" value={formData.tang} onChange={handleChange} className="w-full p-1 mt-1 border rounded"
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
                        <select name="soPhong" value={formData.soPhong} onChange={handleChange} className="w-full p-1 mt-1 border rounded"
                            disabled={!formData.tang}>
                            <option value="">Chọn số phòng</option>
                            {Array.from({ length: 20 }, (_, i) => (
                                <option key={i + 1} value={i + 1}>{i + 1}</option>
                            ))}
                        </select>
                    </div>
                    {/* Chức Năng */}
                    <div className="col-span-2">
                        <label className="block font-medium">Chức Năng</label>
                        <input type="text" name="chucNang" value={formData.chucNang} onChange={handleChange} className="w-full p-1 mt-1 border rounded" />
                    </div>
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        className="w-full p-1 text-sm text-white bg-green-500 border rounded"
                    >
                        Lưu Phòng
                    </button>
                    <button
                        type="button"
                        className="w-full text-sm bg-gray-300 border rounded"
                        onClick={handleReset}
                    >
                        Xóa Trắng
                    </button>
                </div>
            )}
            {/* Thêm Thiết Bị Vào Phòng */}
            {activeTab === "themThietBi" && (
                <div className="p-4 bg-white border-t-2">
                    <div className="grid grid-cols-3 gap-2 pb-4">
                        <select
                            name="phong_id"
                            value={selectedPhong}
                            onChange={(e) => setSelectedPhong(e.target.value)}
                            className="w-full p-1 border rounded-lg"
                        >
                            <option value="">Phòng</option>
                            {phongList.map(p => (
                                <option key={p.id} value={p.id}>{p.phong}</option>
                            ))}
                        </select>
                        <select value={selectedTheLoai}
                            className="w-full p-1 border rounded-lg"
                            disabled={!selectedPhong}
                            onChange={(e) => setSelectedTheLoai(e.target.value)}
                        >
                            <option value="">Thể loại</option>
                            {theLoaiList.map(tl => (
                                <option key={tl.id} value={tl.id}>{tl.theLoai}</option>
                            ))}
                        </select>
                        <select
                            name="thietbi"
                            onChange={handleThietBiChange}
                            className="w-full p-1 border rounded-lg"
                            disabled={!selectedTheLoai}
                        >
                            <option value="">Thiết bị</option>
                            {dsThietBi.map(tb => (
                                <option key={tb.id} value={tb.id} disabled={(tb.remainingStock) === 0}>
                                    {tb.tenThietBi} (Còn: {tb.remainingStock || 0})
                                </option>
                            ))}
                        </select>

                    </div>
                    <div className="grid items-center grid-cols-2 gap-2 pb-4">
                        <button
                            onClick={handleSaveThietBi}
                            className="w-full p-1 text-sm text-white transition-colors bg-green-500 border rounded hover:bg-green-600"
                        >
                            Lưu Thiết Bị
                        </button>
                        <button
                            onClick={handleAddThietBi}
                            className={`w-full p-1 text-sm text-white transition-colors ${dsThietBi.some(tb => tb.remainingStock > 0) ? "bg-blue-500 hover:bg-blue-600" : "bg-gray-500 cursor-not-allowed"
                                } rounded`}
                            disabled={!dsThietBi.some(tb => tb.remainingStock > 0)} // Vô hiệu hóa nếu tất cả remainingStock = 0
                        >
                            Thêm Thiết Bị
                        </button>

                    </div>

                    <table className="w-full border border-gray-300 table-auto">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-4 py-1 border">Phòng</th>
                                <th className="px-4 py-1 border">Tên Thiết Bị</th>
                                <th className="px-4 py-1 border">Số Lượng</th>
                                <th className="px-4 py-1 border">Xóa</th>
                            </tr>
                        </thead>
                        <tbody>
                            {thietBiTrongPhong.map((item, index) => (
                                <tr key={index}>
                                    <td className="px-4 py-1 text-center border">{item.phong}</td>
                                    <td className="px-4 py-1 text-center border">{item.ten}</td>
                                    <td className="px-4 py-1 text-center border">
                                        <input
                                            type="number"
                                            value={item.soLuong}
                                            onChange={(e) => handleInputChange(e, index)}
                                            className="w-16 p-1 text-center border rounded"
                                            min="1"
                                        />
                                    </td>
                                    <td className="px-4 py-1 text-center border">
                                        <button
                                            onClick={() => handleDelete(index)}
                                            className="px-2 py-1 text-white bg-red-500 rounded"
                                        >
                                            <BsTrash />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default FormPhong;

