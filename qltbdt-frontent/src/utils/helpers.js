import { useState } from "react";


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

    return { currentItems, totalPages };
};

