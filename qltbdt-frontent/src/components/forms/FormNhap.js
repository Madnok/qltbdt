import { useState, useEffect } from "react";
import axios from "axios";
import FormPhieuNhap from "./FormPhieuNhap";
import { useFormattedPrice } from "../../utils/helpers";
import { FaTrash, FaChevronDown, FaChevronUp } from "react-icons/fa";

const FormNhap = ({ onClose, refreshData }) => {
    const [showPhieuNhap, setShowPhieuNhap] = useState(false);
    const formatPrice = useFormattedPrice();
    const [phieuNhapId] = useState(null);
    const [thietBiNhap, setThietBiNhap] = useState([]);
    const [nguoiTao, setNguoiTao] = useState("");
    const [ngayTao, setNgayTao] = useState("");
    const [truongHopNhap, setTruongHopNhap] = useState("muaMoi");


    // useEffect đầu tiên chỉ lấy thông tin người tạo và ngày
    useEffect(() => {
        // Lấy ngày tạo theo GMT+7
        const now = new Date();
        const vietnamTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
        const formattedDate = vietnamTime.toISOString().slice(0, 16).replace("T", " ");
        setNgayTao(formattedDate);

        // Lấy họ tên người tạo
        axios.get("http://localhost:5000/api/nhap/user/1", { withCredentials: true })
            .then((res) => setNguoiTao(res.data.hoTen))
            .catch((error) => console.error("Lỗi lấy thông tin người tạo:", error));
    }, []);

    // useEffect thứ hai theo dõi phieuNhapId để lấy danh sách thiết bị
    useEffect(() => {
        if (!phieuNhapId) return;

        axios.get(`http://localhost:5000/api/nhap/${phieuNhapId}/thongtinthietbi`, { withCredentials: true })
            .then((res) => {
                console.log("Thiết bị trong phiếu nhập:", res.data);
                setThietBiNhap(res.data);
            })
            .catch((error) => console.error("Lỗi lấy danh sách thiết bị:", error));
    }, [phieuNhapId]);

    // xử lý bảng dữ liệu 
    const [expandedRows, setExpandedRows] = useState([]);

    const toggleRow = (tttb_id) => {
        if (expandedRows.includes(tttb_id)) {
            setExpandedRows(expandedRows.filter((rowId) => rowId !== tttb_id));
        } else {
            setExpandedRows([...expandedRows, tttb_id]);
        }
    };

    const groupedData = thietBiNhap.reduce((acc, item) => {
        const existing = acc.find((tb) => tb.thietbi_id === item.thietbi_id);
        if (existing) {
            existing.tongTien += item.donGia * item.soLuong;
            existing.soLuong += item.soLuong;
            existing.chiTiet.push(...item.chiTiet); // Kết hợp danh sách chiTiet
        } else {
            acc.push({
                tttb_id: item.tttb_id,
                thietbi_id: item.thietbi_id,
                tenThietBi: item.tenThietBi,
                thoiGianBaoHanh: item.thoiGianBaoHanh,
                donGia: item.donGia,
                soLuong: item.soLuong,
                tongTien: item.donGia * item.soLuong,
                chiTiet: item.chiTiet || [], // Khởi tạo danh sách chi tiết nếu chưa có
            });
        }
        return acc;
    }, []);


    const handleAddThietBi = (newThietBi) => {
        setThietBiNhap((prev) => {
            const existingIndex = prev.findIndex(
                (tb) =>
                    tb.thietbi_id === newThietBi.thietbi_id &&
                    tb.tenThietBi === newThietBi.tenThietBi &&
                    tb.thoiGianBaoHanh === newThietBi.thoiGianBaoHanh
            );

            if (existingIndex !== -1) {
                const updatedList = [...prev];
                updatedList[existingIndex] = {
                    ...updatedList[existingIndex],
                    soLuong: updatedList[existingIndex].soLuong + newThietBi.soLuong,
                    tongTien: updatedList[existingIndex].tongTien + (newThietBi.soLuong * newThietBi.donGia),
                    chiTiet: [
                        ...updatedList[existingIndex].chiTiet,
                        ...newThietBi.chiTiet, // Sử dụng danh sách chiTiet được truyền từ formPhieuNhap
                    ],
                };
                return updatedList;
            } else {
                return [...prev, newThietBi]; // Thêm thiết bị mới vào danh sách
            }
        });
    };

    const handleDeleteThietBi = (thietbi_id) => {
        setThietBiNhap((prev) => prev.filter((tb) => tb.thietbi_id !== thietbi_id));
    };


    const handleSubmit = async (e) => {
        e.preventDefault();

        if (thietBiNhap.length === 0 || !thietBiNhap.every((tb) => tb.chiTiet && tb.chiTiet.length > 0)) {
            alert("Danh sách thiết bị nhập không hợp lệ!");
            return;
        }

        if (!["muaMoi", "taiTro"].includes(truongHopNhap)) {
            alert("Trường hợp nhập không hợp lệ!");
            return;
        }


        const danhSachThietBi = thietBiNhap.map((tb) => ({
            thietbi_id: tb.thietbi_id,
            tenThietBi: tb.tenThietBi,
            thoiGianBaoHanh: tb.thoiGianBaoHanh,
            soLuong: tb.soLuong,
            chiTiet: tb.chiTiet.map((detail) => ({
                thietbi_id: detail.thietbi_id,
                tenThietBi: detail.tenThietBi,
                thoiGianBaoHanh: detail.thoiGianBaoHanh,
            })),
        }));

        try {
            const payload = {
                userId: 1, // Lấy từ context (Giả sử bạn có `user` từ useAuth)
                truongHopNhap,
                ngayTao,
                danhSachThietBi,
            };

            const config = {
                withCredentials: true
            };
    
            // Gọi axios.post với 3 tham số: url, data, config
            await axios.post("http://localhost:5000/api/nhap", payload, config);
    
            alert("Tạo phiếu nhập thành công!");
            refreshData(); 
            onClose(); 
    
        } catch (error) {
            console.error("Lỗi khi tạo phiếu nhập:", error.response || error.message);
            const errorMessage =
                error.response?.data?.error || 
                error.response?.data?.message || 
                "Đã xảy ra lỗi không xác định!";
            alert(`Lỗi khi tạo phiếu nhập: ${errorMessage}`);
        }
    };


    return (
        <div className="flex flex-col h-full bg-white border-l shadow-md">
            <div className="flex items-center justify-between p-2 bg-white border-b">
                <h2 className="text-lg font-semibold">Thêm Ghi Nhập</h2>
                <button className="w-10 h-10 rounded-full hover:bg-gray-300" onClick={onClose}>
                    <i className="text-lg text-black fas fa-times"></i>
                </button>
            </div>
            <form className="p-4 space-y-4" onSubmit={handleSubmit}>
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
                            className={`flex-1 p-2 rounded-y rounded-l ${truongHopNhap === "muaMoi" ? "bg-gray-800 text-white" : "bg-gray-200"}`}
                            onClick={() => setTruongHopNhap("muaMoi")}
                        >
                            Mua Mới
                        </button>
                        <button
                            type="button"
                            className={`flex-1 p-2 rounded-y rounded-r ${truongHopNhap === "taiTro" ? "bg-gray-800 text-white" : "bg-gray-200"}`}
                            onClick={() => setTruongHopNhap("taiTro")}
                        >
                            Được Tài Trợ
                        </button>
                    </div>
                </div>
            </form>

            <div className="p-4 overflow-auto">
                <h3 className="text-xl font-semibold">Danh Sách Thiết Bị</h3>
                <table className="w-full mt-2 border">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="px-4 py-2 border-b">Id Thiết Bị</th>
                            <th className="px-4 py-2 border-b">Tên</th>
                            <th className="px-4 py-2 border-b">Số Lượng</th>
                            <th className="grid-cols-2 px-4 py-2 text-sm border-b">Bảo Hành <span className="text-sm text-gray-500">(Tháng)</span></th>
                            <th className="px-4 py-2 border-b">Đơn Giá</th>
                            <th className="px-4 py-2 border-b">Tổng Tiền</th>
                            <th className="px-4 py-2 border-b">Chức Năng</th>
                        </tr>
                    </thead>
                    <tbody>
                        {groupedData.map((tb) => (
                            <>
                                {/* Hàng bảng cha */}
                                <tr key={tb.thietbi_id} className="text-center">
                                    <td className="p-2 border">{tb.thietbi_id}</td>
                                    <td className="p-2 border">
                                        <div className="flex items-center justify-between">
                                            {tb.tenThietBi}
                                            <button onClick={() => toggleRow(tb.thietbi_id)} className="ml-2">
                                                {expandedRows.includes(tb.thietbi_id) ? (
                                                    <FaChevronUp />
                                                ) : (
                                                    <FaChevronDown />
                                                )}
                                            </button>
                                        </div>
                                    </td>
                                    <td className="p-2 border">{tb.soLuong}</td>
                                    <td className="p-2 border">{tb.thoiGianBaoHanh}</td>
                                    <td className="p-2 border">{formatPrice(tb.donGia)}</td>
                                    <td class="p-2 border">{formatPrice(tb.soLuong * tb.donGia)}</td>
                                    <td className="p-2 border">
                                        <div className="flex justify-center space-x-2">
                                            <button
                                                className="px-1 py-1 text-white bg-red-500 rounded"
                                                onClick={() => handleDeleteThietBi(tb.thietbi_id)}
                                                title="Xóa thiết bị"
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                {/* Hàng bảng con */}
                                {expandedRows.includes(tb.thietbi_id) && (
                                    <tr className="bg-gray-100">
                                        <td colSpan="5" className="p-2 border">
                                            <table className="w-full border">
                                                <thead>
                                                    <tr className="bg-gray-300">
                                                        <th className="px-4 py-2 border-b">STT</th>
                                                        <th className="px-4 py-2 border-b">Mã định danh</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {tb.chiTiet.map((detail, index) => (
                                                        <tr key={detail.tttb_id} className="text-center bg-white">
                                                            <td className="p-2 border">{index + 1}</td>
                                                            <td className="p-2 border"><span className="text-sm text-gray-500">Mã định danh: </span>{detail.tttb_id}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </td>
                                    </tr>
                                )}
                            </>
                        ))}
                    </tbody>
                </table>
                <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => setShowPhieuNhap(true)} className="px-4 py-2 mt-2 text-white bg-blue-500 rounded">
                        Thêm Thiết Bị
                    </button>
                    <button type="submit" className="px-4 py-2 mt-2 text-white bg-green-500 rounded" onClick={(handleSubmit)}>
                        Lưu Ghi Nhập
                    </button>
                </div>
                {showPhieuNhap && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                        <FormPhieuNhap onClose={() => setShowPhieuNhap(false)} onAddThietBi={handleAddThietBi} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default FormNhap;
