import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchPhongList, assignTaiSanToPhongAPI } from '../../api';
import Popup from '../layout/Popup';
import { toast } from 'react-toastify';
import { FaSpinner } from 'react-icons/fa';

const FormPhanBo = ({ isOpen, onClose, selectedIds = [], triggerRefetch }) => {
    const [selectedPhongId, setSelectedPhongId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const queryClient = useQueryClient();

    const { data: phongList, isLoading: isLoadingPhong } = useQuery({
        queryKey: ['listPhong', isOpen],
        queryFn: () => fetchPhongList().then(res => res.data || res || []),
        enabled: isOpen,
        staleTime: 5 * 60 * 1000,
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

        setIsSubmitting(true);
        toast.info(`Đang phân bổ ${selectedIds.length} thiết bị...`);

        const assignPromises = selectedIds.map(thietBiId =>
            assignTaiSanToPhongAPI({ thongtinthietbi_id: thietBiId, phong_id: selectedPhongId })
                .then(response => ({ status: 'fulfilled', id: thietBiId, value: response }))
                .catch(error => ({ status: 'rejected', id: thietBiId, reason: error }))
        );

        try {
            const results = await Promise.all(assignPromises);

            let successCount = 0;
            let errorCount = 0;

            results.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    successCount++;
                } else {
                    errorCount++;
                    const thietBiId = result.id;
                    const error = result.reason;
                    toast.error(`Lỗi phân bổ TB ID ${thietBiId}: ${error?.response?.data?.error || error?.message || 'Lỗi không xác định'}`);
                }
            });

            // Thông báo kết quả tổng hợp
            if (successCount > 0) {
                toast.success(`Đã phân bổ thành công ${successCount} thiết bị!`);
                queryClient.invalidateQueries({ queryKey: ['taiSanList'] });
                queryClient.invalidateQueries({ queryKey: ['availableAssetsForAssignment'] });
                queryClient.invalidateQueries({ queryKey: ['phongTableData'] });
                queryClient.invalidateQueries({ queryKey: ['thietBiTrongPhong', parseInt(selectedPhongId, 10)] });
                queryClient.invalidateQueries({ queryKey: ['phong', parseInt(selectedPhongId, 10)] });
                queryClient.invalidateQueries({ queryKey: ['phongList'] });

                if (typeof triggerRefetch === 'function') {
                    triggerRefetch();
                } else {
                    console.warn('[FormPhanBo] triggerRefetch function is not passed as a prop.');
                }
                // ----- END MODIFICATION -----
            }
            if (errorCount > 0) {
                toast.warn(`Có ${errorCount} lỗi xảy ra trong quá trình phân bổ.`);
            }
            if (successCount === 0 && errorCount === 0) {
                toast.info("Không có thay đổi nào được thực hiện.");
            }

        } catch (error) {
            console.error("Lỗi không mong muốn trong Promise.all:", error);
            toast.error("Lỗi không xác định trong quá trình phân bổ.");
        } finally {
            console.log('[FormPhanBo] Assignment process finished. Setting isSubmitting false.');
            setIsSubmitting(false);
            onClose();
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
                            {Array.isArray(phongList) && phongList.map(p => (
                                <option key={p.id || p._id} value={p.id || p._id}>
                                    {p.phong || `${p.toa}${p.tang}.${p.soPhong}`} ({p.chucNang || 'N/A'})
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
                        disabled={isSubmitting}
                    >
                        Hủy
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600 disabled:opacity-50"
                        disabled={isLoadingPhong || isSubmitting || !selectedPhongId}
                    >
                        {isSubmitting && <FaSpinner className="w-4 h-4 mr-2 animate-spin" />}
                        {isSubmitting ? 'Đang phân bổ...' : 'Xác nhận'}
                    </button>
                </div>
            </form>
        </Popup>
    );
};

export default FormPhanBo;