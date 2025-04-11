import React, { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import BoLocTaiSan from '../components/QuanLyTaiSan/BoLocTaiSan';
import BangTaiSan from '../components/QuanLyTaiSan/BangTaiSan';
import ChiTietTaiSan from '../components/QuanLyTaiSan/ChiTietTaiSan';
import RightPanel from '../components/layout/RightPanel';
import { getAllTaiSanAPI } from '../api';
import Pagination from '../components/layout/Pagination.js';
import { FaSortUp, FaSortDown } from 'react-icons/fa';

const ITEMS_PER_PAGE = 12;

const QuanLyTaiSan = () => {
    const [filterParams, setFilterParams] = useState({});
    const [selectedTaiSanId, setSelectedTaiSanId] = useState(null);
    const [showRightPanel, setShowRightPanel] = useState(false);
    const [selectedTaiSanData, setSelectedTaiSanData] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortParams, setSortParams] = useState({ sortBy: 'id', order: 'desc' });

    // Cập nhật useQuery để gửi tham số pagination và sort
    const { data: apiResponse, isLoading, error, refetch, isPreviousData } = useQuery({
        queryKey: ['taiSan', filterParams, currentPage, ITEMS_PER_PAGE, sortParams],
        queryKeyHashFn: JSON.stringify,
        queryFn: () => getAllTaiSanAPI({
            ...filterParams,
            page: currentPage,
            limit: ITEMS_PER_PAGE,
            sortBy: sortParams.sortBy,
            order: sortParams.order
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

    const handleSort = (newOrder) => {
        setSortParams({ sortBy: 'id', order: newOrder });
        setCurrentPage(1);
    };

    return (
        <div className="flex flex-1 bg-white">
            {/* Phần bên trái (Danh sách và bộ lọc) */}
            <div className={`transition-all duration-300 border ${showRightPanel ? "w-3/5" : "w-full"}`}>
                <div className="flex items-center justify-between p-4 border">
                    <h2 className="text-2xl font-bold text-gray-800">Quản Lý Tài Sản</h2>
                </div>
                <div className="flex flex-col h-[450] p-4">
                    <BoLocTaiSan onFilterChange={handleFilterChange} />

                    {/* Thêm khu vực Sắp xếp và Thông tin phân trang */}
                    <div className="flex flex-col items-center justify-between gap-2 mt-6 sm:flex-row">
                        {/* Nút sắp xếp */}
                        <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-600">Sắp xếp theo ID:</span>
                            <button
                                onClick={() => handleSort('asc')}
                                disabled={sortParams.order === 'asc'}
                                className={`p-1 rounded ${sortParams.order === 'asc' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'}`}
                                aria-label="Sắp xếp tăng dần"
                            >
                                <FaSortUp className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => handleSort('desc')}
                                disabled={sortParams.order === 'desc'}
                                className={`p-1 rounded ${sortParams.order === 'desc' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'}`}
                                aria-label="Sắp xếp giảm dần"
                            >
                                <FaSortDown className="w-4 h-4" />
                            </button>
                        </div>

                    </div>


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