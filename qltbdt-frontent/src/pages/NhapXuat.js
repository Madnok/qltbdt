// src/pages/NhapXuat.js
import React, { useState, useCallback } from 'react';
import BangNhap from '../components/NhapXuat/BangNhap';
import ChiTietNhap from '../components/NhapXuat/ChiTietNhap';
import BangXuat from '../components/NhapXuat/BangXuat';
import ChiTietXuat from '../components/NhapXuat/ChiTietXuat';
import RightPanel from '../components/layout/RightPanel';
import FormNhap from '../components/forms/FormNhap'; // <-- Import FormNhap

const NhapXuat = () => {
  const [activeTab, setActiveTab] = useState('nhap');
  const [selectedNhapId, setSelectedNhapId] = useState(null);
  const [selectedXuatId, setSelectedXuatId] = useState(null);
  const [refreshBangNhapKey, setRefreshBangNhapKey] = useState(0);
  const [showFormNhap, setShowFormNhap] = useState(false); // <-- State quản lý FormNhap

  const handleSelectNhapRow = useCallback((record) => {
    setSelectedNhapId(record ? record.id : null);
    setSelectedXuatId(null);
    // Đảm bảo đóng FormNhap nếu nó đang mở khi chọn chi tiết
    // setShowFormNhap(false); // Có thể không cần nếu dùng modal riêng
  }, []);

  const handleSelectXuatRow = useCallback((id) => {
    setSelectedXuatId(id);
    setSelectedNhapId(null);
    // setShowFormNhap(false);
  }, []);

  const handleCloseRightPanel = useCallback(() => {
    setSelectedNhapId(null);
    setSelectedXuatId(null);
  }, []);

  const triggerRefreshBangNhap = () => {
    setRefreshBangNhapKey(prev => prev + 1);
  };

  // Xác định nội dung RightPanel (CHỈ cho chi tiết)
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
    // Cấu trúc flex chính
    <div className="flex flex-1">
      {/* Phần bên trái */}
      <div className={`transition-all duration-300  bg-white h-[900px] ${rightPanelContent ? "w-3/5" : "w-full"}`}>
        <div className="flex flex-col h-full"> {/* Thêm h-full và flex-col */}
          <h1 className="p-4 text-2xl font-bold border-b">Quản lý Nhập / Xuất</h1>
          {/* Thanh Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex items-center " aria-label="Tabs">
              <button onClick={() => setActiveTab('nhap')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium w-[120px] text-base ${activeTab === 'nhap' ? 'border-green-500 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Phiếu Nhập</button>
              <button onClick={() => setActiveTab('xuat')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium w-[120px] text-base ${activeTab === 'xuat' ? 'border-purple-500 text-purple-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Phiếu Xuất</button>
            </nav>
          </div>
          {/* Nội dung Tab */}
          <div className="flex-grow overflow-y-auto"> {/* Cho phép cuộn nội dung tab */}
            {activeTab === 'nhap' && (
              <BangNhap
                setSelectedRecord={handleSelectNhapRow}
                refreshData={refreshBangNhapKey}
                selectedRowId={selectedNhapId}
                onAddPhieuNhap={() => setShowFormNhap(true)}
              />
            )}
            {activeTab === 'xuat' && (
              <BangXuat
                onRowSelect={handleSelectXuatRow}
                selectedRowId={selectedXuatId}
              // onAddPhieuXuat={() => { /* logic mở form xuất */ }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Right Panel (Cho chi tiết) */}
      {rightPanelContent && (
        <div className="w-2/5 transition-all duration-300 border-l">
          <RightPanel key={selectedNhapId || selectedXuatId} activeComponent={
            <div className='flex flex-col h-full'>
              <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-800">{rightPanelTitle}</h3>
                <button onClick={handleCloseRightPanel} className="text-2xl text-gray-400 hover:text-gray-600">&times;</button>
              </div>
              <div className="flex-grow overflow-y-auto">
                {/* Chỉ render nội dung chi tiết */}
                {rightPanelContent}
              </div>
            </div>
          } />
        </div>
      )}

      {/* Modal cho FormNhap */}
      {showFormNhap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60" onClick={() => setShowFormNhap(false)}> {/* Overlay */}
          <div className="bg-white rounded-lg shadow-xl w-1/2 max-h-[95vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}> {/* Content Box */}
            {/* FormNhap tự quản lý nội dung và nút đóng của nó */}
            <FormNhap
              onClose={() => setShowFormNhap(false)}
              refreshData={triggerRefreshBangNhap}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default NhapXuat;