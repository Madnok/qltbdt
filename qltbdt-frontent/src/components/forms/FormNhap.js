// import React, { useState, useEffect, useRef } from "react";
// import axios from "axios";
// import FormPhieuNhap from "./FormPhieuNhap";
// import { useFormattedPrice } from "../../utils/helpers";
// import { FaChevronDown, FaChevronUp, FaTrash, FaPaperclip, FaSpinner } from "react-icons/fa";
// import { uploadChungTuNhap } from "../../api";
// import { toast } from 'react-toastify';

// const FormNhap = ({ onClose, refreshData }) => {
//     const [showPhieuNhap, setShowPhieuNhap] = useState(false);
//     const formatPrice = useFormattedPrice();
//     const [phieuNhapId] = useState(null); // Giữ lại nếu bạn có logic dùng ID này sau này, nếu không có thể xóa
//     const [thietBiNhap, setThietBiNhap] = useState([]);
//     const [nguoiTao, setNguoiTao] = useState("");
//     const [ngayTao, setNgayTao] = useState("");
//     const [truongHopNhap, setTruongHopNhap] = useState("muaMoi");
//     const [selectedFiles, setSelectedFiles] = useState([]); // State cho file chứng từ
//     const fileInputRef = useRef(null); // Ref cho input file
//     const [isSaving, setIsSaving] = useState(false); // State cho việc lưu đơn nhập


//     useEffect(() => {
//         // Lấy ngày tạo theo GMT+7
//         const now = new Date();
//         const vietnamTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
//         const formattedDate = vietnamTime.toISOString().slice(0, 16).replace("T", " ");
//         setNgayTao(formattedDate);

//         const userId = 1;
//         axios.get(`${process.env.REACT_APP_API_URL}/nhap/user/${userId}`, { withCredentials: true })
//             .then((res) => setNguoiTao(res.data.hoTen))
//             .catch((error) => console.error("Lỗi lấy thông tin người tạo:", error));
//     }, []);

//     // useEffect thứ hai theo dõi phieuNhapId để lấy danh sách thiết bị (Có thể không cần thiết nếu form này chỉ để tạo mới)
//     useEffect(() => {
//         if (!phieuNhapId) return; // Nếu không có ID phiếu nhập (ví dụ khi tạo mới) thì không làm gì

//         axios.get(`${process.env.REACT_APP_API_URL}/nhap/${phieuNhapId}/thongtinthietbi`, { withCredentials: true })
//             .then((res) => {
//                 console.log("Thiết bị trong phiếu nhập:", res.data);
//                 setThietBiNhap(res.data);
//             })
//             .catch((error) => console.error("Lỗi lấy danh sách thiết bị:", error));
//     }, [phieuNhapId]);

//     // xử lý bảng dữ liệu
//     const [expandedRows, setExpandedRows] = useState([]);

//     const toggleRow = (thietbi_id) => { // Nên dùng thietbi_id làm key duy nhất cho group
//         if (expandedRows.includes(thietbi_id)) {
//             setExpandedRows(expandedRows.filter((rowId) => rowId !== thietbi_id));
//         } else {
//             setExpandedRows([...expandedRows, thietbi_id]);
//         }
//     };

//     // Gom nhóm dữ liệu để hiển thị trong bảng chính
//     const groupedData = thietBiNhap.reduce((acc, item) => {
//         const existing = acc.find((tb) => tb.thietbi_id === item.thietbi_id);
//         if (existing) {
//             // Cập nhật số lượng và tổng tiền
//             existing.soLuong += item.soLuong;
//             existing.tongTien += item.donGia * item.soLuong;
//             // Thêm chi tiết vào danh sách chi tiết của nhóm đã có
//             existing.chiTiet.push(...(item.chiTiet || [])); // Đảm bảo item.chiTiet là mảng
//         } else {
//             // Thêm nhóm mới
//             acc.push({
//                 // Không cần tttb_id ở đây vì đây là group
//                 thietbi_id: item.thietbi_id,
//                 tenThietBi: item.tenThietBi,
//                 thoiGianBaoHanh: item.thoiGianBaoHanh,
//                 donGia: item.donGia,
//                 soLuong: item.soLuong,
//                 tongTien: item.donGia * item.soLuong,
//                 chiTiet: item.chiTiet || [], // Khởi tạo danh sách chi tiết
//             });
//         }
//         return acc;
//     }, []);


//     const handleAddThietBi = (newThietBi) => {
//         // newThietBi nên chứa: thietbi_id, tenThietBi, thoiGianBaoHanh, soLuong, donGia, chiTiet (là mảng các object { tttb_id })
//         setThietBiNhap((prev) => [...prev, newThietBi]); // Chỉ cần thêm vào danh sách phẳng
//     };

//     const handleDeleteThietBi = (thietbi_id_to_delete) => {
//         // Xóa tất cả các mục có thietbi_id này khỏi danh sách phẳng
//         setThietBiNhap((prev) => prev.filter((tb) => tb.thietbi_id !== thietbi_id_to_delete));
//         // Đóng hàng con nếu đang mở
//         setExpandedRows(prev => prev.filter(rowId => rowId !== thietbi_id_to_delete));
//     };

//     const handleSubmit = async (e) => {
//         e.preventDefault();

//         // Kiểm tra danh sách thiết bị nhập
//         if (thietBiNhap.length === 0) {
//             toast.warn("Vui lòng thêm ít nhất một thiết bị vào phiếu nhập.");
//             return;
//         }

//         // Kiểm tra bắt buộc phải có chứng từ khi nhập
//         if (selectedFiles.length === 0) {
//             toast.warn("Vui lòng đính kèm ít nhất một file chứng từ.");
//             return;
//         }

//         if (!["muaMoi", "taiTro"].includes(truongHopNhap)) {
//             toast.warn("Trường hợp nhập không hợp lệ!");
//             return;
//         }

//         setIsSaving(true); // Đặt trạng thái đang lưu
//         toast.info("Đang xử lý lưu phiếu nhập...");

//         // Chuẩn bị payload cho API tạo phiếu nhập
//         const danhSachThietBiPayload = thietBiNhap.map((tb) => ({
//             thietbi_id: tb.thietbi_id,
//             tenThietBi: tb.tenThietBi,
//             thoiGianBaoHanh: tb.thoiGianBaoHanh,
//             soLuong: tb.soLuong,
//         }));

//         try {
//             const payload = {
//                 userId: 1,
//                 truongHopNhap,
//                 ngayTao,
//                 danhSachThietBi: danhSachThietBiPayload,
//             };

//             const config = {
//                 withCredentials: true
//             };

//             // --- Bước 1: Tạo phiếu nhập ---
//             console.log("Đang gửi payload tạo phiếu nhập:", payload);
//             const response = await axios.post(`${process.env.REACT_APP_API_URL}/nhap`, payload, config);
//             console.log("Response tạo phiếu nhập:", response);

//             const createdPhieuNhapId = response?.data?.phieunhapId;
//             if (!createdPhieuNhapId) {
//                 console.error("API tạo phiếu nhập không trả về phieunhapId:", response?.data);
//                 throw new Error("Không nhận được ID phiếu nhập sau khi tạo. Không thể upload chứng từ.");
//             }

//             // --- Bước 2: Upload chứng từ ---
//             console.log(`Đang upload ${selectedFiles.length} chứng từ cho phiếu nhập ID: ${createdPhieuNhapId}`);
//             const formData = new FormData();
//             selectedFiles.forEach(file => {
//                 formData.append('chungTuFiles', file);
//             });

//             try {
//                 await uploadChungTuNhap(createdPhieuNhapId, formData);
//                 console.log("Upload chứng từ thành công!");

//             } catch (uploadError) {

//                 console.error("Lỗi upload chứng từ:", uploadError);
//                 toast.error(`Lỗi upload chứng từ: ${uploadError.response?.data?.error || uploadError.message}`);
//                 throw uploadError;
//             }
//             toast.success("Lưu phiếu nhập thành công và upload chứng từ thành công!");
//             refreshData();
//             onClose();

//         } catch (error) {
//             console.error("Lỗi khi lưu phiếu nhập:", error);
//             const errorMessage = error.response?.data?.error || error.message || "Lỗi không xác định";
//             toast.error(`Lỗi lưu phiếu nhập: ${errorMessage}`);
//         } finally {
//             setIsSaving(false); // Luôn trả lại trạng thái không lưu
//         }
//     };

//     // Hàm xử lý khi chọn file
//     const handleFileChange = (event) => {
//         // Giới hạn số lượng file
//         const files = Array.from(event.target.files);
//         if (files.length > 5) {
//             alert("Chỉ được phép upload tối đa 5 file.");
//             // Reset input nếu vượt quá giới hạn
//             if (fileInputRef.current) {
//                 fileInputRef.current.value = "";
//             }
//             setSelectedFiles([]); // Xóa các file đã chọn nếu vượt quá
//             return;
//         }
//         setSelectedFiles(files); // Lưu danh sách file vào state
//     };

//     // Hàm xóa file đã chọn
//     const handleRemoveFile = (fileName) => {
//         setSelectedFiles(prevFiles => prevFiles.filter(file => file.name !== fileName));
//         if (fileInputRef.current) {
//             fileInputRef.current.value = "";
//         }
//     };

//     return (
//         <div className="flex flex-col h-full overflow-y-auto bg-white border-l shadow-md">
//             {/* Header */}
//             <div className="flex items-center justify-between p-2 bg-white border-b">
//                 <h2 className="text-lg font-semibold">Thêm Ghi Nhập</h2>
//                 <button className="w-10 h-10 rounded-full hover:bg-gray-300" onClick={onClose}>
//                     <i className="text-lg text-black fas fa-times"></i>
//                 </button>
//             </div>

//             {/* Form chính */}
//             {/* Gán ID cho form để nút submit bên ngoài có thể kích hoạt */}
//             <form id="nhapForm" className="flex-grow p-4 space-y-4 overflow-y-auto" onSubmit={handleSubmit}>
//                 <div>
//                     <label className="block font-medium">Người Tạo:</label>
//                     <input type="text" value={nguoiTao || "Đang tải..."} disabled className="w-full p-2 bg-gray-100 border rounded" />
//                 </div>

//                 <div>
//                     <label className="block font-medium">Ngày Tạo:</label>
//                     <input type="text" value={ngayTao || "Đang tải..."} disabled className="w-full p-2 bg-gray-100 border rounded" />
//                 </div>

//                 <div>
//                     <label className="block font-medium">Trường Hợp Nhập:</label>
//                     <div className="flex">
//                         <button
//                             type="button"
//                             className={`flex-1 p-2 rounded-l ${truongHopNhap === "muaMoi" ? "bg-gray-800 text-white" : "bg-gray-200"}`}
//                             onClick={() => setTruongHopNhap("muaMoi")}
//                         >
//                             Mua Mới
//                         </button>
//                         <button
//                             type="button"
//                             className={`flex-1 p-2 rounded-r ${truongHopNhap === "taiTro" ? "bg-gray-800 text-white" : "bg-gray-200"}`}
//                             onClick={() => setTruongHopNhap("taiTro")}
//                         >
//                             Được Tài Trợ
//                         </button>
//                     </div>
//                 </div>

//                 {/* Phần Danh sách thiết bị */}
//                 <div className="pt-4">
//                     <h3 className="text-xl font-semibold">Danh Sách Thiết Bị <span className="text-red-500">*</span></h3>
//                     <table className="w-full mt-2 border">
//                         <thead>
//                             <tr className="bg-gray-200">
//                                 <th className="px-4 py-2 border-b">Id Thiết Bị</th>
//                                 <th className="px-4 py-2 border-b">Tên</th>
//                                 <th className="px-4 py-2 border-b">Số Lượng</th>
//                                 <th className="px-4 py-2 text-sm border-b">Bảo Hành <span className="text-sm text-gray-500">(Tháng)</span></th>
//                                 <th className="px-4 py-2 border-b">Đơn Giá</th>
//                                 <th className="px-4 py-2 border-b">Tổng Tiền</th>
//                                 <th className="px-3 py-2 text-xs font-medium text-center text-gray-600 uppercase border-b">Xóa</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {groupedData.length === 0 && (
//                                 <tr>
//                                     <td colSpan="7" className="p-4 text-center text-gray-500 border">Chưa có thiết bị nào được thêm.</td>
//                                 </tr>
//                             )}
//                             {groupedData.map((tb) => (
//                                 <React.Fragment key={tb.thietbi_id}>
//                                     {/* Hàng bảng cha */}
//                                     <tr className="text-center hover:bg-gray-50">
//                                         <td className="p-2 border">{tb.thietbi_id}</td>
//                                         <td className="p-2 text-left border">
//                                             <div className="flex items-center justify-between">
//                                                 {tb.tenThietBi}
//                                                 {/* Chỉ hiển thị nút chevron nếu có chi tiết */}
//                                                 {tb.chiTiet && tb.chiTiet.length > 0 && (
//                                                     <button onClick={() => toggleRow(tb.thietbi_id)} type="button" className="ml-2 text-gray-500 hover:text-gray-700">
//                                                         {expandedRows.includes(tb.thietbi_id) ? (
//                                                             <FaChevronUp size={12} />
//                                                         ) : (
//                                                             <FaChevronDown size={12} />
//                                                         )}
//                                                     </button>
//                                                 )}
//                                             </div>
//                                         </td>
//                                         <td className="p-2 border">{tb.soLuong}</td>
//                                         <td className="p-2 border">{tb.thoiGianBaoHanh}</td>
//                                         <td className="p-2 border">{formatPrice(tb.donGia)}</td>
//                                         <td className="p-2 border">{formatPrice(tb.tongTien)}</td>
//                                         <td className="px-3 py-2 text-center border-b">
//                                             <button
//                                                 type="button"
//                                                 className="text-red-500 hover:text-red-700"
//                                                 onClick={() => handleDeleteThietBi(tb.thietbi_id)}
//                                                 title={`Xóa ${tb.tenThietBi}`}
//                                             >
//                                                 <FaTrash size={14} />
//                                             </button>
//                                         </td>
//                                     </tr>
//                                     {/* Hàng bảng con - Chỉ hiển thị nếu có chi tiết và đang mở rộng */}
//                                     {expandedRows.includes(tb.thietbi_id) && tb.chiTiet && tb.chiTiet.length > 0 && (
//                                         <tr className="bg-gray-50">
//                                             <td colSpan="7" className="p-0 border">
//                                                 <div className="p-2 bg-gray-100">
//                                                     <table className="w-full border">
//                                                         <thead>
//                                                             <tr className="bg-gray-300">
//                                                                 <th className="px-3 py-1 text-xs border-b">STT</th>
//                                                                 <th className="px-3 py-1 text-xs border-b">Mã định danh</th>
//                                                             </tr>
//                                                         </thead>
//                                                         <tbody>
//                                                             {tb.chiTiet.map((detail, index) => (
//                                                                 <tr key={detail.tttb_id || index} className="text-center bg-white hover:bg-gray-50">
//                                                                     <td className="p-1 border">{index + 1}</td>
//                                                                     <td className="p-1 border">{detail.tttb_id || 'N/A'}</td>
//                                                                 </tr>
//                                                             ))}
//                                                         </tbody>
//                                                     </table>
//                                                 </div>
//                                             </td>
//                                         </tr>
//                                     )}
//                                 </React.Fragment>
//                             ))}
//                         </tbody>
//                     </table>
//                 </div>

//                 {/* Input chọn file chứng từ */}
//                 <div className="pt-2">
//                     <label className="block font-medium">Chứng Từ Kèm Theo <span className="text-red-500">*</span> (Tối đa 5 file):</label>
//                     <input
//                         type="file"
//                         multiple
//                         accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" // Giới hạn loại file
//                         onChange={handleFileChange}
//                         ref={fileInputRef} // Gán ref
//                         className="w-full p-2 border rounded file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
//                     />
//                     {/* Hiển thị danh sách file đã chọn */}
//                     {selectedFiles.length > 0 && (
//                         <div className="mt-2 space-y-1">
//                             <p className="text-sm font-medium">File đã chọn:</p>
//                             <ul className="pl-5 list-disc">
//                                 {selectedFiles.map((file, index) => (
//                                     <li key={index} className="flex items-center justify-between text-sm">
//                                         <span className="truncate"><FaPaperclip className="flex-shrink-0 inline mr-1" />{file.name}</span>
//                                         <button
//                                             type="button"
//                                             onClick={() => handleRemoveFile(file.name)}
//                                             className="flex-shrink-0 ml-2 text-red-500 hover:text-red-700"
//                                             title="Xóa file"
//                                         >
//                                             <FaTrash size={12} />
//                                         </button>
//                                     </li>
//                                 ))}
//                             </ul>
//                         </div>
//                     )}
//                 </div>

//             </form>

//             {/* Footer với các nút hành động */}
//             <div className="p-4 mt-auto border-t bg-gray-50">
//                 <div className="grid grid-cols-2 gap-4">
//                     {/* Nút thêm tb */}
//                     <button
//                         type="button"
//                         onClick={() => setShowPhieuNhap(true)}
//                         className="w-full px-4 py-2 text-white bg-gray-600 rounded hover:bg-gray-900"
//                     >
//                         Thêm Thiết Bị
//                     </button>
//                     {/* Nút Lưu Ghi Nhập */}
//                     <button
//                         type="submit"
//                         form="nhapForm"
//                         className="inline-flex items-center justify-center w-full px-4 py-2 text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-70 disabled:cursor-not-allowed"
//                         disabled={thietBiNhap.length === 0 || selectedFiles.length === 0 || isSaving}
//                     >
//                         {isSaving ? (
//                             <>
//                                 <FaSpinner className="w-4 h-4 mr-2 -ml-1 animate-spin" />
//                                 Đang xử lý...
//                             </>
//                         ) : (
//                             'Lưu Ghi Nhập' // Text bình thường
//                         )}
//                     </button>
//                 </div>
//             </div>

//             {/* Modal FormPhieuNhap */}
//             {showPhieuNhap && (
//                 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
//                     <FormPhieuNhap onClose={() => setShowPhieuNhap(false)} onAddThietBi={handleAddThietBi} />
//                 </div>
//             )}
//         </div>
//     );
// };

// export default FormNhap;

import React, { useState, useMemo, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { fetchThietBiListForSelectAPI, createPhieuNhapWithDetailsAPI, uploadChungTuNhapAPI } from '../../api';
import { formatCurrency } from '../../utils/helpers';
import { FaTimes, FaSpinner, FaPaperclip, FaTrash, FaPlus } from 'react-icons/fa';

// Định nghĩa các lựa chọn cho trường hợp nhập
const TRUONG_HOP_NHAP_OPTIONS = [
    { value: '', label: '-- Chọn trường hợp nhập --', disabled: true },
    { value: 'taiTro', label: 'Tài trợ' },
    { value: 'muaMoi', label: 'Mua mới' },
];

const FormNhap = ({ onClose, refreshData }) => {

    // === State cho thông tin chung ===
    const [truongHopNhap, setTruongHopNhap] = useState('');
    const [ghiChu, setGhiChu] = useState('');
    const [selectedFiles, setSelectedFiles] = useState([]);
    const fileInputRef = useRef(null);

    // === State cho danh sách chi tiết thiết bị ===
    const [items, setItems] = useState([{ thietbi_id: '', soLuong: 1, giaTriBanDau: '', ngayMua: '', thoiGianBaoHanh: 12 }]);
    const [suggestedDonGia, setSuggestedDonGia] = useState({});

    // === State cho form và loading ===
    const [formError, setFormError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // --- Fetch danh sách Loại Thiết Bị ---
    const { data: thietBiOptions = [], isLoading: isLoadingThietBi } = useQuery({
        queryKey: ['thietBiListForSelect'],
        queryFn: fetchThietBiListForSelectAPI,
        staleTime: 5 * 60 * 1000,
        select: (data) => data?.data?.rows || data || [],
    });

    // Tạo Map đơn giá
    const thietBiDonGiaMap = useMemo(() => {
        const map = new Map();
        thietBiOptions.forEach(tb => {
            if (tb && tb.id !== undefined && tb.id !== null) {
                 map.set(tb.id.toString(), tb.donGia);
            }
        });
        return map;
    }, [thietBiOptions]);

    // --- Mutation Tạo Phiếu Nhập và Chi Tiết ---
    const createPhieuNhapMutation = useMutation({
        mutationFn: createPhieuNhapWithDetailsAPI, // <<< Gọi API gộp
        // onSuccess/onError xử lý trong handleSubmit
    });

    // --- Handlers cho chi tiết item ---
    const handleItemChange = (index, field, value) => {
         const newItems = [...items];
         newItems[index][field] = value;

         if (field === 'thietbi_id') {
             const selectedDonGia = thietBiDonGiaMap.get(value) ?? '';
             setSuggestedDonGia(prev => ({ ...prev, [index]: selectedDonGia }));
             newItems[index].giaTriBanDau = selectedDonGia; // Tự điền giá trị ban đầu
         }
         if (field === 'giaTriBanDau' && parseFloat(value) < 0) {
             newItems[index].giaTriBanDau = '0';
         }
         if ((field === 'soLuong' || field === 'thoiGianBaoHanh') && parseInt(value, 10) < 0 && value !== '') { // Cho phép 0 tháng BH
             newItems[index][field] = 0;
         } else if (field === 'soLuong' && parseInt(value, 10) < 1 && value !== '') {
             newItems[index][field] = 1; // Số lượng tối thiểu là 1
         }

         setItems(newItems);
         setFormError(''); // Xóa lỗi khi người dùng sửa
    };

    const handleAddItem = () => {
         setItems([...items, { thietbi_id: '', soLuong: 1, giaTriBanDau: '', ngayMua: '', thoiGianBaoHanh: 12 }]);
         setSuggestedDonGia(prev => ({ ...prev, [items.length]: '' }));
    };

    const handleRemoveItem = (index) => {
         const newItems = items.filter((_, i) => i !== index);
         setItems(newItems);
         // Cập nhật lại suggestedDonGia (có thể không cần thiết nếu không dùng lại index)
         const newSuggestedDonGia = {};
         newItems.forEach((item, i) => {
              // Tìm index cũ tương ứng hoặc đơn giản là lấy lại giá dựa trên item.thietbi_id
              newSuggestedDonGia[i] = thietBiDonGiaMap.get(item.thietbi_id) ?? '';
         });
         setSuggestedDonGia(newSuggestedDonGia);
    };

    // --- Handlers cho File Upload ---
    const handleFileChange = (event) => { /* ... (Giữ nguyên từ code trước) ... */
        const files = Array.from(event.target.files);
        if (files.length === 0) return;
        if ((selectedFiles?.length || 0) + files.length > 5) {
            toast.warn("Chỉ được phép có tối đa 5 chứng từ.");
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }
        // Kiểm tra type/size nếu cần
        setSelectedFiles(prev => [...prev, ...files].slice(0, 5));
        if (fileInputRef.current) fileInputRef.current.value = "";
    };
    const handleRemoveFile = (fileName) => {
        setSelectedFiles(prevFiles => prevFiles.filter(file => file.name !== fileName));
   };

    // --- Submit Form (Gộp Logic) ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');

        // === VALIDATION ===
        if (!truongHopNhap) return setFormError('Vui lòng chọn trường hợp nhập.');
        if (selectedFiles.length === 0) return setFormError('Vui lòng đính kèm ít nhất một chứng từ.');
        if (items.length === 0) return setFormError('Vui lòng thêm ít nhất một chi tiết thiết bị.');

        // Validate từng dòng chi tiết
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (!item.thietbi_id) return setFormError(`Vui lòng chọn Loại Thiết Bị cho dòng ${i + 1}.`);
            const soLuongNum = parseInt(item.soLuong, 10);
            if (isNaN(soLuongNum) || soLuongNum < 1) return setFormError(`Số lượng ở dòng ${i + 1} phải là số nguyên dương.`);
            if (item.giaTriBanDau === null || item.giaTriBanDau === undefined || item.giaTriBanDau === '') return setFormError(`Vui lòng nhập Giá trị ban đầu cho dòng ${i + 1}.`);
            const giaTriNum = parseFloat(item.giaTriBanDau);
            if (isNaN(giaTriNum) || giaTriNum < 0) return setFormError(`Giá trị ban đầu ở dòng ${i + 1} phải là số không âm.`);
            const thoiGianBHNum = parseInt(item.thoiGianBaoHanh, 10);
            if (isNaN(thoiGianBHNum) || thoiGianBHNum < 0) return setFormError(`Thời gian bảo hành ở dòng ${i + 1} phải là số không âm.`);

            // Chuẩn hóa dữ liệu trước khi gửi
            items[i].soLuong = soLuongNum;
            items[i].giaTriBanDau = giaTriNum;
            items[i].thoiGianBaoHanh = thoiGianBHNum;
            items[i].ngayMua = item.ngayMua || null;
        }

        // === Chuẩn bị Payload Gộp ===
        const payload = {
            truongHopNhap: truongHopNhap,
            ghiChu: ghiChu.trim() || null,
            chiTietItems: items // Mảng các chi tiết thiết bị
        };

        setIsSaving(true);
        toast.info("Đang tạo phiếu nhập và chi tiết...");

        let newPhieuNhapId = null;

        try {
            // === BƯỚC 1: TẠO PHIẾU NHẬP VÀ CHI TIẾT ===
            const response = await createPhieuNhapMutation.mutateAsync(payload);
            newPhieuNhapId = response?.phieuNhapId;

            if (!newPhieuNhapId) {
                throw new Error('Không nhận được ID phiếu nhập sau khi tạo.');
            }
            console.log(`Phiếu nhập ID ${newPhieuNhapId} và chi tiết đã được tạo.`);

            // === BƯỚC 2: UPLOAD CHỨNG TỪ ===
            const formData = new FormData();
            selectedFiles.forEach(file => formData.append('chungTuFiles', file));

            try {
                toast.info(`Đang upload ${selectedFiles.length} chứng từ...`);
                await uploadChungTuNhapAPI(newPhieuNhapId, formData);
                toast.success(`Tạo phiếu nhập #${newPhieuNhapId} và upload chứng từ thành công!`);
            } catch (uploadError) {
                console.error("Lỗi upload chứng từ:", uploadError);
                toast.warn(`Tạo phiếu nhập #${newPhieuNhapId} thành công, nhưng upload chứng từ thất bại: ${uploadError.response?.data?.error || uploadError.message}`);
            }

            // === BƯỚC 3: XỬ LÝ SAU THÀNH CÔNG ===
             if(refreshData) refreshData(); // Refresh bảng phiếu nhập
             if(onClose) onClose();     // Đóng form/modal
             // Reset form (có thể đặt trong useEffect của isOpen thay thế)
             setTruongHopNhap('');
             setGhiChu('');
             setSelectedFiles([]);
             if (fileInputRef.current) fileInputRef.current.value = "";
             setItems([{ thietbi_id: '', soLuong: 1, giaTriBanDau: '', ngayMua: '', thoiGianBaoHanh: 12 }]);
             setSuggestedDonGia({});
             setFormError('');

        } catch (createError) { // Lỗi từ bước 1
            console.error("Lỗi tạo phiếu nhập và chi tiết:", createError);
            setFormError(createError.response?.data?.error || createError.message || 'Lỗi không xác định khi tạo phiếu.');
            // Toast lỗi đã được xử lý bởi interceptor
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <div className="flex items-center justify-between p-4 border-b bg-green-50">
                <h3 className="text-lg font-semibold text-green-800">Tạo Phiếu Nhập Kho Mới</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-700 disabled:opacity-50" disabled={isSaving} aria-label="Đóng" >
                    <FaTimes size={20} />
                </button>
            </div>

            {/* Form chính */}
            <div className="p-6 flex-grow overflow-y-auto custom-scrollbar space-y-4">
                 {/* Thông tin chung */}
                 <div className='space-y-4 p-4 border rounded-md bg-gray-50'>
                     <h4 className="text-md font-semibold text-gray-700">Thông tin chung</h4>
                     {/* Trường Hợp Nhập */}
                     <div>
                         <label htmlFor="truongHopNhap" className="block text-sm font-medium text-gray-700">Trường Hợp Nhập <span className="text-red-500">*</span></label>
                         <select id="truongHopNhap" value={truongHopNhap} onChange={(e) => setTruongHopNhap(e.target.value)} required className={`mt-1 block w-full px-3 py-2 border ${!truongHopNhap && formError.includes('trường hợp nhập') ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm`} disabled={isSaving} >
                             {TRUONG_HOP_NHAP_OPTIONS.map(opt => (<option key={opt.value} value={opt.value} disabled={opt.disabled}>{opt.label}</option>))}
                         </select>
                     </div>
                     {/* Ghi Chú */}
                     <div>
                         <label htmlFor="ghiChuNhap" className="block text-sm font-medium text-gray-700">Ghi Chú</label>
                         <textarea id="ghiChuNhap" rows="2" value={ghiChu} onChange={(e) => setGhiChu(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm" placeholder="Thông tin bổ sung..." disabled={isSaving}></textarea>
                     </div>
                  {/* Upload Chứng Từ */}
                  <div>
                     <label className="block text-sm font-medium text-gray-700">Chứng Từ Kèm Theo <span className="text-red-500">*</span> (Tối đa 5 file)</label>
                      <input
                         type="file"
                         multiple
                         accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                         onChange={handleFileChange}
                         ref={fileInputRef}
                         className={`mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 border ${selectedFiles.length === 0 && formError.includes('chứng từ') ? 'border-red-500' : 'border-gray-300'} rounded-md cursor-pointer focus:outline-none disabled:opacity-50`}
                         disabled={createPhieuNhapMutation.isLoading}
                      />
                      {/* Hiển thị file đã chọn */}
                      {selectedFiles.length > 0 && (
                         <div className="mt-2 space-y-1 text-xs max-h-24 overflow-y-auto custom-scrollbar border p-2 rounded-md bg-gray-50">
                             <p className="font-medium text-gray-600">File đã chọn ({selectedFiles.length}):</p>
                             <ul className="list-none pl-0">
                                 {selectedFiles.map((file, index) => (
                                     <li key={index} className="flex items-center justify-between py-0.5">
                                         <span className="truncate text-gray-700"><FaPaperclip className="inline mr-1 text-gray-400" />{file.name}</span>
                                         <button type="button" onClick={() => handleRemoveFile(file.name)} className="ml-2 text-red-500 hover:text-red-700 disabled:opacity-50" title="Xóa file" disabled={createPhieuNhapMutation.isLoading}>
                                             <FaTrash size={12} />
                                         </button>
                                     </li>
                                 ))}
                             </ul>
                         </div>
                      )}
                      <p className="mt-1 text-xs text-gray-400">Hỗ trợ: PDF, Ảnh, Word, Excel. Tối đa 5MB/file.</p>
                  </div>
                 </div>

                 {/* Danh sách chi tiết thiết bị */}
                 <div className='space-y-3'>
                     <h4 className="text-md font-semibold text-gray-700">Chi tiết thiết bị nhập</h4>
                     {items.map((item, index) => (
                        <div key={index} className="p-4 border rounded-md bg-white shadow-sm relative space-y-3">
                             {items.length > 1 && ( <button type="button" onClick={() => handleRemoveItem(index)} className="absolute top-2 right-2 text-red-400 hover:text-red-600 ... " disabled={isSaving}> <FaTrash /> </button> )}
                             <p className="text-sm font-semibold text-gray-600">Chi tiết #{index + 1}</p>
                             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                 {/* Loại Thiết Bị */}
                                 <div>
                                     <label className="block text-sm font-medium text-gray-700">Loại Thiết Bị <span className="text-red-500">*</span></label>
                                     <select value={item.thietbi_id} onChange={(e) => handleItemChange(index, 'thietbi_id', e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm disabled:bg-gray-100" disabled={isLoadingThietBi || isSaving} >
                                         <option value="">{isLoadingThietBi ? 'Đang tải...' : '-- Chọn --'}</option>
                                         {thietBiOptions.map(tb => ( <option key={tb.id} value={tb.id}> {tb.tenThietBi} {tb.donGia ? `(${formatCurrency(tb.donGia)})` : ''} </option> ))}
                                     </select>
                                 </div>
                                 {/* Số Lượng */}
                                  <div>
                                      <label className="block text-sm font-medium text-gray-700">Số Lượng <span className="text-red-500">*</span></label>
                                      <input type="number" min="1" value={item.soLuong} onChange={(e) => handleItemChange(index, 'soLuong', e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm" disabled={isSaving} />
                                  </div>
                                  {/* Giá trị ban đầu */}
                                 <div>
                                      <label className="block text-sm font-medium text-gray-700">Giá trị ban đầu (VNĐ) <span className="text-red-500">*</span></label>
                                      <input type="number" min="0" step="any" placeholder={suggestedDonGia[index] ? `Gợi ý: ${formatCurrency(suggestedDonGia[index])}` : 'Nhập giá'} value={item.giaTriBanDau} onChange={(e) => handleItemChange(index, 'giaTriBanDau', e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm" disabled={isSaving}/>
                                      {suggestedDonGia[index] && item.giaTriBanDau === '' && (<p className='text-xs text-gray-500 mt-1'>Đơn giá loại TB: {formatCurrency(suggestedDonGia[index])}</p>)}
                                 </div>
                                 {/* Ngày Mua */}
                                  <div>
                                      <label className="block text-sm font-medium text-gray-700">Ngày Mua</label>
                                      <input type="date" value={item.ngayMua} onChange={(e) => handleItemChange(index, 'ngayMua', e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm" disabled={isSaving}/>
                                  </div>
                                 {/* Thời Gian BH */}
                                  <div>
                                      <label className="block text-sm font-medium text-gray-700">Thời Gian BH (tháng) <span className="text-red-500">*</span></label>
                                      <input type="number" min="0" value={item.thoiGianBaoHanh} onChange={(e) => handleItemChange(index, 'thoiGianBaoHanh', e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm" disabled={isSaving}/>
                                  </div>
                             </div>
                        </div>
                     ))}
                     {/* Nút thêm dòng */}
                     <button type="button" onClick={handleAddItem} className="mt-2 px-3 py-1.5 border border-dashed border-green-400 text-green-600 rounded-md hover:bg-green-50 text-sm disabled:opacity-50" disabled={isSaving} >
                         <FaPlus className="inline mr-1" /> Thêm dòng thiết bị
                     </button>
                 </div>

                 {/* Hiển thị lỗi form tổng quát */}
                 {formError && <p className="text-sm text-red-600 mt-2">{formError}</p>}
            </div>

            {/* Footer với nút bấm */}
            <div className="flex justify-end gap-3 p-4 border-t bg-gray-50 flex-shrink-0">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50" disabled={isSaving}> Hủy </button>
                <button type="button" onClick={handleSubmit} className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-70 disabled:cursor-not-allowed"
                     disabled={isSaving || items.some(i => !i.thietbi_id || i.giaTriBanDau === '') || selectedFiles.length === 0 || !truongHopNhap}
                     style={{ minWidth: '120px' }} >
                     {isSaving ? (<><FaSpinner className="animate-spin -ml-1 mr-2 h-4 w-4" /> Đang lưu...</>) : ('Lưu Phiếu Nhập')}
                 </button>
             </div>
        </>
    );
};

export default FormNhap;