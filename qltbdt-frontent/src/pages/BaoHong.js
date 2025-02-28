
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import RightPanel from "../components/layout/RightPanel";
import { useSidebar,/* useRefresh ,*/ useRightPanel } from "../utils/helpers";

const BaoHong = () => {
    const { isSidebarOpen, toggleSidebar } = useSidebar();
    const { selectedRecord, activeRightPanel, /* handleOpenRightPanel,*/ handleCloseRightPanel } = useRightPanel();
    return (
        <div className="flex flex-col h-screen">
            {/* Header tổng */}
            <Header toggleSidebar={toggleSidebar} />

            <div className="flex flex-1">
                {/* Sidebar */}
                <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

                {/* Main Content */}
                <div className="flex flex-1 p-2 bg-gray-100">
                    {/* Left Panel - Trang Báo Hỏng */}
                    <div className={`bg-white shadow-md flex flex-col transition-all duration-300 ${selectedRecord || activeRightPanel ? "w-3/5" : "w-full"}`}>
                        {/* Header - Trang Báo Hỏng */}
                        <div className="flex items-center justify-between p-2 bg-white shadow-md">
                            <h2 className="text-xl font-semibold">
                                Báo Hỏng
                            </h2>
                            <div className="flex items-center space-x-2">
                                {/* Nút Sort */}
                                <button className="flex items-center justify-center w-10 h-10 transition rounded-full hover:bg-gray-300">
                                    <i className="text-lg text-gray-500 fas fa-filter"></i>
                                </button>
                                {/* Nút Thêm */}
                                <button className="flex items-center px-4 py-2 text-white bg-blue-500 rounded">
                                    <i className="mr-2 fas fa-plus"></i> Thêm
                                </button>
                            </div>
                        </div>
                    </div>
                    <RightPanel onClose={handleCloseRightPanel} />
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default BaoHong;