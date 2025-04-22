import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FaCheckCircle, FaTimesCircle, FaClock, FaWrench, FaTrashAlt, FaShareSquare, FaPaperPlane, FaSyncAlt, FaChevronDown, FaQuestionCircle } from 'react-icons/fa';
import { getTinhTrangLabel, TINH_TRANG_OPTIONS } from '../../utils/constants';
import { formatDate } from '../../utils/helpers';
import { updateTinhTrangTaiSanAPI, removeMultipleFromPhongAPI } from '../../api';
import { toast } from 'react-toastify';
import FormPhanBo from './FormPhanBo';
import FormPhieuXuat from '../forms/FormPhieuXuat'; // dùng cái này thay thế.
// checkpoint ở đây

const TARGET_STATUS_OPTIONS = TINH_TRANG_OPTIONS.filter(opt =>
    ['con_bao_hanh', 'het_bao_hanh', 'cho_thanh_ly', 'mat_mat'].includes(opt.value)
);

const BangTaiSan = ({ data = [], onRowSelect, selectedRowId, triggerRefetch }) => {
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [isPhanBoModalOpen, setIsPhanBoModalOpen] = useState(false);
    const [isXuatModalOpen, setIsXuatModalOpen] = useState(false);
    const queryClient = useQueryClient(); // Để invalidate query sau khi cập nhật
    const selectAllCheckboxRef = useRef();
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
    const statusDropdownRef = useRef(null);

    // --- Mutation để cập nhật trạng thái ---
    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, tinhTrang }) => {
            return updateTinhTrangTaiSanAPI(id, { tinhTrang });
        },
        onSuccess: (data, variables) => {
            // console.log(`Cập nhật trạng thái thành công cho ID ${variables.id}`, data);
        },
        onError: (error, variables) => {
            console.error(`Lỗi cập nhật trạng thái cho ID ${variables.id}:`, error);
            // Hiển thị lỗi cho từng ID nếu muốn, hoặc báo lỗi chung ở onSettled/hàm gọi
            toast.error(`Lỗi cập nhật trạng thái cho ID ${variables.id}: ${error.response?.data?.error || error.message}`);
        },
    });
    // --- Kết thúc Mutation ---


    const handleCheckboxChange = (id) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    // --- Hàm xử lý Chọn/Bỏ chọn tất cả ---
    const handleSelectAll = (e) => {
        const isChecked = e.target.checked;
        if (isChecked) {
            const allIds = new Set(data.map(item => item.id));
            setSelectedIds(allIds);
        } else {
            setSelectedIds(new Set());
        }
    };
    const isAllSelected = useMemo(() => data.length > 0 && selectedIds.size === data.length, [data, selectedIds]);
    const isIndeterminate = useMemo(() => selectedIds.size > 0 && selectedIds.size < data.length, [data, selectedIds]);

    useEffect(() => {
        if (selectAllCheckboxRef.current) {
            selectAllCheckboxRef.current.indeterminate = isIndeterminate;
        }
    }, [isIndeterminate]);

    const selectedItems = useMemo(() => {
        return data.filter(item => selectedIds.has(item.id));
    }, [data, selectedIds]);

    // Điều kiện chung để có thể thực hiện hành động (chọn ít nhất 1, không có mục đã thanh lý)
    const canPerformAction = useMemo(() => {
        return selectedItems.length > 0 && !selectedItems.some(item => item.tinhTrang === 'da_thanh_ly');
    }, [selectedItems]);

    const canAssign = useMemo(() => {
        return selectedItems.length > 0 && selectedItems.every(item => item.phong_id === null);
    }, [selectedItems]);

    // --- useEffect để set trạng thái indeterminate cho checkbox ---
    useEffect(() => {
        if (selectAllCheckboxRef.current) {
            selectAllCheckboxRef.current.indeterminate = isIndeterminate;
        }
    }, [isIndeterminate]);

    // Hàm xử lý cập nhật trạng thái mới
    const handleStatusChange = async (targetStatus) => {
        setIsStatusDropdownOpen(false); // Đóng dropdown
        // eslint-disable-next-line
        const idsToUpdate = Array.from(selectedIds);
        if (!canPerformAction || !targetStatus) return;

        // --- Validation cụ thể cho từng targetStatus ---
        let itemsToActuallyUpdate = selectedItems;
        let validationMessage = null;

        // Ví dụ: Không cho chuyển thành 'cho_thanh_ly' nếu thiết bị đang được gán phòng
        if (targetStatus === 'cho_thanh_ly' && !canAssign) {
            validationMessage = "Chỉ có thể chuyển trạng thái 'Chờ thanh lý' cho thiết bị chưa được phân bổ vào phòng.";
            itemsToActuallyUpdate = []; // Không cập nhật gì cả
        } else {
            // Lọc bỏ những item đã ở trạng thái đích hoặc không hợp lệ để chuyển
            itemsToActuallyUpdate = selectedItems.filter(item =>
                item.tinhTrang !== targetStatus &&
                item.tinhTrang !== 'da_thanh_ly' &&
                item.tinhTrang !== 'cho_bao_hanh' &&
                item.tinhTrang !== 'dang_bao_hanh' &&
                item.tinhTrang !== 'da_bao_hanh'
                // Thêm các điều kiện lọc khác nếu cần cho từng targetStatus
            );
        }

        const actualIdsToUpdate = itemsToActuallyUpdate.map(item => item.id);

        if (validationMessage) {
            toast.warn(validationMessage);
            return;
        }

        if (actualIdsToUpdate.length === 0) {
            toast.info("Không có mục nào hợp lệ cần cập nhật trạng thái.");
            return;
        }

        const targetLabel = getTinhTrangLabel(targetStatus);
        console.log(`Chuyển trạng thái sang "${targetLabel}" cho:`, actualIdsToUpdate);
        toast.info(`Đang cập nhật trạng thái "${targetLabel}" cho ${actualIdsToUpdate.length} mục...`);

        try {
            const mutationPromises = actualIdsToUpdate.map(id =>
                updateStatusMutation.mutateAsync({ id, tinhTrang: targetStatus })
            );
            await Promise.all(mutationPromises);
            toast.success(`Đã cập nhật trạng thái "${targetLabel}" thành công cho ${actualIdsToUpdate.length} mục!`);
            // Invalidate query sau khi tất cả thành công
            queryClient.invalidateQueries({ queryKey: ['taiSan'] });
            if (triggerRefetch) triggerRefetch(); // Hoặc dùng triggerRefetch nếu có
            setSelectedIds(new Set()); // Xóa lựa chọn sau khi thành công

        } catch (error) {
            console.error("Có lỗi xảy ra trong quá trình cập nhật hàng loạt.", error);
            // Lỗi đã được hiển thị bởi onError của mutation, có thể thêm toast chung nếu muốn
            toast.error("Cập nhật trạng thái hàng loạt thất bại.");
        }
    };

    // --- Xử lý đóng dropdown khi click bên ngoài ---
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
                setIsStatusDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleAssignToRoom = () => {
        setIsPhanBoModalOpen(true);
    };

    const handleCreateExportSlip = () => {
        setIsXuatModalOpen(true);
    };

    const handleRemoveFromRoom = async () => {
        const payload = selectedItems.map(item => ({
            thongtinthietbi_id: item.id,
            phong_id: item.phong_id
        }));

        try {
            const result = await removeMultipleFromPhongAPI(payload);
            toast.success(result.message || "Đã thu hồi thiết bị.");
            triggerRefetch();
            setSelectedIds(new Set());
        } catch (err) {
            console.error("Lỗi gỡ thiết bị:", err);
            toast.error("Không thể gỡ thiết bị khỏi phòng.");
        }
    };

    const hasDaThanhLySelected = selectedItems.some(item => item.tinhTrang === 'da_thanh_ly');

    const renderTinhTrang = (tinhTrang) => {
        const label = getTinhTrangLabel(tinhTrang);
        switch (tinhTrang) {
            case 'con_bao_hanh': return <span className="inline-flex items-center text-green-600"><FaCheckCircle className="mr-1" /> {label}</span>;
            case 'het_bao_hanh': return <span className="inline-flex items-center text-red-600"><FaTimesCircle className="mr-1" /> {label}</span>;
            case 'dang_bao_hanh': return <span className="inline-flex items-center text-blue-600"><FaWrench className="mr-1" /> {label}</span>;
            case 'da_bao_hanh': return <span className="inline-flex items-center text-purple-600"><FaWrench className="mr-1" /> {label}</span>;
            case 'cho_thanh_ly': return <span className="inline-flex items-center text-yellow-600"><FaClock className="mr-1" /> {label}</span>;
            case 'da_thanh_ly': return <span className="inline-flex items-center text-gray-600"><FaTrashAlt className="mr-1" /> {label}</span>;
            case 'mat_mat': return <span className="inline-flex items-center text-black"><FaQuestionCircle className="mr-1" /> {label}</span>;
            default: return label;
        }
    };
    return (
        <div className="bg-white shadow-sm ">
            {/* Khu vực nút hành động được gom nhóm */}
            <div className="flex flex-wrap items-center gap-2 mt-4 mb-8">
                {/* --- Nút Chuyển trạng thái Dropdown --- */}
                <div className="relative inline-block text-left" ref={statusDropdownRef}>
                    <div>
                        <button
                            type="button"
                            className="inline-flex items-center justify-center w-full px-3 py-1.5 border border-yellow-500 text-xs font-medium rounded-md shadow-sm text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400 disabled:opacity-50"
                            id="status-options-menu"
                            aria-haspopup="true"
                            aria-expanded={isStatusDropdownOpen}
                            onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                            disabled={!canPerformAction || updateStatusMutation.isPending}
                            title={!canPerformAction ? "Chọn ít nhất một thiết bị (không phải đã thanh lý)" : "Chọn trạng thái mới cho thiết bị"}
                        >
                            <FaSyncAlt className="mr-1.5 h-4 w-4" />
                            {updateStatusMutation.isPending ? 'Đang xử lý...' : `Chuyển trạng thái (${selectedIds.size})`}
                            <FaChevronDown className="-mr-1 ml-1.5 h-4 w-4" />
                        </button>
                    </div>

                    {/* Dropdown Menu */}
                    {isStatusDropdownOpen && (
                        <div
                            className="origin-top-left absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
                            role="menu"
                            aria-orientation="vertical"
                            aria-labelledby="status-options-menu"
                        >
                            <div className="py-1" role="none">
                                {TARGET_STATUS_OPTIONS.map((statusOption) => (
                                    <button
                                        key={statusOption.value}
                                        onClick={() => handleStatusChange(statusOption.value)}
                                        className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 disabled:text-gray-400 disabled:bg-transparent"
                                        role="menuitem"
                                    // Thêm disabled nếu cần dựa trên logic phức tạp hơn
                                    // disabled={!canChangeToStatus(statusOption.value, selectedItems)}
                                    >
                                        {renderTinhTrang(statusOption.value)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                {/* --- Kết thúc Nút Chuyển trạng thái Dropdown --- */}

                <button
                    onClick={handleAssignToRoom}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 disabled:opacity-50"
                    disabled={selectedIds.size === 0 || !canAssign || updateStatusMutation.isPending || hasDaThanhLySelected}
                    title={
                        selectedIds.size === 0 ? "Vui lòng chọn thiết bị" :
                            hasDaThanhLySelected ? "Không thể phân bổ thiết bị đã thanh lý" :
                                !canAssign ? "Thiết bị trong số đã chọn đã được gán vào phòng" :
                                    updateStatusMutation.isPending ? "Đang xử lý tác vụ khác..." :
                                        "Phân bổ thiết bị đã chọn vào phòng"
                    }
                >
                    <FaShareSquare className="mr-1.5 h-4 w-4" />
                    Phân Bổ ({selectedItems.filter(i => i.phong_id === null && i.tinhTrang !== 'da_thanh_ly').length})
                </button>
                <button
                    onClick={handleRemoveFromRoom}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 disabled:opacity-50"
                    disabled={selectedItems.length === 0 || !selectedItems.every(i => i.phong_id !== null)}
                    title="Gỡ khỏi phòng các thiết bị đã chọn"
                >
                    <FaTrashAlt className="mr-1.5 h-4 w-4" />
                    Gỡ Khỏi Phòng ({selectedItems.filter(i => i.phong_id !== null).length})
                </button>
                <button
                    onClick={handleCreateExportSlip}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-400 disabled:opacity-50"
                >
                    <FaPaperPlane className="mr-1.5 h-4 w-4" />
                    Tạo Phiếu Xuất
                </button>
            </div>

            {/* Bảng dữ liệu */}
            <div className="overflow-x-auto border border-gray-200 rounded-md">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="w-10 px-4 py-2 text-center">
                                <input
                                    type="checkbox"
                                    ref={selectAllCheckboxRef}
                                    checked={isAllSelected}
                                    onChange={handleSelectAll}
                                    className="w-4 h-4 text-indigo-600 transition duration-150 ease-in-out form-checkbox"
                                />
                            </th>
                            <th scope="col" className="px-4 py-2 text-xs font-bold tracking-wider text-left text-black uppercase">Mã Định Danh</th>
                            <th scope="col" className="px-4 py-2 text-xs font-bold tracking-wider text-left text-black uppercase">Loại TB</th>
                            <th scope="col" className="px-4 py-2 text-xs font-bold tracking-wider text-left text-black uppercase">Thể Loại</th>
                            <th scope="col" className="px-4 py-2 text-xs font-bold tracking-wider text-left text-black uppercase">Vị Trí</th>
                            <th scope="col" className="px-4 py-2 text-xs font-bold tracking-wider text-left text-black uppercase">Ngày Nhập</th>
                            <th scope="col" className="px-4 py-2 text-xs font-bold tracking-wider text-center text-black uppercase">Ngày BH Còn Lại</th>
                            <th scope="col" className="px-4 py-2 text-xs font-bold tracking-wider text-left text-black uppercase">Trạng Thái</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {data.map((item) => (
                            <tr
                                key={item.id}
                                onClick={() => onRowSelect(item)}
                                className={`hover:bg-gray-50 cursor-pointer ${selectedRowId === item.id ? 'bg-indigo-50' : ''}`}
                            >
                                <td className="px-4 py-2 text-center whitespace-nowrap">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.has(item.id)}
                                        onChange={() => handleCheckboxChange(item.id)}
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-4 h-4 text-indigo-600 transition duration-150 ease-in-out form-checkbox"
                                    />
                                </td>
                                <td className="px-4 py-2 text-sm font-medium text-gray-900 whitespace-nowrap">{item.id}</td>
                                <td className="px-4 py-2 text-sm text-gray-500 whitespace-nowrap">{item.tenLoaiThietBi}</td>
                                <td className="px-4 py-2 text-sm text-gray-500 whitespace-nowrap">{item.tenTheLoai}</td>
                                <td className="px-4 py-2 text-sm text-gray-500 whitespace-nowrap">{item.phong_name}</td>
                                <td className="px-4 py-2 text-sm text-gray-500 whitespace-nowrap">{formatDate(item.ngayNhapKho)}</td>
                                <td className="px-4 py-2 text-sm text-center text-gray-500 whitespace-nowrap">{item.ngayBaoHanhConLaiRaw ?? 'N/A'}</td>
                                <td className="px-4 py-2 text-sm whitespace-nowrap">{renderTinhTrang(item.tinhTrang)}</td>
                            </tr>
                        ))}
                        {data.length === 0 && (
                            <tr>
                                <td colSpan="8" className="py-4 text-sm text-center text-gray-500">Không có dữ liệu tài sản.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {isPhanBoModalOpen && (
                <FormPhanBo
                    isOpen={isPhanBoModalOpen}
                    onClose={() => setIsPhanBoModalOpen(false)}
                    selectedIds={Array.from(selectedIds)}
                    triggerRefetch={() => {
                        triggerRefetch();
                        setSelectedIds(new Set());
                    }}
                />
            )}
            {/* Render Modal Xuất Kho */}
            {isXuatModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setIsXuatModalOpen(false)}>
                    <div className="bg-white rounded-lg shadow-xl w-4/5 max-w-5xl max-h-[95vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <FormPhieuXuat
                            isOpen={isXuatModalOpen}
                            onClose={() => setIsXuatModalOpen(false)}
                            onSubmitSuccess={() => {
                                if (triggerRefetch) triggerRefetch();
                                setSelectedIds(new Set());
                                queryClient.invalidateQueries({ queryKey: ['phieuXuatList'] });
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
export default BangTaiSan;