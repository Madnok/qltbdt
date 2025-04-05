// src/components/forms/FormPhong.js
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { maxTangTheoToa, toaTheoCoSo } from "../../utils/constants";
import { BsTrash } from "react-icons/bs";
import {
    fetchPhongList,
    fetchTheLoaiList,
    fetchThietBiConLai,
    fetchThongTinThietBiChuaPhanBo,
    addPhongAPI,
    addThietBiToPhongAPI
} from "../../api";

const FormPhong = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState("themPhong");
    const [formData, setFormData] = useState({
        coSo: "", toa: "", tang: "", soPhong: "", chucNang: "",
    });
    const [selectedTheLoai, setSelectedTheLoai] = useState("");
    const [selectedThietBi, setSelectedThietBi] = useState(null); // Khởi tạo là null
    const [selectedPhong, setSelectedPhong] = useState("");
    const [thietBiTrongPhong, setThietBiTrongPhong] = useState([]); // Danh sách chờ

    const queryClient = useQueryClient();

    // --- Fetch dữ liệu bằng useQuery ---
    const { data: phongListData = [] } = useQuery({
        queryKey: ['phongList'],
        queryFn: fetchPhongList
    });

    const { data: theLoaiListData = [] } = useQuery({
        queryKey: ['theLoaiList'],
        queryFn: fetchTheLoaiList
    });

    // Query cho thiết bị còn lại, sẽ refetch khi invalidate
    const { data: dsThietBiData = [], isLoading: isLoadingStock } = useQuery({
        queryKey: ['thietBiConLai'],
        queryFn: fetchThietBiConLai,
    });

    // Lọc danh sách thiết bị dựa trên thể loại được chọn và dữ liệu từ query
    const filteredDsThietBi = dsThietBiData.filter(tb =>
       selectedTheLoai ? tb.theloai_id === parseInt(selectedTheLoai) : true
    );

    // --- Mutations ---
    const addPhongMutation = useMutation({
        mutationFn: addPhongAPI,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['phong'] });
            queryClient.invalidateQueries({ queryKey: ['phongList'] });
            alert("Thêm phòng thành công!");
            handleReset();
        },
        onError: (error) => {
            console.error("Lỗi thêm phòng:", error.response?.data || error.message);
            alert(`Thêm phòng thất bại: ${error.response?.data?.error || error.message}`);
        }
    });

    const addThietBiMutation = useMutation({
        mutationFn: addThietBiToPhongAPI,
        onSuccess: (data) => {
             alert(data.message || "Lưu thiết bị vào phòng thành công!");
             setThietBiTrongPhong([]);
             setSelectedPhong("");
             setSelectedTheLoai("");
             setSelectedThietBi(null); // Reset về null
             // Invalidate các query liên quan
             // Sử dụng queryClient.setQueryData nếu muốn cập nhật cache ngay lập tức thay vì invalidate
             queryClient.invalidateQueries({ queryKey: ['phong', parseInt(selectedPhong), 'thietbi'] });
             queryClient.invalidateQueries({ queryKey: ['phong'] });
             queryClient.invalidateQueries({ queryKey: ['thietBiConLai'] });
             // không cần refetchDsThietBi vì invalidateQueries sẽ kích hoạt
        },
        onError: (error) => {
             console.error("Lỗi khi lưu thiết bị vào phòng:", error);
             alert(`Lưu thất bại! Lỗi: ${error.response?.data?.error || error.message}`);
        }
     });

    // --- Handlers ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        let updatedFormData = { ...formData, [name]: value };
        if (name === "toa") updatedFormData.tang = "";
        if (name === "tang") updatedFormData.soPhong = "";
        setFormData(updatedFormData);
    };

    const handleSubmitPhong = (e) => {
        e.preventDefault();
        if (!formData.coSo || !formData.toa || !formData.tang || !formData.soPhong || !formData.chucNang) {
            alert("Vui lòng nhập đầy đủ thông tin phòng!");
            return;
        }
        addPhongMutation.mutate(formData);
    };

    const handleReset = () => {
        setFormData({ coSo: "", toa: "", tang: "", soPhong: "", chucNang: "" });
    };

    const handleThietBiChange = (e) => {
        const thietBiId = parseInt(e.target.value);
        const thietBi = dsThietBiData.find(tb => tb.id === thietBiId);
        setSelectedThietBi(thietBi || null); // Set về null nếu không tìm thấy
    };

    const handleAddThietBiToTable = () => {
        const selectedPhongDetails = phongListData.find(p => p.id === parseInt(selectedPhong, 10));
        // selectedThietBi đã là object hoặc null từ state
        if (!selectedPhongDetails || !selectedThietBi) return alert("Vui lòng chọn phòng và thiết bị.");

        const stockAvailable = selectedThietBi.remainingStock || 0;
        const existingIndex = thietBiTrongPhong.findIndex(item => item.thietbi_id === selectedThietBi.id);
        const currentInTable = existingIndex !== -1 ? thietBiTrongPhong[existingIndex].soLuong : 0;

        if (currentInTable >= stockAvailable) {
            alert(`Đã thêm tối đa số lượng tồn kho (${stockAvailable}) cho thiết bị này.`);
            return;
        }

        if (existingIndex !== -1) {
            const updatedList = [...thietBiTrongPhong];
            updatedList[existingIndex].soLuong += 1;
            setThietBiTrongPhong(updatedList);
        } else {
            const newEntry = {
                phong: selectedPhongDetails.phong,
                phong_id: selectedPhongDetails.id,
                thietbi_id: selectedThietBi.id,
                ten: selectedThietBi.tenThietBi,
                soLuong: 1,
            };
            setThietBiTrongPhong([...thietBiTrongPhong, newEntry]);
        }
    };

    const handleDeleteFromTable = (index) => {
        const updatedList = thietBiTrongPhong.filter((_, i) => i !== index);
        setThietBiTrongPhong(updatedList);
    };

    const handleInputChangeTable = (e, index) => {
        const newSoLuong = parseInt(e.target.value) || 0;
        const currentItem = thietBiTrongPhong[index];
        const thietBiDetails = dsThietBiData.find(tb => tb.id === currentItem.thietbi_id);
        const stockAvailable = thietBiDetails?.remainingStock || 0;

        if (newSoLuong > stockAvailable) {
            alert(`Số lượng (${newSoLuong}) vượt quá tồn kho còn lại (${stockAvailable})!`);
            e.target.value = currentItem.soLuong;
            return;
        }

        if (newSoLuong <= 0) {
            handleDeleteFromTable(index);
            return;
        }

        const updatedList = thietBiTrongPhong.map((item, i) =>
            i === index ? { ...item, soLuong: newSoLuong } : item
        );
        setThietBiTrongPhong(updatedList);
    };

     const handleSaveThietBi = async () => {
         if (!selectedPhong || thietBiTrongPhong.length === 0) {
             alert("Vui lòng chọn phòng và thêm ít nhất một thiết bị vào bảng chờ!");
             return;
         }

        const finalPayload = [];
        let hasError = false; // Cờ để dừng nếu có lỗi

        for (const itemInTable of thietBiTrongPhong) {
            if (hasError) break; // Dừng nếu vòng lặp trước đó báo lỗi
             try {
                 // Dùng fetchQuery để lấy dữ liệu mới nhất hoặc từ cache nếu còn fresh
                 const unassignedDevices = await queryClient.fetchQuery({
                     queryKey: ['thongTinThietBiChuaPhanBo', itemInTable.thietbi_id],
                     queryFn: () => fetchThongTinThietBiChuaPhanBo(itemInTable.thietbi_id),
                     staleTime: 0 // Luôn fetch mới khi cần lưu
                 });

                 if (!Array.isArray(unassignedDevices)) throw new Error('Dữ liệu thiết bị chưa phân bổ không hợp lệ');

                 if (itemInTable.soLuong > unassignedDevices.length) {
                     throw new Error(`Số lượng yêu cầu (${itemInTable.soLuong}) cho "${itemInTable.ten}" vượt quá số lượng có sẵn (${unassignedDevices.length}). Việc thêm thiết bị có thể đã xảy ra ở tab khác.`);
                 }

                 const selectedTttbIds = unassignedDevices.slice(0, itemInTable.soLuong).map(d => d.id);

                 selectedTttbIds.forEach(tttbId => {
                     finalPayload.push({
                         phong_id: parseInt(selectedPhong),
                         thietbi_id: itemInTable.thietbi_id,
                         thongtinthietbi_id: tttbId
                     });
                 });

             } catch (error) {
                 console.error(`Lỗi khi xử lý thiết bị "${itemInTable.ten}":`, error);
                 alert(`Đã xảy ra lỗi khi chuẩn bị dữ liệu cho thiết bị "${itemInTable.ten}". ${error.message}`);
                 hasError = true; // Đặt cờ lỗi
             }
         }

         // Chỉ gọi mutation nếu không có lỗi xảy ra trong quá trình chuẩn bị payload
         if (!hasError && finalPayload.length > 0) {
            addThietBiMutation.mutate(finalPayload);
         } else if (!hasError && finalPayload.length === 0){
             alert("Không có dữ liệu hợp lệ để lưu (có thể do lỗi hoặc danh sách chờ rỗng).");
         }
     };

     // Tính toán trạng thái disable cho nút "Thêm vào danh sách chờ"
     const currentDeviceInStock = dsThietBiData.find(tb => tb.id === selectedThietBi?.id);
     const stockAvailable = currentDeviceInStock?.remainingStock || 0;
     const alreadyInWaitingList = thietBiTrongPhong.find(item => item.thietbi_id === selectedThietBi?.id)?.soLuong || 0;
     const canAddToWaitingList = stockAvailable > alreadyInWaitingList;

    return (
         <div className="flex flex-col h-full bg-white border-l shadow-md">
             {/* Header và Tabs */}
              <div className="flex items-center justify-between p-4 bg-white border-b">
                <h2 className="text-lg font-semibold">Các Chức Năng Của Phòng</h2>
                <div className="flex space-x-4">
                    <button className="flex items-center justify-center w-10 h-10 transition rounded-full hover:bg-gray-300" onClick={onClose}>
                        <i className="text-lg text-black fas fa-times"></i>
                    </button>
                </div>
            </div>
             <div className="flex items-center bg-white">
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

            {/* Form Thêm Phòng */}
            {activeTab === "themPhong" && (
                 <form onSubmit={handleSubmitPhong} className="grid grid-cols-2 gap-2 p-2 mb-2 space-2">
                    {/* Inputs */}
                     <div>
                        <label className="block font-medium">Cơ Sở</label>
                        <select name="coSo" value={formData.coSo} onChange={handleChange} className="w-full p-1 mt-1 border rounded">
                            <option value="">Chọn cơ sở</option>
                            <option value="Chính">Chính</option>
                            <option value="Phụ">Phụ</option>
                        </select>
                    </div>
                    <div>
                        <label className="block font-medium">Tòa</label>
                        <select name="toa" value={formData.toa} onChange={handleChange} className="w-full p-1 mt-1 border rounded"
                            disabled={!formData.coSo}>
                            <option value="">Chọn tòa</option>
                            {formData.coSo && toaTheoCoSo[formData.coSo]?.map(toa => (
                                <option key={toa} value={toa}>{toa}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block font-medium">Tầng</label>
                        <select name="tang" value={formData.tang} onChange={handleChange} className="w-full p-1 mt-1 border rounded"
                            disabled={!formData.toa}>
                            <option value="">Chọn tầng</option>
                            {formData.toa && Array.from({ length: maxTangTheoToa[formData.toa] || 0 }, (_, i) => (
                                <option key={i + 1} value={i + 1}>{i + 1}</option>
                            ))}
                        </select>
                    </div>
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
                    <div className="col-span-2">
                        <label className="block font-medium">Chức Năng</label>
                        <input type="text" name="chucNang" value={formData.chucNang} onChange={handleChange} className="w-full p-1 mt-1 border rounded" />
                    </div>
                    {/* Buttons */}
                    <button
                        type="submit"
                        disabled={addPhongMutation.isPending}
                        className="w-full p-1 text-sm text-white bg-green-500 border rounded disabled:opacity-50"
                    >
                        {addPhongMutation.isPending ? 'Đang lưu...' : 'Lưu Phòng'}
                    </button>
                    <button
                        type="button"
                        className="w-full text-sm bg-gray-300 border rounded disabled:opacity-50"
                        onClick={handleReset}
                        disabled={addPhongMutation.isPending}
                    >
                        Xóa Trắng
                    </button>
                </form>
            )}

            {/* Form Thêm Thiết Bị Vào Phòng */}
             {activeTab === "themThietBi" && (
                <div className="p-4 bg-white border-t-2">
                    <div className="grid grid-cols-3 gap-2 pb-4">
                         {/* Dropdown chọn Phòng */}
                         <select
                            name="phong_id"
                            value={selectedPhong}
                            onChange={(e) => setSelectedPhong(e.target.value)}
                            className="w-full p-1 border rounded-lg"
                        >
                            <option value="">Chọn Phòng</option>
                            {phongListData.map(p => (
                                <option key={p.id} value={p.id}>{p.phong}</option>
                            ))}
                        </select>
                         {/* Dropdown chọn Thể loại */}
                         <select value={selectedTheLoai}
                            className="w-full p-1 border rounded-lg"
                            disabled={!selectedPhong}
                            onChange={(e) => { setSelectedTheLoai(e.target.value); setSelectedThietBi(null); }} // Reset thiết bị
                        >
                            <option value="">Chọn Thể loại</option>
                            {theLoaiListData.map(tl => (
                                <option key={tl.id} value={tl.id}>{tl.theLoai}</option>
                            ))}
                        </select>
                         {/* Dropdown chọn Thiết bị */}
                         <select
                            name="thietbi"
                            value={selectedThietBi?.id || ""}
                            onChange={handleThietBiChange}
                            className="w-full p-1 border rounded-lg"
                            disabled={!selectedTheLoai || isLoadingStock} // Disable khi đang load stock
                        >
                            <option value="">{isLoadingStock ? "Đang tải..." : "Chọn Thiết bị"}</option>
                            {filteredDsThietBi.map(tb => (
                                <option key={tb.id} value={tb.id} disabled={tb.remainingStock <= 0}>
                                    {tb.tenThietBi} (Còn: {tb.remainingStock || 0})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="grid items-center grid-cols-2 gap-2 pb-4">
                         <button
                            onClick={handleSaveThietBi}
                            disabled={addThietBiMutation.isPending || thietBiTrongPhong.length === 0 || isLoadingStock}
                            className="w-full p-1 text-sm text-white transition-colors bg-green-500 border rounded hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {addThietBiMutation.isPending ? 'Đang lưu...' : 'Lưu Thiết Bị vào Phòng'}
                        </button>
                         <button
                            onClick={handleAddThietBiToTable}
                            disabled={!selectedThietBi || !canAddToWaitingList || isLoadingStock || addThietBiMutation.isPending} // Thêm disable khi đang lưu
                            className={`w-full p-1 text-sm text-white transition-colors bg-blue-500 hover:bg-blue-600 rounded disabled:bg-gray-400 disabled:cursor-not-allowed`}
                        >
                            Thêm vào danh sách chờ
                        </button>
                    </div>

                    {/* Bảng danh sách chờ */}
                     <table className="w-full border border-gray-300 table-auto">
                        <thead className="bg-gray-100">
                            <tr>
                                {/* <th className="px-4 py-1 border">Phòng</th> */}
                                <th className="px-4 py-1 border">Tên Thiết Bị</th>
                                <th className="px-4 py-1 border">Số Lượng</th>
                                <th className="px-4 py-1 border">Xóa</th>
                            </tr>
                        </thead>
                        <tbody>
                            {thietBiTrongPhong.map((item, index) => (
                                <tr key={`${item.thietbi_id}-${index}`}>
                                    {/* <td className="px-4 py-1 text-center border">{item.phong}</td> */}
                                    <td className="px-4 py-1 text-center border">{item.ten}</td>
                                    <td className="px-4 py-1 text-center border">
                                        <input
                                            type="number"
                                            value={item.soLuong}
                                            onChange={(e) => handleInputChangeTable(e, index)}
                                            className="w-16 p-1 text-center border rounded"
                                            min="1"
                                            // Max động dựa trên tồn kho
                                            max={dsThietBiData.find(tb => tb.id === item.thietbi_id)?.remainingStock + thietBiTrongPhong.find(i => i.thietbi_id === item.thietbi_id)?.soLuong - item.soLuong + item.soLuong}
                                        />
                                    </td>
                                    <td className="px-4 py-1 text-center border">
                                        <button
                                            onClick={() => handleDeleteFromTable(index)}
                                            className="px-2 py-1 text-white bg-red-500 rounded"
                                            disabled={addThietBiMutation.isPending} // Disable khi đang lưu
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