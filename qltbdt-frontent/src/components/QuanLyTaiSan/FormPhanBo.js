// src/components/QuanLyTaiSan/FormPhanBo.js
import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchPhongList, assignTaiSanToPhongAPI } from '../../api'; // Import API cần thiết
import Popup from '../layout/Popup'; // Sử dụng Popup component có sẵn của bạn
import { toast } from 'react-toastify';

const FormPhanBo = ({ isOpen, onClose, selectedIds = [], triggerRefetch }) => {
    const [selectedPhongId, setSelectedPhongId] = useState('');

    // Lấy danh sách phòng cho dropdown
    const { data: phongList, isLoading: isLoadingPhong } = useQuery({
        queryKey: ['listPhong'],
        queryFn: () => fetchPhongList().then(res => res.data || res), // Đảm bảo lấy đúng dữ liệu
        enabled: isOpen, // Chỉ fetch khi modal mở
    });

    // Mutation để gán tài sản vào phòng
    const assignMutation = useMutation({
        mutationFn: ({ thongtinthietbi_id, phong_id }) => assignTaiSanToPhongAPI(thongtinthietbi_id, phong_id),
        onError: (error, variables) => {
            console.error(`Lỗi phân bổ thiết bị ID ${variables.thongtinthietbi_id}:`, error);
            toast.error(`Lỗi phân bổ TB ID ${variables.thongtinthietbi_id}: ${error.response?.data?.error || error.message}`);
        }
    });

    // Xử lý khi nhấn nút Xác nhận
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedPhongId) {
            toast.warn('Vui lòng chọn phòng để phân bổ.');
            return;
        }
        if (selectedIds.length === 0) {
            toast.warn('Không có thiết bị nào được chọn để phân bổ.');
            onClose(); // Đóng modal nếu không có ID
            return;
        }

        toast.info(`Đang phân bổ ${selectedIds.length} thiết bị vào phòng...`);

        try {
            const assignPromises = selectedIds.map(thietBiId =>
                assignMutation.mutateAsync({ thongtinthietbi_id: thietBiId, phong_id: selectedPhongId })
            );
            await Promise.all(assignPromises);

            toast.success(`Đã phân bổ thành công ${selectedIds.length} thiết bị!`);
            triggerRefetch(); // Làm mới bảng dữ liệu
            onClose(); // Đóng modal sau khi thành công

        } catch (error) {
            // Lỗi đã được xử lý trong onError của mutation
            console.error("Có lỗi xảy ra trong quá trình phân bổ hàng loạt.", error);
            // Không đóng modal nếu lỗi để người dùng biết
        }
    };

    return (
        <Popup isOpen={isOpen} onClose={onClose} title="Phân bổ Tài sản vào Phòng">
            <form onSubmit={handleSubmit}>
                <div className="p-4">
                    <p className="mb-4">Chọn phòng để phân bổ cho <strong>{selectedIds.length}</strong> tài sản đã chọn:</p>
                    {isLoadingPhong ? (
                        <p className="text-gray-500">Đang tải danh sách phòng...</p>
                    ) : (
                        <select
                            value={selectedPhongId}
                            onChange={(e) => setSelectedPhongId(e.target.value)}
                            className="w-full p-2 mb-4 border rounded"
                            required // Bắt buộc chọn phòng
                        >
                            <option value="" disabled>-- Chọn phòng --</option>
                            {phongList?.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.phong} ({p.chucNang || 'N/A'})
                                </option>
                            ))}
                        </select>
                    )}
                </div>
                <div className="flex justify-end p-4 bg-gray-100 rounded-b">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 mr-2 text-gray-700 bg-gray-300 rounded hover:bg-gray-400"
                        disabled={assignMutation.isPending} // Disable khi đang xử lý
                    >
                        Hủy
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600 disabled:opacity-50"
                        disabled={isLoadingPhong || assignMutation.isPending || !selectedPhongId} // Disable khi đang tải phòng, đang xử lý hoặc chưa chọn phòng
                    >
                        {assignMutation.isPending ? 'Đang phân bổ...' : 'Xác nhận'}
                    </button>
                </div>
            </form>
        </Popup>
    );
};

export default FormPhanBo;