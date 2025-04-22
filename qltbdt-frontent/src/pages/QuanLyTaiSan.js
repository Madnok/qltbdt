import React, { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import BoLocTaiSan from '../components/QuanLyTaiSan/BoLocTaiSan';
import BangTaiSan from '../components/QuanLyTaiSan/BangTaiSan';
import ChiTietTaiSan from '../components/QuanLyTaiSan/ChiTietTaiSan';
import RightPanel from '../components/layout/RightPanel';
import { getAllTaiSanAPI } from '../api';
import Pagination from '../components/layout/Pagination.js';

const ITEMS_PER_PAGE = 12;

const QuanLyTaiSan = () => {
    const [filterParams, setFilterParams] = useState({});
    const [selectedTaiSanId, setSelectedTaiSanId] = useState(null);
    const [showRightPanel, setShowRightPanel] = useState(false);
    const [selectedTaiSanData, setSelectedTaiSanData] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);

    // Cập nhật useQuery để gửi tham số pagination và sort
    const { data: apiResponse, isLoading, error, refetch, isPreviousData } = useQuery({
        queryKey: ['taiSan', filterParams, currentPage, ITEMS_PER_PAGE],
        queryKeyHashFn: JSON.stringify,
        queryFn: () => getAllTaiSanAPI({
            ...filterParams,
            page: currentPage,
            limit: ITEMS_PER_PAGE,
        }).then(res => res.data),
        keepPreviousData: true,
        staleTime: 5 * 60 * 1000
    });

    // Lấy dữ liệu và thông tin phân trang từ kết quả API
    const taiSanList = apiResponse?.data;
    const paginationData = apiResponse?.pagination;

    const handleFilterChange = useCallback((newFilters) => {
        setFilterParams(prev => {
            const updatedFilters = { ...prev };
            let changed = false;
            for (const key in newFilters) {
                if ((newFilters[key] || undefined) !== (updatedFilters[key] || undefined)) { // So sánh cả undefined/''
                    if (newFilters[key]) {
                        updatedFilters[key] = newFilters[key];
                    } else {
                        delete updatedFilters[key]; // Xóa key nếu giá trị mới là falsy
                    }
                    changed = true;
                }
            }
            // Xóa các key không có trong newFilters mà prev có
            Object.keys(prev).forEach(key => {
                if (!(key in newFilters) || !newFilters[key]) {
                    if (key in updatedFilters) { // Kiểm tra xem có còn tồn tại không trước khi xoá
                        delete updatedFilters[key];
                        changed = true;
                    }
                }
            });


            if (!changed) {
                return prev;
            }

            setSelectedTaiSanId(null);
            setSelectedTaiSanData(null);
            setShowRightPanel(false);
            return updatedFilters;
        });
        setCurrentPage(1);
    }, []);

    const handleRowSelect = useCallback((taiSan) => {
        if (taiSan && taiSan.id) {
            setSelectedTaiSanId(taiSan.id);
            setSelectedTaiSanData(taiSan);
            setShowRightPanel(true);
        } else {
            setSelectedTaiSanId(null);
            setSelectedTaiSanData(null);
            setShowRightPanel(false);
        }
    }, []);

    const handleCloseRightPanel = useCallback(() => {
        setShowRightPanel(false);
        setSelectedTaiSanId(null);
        setSelectedTaiSanData(null);
    }, []);

    const triggerRefetch = useCallback(() => { refetch(); }, [refetch]);

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    return (
        <div className="flex flex-1 bg-white">
            {/* Phần bên trái (Danh sách và bộ lọc) */}
            <div className={`transition-all duration-300 ${showRightPanel ? "w-3/5" : "w-full"}`}>
                <div className="flex flex-col h-[450] p-4">
                    <h1 className="mb-4 text-2xl font-bold">Quản Lý Tài Sản</h1>
                    <BoLocTaiSan onFilterChange={handleFilterChange} />

                    <div className={`flex-grow mt-2 overflow-y-auto ${isPreviousData ? 'opacity-60' : ''}`}>
                        {isLoading && currentPage === 1}
                        {error && <p className="text-red-500">Lỗi tải dữ liệu: {error.message}</p>}
                        {!isLoading && !error && (!taiSanList || taiSanList.length === 0) && (
                            <p className="mt-4 text-center text-gray-500">Không có tài sản nào.</p>
                        )}
                        {taiSanList && taiSanList.length > 0 && (
                            <BangTaiSan
                                data={taiSanList}
                                onRowSelect={handleRowSelect}
                                selectedRowId={selectedTaiSanId}
                                triggerRefetch={triggerRefetch}
                            />
                        )}
                        {/* Component Phân trang */}
                        {paginationData && paginationData.totalPages > 1 && (
                            <div className="flex items-center justify-between mt-4">
                                <Pagination
                                    currentPage={paginationData.currentPage}
                                    totalPages={paginationData.totalPages}
                                    onPageChange={handlePageChange}
                                />
                                {/* Thông tin tổng số item */}
                                {paginationData && paginationData.totalItems > 0 && (
                                    <p className="text-sm text-gray-600">
                                        Hiển thị {((paginationData.currentPage - 1) * ITEMS_PER_PAGE) + 1}-
                                        {Math.min(paginationData.currentPage * ITEMS_PER_PAGE, paginationData.totalItems)}
                                        &nbsp;trên tổng số {paginationData.totalItems} mục
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Phần bên phải (Right Panel) */}
            {showRightPanel && selectedTaiSanData && (
                <div className="w-2/5 transition-all duration-300 border-l h-[450]">
                    <RightPanel
                        activeComponent={
                            <ChiTietTaiSan
                                taiSanData={selectedTaiSanData}
                                triggerRefetch={triggerRefetch}
                                onClose={handleCloseRightPanel}
                            />
                        }
                    />
                </div>
            )}
        </div>
    );
};

export default QuanLyTaiSan;