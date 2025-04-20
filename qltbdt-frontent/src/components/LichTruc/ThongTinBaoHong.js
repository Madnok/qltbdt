import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { FaChevronDown, FaChevronUp, FaEye, FaTrashAlt, FaCheckCircle, FaHistory, FaUndo, FaUserCheck, FaSearch, FaBan } from "react-icons/fa";
import moment from "moment";
import { getTinhTrangLabel } from '../../utils/constants';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ModalXemLogBaoTri from './ModalXemLogBaoTri';
import { toast } from 'react-toastify';
import eventBus from '../../utils/eventBus';

import {
    fetchBaoHongListAPI,
    fetchPhongList,
    fetchNhanVienList,
    deleteBaoHongAPI,
    updateBaoHongAPI
} from '../../api';

// Helper Components cho Badges 
const StatusBadge = ({ status }) => {
    let colorClasses = 'bg-gray-100 text-gray-800';
    if (status === 'Đã Duyệt') { colorClasses = 'bg-blue-100 text-blue-800'; }
    else if (status === 'Hoàn Thành') { colorClasses = 'bg-green-100 text-green-800'; }
    else if (status === 'Đang Tiến Hành') { colorClasses = 'bg-yellow-100 text-yellow-800'; }
    else if (status === 'Chờ Xem Xét') { colorClasses = 'bg-purple-100 text-purple-800'; }
    else if (status === 'Chờ Hoàn Tất Bảo Hành') { colorClasses = 'bg-orange-100 text-orange-800'; }
    else if (status === 'Không Thể Hoàn Thành') { colorClasses = 'bg-red-100 text-red-800'; }
    else if (status === 'Yêu Cầu Làm Lại') { colorClasses = 'bg-pink-100 text-pink-800'; }
    return (<span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClasses}`}>{status}</span>);
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

const getDeviceStatusColor = (status) => {
    switch (status) {
        case 'con_bao_hanh':
            return 'text-green-700';
        case 'da_bao_hanh':
            return 'text-teal-400';
        case 'dang_bao_hanh':
            return 'text-blue-700';
        case 'het_bao_hanh':
            return 'text-red-700';
        case 'hong':
        case 'mat':
            return 'text-red-700 font-semibold';
        case 'de_xuat_thanh_ly':
        case 'cho_thanh_ly':
            return 'text-orange-700';
        case 'da_thanh_ly':
            return 'text-red-800 line-through';
        default:
            return 'text-gray-500 italic';
    }
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
    // const [viewingLogFor, setViewingLogFor] = useState(null); // Lưu ID báo hỏng đang xem log
    // const [phongNameForModal, setPhongNameForModal] = useState("");
    const [reassignData, setReassignData] = useState({ baoHongId: null, nhanVienId: null, ghiChuAdmin: '' });
    const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
    const [approveData, setApproveData] = useState({ baoHongId: null, nhanVienId: null, phongName: '', ghiChuAdmin: '' });
    const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
    const [finalDeviceStatuses, setFinalDeviceStatuses] = useState({});
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [cancelData, setCancelData] = useState({
        baoHongId: null,
        currentStatus: '',
        assignedTechName: '', // Tên NV đang gán (nếu có)
        reason: '' // Lý do hủy
    });
    const [isConfirmCompleteModalOpen, setIsConfirmCompleteModalOpen] = useState(false);
    const [confirmCompleteData, setConfirmCompleteData] = useState({
        baoHongId: null,
        originalDeviceStatus: null, // Lưu trạng thái TTTB gốc khi mở modal
    });
    const [viewingDeviceHistory, setViewingDeviceHistory] = useState({
        thongtinthietbiId: null,
        tenThietBi: null,
        phongName: null,
    });

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

    // Lắng nghe sự kiện báo hỏng mới -----
    useEffect(() => {
        const handleNewBaoHong = () => {
            console.log("Received 'baoHongSubmitted' event. Invalidating baoHongList query.");
            queryClient.invalidateQueries({ queryKey: ['baoHongList'] });
        };

        eventBus.on('baoHongSubmitted', handleNewBaoHong);
        console.log("Event listener for 'baoHongSubmitted' registered.");

        return () => {
            eventBus.off('baoHongSubmitted', handleNewBaoHong);
        };
    }, [queryClient]);

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
                item.trangThai?.toLowerCase().includes(termLower) ||
                item.tenNhanVienXuLy?.toLowerCase().includes(termLower) ||
                (item.tinhTrang && getTinhTrangLabel(item.tinhTrang)?.toLowerCase().includes(termLower)) // Tìm theo tình trạng TB
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
    }, [baoHongList, filter, phongMap]);


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
    const handleAssigneeChange = useCallback((baoHongId, nhanVienIdValue) => {
        const finalIdToStore = nhanVienIdValue ? parseInt(nhanVienIdValue, 10) : null;
        const assigneeId = isNaN(finalIdToStore) ? null : finalIdToStore;
        setSelectedAssignee(prev => ({
            ...prev,
            [baoHongId]: assigneeId
        }));
    }, []);

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
            toast.success(data?.message || 'Xóa báo hỏng thành công!');
        },
        onError: (error) => {
            console.error("Lỗi khi xóa báo hỏng:", error);
            toast.error('Lỗi khi xóa báo hỏng: ' + (error.response?.data?.message || error.message));
        }
    });

    const handleDelete = (baoHongId) => {
        if (window.confirm(`Bạn có chắc muốn xóa báo hỏng ID ${baoHongId}? Hành động này sẽ tạo log bảo trì (nếu có) trước khi xóa.`)) {
            deleteMutation.mutate(baoHongId);
        }
    };

    const updateStatusMutation = useMutation({
        mutationFn: updateBaoHongAPI,
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['baoHongList'] });
            if (isApproveModalOpen && approveData.baoHongId === variables.id) setIsApproveModalOpen(false);
            if (isReassignModalOpen && reassignData.baoHongId === variables.id) setIsReassignModalOpen(false);
            if (isCancelModalOpen && cancelData.baoHongId === variables.id) setIsCancelModalOpen(false);
            if (isConfirmCompleteModalOpen && confirmCompleteData.baoHongId === variables.id) setIsConfirmCompleteModalOpen(false);
            toast.success(data?.message || 'Cập nhật thành công!');
            setSelectedAssignee(prev => { const newState = { ...prev }; delete newState[variables.id]; return newState; });
        },
        onError: (error, variables) => {
            console.error(`Lỗi khi cập nhật trạng thái cho ID ${variables.id}:`, error);
            toast.error('Lỗi khi cập nhật: ' + (error.response?.data?.message || error.message));
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

    const handleCancel = (item) => {
        // Log dữ liệu của dòng được chọn
        console.log("handleCancel triggered for item:", JSON.stringify(item, null, 2));
        // Log trạng thái của danh sách nhân viên tại thời điểm đó
        console.log("Is nhanVienList available?", Array.isArray(nhanVienList) && nhanVienList.length > 0);

        const assignedTech = Array.isArray(nhanVienList)
            ? nhanVienList.find(nv => nv.id === item.nhanvien_id)
            : null; // Tìm kiếm an toàn hơn

        console.log("Assigned technician found:", assignedTech);

        // Cập nhật state cho modal - Sử dụng optional chaining (?.) để phòng trường hợp item thiếu field
        setCancelData({
            baoHongId: item?.id ?? 'Không xác định', // Dùng ?? để có giá trị mặc định nếu id là null/undefined
            currentStatus: item?.trangThai ?? 'Không xác định',
            assignedTechName: assignedTech ? assignedTech.hoTen : (item?.nhanvien_id ? 'Không tìm thấy tên NV' : 'Chưa gán'), // Phân biệt chưa gán và không tìm thấy tên
            reason: ''
        });
        setIsCancelModalOpen(true);
    };

    const handleAdminComplete = (item) => {
        setConfirmCompleteData({
            baoHongId: item.id,
            originalDeviceStatus: item.tinhTrang
        });
        setIsConfirmCompleteModalOpen(true);
    };

    // Hàm xử lý khi admin yêu cầu làm lại từ trạng thái Chờ Xem Xét (mở modal reassign)
    const handleAdminRequestRework = (item) => {
        setReassignData({ baoHongId: item.id, nhanVienId: item.nhanvien_id || '', ghiChuAdmin: '' });
        setIsReassignModalOpen(true);
    };

    const handleFinalDeviceStatusChange = (baoHongId, newStatus) => {
        setFinalDeviceStatuses(prev => ({
            ...prev,
            [baoHongId]: newStatus
        }));
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
                            <option value="">Tất cả</option>
                            <option value="Hạ Tầng">Hạ Tầng</option>
                            <option value="Các Loại Thiết Bị">Các Loại Thiết Bị</option>
                            <option value="Khác">Khác</option>
                        </select>
                    </div>
                    {/* Dropdown Mức Độ Thiệt Hại */}
                    <div className="w-40">
                        <label className="block text-xs font-medium text-gray-700">Mức Độ</label>
                        <select name="thiethai" value={filter.thiethai} onChange={handleFilterChange} className="w-full px-2 py-1 mt-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
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
                            <option value="">Tất cả</option>
                            <option value="Chờ Duyệt">Chờ Duyệt</option>
                            <option value="Đã Duyệt">Đã Duyệt</option>
                            <option value="Đang Tiến Hành">Đang Tiến Hành</option>
                            <option value="Chờ Xem Xét">Chờ Xem Xét</option>
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
                        {/* Bảng dữ liệu */}
                        <div className="overflow-y-auto" style={{ maxHeight: "calc(100vh - 300px)" }}>
                            <table className="min-w-full border border-collapse border-gray-300 divide-y divide-gray-200">
                                <thead className="sticky top-0 z-10 bg-gray-100">
                                    <tr>
                                        <th className="px-3 py-2 text-xs font-medium tracking-wider text-center text-gray-500 uppercase border"><input type="checkbox" title='Chọn tất cả trang này' checked={selectAll} onChange={handleSelectAll} disabled={currentRows.length === 0} /></th>
                                        <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase border">STT</th>
                                        <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase border">Phòng</th>
                                        <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase border"><div className='flex items-center'>Ngày Báo <button onClick={() => handleDateSortChange(filter.dateOrder === 'newest' ? 'oldest' : 'newest')} className="ml-1 text-gray-600 hover:text-gray-900">{filter.dateOrder === 'newest' ? <FaChevronDown /> : <FaChevronUp />}</button></div></th>
                                        <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase border">Loại Thiệt Hại</th>
                                        <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase border">Mức Độ</th>
                                        <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase border">Phương án xử lý</th>
                                        <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase border">Tình trạng TB</th>
                                        <th className="px-3 py-2 text-xs font-medium tracking-wider text-center text-gray-500 uppercase border">Trạng Thái Task</th>
                                        <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase border">Người Xử Lý</th>
                                        <th className="px-3 py-2 text-xs font-medium tracking-wider text-center text-gray-500 uppercase border">Hành Động</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {currentRows.length === 0 && (<tr><td colSpan="10" className="px-4 py-4 text-center text-gray-500 border">Không có dữ liệu.</td></tr>)}
                                    {currentRows.map((item, index) => {
                                        // Lấy giá trị từ state mới nhất
                                        const initialSelectValue = item.suggested_nhanvien_id ?? "";

                                        return (
                                            <React.Fragment key={item.id}>
                                                <tr className={`hover:bg-gray-50 ${expandedRows.has(item.id) ? 'bg-gray-50' : ''}`}>
                                                    <td className="px-3 py-2 text-center border whitespace-nowrap"><input type="checkbox" checked={selectedRows.has(item.id)} onChange={() => toggleRowSelection(item.id)} /></td>
                                                    <td className="px-3 py-2 text-sm text-gray-500 border whitespace-nowrap">{indexOfFirstRow + index + 1}</td>
                                                    <td className="px-3 py-2 text-sm font-medium text-gray-900 border whitespace-nowrap">{item.phong_name}</td>
                                                    <td className="px-3 py-2 text-sm text-gray-500 border whitespace-nowrap">{moment(item.ngayBaoHong).format("DD/MM/YYYY HH:mm")}</td>
                                                    <td className="px-3 py-2 text-sm text-gray-500 border whitespace-nowrap">{item.loaithiethai}</td>
                                                    <td className="px-3 py-2 text-sm text-gray-500 border whitespace-nowrap">{item.thiethai}</td>
                                                    <td className="px-3 py-2 text-sm text-gray-500 border whitespace-nowrap">{item.phuongAnXuLy || <span className="italic text-gray-400">Chưa có</span>}</td>
                                                    <td className={`px-3 py-2 text-sm border whitespace-nowrap font-medium ${getDeviceStatusColor(item.tinhTrang)}`}>
                                                        {item.tinhTrang ? getTinhTrangLabel(item.tinhTrang) : <span className="italic text-gray-400">Không Phải Thiết Bị</span>}
                                                    </td>
                                                    <td className="px-3 py-2 text-center border whitespace-nowrap"><StatusBadge status={item.trangThai} /></td>
                                                    <td className="px-3 py-2 text-sm text-gray-500 border whitespace-nowrap">
                                                        {item.trangThai === 'Chờ Duyệt' ? (
                                                            <select
                                                                defaultValue={initialSelectValue}
                                                                onChange={(e) => handleAssigneeChange(item.id, e.target.value)}
                                                                className={`w-full px-2 py-1 text-xs border rounded ${!item.suggested_nhanvien_id ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300'}`}
                                                                disabled={isLoadingNhanVien || (updateStatusMutation.isPending && updateStatusMutation.variables?.id === item.id)}
                                                                title={item.suggested_nhanvien_name ? `Gợi ý: ${item.suggested_nhanvien_name}` : "Chọn NV"}
                                                            >
                                                                {/* Option value dùng số */}
                                                                <option value="">-- Chọn NV --</option>
                                                                {item.suggested_nhanvien_id && (<option value={item.suggested_nhanvien_id}>{item.suggested_nhanvien_name} (Gợi ý)</option>)}
                                                                {nhanVienList
                                                                    .filter(nv => nv.id !== item.suggested_nhanvien_id)
                                                                    .map(nv => <option key={nv.id} value={nv.id}>{nv.hoTen}</option>)
                                                                }
                                                            </select>
                                                        ) : (item.tenNhanVienXuLy || <span className="italic text-gray-400">Chưa gán</span>)}
                                                    </td>
                                                    <td className="px-3 py-2 text-sm font-medium text-center border whitespace-nowrap">
                                                        <div className='flex items-center justify-center space-x-2'>
                                                            {/* 1. Xem chi tiết */}
                                                            <button onClick={() => toggleRow(item.id)} className="text-gray-600 hover:text-indigo-900" title={expandedRows.has(item.id) ? "Thu gọn" : "Xem chi tiết"}><FaEye /></button>
                                                            {/* 2. Xem Log Bảo trì */}
                                                            <button
                                                                onClick={() => {
                                                                    if (item.thongtinthietbi_id) {
                                                                        setViewingDeviceHistory({
                                                                            thongtinthietbiId: item.thongtinthietbi_id,
                                                                            // Lấy tên thiết bị từ dữ liệu item (cần đảm bảo API trả về tenThietBi)
                                                                            tenThietBi: item.tenThietBi || `Thiết bị ID: ${item.thongtinthietbi_id}`,
                                                                            phongName: item.phong_name || 'Không rõ phòng'
                                                                        });
                                                                    } else {
                                                                        toast.info("Báo hỏng này không liên kết với thiết bị cụ thể.");
                                                                    }
                                                                }}
                                                                // Chỉ bật khi có thongtinthietbi_id
                                                                disabled={!item.thongtinthietbi_id}
                                                                className={`${item.thongtinthietbi_id ? 'text-purple-600 hover:text-purple-900' : 'text-gray-400 cursor-not-allowed'}`}
                                                                title={item.thongtinthietbi_id ? "Xem toàn bộ lịch sử thiết bị" : "Không phải báo hỏng thiết bị"}
                                                            >
                                                                <FaHistory />
                                                            </button>

                                                            {/* --- ACTIONS CHO ADMIN --- */}
                                                            {/* 3. Duyệt và Gán (khi 'Chờ Duyệt') */}
                                                            <button
                                                                onClick={() => handleApprove(item)}
                                                                className={` ${updateStatusMutation.isPending && updateStatusMutation.variables?.id === item.id ? 'opacity-50' : ''}`}
                                                                title="Duyệt và Gán"
                                                                disabled={item.trangThai !== 'Chờ Duyệt' || (!selectedAssignee[item.id] && !item.suggested_nhanvien_id) || (updateStatusMutation.isPending && updateStatusMutation.variables?.id === item.id)}
                                                            >
                                                                <FaUserCheck className={item.trangThai === 'Chờ Duyệt' ? 'text-green-600 hover:text-green-900' : 'text-gray-400'} />
                                                            </button>

                                                            {/* 4. Xử lý "Chờ Xem Xét" */}
                                                            {item.trangThai === 'Chờ Xem Xét' && (item.tinhTrang === 'da_bao_hanh' || item.tinhTrang === 'de_xuat_thanh_ly') && (
                                                                <select
                                                                    value={finalDeviceStatuses[item.id] || ""}
                                                                    onChange={(e) => handleFinalDeviceStatusChange(item.id, e.target.value)}
                                                                    className={`px-1 py-0.5 text-xs border rounded ${finalDeviceStatuses[item.id] ? 'border-blue-500' : 'border-red-500 animate-pulse'}`} // Highlight nếu chưa chọn
                                                                    title={item.tinhTrang === 'da_bao_hanh' ? "Chọn trạng thái sau bảo hành" : "Xác nhận xử lý đề xuất thanh lý"}
                                                                >
                                                                    <option value="">-- Chọn TT TB --</option>
                                                                    {item.tinhTrang === 'da_bao_hanh' && (
                                                                        <>
                                                                            <option value="con_bao_hanh">Còn Bảo Hành</option>
                                                                            <option value="het_bao_hanh">Hết Bảo Hành</option>
                                                                        </>
                                                                    )}
                                                                    {item.tinhTrang === 'de_xuat_thanh_ly' && (
                                                                        <>
                                                                            <option value="cho_thanh_ly">Chờ Thanh Lý (Duyệt)</option>
                                                                            <option value="con_bao_hanh">Còn Bảo Hành (Từ chối)</option>
                                                                            <option value="het_bao_hanh">Hết Bảo Hành (Từ chối)</option>
                                                                        </>
                                                                    )}
                                                                </select>
                                                            )}
                                                            {/* 5. Nút Xác nhận Hoàn Thành */}
                                                            <button
                                                                onClick={() => handleAdminComplete(item)}
                                                                className={` ${updateStatusMutation.isPending && updateStatusMutation.variables?.id === item.id ? 'opacity-50' : ''}`}
                                                                title="Xác nhận hoàn thành công việc"
                                                                // Chỉ disable khi trạng thái không phải là Chờ Xem Xét hoặc đang có mutation chạy cho item này
                                                                disabled={!(item.trangThai === 'Chờ Xem Xét' || item.trangThai === 'Hoàn Thành') || (updateStatusMutation.isPending && updateStatusMutation.variables?.id === item.id)}
                                                            >
                                                                <FaCheckCircle className={(item.trangThai === 'Chờ Xem Xét' && !(updateStatusMutation.isPending && updateStatusMutation.variables?.id === item.id)) ? 'text-green-600 hover:text-green-900' : 'text-gray-400'} />
                                                            </button>

                                                            <button
                                                                onClick={() => handleAdminRequestRework(item)}
                                                                className={`
        ${(item.trangThai === 'Hoàn Thành' || item.trangThai === 'Không Thể Hoàn Thành' || item.trangThai === 'Chờ Xem Xét') && !(updateStatusMutation.isPending && updateStatusMutation.variables?.id === item.id)
                                                                        ? 'text-orange-500 hover:text-orange-700'
                                                                        : 'text-gray-400 cursor-not-allowed'
                                                                    }
        ${updateStatusMutation.isPending && updateStatusMutation.variables?.id === item.id ? 'opacity-50' : ''}
    `}
                                                                title="Yêu cầu làm lại / Duyệt lại"
                                                                disabled={!(item.trangThai === 'Hoàn Thành' || item.trangThai === 'Không Thể Hoàn Thành' || item.trangThai === 'Chờ Xem Xét') || (updateStatusMutation.isPending && updateStatusMutation.variables?.id === item.id)}
                                                            >
                                                                <FaUndo />
                                                            </button>

                                                            {/* 6. Nút Hủy Lệnh/Thu hồi */}
                                                            <button
                                                                onClick={() => handleCancel(item)}
                                                                className={`
        ${['Đã Duyệt', 'Đang Tiến Hành', 'Yêu Cầu Làm Lại', 'Chờ Hoàn Tất Bảo Hành', 'Chờ Xem Xét'].includes(item.trangThai) && !(updateStatusMutation.isPending && updateStatusMutation.variables?.id === item.id)
                                                                        ? 'text-yellow-600 hover:text-yellow-800'
                                                                        : 'text-gray-400 cursor-not-allowed'
                                                                    }
        ${updateStatusMutation.isPending && updateStatusMutation.variables?.id === item.id ? 'opacity-50' : ''} // Giảm độ mờ khi loading
    `}
                                                                title="Hủy/Thu hồi công việc"
                                                                disabled={!['Đã Duyệt', 'Đang Tiến Hành', 'Yêu Cầu Làm Lại', 'Chờ Hoàn Tất Bảo Hành', 'Chờ Xem Xét'].includes(item.trangThai) || (updateStatusMutation.isPending && updateStatusMutation.variables?.id === item.id)}
                                                            >
                                                                <FaBan />
                                                            </button>

                                                            {/* 7. Xóa */}
                                                            <button
                                                                onClick={() => handleDelete(item.id)}
                                                                className={` ${(item.trangThai === 'Chờ Duyệt' || item.trangThai === 'Hoàn Thành' )? 'text-red-600 hover:text-red-900' : 'text-gray-400 cursor-not-allowed'} ${(deleteMutation.isPending && deleteMutation.variables === item.id) ? 'opacity-50' : ''} `}
                                                                title={item.trangThai === 'Chờ Duyệt' ? "Xóa báo hỏng" : "Không thể xóa khi đang xử lý hoặc đã hoàn thành"}
                                                                disabled={!(item.trangThai === 'Chờ Duyệt' || item.trangThai === 'Hoàn Thành') || (deleteMutation.isPending && deleteMutation.variables === item.id)}
                                                            >
                                                                <FaTrashAlt />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                                {/* Bảng con chi tiết */}
                                                {expandedRows.has(item.id) && (
                                                    <tr className="bg-gray-50">
                                                        <td colSpan="10" className="px-6 py-3 border"> {/* Tăng colSpan */}
                                                            <div className='text-sm text-gray-700'>
                                                                {/* Hiển thị Tên Thiết Bị nếu có */}
                                                                {item.tenThietBi && <p><strong>Thiết bị cụ thể:</strong> {item.tenThietBi} {item.thongtinthietbi_id ? `(MĐD: ${item.thongtinthietbi_id})` : ''}</p>}
                                                                {/* Hiển thị Tình trạng TTTB */}
                                                                <p className="mt-1"><strong>Tình trạng thiết bị hiện tại:</strong> <span className="font-medium">{item.tinhTrang ? getTinhTrangLabel(item.tinhTrang) : 'N/A'}</span></p>
                                                                <p className="mt-1"><strong>Mô Tả:</strong> {item.moTa || "Không có mô tả"}</p>
                                                                <p className="mt-1"><strong>Hình Ảnh:</strong></p>
                                                                {item.hinhAnh ? (<button onClick={() => setModalImage(item.hinhAnh)} className="mt-1 border rounded hover:opacity-80"><img src={item.hinhAnh} alt="Hình ảnh báo hỏng" className="object-contain max-h-40" /></button>) : (<span className='italic'>Không có hình ảnh</span>)}
                                                                {/* Hiển thị Ghi chú Admin nếu có */}
                                                                {item.ghiChuAdmin && <p className="mt-1 text-red-600"><strong>Ghi chú Admin:</strong> {item.ghiChuAdmin}</p>}
                                                                {/* Hiển thị Ghi chú Xử lý nếu có */}
                                                                {item.ghiChuXuLy && <p className="mt-1 text-blue-600"><strong>Ghi chú Xử lý NV:</strong> {item.ghiChuXuLy}</p>}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
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
            {viewingDeviceHistory.thongtinthietbiId && (
                <ModalXemLogBaoTri
                    thongtinthietbiId={viewingDeviceHistory.thongtinthietbiId}
                    tenThietBi={viewingDeviceHistory.tenThietBi}
                    phongName={viewingDeviceHistory.phongName}
                    onClose={() => {
                        setViewingDeviceHistory({ thongtinthietbiId: null, tenThietBi: null, phongName: null });
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

            {/*  Modal Xác nhận Duyệt và Gán  */}
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

            {/* Modal Hủy Công Việc */}
            <CancelWithReasonModal
                isOpen={isCancelModalOpen}
                onClose={() => setIsCancelModalOpen(false)}
                data={cancelData}
                isLoading={updateStatusMutation.isPending && updateStatusMutation.variables?.updateData?.action === 'cancel_with_log'} // Kiểm tra đúng action đang chạy
                onSubmit={(baoHongId, reason) => {
                    updateStatusMutation.mutate({
                        id: baoHongId,
                        updateData: {
                            action: 'cancel_with_log', // Gửi action mới
                            lyDoHuy: reason          // Gửi lý do
                        }
                    }, {
                        onSuccess: () => { // Đóng modal sau khi thành công
                            setIsCancelModalOpen(false);
                        },
                        // onError đã được xử lý chung bởi mutation hook
                    });
                }}
            />

            {/* Modal Xác nhận Hoàn Thành  */}
            <ConfirmCompleteModal
                isOpen={isConfirmCompleteModalOpen}
                onClose={() => setIsConfirmCompleteModalOpen(false)}
                data={confirmCompleteData}
                // Kiểm tra action và ID đang loading
                isLoading={updateStatusMutation.isPending && updateStatusMutation.variables?.id === confirmCompleteData.baoHongId && updateStatusMutation.variables?.updateData?.trangThai === 'Hoàn Thành'}
                onSubmit={(baoHongId, finalStatus) => {
                    const payload = {
                        trangThai: 'Hoàn Thành'
                    };
                    // Chỉ thêm finalDeviceStatus vào payload nếu nó được chọn trong modal
                    if (finalStatus) {
                        payload.finalDeviceStatus = finalStatus;
                    }
                    updateStatusMutation.mutate({
                        id: baoHongId,
                        updateData: payload
                    }, {
                        onSuccess: () => {
                            setIsConfirmCompleteModalOpen(false); // Đóng modal khi thành công
                        }
                    });
                }}
            />

        </div>
    );
};

// === Component Modal Hủy Công Việc ===
const CancelWithReasonModal = ({ isOpen, onClose, data, onSubmit, isLoading }) => {
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');

    // Reset reason khi modal được mở với data mới
    useEffect(() => {
        if (isOpen) {
            setReason('');
            setError('');
        }
    }, [isOpen]);

    const handleSubmit = () => {
        if (!reason.trim()) {
            setError('Vui lòng nhập lý do hủy công việc.');
            return;
        }
        setError('');
        onSubmit(data.baoHongId, reason.trim()); // Gọi hàm submit từ props
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black bg-opacity-60"> {/* Tăng z-index nếu cần */}
            <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-xl">
                <h3 className="mb-4 text-lg font-semibold text-red-700">Xác nhận Hủy/Thu hồi Công việc</h3>
                <p className="mb-1 text-sm">Bạn sắp hủy công việc cho báo hỏng ID: <span className='font-bold'>{data.baoHongId}</span></p>
                <p className="mb-1 text-sm">Trạng thái hiện tại: <span className='font-medium'>{data.currentStatus}</span></p>
                <p className="mb-3 text-sm">Nhân viên đang gán: <span className='font-medium'>{data.assignedTechName}</span></p>

                <div className="mb-4">
                    <label htmlFor="cancelReason" className="block mb-1 text-sm font-medium text-gray-700">
                        Lý do hủy/thu hồi <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        id="cancelReason"
                        value={reason}
                        onChange={(e) => { setReason(e.target.value); setError(''); }}
                        className={`w-full p-2 border rounded-md min-h-[100px] ${error ? 'border-red-500' : 'border-gray-300'}`}
                        placeholder="Nhập lý do cụ thể (ví dụ: Nhân viên nghỉ việc, sai sót thông tin, yêu cầu từ người báo...)"
                        rows="4"
                    />
                    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                    >
                        Hủy bỏ
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading || !reason.trim()} // Disable nếu đang load hoặc chưa nhập lý do
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:bg-gray-400"
                    >
                        {isLoading ? 'Đang xử lý...' : 'Xác nhận Hủy'}
                    </button>
                </div>
            </div>
        </div>
    );
};
// === Kết thúc Component Modal ===

// === Component Modal Xác Nhận Hoàn Thành ===
const ConfirmCompleteModal = ({ isOpen, onClose, data, onSubmit, isLoading }) => {
    // State local để lưu trạng thái TB cuối cùng được chọn và ghi chú
    const [selectedFinalStatus, setSelectedFinalStatus] = useState('');
    const [ghiChu, setGhiChu] = useState(''); // <-- Thêm state cho ghi chú
    const [error, setError] = useState('');

    // --- Logic xác định điều kiện hiển thị dropdown ---
    // Giả định rằng 'data.originalDeviceStatus' chứa tình trạng của TTTB *trước khi* xử lý báo hỏng này.
    // Và hành động này chỉ xảy ra khi trạng thái báo hỏng là 'cho_xem_xet'.
    const originalDeviceStatus = data?.originalDeviceStatus; // Lấy tình trạng gốc của thiết bị từ props data
    const isDeXuatThanhLy = originalDeviceStatus === 'de_xuat_thanh_ly';
    const isConOrHetBH = originalDeviceStatus === 'con_bao_hanh' || originalDeviceStatus === 'het_bao_hanh';

    // Chỉ cần chọn trạng thái thiết bị nếu tình trạng gốc là một trong các trường hợp đặc biệt
    const needsDeviceStatusSelection = isDeXuatThanhLy || isConOrHetBH;

    let dropdownOptions = [];
    let dropdownLabel = '';

    if (isDeXuatThanhLy) {
        dropdownLabel = 'Xác nhận tình trạng thiết bị (Xử lý đề xuất thanh lý)';
        dropdownOptions = [
            { value: '', label: '-- Chọn tình trạng --' },
            // Các lựa chọn khi admin xử lý đề xuất thanh lý
            { value: 'con_bao_hanh', label: 'Còn Bảo Hành (Từ chối đề xuất)' },
            { value: 'het_bao_hanh', label: 'Hết Bảo Hành (Từ chối đề xuất)' },
            { value: 'cho_thanh_ly', label: 'Chờ Thanh Lý (Duyệt đề xuất)' },
        ];
    } else if (isConOrHetBH) {
        dropdownLabel = 'Xác nhận tình trạng thiết bị sau xử lý';
        dropdownOptions = [
            { value: '', label: '-- Chọn tình trạng --' },
             // Các lựa chọn khi tình trạng gốc là còn/hết BH
            { value: 'con_bao_hanh', label: 'Còn Bảo Hành' },
            { value: 'het_bao_hanh', label: 'Hết Bảo Hành' },
        ];
    }
    // --- Kết thúc Logic xác định điều kiện ---

    // Reset state local khi modal mở hoặc data thay đổi
    useEffect(() => {
        if (isOpen) {
            setSelectedFinalStatus('');
            setGhiChu(''); // <-- Reset ghi chú
            setError('');
        }
    }, [isOpen]); // Chỉ reset khi modal mở

    const handleSubmit = () => {
        // Kiểm tra nếu cần chọn mà chưa chọn
        if (needsDeviceStatusSelection && !selectedFinalStatus) {
            setError(`Vui lòng chọn "${dropdownLabel}"`);
            return;
        }
        // Reset lỗi nếu đã chọn
        setError('');

        // Gọi hàm submit từ props, truyền cả finalStatus và ghi chú
        // Component cha cần xử lý 3 tham số này
        onSubmit(data.baoHongId, selectedFinalStatus || null, ghiChu);
    };

    if (!isOpen || !data) return null; // Thêm kiểm tra data để tránh lỗi

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm">
            <div className="w-full max-w-lg p-6 bg-white rounded-lg shadow-xl transform transition-all duration-300 ease-out scale-95 opacity-0 animate-modal-scale-in">
                <h3 className="mb-4 text-xl font-semibold text-green-700">Xác nhận Hoàn thành Công việc</h3>
                <p className="mb-4 text-base">
                    Bạn có chắc muốn chuyển trạng thái báo hỏng ID: <span className='font-bold text-green-800'>{data.baoHongId}</span> từ <span className='font-semibold text-orange-600'>Chờ xem xét</span> sang <span className='font-semibold text-green-600'>Hoàn thành</span>?
                </p>
                 {/* Hiển thị thông tin thiết bị liên quan nếu có */}
                 {data.tenThietBi && (
                     <p className="mb-4 text-sm text-gray-600">
                         Thiết bị: <span className='font-medium'>{data.tenThietBi}</span> (ID: {data.tttbId}) - Tình trạng gốc: <span className='font-medium'>{data.originalDeviceStatusLabel || originalDeviceStatus}</span>
                     </p>
                 )}

                {/* Dropdown chọn trạng thái cuối (hiển thị có điều kiện) */}
                {needsDeviceStatusSelection && (
                    <div className="mb-4">
                        <label htmlFor="finalDeviceStatusSelect" className="block mb-1.5 text-sm font-medium text-gray-800">
                            {dropdownLabel} <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="finalDeviceStatusSelect"
                            value={selectedFinalStatus}
                            onChange={(e) => { setSelectedFinalStatus(e.target.value); setError(''); }}
                            className={`w-full px-3 py-2 text-sm border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 focus:border-indigo-500 ${error ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                        >
                            {dropdownOptions.map(opt => (
                                <option key={opt.value} value={opt.value} disabled={opt.value === ''}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
                    </div>
                )}

                {/* Ghi chú thêm của Admin */}
                <div className="mb-5">
                    <label htmlFor="ghiChuAdmin" className="block mb-1.5 text-sm font-medium text-gray-800">
                        Ghi chú của Admin {needsDeviceStatusSelection ? '(bắt buộc nếu từ chối đề xuất thanh lý)' : '(nếu có)'}
                    </label>
                    <textarea
                        id="ghiChuAdmin"
                        rows="3"
                        value={ghiChu}
                        onChange={(e) => setGhiChu(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Nhập ghi chú giải thích (ví dụ: lý do từ chối đề xuất thanh lý, tình trạng cụ thể sau sửa chữa...)"
                    />
                     {/* Có thể thêm validation ghi chú bắt buộc nếu cần, ví dụ khi từ chối đề xuất thanh lý */}
                     {isDeXuatThanhLy && (selectedFinalStatus === 'con_bao_hanh' || selectedFinalStatus === 'het_bao_hanh') && !ghiChu.trim() && (
                         <p className="mt-1 text-xs text-orange-600">Nên nhập ghi chú khi từ chối đề xuất thanh lý.</p>
                     )}
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Hủy bỏ
                    </button>
                    <button
                        onClick={handleSubmit}
                        // Disable nếu đang loading HOẶC nếu cần chọn trạng thái TB mà chưa chọn
                        disabled={isLoading || (needsDeviceStatusSelection && !selectedFinalStatus)}
                        className="px-5 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                             <svg className="inline w-4 h-4 mr-2 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                             </svg>
                            ) : 'Xác nhận Hoàn thành'}
                    </button>
                </div>
            </div>
             {/* Simple animation style */}
             <style>{`
                @keyframes modal-scale-in {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-modal-scale-in { animation: modal-scale-in 0.2s ease-out forwards; }
             `}</style>
        </div>
    );
};


export default ThongTinBaoHong;

