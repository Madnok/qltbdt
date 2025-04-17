import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import FormPhieuNhap from "./FormPhieuNhap";
import { useFormattedPrice } from "../../utils/helpers";
import { FaChevronDown, FaChevronUp, FaTrash, FaPaperclip, FaSpinner } from "react-icons/fa";
import { uploadChungTuNhap } from "../../api";
import { toast } from 'react-toastify';

const FormNhap = ({ onClose, refreshData }) => {
    const [showPhieuNhap, setShowPhieuNhap] = useState(false);
    const formatPrice = useFormattedPrice();
    const [phieuNhapId] = useState(null); // Giữ lại nếu bạn có logic dùng ID này sau này, nếu không có thể xóa
    const [thietBiNhap, setThietBiNhap] = useState([]);
    const [nguoiTao, setNguoiTao] = useState("");
    const [ngayTao, setNgayTao] = useState("");
    const [truongHopNhap, setTruongHopNhap] = useState("muaMoi");
    const [selectedFiles, setSelectedFiles] = useState([]); // State cho file chứng từ
    const fileInputRef = useRef(null); // Ref cho input file
    const [isSaving, setIsSaving] = useState(false); // State cho việc lưu đơn nhập


    useEffect(() => {
        // Lấy ngày tạo theo GMT+7
        const now = new Date();
        const vietnamTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
        const formattedDate = vietnamTime.toISOString().slice(0, 16).replace("T", " ");
        setNgayTao(formattedDate);

        const userId = 1;
        axios.get(`${process.env.REACT_APP_API_URL}/nhap/user/${userId}`, { withCredentials: true })
            .then((res) => setNguoiTao(res.data.hoTen))
            .catch((error) => console.error("Lỗi lấy thông tin người tạo:", error));
    }, []);

    // useEffect thứ hai theo dõi phieuNhapId để lấy danh sách thiết bị (Có thể không cần thiết nếu form này chỉ để tạo mới)
    useEffect(() => {
        if (!phieuNhapId) return; // Nếu không có ID phiếu nhập (ví dụ khi tạo mới) thì không làm gì

        axios.get(`${process.env.REACT_APP_API_URL}/nhap/${phieuNhapId}/thongtinthietbi`, { withCredentials: true })
            .then((res) => {
                console.log("Thiết bị trong phiếu nhập:", res.data);
                setThietBiNhap(res.data);
            })
            .catch((error) => console.error("Lỗi lấy danh sách thiết bị:", error));
    }, [phieuNhapId]);

    // xử lý bảng dữ liệu
    const [expandedRows, setExpandedRows] = useState([]);

    const toggleRow = (thietbi_id) => { // Nên dùng thietbi_id làm key duy nhất cho group
        if (expandedRows.includes(thietbi_id)) {
            setExpandedRows(expandedRows.filter((rowId) => rowId !== thietbi_id));
        } else {
            setExpandedRows([...expandedRows, thietbi_id]);
        }
    };

    // Gom nhóm dữ liệu để hiển thị trong bảng chính
    const groupedData = thietBiNhap.reduce((acc, item) => {
        const existing = acc.find((tb) => tb.thietbi_id === item.thietbi_id);
        if (existing) {
            // Cập nhật số lượng và tổng tiền
            existing.soLuong += item.soLuong;
            existing.tongTien += item.donGia * item.soLuong;
            // Thêm chi tiết vào danh sách chi tiết của nhóm đã có
            existing.chiTiet.push(...(item.chiTiet || [])); // Đảm bảo item.chiTiet là mảng
        } else {
            // Thêm nhóm mới
            acc.push({
                // Không cần tttb_id ở đây vì đây là group
                thietbi_id: item.thietbi_id,
                tenThietBi: item.tenThietBi,
                thoiGianBaoHanh: item.thoiGianBaoHanh,
                donGia: item.donGia,
                soLuong: item.soLuong,
                tongTien: item.donGia * item.soLuong,
                chiTiet: item.chiTiet || [], // Khởi tạo danh sách chi tiết
            });
        }
        return acc;
    }, []);


    const handleAddThietBi = (newThietBi) => {
        // newThietBi nên chứa: thietbi_id, tenThietBi, thoiGianBaoHanh, soLuong, donGia, chiTiet (là mảng các object { tttb_id })
        setThietBiNhap((prev) => [...prev, newThietBi]); // Chỉ cần thêm vào danh sách phẳng
    };

    const handleDeleteThietBi = (thietbi_id_to_delete) => {
        // Xóa tất cả các mục có thietbi_id này khỏi danh sách phẳng
        setThietBiNhap((prev) => prev.filter((tb) => tb.thietbi_id !== thietbi_id_to_delete));
        // Đóng hàng con nếu đang mở
        setExpandedRows(prev => prev.filter(rowId => rowId !== thietbi_id_to_delete));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Kiểm tra danh sách thiết bị nhập
        if (thietBiNhap.length === 0) {
            toast.warn("Vui lòng thêm ít nhất một thiết bị vào phiếu nhập.");
            return;
        }

        // Kiểm tra bắt buộc phải có chứng từ khi nhập
        if (selectedFiles.length === 0) {
            toast.warn("Vui lòng đính kèm ít nhất một file chứng từ.");
            return;
        }

        if (!["muaMoi", "taiTro"].includes(truongHopNhap)) {
            toast.warn("Trường hợp nhập không hợp lệ!");
            return;
        }

        setIsSaving(true); // Đặt trạng thái đang lưu
        toast.info("Đang xử lý lưu phiếu nhập...");

        // Chuẩn bị payload cho API tạo phiếu nhập
        const danhSachThietBiPayload = thietBiNhap.map((tb) => ({
            thietbi_id: tb.thietbi_id,
            tenThietBi: tb.tenThietBi,
            thoiGianBaoHanh: tb.thoiGianBaoHanh,
            soLuong: tb.soLuong,
        }));

        try {
            const payload = {
                userId: 1,
                truongHopNhap,
                ngayTao,
                danhSachThietBi: danhSachThietBiPayload,
            };

            const config = {
                withCredentials: true
            };

            // --- Bước 1: Tạo phiếu nhập ---
            console.log("Đang gửi payload tạo phiếu nhập:", payload);
            const response = await axios.post(`${process.env.REACT_APP_API_URL}/nhap`, payload, config);
            console.log("Response tạo phiếu nhập:", response);

            const createdPhieuNhapId = response?.data?.phieunhapId;
            if (!createdPhieuNhapId) {
                console.error("API tạo phiếu nhập không trả về phieunhapId:", response?.data);
                throw new Error("Không nhận được ID phiếu nhập sau khi tạo. Không thể upload chứng từ.");
            }

            // --- Bước 2: Upload chứng từ ---
            console.log(`Đang upload ${selectedFiles.length} chứng từ cho phiếu nhập ID: ${createdPhieuNhapId}`);
            const formData = new FormData();
            selectedFiles.forEach(file => {
                formData.append('chungTuFiles', file);
            });

            try {
                await uploadChungTuNhap(createdPhieuNhapId, formData);
                console.log("Upload chứng từ thành công!");

            } catch (uploadError) {

                console.error("Lỗi upload chứng từ:", uploadError);
                toast.error(`Lỗi upload chứng từ: ${uploadError.response?.data?.error || uploadError.message}`);
                throw uploadError;
            }
            toast.success("Lưu phiếu nhập thành công và upload chứng từ thành công!");
            refreshData();
            onClose();

        } catch (error) {
            console.error("Lỗi khi lưu phiếu nhập:", error);
            const errorMessage = error.response?.data?.error || error.message || "Lỗi không xác định";
            toast.error(`Lỗi lưu phiếu nhập: ${errorMessage}`);
        } finally {
            setIsSaving(false); // Luôn trả lại trạng thái không lưu
        }
    };

    // Hàm xử lý khi chọn file
    const handleFileChange = (event) => {
        // Giới hạn số lượng file
        const files = Array.from(event.target.files);
        if (files.length > 5) {
            alert("Chỉ được phép upload tối đa 5 file.");
            // Reset input nếu vượt quá giới hạn
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
            setSelectedFiles([]); // Xóa các file đã chọn nếu vượt quá
            return;
        }
        setSelectedFiles(files); // Lưu danh sách file vào state
    };

    // Hàm xóa file đã chọn
    const handleRemoveFile = (fileName) => {
        setSelectedFiles(prevFiles => prevFiles.filter(file => file.name !== fileName));
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <div className="flex flex-col h-full overflow-y-auto bg-white border-l shadow-md">
            {/* Header */}
            <div className="flex items-center justify-between p-2 bg-white border-b">
                <h2 className="text-lg font-semibold">Thêm Ghi Nhập</h2>
                <button className="w-10 h-10 rounded-full hover:bg-gray-300" onClick={onClose}>
                    <i className="text-lg text-black fas fa-times"></i>
                </button>
            </div>

            {/* Form chính */}
            {/* Gán ID cho form để nút submit bên ngoài có thể kích hoạt */}
            <form id="nhapForm" className="flex-grow p-4 space-y-4 overflow-y-auto" onSubmit={handleSubmit}>
                <div>
                    <label className="block font-medium">Người Tạo:</label>
                    <input type="text" value={nguoiTao || "Đang tải..."} disabled className="w-full p-2 bg-gray-100 border rounded" />
                </div>

                <div>
                    <label className="block font-medium">Ngày Tạo:</label>
                    <input type="text" value={ngayTao || "Đang tải..."} disabled className="w-full p-2 bg-gray-100 border rounded" />
                </div>

                <div>
                    <label className="block font-medium">Trường Hợp Nhập:</label>
                    <div className="flex">
                        <button
                            type="button"
                            className={`flex-1 p-2 rounded-l ${truongHopNhap === "muaMoi" ? "bg-gray-800 text-white" : "bg-gray-200"}`}
                            onClick={() => setTruongHopNhap("muaMoi")}
                        >
                            Mua Mới
                        </button>
                        <button
                            type="button"
                            className={`flex-1 p-2 rounded-r ${truongHopNhap === "taiTro" ? "bg-gray-800 text-white" : "bg-gray-200"}`}
                            onClick={() => setTruongHopNhap("taiTro")}
                        >
                            Được Tài Trợ
                        </button>
                    </div>
                </div>

                {/* Phần Danh sách thiết bị */}
                <div className="pt-4">
                    <h3 className="text-xl font-semibold">Danh Sách Thiết Bị <span className="text-red-500">*</span></h3>
                    <table className="w-full mt-2 border">
                        <thead>
                            <tr className="bg-gray-200">
                                <th className="px-4 py-2 border-b">Id Thiết Bị</th>
                                <th className="px-4 py-2 border-b">Tên</th>
                                <th className="px-4 py-2 border-b">Số Lượng</th>
                                <th className="px-4 py-2 text-sm border-b">Bảo Hành <span className="text-sm text-gray-500">(Tháng)</span></th>
                                <th className="px-4 py-2 border-b">Đơn Giá</th>
                                <th className="px-4 py-2 border-b">Tổng Tiền</th>
                                <th className="px-3 py-2 text-xs font-medium text-center text-gray-600 uppercase border-b">Xóa</th>
                            </tr>
                        </thead>
                        <tbody>
                            {groupedData.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="p-4 text-center text-gray-500 border">Chưa có thiết bị nào được thêm.</td>
                                </tr>
                            )}
                            {groupedData.map((tb) => (
                                <React.Fragment key={tb.thietbi_id}>
                                    {/* Hàng bảng cha */}
                                    <tr className="text-center hover:bg-gray-50">
                                        <td className="p-2 border">{tb.thietbi_id}</td>
                                        <td className="p-2 text-left border">
                                            <div className="flex items-center justify-between">
                                                {tb.tenThietBi}
                                                {/* Chỉ hiển thị nút chevron nếu có chi tiết */}
                                                {tb.chiTiet && tb.chiTiet.length > 0 && (
                                                    <button onClick={() => toggleRow(tb.thietbi_id)} type="button" className="ml-2 text-gray-500 hover:text-gray-700">
                                                        {expandedRows.includes(tb.thietbi_id) ? (
                                                            <FaChevronUp size={12} />
                                                        ) : (
                                                            <FaChevronDown size={12} />
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-2 border">{tb.soLuong}</td>
                                        <td className="p-2 border">{tb.thoiGianBaoHanh}</td>
                                        <td className="p-2 border">{formatPrice(tb.donGia)}</td>
                                        <td className="p-2 border">{formatPrice(tb.tongTien)}</td>
                                        <td className="px-3 py-2 text-center border-b">
                                            <button
                                                type="button"
                                                className="text-red-500 hover:text-red-700"
                                                onClick={() => handleDeleteThietBi(tb.thietbi_id)}
                                                title={`Xóa ${tb.tenThietBi}`}
                                            >
                                                <FaTrash size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                    {/* Hàng bảng con - Chỉ hiển thị nếu có chi tiết và đang mở rộng */}
                                    {expandedRows.includes(tb.thietbi_id) && tb.chiTiet && tb.chiTiet.length > 0 && (
                                        <tr className="bg-gray-50">
                                            <td colSpan="7" className="p-0 border">
                                                <div className="p-2 bg-gray-100">
                                                    <table className="w-full border">
                                                        <thead>
                                                            <tr className="bg-gray-300">
                                                                <th className="px-3 py-1 text-xs border-b">STT</th>
                                                                <th className="px-3 py-1 text-xs border-b">Mã định danh</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {tb.chiTiet.map((detail, index) => (
                                                                <tr key={detail.tttb_id || index} className="text-center bg-white hover:bg-gray-50">
                                                                    <td className="p-1 border">{index + 1}</td>
                                                                    <td className="p-1 border">{detail.tttb_id || 'N/A'}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Input chọn file chứng từ */}
                <div className="pt-2">
                    <label className="block font-medium">Chứng Từ Kèm Theo <span className="text-red-500">*</span> (Tối đa 5 file):</label>
                    <input
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" // Giới hạn loại file
                        onChange={handleFileChange}
                        ref={fileInputRef} // Gán ref
                        className="w-full p-2 border rounded file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {/* Hiển thị danh sách file đã chọn */}
                    {selectedFiles.length > 0 && (
                        <div className="mt-2 space-y-1">
                            <p className="text-sm font-medium">File đã chọn:</p>
                            <ul className="pl-5 list-disc">
                                {selectedFiles.map((file, index) => (
                                    <li key={index} className="flex items-center justify-between text-sm">
                                        <span className="truncate"><FaPaperclip className="flex-shrink-0 inline mr-1" />{file.name}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveFile(file.name)}
                                            className="flex-shrink-0 ml-2 text-red-500 hover:text-red-700"
                                            title="Xóa file"
                                        >
                                            <FaTrash size={12} />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

            </form>

            {/* Footer với các nút hành động */}
            <div className="p-4 mt-auto border-t bg-gray-50">
                <div className="grid grid-cols-2 gap-4">
                    {/* Nút thêm tb */}
                    <button
                        type="button"
                        onClick={() => setShowPhieuNhap(true)}
                        className="w-full px-4 py-2 text-white bg-gray-600 rounded hover:bg-gray-900"
                    >
                        Thêm Thiết Bị
                    </button>
                    {/* Nút Lưu Ghi Nhập */}
                    <button
                        type="submit"
                        form="nhapForm"
                        className="inline-flex items-center justify-center w-full px-4 py-2 text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-70 disabled:cursor-not-allowed"
                        disabled={thietBiNhap.length === 0 || selectedFiles.length === 0 || isSaving}
                    >
                        {isSaving ? (
                            <>
                                <FaSpinner className="w-4 h-4 mr-2 -ml-1 animate-spin" />
                                Đang xử lý...
                            </>
                        ) : (
                            'Lưu Ghi Nhập' // Text bình thường
                        )}
                    </button>
                </div>
            </div>

            {/* Modal FormPhieuNhap */}
            {showPhieuNhap && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <FormPhieuNhap onClose={() => setShowPhieuNhap(false)} onAddThietBi={handleAddThietBi} />
                </div>
            )}
        </div>
    );
};

export default FormNhap;
