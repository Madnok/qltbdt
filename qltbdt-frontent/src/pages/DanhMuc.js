// import { useMemo, useState } from "react";// hàm dùng tránh render lại 0 cần thiết
// import { useSidebar, useRefresh, useRightPanel } from "../utils/helpers";
// import { categories, addForms, categoryLabels } from "../utils/constants";
// import Sidebar from "../components/layout/Sidebar";
// import Header from "../components/layout/Header";
// import Footer from "../components/layout/Footer";
// import Phong from "../components/DanhMuc/Phong";
// import TheLoai from "../components/DanhMuc/TheLoai";
// import ThietBi from "../components/DanhMuc/ThietBi";
// import ViPham from "../components/DanhMuc/ViPham";
// import GoiYDanhGia from "../components/DanhMuc/GoiYDanhGia";
// import ChiTietThietBi from "../components/DanhMuc/ChiTiet/ChiTietThietBi";
// import ChiTietPhong from "../components/DanhMuc/ChiTiet/ChiTietPhong";
// import ChiTietTheLoai from "../components/DanhMuc/ChiTiet/ChiTietTheLoai";
// import FormTheLoai from "../components/forms/FormTheLoai";
// import FormThietBi from "../components/forms/FormThietBi";
// import RightPanel from "../components/layout/RightPanel";
// import FormPhong from "../components/forms/FormPhong";

// const DanhMuc = () => {
//     const { isSidebarOpen, toggleSidebar } = useSidebar();
//     const { refresh, handleRefresh } = useRefresh();
//     const { selectedRecord, activeRightPanel, handleOpenRightPanel, handleCloseRightPanel } = useRightPanel();
//     const [selectedCategory, setSelectedCategory] = useState(null);

//     // Object ánh xạ key danh mục đến component
//     const componentsMap = {
//         Phong: <Phong setSelectedRecord={(record) => handleOpenRightPanel("ChiTietPhong", record)} refresh={refresh} />,
//         TheLoai: <TheLoai setSelectedRecord={(record) => handleOpenRightPanel("ChiTietTheLoai", record)} refresh={refresh} />,
//         ThietBi: <ThietBi setSelectedRecord={(record) => handleOpenRightPanel("ChiTietThietBi", record)} refresh={refresh} />,
//         ChiTietThietBi: <ChiTietThietBi setSelectedRecord={(record) => handleOpenRightPanel("ChiTietThietBi", record)} />,
//         ViPham: <ViPham setSelectedRecord={(record) => handleOpenRightPanel("ChiTietViPham", record)} />,
//         GoiYDanhGia: <GoiYDanhGia setSelectedRecord={(record) => handleOpenRightPanel("ChiTietGoiYDanhGia", record)} />,
//     };

//     // Xác định component nào hiển thị trên Right Panel
//     const rightPanelComponent = useMemo(() => {
//         switch (activeRightPanel) {
//             case "ChiTietPhong":
//                 return <ChiTietPhong record={selectedRecord} onClose={handleCloseRightPanel} refreshData={handleRefresh} />;
//             case "FormPhong":
//                 return <FormPhong onClose={handleCloseRightPanel} refreshData={handleRefresh} />;
//             case "ChiTietTheLoai":
//                 return <ChiTietTheLoai record={selectedRecord} onClose={handleCloseRightPanel} refreshData={handleRefresh} />;
//             case "FormTheLoai":
//                 return <FormTheLoai onClose={handleCloseRightPanel} refreshData={handleRefresh} />;
//             case "ChiTietThietBi":
//                 return <ChiTietThietBi record={selectedRecord} onClose={handleCloseRightPanel} refreshData={handleRefresh} />;
//             case "FormThietBi":
//                 return <FormThietBi onClose={handleCloseRightPanel} refreshData={handleRefresh} />;
//             default:
//                 return null;
//         }
//     }, [activeRightPanel, selectedRecord, handleCloseRightPanel, handleRefresh]);

//     return (
//         <div className="flex flex-col h-screen">
//             {/* Header tổng */}
//             <Header toggleSidebar={toggleSidebar} />

//             <div className="flex flex-1">
//                 {/* Sidebar */}
//                 <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

//                 {/* Main Content */}
//                 <div className="flex flex-1 p-2 overflow-auto bg-gray-100">
//                     {/* Left Panel - Danh sách Danh Mục */}
//                     <div className={`bg-white shadow-md flex flex-col transition-all duration-300 ${selectedRecord || activeRightPanel ? "w-3/5" : "w-full"}`}>
//                         {/* Header Danh Mục */}
//                         <div className={`bg-white p-4 shadow-md flex justify-between items-center`}>
//                             <h2 className="text-xl font-semibold">
//                                 <span
//                                     className="text-black cursor-pointer hover:underline"
//                                     onClick={() => {
//                                         handleCloseRightPanel();
//                                         setSelectedCategory(null);
//                                     }}
//                                 >
//                                     Danh Mục
//                                 </span>
//                                 {selectedCategory && ` > ${categoryLabels[selectedCategory] || selectedCategory}`}
//                             </h2>

//                             <div className="flex items-center space-x-2">
//                                 {/* Nút Sort */}
//                                 <button className="flex items-center justify-center w-10 h-10 transition rounded-full hover:bg-gray-300">
//                                     <i className="text-lg text-gray-500 fas fa-filter"></i>
//                                 </button>

//                                 {/* Nút Thêm - Chỉ hiển thị khi có danh mục được chọn */}
//                                 {addForms[selectedCategory] && (
//                                     <button
//                                         onClick={() => handleOpenRightPanel(addForms[selectedCategory])}
//                                         className="flex items-center px-4 py-2 text-white bg-blue-500 rounded"
//                                     >
//                                         <i className="mr-2 fas fa-plus"></i> Thêm {categoryLabels[selectedCategory] || selectedCategory}
//                                     </button>
//                                 )}
//                             </div>
//                         </div>

//                         <div className="flex-1">
//                             {selectedCategory ? (
//                                 componentsMap[selectedCategory] || null
//                             ) : (
//                                 <div className="flex-1 space-y-4 bg-white">
//                                     {categories.map((category) => (
//                                         <div key={category.name}
//                                             className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-100"
//                                             onClick={() => setSelectedCategory(category.key)}>
//                                             <div className="flex items-center space-x-4">
//                                                 <i className={`${category.icon} text-2xl text-blue-500`}></i>
//                                                 <span className="text-lg font-semibold">{category.name}</span>
//                                             </div>
//                                             <i className="text-gray-500 fas fa-chevron-right"></i>
//                                         </div>
//                                     ))}
//                                 </div>
//                             )}
//                         </div>
//                     </div>
//                     {/* TRAng Right Panel mới thêm*/}
//                     <div className="w-2/5 transition-all duration-300">
//                         <RightPanel activeComponent={rightPanelComponent} onClose={handleCloseRightPanel} />
//                     </div>
//                 </div>
//             </div>
//             <Footer />
//         </div>
//     );
// };

// export default DanhMuc;

import { useMemo, useState } from "react"; // hàm dùng tránh render lại không cần thiết
import { useSidebar, useRefresh, useRightPanel } from "../utils/helpers";
import { categories, addForms, categoryLabels } from "../utils/constants";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import Phong from "../components/DanhMuc/Phong";
import TheLoai from "../components/DanhMuc/TheLoai";
import ThietBi from "../components/DanhMuc/ThietBi";
import ViPham from "../components/DanhMuc/ViPham";
import GoiYDanhGia from "../components/DanhMuc/GoiYDanhGia";
import ChiTietThietBi from "../components/DanhMuc/ChiTiet/ChiTietThietBi";
import ChiTietPhong from "../components/DanhMuc/ChiTiet/ChiTietPhong";
import ChiTietTheLoai from "../components/DanhMuc/ChiTiet/ChiTietTheLoai";
import FormTheLoai from "../components/forms/FormTheLoai";
import FormThietBi from "../components/forms/FormThietBi";
import RightPanel from "../components/layout/RightPanel";
import FormPhong from "../components/forms/FormPhong";
import LeftPanel from "../components/layout/LeftPanel";

const DanhMuc = () => {
    const { isSidebarOpen, toggleSidebar } = useSidebar();
    const { refresh, handleRefresh } = useRefresh();
    const { selectedRecord, activeRightPanel, handleOpenRightPanel, handleCloseRightPanel } = useRightPanel();
    const [selectedCategory, setSelectedCategory] = useState(null);

    // Object ánh xạ key danh mục đến component
    const componentsMap = {
        Phong: <Phong setSelectedRecord={(record) => handleOpenRightPanel("ChiTietPhong", record)} refresh={refresh} />,
        TheLoai: <TheLoai setSelectedRecord={(record) => handleOpenRightPanel("ChiTietTheLoai", record)} refresh={refresh} />,
        ThietBi: <ThietBi setSelectedRecord={(record) => handleOpenRightPanel("ChiTietThietBi", record)} refresh={refresh} />,
        ChiTietThietBi: <ChiTietThietBi setSelectedRecord={(record) => handleOpenRightPanel("ChiTietThietBi", record)} />,
        ViPham: <ViPham setSelectedRecord={(record) => handleOpenRightPanel("ChiTietViPham", record)} />,
        GoiYDanhGia: <GoiYDanhGia setSelectedRecord={(record) => handleOpenRightPanel("ChiTietGoiYDanhGia", record)} />,
    };

    // Xác định component nào hiển thị trên Right Panel
    const rightPanelComponent = useMemo(() => {
        switch (activeRightPanel) {
            case "ChiTietPhong":
                return <ChiTietPhong record={selectedRecord} onClose={handleCloseRightPanel} refreshData={handleRefresh} />;
            case "FormPhong":
                return <FormPhong onClose={handleCloseRightPanel} refreshData={handleRefresh} />;
            case "ChiTietTheLoai":
                return <ChiTietTheLoai record={selectedRecord} onClose={handleCloseRightPanel} refreshData={handleRefresh} />;
            case "FormTheLoai":
                return <FormTheLoai onClose={handleCloseRightPanel} refreshData={handleRefresh} />;
            case "ChiTietThietBi":
                return <ChiTietThietBi record={selectedRecord} onClose={handleCloseRightPanel} refreshData={handleRefresh} />;
            case "FormThietBi":
                return <FormThietBi onClose={handleCloseRightPanel} refreshData={handleRefresh} />;
            default:
                return null;
        }
    }, [activeRightPanel, selectedRecord, handleCloseRightPanel, handleRefresh]);

    // Xác định component nào hiển thị trên Left Panel
    const leftPanelComponent = selectedCategory ? componentsMap[selectedCategory] : (
        <div className="flex-1 space-y-4 bg-white">
            {categories.map((category) => (
                <div key={category.name}
                    className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-100"
                    onClick={() => setSelectedCategory(category.key)}>
                    <div className="flex items-center space-x-4">
                        <i className={`${category.icon} text-2xl text-blue-500`}></i>
                        <span className="text-lg font-semibold">{category.name}</span>
                    </div>
                    <i className="text-gray-500 fas fa-chevron-right"></i>
                </div>
            ))}
        </div>
    );

    return (
        <div className="flex flex-col h-screen">
            {/* Header tổng */}
            <Header toggleSidebar={toggleSidebar} />

            <div className="flex flex-1">
                {/* Sidebar */}
                <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

                {/* Main Content */}
                <div className="flex flex-1 p-2 overflow-auto bg-gray-100">
                    {/* Left Panel */}
                    <div className={`transition-all duration-300 ${activeRightPanel ? "w-3/5" : "w-full"}`}>
                        <div className={`bg-white p-4 shadow-md flex justify-between items-center`}>
                            <h2 className="text-xl font-semibold">
                                <span
                                    className="text-black cursor-pointer hover:underline"
                                    onClick={() => {
                                        handleCloseRightPanel();
                                        setSelectedCategory(null);
                                    }}
                                >
                                    Danh Mục
                                </span>
                                {selectedCategory && ` > ${categoryLabels[selectedCategory] || selectedCategory}`}
                            </h2>

                            <div className="flex items-center space-x-2">
                                {/* Nút Sort */}
                                <button className="flex items-center justify-center w-10 h-10 transition rounded-full hover:bg-gray-300">
                                    <i className="text-lg text-gray-500 fas fa-filter"></i>
                                </button>

                                {/* Nút Thêm - Chỉ hiển thị khi có danh mục được chọn */}
                                {addForms[selectedCategory] && (
                                    <button
                                        onClick={() => handleOpenRightPanel(addForms[selectedCategory])}
                                        className="flex items-center px-4 py-2 text-white bg-blue-500 rounded"
                                    >
                                        <i className="mr-2 fas fa-plus"></i> Thêm {categoryLabels[selectedCategory] || selectedCategory}
                                    </button>
                                )}
                            </div>
                        </div>
                        <LeftPanel activeComponent={leftPanelComponent} />
                    </div>

                    {/* Right Panel */}
                    {activeRightPanel && (
                        <div className="w-2/5 transition-all duration-300">
                            <RightPanel activeComponent={rightPanelComponent} onClose={handleCloseRightPanel} />
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default DanhMuc;

