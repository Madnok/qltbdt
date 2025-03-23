const RightPanel = ({ activeComponent }) => {
    if (!activeComponent) return null; // Ẩn RightPanel nếu không có nội dung

    return (
        <div className="bg-white border boder-2 pb-4">
            <div className="flex flex-col min-h-screen h-screen overflow-auto bg-white transition-all duration-300">
                {/* Hiển thị component được truyền vào */}
                {activeComponent}

            </div>
            <p className="p-5 text-white text-xs">right panel</p>
        </div>
    );
};

export default RightPanel;