import React, { useState, useEffect, useCallback } from 'react';
import BangNhap from '../components/NhapXuat/BangNhap';
import ChiTietNhap from '../components/NhapXuat/ChiTietNhap';
import BangXuat from '../components/NhapXuat/BangXuat';
import ChiTietXuat from '../components/NhapXuat/ChiTietXuat';
import RightPanel from '../components/layout/RightPanel';
import FormNhap from '../components/forms/FormNhap';
import FormPhieuXuat from '../components/forms/FormPhieuXuat'; // Import Form phiếu xuất

const NhapXuat = () => {
    const [activeTab, setActiveTab] = useState('nhap');
    const [selectedNhapId, setSelectedNhapId] = useState(null);
    const [selectedXuatId, setSelectedXuatId] = useState(null);
    const [refreshBangNhapKey, setRefreshBangNhapKey] = useState(0);
    const [refreshBangXuatKey, setRefreshBangXuatKey] = useState(0); // Key refresh cho Bảng Xuất
    const [showFormNhap, setShowFormNhap] = useState(false);
    const [showFormXuat, setShowFormXuat] = useState(false); // State cho Form Phiếu Xuất

    // Handlers chọn dòng (giữ nguyên)
    const handleSelectNhapRow = useCallback((record) => {
        setSelectedNhapId(record ? record.id : null);
        setSelectedXuatId(null);
    }, []);

    const handleSelectXuatRow = useCallback((id) => {
        setSelectedXuatId(id);
        setSelectedNhapId(null);
    }, []);

    // Handler đóng panel chi tiết (giữ nguyên)
    const handleCloseRightPanel = useCallback(() => {
        setSelectedNhapId(null);
        setSelectedXuatId(null);
    }, []);

    // Trigger refresh (thêm cho bảng xuất)
    const triggerRefreshBangNhap = useCallback(() => {
        setRefreshBangNhapKey(prev => prev + 1);
    }, []);

    const triggerRefreshBangXuat = useCallback(() => { // Function refresh Bảng Xuất
        setRefreshBangXuatKey(prev => prev + 1);
    }, []);

    // Đóng panel chi tiết khi chuyển tab (giữ nguyên)
    useEffect(() => {
        handleCloseRightPanel();
    }, [activeTab, handleCloseRightPanel]);

    // Xác định nội dung RightPanel (giữ nguyên)
    let rightPanelContent = null;
    let rightPanelTitle = "";
    if (selectedNhapId !== null) {
        rightPanelContent = <ChiTietNhap phieuNhapId={selectedNhapId} onClose={handleCloseRightPanel} />;
        rightPanelTitle = "Chi Tiết Phiếu Nhập";
    } else if (selectedXuatId !== null) {
        rightPanelContent = <ChiTietXuat phieuXuatId={selectedXuatId} onClose={handleCloseRightPanel} />;
        rightPanelTitle = "Chi Tiết Phiếu Xuất";
    }

    return (
        <div className="flex flex-1">
            {/* Phần bên trái */}
             <div className={`transition-all duration-300 border bg-white ${rightPanelContent ? "w-3/5" : "w-full"} h-[calc(100vh-var(--header-height,80px))]`}>
                <div className="flex flex-col h-full">
                     <h1 className="p-4 text-2xl font-bold border-b shrink-0">Quản lý Nhập / Xuất</h1>
                    {/* Thanh Tabs */}
                    <div className="border-b border-gray-200 shrink-0">
                        <nav className="flex items-center " aria-label="Tabs">
                            <button onClick={() => setActiveTab('nhap')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium w-[120px] text-base ${activeTab === 'nhap' ? 'border-green-500 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Phiếu Nhập</button>
                            <button onClick={() => setActiveTab('xuat')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium w-[120px] text-base ${activeTab === 'xuat' ? 'border-purple-500 text-purple-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Phiếu Xuất</button>
                        </nav>
                    </div>
                    {/* Nội dung Tab */}
                    <div className="flex-grow p-4 overflow-y-auto">
                        {activeTab === 'nhap' && (
                             <div className="space-y-4">
                                <div className="flex justify-end">
                                     <button
                                         onClick={() => setShowFormNhap(true)}
                                         className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md shadow-sm hover:bg-green-700"
                                     >
                                         + Tạo Phiếu Nhập Mới
                                     </button>
                                 </div>
                                <BangNhap
                                    setSelectedRecord={handleSelectNhapRow}
                                    refreshData={refreshBangNhapKey}
                                    selectedRowId={selectedNhapId}
                                />
                             </div>
                        )}
                        {activeTab === 'xuat' && (
                            <div className="space-y-4">
                                <div className="flex justify-end">
                                     <button
                                         onClick={() => setShowFormXuat(true)}
                                         className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md shadow-sm hover:bg-purple-700"
                                     >
                                         + Tạo Phiếu Xuất Mới
                                     </button>
                                 </div>
                                <BangXuat
                                    onRowSelect={handleSelectXuatRow}
                                    selectedRowId={selectedXuatId}
                                    refreshKey={refreshBangXuatKey} 
                                />
                             </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Panel (Cho chi tiết) - Giữ nguyên */}
            {rightPanelContent && (
                 <div className="w-2/5 transition-all duration-300 border-l h-[calc(100vh-var(--header-height,80px))]"> {/* Chiều cao tương ứng */}
                     <RightPanel key={selectedNhapId || selectedXuatId} activeComponent={
                        <div className='flex flex-col h-full'>
                             <div className="flex items-center justify-between p-4 border-b bg-gray-50 shrink-0">
                                <h3 className="text-lg font-semibold text-gray-800">{rightPanelTitle}</h3>
                                <button onClick={handleCloseRightPanel} className="text-2xl text-gray-400 hover:text-gray-600">&times;</button>
                             </div>
                             {/* Cho phép nội dung chi tiết cuộn độc lập */}
                             <div className="flex-grow overflow-y-auto">
                                {rightPanelContent}
                             </div>
                         </div>
                     } />
                 </div>
            )}

            {/* Modal cho FormNhap */}
            {showFormNhap && (
                // Overlay và Content Box giữ nguyên
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60" onClick={() => setShowFormNhap(false)}>
                    <div className="bg-white rounded-lg shadow-xl w-1/2 max-h-[95vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
                         <FormNhap
                            onClose={() => setShowFormNhap(false)}
                            refreshData={triggerRefreshBangNhap}
                        />
                    </div>
                </div>
            )}

             {/* THÊM MODAL CHO FORM PHIẾU XUẤT */}
             {showFormXuat && (
                 <FormPhieuXuat 
                    isOpen={showFormXuat}
                    onClose={() => setShowFormXuat(false)}
                    onSubmitSuccess={triggerRefreshBangXuat}
                 />
            )}
        </div>
    );
};

export default NhapXuat;