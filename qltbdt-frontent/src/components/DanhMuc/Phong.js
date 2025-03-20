import { useState, useEffect } from "react";
import axios from "axios";
import { paginateData } from "../../utils/helpers";
import { BsFilter } from "react-icons/bs";
import { AiOutlineClose } from "react-icons/ai";

const Phong = ({ setSelectedRecord, refresh }) => {
    const [data, setData] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [filter, setFilter] = useState({ coSo: "", toa: "", tang: "", soPhong: "" });
    const [activeFilter, setActiveFilter] = useState(null);

    useEffect(() => {
        axios.get("http://localhost:5000/api/phong")
            .then(response => setData(response.data))
            .catch(error => console.error("Lỗi tải dữ liệu:", error));
    }, [refresh]);

    const filteredData = data.filter(record =>
        (!filter.coSo || record.coSo === filter.coSo) &&
        (!filter.toa || record.toa === filter.toa) &&
        (!filter.tang || record.tang === parseInt(filter.tang)) &&
        (!filter.soPhong || record.soPhong === parseInt(filter.soPhong))
    );

    const { currentItems, totalPages } = paginateData(filteredData, currentPage);
    const goToPage = pageNumber => {
        if (pageNumber >= 1 && pageNumber <= totalPages) setCurrentPage(pageNumber);
    };

    const getDropdownValues = (key) => {
        return [...new Set(data.map(item => item[key]))].sort((a, b) => {
            return typeof a === "number" ? a - b : a.localeCompare(b);
        });
    };


    return (
        <div className="w-full overflow-auto">
            <table className="w-full border">
                <thead>
                    <tr className="bg-gray-200">
                        <th className="px-4 border-b">STT
                            <div className="flex flex-col items-center justify-center">
                                {/* Kiểm tra nếu bất kỳ filter nào đang được bật */}
                                {Object.values(filter).some(value => value) && (
                                    <AiOutlineClose
                                        className="text-red-500 cursor-pointer text-xl hover:text-red-600 transition"
                                        onClick={() => {
                                            setFilter({ coSo: "", toa: "", tang: "", soPhong: "" });
                                            setActiveFilter(null);
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
                                    <div className="absolute bg-white border mt-2 z-10">
                                        {getDropdownValues("coSo").map(value => (
                                            <div key={value} className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                                                onClick={() => { setFilter({ ...filter, coSo: value }); setActiveFilter(null); }}
                                            >
                                                {value}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {filter.coSo && (
                                    <AiOutlineClose
                                        className="text-red-500 cursor-pointer"
                                        onClick={() => setFilter({ ...filter, coSo: "" })}
                                    />
                                )}
                            </div>
                        </th>
                        <th className="px-4 py-2 border-b">
                            Tòa
                            <div className="flex flex-row justify-center">
                                <BsFilter className={`ml-2 cursor-pointer ${filter.toa ? "text-blue-500" : ""}`}
                                    onClick={() => setActiveFilter(activeFilter === "toa" ? null : "toa")}
                                />
                                <div className="flex flex-row justify-center">
                                    {filter.toa && (
                                        <AiOutlineClose
                                            className="text-red-500 cursor-pointer ml-2"
                                            onClick={() => setFilter({ ...filter, toa: "" })}
                                        />
                                    )}
                                    {activeFilter === "toa" && (
                                        <div className="absolute bg-white border mt-2 z-10">
                                            {getDropdownValues("toa").map(value => (
                                                <div key={value} className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                                                    onClick={() => { setFilter({ ...filter, toa: value }); setActiveFilter(null); }}
                                                >
                                                    {value}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </th>
                        <th className="px-4 py-2 border-b">
                            Tầng
                            <div className="flex flex-row justify-center">
                                <BsFilter className={`ml-2 cursor-pointer ${filter.tang ? "text-blue-500" : ""}`}
                                    onClick={() => setActiveFilter(activeFilter === "tang" ? null : "tang")}
                                />
                                {filter.tang && (
                                    <AiOutlineClose
                                        className="text-red-500 cursor-pointer ml-2"
                                        onClick={() => setFilter({ ...filter, tang: "" })}
                                    />
                                )}
                                {activeFilter === "tang" && (
                                    <div className="absolute bg-white border mt-2 z-10">
                                        {getDropdownValues("tang").map(value => (
                                            <div key={value} className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                                                onClick={() => { setFilter({ ...filter, tang: value }); setActiveFilter(null); }}
                                            >
                                                {value}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </th>
                        <th className="px-4 py-2 border-b">
                            Số Phòng
                            <div className="flex flex-row justify-center">
                                <BsFilter className={`ml-2 cursor-pointer ${filter.soPhong ? "text-blue-500" : ""}`}
                                    onClick={() => setActiveFilter(activeFilter === "soPhong" ? null : "soPhong")}
                                />
                                {filter.soPhong && (
                                    <AiOutlineClose
                                        className="text-red-500 cursor-pointer ml-2"
                                        onClick={() => setFilter({ ...filter, soPhong: "" })}
                                    />
                                )}
                                {activeFilter === "soPhong" && (
                                    <div className="absolute bg-white border mt-2 z-10">
                                        {getDropdownValues("soPhong").map(value => (
                                            <div key={value} className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                                                onClick={() => { setFilter({ ...filter, soPhong: value }); setActiveFilter(null); }}
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
                                <p className="mt-3 z-10"> </p>
                            </div>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {currentItems.map((record, index) => (
                        <tr key={record.id} onClick={() => setSelectedRecord(record)} className="text-center cursor-pointer hover:bg-gray-100">
                            <td className="p-2 border">{index + 1 + (currentPage - 1) * 10}</td>
                            <td className="p-2 border">{record.coSo}</td>
                            <td className="p-2 border">{record.toa}</td>
                            <td className="p-2 border">{record.tang}</td>
                            <td className="p-2 border">{record.soPhong}</td>
                            <td className="p-2 border">{record.chucNang}</td>
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
