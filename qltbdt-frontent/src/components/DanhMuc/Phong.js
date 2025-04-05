import { useState } from "react";
import { paginateData } from "../../utils/helpers";
import { fetchPhongListWithDetails } from "../../api";
import { useQuery } from '@tanstack/react-query';
import { BsFilter } from "react-icons/bs";
import { AiOutlineClose } from "react-icons/ai";



const Phong = ({ setSelectedRecord }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [filter, setFilter] = useState({ coSo: "", toa: "", tang: "", soPhong: "" });
    const [activeFilter, setActiveFilter] = useState(null);

    // --- Sử dụng useQuery --- //
    const { data: phongData = [], isLoading, isError, error } = useQuery({
        queryKey: ['phong'],
        queryFn: fetchPhongListWithDetails // Hàm fetch dữ liệu

    });

    // Lọc dữ liệu từ data của useQuery
    const filteredData = phongData.filter(record =>
        (!filter.coSo || record.coSo === filter.coSo) &&
        (!filter.toa || record.toa === filter.toa) &&
        (!filter.tang || record.tang === parseInt(filter.tang)) &&
        (!filter.soPhong || record.soPhong === parseInt(filter.soPhong))
    );

    const { currentItems, totalPages,indexOfFirstItem } = paginateData(filteredData, currentPage);

    const goToPage = pageNumber => {
        if (pageNumber >= 1 && pageNumber <= totalPages) setCurrentPage(pageNumber);
    };

    const getDropdownValues = (key) => {
        return [...new Set(phongData.map(item => item[key]))].sort((a, b) => {
            return typeof a === "number" ? a - b : String(a).localeCompare(String(b));
        });
    };

    if (isLoading) {
        return <div className="p-4 text-center">Đang tải danh sách phòng...</div>;
    }
    if (isError) {
        return <div className="p-4 text-center text-red-500">Lỗi tải dữ liệu: {error.message}</div>;
    }

    return (
        <div className="w-full overflow-auto">
            <table className="w-full border min-w-[600px]">
                <thead>
                    <tr className="bg-gray-200">
                        {/* Các th */}
                        <th className="px-4 border-b">STT
                            <div className="flex flex-col items-center justify-center">
                                {Object.values(filter).some(value => value) && (
                                    <AiOutlineClose
                                        className="text-xl text-red-500 transition cursor-pointer hover:text-red-600"
                                        onClick={() => {
                                            setFilter({ coSo: "", toa: "", tang: "", soPhong: "" });
                                            setActiveFilter(null);
                                            setCurrentPage(1); // Reset trang
                                        }}
                                    />
                                )}
                            </div>
                        </th>
                        <th className="px-4 py-2 border-b">
                            Cơ Sở
                            <div className="flex flex-row justify-center">
                                <BsFilter className={`ml-2 cursor-pointer ${filter.coSo ? "text-blue-500" : ""}`}
                                    onClick={() => setActiveFilter(activeFilter === "coSo" ? null : "coSo")}
                                />
                                {activeFilter === "coSo" && (
                                    <div className="absolute z-10 mt-2 bg-white border">
                                        {getDropdownValues("coSo").map(value => (
                                            <div key={value} className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                                                onClick={() => { setFilter({ ...filter, coSo: value }); setActiveFilter(null); setCurrentPage(1); }}
                                            >
                                                {value}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {filter.coSo && (
                                    <AiOutlineClose
                                        className="text-red-500 cursor-pointer"
                                        onClick={() => { setFilter({ ...filter, coSo: "" }); setCurrentPage(1); }}
                                    />
                                )}
                            </div>
                        </th>
                        {/* Tòa */}
                        <th className="px-4 py-2 border-b">
                            Tòa
                            <div className="flex flex-row justify-center">
                                <BsFilter className={`ml-2 cursor-pointer ${filter.toa ? "text-blue-500" : ""}`}
                                    onClick={() => setActiveFilter(activeFilter === "toa" ? null : "toa")}
                                />
                                {filter.toa && (
                                    <AiOutlineClose
                                        className="ml-2 text-red-500 cursor-pointer"
                                        onClick={() => { setFilter({ ...filter, toa: "" }); setCurrentPage(1); }}
                                    />
                                )}
                                {activeFilter === "toa" && (
                                    <div className="absolute z-10 mt-2 bg-white border">
                                        {getDropdownValues("toa").map(value => (
                                            <div key={value} className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                                                onClick={() => { setFilter({ ...filter, toa: value }); setActiveFilter(null); setCurrentPage(1); }}
                                            >
                                                {value}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </th>
                        {/* Tầng */}
                        <th className="px-4 py-2 border-b">
                            Tầng
                            <div className="flex flex-row justify-center">
                                <BsFilter className={`ml-2 cursor-pointer ${filter.tang ? "text-blue-500" : ""}`}
                                    onClick={() => setActiveFilter(activeFilter === "tang" ? null : "tang")}
                                />
                                {filter.tang && (
                                    <AiOutlineClose
                                        className="ml-2 text-red-500 cursor-pointer"
                                        onClick={() => { setFilter({ ...filter, tang: "" }); setCurrentPage(1); }}
                                    />
                                )}
                                {activeFilter === "tang" && (
                                    <div className="absolute z-10 mt-2 bg-white border">
                                        {getDropdownValues("tang").map(value => (
                                            <div key={value} className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                                                onClick={() => { setFilter({ ...filter, tang: value }); setActiveFilter(null); setCurrentPage(1); }}
                                            >
                                                {value}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </th>
                        {/* Số Phòng */}
                        <th className="px-4 py-2 border-b">
                            Số Phòng
                            <div className="flex flex-row justify-center">
                                <BsFilter className={`ml-2 cursor-pointer ${filter.soPhong ? "text-blue-500" : ""}`}
                                    onClick={() => setActiveFilter(activeFilter === "soPhong" ? null : "soPhong")}
                                />
                                {filter.soPhong && (
                                    <AiOutlineClose
                                        className="ml-2 text-red-500 cursor-pointer"
                                        onClick={() => { setFilter({ ...filter, soPhong: "" }); setCurrentPage(1); }}
                                    />
                                )}
                                {activeFilter === "soPhong" && (
                                    <div className="absolute z-10 mt-2 bg-white border">
                                        {getDropdownValues("soPhong").map(value => (
                                            <div key={value} className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                                                onClick={() => { setFilter({ ...filter, soPhong: value }); setActiveFilter(null); setCurrentPage(1); }}
                                            >
                                                {value}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </th>
                        <th className="px-4 py-2 border-b">Chức Năng
                            <div className="flex flex-row justify-center">
                                <p className="z-10 mt-3"> </p>
                            </div>
                        </th>
                        <th className="px-4 py-2 text-sm border-b">Danh Sách TB
                            <div className="flex flex-row justify-center">
                                <p className="z-10 mt-3"> </p>
                            </div>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {currentItems.map((record, index) => (
                        <tr key={record.id} onClick={() => setSelectedRecord(record)} className="text-center cursor-pointer hover:bg-gray-100">
                            <td className="p-2 border">{indexOfFirstItem + index + 1}</td> {/* Sửa STT */}
                            <td className="p-2 border">{record.coSo}</td>
                            <td className="p-2 border">{record.toa}</td>
                            <td className="p-2 border">{record.tang}</td>
                            <td className="p-2 border">{record.soPhong}</td>
                            <td className="p-2 border">{record.chucNang}</td>
                            <td className="p-2 border">
                                {record.totalDevices > 0 ? (
                                    <span>Có
                                        <strong className="font-bold text-red-400"> {record.totalDevices}</strong> thiết bị
                                    </span>
                                ) : (
                                    <span className="text-gray-500">-</span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {totalPages > 1 && (
                <div className="flex justify-center my-4 space-x-2">
                    {currentPage > 1 && (
                        <button className="px-4 py-2 bg-gray-200 border rounded hover:bg-gray-300"
                            onClick={() => goToPage(currentPage - 1)}>
                            ← Trước
                        </button>
                    )}
                    {[...Array(totalPages)].map((_, i) => (
                        <button key={i} className={`px-4 py-2 border rounded ${currentPage === i + 1 ? "bg-blue-500 text-white" : "bg-gray-200 hover:bg-gray-300"}`}
                            onClick={() => goToPage(i + 1)}>
                            {i + 1}
                        </button>
                    ))}
                    {currentPage < totalPages && (
                        <button className="px-4 py-2 bg-gray-200 border rounded hover:bg-gray-300"
                            onClick={() => goToPage(currentPage + 1)}>
                            Sau →
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default Phong;
