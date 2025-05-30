import { useMemo, useState } from "react";
import { useRefresh, useRightPanel } from "../utils/helpers";
import { categories, addForms, categoryLabels } from "../utils/constants";
import Phong from "../components/DanhMuc/Phong";
import TheLoai from "../components/DanhMuc/TheLoai";
import ThietBi from "../components/DanhMuc/ThietBi";
import ViPham from "../components/DanhMuc/ViPham";
import RightPanel from "../components/layout/RightPanel";
import FormPhong from "../components/forms/FormPhong";
import LeftPanel from "../components/layout/LeftPanel";

const DanhMuc = () => {
    const { refresh, handleRefresh } = useRefresh();
    const { activeRightPanel, handleOpenRightPanel, handleCloseRightPanel } = useRightPanel();
    const [selectedCategory, setSelectedCategory] = useState(null);

    // Object ánh xạ key danh mục đến component
    const componentsMap = {
        Phong: <Phong refresh={refresh} />,
        TheLoai: <TheLoai refresh={refresh} />,
        ThietBi: <ThietBi refresh={refresh} />,
        ViPham: <ViPham />,
    };

    // Xác định component nào hiển thị trên Right Panel
    const rightPanelComponent = useMemo(() => {
        switch (activeRightPanel) {
            case "FormPhong":
                return <FormPhong onClose={handleCloseRightPanel} refreshData={handleRefresh} />;
            default:
                return null;
        }
    }, [activeRightPanel, handleCloseRightPanel, handleRefresh]);

    // Xác định component nào hiển thị trên Left Panel
    const leftPanelComponent = selectedCategory ? componentsMap[selectedCategory] : (
        <div className="flex-1 px-4 pt-4 space-y-4 bg-white">
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
        <div className="flex flex-1 overflow-auto bg-gray-100 border">
            {/* Left Panel */}
            <div className={`transition-all duration-300 ${activeRightPanel ? "w-3/5" : "w-full"}`}>
                <div className={`bg-white p-4 border-b flex justify-between items-center`}>
                    <h2 className="text-2xl font-bold text-gray-800">
                        <span
                            className="text-black cursor-pointer hover:underline"
                            onClick={() => {
                                handleCloseRightPanel();
                                setSelectedCategory(null);
                            }}
                        >
                            Quản Lý Danh Mục
                        </span>
                        {selectedCategory && ` > ${categoryLabels[selectedCategory] || selectedCategory}`}
                    </h2>

                    <div className="flex items-center space-x-2">
                        {/* Nút Thêm - Chỉ hiển thị nếu là Phòng */}
                        {selectedCategory === "Phong" && (
                            <button
                                onClick={() => handleOpenRightPanel(addForms[selectedCategory])}
                                className="flex items-center px-4 py-2 text-white bg-gray-900 rounded hover:bg-gray-500"
                            >
                                <i className="mr-2 fas fa-plus"></i> Phòng & Thiết Bị
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
    );
};

export default DanhMuc;