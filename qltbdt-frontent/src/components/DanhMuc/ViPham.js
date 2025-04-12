import React, { useState, useEffect } from 'react';

const ViPham = () => {
  const [violations, setViolations] = useState([]);
  const [loading] = useState(false);
  const [error] = useState(null);


  useEffect(() => {
    const dummyData = [
      { id: 1, employeeId: 'NV001', employeeName: 'Nguyễn Văn An', violationType: 'Đi làm trễ', date: '2025-04-10', details: 'Trễ 15 phút', status: 'Chưa xử lý' },
      { id: 2, employeeId: 'NV002', employeeName: 'Trần Thị Bình', violationType: 'Nghỉ làm không phép', date: '2025-04-11', details: 'Nghỉ cả ngày', status: 'Đã xử lý' },
      { id: 3, employeeId: 'NV003', employeeName: 'Lê Văn Cường', violationType: 'Hoàn thành công việc chậm', date: '2025-04-12', details: 'Trễ deadline báo cáo tuần 2 ngày', status: 'Chưa xử lý' },
      { id: 4, employeeId: 'NV001', employeeName: 'Nguyễn Trần Dần', violationType: 'Không tuân thủ quy định trang phục', date: '2025-04-09', details: 'Không đeo thẻ nhân viên', status: 'Đã xử lý' },
      { id: 5, employeeId: 'NV004', employeeName: 'Phạm Thị Dung', violationType: 'Sử dụng tài sản công vào việc riêng', date: '2025-04-12', details: 'In tài liệu cá nhân', status: 'Chưa xử lý' },
    ];
    setViolations(dummyData);

  }, []);

  const handleProcessViolation = (id) => {
    console.log(`Processing violation with ID: ${id}`);
    setViolations(prevViolations =>
      prevViolations.map(v =>
        v.id === id ? { ...v, status: 'Đã xử lý' } : v
      )
    );
  };

  return (
    <div className="container p-4 mx-auto">
      <h1 className="mb-4 text-2xl font-bold text-center text-blue-600">Quản lý Xử lý Vi phạm Nhân viên</h1>

      {loading && <p>Đang tải danh sách vi phạm...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && (
        <div className="overflow-x-auto shadow-md sm:rounded-lg">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3">ID</th>
                <th scope="col" className="px-6 py-3">Mã Nhân viên</th>
                <th scope="col" className="px-6 py-3">Tên Nhân viên</th>
                <th scope="col" className="px-6 py-3">Loại Vi phạm</th>
                <th scope="col" className="px-6 py-3">Ngày Vi phạm</th>
                <th scope="col" className="px-6 py-3">Chi tiết</th>
                <th scope="col" className="px-6 py-3">Trạng thái</th>
                <th scope="col" className="px-6 py-3">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {violations.length > 0 ? (
                violations.map((violation) => (
                  <tr key={violation.id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4">{violation.id}</td>
                    <td className="px-6 py-4">{violation.employeeId}</td>
                    <td className="px-6 py-4">{violation.employeeName}</td>
                    <td className="px-6 py-4">{violation.violationType}</td>
                    <td className="px-6 py-4">{violation.date}</td>
                    <td className="px-6 py-4">{violation.details}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        violation.status === 'Chưa xử lý' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {violation.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {violation.status === 'Chưa xử lý' && (
                        <button
                          onClick={() => handleProcessViolation(violation.id)}
                          className="font-medium text-blue-600 hover:underline"
                        >
                          Xử lý
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center">Không có dữ liệu vi phạm.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
       {/* Add form or other elements for adding/editing violations if needed */}
       {/* Example: <button className="px-4 py-2 mt-4 font-bold text-white bg-blue-500 rounded hover:bg-blue-700">Thêm Vi phạm Mới</button> */}
    </div>
  );
};

export default ViPham;
