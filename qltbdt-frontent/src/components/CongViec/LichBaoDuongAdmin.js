import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import * as api from '../../api';
import Modal from '../layout/Popup';
import Pagination from '../layout/Pagination';
import Select from 'react-select';
import { getUuTienLabel } from '../../utils/constants';
import { FaTrashAlt, FaEye, FaPlus, FaLayerGroup, FaHistory, FaBan, FaFilter, FaCalendarAlt, FaUndo, FaPlusCircle, FaCheckCircle } from "react-icons/fa";
import moment from 'moment';
import 'moment/locale/vi';
import ModalXemLogBaoTri from './ModalXemLogBaoTri';
import ModalBulkCreateLichBaoDuong from './ModalBulkCreateLichBaoDuong';
import FormNhanBaoHanhVe from '../forms/FormNhanBaoHanhVe';

// --- Helper Components ---
const StatusBadge = ({ status }) => {
    let colorClasses = 'bg-gray-100 text-gray-800';
    if (status === 'Hoàn thành') { colorClasses = 'bg-green-100 text-green-800'; }
    else if (status === 'Đang tiến hành') { colorClasses = 'bg-yellow-100 text-yellow-800'; }
    else if (status === 'Hủy') { colorClasses = 'bg-red-100 text-red-800 line-through'; }
    else if (status === 'Chờ xử lý') { colorClasses = 'bg-blue-100 text-blue-800'; }
    else if (status === 'Chờ Hoàn Tất Bảo Hành') { colorClasses = 'bg-orange-100 text-orange-800'; }
    else if (status === 'Chờ Xem Xét') { colorClasses = 'bg-purple-100 text-purple-800'; }
    return (<span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClasses}`}>{status}</span>);
};

// Component RoomMonthDetailModal (Đã thêm prop onOpenLog)
const RoomMonthDetailModal = ({ isOpen, onClose, roomData, selectedMonthYear, onOpenLog, onAdminReceiveWarranty, isLoadingUpdateStatus, onAdminRequestRework, onAdminApproveCompletion }) => {
    if (!isOpen || !roomData) return null;

    const { tenPhong, originalItems } = roomData;
    const formattedMonthYear = moment(selectedMonthYear).format("MM/YYYY");

    const tasksThisMonth = originalItems.filter(item =>
        moment(item.ngay_baotri).isSame(selectedMonthYear, 'month')
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Chi tiết lịch bảo dưỡng ${tenPhong} - Tháng ${formattedMonthYear}`}>
            <div className="space-y-3 text-sm max-h-[60vh] overflow-y-auto">
                <h4 className="mb-2 text-base font-semibold">Danh sách công việc ({tasksThisMonth.length}):</h4>
                {tasksThisMonth.length > 0 ? (
                    <table className="min-w-full text-xs border divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-2 py-1 font-medium tracking-wider text-left text-gray-500 uppercase">STT</th>
                                <th className="px-2 py-1 font-medium tracking-wider text-left text-gray-500 uppercase">Thiết bị</th>
                                <th className="px-2 py-1 font-medium tracking-wider text-left text-gray-500 uppercase">MĐD</th>
                                <th className="px-2 py-1 font-medium tracking-wider text-center text-gray-500 uppercase">Ngày BD</th>
                                <th className="px-2 py-1 font-medium tracking-wider text-center text-gray-500 uppercase">Trạng thái</th>
                                <th className="px-2 py-1 font-medium tracking-wider text-center text-gray-500 uppercase">Nhân viên</th>
                                <th className="px-2 py-1 font-medium tracking-wider text-center text-gray-500 uppercase">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {tasksThisMonth.map((item, index) => (
                                <tr key={item.id}>
                                    <td className="px-2 py-1 text-gray-500 whitespace-nowrap">{index + 1}</td>
                                    <td className="px-2 py-1 font-medium text-gray-900 whitespace-nowrap">{item.tenThietBi || `TB ID ${item.thongtinthietbi_id}`}</td>
                                    <td className="px-2 py-1 text-gray-500 whitespace-nowrap">{item.thongtinthietbi_id}</td>
                                    <td className="px-2 py-1 text-center text-gray-500 whitespace-nowrap">{moment(item.ngay_baotri).format("DD/MM")}</td>
                                    <td className="px-2 py-1 text-center whitespace-nowrap"><StatusBadge status={item.trang_thai} /></td>
                                    <td className="px-2 py-1 text-center text-gray-500 whitespace-nowrap">{item.tenNhanVienPhuTrach || 'Chưa gán'}</td>
                                    <td className="px-2 py-1 text-center whitespace-nowrap">
                                        {/* Nút Xem Log */}
                                        <button
                                            onClick={() => onOpenLog(item.id, item.thongtinthietbi_id, item.tenThietBi, item.tenPhong)}
                                            className="p-1 text-purple-600 hover:underline disabled:text-gray-400 disabled:no-underline"
                                            title="Xem lịch sử bảo trì của thiết bị này"
                                            disabled={!item.thongtinthietbi_id}
                                        >
                                            <FaHistory />
                                        </button>
                                        {/* Nút Duyệt Hoàn Thành */}
                                        <button
                                            onClick={() => onAdminApproveCompletion(item)}
                                            className={`p-1 ${item.trang_thai === 'Chờ Xem Xét' && !isLoadingUpdateStatus
                                                ? 'text-green-600 hover:text-green-800'
                                                : 'text-gray-400 cursor-not-allowed'
                                                } disabled:opacity-50`}
                                            title="Duyệt hoàn thành công việc"
                                            disabled={item.trang_thai !== 'Chờ Xem Xét' || isLoadingUpdateStatus}
                                        >
                                            <FaCheckCircle />
                                        </button>

                                        {/* Nút Yêu Cầu Làm Lại */}
                                        <button
                                            onClick={() => onAdminRequestRework(item)}
                                            className={`p-1 ${item.trang_thai === 'Chờ Xem Xét' && !isLoadingUpdateStatus
                                                ? 'text-orange-500 hover:text-orange-700'
                                                : 'text-gray-400 cursor-not-allowed'
                                                } disabled:opacity-50`}
                                            title="Yêu cầu nhân viên làm lại"
                                            disabled={item.trang_thai !== 'Chờ Xem Xét' || isLoadingUpdateStatus}
                                        >
                                            <FaUndo />
                                        </button>
                                        {/* Nút Admin nhận hàng BH */}
                                        <button
                                            onClick={() => onAdminReceiveWarranty(item)} // Gọi handler từ props
                                            className={`p-1 ${item.trang_thai === 'Chờ Hoàn Tất Bảo Hành' && item.thongtinthietbi_id && !isLoadingUpdateStatus
                                                ? 'text-green-600 hover:text-green-800 hover:bg-green-100'
                                                : 'text-gray-400 cursor-not-allowed'
                                                } disabled:opacity-50`}
                                            title={
                                                item.trang_thai === 'Chờ Hoàn Tất Bảo Hành' && item.thongtinthietbi_id
                                                    ? "Admin nhận thiết bị từ bảo hành về"
                                                    : "Chỉ dùng khi task 'Chờ Hoàn Tất BH' và có ID thiết bị"
                                            }
                                            disabled={
                                                item.trang_thai !== 'Chờ Hoàn Tất Bảo Hành' || !item.thongtinthietbi_id || isLoadingUpdateStatus
                                            }
                                        >
                                            <FaPlusCircle />
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
            <div className="pt-3 mt-5 text-right border-t">
                <button onClick={onClose} className="px-4 py-2 text-gray-800 bg-gray-300 rounded hover:bg-gray-400"> Đóng </button>
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
    const [isAdminReceiveModalOpen, setIsAdminReceiveModalOpen] = useState(false);
    const [selectedTaskForAdminReceive, setSelectedTaskForAdminReceive] = useState(null);

    // --- Fetch Data ---
    const { data: phongListData, isLoading: isLoadingPhong } = useQuery({ queryKey: ['phongList'], queryFn: api.fetchPhongCoTaiSanList });
    const { data: thietBiTrongPhongData, isLoading: isLoadingThietBi } = useQuery({
        queryKey: ['thietBiTrongPhong', selectedPhong?.value],
        queryFn: () => api.fetchThietBiTrongPhongToBaoDuong(selectedPhong.value),
        enabled: !!selectedPhong
    });
    const { data: lichBaoDuongRawData, isLoading: isLoadingLich } = useQuery({
        queryKey: ['lichBaoDuongList'],
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

            // Ưu tiên cao nhất -> thấp nhất: Đang tiến hành > Chờ xử lý > Chờ BH về > Chờ Xem Xét > Hủy > Hoàn thành
            const currentRepStatus = acc[groupKey].representativeStatus;
            const newItemStatus = item.trang_thai;

            if (newItemStatus === 'Đang tiến hành') {
                acc[groupKey].representativeStatus = 'Đang tiến hành';
            } else if (newItemStatus === 'Chờ xử lý' && currentRepStatus !== 'Đang tiến hành') {
                acc[groupKey].representativeStatus = 'Chờ xử lý';
            } else if (newItemStatus === 'Chờ Hoàn Tất Bảo Hành' && !['Đang tiến hành', 'Chờ xử lý'].includes(currentRepStatus)) {
                acc[groupKey].representativeStatus = 'Chờ Hoàn Tất Bảo Hành';
            } else if (newItemStatus === 'Chờ Xem Xét' && !['Đang tiến hành', 'Chờ xử lý', 'Chờ Hoàn Tất Bảo Hành'].includes(currentRepStatus)) {
                acc[groupKey].representativeStatus = 'Chờ Xem Xét';
            } else if (newItemStatus === 'Hủy' && !['Đang tiến hành', 'Chờ xử lý', 'Chờ Hoàn Tất Bảo Hành', 'Chờ Xem Xét'].includes(currentRepStatus)) {
                acc[groupKey].representativeStatus = 'Hủy';
            }

            if (moment(item.ngay_baotri).isBefore(moment(acc[groupKey].firstDate))) {
                acc[groupKey].firstDate = item.ngay_baotri;
            }

            return acc;
        }, {});

        Object.values(groupedByRoom).forEach(group => {
            group.nhanVienDisplay = group.nhanVienList.size > 0 ? Array.from(group.nhanVienList).join(', ') : 'Chưa gán';
            if (!group.representativeStatus) group.representativeStatus = 'Hoàn thành';
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
            queryClient.invalidateQueries({ queryKey: ['lichBaoDuongList'] });
            setIsCreateModalOpen(false);
            setSelectedPhong(null); setSelectedThietBis([]); setSelectedDate(null); setSelectedNhanVien(null); setMoTa('');
        },
        onError: (error) => { console.error("Lỗi mutation tạo lịch:", error); /* Toast đã xử lý */ }
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ ids, data }) => {
            const promises = ids.map(id => api.updateLichBaoDuongStatusAPI(id, data));
            return Promise.all(promises);
        },
        onSuccess: (results, variables) => {
            queryClient.invalidateQueries({ queryKey: ['lichBaoDuongList'] });
            queryClient.invalidateQueries({ queryKey: ['assignedBaoDuongTasks'] });
            queryClient.invalidateQueries({ queryKey: ['myLichBaoDuong'] });
            if (variables.context === 'reset') {
                toast.success(`Đã reset ${variables.ids.length} công việc về 'Chờ xử lý'!`);
            } else if (variables.context === 'cancel') {
                toast.success(`Đã hủy ${variables.ids.length} công việc thành công!`);
            } else {
                toast.success("Cập nhật trạng thái thành công!");
            }
        },
        onError: (error, variables) => {
            console.error("Lỗi mutation cập nhật trạng thái:", error);
            toast.error(`Lỗi khi ${variables.context === 'reset' ? 'reset' : (variables.context === 'cancel' ? 'hủy' : 'cập nhật')} công việc.`);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => api.deleteLichBaoDuongAPI(id),
        onError: (error, id) => {
            console.error(`Lỗi khi xóa lịch bảo dưỡng ID ${id}:`, error);
        }
    });

    // --- Handlers ---
    const handleAdminApproveCompletion = useCallback((taskItem) => {
        if (!taskItem || taskItem.trang_thai !== 'Chờ Xem Xét') return;
        if (window.confirm(`Xác nhận hoàn thành công việc bảo dưỡng ID ${taskItem.id} cho thiết bị ${taskItem.tenThietBi || 'N/A'}?`)) {
            updateStatusMutation.mutate({
                ids: [taskItem.id],
                data: { trang_thai: 'Hoàn thành' },
                context: 'approve_completion'
            });
        }
    }, [updateStatusMutation]);
    const handleAdminRequestRework = useCallback((taskItem) => {
        if (!taskItem || taskItem.trang_thai !== 'Chờ Xem Xét') return;
        const ghiChu = prompt(`Nhập lý do yêu cầu làm lại cho công việc ID ${taskItem.id} (bỏ trống nếu không có):`);
        if (ghiChu === null) return;

        updateStatusMutation.mutate({
            ids: [taskItem.id],
            data: {
                trang_thai: 'Yêu cầu làm lại', // Backend sẽ xử lý thành 'Chờ xử lý'
                ghiChuAdmin: ghiChu || null
            },
            context: 'request_rework'
        });

    }, [updateStatusMutation]);
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
            .filter(item => !['Hoàn thành', 'Hủy', 'Chờ xử lý'].includes(item.trang_thai))
            .map(item => item.id);

        if (originalIdsToCancel.length === 0) {
            toast.info("Không có công việc nào trong nhóm này cần hủy (Đang tiến hành/Chờ BH).");
            return;
        }
        if (window.confirm(`Bạn có chắc muốn RESET ${originalIdsToCancel.length} công việc bảo dưỡng (trạng thái Đang tiến hành/Chờ BH) tại phòng ${group.tenPhong} về 'Chờ xử lý'?`)) {
            updateStatusMutation.mutate({ ids: originalIdsToCancel, data: { trang_thai: 'Chờ xử lý' }, context: 'cancel' }); // Gửi context
        }
    }, [updateStatusMutation]);

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
            queryClient.invalidateQueries({ queryKey: ['lichBaoDuongList'] });

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
        setLogModalInfo({ isOpen: true, lichbaoduongId: itemId, thongtinthietbiId: thietBiId, tenThietBi, phongName });
    }, []);

    const handleCloseLogModal = useCallback(() => {
        setLogModalInfo({ isOpen: false, lichbaoduongId: null, thongtinthietbiId: null, tenThietBi: null, phongName: null });
    }, []);

    const handleOpenAdminReceiveModal = useCallback((taskItem) => {
        if (!taskItem || !taskItem.thongtinthietbi_id || !taskItem.id) {
            toast.error("Thiếu thông tin Lịch bảo dưỡng hoặc Thiết bị liên kết.");
            return;
        }
        // Chuẩn bị dữ liệu cho FormNhanBaoHanhVe
        const deviceInfoForModal = {
            id: taskItem.thongtinthietbi_id,
            tenThietBi: taskItem.tenThietBi,
            phong_id: taskItem.phong_id,
            phong_name: taskItem.tenPhong,
            relatedBaoHongId: null,
            relatedLichBaoDuongId: taskItem.id
        };
        setSelectedTaskForAdminReceive(deviceInfoForModal);
        setIsAdminReceiveModalOpen(true);
    }, []);

    const handleCloseAdminReceiveModal = useCallback(() => {
        setSelectedTaskForAdminReceive(null);
        setIsAdminReceiveModalOpen(false);
    }, []);

    // Xử lý khi FormNhanBaoHanhVe thành công
    const handleAdminReceiveSuccess = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['lichBaoDuongList'] });
        queryClient.invalidateQueries({ queryKey: ['assignedBaoDuongTasks'] });
        queryClient.invalidateQueries({ queryKey: ['myLichBaoDuong'] });
        queryClient.invalidateQueries({ queryKey: ['taiSanList'] });
        if (selectedTaskForAdminReceive?.id) {
            queryClient.invalidateQueries({ queryKey: ['thongTinThietBi', selectedTaskForAdminReceive.id] });
            queryClient.invalidateQueries({ queryKey: ['baotriLogs', { thongtinthietbi_id: selectedTaskForAdminReceive.id }] }); // Invalidate log theo TTTB
        }
        handleCloseAdminReceiveModal();
    }, [queryClient, selectedTaskForAdminReceive, handleCloseAdminReceiveModal]);

    useEffect(() => {
        if (viewingRoomDetail?.key) {
            const latestGroupData = filteredAndGroupedList.find(
                group => group.key === viewingRoomDetail.key
            );
            if (latestGroupData) {
                if (latestGroupData.taskCount !== viewingRoomDetail.taskCount ||
                    latestGroupData.representativeStatus !== viewingRoomDetail.representativeStatus ||
                    JSON.stringify(latestGroupData.originalItems) !== JSON.stringify(viewingRoomDetail.originalItems)
                ) {
                    console.log(`[useEffect] Updating viewingRoomDetail for key: ${viewingRoomDetail.key}`);
                    setViewingRoomDetail(latestGroupData);
                }
            } else {
                handleCloseDetailModal();
                console.log(`[useEffect] Group key ${viewingRoomDetail.key} not found in latest list.`);
            }
        }
    }, [filteredAndGroupedList, viewingRoomDetail, handleCloseDetailModal]);


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
        <div className="flex flex-col h-full p-4">
            <h3 className="mb-4 text-xl font-semibold shrink-0">Bảo Dưỡng Định Kỳ</h3>

            {/* Hàng nút hành động và Bộ lọc */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4 shrink-0">
                <div className="flex space-x-2">
                    {/* Khôi phục nút Tạo Lịch Mới */}
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center text-sm"
                    >
                        <FaPlus className="w-4 h-4 mr-1" /> Tạo Lịch Đơn
                    </button>
                    <button
                        onClick={() => setIsBulkCreateModalOpen(true)}
                        className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 flex items-center text-sm"
                    >
                        <FaLayerGroup className="w-4 h-4 mr-1" /> Tạo Hàng Loạt
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center px-2 py-1 bg-white border rounded-md">
                        <FaCalendarAlt className="mr-2 text-gray-500" />
                        <input
                            type="month"
                            value={selectedMonthYear}
                            onChange={handleMonthYearChange}
                            className="text-sm border-none focus:ring-0 p-0.5"
                        />
                    </div>
                    <div className="flex items-center px-2 py-1 bg-white border rounded-md">
                        <FaFilter className="mr-2 text-gray-500" />
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
                                        <button
                                            onClick={() => handleCancelGroup(group)}
                                            className={`p-1 ${group.representativeStatus === 'Hoàn thành' ||
                                                group.representativeStatus === 'Hủy' ||
                                                updateStatusMutation.isLoading
                                                ? 'text-gray-400 cursor-not-allowed'
                                                : 'text-yellow-600 hover:text-yellow-800'
                                                } disabled:opacity-50`}
                                            title="Hủy các công việc chưa xong trong tháng"
                                            disabled={
                                                group.representativeStatus === 'Hoàn thành' ||
                                                group.representativeStatus === 'Hủy' ||
                                                updateStatusMutation.isLoading
                                            }
                                        >
                                            <FaBan />
                                        </button>
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
                <span className="ml-4 text-sm text-gray-600">Hiển thị {currentGroupedRows.length} phòng có lịch trong tháng / Tổng {filteredAndGroupedList.length} phòng</span>
            </div>

            {/* Modal Tạo Lịch Mới Đơn Lẻ */}
            <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Tạo Lịch Bảo Dưỡng Mới">
                <form onSubmit={handleCreateSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Chọn Phòng <span className="text-red-500">*</span></label>
                        <Select options={phongOptions} isLoading={isLoadingPhong} onChange={setSelectedPhong} value={selectedPhong} placeholder="Chọn phòng..." isClearable styles={{ menu: base => ({ ...base, zIndex: 9999 }) }} />
                    </div>
                    {selectedPhong && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Chọn Thiết Bị (chọn một hoặc nhiều) <span className="text-red-500">*</span></label>
                            <Select isMulti options={thietBiOptions} isLoading={isLoadingThietBi} onChange={setSelectedThietBis} value={selectedThietBis} placeholder="Chọn thiết bị trong phòng..." isDisabled={!selectedPhong || isLoadingThietBi} styles={{ menu: base => ({ ...base, zIndex: 9998 }) }} />
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Ngày Bảo Dưỡng <span className="text-red-500">*</span></label>
                        <input type="date" required className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" value={selectedDate || ''} onChange={(e) => setSelectedDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
                    </div>
                    {selectedPhong && selectedDate && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Gán Nhân Viên <span className="text-red-500">*</span></label>
                            <Select options={nhanVienOptions} isLoading={!nhanVienOptions && !!selectedDate && !!selectedPhong} onChange={setSelectedNhanVien} value={selectedNhanVien} placeholder="Chọn nhân viên (gợi ý theo ưu tiên)..." isClearable required styles={{ menu: base => ({ ...base, zIndex: 9997 }) }} />
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Mô Tả (Tùy chọn)</label>
                        <textarea rows="3" className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" value={moTa} onChange={(e) => setMoTa(e.target.value)} placeholder="Nhập mô tả công việc..."></textarea>
                    </div>
                    <div className="flex justify-end pt-4 space-x-2">
                        <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Hủy</button>
                        <button type="submit" className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600" disabled={createMutation.isLoading}>
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
                onOpenLog={handleOpenLogModalForItem}
                onAdminReceiveWarranty={handleOpenAdminReceiveModal}
                onAdminApproveCompletion={handleAdminApproveCompletion}
                onAdminRequestRework={handleAdminRequestRework}
                isLoadingUpdateStatus={updateStatusMutation.isPending}
            />

            {/* Modal Xem Log */}
            {logModalInfo.isOpen && (
                <ModalXemLogBaoTri
                    lichbaoduongId={logModalInfo.lichbaoduongId}
                    thongtinthietbiId={logModalInfo.thongtinthietbiId}
                    tenThietBi={logModalInfo.tenThietBi}
                    phongName={logModalInfo.phongName}
                    onClose={handleCloseLogModal}
                />
            )}

            {/* RENDER MODAL NHẬN HÀNG */}
            {isAdminReceiveModalOpen && selectedTaskForAdminReceive && (
                <FormNhanBaoHanhVe
                    key={`admin-receive-lbd-${selectedTaskForAdminReceive.id}-${selectedTaskForAdminReceive.relatedLichBaoDuongId}`}
                    deviceInfo={selectedTaskForAdminReceive}
                    onClose={handleCloseAdminReceiveModal}
                    onSuccess={handleAdminReceiveSuccess}
                />
            )}

        </div>
    );
};

export default LichBaoDuongAdmin;