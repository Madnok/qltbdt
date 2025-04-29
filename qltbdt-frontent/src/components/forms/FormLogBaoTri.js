import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FaTimesCircle, FaPaperclip } from 'react-icons/fa';
import { createLogBaoTriAPI, uploadInvoiceImagesAPI } from '../../api';
import { toast } from 'react-toastify';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import moment from 'moment';
import { getTinhTrangLabel } from '../../utils/constants';

const FormLogBaoTri = ({ taskInfo, onClose }) => {
    const isMaintenance = !!taskInfo?.lichbaoduong_id;
    const taskTypeLabel = isMaintenance ? 'Bảo dưỡng (Định kỳ)' : 'Sửa chữa (Báo hỏng)';
    const taskId = isMaintenance ? taskInfo.lichbaoduong_id : taskInfo.id;
    const baohongIdForQuery = isMaintenance ? null : taskId;
    const lichbaoduongIdForQuery = isMaintenance ? taskId : null;
    const thongtinthietbiIdForQuery = taskInfo?.thongtinthietbi_id || null;

    // States
    const [hoatdong, setHoatdong] = useState('');
    const [ketQuaXuLy, setKetQuaXuLy] = useState('');
    const [suDungVatTu, setSuDungVatTu] = useState(false);
    const [ghiChuVatTu, setGhiChuVatTu] = useState('');
    const [chiPhi, setChiPhi] = useState('');
    const [invoiceFiles, setInvoiceFiles] = useState([]);
    const [invoicePreviews, setInvoicePreviews] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [phuongAnXuLy, setPhuongAnXuLy] = useState('');
    const [phuongAnKhacChiTiet, setPhuongAnKhacChiTiet] = useState('');
    const [damageFiles, setDamageFiles] = useState([]);
    const [damagePreviews, setDamagePreviews] = useState([]);
    const [ngayDuKienTra, setNgayDuKienTra] = useState('');

    const queryClient = useQueryClient();
    const tinhTrangThietBiHienTai = taskInfo?.tinhTrangThietBi;

    const canBaoHanh = useMemo(() => {
        return isMaintenance || (tinhTrangThietBiHienTai && tinhTrangThietBiHienTai !== 'het_bao_hanh');
    }, [isMaintenance, tinhTrangThietBiHienTai]);

    const isImageRequired = useMemo(() => {
        return (
            ketQuaXuLy === 'Không tìm thấy lỗi / Không cần xử lý' ||
            (
                (phuongAnXuLy === 'Tự Sửa Chữa' || phuongAnXuLy === 'Khác') &&
                (ketQuaXuLy === 'Đã sửa chữa xong' || ketQuaXuLy === 'Đề xuất thanh lý')
            )
        );
    }, [ketQuaXuLy, phuongAnXuLy]);

    // Effect để reset form và set giá trị gợi ý
    useEffect(() => {
        console.log("[FormLogBaoTri] Received taskInfo:", taskInfo); // Log prop nhận được
        if (taskInfo?.suggestedKetQuaXuLy) {
            setKetQuaXuLy(taskInfo.suggestedKetQuaXuLy);
            console.log("[FormLogBaoTri] Set suggested KetQuaXuLy:", taskInfo.suggestedKetQuaXuLy);
        } else {
            setKetQuaXuLy('');
        }
        // Reset các state khác
        setHoatdong('');
        setSuDungVatTu(false);
        setGhiChuVatTu('');
        setChiPhi('');
        setInvoiceFiles([]);
        setInvoicePreviews([]);
        setDamageFiles([]);
        setDamagePreviews([]);
        setPhuongAnXuLy('');
        setPhuongAnKhacChiTiet('');
        setNgayDuKienTra('');
        setError('');
    }, [taskInfo]);

    // Effect reset phương án xử lý nếu không hợp lệ
    useEffect(() => {
        if (!canBaoHanh && phuongAnXuLy === 'Bảo hành') {
            setPhuongAnXuLy('');
        }
    }, [canBaoHanh, phuongAnXuLy]);

    const createLogMutation = useMutation({
        mutationFn: createLogBaoTriAPI,
        onSuccess: (data, variables) => { 
            toast.success('Ghi nhận hoạt động thành công!');
            // 1. Invalidate query lấy log chi tiết cho chính task vừa tạo log
            if (lichbaoduongIdForQuery) {
                queryClient.invalidateQueries({ queryKey: ['baotriLogs', { lichbaoduong_id: lichbaoduongIdForQuery }] });
                queryClient.invalidateQueries({ queryKey: ['assignedBaoDuongTasks'] });
                queryClient.invalidateQueries({ queryKey: ['lichBaoDuongList'] });
            } else if (baohongIdForQuery) {
                queryClient.invalidateQueries({ queryKey: ['baotriLogs', { baohong_id: baohongIdForQuery }] });
                queryClient.invalidateQueries({ queryKey: ['assignedBaoHong'] });
                queryClient.invalidateQueries({ queryKey: ['baoHongList'] });
            }

            // 2. Invalidate query lấy log theo ID thiết bị (nếu có và nếu modal có thể đang mở theo ID này)
            if (thongtinthietbiIdForQuery) {
                queryClient.invalidateQueries({ queryKey: ['baotriLogs', { thongtinthietbi_id: thongtinthietbiIdForQuery }] });
                queryClient.invalidateQueries({ queryKey: ['thongTinThietBi', thongtinthietbiIdForQuery] });
                queryClient.invalidateQueries({ queryKey: ['taiSanList'] });
            }
            onClose(); // Đóng form sau khi thành công
        },
        onError: (err) => {
            setError(`Lỗi: ${err.response?.data?.error || err.message}`);
            setUploading(false);
        },
    });

    // --- Hàm xử lý file ---
    const handleFileChange = useCallback((e, setFilesFunc, setPreviewsFunc, currentFiles, maxFiles = 5) => {
         const files = Array.from(e.target.files); const currentLength = Array.isArray(currentFiles) ? currentFiles.length : 0; if (files.length + currentLength > maxFiles) { toast.error(`Chỉ được tải lên tối đa ${maxFiles} ảnh.`); e.target.value = null; return; } const addedFiles = []; files.forEach(file => { if (file.size > 10 * 1024 * 1024) { toast.error(`File "${file.name}" quá lớn (tối đa 10MB).`); return; } if (!file.type.startsWith('image/') && !file.type.includes('pdf')) { toast.warn(`File "${file.name}" không phải định dạng ảnh hoặc PDF được hỗ trợ.`); return; } addedFiles.push(file); const reader = new FileReader(); reader.onloadend = () => { setPreviewsFunc(prevPreviews => [...(Array.isArray(prevPreviews) ? prevPreviews : []), { name: file.name, url: reader.result }]); }; reader.onerror = () => { toast.error(`Lỗi đọc file ${file.name}`); }; reader.readAsDataURL(file); }); if (addedFiles.length > 0) { setFilesFunc(prevFiles => [...(Array.isArray(prevFiles) ? prevFiles : []), ...addedFiles]); } setError(''); e.target.value = null;
    }, []);
    const removePreview = useCallback((fileName, setFilesFunc, setPreviewsFunc) => { setFilesFunc(prev => Array.isArray(prev) ? prev.filter(file => file.name !== fileName) : []); setPreviewsFunc(prev => Array.isArray(prev) ? prev.filter(preview => preview.name !== fileName) : []); }, []);

    // --- Hàm Submit ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!hoatdong || !ketQuaXuLy || !phuongAnXuLy) { setError('Vui lòng nhập hoạt động, chọn kết quả xử lý và phương án xử lý.'); return; }
        if (phuongAnXuLy === 'Khác' && !phuongAnKhacChiTiet.trim()) { setError("Vui lòng nhập chi tiết cho phương án xử lý 'Khác'."); return; }
        if (suDungVatTu && (!ghiChuVatTu.trim() || invoiceFiles.length === 0)) { setError('Khi sử dụng vật tư, vui lòng nhập chi tiết và tải lên ảnh hóa đơn.'); return; }
        if (isImageRequired && damageFiles.length === 0) { setError('Vui lòng tải lên ít nhất 1 ảnh xác nhận tình trạng.'); return; }
         if (phuongAnXuLy === 'Bảo hành' && ketQuaXuLy === 'Đã gửi bảo hành' && !ngayDuKienTra) { setError('Vui lòng nhập ngày dự kiến trả khi gửi bảo hành.'); return; }


        setUploading(true);
        let uploadedInvoiceUrls = [];
        let uploadedDamageUrls = [];

        try {
            // Upload ảnh
            if (suDungVatTu && invoiceFiles.length > 0) {
                uploadedInvoiceUrls = await uploadInvoiceImagesAPI(invoiceFiles);
            }
            if (damageFiles.length > 0) {
                uploadedDamageUrls = await uploadInvoiceImagesAPI(damageFiles);
            }

            // *** PAYLOAD ĐÃ SỬA LỖI ***
            const payload = {
                baohong_id: isMaintenance ? null : taskId, // Chính xác
                lichbaoduong_id: isMaintenance ? taskId : null, // Chính xác
                thongtinthietbi_id: taskInfo.thongtinthietbi_id || null,
                phong_id: taskInfo.phong_id,
                hoatdong: hoatdong.trim(),
                ketQuaXuLy,
                phuongAnXuLy,
                phuongAnKhacChiTiet: phuongAnXuLy === 'Khác' ? phuongAnKhacChiTiet.trim() : null,
                suDungVatTu,
                ghiChuVatTu: suDungVatTu ? ghiChuVatTu.trim() : null,
                chiPhi: suDungVatTu && chiPhi ? parseInt(chiPhi) : null,
                hinhAnhHoaDonUrls: uploadedInvoiceUrls,
                hinhAnhHongHocUrls: uploadedDamageUrls,
                ngayDuKienTra: (phuongAnXuLy === 'Bảo hành' && ketQuaXuLy === 'Đã gửi bảo hành') ? ngayDuKienTra || null : null
            };

            // *** THÊM DEBUG LOG ***
            console.log("DEBUG: FormLogBaoTri Submitting Payload:");
            console.log(" - isMaintenance:", isMaintenance);
            console.log(" - taskId:", taskId);
            console.log(" - Payload sent:", JSON.stringify(payload, null, 2)); // In ra payload chi tiết

            createLogMutation.mutate(payload);

        } catch (uploadErr) {
            console.error("Lỗi upload ảnh:", uploadErr);
            setError(`Lỗi upload ảnh: ${uploadErr.response?.data?.error || uploadErr.message}`);
            setUploading(false); // Dừng uploading nếu lỗi upload
        }
    };

    // --- Lọc options cho Kết quả xử lý ---
    const availableKetQuaOptions = useMemo(() => {
        const baseOptions = [ { value: "Đã sửa chữa xong", label: "Đã sửa chữa xong" }, { value: "Đã gửi bảo hành", label: "Đã gửi bảo hành" }, { value: "Đã nhận từ bảo hành", label: "Đã nhận từ bảo hành" }, { value: "Đề xuất thanh lý", label: "Đề xuất thanh lý" }, { value: "Không tìm thấy lỗi / Không cần xử lý", label: "Không tìm thấy lỗi / Không cần xử lý" } ];
        if (phuongAnXuLy === 'Bảo hành') { if (taskInfo?.trangThaiHienTai === 'Chờ Hoàn Tất Bảo Hành') { return baseOptions.filter(opt => opt.value === 'Đã nhận từ bảo hành'); } return baseOptions.filter(opt => opt.value === 'Đã gửi bảo hành'); }
        else if (phuongAnXuLy === 'Bàn Giao Cho Bộ Phận Khác') { return baseOptions.filter(opt => opt.value === 'Đã sửa chữa xong'); }
        else if (phuongAnXuLy === 'Tự Sửa Chữa') { return baseOptions.filter(opt => ['Đã sửa chữa xong', 'Đề xuất thanh lý', 'Không tìm thấy lỗi / Không cần xử lý'].includes(opt.value)); }
        else if (phuongAnXuLy === 'Khác') { return baseOptions.filter(opt => ['Đã sửa chữa xong', 'Đề xuất thanh lý', 'Không tìm thấy lỗi / Không cần xử lý'].includes(opt.value)); }
        return baseOptions.filter(opt => !['Đã gửi bảo hành', 'Đã nhận từ bảo hành', 'Chuyển cho bộ phận khác'].includes(opt.value));
    }, [phuongAnXuLy, taskInfo?.trangThaiHienTai]);

    return (
        // --- Phần JSX (giữ nguyên cấu trúc, chỉ cập nhật nhãn/placeholder) ---
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="w-full max-w-2xl p-6 bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto animate-modal-scale-in">
                {/* Tiêu đề và nút đóng */}
                 <div className="flex items-center justify-between pb-3 mb-4 border-b">
                     <h2 className="text-xl font-semibold">Ghi nhận Hoạt động {taskTypeLabel}</h2>
                     <button onClick={onClose} className="text-gray-500 hover:text-gray-700"> <FaTimesCircle size={24} /> </button>
                 </div>

                {/* Thông tin task gốc */}
                <div className="p-3 mb-4 text-sm border rounded-md bg-gray-50">
                     <p><strong>Phòng:</strong> {taskInfo.phong_name}</p>
                     {taskInfo.tenThietBi && <p><strong>Thiết bị:</strong> {taskInfo.tenThietBi} (MDD: {taskInfo.thongtinthietbi_id})</p>}
                     <p><strong>Mô tả {isMaintenance ? 'công việc' : 'hỏng'}:</strong> {taskInfo.moTaCongViec || "Không có"}</p>
                     {!isMaintenance && taskInfo.tinhTrangThietBi && ( <p><strong>Tình trạng TB hiện tại:</strong> <span className='font-medium'>{getTinhTrangLabel(taskInfo.tinhTrangThietBi)}</span></p> )}
                    {taskInfo.ghiChuAdmin && <p className="mt-1 text-red-600"><strong>Admin yêu cầu:</strong> {taskInfo.ghiChuAdmin}</p>}
                </div>

                {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

                 <form onSubmit={handleSubmit} className="space-y-4">
                     {/* Phương án xử lý */}
                     <div>
                         <label className="block mb-1 text-sm font-medium text-gray-700">Phương án xử lý <span className="text-red-500">*</span></label>
                         <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                            <label className={`flex items-center text-sm ${!canBaoHanh ? 'text-gray-400 cursor-not-allowed' : ''}`}>
                                 <input type="radio" name="phuongAnXuLy" value="Bảo hành" checked={phuongAnXuLy === 'Bảo hành'} onChange={(e) => { setPhuongAnXuLy(e.target.value); setKetQuaXuLy(''); }} className="mr-1.5" required disabled={!canBaoHanh} title={!canBaoHanh ? 'Thiết bị đã hết bảo hành hoặc không áp dụng' : ''} />
                                 Bảo hành {!canBaoHanh && '(Không áp dụng)'}
                            </label>
                            {['Tự Sửa Chữa', 'Bàn Giao Cho Bộ Phận Khác', 'Khác'].map(option => ( <label key={option} className="flex items-center text-sm"> <input type="radio" name="phuongAnXuLy" value={option} checked={phuongAnXuLy === option} onChange={(e) => { setPhuongAnXuLy(e.target.value); setKetQuaXuLy(''); }} className="mr-1.5" required /> {option} </label> ))}
                         </div>
                         {phuongAnXuLy === 'Khác' && ( <div className='mt-2'> <label htmlFor="phuongAnKhacChiTiet" className="block mb-1 text-xs font-medium text-gray-600">Chi tiết phương án khác: <span className="text-red-500">*</span></label> <input type="text" id="phuongAnKhacChiTiet" value={phuongAnKhacChiTiet} onChange={(e) => setPhuongAnKhacChiTiet(e.target.value)} className="w-full p-2 text-sm border rounded-md" required placeholder="Mô tả dịch vụ thuê, lý do thanh lý, tại sao không lỗi..." /> </div> )}
                    </div>

                     {/* Ngày dự kiến trả */}
                     {phuongAnXuLy === 'Bảo hành' && ketQuaXuLy === 'Đã gửi bảo hành' && (
                        <div>
                            <label htmlFor="ngayDuKienTra" className="block mb-1 text-sm font-medium text-gray-700">Ngày dự kiến trả (từ nơi BH): <span className="text-red-500">*</span></label>
                             <input type="date" id="ngayDuKienTra" value={ngayDuKienTra} onChange={(e) => setNgayDuKienTra(e.target.value)} className="w-full p-2 text-sm border rounded-md" min={moment().format('YYYY-MM-DD')} required />
                        </div>
                    )}

                     {/* Kết quả xử lý */}
                     <div>
                         <label className="block mb-1 text-sm font-medium text-gray-700">Kết quả xử lý <span className="text-red-500">*</span></label>
                         <select value={ketQuaXuLy} onChange={(e) => setKetQuaXuLy(e.target.value)} className="w-full p-2 bg-white border rounded-md" required disabled={!phuongAnXuLy}>
                             <option value="">-- Chọn kết quả --</option>
                             {availableKetQuaOptions.map(opt => ( <option key={opt.value} value={opt.value}>{opt.label}</option> ))}
                         </select>
                    </div>

                    {/* Ảnh xác nhận */}
                    <div>
                         <label htmlFor="damage-upload" className="block mb-1 text-sm font-medium text-gray-700">
                             Ảnh {isMaintenance ? 'Công việc / Thiết bị' : 'Xác nhận Tình trạng'} (Tối đa 2)
                             {isImageRequired && <span className="ml-1 text-red-500"> *</span>}
                         </label>
                         <input type="file" id="damage-upload" multiple accept="image/*" onChange={(e) => handleFileChange(e, setDamageFiles, setDamagePreviews, damageFiles, 2)} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100" />
                        <div className="flex flex-wrap gap-2 mt-2"> {damagePreviews.map((preview, index) => ( <div key={index} className="relative"> <img src={preview.url} alt={`Preview ${preview.name}`} className="object-cover w-20 h-20 border rounded" /> <button type="button" onClick={() => removePreview(preview.name, setDamageFiles, setDamagePreviews)} className="absolute top-0 right-0 p-0.5 text-white bg-red-500 rounded-full text-xs">X</button> </div> ))} </div>
                         {isImageRequired && damageFiles.length === 0 && ( <p className="mr-4 text-xs text-red-500">Cần tải ảnh cho kết quả xử lý này.</p> )}
                    </div>

                    {/* Sử dụng Vật tư */}
                     <div>
                         <label className="block mb-1 text-sm font-medium text-gray-700">Sử dụng Vật tư/Dịch vụ? <span className="text-red-500">*</span></label>
                         <div className="flex gap-4"> <label className="flex items-center"> <input type="radio" name="suDungVatTu" checked={suDungVatTu === false} onChange={() => setSuDungVatTu(false)} className="mr-1" /> Không </label> <label className="flex items-center"> <input type="radio" name="suDungVatTu" checked={suDungVatTu === true} onChange={() => setSuDungVatTu(true)} className="mr-1" /> Có </label> </div>
                     </div>
                     {suDungVatTu && ( <> <div> <label htmlFor="chiPhi" className="block mb-1 text-sm font-medium text-gray-700">Chi phí (Nếu có)</label> <input type="number" id="chiPhi" value={chiPhi} onChange={(e) => setChiPhi(e.target.value)} className="w-full p-2 border rounded-md" min="0" step="5000" /> </div> <div> <label htmlFor="ghiChuVatTu" className="block mb-1 text-sm font-medium text-gray-700">Chi tiết Vật tư/Dịch vụ <span className="text-red-500">*</span></label> <textarea id="ghiChuVatTu" value={ghiChuVatTu} onChange={(e) => setGhiChuVatTu(e.target.value)} className="w-full p-2 border rounded-md min-h-[80px]" required={suDungVatTu} placeholder="Ghi rõ tên vật tư, số lượng, giá dịch vụ thuê ngoài..." /> </div> <div> <label htmlFor="invoice-upload" className="block mb-1 text-sm font-medium text-gray-700">Ảnh Hóa đơn/Chứng từ <span className="text-red-500">*</span></label> <input type="file" id="invoice-upload" multiple accept="image/*,application/pdf" onChange={(e) => handleFileChange(e, setInvoiceFiles, setInvoicePreviews, invoiceFiles, 5)} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" required={suDungVatTu && invoiceFiles.length === 0} /> <div className="flex flex-wrap gap-2 mt-2"> {invoicePreviews.map((preview, index) => ( <div key={index} className="relative"> {preview.url.startsWith('data:image') ? (<img src={preview.url} alt={preview.name} className="object-cover w-20 h-20 border rounded" />) : (<div className="flex items-center justify-center w-20 h-20 text-xs text-center text-gray-500 border rounded bg-gray-50"><FaPaperclip className="mb-1 mr-1" /> {preview.name}</div>)} <button type="button" onClick={() => removePreview(preview.name, setInvoiceFiles, setInvoicePreviews)} className="absolute top-0 right-0 p-0.5 text-white bg-red-500 rounded-full text-xs leading-none">X</button> </div> ))} </div> </div> </> )}

                    {/* Hoạt động đã thực hiện */}
                    <div>
                        <label htmlFor="hoatdong" className="block mb-1 text-sm font-medium text-gray-700">Hoạt động đã thực hiện <span className="text-red-500">*</span></label>
                        <textarea
                            id="hoatdong" value={hoatdong} onChange={(e) => setHoatdong(e.target.value)}
                            className="w-full p-2 border rounded-md min-h-[100px]" required
                            placeholder={isMaintenance ? "Ghi rõ các bước kiểm tra, vệ sinh, thay thế (nếu có)..." : "Ghi rõ trình tự giải quyết sự cố theo từng bước..."}
                        />
                    </div>

                    {/* Nút Submit */}
                     <div className="flex justify-end gap-3 pt-4">
                         <button type="button" onClick={onClose} disabled={createLogMutation.isPending || uploading} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50">Hủy</button>
                         <button type="submit" disabled={uploading || createLogMutation.isPending} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">
                             {(uploading || createLogMutation.isPending) && <ArrowPathIcon className="inline w-4 h-4 mr-2 animate-spin" />}
                             {uploading ? 'Đang xử lý...' : (createLogMutation.isPending ? 'Đang lưu...' : 'Lưu hoạt động')}
                         </button>
                     </div>
                 </form>
                 <style>{` @keyframes modal-scale-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } } .animate-modal-scale-in { animation: modal-scale-in 0.2s ease-out forwards; } `}</style>
            </div>
        </div>
    );
};

export default FormLogBaoTri;