import axios from "axios";
import React, { useState, useEffect, useMemo } from "react";
import { toaTheoCoSo } from "../../utils/constants";
import { FaUpload, FaChevronUp, FaChevronDown, FaTimesCircle } from "react-icons/fa";
import { MdWarning } from "react-icons/md";
import { toast } from "react-toastify";
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

    // --- ---------------- ---
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    // ---------------------------------

    const [damageForm, setDamageForm] = useState({
        damageType: "",
        description: "",
        damageLevel: "",
    });

    const damageTypes = ["Hạ Tầng", "Các Loại Thiết Bị", "Khác"];

    const [errors] = useState({});

    useEffect(() => {
        // Gọi song song hai API
        Promise.all([
            axios.get(`${process.env.REACT_APP_API_URL}/phong`), // API lấy thông tin chi tiết phòng
            axios.get(`${process.env.REACT_APP_API_URL}/phong/phonglist`) // API lấy danh sách phòng theo dạng ID và tên
        ])
            .then(([phongDetailsRes, phongListRes]) => {
                const phongDetails = phongDetailsRes.data;
                const phongList = phongListRes.data;

                if (!Array.isArray(phongDetails) || !Array.isArray(phongList)) {
                    console.error("Dữ liệu phòng trả về không phải là mảng:", phongDetailsRes.data, phongListRes.data);
                    return;
                }

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

        if (name === "coSo") updatedFormData = { ...updatedFormData, toa: "", tang: "", soPhong: "", idPhong: null, };
        else if (name === "toa") updatedFormData = { ...updatedFormData, tang: "", soPhong: "", idPhong: null, };
        else if (name === "tang") updatedFormData = { ...updatedFormData, soPhong: "", idPhong: null, };

        setFormData(updatedFormData);

        if (name === "soPhong" && value) {
            const { coSo, toa, tang } = updatedFormData;
            const selectedRoom = mergedData.find(item =>
                item.coSo === coSo &&
                item.toa === toa &&
                item.tang === parseInt(tang) &&
                item.soPhong === parseInt(value)
            );

            if (selectedRoom) {
                console.log("Selected Room:", selectedRoom);
                setLabel(`Phòng ${selectedRoom.phong} (${selectedRoom.chucNang})`);
                setFormData(prev => ({ ...prev, idPhong: selectedRoom.id }));
                if (damageForm.damageType === "Các Loại Thiết Bị") {
                    fetchDevicesForRoom(selectedRoom.id);
                }
            } else {
                setLabel("");
                setFormData(prev => ({ ...prev, idPhong: null }));
                setThietBiList([]);
            }
            setDamageForm(prev => ({ ...prev, damageType: "" }));
        } else if (name !== "soPhong") {
            setLabel("");
            setFormData(prev => ({ ...prev, idPhong: null }));
            setThietBiList([]);
            setDamageForm(prev => ({ ...prev, damageType: "" }));
        }
    };

    const fetchDevicesForRoom = (roomId) => {
        if (!roomId) {
            setThietBiList([]);
            return;
        }
        console.log(`Workspaceing devices for room ID: ${roomId}`);
        axios.get(`${process.env.REACT_APP_API_URL}/phong/danhsach-thietbi/${roomId}`)
            .then((response) => {
                console.log("API response for devices:", response.data);
                const devices = Array.isArray(response.data) ? response.data : [];
                setThietBiList(devices);
            })
            .catch((error) => {
                console.error("Lỗi khi gọi API danh sách thiết bị:", error);
                setThietBiList([]);
                toast.error("Lỗi tải danh sách thiết bị!");
            });
    }

    const handleDamageTypeChange = (e) => {
        const selectedType = e.target.value;
        setDamageForm((prevForm) => ({ ...prevForm, damageType: selectedType }));

        if (selectedType === "Các Loại Thiết Bị" && formData.idPhong) {
            fetchDevicesForRoom(formData.idPhong);
        } else {
            setThietBiList([]);
        }
    };

    // xử lý hình ảnh
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                alert('Chỉ chấp nhận file ảnh.');
                return;
            }
            if (file.size > 10 * 1024 * 1024) {
                alert('Kích thước ảnh tối đa là 10MB.');
                return;
            }

            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        } else {
            setImageFile(null);
            setImagePreview(null);
        }
    };

    //xóa ảnh mới chọn 
    const removeImage = () => {
        setImageFile(null);
        setImagePreview(null);
        const fileInput = document.getElementById('damage-image-upload');
        if (fileInput) {
            fileInput.value = '';
        }
    };

    // gửi báo hỏng
    const handleSubmitBaoHong = async (e) => {
        e.preventDefault();

        // Kiểm tra dữ liệu cơ bản
        if (!formData.idPhong || !damageForm.damageType || !damageForm.description || !damageForm.damageLevel) {
            toast.warn("Vui lòng điền đầy đủ các thông tin bắt buộc!");
            return;
        }
        // Kiểm tra nếu là báo hỏng thiết bị thì phải chọn ít nhất 1 thiết bị
        if (damageForm.damageType === "Các Loại Thiết Bị" && selectedDevices.length === 0) {
            toast.warn("Vui lòng chọn ít nhất một thiết bị để báo hỏng.");
            return;
        }

        let imageUrl = null;

        if (imageFile) {
            setIsUploading(true);
            const uploadData = new FormData();
            uploadData.append('hinhAnh', imageFile);

            try {
                const uploadResponse = await axios.post(`${process.env.REACT_APP_API_URL}/baohong/upload-image`, uploadData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                imageUrl = uploadResponse.data.imageUrl;
                console.log("Image uploaded:", imageUrl);
            } catch (uploadError) {
                console.error("Lỗi tải ảnh lên:", uploadError.response?.data || uploadError.message);
                alert("Không thể tải ảnh lên. Báo hỏng sẽ được gửi đi mà không có ảnh.");

            } finally {
                setIsUploading(false);
            }
        }
        const requestData = {
            devices: damageForm.damageType === "Các Loại Thiết Bị" ? selectedDevices : [],
            phong_id: formData.idPhong,
            user_id: null,
            thiethai: damageForm.damageLevel,
            moTa: damageForm.description,
            hinhAnh: imageUrl,
            loaithiethai: damageForm.damageType,
        };
        console.log("Dữ liệu gửi đi:", requestData);

        try {
            await axios.post(`${process.env.REACT_APP_API_URL}/baohong/guibaohong`, requestData);
            toast.success("Gửi phiếu Báo Hỏng thành công!");

            setDamageForm(prev => ({ ...prev, description: "" }));
            setImageFile(null);
            setImagePreview(null);
            const fileInput = document.getElementById('damage-image-upload');
            if (fileInput) fileInput.value = '';
            setSelectedDevices([]);

            if (damageForm.damageType === "Các Loại Thiết Bị" && formData.idPhong) {
                fetchDevicesForRoom(formData.idPhong);
            }

            eventBus.emit('baoHongSubmitted'); // Thông báo cho các component khác

        } catch (error) {
            console.error("Lỗi khi gửi báo hỏng:", error);
            toast.error(`Không thể gửi báo hỏng: ${error.response?.data?.error || error.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    // Xử lý toggle hiển thị chi tiết
    const toggleRow = (tenTheLoai) => {
        if (expandedRows.includes(tenTheLoai)) {
            setExpandedRows(expandedRows.filter((row) => row !== tenTheLoai));
        } else {
            setExpandedRows([...expandedRows, tenTheLoai]);
        }
    };

    // Xử lý hiển thị bảng báo hỏng
    const groupedThietBiList = useMemo(() => {
        return Array.isArray(thietBiList) ? thietBiList.reduce((groups, thietBi) => {
            const group = groups.find(g => g.tenTheLoai === thietBi.tenTheLoai);
            if (group) {
                group.devices.push(thietBi);
                group.total += 1;
            } else {
                groups.push({ tenTheLoai: thietBi.tenTheLoai, devices: [thietBi], total: 1 });
            }
            return groups;
        }, []) : [];
    }, [thietBiList]);

    // Xử lý chọn các thiết bị trong phòng
    const handleDeviceSelect = (e, thietbi_id, thongtinthietbi_id) => {
        const newDevice = { thietbi_id, thongtinthietbi_id };
        setSelectedDevices(prev => {
            const isSelected = prev.some(d => d.thietbi_id === thietbi_id && d.thongtinthietbi_id === thongtinthietbi_id);
            if (e.target.checked && !isSelected) return [...prev, newDevice];
            if (!e.target.checked && isSelected) return prev.filter(d => !(d.thietbi_id === thietbi_id && d.thongtinthietbi_id === thongtinthietbi_id));
            return prev;
        });
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-lg">
            <h2 className="flex items-center mb-6 text-xl font-semibold border-b text-card-foreground">
                <MdWarning className="mr-2 text-destructive" />
                Báo Hỏng
            </h2>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2"> {/* Changed to md:grid-cols-2 */}
                {/* Form Báo Hỏng */}
                <form className="p-4 space-y-2 border rounded-lg" onSubmit={handleSubmitBaoHong}>
                    {/* Vị Trí */}
                    <label className="block text-sm font-medium text-card-foreground">
                        Vị Trí <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4"> {/* Adjusted grid for smaller screens */}
                        {/* Cơ Sở */}
                        <div>
                            <label className="block text-xs">Cơ Sở</label>
                            <select name="coSo" value={formData.coSo} onChange={handleChange} className="w-full px-3 py-2 mt-1 border rounded-md border-input focus:ring-2 focus:ring-ring">
                                <option value="">Chọn</option>
                                {[...new Set(mergedData.map(item => item.coSo))].map(coSo => <option key={coSo} value={coSo}>{coSo}</option>)}
                            </select>
                        </div>
                        {/* Tòa */}
                        <div>
                            <label className="block text-xs">Tòa</label>
                            <select name="toa" value={formData.toa} onChange={handleChange} className="w-full px-3 py-2 mt-1 border rounded-md border-input focus:ring-2 focus:ring-ring" disabled={!formData.coSo}>
                                <option value="">Chọn</option>
                                {toaTheoCoSo[formData.coSo]?.map(toa => <option key={toa} value={toa}>{toa}</option>)}
                            </select>
                        </div>
                        {/* Tầng */}
                        <div>
                            <label className="block text-xs">Tầng</label>
                            <select name="tang" value={formData.tang} onChange={handleChange} className="w-full px-3 py-2 mt-1 border rounded-md border-input focus:ring-2 focus:ring-ring" disabled={!formData.toa}>
                                <option value="">Chọn</option>
                                {[...new Set(mergedData.filter(item => item.coSo === formData.coSo && item.toa === formData.toa).map(item => item.tang))].sort((a, b) => a - b).map(tang => <option key={tang} value={tang}>{tang}</option>)}
                            </select>
                        </div>
                        {/* Phòng */}
                        <div>
                            <label className="block text-xs">Số Phòng</label>
                            <select name="soPhong" value={formData.soPhong} onChange={handleChange} className="w-full px-3 py-2 mt-1 border rounded-md border-input focus:ring-2 focus:ring-ring" disabled={!formData.tang}>
                                <option value="">Chọn</option>
                                {mergedData.filter(item => item.coSo === formData.coSo && item.toa === formData.toa && item.tang === parseInt(formData.tang)).map(item => <option key={item.id} value={item.soPhong}>{item.soPhong}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Loại Thiệt Hại */}
                    <div>
                        <label className="block mb-1 text-sm font-medium text-card-foreground">
                            Loại Thiệt Hại <span className="text-red-500">*</span>
                        </label>
                        <select value={damageForm.damageType} onChange={handleDamageTypeChange} className="w-full px-3 py-2 border rounded-md border-input focus:ring-2 focus:ring-ring">
                            <option value="">Chọn Loại</option>
                            {damageTypes.map(type => <option key={type} value={type}>{type}</option>)}
                        </select>
                    </div>

                    {/* Mức Độ Hỏng Hóc */}
                    <div>
                        <label className="block mb-1 text-sm font-medium text-card-foreground">
                            Mức Độ Hỏng Hóc <span className="text-red-500">*</span>
                        </label>
                        <div className="flex flex-wrap gap-4"> {/* Use flex-wrap for responsiveness */}
                            {["Nhẹ", "Vừa", "Nặng"].map(level => (
                                <label key={level} className="flex items-center">
                                    <input type="radio" name="damageLevel" value={level} checked={damageForm.damageLevel === level} onChange={(e) => setDamageForm({ ...damageForm, damageLevel: e.target.value })} className="mr-2" />
                                    <span className="text-sm text-card-foreground">{level}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Mô Tả */}
                    <div>
                        <label className="block mb-1 text-sm font-medium text-card-foreground">
                            Mô Tả <span className="text-red-500">*</span>
                        </label>
                        <textarea value={damageForm.description} onChange={(e) => setDamageForm({ ...damageForm, description: e.target.value })} className="w-full px-3 py-2 border border-input rounded-md focus:ring-2 focus:ring-ring min-h-[80px]" placeholder="Mô Tả Chi Tiết Về Hỏng Hóc" required /> {/* Added required */}
                        {errors.description && <p className="mt-1 text-sm text-destructive">{errors.description}</p>}
                        <p className="mt-1 text-xs text-muted-foreground"> {damageForm.description.length}/500 Ký Tự </p>
                    </div>

                    {/* Thêm Hình Ảnh */}
                    <div>
                        <label className="block mb-1 text-sm font-medium text-card-foreground">
                            Thêm Hình Ảnh (Tùy Chọn)
                        </label>
                        <div className={`flex items-center justify-center px-6 pt-5 pb-6 mt-1 border-2 border-dashed rounded-md border-input ${imagePreview ? 'border-solid' : ''}`}>
                            {imagePreview ? (
                                <div className="relative group">
                                    <img src={imagePreview} alt="Preview" className="object-contain mx-auto rounded-md max-h-40" />
                                    <button
                                        type="button"
                                        onClick={removeImage}
                                        className="absolute top-0 right-0 p-1 text-white bg-red-500 rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100"
                                        title="Xóa ảnh"
                                    >
                                        <FaTimesCircle />
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-1 text-center">
                                    <FaUpload className="w-10 h-10 mx-auto text-muted-foreground" />
                                    <div className="flex text-sm text-muted-foreground">
                                        <label htmlFor="damage-image-upload" className="relative font-medium bg-white rounded-md cursor-pointer text-primary hover:text-accent focus-within:outline-none focus-within:ring-2 focus-within:ring-ring">
                                            <span>Tải File Lên</span>
                                            <input id="damage-image-upload" name="damage-image-upload" type="file" accept="image/*" className="sr-only" onChange={handleImageChange} />
                                        </label>
                                    </div>
                                    <p className="text-xs text-muted-foreground">PNG, JPG, JPEG tối đa 10MB</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Nút Submit */}
                    <button type="submit" disabled={isUploading} className="w-full px-4 py-2 text-white transition-colors bg-gray-900 rounded-md hover:bg-accent disabled:opacity-50">
                        {isUploading ? 'Đang tải ảnh lên...' : 'Báo Hỏng'}
                    </button>
                </form>

                {/* Danh Sách Thiết Bị (nếu loại là 'Các Loại Thiết Bị') */}
                <div className={`p-4 border rounded-lg ${damageForm.damageType === "Các Loại Thiết Bị" ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                    <label className="block mb-2 text-lg font-medium text-card-foreground">
                        Chọn Thiết Bị Hỏng {label}
                    </label>
                    {/* Thông báo */}
                    {(damageForm.damageType === "Các Loại Thiết Bị" && !formData.idPhong) && (<p className="italic text-center text-gray-500">Vui lòng chọn phòng.</p>)}
                    {(damageForm.damageType === "Các Loại Thiết Bị" && formData.idPhong && (!thietBiList || thietBiList.length === 0)) && (<p className="italic text-center text-gray-500">Phòng này không có thiết bị hoặc đang tải...</p>)}

                    {(damageForm.damageType === "Các Loại Thiết Bị" && formData.idPhong && thietBiList && thietBiList.length > 0) && (
                        <div className="mt-2 overflow-x-auto max-h-96">
                            <table className="w-full border border-gray-300 table-auto">
                                <thead className="sticky top-0 bg-gray-100">
                                    <tr>
                                        <th className="px-4 py-2 text-xs font-medium tracking-wider text-center text-gray-500 uppercase border">STT</th>
                                        <th className="px-4 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase border">Thể Loại</th>
                                        <th className="px-4 py-2 text-xs font-medium tracking-wider text-center text-gray-500 uppercase border">Tổng TB</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {groupedThietBiList.map((group, index) => (
                                        <React.Fragment key={group.tenTheLoai + index}>
                                            {/* Parent Row */}
                                            <tr className="hover:bg-gray-50">
                                                <td className="px-4 py-2 text-sm text-center border">{index + 1}</td>
                                                <td className="px-4 py-2 text-sm border">
                                                    <div className="flex items-center justify-between">
                                                        {group.tenTheLoai}
                                                        <button onClick={() => toggleRow(group.tenTheLoai)} className="ml-2 text-gray-500 hover:text-gray-700">
                                                            {expandedRows.includes(group.tenTheLoai) ? <FaChevronUp /> : <FaChevronDown />}
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2 text-sm text-center border">{group.total}</td>
                                            </tr>
                                            {/* Child Table */}
                                            {expandedRows.includes(group.tenTheLoai) && (
                                                <tr>
                                                    <td colSpan={1}></td>
                                                    <td colSpan={3} className="p-1 border">
                                                        <table className="w-full border-collapse">
                                                            <thead className="bg-gray-50">
                                                                <tr>
                                                                    <th className="px-3 py-1 text-xs font-medium tracking-wider text-center text-gray-500 uppercase border">Chọn</th>
                                                                    <th className="px-3 py-1 text-xs font-medium tracking-wider text-left text-gray-500 uppercase border">Mã Định Danh</th>
                                                                    <th className="px-3 py-1 text-xs font-medium tracking-wider text-left text-gray-500 uppercase border">Tên TB</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {group.devices.map(tb => {
                                                                    const reportStatus = tb.trangThaiBaoHongHienTai;
                                                                    const activeReportStatuses = ['Chờ Duyệt', 'Đã Duyệt', 'Đang Tiến Hành', 'Không Thể Hoàn Thành', 'Yêu Cầu Làm Lại'];
                                                                    const isAlreadyReported = reportStatus && activeReportStatuses.includes(reportStatus);
                                                                    return (
                                                                        <tr key={tb.thongtinthietbi_id} className="hover:bg-gray-100">
                                                                            <td className="px-3 py-1 text-center border">
                                                                                <input
                                                                                    type="checkbox"
                                                                                    disabled={isAlreadyReported}
                                                                                    className={`w-4 h-4 ${isAlreadyReported ? 'cursor-not-allowed opacity-50' : ''}`}
                                                                                    checked={!isAlreadyReported && selectedDevices.some(d => d.thongtinthietbi_id === tb.thongtinthietbi_id)}
                                                                                    onChange={e => !isAlreadyReported && handleDeviceSelect(e, tb.thietbi_id, tb.thongtinthietbi_id)}
                                                                                />
                                                                                {isAlreadyReported && (
                                                                                    <span className="ml-1 text-xs text-yellow-600" title={`Trạng thái báo hỏng: ${reportStatus}`}>({reportStatus})</span>
                                                                                )}
                                                                            </td>
                                                                            <td className="px-3 py-1 text-xs border">{tb.thongtinthietbi_id}</td>
                                                                            <td className="px-3 py-1 text-xs border">{tb.tenLoaiThietBi}</td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BaoHong