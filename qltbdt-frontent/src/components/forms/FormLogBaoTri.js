import React, { useState, useMemo, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FaTimesCircle, FaPaperclip } from 'react-icons/fa';
import { createLogBaoTriAPI, uploadInvoiceImagesAPI as uploadImagesAPI } from '../../api';
import { toast } from 'react-toastify';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import moment from 'moment';

const FormLogBaoTri = ({ baoHongInfo, onClose }) => {
    const [hoatdong, setHoatdong] = useState('');
    const [ketQuaXuLy, setKetQuaXuLy] = useState('');
    const [suDungVatTu, setSuDungVatTu] = useState(false);
    const [ghiChuVatTu, setGhiChuVatTu] = useState('');
    const [chiPhi, setChiPhi] = useState('');
    const [invoiceFiles, setInvoiceFiles] = useState([]); // Lưu trữ File objects
    const [invoicePreviews, setInvoicePreviews] = useState([]); // Lưu trữ data URLs để xem trước
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [phuongAnXuLy, setPhuongAnXuLy] = useState(''); // State cho phương án xử lý
    const [phuongAnKhacChiTiet, setPhuongAnKhacChiTiet] = useState(''); // State cho chi tiết phương án khác
    const [damageFiles, setDamageFiles] = useState([]); // State cho file ảnh hỏng hóc
    const [damagePreviews, setDamagePreviews] = useState([]); // State cho preview ảnh hỏng hóc
    const [ngayDuKienTra, setNgayDuKienTra] = useState('');

    const queryClient = useQueryClient();

    const tinhTrangThietBiHienTai = baoHongInfo?.tinhTrangThietBi;

    const canBaoHanh = tinhTrangThietBiHienTai !== 'het_bao_hanh';

    const isImageRequired = useMemo(() => {
        return (
            ketQuaXuLy === 'Không tìm thấy lỗi / Không cần xử lý' ||
            (
                (phuongAnXuLy === 'Tự Sửa Chữa' || phuongAnXuLy === 'Khác') &&
                (ketQuaXuLy === 'Đã sửa chữa xong' || ketQuaXuLy === 'Đề xuất thanh lý')
            )
        );
    }, [ketQuaXuLy, phuongAnXuLy]);    

    // Reset phương án nếu không hợp lệ khi tình trạng thiết bị thay đổi
    useEffect(() => {
        if (!canBaoHanh && phuongAnXuLy === 'Bảo hành') {
            setPhuongAnXuLy(''); // Reset nếu đang chọn Bảo hành mà thiết bị hết hạn
        }
    }, [canBaoHanh, phuongAnXuLy]);

    const createLogMutation = useMutation({
        mutationFn: createLogBaoTriAPI,
        onSuccess: () => {
            toast.success('Ghi nhận hoạt động thành công!');
            queryClient.invalidateQueries({ queryKey: ['baotriMyTasks'] });
            queryClient.invalidateQueries({ queryKey: ['baohongLog', baoHongInfo.id] });
            queryClient.invalidateQueries({ queryKey: ['baoHongList'] });
            if (baoHongInfo.thongtinthietbi_id) {
                queryClient.invalidateQueries({ queryKey: ['thongTinThietBi', baoHongInfo.thongtinthietbi_id] });
                queryClient.invalidateQueries({ queryKey: ['taiSanList'] });
            }
            onClose();
        },
        onError: (err) => {
            setError(`Lỗi: ${err.response?.data?.error || err.message}`);
            setUploading(false);
        },
    });

    // --- Hàm xử lý upload file  dùng chung ---
    const handleFileChange = (e, setFilesFunc, setPreviewsFunc, currentFiles, maxFiles = 5) => {
        const files = Array.from(e.target.files);
        const currentLength = Array.isArray(currentFiles) ? currentFiles.length : 0;

        if (files.length + currentLength > maxFiles) {
            toast.error(`Chỉ được tải lên tối đa ${maxFiles} ảnh.`);
            e.target.value = null;
            return;
        }

        const addedFiles = [];

        files.forEach(file => {
            if (file.size > 10 * 1024 * 1024) {
                toast.error(`File "${file.name}" quá lớn (tối đa 10MB).`);
                return;
            }
            if (!file.type.startsWith('image/') && !file.type.includes('pdf')) {
                toast.warn(`File "${file.name}" không phải định dạng ảnh hoặc PDF được hỗ trợ.`);
                return;
            }

            addedFiles.push(file);

            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewsFunc(prevPreviews => {
                    const currentPreviews = Array.isArray(prevPreviews) ? prevPreviews : [];
                    return [...currentPreviews, { name: file.name, url: reader.result }];
                });
            };
            reader.onerror = () => { toast.error(`Lỗi đọc file ${file.name}`); };
            reader.readAsDataURL(file);
        });

        if (addedFiles.length > 0) {
            setFilesFunc(prevFiles => [...(Array.isArray(prevFiles) ? prevFiles : []), ...addedFiles]);
        }

        setError('');
        e.target.value = null;
    };


    const removePreview = (fileName, setFilesFunc, setPreviewsFunc) => {
        setFilesFunc(prev => Array.isArray(prev) ? prev.filter(file => file.name !== fileName) : []);
        setPreviewsFunc(prev => Array.isArray(prev) ? prev.filter(preview => preview.name !== fileName) : []);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation cơ bản 
        if (!hoatdong || !ketQuaXuLy || !phuongAnXuLy) { setError('Vui lòng nhập hoạt động, chọn kết quả xử lý và phương án xử lý.'); return; }
        if (phuongAnXuLy === 'Khác' && !phuongAnKhacChiTiet.trim()) { setError("Vui lòng nhập chi tiết cho phương án xử lý 'Khác'."); return; }
        if (suDungVatTu && (!ghiChuVatTu.trim() || invoiceFiles.length === 0)) { setError('Khi sử dụng vật tư, vui lòng nhập chi tiết và tải lên ảnh hóa đơn.'); return; }
        if (phuongAnXuLy === 'Bảo hành' && ketQuaXuLy === 'Đã sửa chữa xong') {
            setError('Vui lòng chọn "Đã gửi bảo hành".');
            return;
        }

        if (isImageRequired && damageFiles.length === 0) {
            setError('Vui lòng tải lên ít nhất 1 ảnh xác nhận tình trạng.');
            return;
        }

        setUploading(true);
        let uploadedInvoiceUrls = [];
        let uploadedDamageUrls = [];

        try {
            // Upload ảnh
            if (suDungVatTu && invoiceFiles.length > 0) {
                uploadedInvoiceUrls = await uploadImagesAPI(invoiceFiles);
            }
            if (damageFiles.length > 0) { // Luôn thử upload damage files nếu có
                uploadedDamageUrls = await uploadImagesAPI(damageFiles);
            }

            // Gọi mutation tạo log
            createLogMutation.mutate({
                baohong_id: baoHongInfo.id,
                thongtinthietbi_id: baoHongInfo.thongtinthietbi_id || null,
                phong_id: baoHongInfo.phong_id,
                hoatdong: hoatdong.trim(), // Trim hoạt động
                ketQuaXuLy,
                phuongAnXuLy,
                phuongAnKhacChiTiet: phuongAnXuLy === 'Khác' ? phuongAnKhacChiTiet.trim() : null,
                suDungVatTu,
                ghiChuVatTu: suDungVatTu ? ghiChuVatTu.trim() : null,
                chiPhi: suDungVatTu && chiPhi ? parseInt(chiPhi) : null,
                hinhAnhHoaDonUrls: uploadedInvoiceUrls,
                hinhAnhHongHocUrls: uploadedDamageUrls, // Truyền URL ảnh damage/confirm
                ngayDuKienTra: (phuongAnXuLy === 'Bảo hành' && ketQuaXuLy === 'Đã gửi bảo hành') ? ngayDuKienTra || null : null
            });

        } catch (uploadErr) {
            console.error("Lỗi upload ảnh:", uploadErr);
            setError(`Lỗi upload ảnh: ${uploadErr.response?.data?.error || uploadErr.message}`);
            setUploading(false);
        }
    };

    // --- Lọc options cho Kết quả xử lý ---
    const availableKetQuaOptions = useMemo(() => {
        const options = [
            { value: "Đã sửa chữa xong", label: "Đã sửa chữa xong" },
            { value: "Đã gửi bảo hành", label: "Đã gửi bảo hành" },
            { value: "Đề xuất thanh lý", label: "Đề xuất thanh lý" },
            { value: "Không tìm thấy lỗi / Không cần xử lý", label: "Không tìm thấy lỗi / Không cần xử lý" },
            { value: "Chuyển cho bộ phận khác", label: "Chuyển cho bộ phận khác" }
        ];

        if (phuongAnXuLy === 'Bảo hành') {
            // Nếu là Bảo hành, chỉ cho chọn "Đã gửi bảo hành" hoặc "Không tìm thấy lỗi"
            return options.filter(opt => opt.value === 'Đã gửi bảo hành');
        } else if (phuongAnXuLy === 'Khác') {
            // Nếu Tự sửa/Khác, bỏ "Gửi BH" và "Chuyển BP"
            return options.filter(opt => opt.value !== 'Đã gửi bảo hành' && opt.value !== 'Chuyển cho bộ phận khác');
        } else if (phuongAnXuLy === 'Tự Sửa Chữa') {
            return options.filter(opt => opt.value === 'Đã sửa chữa xong');
        } else if (phuongAnXuLy === 'Bàn Giao Cho Bộ Phận Khác') {
            // Nếu Bàn giao, chỉ cho chọn "Chuyển cho bộ phận khác"
            return options.filter(opt => opt.value === 'Chuyển cho bộ phận khác');
        }
        // Nếu chưa chọn phương án, hoặc trường hợp khác, hiển thị giới hạn
        return options.filter(opt => opt.value !== 'Đã gửi bảo hành' && opt.value !== 'Chuyển cho bộ phận khác');

    }, [phuongAnXuLy]);

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="w-full max-w-2xl p-6 bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-3 mb-4 border-b">
                    <h2 className="text-xl font-semibold">Ghi nhận Hoạt động Bảo trì</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700"> <FaTimesCircle size={24} /> </button>
                </div>

                {/* Hiển thị thông tin báo hỏng gốc */}
                <div className="p-3 mb-4 text-sm border rounded-md bg-gray-50">
                    <p><strong>Phòng:</strong> {baoHongInfo.phong_name}</p>
                    {baoHongInfo.tenThietBi && <p><strong>Thiết bị:</strong> {baoHongInfo.tenThietBi} (MDD: {baoHongInfo.thongtinthietbi_id})</p>}
                    <p><strong>Mô tả hỏng:</strong> {baoHongInfo.moTa}</p>
                    {baoHongInfo.ghiChuAdmin && <p className="mt-1 text-red-600"><strong>Admin yêu cầu:</strong> {baoHongInfo.ghiChuAdmin}</p>}
                </div>

                {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Phương án xử lý */}
                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700">Phương án xử lý <span className="text-red-500">*</span></label>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                            <label className={`flex items-center text-sm ${!canBaoHanh ? 'text-gray-400 cursor-not-allowed' : ''}`}>
                                <input
                                    type="radio"
                                    name="phuongAnXuLy"
                                    value="Bảo hành"
                                    checked={phuongAnXuLy === 'Bảo hành'}
                                    onChange={(e) => { setPhuongAnXuLy(e.target.value); setKetQuaXuLy(''); }}
                                    className="mr-1.5"
                                    required
                                    disabled={!canBaoHanh}
                                    title={!canBaoHanh ? 'Thiết bị đã hết bảo hành' : ''}
                                /> Bảo hành {!canBaoHanh && '(Hết Bảo Hành)'}
                            </label>
                            {['Tự Sửa Chữa', 'Bàn Giao Cho Bộ Phận Khác', 'Khác'].map(option => (
                                <label key={option} className="flex items-center text-sm">
                                    <input type="radio" name="phuongAnXuLy" value={option} checked={phuongAnXuLy === option} onChange={(e) => { setPhuongAnXuLy(e.target.value); setKetQuaXuLy(''); /* Reset kết quả khi đổi PA */ }} className="mr-1.5" required /> {option}
                                </label>
                            ))}
                        </div>
                        {/* Input chi tiết khi chọn 'Khác' */}
                        {phuongAnXuLy === 'Khác' && (
                            <div className='mt-2'>
                                <label htmlFor="phuongAnKhacChiTiet" className="block mb-1 text-xs font-medium text-gray-600">Chi tiết phương án khác: <span className="text-red-500">*</span></label>
                                <input type="text" id="phuongAnKhacChiTiet" value={phuongAnKhacChiTiet} onChange={(e) => setPhuongAnKhacChiTiet(e.target.value)} className="w-full p-2 text-sm border rounded-md" required placeholder="Mô tả dịch vụ thuê, hoặc tại sao nên thanh lý, hoặc tại sao không thấy lỗi..." />
                            </div>
                        )}
                    </div>

                    {phuongAnXuLy === 'Bảo hành' && (
                        <div>
                            <label htmlFor="ngayDuKienTra" className="block mb-1 text-sm font-medium text-gray-700">Ngày dự kiến trả (từ nơi BH):</label>
                            <input
                                type="date"
                                id="ngayDuKienTra"
                                value={ngayDuKienTra}
                                onChange={(e) => setNgayDuKienTra(e.target.value)}
                                className="w-full p-2 text-sm border rounded-md"
                                min={moment().format('YYYY-MM-DD')}
                            />
                        </div>
                    )}

                    {/* Kết quả xử lý */}
                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700">Kết quả xử lý <span className="text-red-500">*</span></label>
                        <select value={ketQuaXuLy} onChange={(e) => setKetQuaXuLy(e.target.value)} className="w-full p-2 bg-white border rounded-md" required disabled={!phuongAnXuLy}>
                            <option value="">-- Chọn kết quả --</option>
                            {availableKetQuaOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Xác nhận hỏng hóc bằng hình ảnh */}
                    <div>
                        <label htmlFor="damage-upload" className="block mb-1 text-sm font-medium text-gray-700">
                            Ảnh xác nhận tình trạng (Tối đa 2 ảnh)
                            {isImageRequired && <span className="ml-1 text-red-500"> *</span>}
                        </label>
                        {/* Hiển thị cảnh báo nếu ảnh bắt buộc mà chưa có */}
                        <input
                            type="file" id="damage-upload" multiple accept="image/*"
                            onChange={(e) => handleFileChange(e, setDamageFiles, setDamagePreviews, damageFiles, 2)}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                        />
                        {/* Preview ảnh */}
                        <div className="flex flex-wrap gap-2 mt-2">
                            {damagePreviews.map((preview, index) => (
                                <div key={index} className="relative">
                                    <img src={preview.url} alt={`Preview ${preview.name}`} className="object-cover w-20 h-20 border rounded" />
                                    <button type="button" onClick={() => removePreview(preview.name, setDamageFiles, setDamagePreviews)} className="absolute top-0 right-0 p-0.5 text-white bg-red-500 rounded-full text-xs">X</button>
                                </div>
                            ))}
                        </div>
                        {isImageRequired && damageFiles.length === 0 && (
                            <p className="mr-4 text-xs text-red-500">Cần tải ảnh xác nhận cho kết quả xử lý này.</p>
                        )}
                    </div>

                    {/* Sử dụng Vật tư? */}
                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700">Sử dụng Vật tư/Dịch vụ? <span className="text-red-500">*</span></label>
                        <div className="flex gap-4">
                            <label className="flex items-center">
                                <input type="radio" name="suDungVatTu" checked={suDungVatTu === false} onChange={() => setSuDungVatTu(false)} className="mr-1" /> Không
                            </label>
                            <label className="flex items-center">
                                <input type="radio" name="suDungVatTu" checked={suDungVatTu === true} onChange={() => setSuDungVatTu(true)} className="mr-1" /> Có
                            </label>
                        </div>
                    </div>

                    {/* Chi tiết Vật tư (hiện khi suDungVatTu là true) */}
                    {suDungVatTu && (
                        <>
                            <div>
                                <label htmlFor="chiPhi" className="block mb-1 text-sm font-medium text-gray-700">Chi phí (Nếu có)</label>
                                <input type="number" id="chiPhi" value={chiPhi} onChange={(e) => setChiPhi(e.target.value)} className="w-full p-2 border rounded-md" min="0" step="5000" />
                            </div>

                            <div>
                                <label htmlFor="ghiChuVatTu" className="block mb-1 text-sm font-medium text-gray-700">Chi tiết Vật tư/Dịch vụ <span className="text-red-500">*</span></label>
                                <textarea
                                    id="ghiChuVatTu" value={ghiChuVatTu} onChange={(e) => setGhiChuVatTu(e.target.value)}
                                    className="w-full p-2 border rounded-md min-h-[80px]" required={suDungVatTu}
                                    placeholder="Ghi rõ tên vật tư, số lượng, giá dịch vụ thuê ngoài..."
                                />
                            </div>

                            {/* Upload Hóa đơn */}
                            <div>
                                <label htmlFor="invoice-upload" className="block mb-1 text-sm font-medium text-gray-700">Ảnh Hóa đơn/Chứng từ của Vật tư/Dịch vụ <span className="text-red-500">*</span></label>
                                <input
                                    type="file" id="invoice-upload" multiple accept="image/*,application/pdf"
                                    onChange={(e) => handleFileChange(e, setInvoiceFiles, setInvoicePreviews, invoiceFiles, 5)}
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    required={suDungVatTu && invoiceFiles.length === 0}
                                />
                                {/* Xem trước ảnh */}
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {invoicePreviews.map((preview, index) => (
                                        <div key={index} className="relative">
                                            {preview.url.startsWith('data:image') ? (<img src={preview.url} alt={preview.name} className="object-cover w-20 h-20 border rounded" />) : (<div className="flex items-center justify-center w-20 h-20 text-xs text-center text-gray-500 border rounded bg-gray-50"><FaPaperclip className="mb-1 mr-1" /> {preview.name}</div>)}
                                            <button type="button" onClick={() => removePreview(preview.name, setInvoiceFiles, setInvoicePreviews)} className="absolute top-0 right-0 p-0.5 text-white bg-red-500 rounded-full text-xs leading-none">X</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Hoạt động đã thực hiện */}
                    <div>
                        <label htmlFor="hoatdong" className="block mb-1 text-sm font-medium text-gray-700">Hoạt động đã thực hiện <span className="text-red-500">*</span></label>
                        <textarea
                            id="hoatdong" value={hoatdong} onChange={(e) => setHoatdong(e.target.value)}
                            className="w-full p-2 border rounded-md min-h-[100px]" required
                            placeholder="Ghi rõ trình tự giải quyết công việc theo từng bước..."
                        />
                    </div>

                    {/* Nút Submit */}
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Hủy</button>
                        <button type="submit" disabled={uploading || createLogMutation.isPending} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">
                            {(uploading || createLogMutation.isPending) && <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />}
                            {uploading ? 'Đang xử lý...' : (createLogMutation.isPending ? 'Đang lưu...' : 'Lưu hoạt động')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FormLogBaoTri;