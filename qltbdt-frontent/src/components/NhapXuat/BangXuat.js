const BangXuat = ({ setSelectedRecord }) => {
    const dataNhap = [
      { id: "GN1", date: "26/4/2023 20:35", type: "Mua mới", device: "Máy chiếu YG650" },
      { id: "GN2", date: "26/4/2023 21:48", type: "Tài trợ", device: "Laptop Dell XPS" },
    ];
  
    return (
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-200">
            <th className="px-4 py-2 border-b">ID</th>
            <th className="px-4 py-2 border-b">Ngày tạo</th>
            <th className="px-4 py-2 border-b">Trường hợp</th>
            <th className="px-4 py-2 border-b">Thiết bị</th>
          </tr>
        </thead>
        <tbody>
          {dataNhap.map((record) => (
            <tr
              key={record.id}
              className="text-center cursor-pointer hover:bg-gray-100"
              onClick={() => setSelectedRecord(record)}
            >
              <td className="p-2 border">{record.id}</td>
              <td className="p-2 border">{record.date}</td>
              <td className="p-2 border">{record.type}</td>
              <td className="p-2 border">{record.device}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };
  
  export default BangXuat;
  