const LeftPanel = ({ activeComponent }) => {
   
    return (
      <div className="flex flex-col w-3/5 h-screen min-h-0 overflow-auto transition-all duration-300 bg-white border-r shadow-md">
        {/* Hiển thị component được truyền vào */}
        {activeComponent}
      </div>
    );
  };
  
  export default LeftPanel;
  