const RightPanel = ({ activeComponent}) => {
    if (!activeComponent) return null; // Ẩn RightPanel nếu không có nội dung

    return ( 
        <div className="min-h-0 h-screen overflow-auto bg-white shadow-md transition-all duration-300">
            {/* Hiển thị component được truyền vào */}
            {activeComponent}
        </div>
    );
};

export default RightPanel;