import axios from "axios";
import { useState, useEffect } from "react";
import { toaTheoCoSo } from "../../utils/constants";
import { FaUpload } from "react-icons/fa";
import { MdWarning } from "react-icons/md";

const BaoHong = () => {
    const [mergedData, setMergedData] = useState([]);
    const [label, setLabel] = useState("");
    const [thietBiList, setThietBiList] = useState([]);
    const [formData, setFormData] = useState({
        coSo: "",
        toa: "",
        tang: "",
        soPhong: "",
        chucNang: "",
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
        description: "",
        image: null
    });

    const damageTypes = ["Kết Cấu", "Hệ Thống Điện", "Hệ Thống Nước", "Các Loại Thiết Bị", "Khác"];
    // const handleFileUpload = (e) => {
    //     setDamageForm((prevForm) => ({ ...prevForm, image: e.target.files[0] }));
    // };

    // const handleDamageInputChange = (e) => {
    //     const { name, value } = e.target;
    //     setDamageForm((prevForm) => ({ ...prevForm, [name]: value }));
    // };

    const handleDamageTypeChange = (e) => {
        const selectedType = e.target.value;
        // console.log("Loại thiệt hại được chọn:", selectedType); // Kiểm tra loại thiệt hại
        // console.log("ID phòng hiện tại:", formData.idPhong); // Kiểm tra idPhong

        setDamageForm((prevForm) => ({ ...prevForm, damageType: selectedType }));

        if (selectedType === "Các Loại Thiết Bị" && formData.idPhong) {
            console.log(`Gọi API: http://localhost:5000/api/phong/danhsach-thietbi/${formData.idPhong}`);
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


    const [errors] = useState({});
    return (
        <div className="p-6 bg-white rounded-lg shadow-lg" >
            <h2 className="flex items-center border-b mb-6 text-xl font-semibold text-card-foreground">
                <MdWarning className="mr-2 text-destructive" />
                Báo Hỏng
            </h2>

            < div className="grid grid-cols-2 gap-2">
                {/*Form Báo Hỏng */}
                <form className="space-y-4 p-4 border rounded-lg">
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
                            Mức Độ Hỏng Hóc  <span className="text-red-500">*</span>
                        </label>
                        <div className="flex space-x-4">
                            {["Nhẹ", "Vừa", "Nặng"].map((level) => (
                                <label key={level} className="flex items-center">
                                    <input
                                        type="radio"
                                        value=""

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
                        Danh Sách Thiết Bị Trong Phòng {label}
                    </label>
                    {damageForm.damageType === "Các Loại Thiết Bị" && thietBiList.length > 0 && (
                        <div className="overflow-x-auto mt-4">
                            <table className="w-full border border-gray-300 table-auto">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="px-4 py-2 border">STT</th>
                                        <th className="px-4 py-2 border">Tên Thiết Bị</th>
                                        <th className="px-4 py-2 border">Tình Trạng</th>
                                        <th className="px-4 py-2 border">Hành Động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {thietBiList.map((thietBi, index) => (
                                        <tr key={index}>
                                            <td className="border border-gray-300 px-4 py-2 text-center">{index + 1}</td>
                                            <td className="border border-gray-300 px-4 py-2">{thietBi.tenThietBi}</td>
                                            <td className="border border-gray-300 px-4 py-2">{thietBi.tinhTrang}</td>
                                            <td className="border border-gray-300 px-4 py-2">
                                                <button className="px-3 py-1 text-white bg-blue-500 rounded hover:bg-blue-700">
                                                    Xem Chi Tiết
                                                </button>
                                            </td>
                                        </tr>
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