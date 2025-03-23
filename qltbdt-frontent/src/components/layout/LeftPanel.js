const LeftPanel = ({ activeComponent }) => {
   
    return (
      <div className="flex flex-col min-h-screen h-screen overflow-auto w-full bg-white border-r shadow-md">
        {/* Hiển thị component được truyền vào */}
        {activeComponent}
      </div>
    );
  };
  
  export default LeftPanel;
  