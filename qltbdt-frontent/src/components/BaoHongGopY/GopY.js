import React, { useState } from 'react'; // Thêm useContext
import { MdDescription } from 'react-icons/md';
import { toast } from 'react-toastify';
import { createGopYAPI } from '../../api'; // Import API
import { useAuth } from '../../context/AuthProvider'; // Import useAuth

const GopY = () => {
    const { user: currentUser } = useAuth(); // Lấy user từ context
    const [suggestionForm, setSuggestionForm] = useState({
        loaiGopY: '',
        noiDung: '',
        isAnonymous: false,
    });
    const [senderName, setSenderName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const suggestionCategories = [
        'Tính năng',
        'Trải nghiệm người dùng',
        'Hiệu năng / tốc độ',
        'Quy trình sử dụng',
        'Khác',
    ];

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSuggestionForm((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
        // Reset senderName nếu check ẩn danh
        if (name === 'isAnonymous' && checked) {
            setSenderName('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        // --- Validation ---
        if (!suggestionForm.loaiGopY) {
            toast.error('Vui lòng chọn loại góp ý.');
            setIsSubmitting(false);
            return;
        }
        if (!suggestionForm.noiDung || suggestionForm.noiDung.trim() === '') {
            toast.error('Vui lòng nhập nội dung góp ý.');
            setIsSubmitting(false);
            return;
        }
        if (suggestionForm.loaiGopY === 'Khác' && (!suggestionForm.noiDung || suggestionForm.noiDung.trim() === '')) {
            toast.error("Nội dung chi tiết là bắt buộc khi chọn loại góp ý 'Khác'.");
            setIsSubmitting(false);
            return;
        }
        const isNotLoggedIn = !currentUser;
        if (!suggestionForm.isAnonymous && isNotLoggedIn && (!senderName || senderName.trim() === '')) {
            toast.error('Vui lòng nhập tên người gửi khi không chọn ẩn danh.');
            setIsSubmitting(false);
            return;
        }
        // --- End Validation ---

        const payload = {
            loaiGopY: suggestionForm.loaiGopY,
            noiDung: suggestionForm.noiDung.trim(),
            isAnonymous: suggestionForm.isAnonymous,
            hoTenNguoiGui: (!suggestionForm.isAnonymous && isNotLoggedIn) ? senderName.trim() : undefined,
            user_id: (!suggestionForm.isAnonymous && currentUser) ? currentUser.id : undefined,

        };

        // Xóa các trường undefined khỏi payload trước khi gửi
        Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);


        try {
            const result = await createGopYAPI(payload);
            toast.success(result.message || "Gửi góp ý thành công!");
            // Reset form
            setSuggestionForm({ loaiGopY: '', noiDung: '', isAnonymous: false });
            setSenderName('');
        } catch (error) {
            // toast.error đã được gọi trong interceptor của api.js
            console.error("Submit error:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const showSenderNameInput = !suggestionForm.isAnonymous && !currentUser;

    return (
        <div className="p-4 bg-white rounded-lg shadow-lg">
            <h2 className="flex items-center pb-2 mb-6 text-xl font-semibold border-b text-card-foreground"> {/* Thêm pb-2 */}
                <MdDescription className="mr-2 text-blue-700" />
                Gửi Góp Ý Cải Thiện Hệ Thống
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="loaiGopY" className="block mb-1 text-sm font-medium text-card-foreground">
                        Loại Góp Ý <span className="text-red-500">*</span>
                    </label>
                    <select
                        id="loaiGopY"
                        name="loaiGopY"
                        value={suggestionForm.loaiGopY}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border rounded-md border-input bg-background focus:ring-2 focus:ring-ring" // Thêm bg-background
                        required
                    >
                        <option value="">-- Chọn Loại Góp Ý --</option>
                        {suggestionCategories.map((cat) => (
                            <option key={cat} value={cat}>
                                {cat}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label htmlFor="noiDung" className="block mb-1 text-sm font-medium text-card-foreground">
                        Nội Dung Chi Tiết <span className="text-red-500">*</span>
                        {suggestionForm.loaiGopY === 'Khác' && <span className="text-red-500"> (Bắt buộc)</span>}
                    </label>
                    <textarea
                        id="noiDung"
                        name="noiDung"
                        value={suggestionForm.noiDung}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-input rounded-md focus:ring-2 focus:ring-ring min-h-[100px] bg-background" // Thêm bg-background
                        placeholder="Mô tả chi tiết góp ý của bạn..."
                        maxLength={1000} 
                        required
                    />
                    <p className="mt-1 text-sm text-muted-foreground">
                        {suggestionForm.noiDung.length}/1000 Ký Tự
                    </p>
                </div>

                {/* Ô nhập Tên Người Gửi (chỉ hiện khi cần) */}
                {showSenderNameInput && (
                    <div>
                        <label htmlFor="senderName" className="block mb-1 text-sm font-medium text-card-foreground">
                            Họ Tên Người Gửi <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="senderName"
                            name="senderName"
                            value={senderName}
                            onChange={(e) => setSenderName(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md border-input bg-background focus:ring-2 focus:ring-ring"
                            placeholder="Nhập họ tên của bạn"
                            required={showSenderNameInput} // Bắt buộc nếu hiển thị
                        />
                    </div>
                )}


                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="isAnonymous"
                        name="isAnonymous" // Thêm name
                        checked={suggestionForm.isAnonymous}
                        onChange={handleChange}
                        className="w-4 h-4 rounded text-primary border-input focus:ring-ring"
                    />
                    <label htmlFor="isAnonymous" className="block ml-2 text-sm text-card-foreground">
                        Gửi Góp Ý Ẩn Danh (Tên của bạn sẽ là "Ẩn Danh")
                    </label>
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full px-4 py-2 font-semibold text-white transition-colors rounded-md bg-primary hover:bg-primary/90 disabled:opacity-50" // Sử dụng màu primary
                >
                    {isSubmitting ? 'Đang gửi...' : 'Gửi Góp Ý'}
                </button>
            </form>
        </div>
    );
};

export default GopY;