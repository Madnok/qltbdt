import React from "react";

const Popup = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex justify-end bg-black bg-opacity-30">
      <div className="w-1/3 bg-white h-full shadow-lg p-5">
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-2">
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
