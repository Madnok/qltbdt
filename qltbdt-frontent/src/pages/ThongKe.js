import RightPanel from "../components/layout/RightPanel";
import { useRightPanel } from "../utils/helpers";

const ThongKe = () => {
    const { selectedRecord, activeRightPanel, /* handleOpenRightPanel,*/ handleCloseRightPanel } = useRightPanel();
    return (
        <div className="flex flex-1 bg-gray-100">
            {/* Left Panel - Trang Thống Kê*/}
            <div className={`bg-white shadow-md flex flex-col transition-all duration-300 ${selectedRecord || activeRightPanel ? "w-3/5" : "w-full"}`}>
                {/* Header - Trang Thống Kê */}
                <div className="flex items-center justify-between p-2 bg-white shadow-md">
                    <h2 className="text-xl font-semibold">
                        Thống Kê
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
    );
};

export default ThongKe;