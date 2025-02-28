const RightPanel = ({ activeComponent, onClose }) => {
    if (!activeComponent) return null; // Ẩn RightPanel nếu không có nội dung

    return (
        <div className="flex flex-col w-2/5 overflow-auto transition-all duration-300 bg-white border-b">
            {/* Hiển thị component được truyền vào */}
            {activeComponent}
        </div>
    );
};

export default RightPanel;