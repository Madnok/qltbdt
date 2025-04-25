// import React, { useState, useEffect, useMemo } from 'react';
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import { toast } from 'react-toastify';
// import * as api from '../../api';
// import Modal from '../layout/Popup';
// import Pagination from '../layout/Pagination';
// import Select from 'react-select';
// import { FaTrashAlt, FaEye, FaListUl, FaPlus, FaLayerGroup, FaHistory, FaBan } from "react-icons/fa";
// import moment from 'moment';
// import ModalXemLogBaoTri from './ModalXemLogBaoTri';
// import ModalBulkCreateLichBaoDuong from './ModalBulkCreateLichBaoDuong';

// // --- Helper Components ---
// const StatusBadge = ({ status }) => {
//     let colorClasses = 'bg-gray-100 text-gray-800';
//     if (status === 'Hoàn thành') { colorClasses = 'bg-green-100 text-green-800'; }
//     else if (status === 'Đang tiến hành') { colorClasses = 'bg-yellow-100 text-yellow-800'; }
//     else if (status === 'Hủy') { colorClasses = 'bg-red-100 text-red-800 line-through'; }
//     else if (status === 'Chờ xử lý') { colorClasses = 'bg-blue-100 text-blue-800'; }
//     return (<span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClasses}`}>{status}</span>);
// };

// const DeviceListDisplay = ({ devices }) => {
//     const [showList, setShowList] = useState(false);
//     if (!devices || devices.length === 0) return <span className="italic text-gray-500">Không có</span>;
//     if (devices.length === 1) return <span title={`MĐD: ${devices[0].id}`}>{devices[0].name}</span>;
//     return (
//         <div className="relative inline-block">
//             <button onClick={() => setShowList(!showList)} className="text-blue-600 hover:underline cursor-pointer flex items-center text-sm" type="button">
//                 {devices.length} thiết bị <FaListUl className="ml-1" />
//             </button>
//             {showList && (
//                 <div className="absolute z-20 mt-1 p-2 bg-white border border-gray-300 rounded shadow-lg max-w-xs max-h-48 overflow-y-auto text-xs left-0 min-w-[200px]">
//                     <ul className="list-disc list-inside space-y-1">
//                         {devices.map(device => (<li key={device.id} title={`MĐD: ${device.id}`}> {device.name} </li>))}
//                     </ul>
//                     <button onClick={() => setShowList(false)} className="text-red-500 text-xs mt-1 block w-full text-right hover:underline">Đóng</button>
//                 </div>
//             )}
//         </div>
//     );
// };

// // --- Kết thúc Helper Components ---

// const LichBaoDuongAdmin = () => {
//     const queryClient = useQueryClient();
//     const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
//     const [displayFilters, setDisplayFilters] = useState({});
//     const [selectedPhong, setSelectedPhong] = useState(null);
//     const [selectedThietBis, setSelectedThietBis] = useState([]);
//     const [selectedDate, setSelectedDate] = useState(null);
//     const [selectedNhanVien, setSelectedNhanVien] = useState(null);
//     const [moTa, setMoTa] = useState('');
//     const [suggestedNhanVien, setSuggestedNhanVien] = useState([]);
//     const [currentPage, setCurrentPage] = useState(1);
//     const rowsPerPage = 10;
//     const [viewingGroupDetail, setViewingGroupDetail] = useState(null); // State quản lý modal chi tiết
//     const [isBulkCreateModalOpen, setIsBulkCreateModalOpen] = useState(false); // <<< THÊM STATE MỚI
//     const [logModalInfo, setLogModalInfo] = useState({ isOpen: false, lichbaoduongId: null, tenThietBi: null, phongName: null });
//     // --- Fetch Data ---
//     const { data: phongListData, isLoading: isLoadingPhong } = useQuery({ queryKey: ['phongList'], queryFn: api.fetchPhongCoTaiSanList });
//     const { data: thietBiTrongPhongData, isLoading: isLoadingThietBi } = useQuery({
//         queryKey: ['thietBiTrongPhong', selectedPhong?.value],
//         queryFn: () => api.fetchThietBiTrongPhongToBaoDuong(selectedPhong.value),
//         enabled: !!selectedPhong
//     });
//     const { data: lichBaoDuongRawData, isLoading: isLoadingLich } = useQuery({
//         queryKey: ['lichBaoDuongListAll'],
//         queryFn: () => api.getLichBaoDuongListAPI({ limit: 9999, page: 1 })
//     });

//     // --- Gom nhóm dữ liệu ---
//     const groupedLichList = useMemo(() => {
//         if (!lichBaoDuongRawData?.data) return [];
//         const grouped = lichBaoDuongRawData.data.reduce((acc, item) => {
//             // Sửa key để gom chính xác hơn, bao gồm cả mô tả nếu muốn tách các task có mô tả khác nhau
//             const groupKey = `${item.phong_id}_${item.ngay_baotri}_${item.nhanvien_id || 'null'}_${item.mo_ta || 'no_desc'}`;
//             if (!acc[groupKey]) {
//                 acc[groupKey] = {
//                     key: groupKey,
//                     phong_id: item.phong_id,
//                     tenPhong: item.tenPhong,
//                     ngay_baotri: item.ngay_baotri,
//                     nhanvien_id: item.nhanvien_id,
//                     tenNhanVienPhuTrach: item.tenNhanVienPhuTrach,
//                     trang_thai: item.trang_thai, // Trạng thái của item ĐẦU TIÊN trong nhóm
//                     mo_ta_chung: item.mo_ta,   // Mô tả của item ĐẦU TIÊN
//                     devices: [],
//                     originalItems: [], // Lưu trữ các item gốc đầy đủ thông tin
//                 };
//             }
//             acc[groupKey].devices.push({
//                 id: item.thongtinthietbi_id,
//                 name: item.tenThietBi || `Thiết bị ID ${item.thongtinthietbi_id}`,
//             });
//             acc[groupKey].originalItems.push(item); // Lưu item gốc

//             // Xác định trạng thái chung của nhóm (Logic này cần xem xét lại)
//             // Ưu tiên: Đang tiến hành > Chờ xử lý > Hoàn thành/Hủy/Chờ BH
//             // Có thể cần phức tạp hơn nếu muốn hiển thị "Đã hoàn thành một phần"
//             const currentGroupStatus = acc[groupKey].trang_thai;
//             if (item.trang_thai === 'Đang tiến hành') {
//                 acc[groupKey].trang_thai = 'Đang tiến hành';
//             } else if (item.trang_thai === 'Chờ xử lý' && currentGroupStatus !== 'Đang tiến hành') {
//                 acc[groupKey].trang_thai = 'Chờ xử lý';
//             } else if (item.trang_thai === 'Chờ Hoàn Tất Bảo Hành' && !['Đang tiến hành', 'Chờ xử lý'].includes(currentGroupStatus)) {
//                 acc[groupKey].trang_thai = 'Chờ Hoàn Tất Bảo Hành';
//             }
//             // Giữ nguyên Hoàn thành/Hủy nếu tất cả đều vậy (logic này chưa xử lý)

//             return acc;
//         }, {});

//         // Lọc client-side (tạm thời)
//         return Object.values(grouped).filter(group => {
//             return !displayFilters.trangThai || group.trang_thai === displayFilters.trangThai;
//             // TODO: Thêm các điều kiện lọc khác nếu cần
//         });

//     }, [lichBaoDuongRawData, displayFilters]);

//     // --- Phân trang Client-side ---
//     const totalPages = Math.ceil(groupedLichList.length / rowsPerPage);
//     const indexOfLastRow = currentPage * rowsPerPage;
//     const indexOfFirstRow = indexOfLastRow - rowsPerPage;
//     const currentGroupedRows = useMemo(() => {
//         return groupedLichList.slice(indexOfFirstRow, indexOfLastRow);
//     }, [groupedLichList, indexOfFirstRow, indexOfLastRow]);

//     // Fetch gợi ý nhân viên
//     useEffect(() => {
//         const fetchSuggestions = async () => {
//             if (selectedPhong?.value && selectedDate) {
//                 try {
//                     const suggestions = await api.suggestNhanVienAPI({ phongId: selectedPhong.value, ngayBaoTri: selectedDate });
//                     setSuggestedNhanVien(suggestions);
//                 } catch (error) { console.error("Lỗi fetch gợi ý NV:", error); setSuggestedNhanVien([]); }
//             } else { setSuggestedNhanVien([]); }
//         };
//         fetchSuggestions();
//     }, [selectedPhong, selectedDate]);

//     // --- Mutations ---
//     const createMutation = useMutation({
//         mutationFn: api.createLichBaoDuongAPI,
//         onSuccess: () => {
//             queryClient.invalidateQueries({ queryKey: ['lichBaoDuongListAll'] });
//             setIsCreateModalOpen(false);
//             setSelectedPhong(null); setSelectedThietBis([]); setSelectedDate(null); setSelectedNhanVien(null); setMoTa('');
//         },
//         onError: (error) => { console.error("Lỗi mutation tạo lịch:", error); }
//     });

//     const updateStatusMutation = useMutation({
//         mutationFn: ({ ids, data }) => {
//             // TODO: Cần API bulk update ở backend
//             const promises = ids.map(id => api.updateLichBaoDuongStatusAPI(id, data));
//             return Promise.all(promises);
//         },
//         onSuccess: () => {
//             queryClient.invalidateQueries({ queryKey: ['lichBaoDuongListAll'] });
//             toast.success("Cập nhật trạng thái thành công!");
//         },
//         onError: (error) => {
//             console.error("Lỗi mutation cập nhật trạng thái:", error);
//             toast.error("Có lỗi xảy ra khi cập nhật trạng thái.");
//         }
//     });

//     const deleteMutation = useMutation({
//         mutationFn: (id) => api.deleteLichBaoDuongAPI(id),
//         onSuccess: (data, id) => {
//             console.log(`Deleted lichbaoduong ID ${id} successfully.`);
//         },
//         onError: (error, id) => {
//             console.error(`Lỗi khi xóa lịch bảo dưỡng ID ${id}:`, error);
//             toast.error(`Không thể xóa lịch ID ${id}: ${error.response?.data?.message || error.message}`);
//         }
//     });

//     // --- Handlers ---
//     const handleClientPageChange = (newPage) => { setCurrentPage(newPage); };
//     const handleDisplayFilterChange = (e) => {
//         setDisplayFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
//         setCurrentPage(1);
//     };
//     const handleCreateSubmit = (e) => {
//         e.preventDefault();
//         // Validation cho form tạo đơn lẻ
//         if (!selectedPhong || selectedThietBis.length === 0 || !selectedDate) {
//             toast.warn("Vui lòng điền đầy đủ thông tin bắt buộc: Phòng, Thiết bị, Ngày.");
//             return;
//         }
//         // Nếu không chọn NV, nhanvien_id sẽ là null
//         if (!selectedNhanVien) {
//             if (!window.confirm("Bạn chưa chọn nhân viên thực hiện. Lịch sẽ được tạo với trạng thái 'Chưa gán'. Tiếp tục?")) {
//                 return;
//             }
//         }

//         const payload = {
//             phong_id: selectedPhong.value,
//             thongtinthietbi_ids: selectedThietBis.map(tb => tb.value),
//             ngay_baotri: selectedDate,
//             nhanvien_id: selectedNhanVien ? selectedNhanVien.value : null, // Cho phép null
//             mo_ta: moTa || `Bảo dưỡng định kỳ tại ${selectedPhong.label}`
//         };
//         createMutation.mutate(payload);
//     };
//     const handleCancelGroup = (group) => {
//         const originalIdsToCancel = group.originalItems.map(item => item.id);
//         if (window.confirm(`Bạn có chắc muốn hủy lịch bảo dưỡng cho ${group.devices.length} thiết bị tại phòng ${group.tenPhong} vào ngày ${moment(group.ngay_baotri).format("DD/MM/YYYY")}?`)) {
//             const promises = originalIdsToCancel.map(id => api.updateLichBaoDuongStatusAPI(id, { trang_thai: 'Hủy' }));
//             Promise.all(promises)
//                 .then(() => {
//                     queryClient.invalidateQueries({ queryKey: ['lichBaoDuongListAll'] });
//                     toast.success("Đã hủy nhóm lịch bảo dưỡng!");
//                 })
//                 .catch(err => {
//                     console.error("Lỗi khi hủy nhóm:", err);
//                     toast.error("Có lỗi xảy ra khi hủy nhóm.");
//                 });
//             // Nếu có API bulk update:
//             // updateStatusMutation.mutate({ ids: originalIdsToCancel, data: { trang_thai: 'Hủy' } });
//         }
//     };
//     const handleOpenDetailModal = (group) => { setViewingGroupDetail(group); };
//     const handleCloseDetailModal = () => { setViewingGroupDetail(null); };
//     const handleOpenLogModal = (lichbaoduongId, tenThietBi, phongName) => {
//         setLogModalInfo({ isOpen: true, lichbaoduongId, tenThietBi, phongName });
//     };
//     const handleCloseLogModal = () => {
//         setLogModalInfo({ isOpen: false, lichbaoduongId: null, tenThietBi: null, phongName: null });
//     };
//     const handleDeleteGroup = async (group) => {
//         if (group.trang_thai !== 'Chờ xử lý') {
//             toast.warn("Chỉ có thể xóa các lịch bảo dưỡng đang ở trạng thái 'Chờ xử lý'.");
//             return;
//         }
//         const originalIdsToDelete = group.originalItems
//             .filter(item => item.trang_thai === 'Chờ xử lý')
//             .map(item => item.id);

//         if (originalIdsToDelete.length === 0) {
//             toast.info("Không có lịch nào ở trạng thái 'Chờ xử lý' trong nhóm này để xóa.");
//             return;
//         }
//         if (originalIdsToDelete.length < group.originalItems.length) {
//             if (!window.confirm(`Nhóm này chứa các lịch ở trạng thái khác 'Chờ xử lý'. Bạn chỉ có thể xóa ${originalIdsToDelete.length} lịch 'Chờ xử lý'. Tiếp tục?`)) {
//                 return;
//             }
//         } else {
//             if (!window.confirm(`Bạn có chắc muốn XÓA VĨNH VIỄN ${originalIdsToDelete.length} lịch bảo dưỡng tại phòng ${group.tenPhong} vào ngày ${moment(group.ngay_baotri).format("DD/MM/YYYY")}? Hành động này không thể hoàn tác.`)) {
//                 return;
//             }
//         }

//         const deletePromises = originalIdsToDelete.map(id => deleteMutation.mutateAsync(id));

//         try {
//             await Promise.all(deletePromises);
//             toast.success(`Đã xóa thành công ${originalIdsToDelete.length} lịch bảo dưỡng.`);
//             queryClient.invalidateQueries({ queryKey: ['lichBaoDuongListAll'] });
//         } catch (error) {
//             console.error("Có lỗi xảy ra trong quá trình xóa hàng loạt:", error);
//         }
//     };
//     // --- Prepare Data for UI ---
//     const phongOptions = phongListData?.map(p => ({ value: p.id, label: `${p.phong} (${p.chucNang || 'N/A'})` })) || [];
//     const thietBiOptions = thietBiTrongPhongData?.map(tb => ({ value: tb.thongtinthietbi_id, label: `${tb.tenLoaiThietBi || tb.tenThietBi || 'TB'} (MĐD: ${tb.thongtinthietbi_id})` })) || [];
//     const nhanVienOptions = suggestedNhanVien.map(nv => ({ value: nv.id, label: `${nv.hoTen} (Ưu tiên: ${nv.priority})`, priority: nv.priority })).sort((a, b) => a.priority - b.priority);
//     console.log('Admin Page - isBulkCreateModalOpen STATE:', isBulkCreateModalOpen);
//     return (
//         <div className="p-4 flex flex-col h-full">
//             <h3 className="text-xl font-semibold mb-4 shrink-0">Quản lý Lịch Bảo Dưỡng Định Kỳ</h3>
//             {/* Thêm hàng chứa các nút hành động */}
//             <div className="mb-4 flex space-x-2 shrink-0">
//                 <button onClick={() => setIsCreateModalOpen(true)} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center">
//                     <FaPlus className="mr-1" /> Tạo Lịch Mới
//                 </button>
//                 {/* Nút Tạo Hàng Loạt Mới */}
//                 <button onClick={() => setIsBulkCreateModalOpen(true)} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center">
//                     <FaLayerGroup className="mr-1" /> Tạo Hàng Loạt
//                 </button>
//             </div>

//             {/* Filters */}
//             <div className="mb-4 p-2 border rounded bg-gray-50 shrink-0">
//                 <div className="flex flex-wrap gap-x-4 gap-y-2">
//                     <div className="w-48">
//                         <label className="block text-xs font-medium text-gray-700">Trạng Thái</label>
//                         <select name="trangThai" value={displayFilters.trangThai || ''} onChange={handleDisplayFilterChange} className="w-full px-2 py-1 mt-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
//                             <option value="">Tất cả</option>
//                             <option value="Chờ xử lý">Chờ xử lý</option>
//                             <option value="Đang tiến hành">Đang tiến hành</option>
//                             <option value="Hoàn thành">Hoàn thành</option>
//                             <option value="Hủy">Hủy</option>
//                         </select>
//                     </div>
//                     {/* Thêm filter khác nếu cần */}
//                 </div>
//             </div>

//             {/* Table */}
//             <div className="flex-grow overflow-auto border border-gray-300 rounded">
//                 <table className="min-w-full border-collapse divide-y divide-gray-200">
//                     <thead className="sticky top-0 z-10 bg-gray-100">
//                         <tr>
//                             <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase border">Phòng</th>
//                             <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase border">Ngày B.Dưỡng</th>
//                             <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase border">Nhân viên</th>
//                             <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase border">Thiết bị</th>
//                             <th className="px-3 py-2 text-xs font-medium tracking-wider text-center text-gray-500 uppercase border">Trạng thái</th>
//                             <th className="px-3 py-2 text-xs font-medium tracking-wider text-center text-gray-500 uppercase border">Hành Động</th>
//                         </tr>
//                     </thead>
//                     <tbody className="bg-white divide-y divide-gray-200">
//                         {isLoadingLich && (<tr><td colSpan="6" className="px-4 py-4 text-center text-gray-500 border">Đang tải...</td></tr>)}
//                         {!isLoadingLich && currentGroupedRows.length === 0 && (<tr><td colSpan="6" className="px-4 py-4 text-center text-gray-500 border">Không có dữ liệu phù hợp.</td></tr>)}
//                         {!isLoadingLich && currentGroupedRows.map((group) => (
//                             <tr key={group.key} className="hover:bg-gray-50">
//                                 <td className="px-3 py-2 text-sm text-gray-500 border whitespace-nowrap">{group.tenPhong}</td>
//                                 <td className="px-3 py-2 text-sm text-gray-500 border whitespace-nowrap">{group.ngay_baotri ? moment(group.ngay_baotri).format("DD/MM/YYYY") : ''}</td>
//                                 <td className="px-3 py-2 text-sm text-gray-500 border whitespace-nowrap">{group.tenNhanVienPhuTrach || <span className="italic text-gray-400">Chưa gán</span>}</td>
//                                 <td className="px-3 py-2 border"> <DeviceListDisplay devices={group.devices} /> </td>
//                                 <td className="px-3 py-2 text-center border whitespace-nowrap"><StatusBadge status={group.trang_thai} /></td>
//                                 <td className="px-3 py-2 text-sm font-medium text-center border whitespace-nowrap">
//                                     <div className='flex items-center justify-center space-x-2'>
//                                         <button onClick={() => handleOpenDetailModal(group)} className="text-blue-600 hover:text-blue-800" title="Xem chi tiết nhóm"> <FaEye /> </button>
//                                         {/* Chỉ hiển thị nút hủy nếu trạng thái chưa kết thúc */}
//                                         {group.trang_thai !== 'Hoàn thành' && group.trang_thai !== 'Hủy' && (
//                                             <button
//                                                 onClick={() => handleCancelGroup(group)}
//                                                 className="text-yellow-600 hover:text-yellow-800 p-1 disabled:opacity-50" // Đổi màu sang vàng/cam
//                                                 title="Hủy (Chuyển trạng thái sang Hủy)"
//                                                 disabled={updateStatusMutation.isLoading}
//                                             >
//                                                 <FaBan />
//                                             </button>
//                                         )}
//                                         {/* Nút Xóa */}
//                                         <button
//                                             onClick={() => handleDeleteGroup(group)}
//                                             className={`p-1 ${['Chờ xử lý', 'Hủy'].includes(group.trang_thai) && !deleteMutation.isLoading
//                                                 ? 'text-red-500 hover:text-red-700'
//                                                 : 'text-gray-400 cursor-not-allowed'
//                                                 } disabled:opacity-50`}
//                                             title="Xóa vĩnh viễn lịch này (chỉ khi Chờ xử lý)"
//                                             disabled={!['Chờ xử lý', 'Hủy'].includes(group.trang_thai) || deleteMutation.isLoading}
//                                         >
//                                             <FaTrashAlt />
//                                         </button>
//                                     </div>
//                                 </td>
//                             </tr>
//                         ))}
//                     </tbody>
//                 </table>
//             </div>

//             {/* Pagination */}
//             <div className="mt-4 shrink-0">
//                 {totalPages > 1 && (<Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handleClientPageChange} />)}
//                 <span className="text-sm text-gray-600 ml-4">Hiển thị {currentGroupedRows.length} / {groupedLichList.length} nhóm</span>
//             </div>

//             {/* Modal Tạo Lịch Mới */}
//             <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Tạo Lịch Bảo Dưỡng Mới">
//                 <form onSubmit={handleCreateSubmit} className="space-y-4">
//                     <div>
//                         <label className="block text-sm font-medium text-gray-700">Chọn Phòng <span className="text-red-500">*</span></label>
//                         <Select options={phongOptions} isLoading={isLoadingPhong} onChange={setSelectedPhong} value={selectedPhong} placeholder="Chọn phòng..." isClearable />
//                     </div>
//                     {selectedPhong && (
//                         <div>
//                             <label className="block text-sm font-medium text-gray-700">Chọn Thiết Bị (chọn một hoặc nhiều) <span className="text-red-500">*</span></label>
//                             <Select isMulti options={thietBiOptions} isLoading={isLoadingThietBi} onChange={setSelectedThietBis} value={selectedThietBis} placeholder="Chọn thiết bị trong phòng..." isDisabled={!selectedPhong || isLoadingThietBi} />
//                         </div>
//                     )}
//                     <div>
//                         <label className="block text-sm font-medium text-gray-700">Ngày Bảo Dưỡng <span className="text-red-500">*</span></label>
//                         <input type="date" required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" value={selectedDate || ''} onChange={(e) => setSelectedDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
//                     </div>
//                     {selectedPhong && selectedDate && (
//                         <div>
//                             <label className="block text-sm font-medium text-gray-700">Gán Nhân Viên (Gợi ý theo ưu tiên) <span className="text-red-500">*</span></label>
//                             <Select options={nhanVienOptions} isLoading={!nhanVienOptions} onChange={setSelectedNhanVien} value={selectedNhanVien} placeholder="Chọn nhân viên..." isClearable />
//                         </div>
//                     )}
//                     <div>
//                         <label className="block text-sm font-medium text-gray-700">Mô Tả (Tùy chọn)</label>
//                         <textarea rows="3" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" value={moTa} onChange={(e) => setMoTa(e.target.value)} placeholder="Nhập mô tả công việc..."></textarea>
//                     </div>
//                     <div className="flex justify-end space-x-2 pt-4">
//                         <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Hủy</button>
//                         <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600" disabled={createMutation.isLoading}>
//                             {createMutation.isLoading ? 'Đang tạo...' : 'Tạo Lịch'}
//                         </button>
//                     </div>
//                 </form>
//             </Modal>

//             {/* Modal Tạo Hàng Loạt */}
//             <ModalBulkCreateLichBaoDuong
//                 isOpen={isBulkCreateModalOpen}
//                 onClose={() => {
//                     console.log('Admin Page - Close button clicked! Setting isBulkCreateModalOpen to false.'); // Log khi nút đóng được nhấn
//                     setIsBulkCreateModalOpen(false);
//                 }}
//             />

//             {/* *** MODAL CHI TIẾT (ĐÃ GOM VÀO ĐÂY) *** */}
//             <Modal isOpen={!!viewingGroupDetail} onClose={handleCloseDetailModal} title={`Chi Tiết Lịch Bảo Dưỡng - ${viewingGroupDetail?.tenPhong || ''}`}>
//                 {viewingGroupDetail && ( // Chỉ render nội dung khi có dữ liệu
//                     <>
//                         <div className="space-y-3 text-sm">
//                             <p><strong>Phòng:</strong> {viewingGroupDetail.tenPhong}</p>
//                             <p><strong>Ngày Bảo Dưỡng:</strong> {moment(viewingGroupDetail.ngay_baotri).format("DD/MM/YYYY")}</p>
//                             <p><strong>Nhân viên thực hiện:</strong> {viewingGroupDetail.tenNhanVienPhuTrach || 'Chưa gán'}</p>
//                             <p><strong>Trạng thái chung:</strong> <StatusBadge status={viewingGroupDetail.trang_thai} /></p>
//                             {/* Hiển thị mô tả chung */}
//                             {viewingGroupDetail.mo_ta_chung && <p><strong>Mô tả:</strong> {viewingGroupDetail.mo_ta_chung}</p>}

//                             <hr className="my-2" />

//                             <h4 className="font-semibold">Danh sách Thiết bị ({viewingGroupDetail.originalItems?.length || 0}):</h4>
//                             {viewingGroupDetail.originalItems && viewingGroupDetail.originalItems.length > 0 ? (
//                                 <div className="max-h-60 overflow-y-auto border rounded p-2 bg-gray-50">
//                                     <table className="min-w-full divide-y divide-gray-200 text-xs">
//                                         <thead className="bg-gray-100">
//                                             <tr>
//                                                 <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider">STT</th>
//                                                 <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider">Tên Thiết bị</th>
//                                                 <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider">MĐD</th>
//                                                 <th className="px-2 py-1 text-center font-medium text-gray-500 uppercase tracking-wider">Trạng thái Riêng</th>
//                                                 <th className="px-2 py-1 text-center font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
//                                             </tr>
//                                         </thead>
//                                         <tbody className="bg-white divide-y divide-gray-200">
//                                             {viewingGroupDetail.originalItems.map((item, index) => (
//                                                 <tr key={item.id}>
//                                                     <td className="px-2 py-1 whitespace-nowrap text-gray-500">{index + 1}</td>
//                                                     <td className="px-2 py-1 whitespace-nowrap font-medium text-gray-900">{item.tenThietBi || `Thiết bị ID ${item.thongtinthietbi_id}`}</td>
//                                                     <td className="px-2 py-1 whitespace-nowrap text-gray-500">{item.thongtinthietbi_id}</td>
//                                                     <td className="px-2 py-1 whitespace-nowrap text-center"><StatusBadge status={item.trang_thai} /></td>
//                                                     <td className="px-2 py-1 whitespace-nowrap text-center">
//                                                         {/* Nút xem log cho từng item */}
//                                                         <button
//                                                             onClick={() => handleOpenLogModal(item.id, item.tenThietBi, item.tenPhong)}
//                                                             className="text-purple-600 hover:underline"
//                                                             title="Xem lịch sử bảo trì cho lịch này"
//                                                         >
//                                                             <FaHistory />
//                                                         </button>
//                                                     </td>
//                                                 </tr>
//                                             ))}
//                                         </tbody>
//                                     </table>
//                                 </div>
//                             ) : (
//                                 <p className="italic text-gray-500">Không có thông tin thiết bị.</p>
//                             )}
//                             {/* Hiển thị kết quả chung nếu có */}
//                             {viewingGroupDetail.ket_qua_chung && <p className="mt-2"><strong>Kết quả chung:</strong> {viewingGroupDetail.ket_qua_chung}</p>}
//                         </div>
//                         <div className="mt-5 pt-3 border-t text-right"> {/* Thêm border-t */}
//                             <button
//                                 onClick={handleCloseDetailModal}
//                                 className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
//                             >
//                                 Đóng
//                             </button>
//                         </div>
//                     </>
//                 )}
//             </Modal>

//             {/* Modal Xem Log (Mới thêm) */}
//             {logModalInfo.isOpen && (
//                 <ModalXemLogBaoTri
//                     isOpen={logModalInfo.isOpen}
//                     onClose={handleCloseLogModal}
//                     lichbaoduongId={logModalInfo.lichbaoduongId}
//                     // Truyền thêm thông tin nếu cần hiển thị trong modal log
//                     tenThietBi={logModalInfo.tenThietBi}
//                     phongName={logModalInfo.phongName}
//                 />
//             )}

//         </div>
//     );
// };

// export default LichBaoDuongAdmin;

// src/components/LichTruc/LichBaoDuongAdmin.js
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import * as api from '../../api';
import Modal from '../layout/Popup'; // Đảm bảo import Modal gốc
import Pagination from '../layout/Pagination';
import Select from 'react-select';
import { getUuTienLabel } from '../../utils/constants';
import { FaTrashAlt, FaEye, FaPlus, FaLayerGroup, FaHistory, FaBan, FaFilter, FaCalendarAlt } from "react-icons/fa";
import moment from 'moment';
import 'moment/locale/vi'; // Import locale tiếng Việt cho moment
import ModalXemLogBaoTri from './ModalXemLogBaoTri'; // Import lại
import ModalBulkCreateLichBaoDuong from './ModalBulkCreateLichBaoDuong';

// --- Helper Components ---
const StatusBadge = ({ status }) => {
    let colorClasses = 'bg-gray-100 text-gray-800';
    if (status === 'Hoàn thành') { colorClasses = 'bg-green-100 text-green-800'; }
    else if (status === 'Đang tiến hành') { colorClasses = 'bg-yellow-100 text-yellow-800'; }
    else if (status === 'Hủy') { colorClasses = 'bg-red-100 text-red-800 line-through'; }
    else if (status === 'Chờ xử lý') { colorClasses = 'bg-blue-100 text-blue-800'; }
    else if (status === 'Chờ Hoàn Tất Bảo Hành') { colorClasses = 'bg-orange-100 text-orange-800'; }
    return (<span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClasses}`}>{status}</span>);
};

// Component RoomMonthDetailModal (Đã thêm prop onOpenLog)
const RoomMonthDetailModal = ({ isOpen, onClose, roomData, selectedMonthYear, onOpenLog }) => {
    if (!isOpen || !roomData) return null;

    const { tenPhong, originalItems } = roomData;
    const formattedMonthYear = moment(selectedMonthYear).format("MM/YYYY");

    const tasksThisMonth = originalItems.filter(item =>
        moment(item.ngay_baotri).isSame(selectedMonthYear, 'month')
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Chi tiết lịch bảo dưỡng ${tenPhong} - Tháng ${formattedMonthYear}`}>
            <div className="space-y-3 text-sm max-h-[60vh] overflow-y-auto">
                <h4 className="font-semibold text-base mb-2">Danh sách công việc ({tasksThisMonth.length}):</h4>
                {tasksThisMonth.length > 0 ? (
                    <table className="min-w-full divide-y divide-gray-200 text-xs border">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider">STT</th>
                                <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider">Thiết bị</th>
                                <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider">MĐD</th>
                                <th className="px-2 py-1 text-center font-medium text-gray-500 uppercase tracking-wider">Ngày BD</th>
                                <th className="px-2 py-1 text-center font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                <th className="px-2 py-1 text-center font-medium text-gray-500 uppercase tracking-wider">Nhân viên</th>
                                <th className="px-2 py-1 text-center font-medium text-gray-500 uppercase tracking-wider">Log</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {tasksThisMonth.map((item, index) => (
                                <tr key={item.id}>
                                    <td className="px-2 py-1 whitespace-nowrap text-gray-500">{index + 1}</td>
                                    <td className="px-2 py-1 whitespace-nowrap font-medium text-gray-900">{item.tenThietBi || `TB ID ${item.thongtinthietbi_id}`}</td>
                                    <td className="px-2 py-1 whitespace-nowrap text-gray-500">{item.thongtinthietbi_id}</td>
                                    <td className="px-2 py-1 whitespace-nowrap text-center text-gray-500">{moment(item.ngay_baotri).format("DD/MM")}</td>
                                    <td className="px-2 py-1 whitespace-nowrap text-center"><StatusBadge status={item.trang_thai} /></td>
                                    <td className="px-2 py-1 whitespace-nowrap text-center text-gray-500">{item.tenNhanVienPhuTrach || 'Chưa gán'}</td>
                                    <td className="px-2 py-1 whitespace-nowrap text-center">
                                        <button
                                            // Gọi onOpenLog với các tham số cần thiết
                                            onClick={() => onOpenLog(item.id, item.thongtinthietbi_id, item.tenThietBi, item.tenPhong)}
                                            className="text-purple-600 hover:underline disabled:text-gray-400 disabled:no-underline"
                                            title="Xem lịch sử bảo trì của thiết bị này"
                                            disabled={!item.thongtinthietbi_id}
                                        >
                                            <FaHistory />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="italic text-gray-500">Không có công việc nào trong tháng này.</p>
                )}
            </div>
            <div className="mt-5 pt-3 border-t text-right">
                <button onClick={onClose} className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"> Đóng </button>
            </div>
        </Modal>
    );
};
// --- Kết thúc Helper Components ---

const LichBaoDuongAdmin = () => {
    const queryClient = useQueryClient();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedMonthYear, setSelectedMonthYear] = useState(moment().format('YYYY-MM'));
    const [filterStatus, setFilterStatus] = useState('');
    const [selectedPhong, setSelectedPhong] = useState(null);
    const [selectedThietBis, setSelectedThietBis] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedNhanVien, setSelectedNhanVien] = useState(null);
    const [moTa, setMoTa] = useState('');
    const [suggestedNhanVien, setSuggestedNhanVien] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;
    const [viewingRoomDetail, setViewingRoomDetail] = useState(null);
    const [isBulkCreateModalOpen, setIsBulkCreateModalOpen] = useState(false);
    const [logModalInfo, setLogModalInfo] = useState({
        isOpen: false,
        lichbaoduongId: null,
        thongtinthietbiId: null,
        tenThietBi: null,
        phongName: null
    });

    // --- Fetch Data ---
    const { data: phongListData, isLoading: isLoadingPhong } = useQuery({ queryKey: ['phongList'], queryFn: api.fetchPhongCoTaiSanList });
    const { data: thietBiTrongPhongData, isLoading: isLoadingThietBi } = useQuery({
        queryKey: ['thietBiTrongPhong', selectedPhong?.value],
        queryFn: () => api.fetchThietBiTrongPhongToBaoDuong(selectedPhong.value),
        enabled: !!selectedPhong
    });
    const { data: lichBaoDuongRawData, isLoading: isLoadingLich } = useQuery({
        queryKey: ['lichBaoDuongListAllUnfiltered'],
        queryFn: () => api.getLichBaoDuongListAPI({ limit: 99999, page: 1 }),
        staleTime: 5 * 60 * 1000,
    });

    // --- Lọc và Gom nhóm dữ liệu Client-side ---
    const filteredAndGroupedList = useMemo(() => {
        if (!lichBaoDuongRawData?.data) return [];

        const filteredByDateAndStatus = lichBaoDuongRawData.data.filter(item => {
            const itemMonthYear = moment(item.ngay_baotri).format('YYYY-MM');
            const matchesMonth = !selectedMonthYear || itemMonthYear === selectedMonthYear;
            const matchesStatus = !filterStatus || item.trang_thai === filterStatus;
            return matchesMonth && matchesStatus;
        });

        const groupedByRoom = filteredByDateAndStatus.reduce((acc, item) => {
            const groupKey = item.phong_id;
            if (!acc[groupKey]) {
                acc[groupKey] = {
                    key: `room-${groupKey}-${selectedMonthYear}`,
                    phong_id: item.phong_id,
                    tenPhong: item.tenPhong,
                    taskCount: 0,
                    representativeStatus: 'Hoàn thành',
                    nhanVienList: new Set(),
                    firstDate: item.ngay_baotri,
                    originalItems: []
                };
            }
            acc[groupKey].taskCount += 1;
            acc[groupKey].originalItems.push(item);
            if (item.tenNhanVienPhuTrach) {
                acc[groupKey].nhanVienList.add(item.tenNhanVienPhuTrach);
            }

            const currentRepStatus = acc[groupKey].representativeStatus;
            if (item.trang_thai === 'Đang tiến hành') {
                acc[groupKey].representativeStatus = 'Đang tiến hành';
            } else if (item.trang_thai === 'Chờ xử lý' && currentRepStatus !== 'Đang tiến hành') {
                acc[groupKey].representativeStatus = 'Chờ xử lý';
            } else if (item.trang_thai === 'Chờ Hoàn Tất Bảo Hành' && !['Đang tiến hành', 'Chờ xử lý'].includes(currentRepStatus)) {
                acc[groupKey].representativeStatus = 'Chờ Hoàn Tất Bảo Hành';
            } else if (item.trang_thai === 'Hủy' && currentRepStatus === 'Hoàn thành') {
                acc[groupKey].representativeStatus = 'Hủy';
            }

            if (moment(item.ngay_baotri).isBefore(moment(acc[groupKey].firstDate))) {
                acc[groupKey].firstDate = item.ngay_baotri;
            }

            return acc;
        }, {});

        Object.values(groupedByRoom).forEach(group => {
            group.nhanVienDisplay = group.nhanVienList.size > 0 ? Array.from(group.nhanVienList).join(', ') : 'Chưa gán';
        });

        return Object.values(groupedByRoom).sort((a, b) => a.tenPhong.localeCompare(b.tenPhong));

    }, [lichBaoDuongRawData, selectedMonthYear, filterStatus]);

    // --- Phân trang Client-side ---
    const totalPages = Math.ceil(filteredAndGroupedList.length / rowsPerPage);
    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const currentGroupedRows = useMemo(() => {
        return filteredAndGroupedList.slice(indexOfFirstRow, indexOfLastRow);
    }, [filteredAndGroupedList, indexOfFirstRow, indexOfLastRow]);

    // Fetch gợi ý nhân viên
    useEffect(() => {
        const fetchSuggestions = async () => {
            if (selectedPhong?.value && selectedDate) {
                try {
                    const suggestions = await api.suggestNhanVienAPI({ phongId: selectedPhong.value, ngayBaoTri: selectedDate });
                    setSuggestedNhanVien(suggestions);
                } catch (error) { console.error("Lỗi fetch gợi ý NV:", error); setSuggestedNhanVien([]); }
            } else { setSuggestedNhanVien([]); }
        };
        fetchSuggestions();
    }, [selectedPhong, selectedDate]);

    // --- Mutations ---
    const createMutation = useMutation({
        mutationFn: api.createLichBaoDuongAPI,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['lichBaoDuongListAllUnfiltered'] });
            setIsCreateModalOpen(false);
            setSelectedPhong(null); setSelectedThietBis([]); setSelectedDate(null); setSelectedNhanVien(null); setMoTa('');
            toast.success("Tạo lịch bảo dưỡng thành công!");
        },
        onError: (error) => { console.error("Lỗi mutation tạo lịch:", error); /* Toast đã xử lý */ }
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ ids, data }) => {
            const promises = ids.map(id => api.updateLichBaoDuongStatusAPI(id, data));
            return Promise.all(promises);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['lichBaoDuongListAllUnfiltered'] });
            toast.success("Cập nhật trạng thái thành công!");
        },
        onError: (error) => {
            console.error("Lỗi mutation cập nhật trạng thái:", error);
            toast.error("Có lỗi xảy ra khi cập nhật trạng thái.");
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => api.deleteLichBaoDuongAPI(id),
        onError: (error, id) => {
            console.error(`Lỗi khi xóa lịch bảo dưỡng ID ${id}:`, error);
            // Toast lỗi đã được xử lý bởi interceptor hoặc trong handleDeleteGroup
        }
    });

    // --- Handlers ---
    const handleClientPageChange = (newPage) => { setCurrentPage(newPage); };
    const handleMonthYearChange = (e) => {
        setSelectedMonthYear(e.target.value);
        setCurrentPage(1);
    };
    const handleStatusFilterChange = (e) => {
        setFilterStatus(e.target.value);
        setCurrentPage(1);
    };

    const handleCreateSubmit = (e) => {
        e.preventDefault();
        if (!selectedPhong || selectedThietBis.length === 0 || !selectedDate) {
            toast.warn("Vui lòng điền đầy đủ thông tin bắt buộc: Phòng, Thiết bị, Ngày.");
            return;
        }
        // Sửa: Kiểm tra cả khi selectedNhanVien là null hoặc không có value
        if (!selectedNhanVien || !selectedNhanVien.value) {
            if (!window.confirm("Bạn chưa chọn nhân viên thực hiện. Lịch sẽ được tạo với trạng thái 'Chưa gán'. Tiếp tục?")) {
                return;
            }
        }

        const payload = {
            phong_id: selectedPhong.value,
            thongtinthietbi_ids: selectedThietBis.map(tb => tb.value),
            ngay_baotri: selectedDate,
            nhanvien_id: selectedNhanVien ? selectedNhanVien.value : null,
            mo_ta: moTa || `Bảo dưỡng định kỳ tại ${selectedPhong.label}`
        };
        console.log("Submitting Single Create:", payload);
        createMutation.mutate(payload);
    };

    const handleCancelGroup = useCallback((group) => {
        const originalIdsToCancel = group.originalItems
            .filter(item => item.trang_thai !== 'Hoàn thành' && item.trang_thai !== 'Hủy')
            .map(item => item.id);

        if (originalIdsToCancel.length === 0) {
            toast.info("Không có công việc nào trong nhóm này cần hủy.");
            return;
        }

        if (window.confirm(`Bạn có chắc muốn HỦY ${originalIdsToCancel.length} công việc bảo dưỡng tại phòng ${group.tenPhong} trong tháng ${moment(selectedMonthYear).format("MM/YYYY")}?`)) {
            // Sử dụng mutation đã định nghĩa
            updateStatusMutation.mutate({ ids: originalIdsToCancel, data: { trang_thai: 'Hủy' } });
            // toast và invalidate đã được xử lý trong onSuccess của mutation
        }
    }, [selectedMonthYear, updateStatusMutation]);

    const handleDeleteGroup = useCallback(async (group) => {
        const originalIdsToDelete = group.originalItems
             .filter(item => ['Chờ xử lý', 'Hủy'].includes(item.trang_thai))
             .map(item => item.id);

        if (originalIdsToDelete.length === 0) {
             toast.info("Không có lịch nào ở trạng thái 'Chờ xử lý' hoặc 'Hủy' trong nhóm này để xóa.");
             return;
        }

        const confirmMessage = `Bạn có chắc muốn XÓA VĨNH VIỄN ${originalIdsToDelete.length} lịch bảo dưỡng (trạng thái 'Chờ xử lý' hoặc 'Hủy') tại phòng ${group.tenPhong} trong tháng ${moment(selectedMonthYear).format("MM/YYYY")}? Hành động này không thể hoàn tác.`;

        if (!window.confirm(confirmMessage)) {
             return;
        }

         toast.info(`Đang xóa ${originalIdsToDelete.length} lịch bảo dưỡng...`);
         const deletePromises = originalIdsToDelete.map(id => deleteMutation.mutateAsync(id).catch(err => ({ id, error: err })));

         try {
             const results = await Promise.all(deletePromises);
             const successfulDeletes = results.filter(res => !res?.error).length;
             const failedDeletes = results.filter(res => res?.error);

             if (successfulDeletes > 0) {
                 toast.success(`Đã xóa thành công ${successfulDeletes} lịch bảo dưỡng.`);
             }
             if (failedDeletes.length > 0) {
                 console.error("Lỗi khi xóa một số lịch:", failedDeletes);
                 toast.error(`Xóa thất bại ${failedDeletes.length} lịch. Xem console để biết chi tiết.`);
             }
             // Invalidate query gốc sau khi hoàn tất tất cả, bất kể lỗi
             queryClient.invalidateQueries({ queryKey: ['lichBaoDuongListAllUnfiltered'] });

         } catch (error) {
             console.error("Có lỗi không mong muốn xảy ra trong quá trình xóa hàng loạt:", error);
             toast.error("Đã xảy ra lỗi không mong muốn khi xóa.");
         }
     }, [selectedMonthYear, deleteMutation, queryClient]);

    const handleOpenDetailModal = useCallback((group) => { setViewingRoomDetail(group); }, []);
    const handleCloseDetailModal = useCallback(() => { setViewingRoomDetail(null); }, []);

    // Sửa lại hàm mở log để cập nhật state đúng cách
    const handleOpenLogModalForItem = useCallback((itemId, thietBiId, tenThietBi, phongName) => {
        if (!thietBiId) {
            toast.warn("Lịch bảo dưỡng này không liên kết với thiết bị cụ thể để xem log.");
            return;
        }
        console.log("Setting Log Modal Info:", { isOpen: true, lichbaoduongId: itemId, thongtinthietbiId: thietBiId, tenThietBi, phongName });
        setLogModalInfo({ isOpen: true, lichbaoduongId: itemId, thongtinthietbiId: thietBiId, tenThietBi, phongName });
    }, []); // Bỏ dependency không cần thiết

    const handleCloseLogModal = useCallback(() => {
        setLogModalInfo({ isOpen: false, lichbaoduongId: null, thongtinthietbiId: null, tenThietBi: null, phongName: null });
    }, []);


    // --- Prepare Data for UI ---
    const phongOptions = useMemo(() => phongListData?.map(p => ({ value: p.id, label: `${p.phong} (${p.chucNang || 'N/A'})` })) || [], [phongListData]);
    const thietBiOptions = useMemo(() => thietBiTrongPhongData?.map(tb => ({ value: tb.thongtinthietbi_id, label: `${tb.tenLoaiThietBi || tb.tenThietBi || 'TB'} (MĐD: ${tb.thongtinthietbi_id})` })) || [], [thietBiTrongPhongData]);
    const nhanVienOptions = useMemo(() =>
        suggestedNhanVien
            .map(nv => ({
                value: nv.id,
                label: `${nv.hoTen} (${getUuTienLabel(nv.priority)})`,
                priority: nv.priority
            }))
            .sort((a, b) => a.priority - b.priority),
        [suggestedNhanVien]
    );
    return (
        <div className="p-4 flex flex-col h-full">
            <h3 className="text-xl font-semibold mb-4 shrink-0">Quản lý Lịch Bảo Dưỡng Định Kỳ</h3>

            {/* Hàng nút hành động và Bộ lọc */}
            <div className="mb-4 flex flex-wrap gap-2 items-center justify-between shrink-0">
                 <div className="flex space-x-2">
                    {/* Khôi phục nút Tạo Lịch Mới */}
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center text-sm"
                    >
                        <FaPlus className="mr-1 h-4 w-4" /> Tạo Lịch Đơn
                    </button>
                    <button
                        onClick={() => setIsBulkCreateModalOpen(true)}
                        className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 flex items-center text-sm"
                    >
                        <FaLayerGroup className="mr-1 h-4 w-4" /> Tạo Hàng Loạt
                    </button>
                </div>
                 <div className="flex items-center gap-2">
                    <div className="flex items-center border rounded-md px-2 py-1 bg-white">
                        <FaCalendarAlt className="text-gray-500 mr-2"/>
                        <input
                            type="month"
                            value={selectedMonthYear}
                            onChange={handleMonthYearChange}
                            className="text-sm border-none focus:ring-0 p-0.5"
                        />
                    </div>
                     <div className="flex items-center border rounded-md px-2 py-1 bg-white">
                        <FaFilter className="text-gray-500 mr-2"/>
                        <select
                            name="filterStatus"
                            value={filterStatus}
                            onChange={handleStatusFilterChange}
                            className="text-sm border-none focus:ring-0 p-0.5 bg-transparent appearance-none"
                        >
                            <option value="">Tất cả trạng thái</option>
                            <option value="Chờ xử lý">Chờ xử lý</option>
                            <option value="Đang tiến hành">Đang tiến hành</option>
                            <option value="Hoàn thành">Hoàn thành</option>
                            <option value="Hủy">Hủy</option>
                            <option value="Chờ Hoàn Tất Bảo Hành">Chờ BH về</option>
                        </select>
                    </div>
                </div>
            </div>


            {/* Table */}
            <div className="flex-grow overflow-auto border border-gray-300 rounded">
                <table className="min-w-full border-collapse divide-y divide-gray-200">
                    <thead className="sticky top-0 z-10 bg-gray-100">
                        <tr>
                            <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase border">Phòng</th>
                            <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase border">Nhân viên (Trong tháng)</th>
                            <th className="px-3 py-2 text-xs font-medium tracking-wider text-center text-gray-500 uppercase border">Số CV (Trong tháng)</th>
                            <th className="px-3 py-2 text-xs font-medium tracking-wider text-center text-gray-500 uppercase border">Trạng thái chung</th>
                            <th className="px-3 py-2 text-xs font-medium tracking-wider text-center text-gray-500 uppercase border">Hành Động</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {isLoadingLich && (<tr><td colSpan="5" className="px-4 py-4 text-center text-gray-500 border">Đang tải...</td></tr>)}
                        {!isLoadingLich && currentGroupedRows.length === 0 && (<tr><td colSpan="5" className="px-4 py-4 text-center text-gray-500 border">Không có lịch bảo dưỡng nào trong tháng {moment(selectedMonthYear).format("MM/YYYY")}.</td></tr>)}
                        {!isLoadingLich && currentGroupedRows.map((group) => (
                            <tr key={group.key} className="hover:bg-gray-50">
                                <td className="px-3 py-2 text-sm font-medium text-gray-800 border whitespace-nowrap">{group.tenPhong}</td>
                                <td className="px-3 py-2 text-sm text-gray-500 border whitespace-nowrap">{group.nhanVienDisplay}</td>
                                <td className="px-3 py-2 text-sm text-center text-gray-500 border whitespace-nowrap">{group.taskCount}</td>
                                <td className="px-3 py-2 text-center border whitespace-nowrap"><StatusBadge status={group.representativeStatus} /></td>
                                <td className="px-3 py-2 text-sm font-medium text-center border whitespace-nowrap">
                                    <div className='flex items-center justify-center space-x-2'>
                                        <button onClick={() => handleOpenDetailModal(group)} className="text-blue-600 hover:text-blue-800" title="Xem chi tiết các công việc trong tháng"> <FaEye /> </button>
                                        {group.representativeStatus !== 'Hoàn thành' && group.representativeStatus !== 'Hủy' && (
                                            <button
                                                onClick={() => handleCancelGroup(group)}
                                                className="text-yellow-600 hover:text-yellow-800 p-1 disabled:opacity-50"
                                                title="Hủy các công việc chưa xong trong tháng"
                                                disabled={updateStatusMutation.isLoading}
                                            > <FaBan /> </button>
                                        )}
                                        <button
                                            onClick={() => handleDeleteGroup(group)}
                                             className={`p-1 ${['Chờ xử lý', 'Hủy'].includes(group.representativeStatus) && !deleteMutation.isLoading
                                                 ? 'text-red-500 hover:text-red-700'
                                                 : 'text-gray-400 cursor-not-allowed'
                                             } disabled:opacity-50`}
                                            title="Xóa các lịch ở trạng thái 'Chờ xử lý' hoặc 'Hủy' trong tháng"
                                             disabled={!['Chờ xử lý', 'Hủy'].includes(group.representativeStatus) || deleteMutation.isLoading}
                                        > <FaTrashAlt /> </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="mt-4 shrink-0">
                {totalPages > 1 && (<Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handleClientPageChange} />)}
                <span className="text-sm text-gray-600 ml-4">Hiển thị {currentGroupedRows.length} phòng có lịch trong tháng / Tổng {filteredAndGroupedList.length} phòng</span>
            </div>

            {/* Modal Tạo Lịch Mới Đơn Lẻ */}
            <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Tạo Lịch Bảo Dưỡng Mới">
                 <form onSubmit={handleCreateSubmit} className="space-y-4">
                     <div>
                         <label className="block text-sm font-medium text-gray-700">Chọn Phòng <span className="text-red-500">*</span></label>
                         <Select options={phongOptions} isLoading={isLoadingPhong} onChange={setSelectedPhong} value={selectedPhong} placeholder="Chọn phòng..." isClearable styles={{ menu: base => ({ ...base, zIndex: 9999 }) }}/>
                     </div>
                     {selectedPhong && (
                         <div>
                             <label className="block text-sm font-medium text-gray-700">Chọn Thiết Bị (chọn một hoặc nhiều) <span className="text-red-500">*</span></label>
                             <Select isMulti options={thietBiOptions} isLoading={isLoadingThietBi} onChange={setSelectedThietBis} value={selectedThietBis} placeholder="Chọn thiết bị trong phòng..." isDisabled={!selectedPhong || isLoadingThietBi} styles={{ menu: base => ({ ...base, zIndex: 9998 }) }}/>
                         </div>
                     )}
                     <div>
                         <label className="block text-sm font-medium text-gray-700">Ngày Bảo Dưỡng <span className="text-red-500">*</span></label>
                         <input type="date" required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" value={selectedDate || ''} onChange={(e) => setSelectedDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
                     </div>
                     {selectedPhong && selectedDate && (
                         <div>
                             <label className="block text-sm font-medium text-gray-700">Gán Nhân Viên <span className="text-red-500">*</span></label>
                             <Select options={nhanVienOptions} isLoading={!nhanVienOptions && !!selectedDate && !!selectedPhong} onChange={setSelectedNhanVien} value={selectedNhanVien} placeholder="Chọn nhân viên (gợi ý theo ưu tiên)..." isClearable required styles={{ menu: base => ({ ...base, zIndex: 9997 }) }}/>
                         </div>
                     )}
                     <div>
                         <label className="block text-sm font-medium text-gray-700">Mô Tả (Tùy chọn)</label>
                         <textarea rows="3" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" value={moTa} onChange={(e) => setMoTa(e.target.value)} placeholder="Nhập mô tả công việc..."></textarea>
                     </div>
                     <div className="flex justify-end space-x-2 pt-4">
                         <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Hủy</button>
                         <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600" disabled={createMutation.isLoading}>
                             {createMutation.isLoading ? 'Đang tạo...' : 'Tạo Lịch'}
                         </button>
                     </div>
                 </form>
            </Modal>

            {/* Modal Tạo Hàng Loạt */}
            <ModalBulkCreateLichBaoDuong
                isOpen={isBulkCreateModalOpen}
                onClose={() => setIsBulkCreateModalOpen(false)}
            />

             {/* Modal Chi tiết Phòng trong Tháng */}
             <RoomMonthDetailModal
                 isOpen={!!viewingRoomDetail}
                 onClose={handleCloseDetailModal}
                 roomData={viewingRoomDetail}
                 selectedMonthYear={selectedMonthYear}
                 onOpenLog={handleOpenLogModalForItem} // Truyền hàm xử lý mở log vào đây
             />


            {/* Modal Xem Log */}
            {logModalInfo.isOpen && (
                <ModalXemLogBaoTri
                    isOpen={logModalInfo.isOpen}
                    onClose={handleCloseLogModal}
                    // Truyền cả 3 ID nếu ModalXemLogBaoTri hỗ trợ, nếu không chỉ truyền ID cần thiết
                    lichbaoduongId={logModalInfo.lichbaoduongId}
                    thongtinthietbiId={logModalInfo.thongtinthietbiId}
                    baohongId={null} // Không có ID báo hỏng ở context này
                    // Thông tin thêm
                    tenThietBi={logModalInfo.tenThietBi}
                    phongName={logModalInfo.phongName}
                />
            )}

        </div>
    );
};

export default LichBaoDuongAdmin;