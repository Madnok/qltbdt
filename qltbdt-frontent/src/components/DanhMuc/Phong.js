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


    const fetchTotalDevices = async (phongId) => {
        try {
            const response = await axios.get(`http://localhost:5000/api/phong/danhsach-thietbi/${phongId}`);
            const devices = response.data; // API trả về danh sách các thiết bị với trường `total`

            if (devices.length > 0) {
                // Tính tổng số thiết bị từ thuộc tính `total` của thiết bị đầu tiên (giả định tất cả thiết bị có chung `total`)
                return devices[0].total || 0;
            }

            return 0; // Nếu không có thiết bị nào, trả về 0
        } catch (error) {
            console.error("Lỗi lấy tổng số thiết bị:", error);
            return 0; // Trả về 0 nếu xảy ra lỗi
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get("http://localhost:5000/api/phong");
                const rooms = response.data;

                // Lấy tổng số thiết bị cho từng phòng
                const updatedRooms = await Promise.all(
                    rooms.map(async (room) => {
                        const totalDevices = await fetchTotalDevices(room.id);
                        return { ...room, totalDevices }; // Thêm totalDevices vào từng record
                    })
                );

                setData(updatedRooms);
            } catch (error) {
                console.error("Lỗi tải dữ liệu:", error);
            }
        };

        fetchData();
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
                                        className="text-xl text-red-500 transition cursor-pointer hover:text-red-600"
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
                                    <div className="absolute z-10 mt-2 bg-white border">
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
                                            className="ml-2 text-red-500 cursor-pointer"
                                            onClick={() => setFilter({ ...filter, toa: "" })}
                                        />
                                    )}
                                    {activeFilter === "toa" && (
                                        <div className="absolute z-10 mt-2 bg-white border">
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
                                        className="ml-2 text-red-500 cursor-pointer"
                                        onClick={() => setFilter({ ...filter, tang: "" })}
                                    />
                                )}
                                {activeFilter === "tang" && (
                                    <div className="absolute z-10 mt-2 bg-white border">
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
                                        className="ml-2 text-red-500 cursor-pointer"
                                        onClick={() => setFilter({ ...filter, soPhong: "" })}
                                    />
                                )}
                                {activeFilter === "soPhong" && (
                                    <div className="absolute z-10 mt-2 bg-white border">
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
                            <td className="p-2 border">{index + 1 + (currentPage - 1) * 10}</td>
                            <td className="p-2 border">{record.coSo}</td>
                            <td className="p-2 border">{record.toa}</td>
                            <td className="p-2 border">{record.tang}</td>
                            <td className="p-2 border">{record.soPhong}</td>
                            <td className="p-2 border">{record.chucNang}</td>
                            <td className="p-2 border">
                                {record.totalDevices ? (
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
