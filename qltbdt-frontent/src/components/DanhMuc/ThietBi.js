import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    FaSearch, FaFilter, FaChevronDown, FaChevronUp, FaPlus,
    FaTrash, FaSpinner, FaExclamationTriangle, FaCheckCircle, FaEdit,
    FaTimesCircle, FaClock, FaWrench, FaTrashAlt, FaInfoCircle, FaHistory
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import ModalXemLogBaoTri from '../CongViec/ModalXemLogBaoTri';
import {
    getThietBi,         // GET /api/thietbi 
    fetchTheLoaiList,   // GET /api/theloai 
    getTTTBByMaThietBi, // GET /api/tttb/thietbi/:maThietBi 
    deleteThietBi,      // DELETE /api/thietbi/:id
} from '../../api';
import { paginateData, formatDate } from '../../utils/helpers';
import { getTinhTrangLabel, renderTrangThaiHoatDong } from '../../utils/constants'
import Pagination from '../layout/Pagination';
import Popup from '../layout/Popup';
import FormThietBi from '../forms/FormThietBi';
import ChiTietThongTinThietBi from '../DanhMuc/ChiTiet/ChiTietThongTinThietBi';
import { useAuth } from '../../context/AuthProvider';

// --- Constants ---
const ITEMS_PER_PAGE_MAIN = 10;     // Số lượng Loại TB trên mỗi trang chính
const ITEMS_PER_PAGE_DETAILS = 5;   // Số lượng TTTB trên mỗi trang chi tiết

// ============================================================================
// COMPONENT: ChiTietTaiSanRow (Hiển thị một dòng Tình Trạng Thiết Bị - TTTB)
// ============================================================================
const ChiTietTaiSanRow = React.memo(({ tttb, onViewDetails, onOpenLogModal }) => {
    // Function để lấy style và icon dựa trên tình trạng
    const getTinhTrangElement = (tinhTrang) => {
        const label = getTinhTrangLabel(tinhTrang);
        const commonClasses = "inline-flex items-center gap-x-1.5 text-xs font-medium px-2 py-1 rounded-full";
        switch (tinhTrang) {
            case 'con_bao_hanh': return <span className={`${commonClasses} bg-green-100 text-green-700`}><FaCheckCircle /> {label}</span>;
            case 'het_bao_hanh': return <span className={`${commonClasses} bg-red-100 text-red-700`}><FaTimesCircle /> {label}</span>;
            case 'dang_bao_hanh': return <span className={`${commonClasses} bg-blue-100 text-blue-700`}><FaWrench /> {label}</span>;
            case 'da_bao_hanh': return <span className={`${commonClasses} bg-purple-100 text-purple-700`}><FaWrench /> {label}</span>;
            case 'cho_thanh_ly': return <span className={`${commonClasses} bg-yellow-100 text-yellow-700`}><FaClock /> {label}</span>;
            case 'da_thanh_ly': return <span className={`${commonClasses} bg-gray-100 text-gray-700`}><FaTrashAlt /> {label}</span>;
            default: return <span className={`${commonClasses} bg-gray-50 text-gray-600`}>{label || 'Không xác định'}</span>;
        }
    };

    // Lấy thông tin phòng và ngày nhập một cách an toàn
    const tenPhong = tttb.phong_name || <span className="italic text-gray-400">Chưa phân bổ</span>;

    const ngayNhap = tttb.ngayNhapKho ? formatDate(tttb.ngayNhapKho) : <span className="italic text-gray-400">Không rõ</span>;
    return (
        <tr className="text-sm hover:bg-slate-50">
            {/* Mã định danh TTTB (id của TTTB) */}
            <td className="px-4 py-2 text-gray-700 whitespace-nowrap">{tttb.id}</td>
            {/* Trạng thái của TTTB */}
            <td className="px-4 py-2 text-gray-600 whitespace-nowrap">{renderTrangThaiHoatDong(tttb.trangThaiHoatDong)}</td>
            {/* Tình trạng TTTB */}
            <td className="px-4 py-2 whitespace-nowrap">{getTinhTrangElement(tttb.tinhTrang)}</td>
            {/* Phòng hiện tại */}
            <td className="px-4 py-2 text-gray-600 whitespace-nowrap">{tenPhong}</td>
            {/* Ngày nhập kho */}
            <td className="px-4 py-2 text-gray-600 whitespace-nowrap">{ngayNhap}</td>
            {/* Hành động */}
            <td className="px-4 py-2 text-center whitespace-nowrap">
                <div className="flex items-center justify-center gap-x-3">
                    {/* Nút xem chi tiết TTTB */}
                    <button
                        onClick={(e) => { e.stopPropagation(); onViewDetails(tttb.id); }}
                        className="text-blue-500 transition duration-150 ease-in-out hover:text-blue-700"
                        title={`Xem chi tiết tài sản #${tttb.id}`}
                    >
                        <FaInfoCircle />
                    </button>
                    {/*  NÚT XEM LOG */}
                    <button
                        onClick={(e) => { e.stopPropagation(); onOpenLogModal(tttb); }}
                        className="text-purple-600 transition duration-150 ease-in-out hover:text-purple-800"
                        title={`Xem lịch sử bảo trì #${tttb.id}`}
                        disabled={!onOpenLogModal}
                    >
                        <FaHistory />
                    </button>
                </div>
            </td>
        </tr>
    );
});

// ============================================================================
// COMPONENT: ThietBi (Component chính quản lý danh sách Loại Thiết Bị)
// ============================================================================
function ThietBi() {
    // --- State Definitions ---
    const [thietBiList, setThietBiList] = useState([]);         // Danh sách gốc các Loại Thiết Bị
    const [theLoaiList, setTheLoaiList] = useState([]);         // Danh sách các Thể Loại (để filter)
    const [loading, setLoading] = useState(true);               // Loading state cho danh sách chính
    const [loadingTheLoai, setLoadingTheLoai] = useState(true); // Loading state cho danh sách thể loại
    const [error, setError] = useState(null);                   // Lỗi khi fetch danh sách chính
    const [searchTerm, setSearchTerm] = useState('');           // Từ khóa tìm kiếm (tên hoặc mã loại TB)
    const [selectedCategory, setSelectedCategory] = useState('');// Thể loại được chọn để lọc
    const [currentPageMain, setCurrentPageMain] = useState(1);  // Trang hiện tại của bảng chính
    const { hasRole } = useAuth();

    // State quản lý việc mở rộng và dữ liệu chi tiết (TTTB) cho từng Loại Thiết Bị
    const [expandedThietBiId, setExpandedThietBiId] = useState(null); // ID của Loại TB đang được mở rộng
    const [dropdownData, setDropdownData] = useState({});

    const [showAddForm, setShowAddForm] = useState(false);
    const [selectedTTTBId, setSelectedTTTBId] = useState(null);
    const [showTTTBDetailModal, setShowTTTBDetailModal] = useState(false); // State cho modal chi tiết TTTB
    const [isLogModalOpen, setIsLogModalOpen] = useState(false);
    const [selectedAssetForLog, setSelectedAssetForLog] = useState(null);


    // --- Data Fetching ---
    const fetchData = useCallback(async () => {
        console.log("Fetching initial data...");
        setLoading(true);
        setLoadingTheLoai(true);
        setError(null);
        setExpandedThietBiId(null); // Đóng tất cả dropdown khi fetch lại
        setDropdownData({});        // Xóa cache dropdown

        try {
            const [thietBiRes, theLoaiRes] = await Promise.all([
                getThietBi(),
                fetchTheLoaiList()
            ]);

            // --- Xử lý danh sách Loại Thiết Bị ---
            console.log("API getThietBi raw response:", thietBiRes);
            const deviceRows = thietBiRes?.data?.data?.rows;
            if (Array.isArray(deviceRows)) {
                const validData = deviceRows.filter(item => item && typeof item.tenThietBi === 'string' && item.id !== undefined);
                const sortedData = [...validData].sort((a, b) => a.tenThietBi.localeCompare(b.tenThietBi));
                setThietBiList(sortedData);
                console.log("Processed ThietBi list:", sortedData.length);
            } else {
                // Log lỗi cụ thể hơn
                console.error("API getThietBi response data structure is not as expected. Expected array at response.data.data.rows, received:", thietBiRes?.data);
                setThietBiList([]);
                // Ném lỗi rõ ràng hơn
                throw new Error('Cấu trúc dữ liệu Loại Thiết Bị trả về không hợp lệ.');
            }

            // --- Xử lý danh sách Thể Loại ---
            console.log("API fetchTheLoaiList raw response:", theLoaiRes);
            if (Array.isArray(theLoaiRes)) {
                setTheLoaiList(theLoaiRes || []);
                console.log("Fetched TheLoai list:", theLoaiRes.length);
            } else {
                console.warn("API fetchTheLoaiList did not return an array as expected:", theLoaiRes);
                setTheLoaiList([]);
                toast.warn('Không thể tải danh sách Thể Loại để lọc.');
            }

        } catch (err) {
            console.error("Error fetching data:", err);
            const errorMessage = err.message || err.response?.data?.message || 'Đã xảy ra lỗi khi tải dữ liệu.';
            setError(errorMessage);
            if (!errorMessage.startsWith('Cấu trúc dữ liệu')) {
                toast.error(errorMessage);
            }
        } finally {
            setLoading(false);
            setLoadingTheLoai(false);
        }
    }, []);

    // useEffect để gọi fetchData khi component mount lần đầu
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // --- Filtering Logic ---
    const filteredDeviceTypes = useMemo(() => {
        if (!Array.isArray(thietBiList)) return [];

        return thietBiList.filter(tb => {
            // Điều kiện lọc theo thể loại
            const matchesCategory = selectedCategory ? tb.theloai_id === parseInt(selectedCategory, 10) : true;

            // Điều kiện lọc theo từ khóa tìm kiếm (tìm trong tên hoặc mã ID)
            const searchTermLower = searchTerm.toLowerCase();
            const matchesSearch = searchTerm ?
                (tb.tenThietBi?.toLowerCase().includes(searchTermLower) ||
                    String(tb.id).includes(searchTermLower))
                : true;

            return matchesCategory && matchesSearch;
        });
    }, [thietBiList, selectedCategory, searchTerm]);

    // --- Main Pagination Logic ---
    const {
        currentItems: paginatedDeviceTypes, // Danh sách Loại TB hiển thị trên trang hiện tại
        totalPages: totalPagesMain
    } = useMemo(() => {
        return paginateData(filteredDeviceTypes, currentPageMain, ITEMS_PER_PAGE_MAIN);
    }, [filteredDeviceTypes, currentPageMain]);

    // --- Event Handlers ---

    // Xử lý thay đổi trang cho bảng chính
    const handlePageChangeMain = useCallback((page) => {
        if (page >= 1 && page <= totalPagesMain) {
            setCurrentPageMain(page);
            setExpandedThietBiId(null); // Đóng dropdown khi chuyển trang chính
        }
    }, [totalPagesMain]);

    // Xử lý thay đổi trang cho bảng chi tiết (dropdown)
    const handlePageChangeDetails = useCallback((thietBiId, page) => {
        setDropdownData(prev => {
            if (!prev[thietBiId]) return prev; // Không nên xảy ra, nhưng để an toàn
            return {
                ...prev,
                [thietBiId]: {
                    ...prev[thietBiId],
                    currentPage: page
                }
            };
        });
    }, []);

    // Xử lý mở/đóng dropdown chi tiết và fetch dữ liệu TTTB
    const toggleDetails = useCallback(async (thietBiId) => {
        const isOpening = expandedThietBiId !== thietBiId;
        const currentDetails = dropdownData[thietBiId];

        setExpandedThietBiId(isOpening ? thietBiId : null);

        // Chỉ fetch khi: đang mở lần đầu HOẶC mở lại sau khi bị lỗi HOẶC dữ liệu chưa có
        if (isOpening && (!currentDetails || currentDetails.error || !currentDetails.data)) {
            console.log(`Workspaceing details for ThietBi ID: ${thietBiId}`);
            // Cập nhật trạng thái loading cho dropdown cụ thể này
            setDropdownData(prev => ({
                ...prev,
                [thietBiId]: { data: [], loading: true, error: null, currentPage: 1 } // Reset state khi fetch
            }));

            try {
                // Gọi API lấy danh sách TTTB theo maThietBi (Loại Thiết Bị ID)
                // Backend cần đảm bảo join được Phong và PhieuNhap để lấy TenPhong, NgayNhap
                const response = await getTTTBByMaThietBi(thietBiId);

                if (Array.isArray(response?.data)) {
                    console.log(`Workspaceed details for ${thietBiId}:`, response.data.length, "items");
                    setDropdownData(prev => ({
                        ...prev,
                        [thietBiId]: {
                            ...prev[thietBiId],
                            data: response.data,
                            loading: false,
                            error: null // Xóa lỗi nếu fetch thành công
                        }
                    }));
                } else {
                    console.warn(`Invalid details response for ${thietBiId}:`, response);
                    throw new Error("Dữ liệu chi tiết trả về không hợp lệ.");
                }
            } catch (err) {
                console.error(`Error fetching details for ThietBi ID ${thietBiId}:`, err);
                const detailErrorMessage = err.response?.data?.message || err.message || 'Không thể tải chi tiết.';
                setDropdownData(prev => ({
                    ...prev,
                    [thietBiId]: {
                        ...prev[thietBiId], // Giữ lại data cũ nếu có, hoặc mảng rỗng
                        loading: false,
                        error: detailErrorMessage // Lưu lỗi
                    }
                }));
                toast.error(`Lỗi tải chi tiết cho Loại TB #${thietBiId}: ${detailErrorMessage}`);
            }
        }
    }, [expandedThietBiId, dropdownData]);

    // Mở form thêm
    const handleOpenAddForm = useCallback(() => { setShowAddForm(true); }, []);
    // Đóng form thêm

    const handleCloseAddForm = useCallback(() => { setShowAddForm(false); }, []);

    // Khi thêm thành công 
    const handleAddSuccess = useCallback(() => {
        setShowAddForm(false);
        fetchData();
    }, [fetchData]);

    // Xử lý xóa Loại Thiết Bị
    const handleDelete = useCallback(async (thietBiId, tenThietBi) => {
        const detailInfo = dropdownData[thietBiId];

        if (!detailInfo || detailInfo.loading || detailInfo.error || !Array.isArray(detailInfo.data)) {
            toast.info(`Vui lòng mở và xem chi tiết của "${tenThietBi}" trước khi xóa để đảm bảo không còn tài sản.`);
            return;
        }

        if (detailInfo.data.length > 0) {
            toast.warn(`Không thể xóa loại "${tenThietBi}" (ID: ${thietBiId}) vì đang có ${detailInfo.data.length} tài sản cụ thể thuộc loại này.`);
            return;
        }

        // --- Xác nhận và thực hiện xóa ---
        if (window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn loại thiết bị "${tenThietBi}" (ID: ${thietBiId})?\nLoại này hiện không có tài sản cụ thể nào.`)) {
            console.log(`Attempting to delete ThietBi ID: ${thietBiId}`);
            try {
                await deleteThietBi(thietBiId);
                toast.success(`Đã xóa thành công loại thiết bị "${tenThietBi}".`);
                fetchData();
            } catch (err) {
                console.error("Error deleting ThietBi:", err);
                const deleteErrorMessage = err.response?.data?.message || err.message || 'Lỗi khi xóa loại thiết bị.';
                toast.error(deleteErrorMessage);
            }
        }
    }, [dropdownData, fetchData]);

    // Handler mở modal chi tiết TTTB 
    const handleOpenTTTBDetailModal = useCallback((tttbId) => {
        setSelectedTTTBId(tttbId);
        setShowTTTBDetailModal(true);
    }, []);
    // Handler đóng modal chi tiết TTTB
    const handleCloseTTTBDetailModal = useCallback(() => {
        setSelectedTTTBId(null);
        setShowTTTBDetailModal(false);
    }, []);


    // **Handlers cho modal xem log **
    const handleOpenLogModal = useCallback((assetData) => {
        if (assetData && assetData.id) {
            const loaiTb = thietBiList.find(tb => tb.id === assetData.thietbi_id);
            setSelectedAssetForLog({
                ...assetData,
                tenLoaiThietBi: loaiTb?.tenThietBi
            });
            setIsLogModalOpen(true);
        } else {
            console.error("Attempted to open log modal without valid TTTB data.");
        }
    }, [thietBiList]);

    const handleCloseLogModal = useCallback(() => {
        setIsLogModalOpen(false);
        setSelectedAssetForLog(null);
    }, []);

    // --- Rendering ---
    return (
        <div className="relative min-h-screen p-2 font-sans bg-white md:p-4">
            {/* === Thanh Filter và Nút Thêm === */}
            <div className="flex flex-col items-center justify-between gap-4 p-4 mb-4 bg-white border-2 rounded-lg shadow-sm md:flex-row">
                {/* Filters */}
                <div className='flex flex-col flex-grow w-full gap-4 sm:flex-row md:w-auto'>
                    {/* Search Input */}
                    <div className="relative flex-grow">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 pointer-events-none">
                            <FaSearch />
                        </span>
                        <input
                            type="text"
                            placeholder="Tìm tên hoặc mã loại..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPageMain(1);
                            }}
                            className="w-full py-2 pl-10 pr-4 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </div>
                    {/* Category Select */}
                    <div className="relative w-full md:w-56">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 pointer-events-none">
                            <FaFilter />
                        </span>
                        <select
                            value={selectedCategory}
                            onChange={(e) => {
                                setSelectedCategory(e.target.value);
                                setCurrentPageMain(1); // Reset về trang 1 khi lọc
                            }}
                            className="w-full py-2 pl-10 pr-8 text-sm bg-white border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                            disabled={loadingTheLoai || theLoaiList.length === 0} // Disable nếu đang load hoặc không có thể loại
                        >
                            <option value="">
                                {loadingTheLoai ? 'Đang tải thể loại...' : (theLoaiList.length === 0 ? 'Không có thể loại' : 'Tất cả thể loại')}
                            </option>
                            {!loadingTheLoai && Array.isArray(theLoaiList) && theLoaiList.map(tl => (
                                <option key={tl.id} value={tl.id}>
                                    {tl.theLoai}
                                </option>
                            ))}
                        </select>
                        <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 pointer-events-none">
                            <FaChevronDown className="w-4 h-4" />
                        </span>
                    </div>
                </div>
                {/* Add Button */}
                {hasRole('admin') && (
                    <button
                        onClick={handleOpenAddForm}
                        className="flex items-center justify-center flex-shrink-0 w-full gap-2 px-5 py-2 text-sm font-semibold text-white transition duration-150 ease-in-out bg-gray-900 rounded-md shadow-md md:w-auto hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        <FaPlus /> Thêm Loại Thiết Bị Mới
                    </button>
                )}
            </div>

            {/* === Loading / Error State === */}
            {loading && (
                <div className="flex items-center justify-center gap-2 py-10 text-center text-gray-500">
                    <FaSpinner className="w-5 h-5 animate-spin" /> Đang tải danh sách loại thiết bị...
                </div>
            )}
            {error && !loading && (
                <div className="flex items-center justify-center gap-2 p-4 py-10 font-medium text-center text-red-600 border border-red-200 rounded-md bg-red-50">
                    <FaExclamationTriangle /> {error}
                </div>
            )}

            {/* === Bảng Danh sách Loại Thiết Bị === */}
            {!loading && !error && (
                <>
                    {/* Trường hợp không có dữ liệu sau khi lọc/fetch */}
                    {(filteredDeviceTypes.length === 0) ? (
                        <div className="p-6 py-10 text-center text-gray-500 bg-white rounded-lg shadow">
                            Không tìm thấy loại thiết bị nào phù hợp với tiêu chí tìm kiếm/lọc của bạn.
                        </div>
                    ) : (
                        <div className="overflow-hidden bg-white border-2 rounded-lg shadow">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            {/* Các cột của bảng chính */}
                                            <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Tên Loại Thiết Bị</th>
                                            <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Mã Thiết Bị</th>
                                            <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">Tồn Kho</th>
                                            <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {paginatedDeviceTypes.map(tb => { // tb là một Loại Thiết Bị từ API /api/thietbi
                                            const isExpanded = expandedThietBiId === tb.id;
                                            const detailInfo = dropdownData[tb.id]; // Thông tin chi tiết (TTTB) của loại TB này
                                            const specificAssets = detailInfo?.data || [];
                                            const isLoadingDetails = detailInfo?.loading;
                                            const errorDetails = detailInfo?.error;
                                            const currentPageDetails = detailInfo?.currentPage || 1;

                                            // Tính toán phân trang cho bảng chi tiết
                                            const { currentItems: paginatedDetailsItems, totalPages: totalPagesDetails } = paginateData(
                                                specificAssets,
                                                currentPageDetails,
                                                ITEMS_PER_PAGE_DETAILS
                                            );

                                            // Điều kiện để bật nút xóa: Đã mở chi tiết, không load, không lỗi, và không có TTTB nào
                                            const canDelete = detailInfo && !isLoadingDetails && !errorDetails && Array.isArray(detailInfo.data) && detailInfo.data.length === 0;
                                            const deleteButtonTitle = canDelete
                                                ? `Xóa loại thiết bị "${tb.tenThietBi}" (không có tài sản con)`
                                                : (!detailInfo ? `Mở chi tiết để kiểm tra điều kiện xóa "${tb.tenThietBi}"` : (isLoadingDetails ? 'Đang kiểm tra...' : (errorDetails ? 'Lỗi khi kiểm tra' : `Không thể xóa vì còn ${detailInfo?.data?.length} tài sản con`)));

                                            return (
                                                <React.Fragment key={`fragment-${tb.id}`}>
                                                    {/* === Row Chính (Loại Thiết Bị) === */}
                                                    <tr className={`hover:bg-gray-50 transition duration-150 ease-in-out ${isExpanded ? 'bg-indigo-50' : ''}`}>
                                                        {/* Tên Loại + Mô tả (nếu có) */}
                                                        <td className="px-6 py-4 whitespace-normal align-top">
                                                            <div className="text-sm font-semibold text-gray-900">{tb.tenThietBi || 'N/A'}</div>
                                                            {tb.moTa && <div className="mt-1 text-xs italic text-gray-500">{tb.moTa}</div>}
                                                        </td>
                                                        {/* Mã Loại */}
                                                        <td className="px-6 py-4 text-sm text-gray-500 align-top whitespace-nowrap">{tb.id}</td>
                                                        {/* Tồn kho - Giả sử API trả về trường 'tonKhoHienTai' */}
                                                        <td className="px-6 py-4 text-sm font-medium text-center text-gray-900 align-top whitespace-nowrap">
                                                            {/* Hiển thị số lượng tồn kho */}
                                                            {typeof tb.tonKhoHienTai === 'number' ? tb.tonKhoHienTai : <span className='text-gray-400'>N/A</span>}
                                                        </td>
                                                        {/* Hành động */}
                                                        <td className="px-6 py-4 space-x-2 text-sm font-medium text-center align-top whitespace-nowrap">
                                                            {hasRole('admin') && (
                                                                <>
                                                                    {/* Nút Xóa (có điều kiện) */}
                                                                    <button className="p-2 text-blue-500 rounded hover:text-blue-700 hover:bg-blue-100" title={`Sửa loại ${tb.tenThietBi}`}><FaEdit /></button>
                                                                    <button
                                                                        onClick={() => handleDelete(tb.id, tb.tenThietBi)}
                                                                        className={`p-2 rounded transition duration-150 ease-in-out ${canDelete ? 'text-red-500 hover:text-red-700 hover:bg-red-100' : 'text-gray-400 cursor-not-allowed'}`}
                                                                        title={deleteButtonTitle}
                                                                        disabled={!canDelete} // Disable nếu không đủ điều kiện
                                                                    >
                                                                        <FaTrash />
                                                                    </button>
                                                                </>
                                                            )}
                                                            {/* Nút Mở/Đóng Dropdown Chi Tiết */}
                                                            <button
                                                                onClick={() => toggleDetails(tb.id)}
                                                                className={`p-2 rounded transition duration-150 ease-in-out ${isExpanded ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-indigo-700 hover:bg-indigo-50'}`}
                                                                title={isExpanded ? "Đóng danh sách tài sản cụ thể" : `Xem ${tb.tenThietBi} (${specificAssets.length > 0 ? specificAssets.length : (isLoadingDetails ? '?' : '0')})`}
                                                            >
                                                                {/* Icon động: Spinner khi load, Up/Down khi mở/đóng */}
                                                                {isLoadingDetails ? <FaSpinner className="animate-spin" /> : (isExpanded ? <FaChevronUp /> : <FaChevronDown />)}
                                                            </button>
                                                        </td>
                                                    </tr>

                                                    {/* === Row Dropdown (Chi tiết TTTB) === */}
                                                    {isExpanded && (
                                                        <tr>
                                                            {/* colSpan bằng số lượng cột của bảng cha */}
                                                            <td colSpan="4" className="p-0 border-l-4 border-indigo-500 bg-gray-50">
                                                                <div className="px-4 py-4">
                                                                    {/* Loading State cho chi tiết */}
                                                                    {isLoadingDetails && (
                                                                        <div className="flex items-center justify-center gap-2 py-3 text-sm text-center text-gray-500">
                                                                            <FaSpinner className="animate-spin" /> Đang tải danh sách tài sản cụ thể...
                                                                        </div>
                                                                    )}
                                                                    {/* Error State cho chi tiết */}
                                                                    {errorDetails && !isLoadingDetails && (
                                                                        <div className="flex items-center justify-center gap-2 p-3 py-3 text-sm font-medium text-center text-red-600 border border-red-200 rounded bg-red-50">
                                                                            <FaExclamationTriangle /> {errorDetails}
                                                                            <button onClick={() => toggleDetails(tb.id)} className='ml-2 text-xs text-blue-600 hover:underline'>(Thử lại)</button>
                                                                        </div>
                                                                    )}
                                                                    {/* Nội dung chi tiết (Bảng TTTB) */}
                                                                    {!isLoadingDetails && !errorDetails && (
                                                                        <>
                                                                            {specificAssets.length === 0 ? (
                                                                                <p className="py-3 text-sm italic text-center text-gray-500">
                                                                                    Không có tài sản cụ thể nào thuộc loại "{tb.tenThietBi}". Bạn có thể xóa loại này.
                                                                                </p>
                                                                            ) : (
                                                                                <div className="space-y-3">
                                                                                    <h4 className="mb-2 text-sm font-semibold text-gray-700">
                                                                                        Danh sách tài sản cụ thể ({specificAssets.length}):
                                                                                    </h4>
                                                                                    {/* Bảng con hiển thị TTTB */}
                                                                                    <div className="overflow-x-auto bg-white border border-gray-200 rounded shadow-sm">
                                                                                        <table className="min-w-full divide-y divide-gray-100">
                                                                                            <thead className="bg-gray-100">
                                                                                                <tr>
                                                                                                    {/* Các cột của bảng chi tiết */}
                                                                                                    <th className="px-4 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Mã Định Danh</th>
                                                                                                    <th className="px-4 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Trạng Thái</th>
                                                                                                    <th className="px-4 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Tình Trạng</th>
                                                                                                    <th className="px-4 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Phòng</th>
                                                                                                    <th className="px-4 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Ngày Nhập</th>
                                                                                                    <th className="px-4 py-2 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">Chi tiết</th>
                                                                                                </tr>
                                                                                            </thead>
                                                                                            <tbody className="divide-y divide-gray-100">
                                                                                                {/* Render các dòng TTTB đã phân trang */}
                                                                                                {paginatedDetailsItems.map(tttb => (
                                                                                                    <ChiTietTaiSanRow
                                                                                                        key={`detail-${tttb.id}`}
                                                                                                        tttb={tttb}
                                                                                                        onViewDetails={handleOpenTTTBDetailModal} // Đổi tên handler cho rõ
                                                                                                        onOpenLogModal={handleOpenLogModal}
                                                                                                    />
                                                                                                ))}
                                                                                            </tbody>
                                                                                        </table>
                                                                                    </div>
                                                                                    {/* Phân trang cho bảng chi tiết */}
                                                                                    {totalPagesDetails > 1 && (
                                                                                        <div className="flex justify-end mt-3">
                                                                                            <Pagination
                                                                                                currentPage={currentPageDetails}
                                                                                                totalPages={totalPagesDetails}
                                                                                                onPageChange={(page) => handlePageChangeDetails(tb.id, page)}
                                                                                                maxVisiblePages={3} // Giảm số nút hiển thị cho gọn
                                                                                                isCompact={true}    // Bật chế độ compact
                                                                                            />
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                        </>
                                                                    )}
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
                            {/* === Pagination === */}
                            {totalPagesMain > 1 && (
                                <div className="flex items-center justify-center px-4 py-3 bg-white border-t border-gray-200 rounded-b-lg sm:px-6">
                                    <Pagination
                                        currentPage={currentPageMain}
                                        totalPages={totalPagesMain}
                                        onPageChange={handlePageChangeMain}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* === Modals === */}

            {/* Popup Form Thêm/Sửa Loại Thiết Bị */}
            {showAddForm && (
                <Popup isOpen={showAddForm} title="Thêm Loại Thiết bị mới" onClose={handleCloseAddForm}>
                    <FormThietBi
                        onSuccess={handleAddSuccess}
                        onCancel={handleCloseAddForm}
                        theLoaiList={theLoaiList}
                    />
                </Popup>
            )}

            {/* Popup Xem Chi tiết TTTB */}
            {showTTTBDetailModal && selectedTTTBId && (
                <Popup isOpen={showTTTBDetailModal} onClose={handleCloseTTTBDetailModal} title="Chi tiết Thông tin Thiết bị">
                    <ChiTietThongTinThietBi
                        tttbId={selectedTTTBId}
                        onClose={handleCloseTTTBDetailModal}
                    />
                </Popup>
            )}

            {/* Render Modal Xem Log  */}
            {isLogModalOpen && selectedAssetForLog && (
                <ModalXemLogBaoTri
                    thongtinthietbiId={selectedAssetForLog.id}
                    tenThietBi={selectedAssetForLog.tenLoaiThietBi || 'Thiết bị'}
                    phongName={selectedAssetForLog.phong_name}
                    onClose={handleCloseLogModal}
                />
            )}
        </div>
    );
}

export default ThietBi;