import React, { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
    FaPlus, FaEdit, FaTrash, FaSave, FaSearch,
    FaSpinner, FaBoxOpen, FaFilter, FaExclamationTriangle
} from 'react-icons/fa';
import {
    fetchTheLoaiListWithCount,
    createTheLoai,
    updateTheLoai,
    deleteTheLoai,
    fetchThietBiByTheLoai
} from '../../api';
import Pagination from '../layout/Pagination';
import { paginateData } from '../../utils/helpers';

const THE_LOAI_QUERY_KEY = ['theloai', 'list'];
const ITEMS_PER_PAGE = 12;

/** Hook lấy danh sách thể loại */
const useTheLoaiListInternal = () => {
    return useQuery({
        queryKey: THE_LOAI_QUERY_KEY,
        queryFn: fetchTheLoaiListWithCount,
        staleTime: 1000 * 60 * 5,
        select: (data = []) => {
            if (!Array.isArray(data)) return [];
            return [...data].sort((a, b) => a.theLoai.localeCompare(b.theLoai));
        }
    });
};

/** Hook thêm thể loại mới */
const useThemTheLoaiInternal = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createTheLoai,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: THE_LOAI_QUERY_KEY });
            toast.success(`Đã thêm thể loại "${data?.theLoai || ''}"!`);
        },
        onError: (error) => { console.error("Lỗi khi thêm thể loại:", error); },
    });
};

/** Hook cập nhật thể loại */
const useCapNhatTheLoaiInternal = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateTheLoai,
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: THE_LOAI_QUERY_KEY });
            toast.success(`Đã cập nhật thể loại ID ${variables.id}!`);
        },
        onError: (error, variables) => { console.error(`Lỗi khi cập nhật thể loại ID ${variables.id}:`, error); },
    });
};

/** Hook xóa thể loại */
const useXoaTheLoaiInternal = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteTheLoai, // Nhận id
        onSuccess: (data, id) => {
            queryClient.invalidateQueries({ queryKey: THE_LOAI_QUERY_KEY });
            toast.success(`Đã xóa thể loại ID ${id}!`);
        },
        onError: (error, id) => {
            console.error(`Lỗi khi xóa thể loại ID ${id}:`, error);
            const message = error.response?.data?.message || error.response?.data?.error || "Xóa thể loại thất bại.";
            if (!error.response?.data?.message && !error.response?.data?.error) {
                toast.error(message);
            }
        },
    });
};

/** Hook lấy danh sách thiết bị theo thể loại */
const useThietBiByTheLoaiInternal = (theLoaiId) => {
    return useQuery({
        queryKey: ['thietbi', 'byTheLoai', theLoaiId],
        queryFn: () => fetchThietBiByTheLoai(theLoaiId),
        enabled: !!theLoaiId,
        staleTime: 1000 * 60,
        placeholderData: { data: [], count: 0 },
    });
};

// --- Component Helper ---

const DanhSachThietBiMini = ({ theLoaiId }) => {
    const { data: apiResponse, isLoading, isError, error } = useThietBiByTheLoaiInternal(theLoaiId);
    const thietBiList = apiResponse?.data || [];
    const thietBiCount = apiResponse?.count ?? 0;


    if (isLoading) return <div className='text-sm text-gray-500 italic animate-pulse'>Đang tải thiết bị...</div>;
    if (isError) return <div className='text-sm text-red-500 italic'>Lỗi tải thiết bị: {error.message}</div>;

    return (
        <div>
            <p className="text-sm text-gray-600 mb-2">
                Tổng số thiết bị: <span className='font-semibold'>{thietBiCount}</span>
            </p>
            {thietBiCount === 0 ? (
                <div className='text-sm text-gray-500 italic'>Không có thiết bị nào.</div>
            ) : (
                <div className="max-h-48 overflow-y-auto border rounded-md p-2 bg-gray-50">
                    <ul className="space-y-1 text-sm text-gray-700">
                        {thietBiList.map(tb => (
                            <li key={tb.id} className="flex justify-between items-center text-xs hover:bg-gray-100 px-1 rounded">
                                <span>{tb.tenThietBi}</span>
                                <span className="text-gray-400">(ID: {tb.id})</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};


// ============================================================
// Component Chính: TheLoai (Sử dụng const)
// ============================================================
const TheLoai = () => {
    // --- State Quản lý Giao Diện ---
    const [selectedTheLoai, setSelectedTheLoai] = useState(null);
    const [mode, setMode] = useState('idle');
    const [formInputValue, setFormInputValue] = useState(''); // Lưu giá trị input của form add/edit
    const [formError, setFormError] = useState(''); // Lưu lỗi validation của form
    const [searchTerm, setSearchTerm] = useState('');
    const [deviceFilter, setDeviceFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);

    // --- Sử dụng TanStack Query Hooks ---
    const { data: theLoaiList = [], isLoading: isLoadingList, isError: isListError, error: listError } = useTheLoaiListInternal();
    const { mutate: themTheLoai, isLoading: isAdding } = useThemTheLoaiInternal();
    const { mutate: capNhatTheLoai, isLoading: isUpdating } = useCapNhatTheLoaiInternal();
    const { mutate: xoaTheLoai, isLoading: isDeleting } = useXoaTheLoaiInternal();


    const isMutating = isAdding || isUpdating || isDeleting;

    // --- Filtering Logic ---
    const filteredTheLoaiList = useMemo(() => {
        const lowerSearchTerm = searchTerm.toLowerCase();

        return theLoaiList.filter(tl => {
            // Lọc theo search term
            const matchesSearch = !lowerSearchTerm ||
                tl.theLoai.toLowerCase().includes(lowerSearchTerm) ||
                String(tl.id).includes(lowerSearchTerm);

            if (!matchesSearch) return false;

            // Lọc theo deviceFilter
            const count = Number(tl.thietBiCount);
            const hasCount = Object.prototype.hasOwnProperty.call(tl, 'thietBiCount') && !isNaN(count); // Kiểm tra key tồn tại và là số

            if (deviceFilter === 'hasDevices') {
                return hasCount && count > 0;
            } else if (deviceFilter === 'noDevices') {
                return !hasCount || count === 0;
            }
            return true; // 'all'
        });
    }, [theLoaiList, searchTerm, deviceFilter]);

    // --- Pagination Logic ---
    const {
        currentItems: paginatedTheLoaiList,
        totalPages,
        indexOfFirstItem
    } = useMemo(() => {
        return paginateData(filteredTheLoaiList, currentPage, ITEMS_PER_PAGE);
    }, [filteredTheLoaiList, currentPage]);

    // --- Event Handlers ---

    // Chọn dòng -> cập nhật state và giá trị form
    const handleSelectRow = useCallback((theLoai) => {
        if (isMutating) return;
        setSelectedTheLoai(theLoai);
        setFormInputValue(theLoai.theLoai); // Cập nhật input state
        setFormError(''); // Xóa lỗi cũ
        setMode('view');
    }, [isMutating]);

    // Bắt đầu thêm -> reset state, form
    const handleInitiateAdd = useCallback(() => {
        if (isMutating) return;
        setSelectedTheLoai(null);
        setFormInputValue(''); // Reset input
        setFormError(''); // Xóa lỗi
        setMode('add');
    }, [isMutating]);

    // Bắt đầu sửa
    const handleInitiateEdit = useCallback(() => {
        if (isMutating || !selectedTheLoai) return;
        setFormError('');
        setMode('edit');
    }, [isMutating, selectedTheLoai]);

    // Hủy thêm/sửa
    const handleCancel = useCallback(() => {
        setSelectedTheLoai(null);
        setFormInputValue('');
        setFormError('');
        setMode('idle');
    }, []);

    // Xử lý xóa
    const handleDelete = useCallback(() => {
        if (isMutating || !selectedTheLoai) return;
        if (window.confirm(`Bạn có chắc chắn muốn xóa thể loại "${selectedTheLoai.theLoai}" (ID: ${selectedTheLoai.id})?`)) {
            xoaTheLoai(selectedTheLoai.id, { onSuccess: handleCancel });
        }
    }, [isMutating, selectedTheLoai, xoaTheLoai, handleCancel]);

    // Xử lý thay đổi input form
    const handleInputChange = (e) => {
        setFormInputValue(e.target.value);
        if (formError) { // Xóa lỗi khi người dùng nhập
            setFormError('');
        }
    };

    // Xử lý Submit Form (Add/Edit) - không dùng react-hook-form handleSubmit
    const handleFormSubmit = (event) => {
        event.preventDefault();
        const trimmedValue = formInputValue.trim();

        // Validation đơn giản
        if (!trimmedValue) {
            setFormError('Tên thể loại không được để trống.');
            return;
        }
        setFormError('');

        const payload = { theLoai: trimmedValue };

        if (mode === 'edit' && selectedTheLoai) {
            if (trimmedValue === selectedTheLoai.theLoai) {
                toast.info("Không có thay đổi để lưu.");
                setMode('view');
                return;
            }
            // Gọi mutation cập nhật
            capNhatTheLoai({ id: selectedTheLoai.id, ...payload }, {
                onSuccess: () => {
                    handleSelectRow({ ...selectedTheLoai, ...payload });
                    setMode('view');
                }
            });
        } else if (mode === 'add') {
            // Gọi mutation thêm mới
            themTheLoai(payload, {
                onSuccess: () => {
                    handleCancel();
                }
            });
        }
    };

    // Handler cho bộ lọc số lượng TB
    const handleDeviceFilterChange = useCallback((e) => {
        setDeviceFilter(e.target.value);
        setCurrentPage(1);
        handleCancel();
    }, [handleCancel]);

    // Handler cho Search Term (Reset về trang 1)
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    // Handler cho Pagination
    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
            handleCancel();
            window.scrollTo(0, 0);
        }
    };

    // --- UI Rendering ---
    return (
        <div className="p-4 bg-white min-h-screen font-sans">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

                {/* Cột Danh sách Thể Loại */}
                <div className={`${mode === 'idle' ? 'lg:col-span-12' : 'lg:col-span-7 xl:col-span-8'} transition-all duration-300 ease-in-out bg-white p-5 rounded-xl shadow-lg border-2`}>             
                    {/* Header cột danh sách */}
                    <div className="mb-5 space-y-3">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                            <h2 className="text-xl font-semibold text-gray-700 flex-shrink-0">Danh sách Thể Loại</h2>
                            <div className="flex flex-col sm:flex-row items-center gap-2 flex-grow justify-end">
                                {/* === Bộ lọc Số lượng TB === */}
                                <div className="relative w-full sm:w-auto">
                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"> <FaFilter size={12} /> </span>
                                    <select
                                        value={deviceFilter}
                                        onChange={handleDeviceFilterChange} // Gọi handler mới
                                        className="w-full sm:w-auto pl-8 pr-8 py-2 border border-gray-300 rounded-lg text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                                        aria-label="Lọc theo số lượng thiết bị"
                                    >
                                        <option value="all">Tất cả SL</option>
                                        <option value="hasDevices">Có thiết bị</option>
                                        <option value="noDevices">Không có TB</option>
                                    </select>
                                    <span className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none text-gray-400">
                                        <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                                    </span>
                                </div>
                                {/* === Thanh tìm kiếm === */}
                                <div className="relative w-full sm:w-auto flex-grow max-w-xs">
                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"> <FaSearch size={14} /> </span>
                                    <input type="text" placeholder="Tìm tên hoặc ID..." value={searchTerm} onChange={handleSearchChange} className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
                                </div>
                            </div>
                            {/* === Nút Thêm mới === */}
                            <button onClick={handleInitiateAdd} disabled={isMutating || mode === 'add'} className="px-3 py-2 bg-gray-900 text-white rounded-lg shadow hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1.5 text-sm transition duration-150 flex-shrink-0">
                                <FaPlus size={12} /> Thêm thể loại mới
                            </button>
                        </div>
                    </div>

                    {/* Loading State */}
                    {isLoadingList && (
                        <div className="text-center py-10 text-gray-500">
                            <FaSpinner className="animate-spin h-8 w-8 mx-auto mb-3 text-blue-500" /> Đang tải dữ liệu...
                        </div>
                    )}
                    {/* Error State */}
                    {isListError && (
                        <div className="text-center py-6 text-red-700 bg-red-50 p-4 rounded-lg border border-red-200 flex flex-col items-center gap-2">
                            <FaExclamationTriangle className="h-6 w-6 mb-1" />
                            <span className='font-medium'>Lỗi tải danh sách:</span>
                            <span className='text-sm'>{listError.message || 'Không thể kết nối tới máy chủ.'}</span>
                        </div>
                    )}
                    {/* Table Data */}
                    {!isLoadingList && !isListError && (
                        <>
                            <div className="overflow-y-auto max-h-[65vh] border rounded-lg">
                                <table className="min-w-full divide-y divide-gray-200 ">
                                    <thead className="bg-gray-100 sticky top-0 z-10">
                                        <tr>
                                            <th scope="col" className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-12">STT</th>
                                            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-20">ID</th>
                                            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tên Thể Loại</th>
                                            <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-28">Tổng Loại TB</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {paginatedTheLoaiList.length === 0 && (
                                            <tr><td colSpan="4" className="px-5 py-5 text-center text-sm text-gray-500 italic">
                                                {searchTerm || deviceFilter !== 'all' ? 'Không tìm thấy thể loại phù hợp.' : 'Chưa có thể loại nào.'}
                                            </td></tr>
                                        )}
                                        {paginatedTheLoaiList.map((theLoai, index) => (
                                            <tr key={theLoai.id}
                                                onClick={() => handleSelectRow(theLoai)}
                                                className={`hover:bg-blue-50 cursor-pointer transition duration-150 ease-in-out ${selectedTheLoai?.id === theLoai.id ? 'bg-blue-100 font-semibold' : ''}`}
                                            >
                                                <td className="px-3 py-3 text-center whitespace-nowrap text-sm text-gray-500">{indexOfFirstItem + index + 1}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{theLoai.id}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{theLoai.theLoai}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 text-center">
                                                    {typeof theLoai.thietBiCount === 'number'
                                                        ? <span className={theLoai.thietBiCount > 0 ? 'font-medium text-green-700' : 'text-orange-600'}>{theLoai.thietBiCount}</span>
                                                        : <span className="text-gray-400">-</span>
                                                    }
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {totalPages > 1 && (
                                <div className="mt-4 flex justify-center">
                                    <Pagination
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        onPageChange={handlePageChange}
                                    />
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Cột Chi tiết / Thêm / Sửa (Hẹp hơn) */}
                {mode !== 'idle' && (
                    <div className="lg:col-span-5 xl:col-span-4">
                         <div className="bg-white p-5 rounded-xl shadow-lg border-2 sticky top-6 h-[calc(100vh-3rem)]">
                             <div className='flex flex-col h-full'>
                                 <div className='flex-grow overflow-y-auto pr-2 -mr-2'>
                                    {/* --- Chế độ Thêm --- */}
                                    {mode === 'add' && (
                                        <>
                                            <h2 className="text-xl font-semibold text-gray-700 mb-5 border-b pb-2">Thêm Thể Loại Mới</h2>
                                            <form onSubmit={handleFormSubmit} className="space-y-4">
                                                <div>
                                                    <label htmlFor="theLoaiAdd" className="block text-sm font-medium text-gray-700 mb-1">Tên Thể Loại <span className="text-red-500">*</span></label>
                                                    <input
                                                        id="theLoaiAdd"
                                                        type="text"
                                                        value={formInputValue}
                                                        onChange={handleInputChange}
                                                        className={`w-full p-2.5 border rounded-md shadow-sm ${formError ? 'border-red-500' : 'border-gray-300'} focus:ring-indigo-500 focus:border-indigo-500 text-sm`}
                                                        disabled={isAdding}
                                                        autoFocus
                                                        maxLength={100} // Giới hạn độ dài
                                                    />
                                                    {formError && <p className="text-red-600 text-xs mt-1">{formError}</p>}
                                                </div>
                                                <div className="flex justify-end space-x-3 pt-3 border-t mt-5">
                                                    <button type="button" onClick={handleCancel} disabled={isAdding} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50 text-sm">Hủy</button>
                                                    <button type="submit" disabled={isAdding} className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-wait flex items-center justify-center gap-2 text-sm">
                                                        {isAdding ? <FaSpinner className="animate-spin" /> : <FaSave />} Thêm
                                                    </button>
                                                </div>
                                            </form>
                                        </>
                                    )}
                                    {/* --- Chế độ Xem Chi Tiết --- */}
                                    {mode === 'view' && selectedTheLoai && (
                                        <>
                                            <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">Chi tiết thể loại: <span className='text-blue-600'>{selectedTheLoai.theLoai}</span></h2>
                                            <dl className="space-y-3 mb-5 text-sm">
                                                <div className="flex justify-between items-center border-b pb-2">
                                                    <dt className="font-medium text-gray-500">ID:</dt>
                                                    <dd className="text-gray-700 font-mono bg-gray-100 px-2 py-0.5 rounded">{selectedTheLoai.id}</dd>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <dt className="font-medium text-gray-500">Tên:</dt>
                                                    <dd className="text-gray-900 font-semibold">{selectedTheLoai.theLoai}</dd>
                                                </div>
                                            </dl>
                                            <div className="mt-5">
                                                <h3 className="text-base font-semibold text-gray-600 mb-2 flex items-center gap-2"><FaBoxOpen /> Thiết bị liên quan</h3>
                                                <DanhSachThietBiMini theLoaiId={selectedTheLoai.id} />
                                            </div>
                                            <div className="flex justify-end space-x-2 pt-5 mt-5 border-t">
                                                <button onClick={handleDelete} disabled={isDeleting || isMutating} className="px-3 py-1.5 bg-red-100 text-red-700 rounded-md hover:bg-red-200 disabled:opacity-50 flex items-center gap-1 text-xs transition duration-150">
                                                    {isDeleting ? <FaSpinner className="animate-spin" /> : <FaTrash />} Xóa
                                                </button>
                                                <button onClick={handleInitiateEdit} disabled={isMutating} className="px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200 disabled:opacity-50 flex items-center gap-1 text-xs transition duration-150">
                                                    <FaEdit /> Sửa
                                                </button>
                                                <button type="button" onClick={handleCancel} className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-xs transition duration-150">Đóng</button>
                                            </div>
                                        </>
                                    )}
                                    {/* --- Chế độ Sửa --- */}
                                    {mode === 'edit' && selectedTheLoai && (
                                        <>
                                            <h2 className="text-xl font-semibold text-gray-700 mb-5 border-b pb-2">Sửa Thể Loại</h2>
                                            <form onSubmit={handleFormSubmit} className="space-y-4">
                                                <p className='text-sm text-gray-500 mb-1'>Đang sửa thể loại ID: <span className='font-semibold'>{selectedTheLoai.id}</span></p>
                                                <div>
                                                    <label htmlFor="theLoaiEdit" className="block text-sm font-medium text-gray-700 mb-1">Tên Thể Loại Mới <span className="text-red-500">*</span></label>
                                                    <input
                                                        id="theLoaiEdit"
                                                        type="text"
                                                        value={formInputValue}
                                                        onChange={handleInputChange}
                                                        className={`w-full p-2.5 border rounded-md shadow-sm ${formError ? 'border-red-500' : 'border-gray-300'} focus:ring-indigo-500 focus:border-indigo-500 text-sm`}
                                                        disabled={isUpdating}
                                                        autoFocus
                                                        maxLength={100}
                                                    />
                                                    {formError && <p className="text-red-600 text-xs mt-1">{formError}</p>}
                                                </div>
                                                <div className="flex justify-end space-x-3 pt-3 border-t mt-5">
                                                    <button type="button" onClick={handleCancel} disabled={isUpdating} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50 text-sm">Hủy</button>
                                                    <button type="submit" disabled={isUpdating || formInputValue.trim() === selectedTheLoai.theLoai} className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm">
                                                        {isUpdating ? <FaSpinner className="animate-spin" /> : <FaSave />} Lưu thay đổi
                                                    </button>
                                                </div>
                                            </form>
                                        </>
                                    )}
                                    {/* --- Trạng thái Chờ / Rỗng --- */}
                                    {mode === 'idle' && (
                                        <div className="text-center text-gray-500 pt-16">
                                            <FaBoxOpen className="mx-auto text-4xl text-gray-300 mb-3" />
                                            <p className="italic text-sm">Chọn một thể loại từ danh sách</p>
                                            <p className='text-sm'>hoặc nhấn "Thêm mới".</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default TheLoai;

