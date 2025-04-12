import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
    fetchPhongTableData,
    fetchPhongDetail,
    fetchThietBiTrongPhong,
    updatePhongAPI,
    deletePhongAPI,
    removeThietBiFromPhongAPI
} from "../../api";
import Pagination from "../layout/Pagination";
import { FaSort, FaSortUp, FaSortDown, FaSearch, FaChevronUp, FaChevronDown, FaSpinner, FaEdit, FaSave, FaTimesCircle, FaTimes } from "react-icons/fa";
import { BsTrash, BsSearch } from "react-icons/bs";
import { AiOutlineClear } from "react-icons/ai";
import { maxTangTheoToa, getTinhTrangLabel } from "../../utils/constants";
import eventBus from '../../utils/eventBus';

// ================== COMPONENT MODAL CHI TIẾT PHÒNG ======================== //
const PhongDetailModal = ({ record: initialRecord, onClose, refreshTable }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState(null); // Khởi tạo null
    const [searchTermThietBi, setSearchTermThietBi] = useState("");
    const [expandedRows, setExpandedRows] = useState([]);
    const queryClient = useQueryClient();
    const currentPhongId = initialRecord?.id;

    // --- Fetch dữ liệu chi tiết phòng ---
    const { data: phongDetailData, isLoading: isLoadingPhong, isError: isErrorPhong, error: errorPhong } = useQuery({
        queryKey: ['phong', currentPhongId],
        queryFn: () => fetchPhongDetail(currentPhongId),
        enabled: !!currentPhongId,
        staleTime: 5 * 60 * 1000,
        onSuccess: (data) => { if (!isEditing) { setEditData(data); } }
    });

    // Cập nhật editData khi initialRecord thay đổi hoặc fetch thành công
    useEffect(() => {
        // eslint-disable-next-line
        if (phongDetailData && !isEditing) {
            setEditData(phongDetailData);
        }
        // Khi đổi phòng khác (initialRecord thay đổi), reset trạng thái edit
        setIsEditing(false);
        // eslint-disable-next-line
    }, [phongDetailData, initialRecord]);

    // --- Fetch danh sách thiết bị trong phòng ---
    // eslint-disable-next-line
    const { data: thietBiListData = [], isLoading: isLoadingThietBi, isError: isErrorThietBi, error: errorThietBi, refetch: refetchThietBiList } = useQuery({
        queryKey: ['thietBiTrongPhong', currentPhongId],
        queryFn: async () => {
            if (!currentPhongId) return [];
            try {
                const data = await fetchThietBiTrongPhong(currentPhongId);
                return Array.isArray(data) ? data : [];
            } catch (error) {
                if (error.response && error.response.status === 404) { return []; }
                console.error(`Lỗi fetch thiết bị cho phòng ${currentPhongId}:`, error);
                toast.error(`Lỗi tải danh sách thiết bị: ${error.message}`);
                throw error;
            }
        },
        enabled: !!currentPhongId,
        staleTime: 1 * 60 * 1000,
    });

    // --- Mutations ---
    const updatePhongMutation = useMutation({
        mutationFn: updatePhongAPI,
        onSuccess: () => {
            toast.success("Cập nhật phòng thành công!");
            queryClient.invalidateQueries({ queryKey: ['phong', currentPhongId] });
            queryClient.invalidateQueries({ queryKey: ['phongTableData'] }); // Invalidate bảng chính
            if (typeof refreshTable === 'function') refreshTable(); // Gọi hàm refresh bảng chính từ props
            setIsEditing(false);
        },
        onError: (error) => {
            console.error("Lỗi cập nhật phòng:", error);
            toast.error(`Cập nhật phòng thất bại: ${error.response?.data?.error || error.message}`);
        }
    });

    const deletePhongMutation = useMutation({
        mutationFn: deletePhongAPI,
        onSuccess: (data) => {
            toast.success(data.message || "Xóa phòng thành công!");
            queryClient.invalidateQueries({ queryKey: ['phongTableData'] });
            queryClient.removeQueries({ queryKey: ['phong', currentPhongId] });
            queryClient.removeQueries({ queryKey: ['thietBiTrongPhong', currentPhongId] });
            if (typeof refreshTable === 'function') refreshTable();
            onClose();
        },
        onError: (error) => {
            console.error("Lỗi xóa phòng:", error);
            toast.error(`Xóa phòng thất bại: ${error.response?.data?.error || error.message}`);
        }
    });

    const removeThietBiMutation = useMutation({
        mutationFn: removeThietBiFromPhongAPI,
        onSuccess: (data, variables) => {
            toast.success(data.message || `Đã thu hồi tài sản ID ${variables.thongtinthietbi_id} về kho.`);
            queryClient.invalidateQueries({ queryKey: ['thietBiTrongPhong', currentPhongId] });
            queryClient.invalidateQueries({ queryKey: ['phongTableData'] });
            queryClient.invalidateQueries({ queryKey: ['taiSanList'] });
            queryClient.invalidateQueries({ queryKey: ['availableAssetsForAssignment'] });
        },
        onError: (error, variables) => {
            console.error("Lỗi thu hồi tài sản:", error);
            toast.error(`Thu hồi tài sản ID ${variables.thongtinthietbi_id} thất bại: ${error.response?.data?.error || error.message}`);
        }
    });

    //  useEffect ĐỂ LẮNG NGHE EVENT BUS TRONG MODAL CON NÀY
    const handleDeviceListUpdate = useCallback((updatedPhongId) => {
        console.log(`[PhongDetailModal ${currentPhongId}] Event received. updatedPhongId:`, updatedPhongId, `(Type: ${typeof updatedPhongId})`, ' | currentPhongId:', currentPhongId, `(Type: ${typeof currentPhongId})`);
        const isMatch = updatedPhongId && currentPhongId && String(updatedPhongId) === String(currentPhongId);
        console.log(`[PhongDetailModal ${currentPhongId}] IDs match: ${isMatch}`);

        if (isMatch) {
            console.log(`[PhongDetailModal ${currentPhongId}] IDs match! Invalidating query ['thietBiTrongPhong', ${currentPhongId}]...`);
            queryClient.invalidateQueries({ queryKey: ['thietBiTrongPhong', currentPhongId] });
        }
    }, [currentPhongId, queryClient]);

    useEffect(() => {
        eventBus.on('phongDataUpdated', handleDeviceListUpdate);

        return () => {
            eventBus.off('phongDataUpdated', handleDeviceListUpdate);
        };
    }, [currentPhongId, handleDeviceListUpdate]); // Chỉ phụ thuộc vào ID và hàm xử lý đã ổn định


    // --- Handlers ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditData({ ...editData, [name]: value });
    };

    const toggleEdit = () => {
        setIsEditing((prev) => !prev);
        if (!isEditing && phongDetailData) {
            setEditData(phongDetailData);
        }
    };

    // const handleCancel = () => {
    //     // Khi hủy edit, quay lại dữ liệu từ query
    //     if (phongDetailData) {
    //         setEditData(phongDetailData);
    //     }
    //     setIsEditing(false);
    // };

    const handleSave = () => {
        if (!currentPhongId || !editData) return;
        updatePhongMutation.mutate({ id: currentPhongId, ...editData });
    };

    const handleDelete = () => {
        if (!currentPhongId) return;
        if (!window.confirm("Bạn có chắc muốn xóa phòng này không? Lưu ý: Phòng chứa thiết bị sẽ không thể xóa!")) return;
        deletePhongMutation.mutate(currentPhongId);
    };

    const handleDeleteThietBi = (thongtinthietbi_id) => {
        if (!currentPhongId) {
            toast.error("Không xác định được ID phòng hiện tại.");
            return;
        }
        const idToParse = String(thongtinthietbi_id).trim();
        if (!idToParse) {
            toast.error("Không xác định được ID thiết bị.");
            return;
        }
        const numericId = parseInt(idToParse, 10);
        if (isNaN(numericId)) {
            toast.error(`ID thiết bị không hợp lệ: ${thongtinthietbi_id}`);
            return;
        }
        if (window.confirm(`Bạn có chắc muốn thu hồi tài sản ID ${numericId} khỏi phòng này?`)) {
            removeThietBiMutation.mutate({
                phong_id: currentPhongId,
                thongtinthietbi_id: numericId
            });
        }
    };

    // Lọc và nhóm thiết bị
    // eslint-disable-next-line
    const safeThietBiList = Array.isArray(thietBiListData) ? thietBiListData : [];
    const filteredThietBiList = useMemo(() => {
        if (!searchTermThietBi) return safeThietBiList;
        const lowerSearchTerm = searchTermThietBi.toLowerCase();
        return safeThietBiList.filter((tb) => {
            const tenThietBi = tb?.tenLoaiThietBi?.toLowerCase() || "";
            const theLoai = tb?.tenTheLoai?.toLowerCase() || "";
            const idString = String(tb?.thongtinthietbi_id || tb?.id || '');

            return tenThietBi.includes(lowerSearchTerm) ||
                theLoai.includes(lowerSearchTerm) ||
                idString.includes(lowerSearchTerm)
        });
    }, [safeThietBiList, searchTermThietBi]);

    const groupedThietBiList = useMemo(() => filteredThietBiList.reduce((acc, curr) => {
        const groupKey = curr.tenTheLoai || 'Chưa phân loại';
        const existingGroup = acc.find(group => group.theLoai === groupKey);
        if (existingGroup) {
            existingGroup.devices.push(curr);
            existingGroup.total += 1;
        } else {
            acc.push({ theLoai: groupKey, devices: [curr], total: 1 });
        }
        return acc;
    }, []), [filteredThietBiList]);

    // --- Handlers tìm kiếm, toggle ---
    const handleSearchThietBi = (e) => {
        setSearchTermThietBi(e.target.value);
    };

    const toggleRow = (theLoai) => {
        setExpandedRows(prev =>
            prev.includes(theLoai) ? prev.filter(row => row !== theLoai) : [...prev, theLoai]
        );
    };

    // --- Xử lý trạng thái loading/error ---
    if (isLoadingPhong) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
                <div className="p-6 bg-white rounded shadow-lg">Đang tải chi tiết phòng... <FaSpinner className="inline ml-2 animate-spin" /></div>
            </div>
        );
    }

    if (isErrorPhong) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
                <div className="p-6 text-red-600 bg-white rounded shadow-lg">
                    Lỗi tải dữ liệu phòng: {errorPhong?.message || 'Unknown error'}
                    <button onClick={onClose} className="px-3 py-1 ml-4 text-white bg-gray-500 rounded">Đóng</button>
                </div>
            </div>
        );
    }

    // --- JSX for Modal ---
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60" onClick={onClose}>
            <div className="relative w-full max-w-4xl bg-white rounded-lg shadow-xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                {/* Modal Header */}
                <div className="sticky top-0 z-20 flex items-center justify-between p-4 bg-white border-b">
                    <h2 className="text-xl font-semibold">Chi Tiết Phòng: {editData?.phong || `${editData?.toa || '?'}${editData?.tang || '?'}.${editData?.soPhong || '?'}` || 'Đang tải...'}</h2>
                    <div className="flex items-center space-x-2">
                        {/* Các nút ở Header */}
                        <button onClick={handleDelete} disabled={deletePhongMutation.isPending || updatePhongMutation.isPending} title="Xóa phòng" className="p-2 text-gray-600 rounded-full hover:bg-red-100 hover:text-red-600 disabled:opacity-50"><BsTrash size={18} /></button>
                        <button onClick={toggleEdit} disabled={deletePhongMutation.isPending || updatePhongMutation.isPending} title={isEditing ? "Hủy sửa" : "Sửa phòng"} className={`p-2 rounded-full ${isEditing ? 'hover:bg-gray-200 text-gray-600' : 'hover:bg-yellow-100 hover:text-yellow-600'} disabled:opacity-50`}>
                            {isEditing ? <FaTimesCircle className="text-lg text-red-500" /> : <FaEdit className="text-lg text-yellow-600" />}
                        </button>
                        {isEditing && (
                            <button onClick={handleSave} disabled={updatePhongMutation.isPending || deletePhongMutation.isPending} title="Lưu thay đổi" className="p-2 text-white bg-green-500 rounded-full hover:bg-green-600 disabled:opacity-50">
                                {updatePhongMutation.isPending ? <FaSpinner className="text-lg animate-spin" /> : <FaSave className="text-lg" />}
                            </button>
                        )}
                        <button onClick={onClose} disabled={deletePhongMutation.isPending || updatePhongMutation.isPending} title="Đóng" className="p-2 text-gray-600 rounded-full hover:bg-gray-200 disabled:opacity-50"><FaTimes className="text-xl" /></button>
                    </div>
                </div>

                {/* Modal Body */}
                <div className="flex-grow p-4 overflow-y-auto">
                    {/* Form chi tiết phòng */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        {/* Sử dụng editData để hiển thị/sửa */}
                        <div><label className="block text-sm font-medium text-gray-700">ID Phòng</label><input type="text" value={`P${editData?.id || ''}`} className="w-full p-1 mt-1 bg-gray-100 border rounded-md" disabled /></div>
                        <div><label className="block text-sm font-medium text-gray-700">Cơ Sở</label><input type="text" value={editData?.coSo || ''} className="w-full p-1 mt-1 bg-gray-100 border rounded-md" disabled /></div>
                        <div><label className="block text-sm font-medium text-gray-700">Tòa</label><input type="text" value={editData?.toa || ''} className="w-full p-1 mt-1 bg-gray-100 border rounded-md" disabled /></div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Tầng</label>
                            {isEditing && editData?.toa ? (
                                <select name="tang" value={editData.tang || ''} onChange={handleChange} className="w-full p-1 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                                    <option value="" disabled>Chọn tầng</option>
                                    {Array.from({ length: maxTangTheoToa[editData.toa] || 5 }, (_, i) => (<option key={i + 1} value={i + 1}>{i + 1}</option>))}
                                </select>
                            ) : (<input type="number" value={editData?.tang || ''} className="w-full p-1 mt-1 bg-gray-100 border rounded-md" disabled />)}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Số Phòng</label>
                            {isEditing ? (
                                <select name="soPhong" value={editData.soPhong || ''} onChange={handleChange} className="w-full p-1 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                                    <option value="" disabled>Chọn số phòng</option>
                                    {Array.from({ length: 20 }, (_, i) => (<option key={i + 1} value={i + 1}>{i + 1}</option>))}
                                </select>
                            ) : (<input type="number" value={editData?.soPhong || ''} className="w-full p-1 mt-1 bg-gray-100 border rounded-md" disabled />)}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Chức Năng</label>
                            <input type="text" name="chucNang" value={editData?.chucNang || ''} onChange={handleChange} className={`w-full p-1 mt-1 border rounded-md ${isEditing ? 'bg-white border-gray-300' : 'bg-gray-100 border-gray-200'}`} disabled={!isEditing} />
                        </div>
                    </div>

                    {/* Danh sách thiết bị */}
                    <div className="pt-4 mt-6 border-t">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-semibold">Thiết bị trong phòng ({filteredThietBiList.length})</h3>
                            <div className="relative w-2/5">
                                <input
                                    type="text"
                                    placeholder="Tìm Mã định danh thiết bị, tên, thể loại,..."
                                    value={searchTermThietBi}
                                    onChange={handleSearchThietBi} // Đổi tên hàm search
                                    className="w-full py-1 pl-8 pr-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                                <BsSearch className="absolute text-gray-400 transform -translate-y-1/2 left-2 top-1/2" />
                            </div>
                        </div>
                        {isLoadingThietBi && <div className="py-4 text-center"><FaSpinner className="inline mr-2 animate-spin" /> Đang tải thiết bị...</div>}
                        {isErrorThietBi && <div className="py-4 text-center text-red-500">Lỗi tải thiết bị: {errorThietBi.message}</div>}
                        {!isLoadingThietBi && !isErrorThietBi && (
                            <div className="overflow-x-auto border rounded-lg max-h-80">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="sticky top-0 z-10 bg-gray-100">
                                        <tr>
                                            <th className="px-3 py-2 text-xs font-medium tracking-wider text-center text-gray-600 uppercase">STT</th>
                                            <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-600 uppercase">Thể Loại</th>
                                            <th className="px-3 py-2 text-xs font-medium tracking-wider text-center text-gray-600 uppercase">Tổng TB</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {groupedThietBiList.length === 0 && (
                                            <tr><td colSpan="3" className="px-3 py-4 text-sm text-center text-gray-500">Không có thiết bị nào trong phòng hoặc không khớp tìm kiếm.</td></tr>
                                        )}
                                        {groupedThietBiList.map((group, index) => (
                                            <React.Fragment key={group.theLoai + index}>
                                                {/* Row của nhóm */}
                                                <tr className="hover:bg-gray-50">
                                                    <td className="px-3 py-2 text-sm text-center whitespace-nowrap">{index + 1}</td>
                                                    <td className="px-3 py-2 text-sm font-medium text-gray-900 whitespace-nowrap">
                                                        <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleRow(group.theLoai)}>
                                                            {group.theLoai}
                                                            <span className="ml-2 text-gray-500 hover:text-gray-700">{expandedRows.includes(group.theLoai) ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-2 text-sm text-center text-gray-500 whitespace-nowrap">{group.total}</td>
                                                </tr>
                                                {/* Row chi tiết (nếu expand) */}
                                                {expandedRows.includes(group.theLoai) && (
                                                    <tr>
                                                        <td colSpan={3} className="p-0 border-t">
                                                            <div className="p-2 bg-gray-50">
                                                                <table className="w-full border-collapse">
                                                                    <thead className="text-xs uppercase bg-gray-200">
                                                                        <tr>
                                                                            <th className="w-1/12 px-2 py-1 text-center border">#</th>
                                                                            <th className="w-2/12 px-2 py-1 text-left border">Mã Định Danh</th>
                                                                            <th className="w-4/12 px-2 py-1 text-left border">Tên Loại Thiết Bị</th>
                                                                            <th className="w-2/12 px-2 py-1 text-center border">Tình Trạng</th>
                                                                            <th className="w-1/12 px-2 py-1 text-center border">Gỡ</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {group.devices.map((tb, subIndex) => (
                                                                            <tr key={tb.thongtinthietbi_id || tb.id} className="bg-opacity-50 hover:bg-white">
                                                                                <td className="px-2 py-1 text-xs text-center border-t border-l">{subIndex + 1}</td>
                                                                                <td className="px-2 py-1 font-mono text-xs border-t border-l">{tb.thongtinthietbi_id || tb.id}</td>
                                                                                <td className="px-2 py-1 text-xs border-t border-l">{tb.tenLoaiThietBi}</td>
                                                                                <td className="px-2 py-1 text-xs text-center border-t border-l">{getTinhTrangLabel(tb.tinhTrang)}</td>
                                                                                <td className="px-2 py-1 text-xs text-center border-t border-l border-r">
                                                                                    <button
                                                                                        onClick={() => handleDeleteThietBi(tb.thongtinthietbi_id || tb.id)}
                                                                                        disabled={removeThietBiMutation.isPending && removeThietBiMutation.variables?.thongtinthietbi_id === (tb.thongtinthietbi_id || tb.id)}
                                                                                        className="p-1 text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                                        title="Gỡ thiết bị khỏi phòng"
                                                                                    >
                                                                                        {removeThietBiMutation.isPending && removeThietBiMutation.variables?.thongtinthietbi_id === (tb.thongtinthietbi_id || tb.id) ? <FaSpinner className="animate-spin" /> : <BsTrash />}
                                                                                    </button>
                                                                                </td>
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
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ================ KẾT THÚC COMPONENT MODAL CHI TIẾT PHÒNG ================== //


const Phong = ({ setSelectedRecord, refresh }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(14); // Số dòng mỗi trang
    const [searchTerm, setSearchTerm] = useState("");
    const [filter, setFilter] = useState({ coSo: "", toa: "", tang: "" });
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPhongForModal, setSelectedPhongForModal] = useState(null);

    // --- Sử dụng useQuery để fetch dữ liệu ---
    const { data: phongData = [], isLoading, isError, refetch: refetchTableData } = useQuery({
        queryKey: ['phongTableData'],
        queryFn: fetchPhongTableData,
        staleTime: 5 * 60 * 1000,
        onError: (err) => {
            toast.error(`Lỗi tải danh sách phòng: ${err.message}`);
        }
    });

    useEffect(() => {
        const handleTableUpdate = (phongIdBiAnhHuong) => {
            refetchTableData();
        };
        eventBus.on('phongDataUpdated', handleTableUpdate);
        return () => {
            eventBus.off('phongDataUpdated', handleTableUpdate);
        };
    }, [refetchTableData]);

    // -----------------------------------------

    // --- Callback để refresh bảng từ Modal ---
    // const handleRefreshTable = useCallback(() => {
    //     refetchTableData();
    // }, [refetchTableData]);

    // --- Mở/Đóng Modal ---
    const openPhongDetailModal = (record) => {
        setSelectedPhongForModal(record);
        setIsModalOpen(true);
    };

    const closePhongDetailModal = () => {
        setIsModalOpen(false);
        setSelectedPhongForModal(null);
    };
    // ---------------------

    const processedData = useMemo(() => {
        // Đảm bảo phongData là mảng
        const safePhongData = Array.isArray(phongData) ? phongData : [];
        let filteredItems = [...safePhongData];

        // Lọc
        filteredItems = filteredItems.filter(item =>
            (!filter.coSo || item.coSo === filter.coSo) &&
            (!filter.toa || item.toa === filter.toa) &&
            (!filter.tang || String(item.tang) === filter.tang) // So sánh chuỗi nếu cần
        );

        // Tìm kiếm
        if (searchTerm) {
            const lowerSearchTerm = searchTerm.toLowerCase();
            filteredItems = filteredItems.filter(item =>
                item.toa?.toLowerCase().includes(lowerSearchTerm) ||
                String(item.tang).includes(lowerSearchTerm) ||
                String(item.soPhong).includes(lowerSearchTerm) ||
                item.chucNang?.toLowerCase().includes(lowerSearchTerm) ||
                String(item.id).includes(lowerSearchTerm) || // Tìm theo ID
                String(item.totalDevices).includes(lowerSearchTerm) // Tìm theo SL thiết bị
            );
        }

        // Sắp xếp (Giữ nguyên logic sắp xếp của bạn)
        if (sortConfig.key) {
            filteredItems.sort((a, b) => {
                const aValue = a?.[sortConfig.key];
                const bValue = b?.[sortConfig.key];

                if (aValue == null && bValue == null) return 0;
                if (aValue == null) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (bValue == null) return sortConfig.direction === 'ascending' ? 1 : -1;

                if (typeof aValue === 'number' && typeof bValue === 'number') {
                    if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                    if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                    return 0;
                }
                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    const comparison = aValue.toLowerCase().localeCompare(bValue.toLowerCase());
                    return sortConfig.direction === 'ascending' ? comparison : -comparison;
                }
                return 0;
            });
        }


        return filteredItems;
    }, [phongData, filter, searchTerm, sortConfig]);

    // -----------------------------------------------------

    // --- Phân trang ---
    const totalPages = Math.ceil(processedData.length / itemsPerPage);
    const currentItems = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return processedData.slice(startIndex, startIndex + itemsPerPage);
    }, [processedData, currentPage, itemsPerPage]);
    // ---------------

    // --- Handlers ---
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilter(prev => ({ ...prev, [name]: value }));
        setCurrentPage(1); // Reset về trang đầu khi lọc
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const handleClearFilters = () => {
        setFilter({ coSo: "", toa: "", tang: "" });
        setSearchTerm("");
        setSortConfig({ key: null, direction: 'ascending' });
        setCurrentPage(1);
    };

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        } else if (sortConfig.key === key && sortConfig.direction === 'descending') {
            // Nếu click lần 3 thì bỏ sắp xếp cột đó
            key = null;
            direction = 'ascending';
        }
        setSortConfig({ key, direction });
        setCurrentPage(1); // Reset trang khi sắp xếp
    };

    // Thiết lập lại trang về 1 khi dữ liệu lọc/tìm kiếm thay đổi số lượng trang
    useEffect(() => {
        const newTotalPages = Math.ceil(processedData.length / itemsPerPage);
        if (currentPage > newTotalPages && newTotalPages > 0) {
            setCurrentPage(newTotalPages);
        } else if (newTotalPages === 0) {
            setCurrentPage(1);
        }
    }, [processedData.length, itemsPerPage, currentPage]);

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return <FaSort className="inline ml-1 text-gray-400" />;
        if (sortConfig.direction === 'ascending') return <FaSortUp className="inline ml-1" />;
        return <FaSortDown className="inline ml-1" />;
    };

    // Tạo danh sách options cho dropdown lọc
    const filterOptions = useMemo(() => {
        const options = { coSo: new Set(), toa: new Set(), tang: new Set() };
        const safePhongData = Array.isArray(phongData) ? phongData : [];
        safePhongData.forEach(item => {
            if (item.coSo) options.coSo.add(item.coSo);
            if (item.toa) options.toa.add(item.toa);
            if (item.tang) options.tang.add(item.tang);
        });
        return {
            coSo: Array.from(options.coSo).sort(),
            toa: Array.from(options.toa).sort(),
            tang: Array.from(options.tang).sort((a, b) => a - b)
        };
    }, [phongData]);

    // -----------------

    if (isLoading) return <div className="p-4 text-center">Đang tải danh sách phòng...</div>;
    if (isError) return <div className="p-4 text-center text-red-500">Đã xảy ra lỗi khi tải dữ liệu.</div>;

    return (
        <div className="w-full p-4 bg-white rounded shadow">
            {/* Khu vực Lọc và Tìm kiếm */}
            <div className="flex flex-wrap items-end gap-4 mb-4">
                {/* Các dropdown lọc và input tìm kiếm */}
                <div className="flex-1 min-w-[120px]">
                    <label htmlFor="filterCoSo" className="block text-sm font-medium text-gray-700">Cơ Sở</label>
                    <select id="filterCoSo" name="coSo" value={filter.coSo} onChange={handleFilterChange} className="w-full px-2 py-1 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                        <option value="">Tất cả</option>
                        {filterOptions.coSo.map(value => <option key={value} value={value}>{value}</option>)}
                    </select>
                </div>
                <div className="flex-1 min-w-[120px]">
                    <label htmlFor="filterToa" className="block text-sm font-medium text-gray-700">Tòa</label>
                    <select id="filterToa" name="toa" value={filter.toa} onChange={handleFilterChange} className="w-full px-2 py-1 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                        <option value="">Tất cả</option>
                        {filterOptions.toa.map(value => <option key={value} value={value}>{value}</option>)}
                    </select>
                </div>
                <div className="flex-1 min-w-[120px]">
                    <label htmlFor="filterTang" className="block text-sm font-medium text-gray-700">Tầng</label>
                    <select id="filterTang" name="tang" value={filter.tang} onChange={handleFilterChange} className="w-full px-2 py-1 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                        <option value="">Tất cả</option>
                        {filterOptions.tang.map(value => <option key={value} value={value}>{value}</option>)}
                    </select>
                </div>
                <div className="relative flex-1 min-w-[200px]">
                    <label htmlFor="searchPhong" className="block text-sm font-medium text-gray-700">Tìm kiếm</label>
                    <input type="text" id="searchPhong" placeholder="Nhập tòa, tầng, phòng, CN, ID, SL..." value={searchTerm} onChange={handleSearchChange} className="w-full px-2 py-1 pl-8 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                    <FaSearch className="absolute text-gray-400 left-2 top-[30px]" />
                </div>
                <button onClick={handleClearFilters} className="px-3 py-1 mt-4 text-sm text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300" title="Xóa bộ lọc/tìm kiếm">
                    <AiOutlineClear className="inline mr-1" /> Xóa lọc
                </button>
            </div>

            {/* Bảng Dữ Liệu */}
            <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                    {/* thead */}
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-4 py-2 text-xs font-bold tracking-wider text-center text-gray-600 uppercase">STT</th>
                            <th scope="col" className="px-4 py-2 text-xs font-bold tracking-wider text-left text-gray-600 uppercase cursor-pointer" onClick={() => requestSort('coSo')}>Cơ Sở {getSortIcon('coSo')}</th>
                            <th scope="col" className="px-4 py-2 text-xs font-bold tracking-wider text-left text-gray-600 uppercase cursor-pointer" onClick={() => requestSort('toa')}>Tòa {getSortIcon('toa')}</th>
                            <th scope="col" className="px-4 py-2 text-xs font-bold tracking-wider text-center text-gray-600 uppercase cursor-pointer" onClick={() => requestSort('tang')}>Tầng {getSortIcon('tang')}</th>
                            <th scope="col" className="px-4 py-2 text-xs font-bold tracking-wider text-center text-gray-600 uppercase cursor-pointer" onClick={() => requestSort('soPhong')}>Số Phòng {getSortIcon('soPhong')}</th>
                            <th scope="col" className="px-4 py-2 text-xs font-bold tracking-wider text-left text-gray-600 uppercase cursor-pointer" onClick={() => requestSort('chucNang')}>Chức Năng {getSortIcon('chucNang')}</th>
                            <th scope="col" className="px-4 py-2 text-xs font-bold tracking-wider text-center text-gray-600 uppercase cursor-pointer" onClick={() => requestSort('totalDevices')}>SL TB {getSortIcon('totalDevices')}</th>
                            <th scope="col" className="px-4 py-2 text-xs font-bold tracking-wider text-center text-gray-600 uppercase cursor-pointer" onClick={() => requestSort('id')}>ID Phòng {getSortIcon('id')}</th>
                        </tr>
                    </thead>
                    {/* tbody */}
                    <tbody className="bg-white divide-y divide-gray-200">
                        {currentItems.length > 0 ? (
                            currentItems.map((record, index) => (
                                <tr key={record.id} onClick={() => openPhongDetailModal(record)} className="cursor-pointer hover:bg-indigo-50">
                                    <td className="px-4 py-2 text-sm text-center text-gray-500 whitespace-nowrap">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                    <td className="px-4 py-2 text-sm text-gray-900 whitespace-nowrap">{record.coSo}</td>
                                    <td className="px-4 py-2 text-sm text-gray-900 whitespace-nowrap">{record.toa}</td>
                                    <td className="px-4 py-2 text-sm text-center text-gray-500 whitespace-nowrap">{record.tang}</td>
                                    <td className="px-4 py-2 text-sm text-center text-gray-500 whitespace-nowrap">{record.soPhong}</td>
                                    <td className="px-4 py-2 text-sm text-gray-500 whitespace-nowrap">{record.chucNang}</td>
                                    <td className="px-4 py-2 text-sm text-center text-gray-500 whitespace-nowrap">
                                        {record.totalDevices > 0 ? (
                                            <span className="font-semibold text-blue-600">{record.totalDevices}</span>
                                        ) : (<span className="text-gray-400">-</span>)}
                                    </td>
                                    <td className="px-4 py-2 font-mono text-sm text-center text-gray-500 whitespace-nowrap">{record.id}</td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="7" className="px-4 py-4 text-sm text-center text-gray-500">Không tìm thấy phòng nào.</td></tr> // Điều chỉnh colspan
                        )}
                    </tbody>
                </table>
            </div>

            {/* --- Render Modal chi tiết phòng --- */}
            {isModalOpen && selectedPhongForModal && (
                <PhongDetailModal
                    key={selectedPhongForModal.id}
                    record={selectedPhongForModal}
                    onClose={closePhongDetailModal}
                    refreshTable={refetchTableData}
                />
            )}

            {/* Phân trang */}
            {totalPages > 1 && (
                <div className="flex justify-center mt-4">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}
        </div>
    );
};

export default Phong;