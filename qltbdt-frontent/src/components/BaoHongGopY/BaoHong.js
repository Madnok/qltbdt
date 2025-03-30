import axios from "axios";
import { useState, useEffect } from "react";
import { toaTheoCoSo } from "../../utils/constants";
import { FaUpload, FaChevronUp, FaChevronDown } from "react-icons/fa";
import { MdWarning } from "react-icons/md";
import eventBus from "../../utils/eventBus";

const BaoHong = () => {
    const [mergedData, setMergedData] = useState([]);
    const [label, setLabel] = useState("");
    const [thietBiList, setThietBiList] = useState([]);
    const [expandedRows, setExpandedRows] = useState([]);
    const [selectedDevices, setSelectedDevices] = useState([]);
    const [formData, setFormData] = useState({
        coSo: "",
        toa: "",
        tang: "",
        soPhong: "",
        idPhong: null,
    });


    useEffect(() => {
        // Gọi song song hai API
        Promise.all([
            axios.get("http://localhost:5000/api/phong"), // API lấy thông tin chi tiết phòng
            axios.get("http://localhost:5000/api/phong/phonglist") // API lấy danh sách phòng theo dạng ID và tên
        ])
            .then(([phongDetailsRes, phongListRes]) => {
                const phongDetails = phongDetailsRes.data;
                const phongList = phongListRes.data;

                // Gộp dữ liệu dựa trên ID
                const merged = phongList.map((phong) => {
                    const detail = phongDetails.find((d) => d.id === phong.id) || {};
                    return {
                        ...phong,         // Dữ liệu từ /phonglist
                        ...detail         // Dữ liệu từ /phong
                    };
                });

                setMergedData(merged); // Lưu dữ liệu gộp vào state
            })
            .catch((error) => console.error("Lỗi tải dữ liệu:", error));
    }, []);
    useEffect(() => {
        setSelectedDevices([]);
    }, [thietBiList]);
    // Xử lý thay đổi input Phòng
    const handleChange = (e) => {
        const { name, value } = e.target;
        let updatedFormData = { ...formData, [name]: value };

        // Reset dữ liệu phụ thuộc
        if (name === "coSo") {
            updatedFormData.toa = "";
            updatedFormData.tang = "";
            updatedFormData.soPhong = "";
        } else if (name === "toa") {
            updatedFormData.tang = "";
            updatedFormData.soPhong = "";
        } else if (name === "tang") {
            updatedFormData.soPhong = "";
        }

        // Tìm thông tin phòng khi tất cả trường đã được chọn
        if (name === "soPhong") {
            const selectedRoom = mergedData.find(
                (item) =>
                    item.coSo === updatedFormData.coSo &&
                    item.toa === updatedFormData.toa &&
                    item.tang === parseInt(updatedFormData.tang) &&
                    item.soPhong === parseInt(value)
            );
            setLabel(selectedRoom ? `Của ${selectedRoom.chucNang}: ${selectedRoom.phong}` : "");
            updatedFormData.idPhong = selectedRoom?.id || null;

            // **Reset trạng thái loại thiệt hại**
            setDamageForm((prevDamageForm) => ({
                ...prevDamageForm,
                damageType: "", // Reset loại thiệt hại
            }));
        }

        setFormData(updatedFormData);
    };

    const [damageForm, setDamageForm] = useState({
        damageType: "",
        description: "",
        image: null,
        damageLevel: "", // Kiểm tra và thêm giá trị này nếu cần thiết
    });

    const damageTypes = ["Kết Cấu", "Hệ Thống Điện", "Hệ Thống Nước", "Các Loại Thiết Bị", "Khác"];
    // const handleFileUpload = (e) => {
    //     setDamageForm((prevForm) => ({ ...prevForm, image: e.target.files[0] }));
    // };


    const handleDamageTypeChange = (e) => {
        const selectedType = e.target.value;

        setDamageForm((prevForm) => ({ ...prevForm, damageType: selectedType }));

        if (selectedType === "Các Loại Thiết Bị" && formData.idPhong) {
            axios
                .get(`http://localhost:5000/api/phong/danhsach-thietbi/${formData.idPhong}`)
                .then((response) => {
                    // console.log("Dữ liệu thiết bị trả về:", response.data);
                    setThietBiList(response.data);
                })
                .catch((error) => console.error("Lỗi khi gọi API:", error));
        } else {
            setThietBiList([]); // Reset danh sách thiết bị
        }
    };

    // gửi báo hỏng
    const handleSubmitBaoHong = (e) => {
        e.preventDefault();

        if (!formData.idPhong || !damageForm.damageType || !damageForm.description || !damageForm.damageLevel) {
            alert("Vui lòng điền đầy đủ các thông tin bắt buộc!");
            return;
        }

        const requestData = {
            devices: selectedDevices,
            phong_id: formData.idPhong, // ID phòng
            user_id: null, // ID người dùng đăng nhập (thay thế giá trị phù hợp)
            thiethai: damageForm.damageLevel, // Mức độ thiệt hại
            moTa: damageForm.description, // Mô tả thiệt hại
            hinhAnh: damageForm.image || null, // Hình ảnh nếu có
            loaithiethai: damageForm.damageType, // Loại thiệt hại
        };
        console.log("Dữ liệu gửi đi:", requestData);

        axios.post("http://localhost:5000/api/baohong/guibaohong", requestData)
            .then((response) => {
                alert("Gửi phiếu Báo Hỏng thành công!");
                // Reset form sau khi gửi thành công
                setDamageForm({ description: "", image: null });
                setSelectedDevices([]);
                // Phát sự kiện khi gửi báo hỏng thành công
                eventBus.emit('baoHongSubmitted');
            })
            .catch((error) => {
                console.error("Lỗi khi gửi báo hỏng:", error);
                alert("Không thể gửi báo hỏng. Vui lòng thử lại.");
            });
    };


    // Xử lý toggle hiển thị chi tiết
    const toggleRow = (theLoai) => {
        if (expandedRows.includes(theLoai)) {
            setExpandedRows(expandedRows.filter((row) => row !== theLoai));
        } else {
            setExpandedRows([...expandedRows, theLoai]);
        }
    };

    // Xứ lý hiển thị bảng báo hỏng
    const groupedThietBiList = thietBiList.reduce((groups, thietBi) => {
        const group = groups.find(g => g.theLoai === thietBi.theLoai);
        if (group) {
            group.devices.push(thietBi);
            group.total += 1; // Tăng tổng thiết bị
        } else {
            groups.push({
                theLoai: thietBi.theLoai,
                devices: [thietBi],
                total: 1
            });
        }
        return groups;
    }, []);

    // Xử lý chọn các thiết bị trong phòng
    const handleDeviceSelect = (e, thietbi_id, thongtinthietbi_id) => {
        const newDevice = { thietbi_id, thongtinthietbi_id };

        if (e.target.checked) {
            // Thêm vào danh sách nếu chưa tồn tại mục giống hệt
            setSelectedDevices((prev) => {
                if (!prev.some(device => device.thietbi_id === thietbi_id && device.thongtinthietbi_id === thongtinthietbi_id)) {
                    return [...prev, newDevice];
                }
                return prev;
            });
        } else {
            // Loại bỏ mục nếu bỏ chọn
            setSelectedDevices((prev) =>
                prev.filter(device => !(device.thietbi_id === thietbi_id && device.thongtinthietbi_id === thongtinthietbi_id))
            );
        }
    };


    const [errors] = useState({});
    return (
        <div className="p-6 bg-white rounded-lg shadow-lg" >
            <h2 className="flex items-center border-b mb-6 text-xl font-semibold text-card-foreground">
                <MdWarning className="mr-2 text-destructive" />
                Báo Hỏng
            </h2>

            < div className="grid grid-cols-2 gap-2">
                {/*Form Báo Hỏng */}
                <form className="space-y-4 p-4 border rounded-lg"
                    onSubmit={handleSubmitBaoHong}>
                    {/* Vị Trí */}
                    <label className="block text-sm font-medium text-card-foreground">
                        Vị Trí  <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-4 gap-4">
                        {/* Cơ Sở */}
                        <div>
                            <label className="block text-xs">Cơ Sở</label>
                            <select
                                name="coSo"
                                value={formData.coSo}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded-md border-input focus:ring-2 focus:ring-ring"
                            >
                                <option value="">Cơ Sở</option>
                                {[...new Set(mergedData.map((item) => item.coSo))].map((coSo, index) => (
                                    <option key={index} value={coSo}>
                                        {coSo}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Tòa */}
                        <div>
                            <label className="block text-xs">Tòa</label>
                            <select
                                name="toa"
                                value={formData.toa}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded-md border-input focus:ring-2 focus:ring-ring"
                                disabled={!formData.coSo}
                            >
                                <option value="">Tòa</option>
                                {toaTheoCoSo[formData.coSo]?.map((toa, index) => (
                                    <option key={index} value={toa}>{toa}</option>
                                ))}
                            </select>
                        </div>


                        {/* Tầng */}
                        <div>
                            <label className="block text-xs">Tầng</label>
                            <select
                                name="tang"
                                value={formData.tang}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded-md border-input focus:ring-2 focus:ring-ring"
                                disabled={!formData.toa}
                            >
                                <option value="">Tầng</option>
                                {[...new Set(
                                    mergedData
                                        .filter(
                                            (item) => item.coSo === formData.coSo && item.toa === formData.toa
                                        )
                                        .map((item) => item.tang)
                                )].map((tang, index) => (
                                    <option key={index} value={tang}>
                                        {tang}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Phòng */}
                        <div>
                            <label className="block text-xs">Số Phòng</label>
                            <select
                                name="soPhong"
                                value={formData.soPhong}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded-md border-input focus:ring-2 focus:ring-ring"
                                disabled={!formData.tang}
                            >
                                <option value="">Phòng</option>
                                {mergedData
                                    .filter(
                                        (item) =>
                                            item.coSo === formData.coSo &&
                                            item.toa === formData.toa &&
                                            item.tang === parseInt(formData.tang)
                                    )
                                    .map((item) => (
                                        <option key={item.id} value={item.soPhong}>
                                            {item.soPhong}
                                        </option>
                                    ))}
                            </select>

                        </div>
                    </div>

                    <div>
                        <label className="block mb-1 text-sm font-medium text-card-foreground">
                            Loại Thiệt Hại <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={damageForm.damageType || ""}
                            onChange={handleDamageTypeChange} // Đảm bảo sự kiện này được gắn đúng
                            className="w-full px-3 py-2 border rounded-md border-input focus:ring-2 focus:ring-ring"
                        >
                            <option value="">Chọn Loại</option>
                            {damageTypes.map((type) => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>

                    </div>

                    <div>
                        <label className="block mb-1 text-sm font-medium text-card-foreground">
                            Mức Độ Hỏng Hóc <span className="text-red-500">*</span>
                        </label>
                        <div className="flex space-x-4">
                            {["Nhẹ", "Vừa", "Nặng"].map((level) => (
                                <label key={level} className="flex items-center">
                                    <input
                                        type="radio"
                                        name="damageLevel"
                                        value={level}
                                        checked={damageForm.damageLevel === level}
                                        onChange={(e) => setDamageForm({ ...damageForm, damageLevel: e.target.value })}
                                        className="mr-2"
                                    />
                                    <span className="text-sm text-card-foreground">{level}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block mb-1 text-sm font-medium text-card-foreground">
                            Mô Tả
                        </label>
                        <textarea
                            value={damageForm.description}
                            onChange={(e) => setDamageForm({ ...damageForm, description: e.target.value })}
                            className="w-full px-3 py-2 border border-input rounded-md focus:ring-2 focus:ring-ring min-h-[100px]"
                            placeholder="Mô Tả Chi Tiết Về Hỏng Hóc"
                        />
                        {errors.description && (
                            <p className="mt-1 text-sm text-destructive">{errors.description}</p>
                        )}
                        <p className="mt-1 text-sm text-muted-foreground">
                            {damageForm.description.length}/500 Ký Tự
                        </p>
                    </div>

                    <div>
                        <label className="block mb-1 text-sm font-medium text-card-foreground">
                            Thêm Hình Ảnh (Tùy Chọn)
                        </label>
                        <div className="flex justify-center px-6 pt-5 pb-6 mt-1 border-2 border-dashed rounded-md border-input">
                            <div className="space-y-1 text-center">
                                <FaUpload className="w-12 h-12 mx-auto text-muted-foreground" />
                                <div className="flex text-sm text-muted-foreground">
                                    <label className="relative font-medium rounded-md cursor-pointer text-primary hover:text-accent focus-within:outline-none focus-within:ring-2 focus-within:ring-ring">
                                        <span>Tải File Lên</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="sr-only"
                                        />
                                    </label>
                                </div>
                                <p className="text-xs text-muted-foreground">PNG, JPG nặng 10MB</p>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full px-4 py-2 text-white transition-colors bg-gray-900 rounded-md bg-primary hover:bg-accent disabled:opacity-50"
                    >
                        {"Báo Hỏng"}
                    </button>
                </form>

                {/* Danh Sách Thiết Bị Trong Phòng */}
                <div className="p-4 border rounded-lg">
                    <label className="block mb-1 text-lg font-medium text-card-foreground">
                        Danh Sách Thiết Bị Hỏng Trong Phòng {label}
                    </label>
                    {damageForm.damageType === "Các Loại Thiết Bị" && thietBiList.length > 0 && (
                        <div className="overflow-x-auto mt-4">
                            <table className="w-full border border-gray-300 table-auto">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="px-4 py-2 border text-center">STT</th>
                                        <th className="px-4 py-2 border">Thể Loại</th>
                                        <th className="px-4 py-2 border text-center">Tổng TB</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {groupedThietBiList.map((group, index) => (
                                        <>
                                            {/* Bảng cha */}
                                            <tr key={index} className="hover:bg-gray-50">
                                                <td className="px-4 py-2 border text-center">{index + 1}</td>
                                                <td className="px-4 py-2 border">
                                                    <div className="flex items-center justify-between">
                                                        {group.theLoai}
                                                        <button
                                                            onClick={() => toggleRow(group.theLoai)}
                                                            className="ml-2"
                                                        >
                                                            {expandedRows.includes(group.theLoai) ? (
                                                                <FaChevronUp />
                                                            ) : (
                                                                <FaChevronDown />
                                                            )}
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2 border text-center">{group.total}</td>
                                            </tr>

                                            {/* Bảng con */}
                                            {expandedRows.includes(group.theLoai) && (
                                                <tr>
                                                    <td colSpan={4} className=" border">
                                                        <table className="w-full border border-gray-300 table-auto">
                                                            <thead className="bg-gray-100">
                                                                <tr>
                                                                    <th className="text-sm border text-center">STT</th>
                                                                    <th className="text-sm border text-center">Mã TB</th>
                                                                    <th className="text-sm border">Tên Thiết Bị</th>
                                                                    <th className="text-sm border text-center">Hành Động</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {group.devices.map((tb, subIndex) => {
                                                                    console.log(tb); // Kiểm tra thông tin thiết bị
                                                                    return (
                                                                        <tr key={tb.id} className="hover:bg-gray-50">
                                                                            <td className="text-sm text-center border">{subIndex + 1}</td>
                                                                            <td className="text-sm text-center border">{tb.thongtinthietbi_id}</td>
                                                                            <td className="text-sm border">{tb.tenThietBi}</td>
                                                                            <td className="text-sm text-center border">
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={selectedDevices.some(device => device.thietbi_id === tb.thietbi_id && device.thongtinthietbi_id === tb.thongtinthietbi_id)} // Kiểm tra trạng thái chính xác
                                                                                    onChange={(e) => handleDeviceSelect(e, tb.thietbi_id, tb.thongtinthietbi_id)} // Truyền cả thietbi_id và thongtinthietbi_id
                                                                                />

                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </td>
                                                </tr>
                                            )}
                                        </>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

            </div >
        </div >
    );
};

export default BaoHong