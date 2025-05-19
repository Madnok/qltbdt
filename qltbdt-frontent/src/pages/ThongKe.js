import React, { useState, useMemo, useRef } from 'react';
import { Bar, Pie, Doughnut, Line } from 'react-chartjs-2';
import {
    Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
    PointElement, ArcElement, Title, Tooltip, Legend, TimeScale
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { useQuery } from '@tanstack/react-query';
import { Package, Wrench, PieChart, Filter, CalendarDays, List, ClipboardList, TrendingUp, TrendingDown, AlertCircle, X, Loader2, Info } from 'lucide-react';
import {
    getThongKeTaiChinhTongQuanAPI,
    getThongKeThietBiTheoTrangThaiAPI,
    getThongKeThietBiTheoPhongAPI,
    getThongKeBaoHongAPI,
    getThongKePhieuTheoThangAPI,
    getThongKeBaoHongTheoThangAPI,
    getThongKeChiPhiBaoTriTheoThangAPI,
    getThongKeThietBiChiTietTheoTrangThaiAPI,
    getThongKeTongThuTheoThoiGianAPI, // API mới
    getThongKeTongChiTheoThoiGianAPI  // API mới
} from '../api';
import Modal from 'react-modal';
import { getTinhTrangLabel } from '../utils/constants';
import { formatCurrency } from '../utils/helpers'


// Đăng ký Chart.js
ChartJS.register(
    CategoryScale, LinearScale, BarElement, LineElement, PointElement,
    ArcElement, Title, Tooltip, Legend, TimeScale
);

// --- Cấu hình Modal ---
Modal.setAppElement('#root')

// Hàm helper tạo màu 
const statusColorMap = {
    'con_bao_hanh':      'rgba(22, 163, 74, 0.7)',  
    'het_bao_hanh':      'rgba(220, 38, 38, 0.7)',  
    'dang_bao_hanh':     'rgba(37, 99, 235, 0.7)',  
    'da_bao_hanh':       'rgba(147, 51, 234, 0.7)',
    'de_xuat_thanh_ly':  'rgba(234, 179, 8, 0.7)',   
    'cho_thanh_ly':      'rgba(245, 158, 11, 0.7)', 
    'da_thanh_ly':       'rgba(107, 114, 128, 0.7)',
    'mat_mat':           'rgba(17, 24, 39, 0.7)',   
    'default':           'rgba(209, 213, 219, 0.7)' 
};
const getStatusColor = (statusKey) => statusColorMap[statusKey] || statusColorMap['default'];
const baseColors = [
    'rgba(54, 162, 235, 0.7)', 'rgba(255, 99, 132, 0.7)', 'rgba(255, 206, 86, 0.7)',
    'rgba(75, 192, 192, 0.7)', 'rgba(153, 102, 255, 0.7)', 'rgba(255, 159, 64, 0.7)',
    'rgba(199, 199, 199, 0.7)', 'rgba(83, 102, 255, 0.7)', 'rgba(100, 255, 100, 0.7)',
    'rgba(255, 100, 100, 0.7)'
];
const borderColors = baseColors.map(color => color.replace('0.7', '1'));
const getRandomColor = (count) => {
    const colors = [];
    const borders = [];
    for (let i = 0; i < count; i++) {
        colors.push(baseColors[i % baseColors.length]);
        borders.push(borderColors[i % borderColors.length]);
    }
    return { backgroundColors: colors, borderColors: borders };
};

// Component chính
const ThongKe = () => {
    // State cho bộ lọc thời gian
    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [selectedMonth, setSelectedMonth] = useState('all');

    // State cho Modal chi tiết thiết bị
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [selectedStatusLabel, setSelectedStatusLabel] = useState('');
    const [selectedStatusKey, setSelectedStatusKey] = useState('');
    const pieChartRef = useRef();

    // --- fetch dữ liệu ---
    const { data: financialOverviewData, isLoading: loadingFinancial, error: errorFinancial } = useQuery({
        queryKey: ['thongKe', 'taiChinhTongQuan'], // Key mới
        queryFn: async () => (await getThongKeTaiChinhTongQuanAPI()).data
    });
    const { data: deviceStatusRaw, isLoading: loadingDeviceStatus, error: errorDeviceStatus } = useQuery({
        queryKey: ['thongKe', 'thietBiTrangThai'],
        queryFn: async () => (await getThongKeThietBiTheoTrangThaiAPI()).data
    });
    const { data: deviceRoomRaw, isLoading: loadingDeviceRoom, error: errorDeviceRoom } = useQuery({
        queryKey: ['thongKe', 'thietBiPhong'],
        queryFn: async () => (await getThongKeThietBiTheoPhongAPI()).data
    });
    const { data: reportRaw, isLoading: loadingReport, error: errorReport } = useQuery({
        queryKey: ['thongKe', 'baoHong'],
        queryFn: async () => (await getThongKeBaoHongAPI()).data
    });
    const { data: ticketMonthRaw, isLoading: loadingTicketMonth, error: errorTicketMonth } = useQuery({
        queryKey: ['thongKe', 'phieuThang'],
        queryFn: async () => (await getThongKePhieuTheoThangAPI()).data
    });
    const { data: reportMonthRaw, isLoading: loadingReportMonth, error: errorReportMonth } = useQuery({
        queryKey: ['thongKe', 'baoHongThang'],
        queryFn: async () => (await getThongKeBaoHongTheoThangAPI()).data
    });
    const { data: maintenanceCostMonthRaw, isLoading: loadingMaintenanceCostMonth, error: errorMaintenanceCostMonth } = useQuery({
        queryKey: ['thongKe', 'chiPhiBaoTriThang'],
        queryFn: async () => (await getThongKeChiPhiBaoTriTheoThangAPI()).data
    });
    const { data: detailedDeviceList, isLoading: loadingDetailedDevice, isFetching: fetchingDetailedDevice } = useQuery({
        queryKey: ['thongKe', 'thietBiChiTiet', selectedStatusKey],
        queryFn: async () => (await getThongKeThietBiChiTietTheoTrangThaiAPI(selectedStatusKey)).data,
        enabled: !!selectedStatusKey && modalIsOpen,
        staleTime: 1000 * 30
    });
    const timeFilterParams = useMemo(() => ({
        year: selectedYear,
        ...(selectedMonth !== 'all' && { month: selectedMonth })
    }), [selectedYear, selectedMonth]);
    const { data: revenueTimeDataRaw, isLoading: loadingRevenueTime, error: errorRevenueTime } = useQuery({
        queryKey: ['thongKe', 'tongThuThang', timeFilterParams],
        queryFn: async () => (await getThongKeTongThuTheoThoiGianAPI(timeFilterParams)).data, // Dùng API thật
        keepPreviousData: true,
    });
    const { data: expenditureTimeDataRaw, isLoading: loadingExpenditureTime, error: errorExpenditureTime } = useQuery({
        queryKey: ['thongKe', 'tongChiThang', timeFilterParams],
        queryFn: async () => (await getThongKeTongChiTheoThoiGianAPI(timeFilterParams)).data, // Dùng API thật
        keepPreviousData: true,
    });


    // --- Xử lý dữ liệu (useMemo) ---
    const deviceStatusData = useMemo(() => {
        if (!deviceStatusRaw || !Array.isArray(deviceStatusRaw)) return null;
        const processedData = deviceStatusRaw.map(item => ({
            key: item.tinhTrang,
            label: getTinhTrangLabel(item.tinhTrang) || item.tinhTrang,
            count: item.count
        }));
        const labels = processedData.map(item => item.label);
        const dataCounts = processedData.map(item => item.count);
        const backgroundColors = processedData.map(item => getStatusColor(item.key));
        const borderColors = backgroundColors.map(color => color.replace('0.7', '1'));

        return {
            labels: labels,
            originalData: processedData,
            datasets: [{ data: dataCounts, backgroundColor: backgroundColors, borderColor: borderColors, borderWidth: 1 }]
        };
     }, [deviceStatusRaw]);
    const deviceRoomData = useMemo(() => {
        if (!deviceRoomRaw || !Array.isArray(deviceRoomRaw)) return null;
        const labels = deviceRoomRaw.map(item => item.tenPhong);
        const dataCounts = deviceRoomRaw.map(item => item.count);
        return { labels: labels, datasets: [{ label: 'Số lượng', data: dataCounts, backgroundColor: 'rgba(54, 162, 235, 0.7)', borderColor: 'rgba(54, 162, 235, 1)', borderWidth: 1 }] };
    }, [deviceRoomRaw]);
    const reportRoomData = useMemo(() => {
        if (!reportRaw?.byRoom || !Array.isArray(reportRaw.byRoom)) return null;
        const labels = reportRaw.byRoom.map(item => item.tenPhong);
        const dataCounts = reportRaw.byRoom.map(item => item.count);
        return { labels: labels, datasets: [{ label: 'Số lượng báo hỏng', data: dataCounts, backgroundColor: 'rgba(255, 99, 132, 0.7)', borderColor: 'rgba(255, 99, 132, 1)', borderWidth: 1 }] };
    }, [reportRaw]);
    const reportDeviceTypeData = useMemo(() => {
        if (!reportRaw?.byDeviceType || !Array.isArray(reportRaw.byDeviceType)) return null;
        const labels = reportRaw.byDeviceType.map(item => item.tenThietBi);
        const dataCounts = reportRaw.byDeviceType.map(item => item.count);
        const { backgroundColors, borderColors } = getRandomColor(labels.length);
        return { labels: labels, datasets: [{ data: dataCounts, backgroundColor: backgroundColors, borderColor: borderColors, borderWidth: 1 }] };
    }, [reportRaw]);

    // --- Tính toán Tổng Thu/Chi theo thời gian đã lọc ---
    const calculatedRevenue = useMemo(() => {
        if (!revenueTimeDataRaw || !Array.isArray(revenueTimeDataRaw)) return 0;
        if (selectedMonth === 'all') {
            return revenueTimeDataRaw.reduce((sum, item) => sum + (item.totalRevenue || 0), 0);
        } else {
            const monthStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
            const monthData = revenueTimeDataRaw.find(item => item.month === monthStr);
            return monthData?.totalRevenue || 0;
        }
    }, [revenueTimeDataRaw, selectedYear, selectedMonth]);

    const calculatedExpenditure = useMemo(() => {
        if (!expenditureTimeDataRaw || !Array.isArray(expenditureTimeDataRaw)) return 0;
         if (selectedMonth === 'all') {
            return expenditureTimeDataRaw.reduce((sum, item) => sum + (item.totalExpenditure || 0), 0);
        } else {
            const monthStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
            const monthData = expenditureTimeDataRaw.find(item => item.month === monthStr);
            return monthData?.totalExpenditure || 0;
        }
    }, [expenditureTimeDataRaw, selectedYear, selectedMonth]);

    // useMemo cho filteredTicketMonthData
    const filteredTicketMonthData = useMemo(() => {
        if (!ticketMonthRaw) return null;
        const filterTickets = (tickets) => {
            if (!tickets || !Array.isArray(tickets)) return [];
            return tickets.filter(item => {
                const [year, month] = item.month.split('-').map(Number);
                const yearMatch = year === selectedYear;
                const monthMatch = selectedMonth === 'all' || month === selectedMonth;
                return yearMatch && monthMatch;
            });
        };
        const filteredNhap = filterTickets(ticketMonthRaw.phieuNhapTheoThang);
        const filteredXuat = filterTickets(ticketMonthRaw.phieuXuatTheoThang);
        const allMonthsFiltered = new Set([...filteredNhap.map(item => item.month), ...filteredXuat.map(item => item.month)]);
        const sortedMonthsFiltered = Array.from(allMonthsFiltered).sort();
        const nhapData = sortedMonthsFiltered.map(month => filteredNhap.find(item => item.month === month)?.count || 0);
        const xuatData = sortedMonthsFiltered.map(month => filteredXuat.find(item => item.month === month)?.count || 0);
        return {
            labels: sortedMonthsFiltered,
            datasets: [
                { label: 'Phiếu Nhập', data: nhapData, borderColor: 'rgb(75, 192, 192)', backgroundColor: 'rgba(75, 192, 192, 0.5)', tension: 0.1, fill: false, pointRadius: 4, pointHoverRadius: 6 },
                { label: 'Phiếu Xuất', data: xuatData, borderColor: 'rgb(255, 99, 132)', backgroundColor: 'rgba(255, 99, 132, 0.5)', tension: 0.1, fill: false, pointRadius: 4, pointHoverRadius: 6 }
            ]
        };
    }, [ticketMonthRaw, selectedYear, selectedMonth]);

    const filteredReportMonthData = useMemo(() => {
        if (!reportMonthRaw || !Array.isArray(reportMonthRaw)) return null;
        const filteredReports = reportMonthRaw.filter(item => {
            const [year, month] = item.month.split('-').map(Number);
            const yearMatch = year === selectedYear;
            const monthMatch = selectedMonth === 'all' || month === selectedMonth;
            return yearMatch && monthMatch;
        });
        const sortedMonthsFiltered = filteredReports.map(item => item.month).sort();
        const reportCounts = sortedMonthsFiltered.map(month => filteredReports.find(item => item.month === month)?.count || 0);
        return {
            labels: sortedMonthsFiltered,
            datasets: [{ label: 'Số Báo Hỏng', data: reportCounts, borderColor: 'rgb(255, 159, 64)', backgroundColor: 'rgba(255, 159, 64, 0.5)', tension: 0.1, fill: false, pointRadius: 4, pointHoverRadius: 6 }]
        };
    }, [reportMonthRaw, selectedYear, selectedMonth]);

    // Xử lý dữ liệu chi phí bảo trì theo tháng/năm
    const filteredMaintenanceCostData = useMemo(() => {
        if (!maintenanceCostMonthRaw || !Array.isArray(maintenanceCostMonthRaw)) return null;

        const filteredCosts = maintenanceCostMonthRaw.filter(item => {
            const [year, month] = item.month.split('-').map(Number);
            const yearMatch = year === selectedYear;
            const monthMatch = selectedMonth === 'all' || month === selectedMonth;
            return yearMatch && monthMatch;
        });

        const sortedMonthsFiltered = filteredCosts.map(item => item.month).sort();
        const costData = sortedMonthsFiltered.map(month => filteredCosts.find(item => item.month === month)?.totalCost || 0);

        return {
            labels: sortedMonthsFiltered,
            datasets: [
                { label: 'Chi phí Bảo trì', data: costData, borderColor: 'rgb(153, 102, 255)', backgroundColor: 'rgba(153, 102, 255, 0.5)', tension: 0.1, fill: false, pointRadius: 4, pointHoverRadius: 6 }
            ]
        };
    }, [maintenanceCostMonthRaw, selectedYear, selectedMonth]);

    // --- Tạo danh sách năm và tháng cho bộ lọc ---
    const years = useMemo(() => {
        const startYear = 2023; // Hoặc lấy từ năm của dữ liệu cũ nhất
        const yearsArray = [];
        for (let y = currentYear; y >= startYear; y--) {
            yearsArray.push(y);
        }
        return yearsArray;
    }, [currentYear]);

    const months = [
        { value: 'all', label: 'Tất cả các tháng' },
        ...Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `Tháng ${i + 1}` }))
    ];

    // ---  loading và error tổng thể ---
    const isLoading = loadingFinancial || loadingDeviceStatus || loadingDeviceRoom || loadingReport || loadingTicketMonth || loadingReportMonth || loadingMaintenanceCostMonth;
    const queryError = errorFinancial || errorDeviceStatus || errorDeviceRoom || errorReport || errorTicketMonth || errorReportMonth || errorMaintenanceCostMonth;


    // --- Xử lý sự kiện Click trên biểu đồ Pie ---
    const handlePieClick = (event, elements) => {
        if (!elements || elements.length === 0 || !deviceStatusData?.originalData) return;

        const firstPoint = elements[0];
        const clickedLabel = deviceStatusData.labels[firstPoint.index];
        const originalItem = deviceStatusData.originalData.find(item => item.label === clickedLabel);

        if (originalItem) {
            setSelectedStatusLabel(clickedLabel);
            setSelectedStatusKey(originalItem.key);
            setModalIsOpen(true);
            console.log("Clicked on:", clickedLabel, "Status Key:", originalItem.key);
        }
    };

    // --- Phần Render ---
    return (
        <div className="flex flex-1 border">
            <div className="flex flex-col w-full h-[calc(100vh-var(--header-height,80px))] bg-white">
                {/* Header */}
                <div className="p-4 text-2xl font-bold bg-white border-b shadow-sm shrink-0">
                    Thống Kê
                </div>

                {/* Khu vực nội dung có thể cuộn */}
                <div className="flex-1 p-4 overflow-y-auto md:p-6">
                    {isLoading && (
                        <div className="flex items-center justify-center h-64">
                            <div className="w-16 h-16 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
                        </div>
                    )}
                    {queryError && (
                        <div role="alert" className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400">
                            <span className="font-medium">Lỗi!</span> {queryError.message || 'Không thể tải dữ liệu thống kê.'}
                        </div>
                    )}

                    {/* Nội dung chính */}
                    {!isLoading && !queryError && (
                        <div className="space-y-6 md:space-y-8">
                            {/* Section Tài chính */}
                            {financialOverviewData && (
                                <div className="p-6 bg-white border-2 rounded-lg shadow">
                                    <h2 className="flex items-center pb-2 mb-4 text-xl font-semibold text-gray-700 border-b">
                                        <Info className="w-5 h-5 mr-2 text-gray-600" /> Tổng quan Chung
                                    </h2>
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                        <div className="p-4 text-center border border-green-200 rounded-lg bg-green-50"><h3 className="mb-1 text-sm font-medium text-green-800">Tổng Thu Thanh lý</h3><p className="text-2xl font-bold text-green-700">{formatCurrency(financialOverviewData.tongThu)}</p></div>
                                        <div className="p-4 text-center break-words border border-blue-200 rounded-lg bg-blue-50"><h3 className="mb-1 text-sm font-medium text-blue-800">Tổng Giá trị Tài sản</h3><p className="text-2xl font-bold text-blue-700">{formatCurrency(financialOverviewData.tongGiaTriTaiSanHienCo)}</p></div>
                                        <div className="p-4 text-center border border-yellow-200 rounded-lg bg-yellow-50"><h3 className="mb-1 text-sm font-medium text-yellow-800">Tổng Chi phí Bảo trì</h3><p className="text-2xl font-bold text-yellow-700">{formatCurrency(financialOverviewData.tongChiPhiBaoTri)}</p></div>
                                    </div>
                                </div>
                            )}

                            {/* Lưới biểu đồ 1 */}
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                {/* Thiết bị theo Trạng thái (Pie) */}
                                <div className="bg-white p-4 rounded-lg shadow h-[450px] flex flex-col border-2">
                                    <h3 className="flex items-center justify-center mb-1 text-lg font-semibold text-center text-gray-700">
                                        <PieChart className="w-5 h-5 mr-2 text-indigo-600" /> Thiết bị theo Trạng thái
                                    </h3>
                                    <p className="mb-2 text-xs text-center text-gray-500">(Click vào một phần để xem chi tiết)</p>
                                    <div className="relative flex-1 min-h-0">
                                        {deviceStatusData ? (
                                            <Pie
                                                ref={pieChartRef} 
                                                data={deviceStatusData}
                                                options={{
                                                    responsive: true,
                                                    maintainAspectRatio: false,
                                                    plugins: { legend: { position: 'right', labels: { boxWidth: 12, padding: 15 } } },
                                                    onClick: handlePieClick
                                                }}
                                            />
                                        ) : <p className="mt-10 text-center text-gray-500">Không có dữ liệu.</p>}
                                    </div>
                                </div>
                                {/* Thiết bị theo Phòng (Bar) */}
                                <div className="bg-white p-4 rounded-lg shadow h-[450px] flex flex-col border-2">
                                    <h3 className="flex items-center justify-center mb-3 text-lg font-semibold text-center text-gray-700">
                                        <Package className="w-5 h-5 mr-2 text-blue-600" /> Thiết bị theo Phòng
                                    </h3>
                                    <div className="relative flex-1 min-h-0">
                                        {deviceRoomData ? (<Bar data={deviceRoomData} options={{ responsive: true, maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { display: false } }, scales: { y: { ticks: { autoSkip: false } } } }} />) : <p className="mt-10 text-center text-gray-500">Không có dữ liệu.</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Lưới biểu đồ 2 */}
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                {/* Báo hỏng theo Loại TB (Doughnut) */}
                                <div className="bg-white p-4 rounded-lg shadow h-[450px] flex flex-col border-2">
                                    <h3 className="flex items-center justify-center mb-3 text-lg font-semibold text-center text-gray-700">
                                        <Wrench className="w-5 h-5 mr-2 text-red-600" /> Báo hỏng theo Loại thiết bị
                                    </h3>
                                    <div className="relative flex-1 min-h-0">
                                        {reportDeviceTypeData ? (<Doughnut data={reportDeviceTypeData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { boxWidth: 12, padding: 15 } } } }} />) : <p className="mt-10 text-center text-gray-500">Không có dữ liệu.</p>}
                                    </div>
                                </div>
                                {/* Báo hỏng theo Phòng (Bar) */}
                                <div className="bg-white p-4 rounded-lg shadow h-[450px] flex flex-col border-2">
                                    <h3 className="flex items-center justify-center mb-3 text-lg font-semibold text-center text-gray-700">
                                        <AlertCircle className="w-5 h-5 mr-2 text-orange-600" /> Báo hỏng theo Phòng
                                    </h3>
                                    <div className="relative flex-1 min-h-0">
                                        {reportRoomData ? (<Bar data={reportRoomData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />) : <p className="mt-10 text-center text-gray-500">Không có dữ liệu.</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Phần Thống kê theo thời gian */}
                            <div className="p-6 space-y-6 bg-white border-2 rounded-lg shadow">
                                {/* Bộ lọc */}
                                <div className="flex flex-wrap items-center gap-4 pb-4 mb-4 border-b">
                                    <Filter className="w-5 h-5 text-gray-600 shrink-0" />
                                    <span className='font-medium text-gray-700 shrink-0'>Lọc thời gian:</span>
                                    <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="p-2 text-sm bg-white border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"> {years.map(year => <option key={year} value={year}>{year}</option>)} </select>
                                    <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))} className="p-2 text-sm bg-white border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"> {months.map(month => <option key={month.value} value={month.value}>{month.label}</option>)} </select>
                                    <span className='ml-auto text-xs italic text-gray-500'>(Áp dụng cho Báo hỏng, Nhập/Xuất, Chi phí bảo trì)</span>
                                </div>

                                {/* Hiển thị Tổng Thu/Chi theo thời gian đã lọc */}
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                     <div className="p-4 text-center border border-green-200 rounded-lg bg-green-50">
                                         <h3 className="flex items-center justify-center mb-1 text-sm font-medium text-green-800"> <TrendingUp size={16} className='mr-1'/> Tổng Thanh Lý {selectedMonth === 'all' ? `Năm ${selectedYear}` : `Tháng ${selectedMonth}/${selectedYear}`} {loadingRevenueTime && <Loader2 size={16} className='ml-2 animate-spin'/>} </h3>
                                         <p className="text-2xl font-bold text-green-700">{formatCurrency(calculatedRevenue)}</p>
                                         {errorRevenueTime && <p className='mt-1 text-xs text-red-600'>Lỗi tải dữ liệu</p>}
                                     </div>
                                      <div className="p-4 text-center border border-red-200 rounded-lg bg-red-50">
                                          <h3 className="flex items-center justify-center mb-1 text-sm font-medium text-red-800"> <TrendingDown size={16} className='mr-1'/> Tổng Chi {selectedMonth === 'all' ? `Năm ${selectedYear}` : `Tháng ${selectedMonth}/${selectedYear}`} {loadingExpenditureTime && <Loader2 size={16} className='ml-2 animate-spin'/>} </h3>
                                          <p className="text-2xl font-bold text-red-700">{formatCurrency(calculatedExpenditure)}</p>
                                          {errorExpenditureTime && <p className='mt-1 text-xs text-red-600'>Lỗi tải dữ liệu</p>}
                                      </div>
                                 </div>

                                {/* Lưới cho 3 biểu đồ line */}
                                <div className="grid grid-cols-1 gap-6 mt-6 lg:grid-cols-2">                                    {/* Biểu đồ Phiếu Nhập/Xuất */}
                                    <div className="h-[300px] flex flex-col col-span-1">
                                        <h3 className="flex items-center justify-center mb-3 text-lg font-semibold text-center text-gray-700"> <ClipboardList className="w-5 h-5 mr-2 text-teal-600" /> Phiếu Nhập/Xuất </h3>
                                        <div className="relative flex-1 min-h-0">
                                            {filteredTicketMonthData && filteredTicketMonthData.labels.length > 0 ? (<Line data={filteredTicketMonthData} options={{ responsive: true, maintainAspectRatio: false, scales: { x: { type: 'time', time: { unit: selectedMonth === 'all' ? 'month' : 'day', tooltipFormat: selectedMonth === 'all' ? 'MM/yyyy' : 'dd/MM/yyyy', displayFormats: { month: 'MM/yyyy', day: 'dd/MM' } }, title: { display: false } }, y: { beginAtZero: true, title: { display: true, text: 'Số lượng' } } }, plugins: { legend: { position: 'top' } } }} />) : <p className="mt-10 text-center text-gray-500">Không có dữ liệu.</p>}
                                        </div>
                                    </div>
                                    {/* Biểu đồ Chi phí Bảo trì */}
                                    <div className="h-[300px] flex flex-col col-span-1">
                                        <h3 className="flex items-center justify-center mb-3 text-lg font-semibold text-center text-gray-700"> <TrendingUp className="w-5 h-5 mr-2 text-cyan-600" /> Chi phí Bảo trì </h3>
                                        <div className="relative flex-1 min-h-0">
                                            {filteredMaintenanceCostData && filteredMaintenanceCostData.labels.length > 0 ? (
                                                <Line data={filteredMaintenanceCostData} options={{ responsive: true, maintainAspectRatio: false, scales: { x: { type: 'time', time: { unit: selectedMonth === 'all' ? 'month' : 'day', tooltipFormat: selectedMonth === 'all' ? 'MM/yyyy' : 'dd/MM/yyyy', displayFormats: { month: 'MM/yyyy', day: 'dd/MM' } }, title: { display: false } }, y: { beginAtZero: true, title: { display: true, text: 'Chi phí (VNĐ)' }, ticks: { callback: value => value.toLocaleString('vi-VN') } } }, plugins: { legend: { display: false }, tooltip: { callbacks: { label: context => ` ${context.dataset.label}: ${context.parsed.y.toLocaleString('vi-VN')} đ` } } } }} />
                                            ) : <p className="mt-10 text-center text-gray-500">Không có dữ liệu.</p>}
                                        </div>
                                    </div>
                                    {/* Biểu đồ Báo hỏng */}
                                    <div className="h-[300px] flex flex-col col-span-2 mt-6">
                                        <h3 className="flex items-center justify-center mb-3 text-lg font-semibold text-center text-gray-700"> <CalendarDays className="w-5 h-5 mr-2 text-purple-600" /> Báo hỏng </h3>
                                        <div className="relative flex-1 min-h-0">
                                            {filteredReportMonthData && filteredReportMonthData.labels.length > 0 ? (<Line data={filteredReportMonthData} options={{ responsive: true, maintainAspectRatio: false, scales: { x: { type: 'time', time: { unit: selectedMonth === 'all' ? 'month' : 'day', tooltipFormat: selectedMonth === 'all' ? 'MM/yyyy' : 'dd/MM/yyyy', displayFormats: { month: 'MM/yyyy', day: 'dd/MM' } }, title: { display: false } }, y: { beginAtZero: true, title: { display: true, text: 'Số lượng' } } }, plugins: { legend: { display: false } } }} />) : <p className="mt-10 text-center text-gray-500">Không có dữ liệu.</p>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal hiển thị chi tiết thiết bị */}
            <Modal
                isOpen={modalIsOpen}
                onRequestClose={() => setModalIsOpen(false)}
                contentLabel="Chi tiết Thiết bị theo Trạng thái"
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                overlayClassName="fixed inset-0 bg-black bg-opacity-50 z-40"
            >
                <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[80vh] flex flex-col">
                    <div className="flex items-center justify-between pb-3 mb-4 border-b">
                        <h2 className="flex items-center text-xl font-semibold text-gray-800">
                            <List className="w-5 h-5 mr-2 text-blue-600" /> Danh sách thiết bị: <span className="ml-2 font-bold text-blue-600">{selectedStatusLabel}</span>
                        </h2>
                        <button onClick={() => setModalIsOpen(false)} className="p-1 text-gray-400 rounded-full hover:text-red-600 hover:bg-gray-100">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex-1 pr-2 overflow-y-auto">
                        {(loadingDetailedDevice || fetchingDetailedDevice) ? (
                            <div className="flex items-center justify-center h-32"> <Loader2 className="w-8 h-8 text-blue-500 animate-spin" /> </div>
                        ) : detailedDeviceList && detailedDeviceList.length > 0 ? (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="sticky top-0 bg-gray-100">
                                    <tr>
                                        <th scope="col" className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-600 uppercase">Mã Định Danh</th>
                                        <th scope="col" className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-600 uppercase">Tên Thiết bị</th>
                                        <th scope="col" className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-600 uppercase">Vị trí</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {detailedDeviceList.map((device) => (
                                        <tr key={device.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm font-semibold text-gray-800 whitespace-nowrap">{device.id}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{device.tenThietBi || '(Không có tên)'}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{device.viTri}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className="mt-4 text-center text-gray-500">Không tìm thấy thiết bị nào cho trạng thái này.</p>
                        )}
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ThongKe;