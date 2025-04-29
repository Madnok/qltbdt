import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import { getAllGopYForAdminAPI, updateGopYAPI, deleteGopYAPI } from '../../api';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { FaSpinner, FaSearch } from "react-icons/fa";
import { ArrowUpDown, Edit2, Save, XCircle, ChevronUp, ChevronDown, Trash2, RotateCcw } from 'lucide-react';
import Modal from 'react-modal';

// --- Cấu hình Modal ---
Modal.setAppElement('#root');

// --- Helper tạo options cho Select Filter ---
const getUniqueValues = (rows, columnId) => {
    const uniqueValues = new Set();
    if (Array.isArray(rows)) {
        rows.forEach(row => {
            const value = row?.getValue(columnId);
            if (value !== null && value !== undefined) {
                uniqueValues.add(value);
            } else {
                uniqueValues.add('');
            }
        });
    }
    return [...uniqueValues.values()].sort();
};

// --- Component Chính ---
const AdminGopYManagement = () => {
    const queryClient = useQueryClient();
    const [columnFilters, setColumnFilters] = useState([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [sorting, setSorting] = useState([]);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedGopY, setSelectedGopY] = useState(null);
    const [editedData, setEditedData] = useState({});

    // Fetch danh sách góp ý
    const { data: gopyList = [], isLoading, error } = useQuery({
        queryKey: ['adminGopYList'],
        queryFn: getAllGopYForAdminAPI,
        placeholderData: [],
    });

    // Mutation để cập nhật
    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => updateGopYAPI(id, data),
        onSuccess: (data) => {
            toast.success(data.message || "Cập nhật thành công!");
            queryClient.invalidateQueries(['adminGopYList']);
            closeEditModal();
        },
        onError: (error) => {
            console.error("Update GopY error:", error);
        }
    });

    // Mutation để xóa
    const deleteMutation = useMutation({
        mutationFn: (id) => deleteGopYAPI(id),
        onSuccess: (data) => {
            toast.success(data.message || "Xóa góp ý thành công!");
            queryClient.invalidateQueries(['adminGopYList']); // Refresh lại bảng
        },
        onError: (error) => {
            console.error("Delete GopY error:", error);
            // Toast error đã được xử lý
        }
    });

    // --- Hàm xử lý Modal  ---
    const openEditModal = (gopy) => {
        setSelectedGopY(gopy);
        setEditedData({
            trangThai: gopy.trangThai,
            ghiChuNoiBo: gopy.ghiChuNoiBo || '',
            is_publicly_visible: !!gopy.is_publicly_visible
        });
        setEditModalOpen(true);
    };

    const closeEditModal = () => {
        setEditModalOpen(false);
        setSelectedGopY(null);
        setEditedData({});
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditedData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveChanges = () => {
        if (!selectedGopY) return;
        const changes = {};
        if (editedData.trangThai !== selectedGopY.trangThai) {
            changes.trangThai = editedData.trangThai;
        }
        if (editedData.ghiChuNoiBo !== (selectedGopY.ghiChuNoiBo || '')) {
            changes.ghiChuNoiBo = editedData.ghiChuNoiBo;
        }
        const originalVisible = !!selectedGopY.is_publicly_visible;
        const editedVisible = !!editedData.is_publicly_visible;
        if (editedVisible !== originalVisible) {
            changes.is_publicly_visible = editedVisible;
        }

        if (Object.keys(changes).length === 0) {
            toast.info("Không có thay đổi nào để lưu.");
            closeEditModal();
            return;
        }
        updateMutation.mutate({ id: selectedGopY.id, data: changes });
    };

    // Hàm xử lý khi bấm nút xóa
    const handleDeleteClick = useCallback((gopyId, noiDungGopY) => {
        if (window.confirm(`Bạn có chắc chắn muốn xóa góp ý có nội dung:\n"${noiDungGopY.substring(0, 100)}..." ?\nHành động này không thể hoàn tác.`)) {
            deleteMutation.mutate(gopyId);
        }
    }, [deleteMutation]);

    // --- Kết thúc xử lý Modal ---

    // --- Cấu hình Columns cho TanStack Table ---
    const columnHelper = createColumnHelper();

    const columns = useMemo(
        () => [
            columnHelper.accessor('id', {
                header: 'ID',
                size: 50,
                enableSorting: false,
                enableColumnFilter: false,
            }),
            columnHelper.accessor('loaiGopY', {
                header: 'Loại Góp Ý',
            }),
            columnHelper.accessor('noiDung', {
                header: 'Nội Dung',
                cell: info => <div className="truncate max-w-xs" title={info.getValue()}>{info.getValue()}</div>,
                enableSorting: false,
            }),
            columnHelper.accessor('tenNguoiGui', {
                header: 'Người Gửi',
            }),
            columnHelper.accessor('ngayGopY', {
                header: 'Ngày Gửi',
                cell: info => format(new Date(info.getValue()), 'dd/MM/yyyy HH:mm'),
                enableColumnFilter: false,
            }),
            columnHelper.accessor('trangThai', {
                header: 'Trạng Thái',
            }),
            columnHelper.accessor('likes', {
                header: 'Likes',
                size: 60,
                enableColumnFilter: false,
            }),
            columnHelper.accessor('dislikes', {
                header: 'Dislikes',
                size: 70,
                enableColumnFilter: false,
            }),
            columnHelper.accessor('is_publicly_visible', {
                header: 'Hiển Thị',
                size: 80,
                enableColumnFilter: false,
                enableSorting: true,
                cell: info => {
                    const value = info.getValue();
                    const isVisible = !!value;
                    return (
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${isVisible ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                            {isVisible ? 'Công khai' : 'Riêng tư'}
                        </span>
                    )
                }
            }),
            columnHelper.display({
                id: 'actions',
                header: 'Hành Động',
                size: 100,
                enableSorting: false,
                enableColumnFilter: false,
                cell: props => (
                    <div className="flex space-x-2">
                        <button
                            onClick={() => openEditModal(props.row.original)}
                            className="text-blue-600 hover:text-blue-800 p-1"
                            title="Chỉnh sửa"
                        >
                            <Edit2 size={16} />
                        </button>
                        <button
                            onClick={() => handleDeleteClick(props.row.original.id, props.row.original.noiDung)} // Gọi hàm xóa
                            disabled={deleteMutation.isLoading && deleteMutation.variables === props.row.original.id} // Disable nút khi đang xóa dòng này
                            className="text-red-600 hover:text-red-800 p-1 disabled:opacity-50"
                            title="Xóa góp ý"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ),
            }),
        ],
        [columnHelper, deleteMutation.isLoading, deleteMutation.variables, handleDeleteClick]
    );

    // --- Khởi tạo Table Instance ---
    const table = useReactTable({
        data: gopyList,
        columns,
        state: {
            columnFilters,
            globalFilter,
            sorting,
        },
        onColumnFiltersChange: setColumnFilters, // Callback khi filter thay đổi
        onGlobalFilterChange: setGlobalFilter,
        onSortingChange: setSorting, // Callback khi sort thay đổi
        getCoreRowModel: getCoreRowModel(), // Lấy row model cơ bản
        getFilteredRowModel: getFilteredRowModel(), // Lấy row model sau khi filter
        getSortedRowModel: getSortedRowModel(), // Lấy row model sau khi sort
        getPaginationRowModel: getPaginationRowModel(), // Lấy row model cho phân trang
        debugTable: process.env.NODE_ENV === 'development', // Bật debug mode khi dev
    });
    // --- Kết thúc khởi tạo Table ---
    const coreRows = table.getCoreRowModel().flatRows;
    // --- Lấy options cho các dropdown filter ---
    const loaiGopYOptions = useMemo(() => getUniqueValues(coreRows, 'loaiGopY'), [coreRows]);
    const trangThaiOptions = useMemo(() => getUniqueValues(coreRows, 'trangThai'), [coreRows]);
    const hienThiOptions = [
        { value: 'true', label: 'Công khai' },
        { value: 'false', label: 'Riêng tư' },
    ];

    // Lấy giá trị filter hiện tại cho các cột
    const loaiGopYFilterValue = table.getColumn('loaiGopY')?.getFilterValue() ?? '';
    const trangThaiFilterValue = table.getColumn('trangThai')?.getFilterValue() ?? '';
    // Lấy giá trị filter hiển thị (lưu dưới dạng string 'true'/'false' hoặc '')
    const hienThiFilterValue = table.getColumn('is_publicly_visible')?.getFilterValue() ?? '';

    const resetFilters = () => {
        setColumnFilters([]);
        setGlobalFilter('');
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-32 text-blue-600">
                <FaSpinner className="animate-spin mr-2 text-2xl" />
                <span>Đang tải dữ liệu góp ý...</span>
            </div>
        );
    }
    if (error) return <div className="text-red-600">Lỗi khi tải dữ liệu.</div>;

    return (
        <div className="p-4 bg-white rounded shadow">
            {/* ========== TIÊU ĐỀ VÀ THANH TÌM KIẾM ========== */}
            <div className="flex items-center justify-between mb-4">
                {/* Tiêu đề bên trái */}
                <div className="w-1/3">
                    <h3 className="text-lg font-semibold">Góp Ý Hệ Thống</h3>
                </div>

                {/* Thanh tìm kiếm căn giữa */}
                <div className="w-1/3 flex justify-center">
                    <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md">
                        <input
                            type="text"
                            value={globalFilter ?? ''}
                            onChange={e => setGlobalFilter(e.target.value)}
                            placeholder="Tìm kiếm chung..."
                            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                        <FaSearch className="absolute text-gray-400 transform -translate-y-1/2 top-1/2 left-3" />
                    </div>
                </div>

                {/* Nút xóa bên phải */}
                <div className="w-1/3 flex justify-end">
                    <button
                        className="px-3 py-1 text-sm text-white bg-red-500 rounded hover:bg-red-600 disabled:bg-gray-400"
                        disabled
                    >
                        Xóa mục đã chọn
                    </button>
                </div>
            </div>
            {/* ============================================================= */}

            {/* ========== KHU VỰC FILTER ========== */}
            <div className="mb-4 p-4 bg-gray-50 border rounded-md">
                <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
                    {/* Filter Loại Góp Ý */}
                    <div className="min-w-[160px]">
                        <label htmlFor="loaiGopYFilter" className="block text-sm font-medium text-gray-700 mb-1">Loại Góp Ý</label>
                        <select
                            id="loaiGopYFilter"
                            value={loaiGopYFilterValue}
                            onChange={e => table.getColumn('loaiGopY')?.setFilterValue(e.target.value || undefined)}
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        >
                            <option value="">Tất cả</option>
                            {loaiGopYOptions.map((option, i) => (
                                <option key={i} value={option}>
                                    {option === '' ? 'N/A' : option}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Filter Trạng Thái */}
                    <div className="min-w-[160px]">
                        <label htmlFor="trangThaiFilter" className="block text-sm font-medium text-gray-700 mb-1">Trạng Thái</label>
                        <select
                            id="trangThaiFilter"
                            value={trangThaiFilterValue}
                            onChange={e => table.getColumn('trangThai')?.setFilterValue(e.target.value || undefined)}
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        >
                            <option value="">Tất cả</option>
                            {trangThaiOptions.map((option, i) => (
                                <option key={i} value={option}>
                                    {option === '' ? 'N/A' : option}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* ---  FILTER HIỂN THỊ --- */}
                    <div className="min-w-[160px]">
                        <label htmlFor="hienThiFilter" className="block text-sm font-medium text-gray-700 mb-1">Hiển Thị</label>
                        <select
                            id="hienThiFilter"
                            value={hienThiFilterValue === '' ? '' : String(hienThiFilterValue)} // Convert boolean to string 'true'/'false' for select value
                            onChange={e => {
                                const value = e.target.value;
                                // Convert string 'true'/'false' back to boolean or undefined
                                const filterVal = value === '' ? undefined : (value === 'true');
                                table.getColumn('is_publicly_visible')?.setFilterValue(filterVal);
                            }}
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        >
                            <option value="">Tất cả</option>
                            {hienThiOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    {/* <<<--- KẾT THÚC FILTER HIỂN THỊ ---<<< */}


                    {/* Nút Reset */}
                    <button
                        onClick={resetFilters}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm flex items-center self-end" // self-end để căn dưới cùng nếu các select cao khác nhau
                    >
                        <RotateCcw size={14} className="mr-1" /> Reset
                    </button>
                </div>
            </div>
            {/* ============================================================= */}

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                    <thead className="bg-gray-50">
                        {table.getHeaderGroups().map(headerGroup => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map(header => (
                                    <th
                                        key={header.id}
                                        colSpan={header.colSpan}
                                        className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200"
                                        style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }} // Set width nếu được định nghĩa
                                    >
                                        {header.isPlaceholder ? null : (
                                            <div className={header.column.getCanSort() ? 'cursor-pointer select-none flex items-center justify-between' : 'flex items-center justify-between'}
                                                onClick={header.column.getToggleSortingHandler()}
                                            >
                                                <span>
                                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                                </span>
                                                <span className="ml-1">
                                                    {{
                                                        asc: <ChevronUp size={14} />,
                                                        desc: <ChevronDown size={14} />,
                                                    }[header.column.getIsSorted()] ?? (header.column.getCanSort() ? <ArrowUpDown size={12} className="opacity-30" /> : null)}
                                                </span>
                                            </div>
                                        )}
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {table.getRowModel().rows.map(row => (
                            <tr key={row.id} className="hover:bg-gray-50">
                                {row.getVisibleCells().map(cell => (
                                    <td key={cell.id} className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 border-b border-gray-200">
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </td>
                                ))}
                            </tr>
                        ))}
                        {table.getRowModel().rows.length === 0 && (
                            <tr>
                                <td colSpan={columns.length} className="text-center py-4 text-gray-500">
                                    Không tìm thấy góp ý nào.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            <div className="py-3 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                    <button
                        className="border rounded px-2 py-1 text-sm disabled:opacity-50"
                        onClick={() => table.setPageIndex(0)}
                        disabled={!table.getCanPreviousPage()}
                    >
                        {'<<'}
                    </button>
                    <button
                        className="border rounded px-2 py-1 text-sm disabled:opacity-50"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        {'<'}
                    </button>
                    <button
                        className="border rounded px-2 py-1 text-sm disabled:opacity-50"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        {'>'}
                    </button>
                    <button
                        className="border rounded px-2 py-1 text-sm disabled:opacity-50"
                        onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                        disabled={!table.getCanNextPage()}
                    >
                        {'>>'}
                    </button>
                </div>
                <span className="flex items-center gap-1 text-sm">
                    <div>Trang</div>
                    <strong>
                        {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
                    </strong>
                </span>
                <select
                    value={table.getState().pagination.pageSize}
                    onChange={e => table.setPageSize(Number(e.target.value))}
                    className="border rounded p-1 text-sm"
                >
                    {[10, 20, 30].map(pageSize => (
                        <option key={pageSize} value={pageSize}>
                            Hiển thị {pageSize}
                        </option>
                    ))}
                </select>
            </div>


            {/* Edit Modal */}
            <Modal
                isOpen={editModalOpen}
                onRequestClose={closeEditModal}
                contentLabel="Chỉnh Sửa Góp Ý"
                className="fixed inset-0 flex items-center justify-center p-4 bg-black bg-opacity-50"
                overlayClassName="fixed inset-0 bg-black bg-opacity-30"
            >
                <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
                    {/* Nội dung modal */}
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">Chỉnh Sửa Góp Ý #{selectedGopY?.id}</h2>
                        <button onClick={closeEditModal} className="text-gray-500 hover:text-gray-700">
                            <XCircle size={20} />
                        </button>
                    </div>
                    {selectedGopY && (
                        <div className="space-y-4">
                            <div><span className="font-medium">Loại:</span> {selectedGopY.loaiGopY}</div>
                            <div><span className="font-medium">Nội dung:</span> <p className='whitespace-pre-wrap'>{selectedGopY.noiDung}</p></div>
                            <div><span className="font-medium">Người gửi:</span> {selectedGopY.tenNguoiGui}</div>
                            <div><span className="font-medium">Ngày gửi:</span> {format(new Date(selectedGopY.ngayGopY), 'dd/MM/yyyy HH:mm')}</div>

                            <div className="border-t pt-4">
                                <label htmlFor="trangThai" className="block text-sm font-medium text-gray-700 mb-1">Trạng Thái</label>
                                <select
                                    id="trangThai"
                                    name="trangThai"
                                    value={editedData.trangThai || ''}
                                    onChange={handleEditChange}
                                    className="w-full border-2 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                                >
                                    <option value="Mới">Mới</option>
                                    <option value="Đang xử lý">Đang xử lý</option>
                                    <option value="Đã phản hồi">Đã phản hồi</option>
                                    <option value="Đã từ chối">Đã từ chối</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="ghiChuNoiBo" className="block text-sm font-medium text-gray-700 mb-1">Ghi Chú Nội Bộ</label>
                                <textarea
                                    id="ghiChuNoiBo"
                                    name="ghiChuNoiBo"
                                    rows="3"
                                    value={editedData.ghiChuNoiBo || ''}
                                    onChange={handleEditChange}
                                    className="w-full border-2 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                                    placeholder="Thêm ghi chú cho việc xử lý..."
                                />
                            </div>

                            <div className="flex items-center pt-2">
                                <input
                                    id="is_publicly_visible"
                                    name="is_publicly_visible"
                                    type="checkbox"
                                    checked={!!editedData.is_publicly_visible}
                                    onChange={(e) => setEditedData(prev => ({ ...prev, is_publicly_visible: e.target.checked }))}
                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <label htmlFor="is_publicly_visible" className="ml-2 block text-sm text-gray-900">
                                    Cho phép hiển thị công khai
                                </label>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={closeEditModal}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSaveChanges}
                                    disabled={updateMutation.isLoading}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center text-sm"
                                >
                                    <Save size={16} className="mr-1" />
                                    {updateMutation.isLoading ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default AdminGopYManagement;