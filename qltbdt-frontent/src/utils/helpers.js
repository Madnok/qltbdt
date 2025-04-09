import { useState, useCallback } from "react";

/**
 * Hook định dạng tiền tệ
 */
export const formatCurrency = (amount) => {
    if (!amount) return "0 VNĐ";
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
};
export const useFormattedPrice = () => {
    return useCallback((amount) => formatCurrency(amount), []);
};

/**
 * Hook điều khiển Sidebar
 */
export const useSidebar = () => {
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);
    return { isSidebarOpen, toggleSidebar };
};

/**
 * Hook làm mới dữ liệu 
 */
export const useRefresh = () => {
    const [refresh, setRefresh] = useState(false); 
    const handleRefresh = () => setRefresh(prev => !prev);
    return { refresh, handleRefresh };
};

/**
 * Hook quản lý Right Panel
 */
export const useRightPanel = () => {
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [activeRightPanel, setActiveRightPanel] = useState(null); // Xác định form nào đang mở

    const handleOpenRightPanel = (panelName, record = null) => {
        setSelectedRecord(record);
        setActiveRightPanel(panelName);
    };

    const handleCloseRightPanel = () => {
        setSelectedRecord(null); // Trạng thái chi tiết
        setActiveRightPanel(null);
    };

    return { selectedRecord, activeRightPanel, handleOpenRightPanel, handleCloseRightPanel }; 
};

/**
 *   Hook phân trang
 */ 
export const paginateData = (data, currentPage, itemsPerPage = 10) => {
    const totalPages = Math.ceil(data.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = data.slice(indexOfFirstItem, indexOfLastItem);

    return { currentItems, totalPages ,indexOfFirstItem, indexOfLastItem};
};

/**
 * Hàm định dạng ngày tháng (Ví dụ: DD/MM/YYYY)
 */
export const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        // Kiểm tra xem date có hợp lệ không
        if (isNaN(date.getTime())) {
            return ''; 
        }
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    } catch (error) {
        console.error("Lỗi định dạng ngày:", dateString, error);
        return ''; // Trả về chuỗi rỗng nếu có lỗi
    }
};