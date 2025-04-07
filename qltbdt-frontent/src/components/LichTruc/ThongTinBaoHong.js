import React, { useState, useMemo, useEffect } from 'react';
import { FaChevronDown, FaChevronUp, FaEye, FaTrashAlt, FaHistory, FaUndo, FaUserCheck, FaSearch, FaBan } from "react-icons/fa"; // Thêm icons
import moment from "moment";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ModalXemLogBaoTri from './ModalXemLogBaoTri';

// Import các hàm API từ api.js
import {
    fetchBaoHongListAPI, // Đổi tên hàm fetchThongTinBaoHongAPI thành fetchBaoHongListAPI cho rõ nghĩa hơn (cần tạo/đổi tên trong api.js)
    fetchPhongList,
    fetchNhanVienList,
    deleteBaoHongAPI,
    updateBaoHongAPI
} from '../../api'; // Điều chỉnh đường dẫn

// Helper Components cho Badges (Ví dụ)
const StatusBadge = ({ status }) => {
    let colorClasses = 'bg-gray-100 text-gray-800'; // Chờ Duyệt
    if (status === 'Đã Duyệt') {
        colorClasses = 'bg-blue-100 text-blue-800';
    } else if (status === 'Hoàn Thành') {
        colorClasses = 'bg-green-100 text-green-800';
    } else if (status === 'Đang Tiến Hành') {
        colorClasses = 'bg-yellow-100 text-yellow-800';
    } else if (status === 'Không Thể Hoàn Thành') {
        colorClasses = 'bg-red-100 text-yellow-red';
    }
    return (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClasses}`}>
            {status}
        </span>
    );
};

// --- Component Modal xem ảnh ---
const ImageModal = ({ imageUrl, onClose }) => {
    if (!imageUrl) return null;
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75"
            onClick={onClose} // Đóng khi click nền
        >
            <div className="relative max-w-5xl max-h-[100vh]" onClick={e => e.stopPropagation()}> {/* Ngăn đóng khi click ảnh */}
                <img src={imageUrl} alt="Hình ảnh báo hỏng" className="block object-contain max-w-full max-h-full rounded" />
                <button
                    onClick={onClose}
                    className="absolute p-1 text-white bg-black bg-opacity-50 rounded-full top-2 right-2 hover:bg-opacity-75"
                    aria-label="Đóng ảnh"
                >
                    &times; {/* Dấu X */}
                </button>
            </div>
        </div>
    );
};

const ThongTinBaoHong = () => {
    // --- State ---
    const [expandedRows, setExpandedRows] = useState(new Set());
    const [filter, setFilter] = useState({
        phong_id: "",
        loaithiethai: "",
        thiethai: "",
        trangThai: "", // Thêm filter trạng thái
        mucDoUuTien: "", // Thêm filter ưu tiên
        specificDate: "", // Thêm filter ngày cụ thể
        dateOrder: "newest",
        searchTerm: "",
    });
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;
    const [selectedRows, setSelectedRows] = useState(new Set());
    const [selectAll, setSelectAll] = useState(false);
    const [selectedAssignee, setSelectedAssignee] = useState({}); // Lưu NV được chọn cho từng báo hỏng { baoHongId: nhanVienId }
    const [modalImage, setModalImage] = useState(null); // State cho modal ảnh
    const [viewingLogFor, setViewingLogFor] = useState(null); // Lưu ID báo hỏng đang xem log
    const [phongNameForModal, setPhongNameForModal] = useState("");
    const [reassignData, setReassignData] = useState({ baoHongId: null, nhanVienId: null, ghiChuAdmin: '' });
    const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
    const [approveData, setApproveData] = useState({ baoHongId: null, nhanVienId: null, phongName: '', ghiChuAdmin: '' });
    const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);

    const queryClient = useQueryClient();

    // --- React Query Fetch ---
    const { data: baoHongList = [], isLoading: isLoadingBaoHong, isError: isErrorBaoHong } = useQuery({
        queryKey: ['baoHongList'],
        queryFn: fetchBaoHongListAPI
    });
    const { data: phongList = [], isLoading: isLoadingPhong } = useQuery({
        queryKey: ['phongListForFilter'],
        queryFn: fetchPhongList
    });
    const { data: nhanVienList = [], isLoading: isLoadingNhanVien } = useQuery({
        queryKey: ['nhanVienListForAssign'],
        queryFn: fetchNhanVienList
    });

    // Tạo lookup maps bằng useMemo
    const phongMap = useMemo(() => new Map(phongList.map(p => [p.id, p.phong])), [phongList]);

    // --- Sắp Xếp và lọc Logic ---
    const filteredAndSortedBaoHongList = useMemo(() => {
        let filtered = baoHongList;

        // Lọc theo searchTerm
        if (filter.searchTerm) {
            const termLower = filter.searchTerm.toLowerCase();
            filtered = filtered.filter(item =>
                item.moTa?.toLowerCase().includes(termLower) ||
                item.tenThietBi?.toLowerCase().includes(termLower) ||
                phongMap.get(item.phong_id)?.toLowerCase().includes(termLower) ||
                item.loaithiethai?.toLowerCase().includes(termLower) ||
                item.thiethai?.toLowerCase().includes(termLower) ||
                item.trangThai?.toLowerCase().includes(termLower)
            );
        }

        // Lọc theo các dropdown khác
        filtered = filtered.filter((item) => {
            const ngayBaoHong = moment(item.ngayBaoHong).format("YYYY-MM-DD");
            const specificDate = filter.specificDate;
            return (
                (filter.phong_id === "" || item.phong_id === parseInt(filter.phong_id)) &&
                (filter.loaithiethai === "" || item.loaithiethai === filter.loaithiethai) &&
                (filter.thiethai === "" || item.thiethai === filter.thiethai) &&
                (filter.trangThai === "" || item.trangThai === filter.trangThai) &&
                // Bỏ lọc mucDoUuTien
                (!specificDate || ngayBaoHong === specificDate)
            );
        });

        // Sắp xếp
        filtered.sort((a, b) => {
            const dateA = moment(a.ngayBaoHong);
            const dateB = moment(b.ngayBaoHong);
            return filter.dateOrder === "newest" ? dateB - dateA : dateA - dateB;
        });

        return filtered;
    }, [baoHongList, filter, phongMap]); // Thêm searchTerm vào dependency


    // --- phân tang Logic ---
    const totalPages = Math.ceil(filteredAndSortedBaoHongList.length / rowsPerPage);
    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const currentRows = useMemo(() => {
        return filteredAndSortedBaoHongList.slice(indexOfFirstRow, indexOfLastRow);
    }, [filteredAndSortedBaoHongList, indexOfFirstRow, indexOfLastRow]);


    // --- Handlers ---
    const handleFilterChange = (e) => {
        setFilter(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setCurrentPage(1); // Reset về trang 1 khi filter
    };

    const handleDateSortChange = (sortOrder) => setFilter(prev => ({ ...prev, dateOrder: sortOrder }));
    const toggleRow = (id) => setExpandedRows(prev => new Set(prev.has(id) ? [...prev].filter(x => x !== id) : [...prev, id]));
    // Handler chọn nhân viên cho một báo hỏng cụ thể
    const handleAssigneeChange = (baoHongId, nhanVienId) => {
        setSelectedAssignee(prev => ({
            ...prev,
            [baoHongId]: parseInt(nhanVienId) || null // Lưu ID hoặc null nếu chọn "Chưa gán"
        }));
    };

    // Xử lý check box (Cần điều chỉnh để hoạt động đúng với Set và phân trang)
    useEffect(() => {
        // Kiểm tra xem tất cả các hàng *hiện tại* có được chọn không
        const allCurrentRowsSelected = currentRows.length > 0 && currentRows.every(item => selectedRows.has(item.id));
        setSelectAll(allCurrentRowsSelected);
    }, [selectedRows, currentRows]); // Chạy lại khi selectedRows hoặc currentRows thay đổi

    const handleSelectAll = (e) => {
        const isChecked = e.target.checked;
        setSelectAll(isChecked);
        setSelectedRows(prevSelected => {
            const newSelected = new Set(prevSelected);
            if (isChecked) {
                // Chọn tất cả các dòng đang hiển thị trên trang hiện tại
                currentRows.forEach(item => newSelected.add(item.id));
            } else {
                // Bỏ chọn tất cả các dòng đang hiển thị trên trang hiện tại
                currentRows.forEach(item => newSelected.delete(item.id));
            }
            return newSelected;
        });
    };

    const toggleRowSelection = (id) => {
        setSelectedRows(prevSelected => {
            const newSelected = new Set(prevSelected);
            if (newSelected.has(id)) newSelected.delete(id);
            else newSelected.add(id);
            return newSelected;
        });
    };

    const deleteMutation = useMutation({
        mutationFn: deleteBaoHongAPI, // Hàm API sẽ được gọi với baoHongId
        onSuccess: (data, baoHongId) => {
            queryClient.invalidateQueries({ queryKey: ['baoHongList'] });
            setSelectedRows(prev => {
                const newSelected = new Set(prev);
                newSelected.delete(baoHongId); // Xóa khỏi danh sách chọn nếu có
                return newSelected;
            });
            alert('Xóa báo hỏng thành công!'); // Hoặc dùng thư viện toast/notification
        },
        onError: (error) => {
            console.error("Lỗi khi xóa báo hỏng:", error);
            alert('Lỗi khi xóa báo hỏng: ' + (error.response?.data?.error || error.message));
        }
    });

    const handleDelete = (baoHongId) => {
        if (window.confirm(`Bạn có chắc muốn xóa báo hỏng ID ${baoHongId}?`)) {
            deleteMutation.mutate(baoHongId);
        }
    };

    const updateStatusMutation = useMutation({
        mutationFn: updateBaoHongAPI, // Gọi API update, nhận vào { id, updateData }
        onSuccess: (data, variables) => { // variables chứa { id, updateData } đã gửi đi
            // Làm mới lại danh sách báo hỏng
            queryClient.invalidateQueries({ queryKey: ['baoHongList'] });
            console.log(`Cập nhật trạng thái cho ID ${variables.id} thành công.`);
            // Reset người chọn cho dòng đó sau khi duyệt thành công
            setSelectedAssignee(prev => {
                const newState = { ...prev };
                delete newState[variables.id];
                return newState;
            });
            alert('Đã duyệt/cập nhật báo hỏng!');
        },
        onError: (error, variables) => {
            console.error(`Lỗi khi cập nhật trạng thái cho ID ${variables.id}:`, error);
            alert('Lỗi khi duyệt/cập nhật báo hỏng: ' + (error.response?.data?.error || error.message));
        }
    });

    const handleApprove = (item) => {
        // Lấy ID nhân viên đã chọn trong select hoặc ID gợi ý
        const nhanVienIdToApprove = selectedAssignee[item.id] || item.suggested_nhanvien_id;

        if (!nhanVienIdToApprove) {
            alert("Vui lòng chọn nhân viên xử lý hoặc đảm bảo có nhân viên được gợi ý.");
            return;
        }

        setApproveData({
            baoHongId: item.id,
            nhanVienId: parseInt(nhanVienIdToApprove), // Đảm bảo là số nguyên
            phongName: item.phong_name,
            ghiChuAdmin: '', // Reset ghi chú cũ nếu có
        });
        setIsApproveModalOpen(true); // Mở modal xác nhận duyệt
    };

    const handleCancel = (baoHongId, currentStatus) => {
        if (window.confirm(`Bạn có chắc muốn hủy lệnh cho báo hỏng ID "${baoHongId}" (đang ở trạng thái "${currentStatus}"')?`)) {
            updateStatusMutation.mutate({
                id: baoHongId,
                updateData: { action: 'cancel' } // Gửi tín hiệu hủy lệnh
            });
        }
    };

    // --- Render ---
    const isLoading = isLoadingBaoHong || isLoadingPhong || isLoadingNhanVien;

    return (
        <div className="flex flex-col w-full h-screen min-h-screen overflow-auto bg-white border-r shadow-md">
            {/* Header */}
            <div className="flex flex-col bg-white shadow-md">
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white border-b"> {/* Cho phép wrap và thêm gap */}
                    <h2 className="text-xl font-semibold">Thông Tin Báo Hỏng</h2>
                    {/* Thanh tìm kiếm */}
                    <div className="relative flex-grow max-w-xs">
                        <input
                            type="text"
                            name="searchTerm"
                            placeholder="Tìm mô tả, thiết bị, phòng..."
                            value={filter.searchTerm}
                            onChange={handleFilterChange}
                            className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                        <FaSearch className="absolute text-gray-400 transform -translate-y-1/2 top-1/2 left-3" />
                    </div>
                    {/* Nút hành động hàng loạt */}
                    <div>
                        <button
                            className="px-3 py-1 text-sm text-white bg-red-500 rounded hover:bg-red-600 disabled:bg-gray-400"
                            disabled={selectedRows.size === 0 || deleteMutation.isPending}
                            onClick={() => {
                                if (window.confirm(`Bạn có chắc muốn xóa ${selectedRows.size} mục đã chọn?`)) {
                                    // TODO: Gọi API xóa hàng loạt
                                    console.log("TODO: Delete Selected Rows:", Array.from(selectedRows));
                                    // deleteBulkMutation.mutate(Array.from(selectedRows));
                                }
                            }}
                        >
                            Xóa mục đã chọn ({selectedRows.size})
                        </button>
                        {/* TODO: Thêm nút Gán hàng loạt */}
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="p-4 bg-white border-b">
                <div className="flex flex-wrap mb-4 gap-x-4 gap-y-2">
                    {/* Dropdown Phòng */}
                    <div className="w-40"> {/* Giảm width */}
                        <label className="block text-xs font-medium text-gray-700">Phòng</label>
                        <select name="phong_id" value={filter.phong_id} onChange={handleFilterChange} className="w-full px-2 py-1 mt-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" disabled={isLoadingPhong}>
                            <option value="">Tất cả</option>
                            {phongList.map(phong => <option key={phong.id} value={phong.id}>{phong.phong}</option>)}
                        </select>
                    </div>
                    {/* Dropdown Loại Thiệt Hại */}
                    <div className="w-40">
                        <label className="block text-xs font-medium text-gray-700">Loại Thiệt Hại</label>
                        <select name="loaithiethai" value={filter.loaithiethai} onChange={handleFilterChange} className="w-full px-2 py-1 mt-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                            {/* ... options ... */}
                            <option value="">Tất cả</option>
                            <option value="Kết Cấu">Kết Cấu</option>
                            <option value="Hệ Thống Điện">Hệ Thống Điện</option>
                            <option value="Hệ Thống Nước">Hệ Thống Nước</option>
                            <option value="Các Loại Thiết Bị">Các Loại Thiết Bị</option>
                            <option value="Khác">Khác</option>
                        </select>
                    </div>
                    {/* Dropdown Mức Độ Thiệt Hại */}
                    <div className="w-40">
                        <label className="block text-xs font-medium text-gray-700">Mức Độ</label>
                        <select name="thiethai" value={filter.thiethai} onChange={handleFilterChange} className="w-full px-2 py-1 mt-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                            {/* ... options ... */}
                            <option value="">Tất cả</option>
                            <option value="Nhẹ">Nhẹ</option>
                            <option value="Vừa">Vừa</option>
                            <option value="Nặng">Nặng</option>
                        </select>
                    </div>
                    {/* Dropdown Trạng Thái */}
                    <div className="w-40">
                        <label className="block text-xs font-medium text-gray-700">Trạng Thái</label>
                        <select name="trangThai" value={filter.trangThai} onChange={handleFilterChange} className="w-full px-2 py-1 mt-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                            {/* ... options ... */}
                            <option value="">Tất cả</option>
                            <option value="Chờ Duyệt">Chờ Duyệt</option>
                            <option value="Đã Duyệt">Đã Duyệt</option>
                            <option value="Hoàn Thành">Hoàn Thành</option>
                            <option value="Không Thể Hoàn Thành">Không Thể Hoàn Thành</option>
                        </select>
                    </div>
                    {/* BỎ LỌC ƯU TIÊN */}
                    {/* Lọc Ngày Cụ Thể */}
                    <div className="w-40">
                        <label className="block text-xs font-medium text-gray-700">Ngày Báo</label>
                        <input type="date" name="specificDate" value={filter.specificDate || ''} onChange={handleFilterChange} className="w-full px-2 py-1 mt-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="flex-grow p-4 overflow-x-auto">
                {isLoading && <p className="text-center text-gray-500">Đang tải...</p>}
                {isErrorBaoHong && <p className="text-center text-red-500">Lỗi tải dữ liệu!</p>}
                {!isLoading && !isErrorBaoHong && (
                    <>
                        <div className="overflow-y-auto" style={{ maxHeight: "calc(100vh - 350px)" }}> {/* Điều chỉnh chiều cao */}
                            <table className="min-w-full border border-collapse border-gray-300 divide-y divide-gray-200">
                                <thead className="sticky top-0 z-10 bg-gray-100"> {/* Thêm z-index */}
                                    <tr>
                                        <th className="px-3 py-2 text-xs font-medium tracking-wider text-center text-gray-500 uppercase border">
                                            <input type="checkbox" title='Chọn tất cả trang này' checked={selectAll} onChange={handleSelectAll} disabled={currentRows.length === 0} />
                                        </th>
                                        <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase border">STT</th>
                                        <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase border">Phòng</th>
                                        <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase border">
                                            <div className='flex items-center'>Ngày Báo <button onClick={() => handleDateSortChange(filter.dateOrder === 'newest' ? 'oldest' : 'newest')} className="ml-1 text-gray-600 hover:text-gray-900">{filter.dateOrder === 'newest' ? <FaChevronDown /> : <FaChevronUp />}</button></div>
                                        </th>
                                        <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase border">Loại Thiệt Hại</th>
                                        <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase border">Mức Độ</th>
                                        {/* BỎ CỘT ƯU TIÊN */}
                                        <th className="px-3 py-2 text-xs font-medium tracking-wider text-center text-gray-500 uppercase border">Trạng Thái</th>
                                        <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase border">Người Xử Lý</th>
                                        <th className="px-3 py-2 text-xs font-medium tracking-wider text-center text-gray-500 uppercase border">Hành Động</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {currentRows.length === 0 && (
                                        <tr><td colSpan="9" className="px-4 py-4 text-center text-gray-500 border">Không có dữ liệu.</td></tr>
                                    )}
                                    {currentRows.map((item, index) => (
                                        <React.Fragment key={item.id}>
                                            <tr className={`hover:bg-gray-50 ${expandedRows.has(item.id) ? 'bg-gray-50' : ''}`}>
                                                <td className="px-3 py-2 text-center border whitespace-nowrap">
                                                    <input type="checkbox" checked={selectedRows.has(item.id)} onChange={() => toggleRowSelection(item.id)} />
                                                </td>
                                                <td className="px-3 py-2 text-sm text-gray-500 border whitespace-nowrap">{indexOfFirstRow + index + 1}</td>
                                                <td className="px-3 py-2 text-sm font-medium text-gray-900 border whitespace-nowrap">{item.phong_name}</td>
                                                <td className="px-3 py-2 text-sm text-gray-500 border whitespace-nowrap">{moment(item.ngayBaoHong).format("DD/MM/YYYY HH:mm")}</td>
                                                <td className="px-3 py-2 text-sm text-gray-500 border whitespace-nowrap">{item.loaithiethai}</td>
                                                <td className="px-3 py-2 text-sm text-gray-500 border whitespace-nowrap">{item.thiethai}</td>
                                                {/* BỎ CỘT ƯU TIÊN */}
                                                <td className="px-3 py-2 text-center border whitespace-nowrap"><StatusBadge status={item.trangThai} /></td>
                                                {/* Người Xử Lý / Chọn Người Xử Lý */}
                                                <td className="px-3 py-2 text-sm text-gray-500 border whitespace-nowrap">
                                                    {item.trangThai === 'Chờ Duyệt' ? (
                                                        <select
                                                            value={selectedAssignee[item.id] ?? item.suggested_nhanvien_id ?? ""}
                                                            onChange={(e) => handleAssigneeChange(item.id, e.target.value)}
                                                            disabled={isLoadingNhanVien || (updateStatusMutation.isPending && updateStatusMutation.variables?.id === item.id)}
                                                            className={`w-full px-2 py-1 text-xs border rounded ${!item.suggested_nhanvien_id ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300'}`}
                                                            title={item.suggested_nhanvien_name ? `Gợi ý: ${item.suggested_nhanvien_name}` : "Chọn NV hoặc để trống nếu chưa duyệt"}
                                                        >
                                                            <option value="">-- Chọn NV --</option>
                                                            {item.suggested_nhanvien_id && (
                                                                <option value={item.suggested_nhanvien_id}>{item.suggested_nhanvien_name} (Gợi ý)</option>
                                                            )}
                                                            {nhanVienList
                                                                .filter(nv => nv.id !== item.suggested_nhanvien_id)
                                                                .map(nv => <option key={nv.id} value={nv.id}>{nv.hoTen}</option>)
                                                            }
                                                        </select>
                                                    ) : (
                                                        // Hiển thị tên NV đã gán nếu trạng thái khác "Chờ Duyệt"
                                                        item.tenNhanVienXuLy || <span className="italic text-gray-400">Chưa gán</span>
                                                    )}
                                                </td>
                                                {/* Hành động */}
                                                <td className="px-3 py-2 text-sm font-medium text-center border whitespace-nowrap">
                                                    <div className='flex items-center justify-center space-x-2'>

                                                        {/* 1. Xem chi tiết (Luôn hiển thị) */}
                                                        <button
                                                            onClick={() => toggleRow(item.id)}
                                                            className="text-gray-600 hover:text-indigo-900"
                                                            title={expandedRows.has(item.id) ? "Thu gọn" : "Xem chi tiết"}
                                                        >
                                                            <FaEye />
                                                        </button>

                                                        {/* 2. Xem Log Bảo trì (Enable khi có log) */}
                                                        <button
                                                            onClick={() => {
                                                                setViewingLogFor(item.id);
                                                                setPhongNameForModal(item.phong_name);
                                                            }}
                                                            className={`
                            ${!!item.coLogBaoTri ? 'text-purple-600 hover:text-purple-900' : 'text-gray-400 cursor-not-allowed'}
                        `}
                                                            title={!!item.coLogBaoTri ? "Xem lịch sử bảo trì" : "Chưa có lịch sử bảo trì"}
                                                            disabled={!item.coLogBaoTri} // Disable nếu không có log (coLogBaoTri là 0 hoặc false)
                                                        >
                                                            <FaHistory />
                                                        </button>

                                                        {/* 3. Duyệt và Gán (Enable khi 'Chờ Duyệt') */}
                                                        <button
                                                            onClick={() => handleApprove(item)}
                                                            className={`
                            ${item.trangThai === 'Chờ Duyệt' ? 'text-green-600 hover:text-green-900' : 'text-gray-400 cursor-not-allowed'}
                            ${updateStatusMutation.isPending && updateStatusMutation.variables?.id === item.id ? 'opacity-50' : ''}
                        `}
                                                            title={item.trangThai === 'Chờ Duyệt' ? "Duyệt và Gán" : "Không thể duyệt ở trạng thái này"}
                                                            disabled={
                                                                item.trangThai !== 'Chờ Duyệt' ||
                                                                (!selectedAssignee[item.id] && !item.suggested_nhanvien_id) ||
                                                                (updateStatusMutation.isPending && updateStatusMutation.variables?.id === item.id)
                                                            }
                                                        >
                                                            <FaUserCheck />
                                                        </button>


                                                        {/* 4. Yêu cầu làm lại / Duyệt lại (Enable khi Hoàn thành hoặc Không thể HT) */}
                                                        <button
                                                            onClick={() => {
                                                                setReassignData({
                                                                    baoHongId: item.id,
                                                                    nhanVienId: item.nhanvien_id || '',
                                                                    ghiChuAdmin: item.ghiChuAdmin || ''
                                                                });
                                                                setIsReassignModalOpen(true);
                                                            }}
                                                            className={`
                            ${(item.trangThai === 'Hoàn Thành' || item.trangThai === 'Không Thể Hoàn Thành') ? 'text-orange-500 hover:text-orange-700' : 'text-gray-400 cursor-not-allowed'}
                        `}
                                                            title={(item.trangThai === 'Hoàn Thành' || item.trangThai === 'Không Thể Hoàn Thành') ? "Yêu cầu làm lại / Duyệt lại" : "Không thể yêu cầu làm lại ở trạng thái này"}
                                                            disabled={!(item.trangThai === 'Hoàn Thành' || item.trangThai === 'Không Thể Hoàn Thành')}
                                                        >
                                                            <FaUndo />
                                                        </button>


                                                        {/* 5. Nút Hủy Lệnh (Hiển thị khi Đã duyệt, Đang tiến hành, Yêu cầu làm lại) */}
                                                        <button
                                                            onClick={() => handleCancel(item.id, item.trangThai)}
                                                            className={`
                 ${(item.trangThai === 'Đã Duyệt' || item.trangThai === 'Đang Tiến Hành' || item.trangThai === 'Yêu Cầu Làm Lại')
                                                                    ? 'text-yellow-600 hover:text-yellow-800'
                                                                    : 'text-gray-400 cursor-not-allowed'
                                                                }
                 ${updateStatusMutation.isPending && updateStatusMutation.variables?.id === item.id ? 'opacity-50' : ''}
             `}
                                                            title={
                                                                (item.trangThai === 'Đã Duyệt' || item.trangThai === 'Đang Tiến Hành' || item.trangThai === 'Yêu Cầu Làm Lại')
                                                                    ? "Hủy lệnh và đặt lại trạng thái"
                                                                    : `Không thể hủy lệnh ở trạng thái '${item.trangThai}'`
                                                            }
                                                            disabled={
                                                                !(item.trangThai === 'Đã Duyệt' || item.trangThai === 'Đang Tiến Hành' || item.trangThai === 'Yêu Cầu Làm Lại') ||
                                                                (updateStatusMutation.isPending && updateStatusMutation.variables?.id === item.id)
                                                            }
                                                        >
                                                            <FaBan />
                                                        </button>

                                                        {/* 6. Xóa */}
                                                        <button
                                                            onClick={() => handleDelete(item.id)}
                                                            className={`${item.trangThai === 'Đang Tiến Hành' || (deleteMutation.isPending && deleteMutation.variables === item.id)
                                                                ? 'text-gray-400 cursor-not-allowed opacity-50'
                                                                : 'text-red-600 hover:text-red-900'
                                                                }`}
                                                            title={item.trangThai === 'Đang Tiến Hành' || (deleteMutation.isPending && deleteMutation.variables === item.id) ? "Không thể xóa ở trạng thái này" : "Xóa"}
                                                            disabled={item.trangThai === 'Đang Tiến Hành' || (deleteMutation.isPending && deleteMutation.variables === item.id)}
                                                        >
                                                            <FaTrashAlt />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                            {/* Bảng con hiển thị chi tiết */}
                                            {expandedRows.has(item.id) && (
                                                <tr className="bg-gray-50">
                                                    <td colSpan="9" className="px-6 py-3 border"> {/* Tăng colSpan */}
                                                        <div className='text-sm text-gray-700'>
                                                            {/* Hiển thị Tên Thiết Bị nếu có */}
                                                            {item.tenThietBi && <p><strong>Thiết bị cụ thể:</strong> {item.tenThietBi} (ID: {item.thietbi_id}, MDD: {item.thongtinthietbi_id})</p>}
                                                            <p className="mt-1"><strong>Mô Tả:</strong> {item.moTa || "Không có mô tả"}</p>
                                                            <p className="mt-2"><strong>Hình Ảnh:</strong></p>
                                                            {item.hinhAnh ? (
                                                                <button onClick={() => setModalImage(item.hinhAnh)} className="mt-1 border rounded hover:opacity-80">
                                                                    <img src={item.hinhAnh} alt="Hình ảnh báo hỏng" className="object-contain max-h-40" />
                                                                </button>
                                                            ) : (
                                                                <span className='italic'>Không có hình ảnh</span>
                                                            )}
                                                            {/* TODO: Thêm Log Bảo trì */}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {/* Pagination */}
                        <div className="flex items-center justify-between mt-4">
                            <div>Trang {currentPage}/{totalPages} (Tổng {filteredAndSortedBaoHongList.length})</div>
                            <div className="flex space-x-2">
                                <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-3 py-1 text-sm text-white bg-blue-500 rounded hover:bg-blue-600 disabled:bg-gray-300">Trước</button>
                                <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="px-3 py-1 text-sm text-white bg-blue-500 rounded hover:bg-blue-600 disabled:bg-gray-300">Tiếp</button>
                            </div>
                        </div>
                    </>
                )}
            </div>
            {/* Modal xem ảnh */}
            <ImageModal imageUrl={modalImage} onClose={() => setModalImage(null)} />

            {/* Modal Xem Log Bảo trì */}
            {viewingLogFor && (
                <ModalXemLogBaoTri
                    baoHongId={viewingLogFor}
                    phongName={phongNameForModal}
                    onClose={() => {
                        setViewingLogFor(null);
                        setPhongNameForModal("");
                    }}
                />
            )}

            {/* Modal Yêu cầu làm lại / Duyệt lại */}
            {isReassignModalOpen && reassignData.baoHongId && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black bg-opacity-50"> {/* Tăng z-index nếu cần */}
                    <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-xl">
                        <h3 className="mb-4 text-lg font-semibold">Yêu cầu làm lại / Duyệt lại (ID: {reassignData.baoHongId})</h3>
                        {/* Chọn lại nhân viên */}
                        <div className="mb-4">
                            <label className="block mb-1 text-sm font-medium">Gán lại cho nhân viên:</label>
                            <select
                                value={reassignData.nhanVienId || ""}
                                onChange={(e) => setReassignData(prev => ({ ...prev, nhanVienId: e.target.value ? parseInt(e.target.value) : null }))}
                                disabled={isLoadingNhanVien || updateStatusMutation.isPending}
                                className={`w-full px-2 py-1 text-sm border rounded ${isLoadingNhanVien ? 'bg-gray-100' : 'border-gray-300'}`}
                            >
                                <option value="">-- Chọn lại nhân viên (bắt buộc) --</option> {/* Bắt buộc chọn lại */}
                                {nhanVienList.map(nv => <option key={nv.id} value={nv.id}>{nv.hoTen}</option>)}
                            </select>
                        </div>
                        {/* Ghi chú của Admin */}
                        <div className="mb-4">
                            <label className="block mb-1 text-sm font-medium">Ghi chú cho nhân viên (tùy chọn):</label>
                            <textarea
                                value={reassignData.ghiChuAdmin}
                                onChange={(e) => setReassignData(prev => ({ ...prev, ghiChuAdmin: e.target.value }))}
                                className="w-full p-2 border rounded-md min-h-[80px]"
                                placeholder="Nhập lý do yêu cầu làm lại hoặc ghi chú khác..."
                            />
                        </div>
                        {/* Nút hành động */}
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setIsReassignModalOpen(false)}
                                disabled={updateStatusMutation.isPending}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={() => {
                                    if (!reassignData.nhanVienId) {
                                        alert("Vui lòng chọn nhân viên để gán lại.");
                                        return;
                                    }
                                    updateStatusMutation.mutate({
                                        id: reassignData.baoHongId,
                                        updateData: {
                                            trangThai: 'Đã Duyệt', // Luôn quay về Đã Duyệt khi admin duyệt lại
                                            nhanvien_id: reassignData.nhanVienId,
                                            ghiChuAdmin: reassignData.ghiChuAdmin || null
                                        }
                                    });
                                    setIsReassignModalOpen(false); // Đóng modal sau khi gọi mutate
                                }}
                                disabled={!reassignData.nhanVienId || updateStatusMutation.isPending}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                            >
                                {updateStatusMutation.isPending ? 'Đang xử lý...' : 'Xác nhận Duyệt lại'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* === Modal Xác nhận Duyệt và Gán === */}
            {isApproveModalOpen && approveData.baoHongId && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black bg-opacity-50">
                    <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-xl">
                        <h3 className="mb-4 text-lg font-semibold">Xác nhận Duyệt và Gán</h3>
                        <p className="mb-2 text-sm">Duyệt báo hỏng ID <span className='font-bold'>{approveData.baoHongId}</span> ({approveData.phongName}) cho nhân viên:</p>
                        {/* Hiển thị tên nhân viên được chọn */}
                        <p className='pl-4 mb-4 font-medium text-blue-700'>
                            {nhanVienList.find(nv => nv.id === approveData.nhanVienId)?.hoTen || 'Không tìm thấy tên'}
                        </p>

                        {/* Ghi chú của Admin (Tùy chọn) */}
                        <div className="mb-4">
                            <label htmlFor="adminNoteApprove" className="block mb-1 text-sm font-medium">Ghi chú cho nhân viên (tùy chọn):</label>
                            <textarea
                                id="adminNoteApprove"
                                value={approveData.ghiChuAdmin}
                                onChange={(e) => setApproveData(prev => ({ ...prev, ghiChuAdmin: e.target.value }))}
                                className="w-full p-2 border rounded-md min-h-[80px]"
                                placeholder="Nhập yêu cầu cụ thể hoặc lưu ý cho nhân viên..."
                            />
                        </div>

                        {/* Nút hành động */}
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setIsApproveModalOpen(false)}
                                disabled={updateStatusMutation.isPending}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={() => {
                                    updateStatusMutation.mutate({
                                        id: approveData.baoHongId,
                                        updateData: {
                                            trangThai: 'Đã Duyệt',
                                            nhanvien_id: approveData.nhanVienId,
                                            ghiChuAdmin: approveData.ghiChuAdmin.trim() || null // Gửi null nếu ghi chú rỗng
                                        }
                                    });
                                    setIsApproveModalOpen(false); // Đóng modal sau khi gọi mutate
                                }}
                                disabled={updateStatusMutation.isPending}
                                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-400"
                            >
                                {updateStatusMutation.isPending ? 'Đang xử lý...' : 'Xác nhận Duyệt'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* === Kết thúc Modal === */}
        </div>
    );
};



export default ThongTinBaoHong;