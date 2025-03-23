import { useState, useEffect } from "react";
import axios from "axios";
import FormPhieuNhap from "./FormPhieuNhap";
import { useFormattedPrice } from "../../utils/helpers";

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
        axios.get("http://localhost:5000/api/nhap/user/1")
            .then((res) => setNguoiTao(res.data.hoTen))
            .catch((error) => console.error("Lỗi lấy thông tin người tạo:", error));
    }, []);

    // useEffect thứ hai theo dõi phieuNhapId để lấy danh sách thiết bị
    useEffect(() => {
        if (!phieuNhapId) return;

        axios.get(`http://localhost:5000/api/nhap/${phieuNhapId}/thongtinthietbi`)
            .then((res) => {
                console.log("Thiết bị trong phiếu nhập:", res.data);
                setThietBiNhap(res.data);
            })
            .catch((error) => console.error("Lỗi lấy danh sách thiết bị:", error));
    }, [phieuNhapId]);

    const handleAddThietBi = (newThietBi) => {
        setThietBiNhap((prev) => {
            const existingIndex = prev.findIndex(
                (tb) =>
                    tb.thietbi_id === newThietBi.thietbi_id &&
                    tb.tenThietBi === newThietBi.tenThietBi &&
                    tb.thoiGianBaoHanh === newThietBi.thoiGianBaoHanh
            );
    
            if (existingIndex !== -1) {
                // Nếu thiết bị đã tồn tại với cùng ID, tên và thời gian bảo hành => Cộng dồn số lượng
                const updatedList = [...prev];
                updatedList[existingIndex] = {
                    ...updatedList[existingIndex],
                    soLuong: updatedList[existingIndex].soLuong + newThietBi.soLuong,
                };
                return updatedList;
            } else {
                // Nếu thiết bị khác ID hoặc khác tên hoặc khác thời gian bảo hành => Thêm mới
                return [...prev, newThietBi];
            }
        });
    
        console.log("Danh sách thiết bị sau khi thêm:", thietBiNhap);
    };

    const handleDeleteThietBi = (thietbi_id) => {
        setThietBiNhap((prev) => prev.filter((tb) => tb.thietbi_id !== thietbi_id));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (thietBiNhap.length === 0) {
            alert("Chưa có thiết bị nào để nhập!");
            return;
        }

        const data = {
            userId: 1, // Giả sử user ID là 1 (có thể thay bằng user đăng nhập)
            truongHopNhap,
            ngayTao,
            danhSachThietBi: thietBiNhap, // Gửi luôn danh sách thiết bị nhập
        };

        try {
            await axios.post("http://localhost:5000/api/nhap", data);
            alert("Tạo phiếu nhập thành công!");
            refreshData();
            onClose();
        } catch (error) {
            console.error("Lỗi:", error);
            alert("Lỗi khi tạo phiếu nhập!");
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
                            <th className="px-4 py-2 border-b">ID</th>
                            <th className="px-4 py-2 border-b">Tên Thiết Bị</th>
                            <th className="px-4 py-2 border-b">Số Lượng</th>
                            <th className="px-4 py-2 border-b text-sm grid-cols-2">Bảo Hành <span className="text-sm text-gray-500">(Tháng)</span></th>
                            <th className="px-4 py-2 border-b">Đơn Giá</th>
                            <th className="px-4 py-2 border-b">Tổng Tiền</th>
                            <th className="px-4 py-2 border-b"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {thietBiNhap.map((tb, index) => (
                            <tr key={index} className="text-center">
                                <td className="p-2 border">{tb.thietbi_id}</td>
                                <td className="p-2 border">{tb.tenThietBi}</td>
                                <td className="p-2 border">{tb.soLuong}</td>
                                <td className="p-2 border">{tb.thoiGianBaoHanh}</td>
                                <td className="p-2 border">{formatPrice(tb.donGia)}</td>
                                <td class="p-2 border">{formatPrice(tb.soLuong * tb.donGia)}</td>
                                <td className="p-2 border">
                                    <button
                                        className="px-3 py-1 text-white bg-red-500 rounded"
                                        onClick={() => handleDeleteThietBi(tb.thietbi_id)}
                                    >
                                        Xóa
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="space-x-2">
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
