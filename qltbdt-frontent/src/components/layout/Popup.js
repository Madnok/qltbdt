import React from "react";

const Popup = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="w-full md:w-2/3 lg:w-1/3 overflow-auto h-auto p-5 bg-white rounded-lg shadow-lg">        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✖
          </button>
        </div>

        {/* Nội dung pop-up */}
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
};

export default Popup;
