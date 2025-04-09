import React from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    const handlePrevious = () => {
        if (currentPage > 1) {
            onPageChange(currentPage - 1);
        }
    };

    const handleNext = () => {
        if (currentPage < totalPages) {
            onPageChange(currentPage + 1);
        }
    };

    // --- Logic tạo danh sách các nút số trang 
    const pageNumbers = [];
    const maxPagesToShow = 5; // Số trang tối đa hiển thị xung quanh trang hiện tại
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    // Điều chỉnh nếu endPage đạt giới hạn cuối mà chưa đủ maxPagesToShow
     if (endPage === totalPages && (endPage - startPage + 1) < maxPagesToShow) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
     }

     if (startPage > 1) {
         pageNumbers.push(1);
         if (startPage > 2) {
             pageNumbers.push('...'); 
         }
     }

    for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
    }

     if (endPage < totalPages) {
         if (endPage < totalPages - 1) {
             pageNumbers.push('...');
         }
         pageNumbers.push(totalPages);
     }

    return (
        <nav className="flex items-center justify-center space-x-1">
            {/* Nút Previous */}
            <button
                onClick={handlePrevious}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded-md text-sm ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
                aria-label="Trang trước"
            >
                <FaChevronLeft className="w-4 h-4" />
            </button>

            {/* Các nút số trang */}
            {pageNumbers.map((page, index) =>
                typeof page === 'number' ? (
                    <button
                        key={page}
                        onClick={() => onPageChange(page)}
                        disabled={currentPage === page}
                        className={`px-3 py-1 rounded-md text-sm font-medium ${
                            currentPage === page
                                ? 'bg-gray-900 text-white cursor-default'
                                : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        {page}
                    </button>
                ) : (
                     <span key={`dots-${index}`} className="px-3 py-1 text-sm text-gray-400">
                         {page}
                    </span>
                )
            )}

            {/* Nút Next */}
            <button
                onClick={handleNext}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded-md text-sm ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
                aria-label="Trang sau"
            >
                <FaChevronRight className="w-4 h-4" />
            </button>
        </nav>
    );
};

export default Pagination;