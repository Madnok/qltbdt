import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FaCheckCircle, FaTimesCircle, FaClock, FaWrench, FaTrashAlt, FaShareSquare, FaPaperPlane } from 'react-icons/fa';
import { getTinhTrangLabel } from '../../utils/constants';
import { formatDate } from '../../utils/helpers';
import { updateTinhTrangTaiSanAPI } from '../../api';
import { toast } from 'react-toastify';
import FormPhanBo from './FormPhanBo';
import FormXuatTaiSan from './FormXuatTaiSan';

const BangTaiSan = ({ data = [], onRowSelect, selectedRowId, triggerRefetch }) => {
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [isPhanBoModalOpen, setIsPhanBoModalOpen] = useState(false);
    const [isXuatModalOpen, setIsXuatModalOpen] = useState(false);
    const queryClient = useQueryClient(); // Để invalidate query sau khi cập nhật
    const selectAllCheckboxRef = useRef();

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
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['taiSan'] }); // Hoặc dùng triggerRefetch
        }
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

    const canCreateExport = useMemo(() => {
        return selectedItems.length > 0 && selectedItems.every(item => item.tinhTrang === 'cho_thanh_ly');
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

    // --- Hàm xử lý Actions ---
    const handleMarkForDisposal = async () => { // Chuyển thành async để dùng await Promise.all
        const idsToUpdate = Array.from(selectedIds);
        if (idsToUpdate.length === 0) return;

        const itemsToActuallyUpdate = selectedItems.filter(item =>
            item.tinhTrang !== 'cho_thanh_ly' && item.tinhTrang !== 'da_thanh_ly'
        );
        const actualIdsToUpdate = itemsToActuallyUpdate.map(item => item.id);

        if (actualIdsToUpdate.length === 0) {
            toast.info("Các mục đã chọn không cần đánh dấu lại.");
            return;
        }
        console.log("Đánh dấu chờ thanh lý cho:", actualIdsToUpdate);
        toast.info(`Đang cập nhật trạng thái cho ${actualIdsToUpdate.length} mục...`);
        try {
            const mutationPromises = actualIdsToUpdate.map(id =>
                updateStatusMutation.mutateAsync({ id, tinhTrang: 'cho_thanh_ly' })
            );
            await Promise.all(mutationPromises);
            toast.success(`Đã cập nhật trạng thái thành công cho ${actualIdsToUpdate.length} mục!`);
            triggerRefetch();
            setSelectedIds(new Set());

        } catch (error) {
            console.error("Có lỗi xảy ra trong quá trình cập nhật hàng loạt.", error);
        }
    };

    const handleAssignToRoom = () => {
        setIsPhanBoModalOpen(true);
    };

    const handleCreateExportSlip = () => {
        setIsXuatModalOpen(true);
    };

    const renderTinhTrang = (tinhTrang) => {
        const label = getTinhTrangLabel(tinhTrang);
        switch (tinhTrang) {
            case 'con_bao_hanh': return <span className="inline-flex items-center text-green-600"><FaCheckCircle className="mr-1" /> {label}</span>;
            case 'het_bao_hanh': return <span className="inline-flex items-center text-red-600"><FaTimesCircle className="mr-1" /> {label}</span>;
            case 'dang_bao_hanh': return <span className="inline-flex items-center text-blue-600"><FaWrench className="mr-1" /> {label}</span>;
            case 'cho_thanh_ly': return <span className="inline-flex items-center text-yellow-600"><FaClock className="mr-1" /> {label}</span>;
            case 'da_thanh_ly': return <span className="inline-flex items-center text-gray-500"><FaTrashAlt className="mr-1" /> {label}</span>;
            default: return label;
        }
    };
    return (
        <div className="bg-white shadow-sm ">
            {/* Khu vực nút hành động được gom nhóm */}
            <div className="flex flex-wrap items-center gap-2 mt-4 mb-8">
                <button
                    onClick={handleMarkForDisposal}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400 disabled:opacity-50"
                    disabled={selectedIds.size === 0 || updateStatusMutation.isPending}
                    >
                    <FaClock className="mr-1.5 h-4 w-4" />
                    {updateStatusMutation.isPending ? '...' : `Chờ Thanh Lý (${selectedIds.size})`}
                </button>
                <button
                    onClick={handleAssignToRoom}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 disabled:opacity-50"
                    disabled={selectedIds.size === 0 || !canAssign || updateStatusMutation.isPending}
                >
                    <FaShareSquare className="mr-1.5 h-4 w-4" />
                    Phân bổ ({selectedItems.filter(i => i.phong_id === null).length})
                </button>
                <button
                    onClick={handleCreateExportSlip}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-400 disabled:opacity-50"
                    disabled={selectedIds.size === 0 || !canCreateExport || updateStatusMutation.isPending}
                >
                    <FaPaperPlane className="mr-1.5 h-4 w-4" />
                    Tạo Phiếu Xuất ({selectedItems.filter(i => i.tinhTrang === 'cho_thanh_ly').length})
                </button>
            </div>

            {/* Bảng dữ liệu được cải thiện style */}
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
                            {/* <th scope="col" className="px-4 py-2 text-xs font-bold tracking-wider text-left text-black uppercase">Tên Tài Sản</th> */}
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
                                className={`hover:bg-gray-50 cursor-pointer ${selectedRowId === item.id ? 'bg-indigo-50' : ''}`} // Hover và selected state
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
                                {/* <td className="px-4 py-2 text-sm text-gray-500 whitespace-nowrap">{item.tenThietBi}</td> */}
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
                <FormXuatTaiSan
                    isOpen={isXuatModalOpen}
                    onClose={() => setIsXuatModalOpen(false)}
                    // Lọc và chỉ truyền những item có trạng thái 'cho_thanh_ly' vào form
                    itemsToExport={selectedItems.filter(item => item.tinhTrang === 'cho_thanh_ly')}
                    triggerRefetch={() => {
                        triggerRefetch(); // Gọi hàm refetch của cha
                        setSelectedIds(new Set()); // Xóa lựa chọn sau khi xuất thành công
                    }}
                />
            )}
        </div>
    );
};
export default BangTaiSan;