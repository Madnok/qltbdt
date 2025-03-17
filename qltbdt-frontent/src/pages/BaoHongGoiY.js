import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUpload, FaCheckCircle } from "react-icons/fa";
import { MdWarning, MdDescription } from "react-icons/md";
import Footer from "../components/layout/Footer";

const Header = () => {
    const navigate = useNavigate();
    return (
        <header className="px-6 py-4 text-gray-300 bg-gray-900 shadow-lg">
            <div className="flex items-center justify-between max-w-6xl mx-auto">
                <div className="flex items-center space-x-4">
                    <h1 className="text-2xl font-bold">Quản Lý Cơ Sở Vật Chất</h1>
                </div>
                <nav>
                    <ul className="flex space-x-6">
                        <li>
                            <button
                                onClick={() => navigate("/login")}
                                className="transition-colors hover:text-accent"
                            >
                                Đăng Nhập
                            </button>
                        </li>
                    </ul>
                </nav>
            </div>
        </header>
    );
};

const BaoHongGoiY = () => {
    const [damageForm, setDamageForm] = useState({
        location: "",
        damageType: "",
        severity: "",
        description: "",
        image: null
    });

    const [suggestionForm, setSuggestionForm] = useState({
        category: "",
        description: "",
        isAnonymous: false
    });

    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [errors, setErrors] = useState({});

    const damageTypes = ["Kết Cấu", "Hệ Thống Điện", "Hệ Thống Nước", "Các Loại Thiết Bị", "Khác"];
    const locations = ["Sảnh chính", "Phòng hội nghị", "Nhà ăn", "Bãi đỗ xe", "Phòng vệ sinh"];
    const suggestionCategories = ["Cải Thiện CSVC", "Nâng Cao Quy Trình", "Tối Ưu Hóa Chi Phí", "Khác"];

    const validateDamageForm = () => {
        const newErrors = {};
        if (!damageForm.location) newErrors.location = "Vui Lòng Chọn Vị Trí";
        if (damageForm.description.length < 10) newErrors.description = "Mô Tả Phải Có Ít Nhất 10 Ký Tự";
        if (damageForm.image && !["image/jpeg", "image/png"].includes(damageForm.image.type)) {
            newErrors.image = "Chỉ Chấp Nhận Hình JPEG hoặc PNG!!";
        }
        return newErrors;
    };

    const validateSuggestionForm = () => {
        const newErrors = {};
        if (!suggestionForm.category) newErrors.category = "Vui Lòng Chọn Danh Mục";
        if (suggestionForm.description.length < 10) newErrors.description = "Mô Tả Phải Có Ít Nhất 10 Ký Tự";
        return newErrors;
    };

    const handleDamageSubmit = async (e) => {
        e.preventDefault();
        const formErrors = validateDamageForm();
        if (Object.keys(formErrors).length > 0) {
            setErrors(formErrors);
            return;
        }

        setLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1500));
            setShowSuccess(true);
            setDamageForm({ location: "", damageType: "", severity: "", description: "", image: null });
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (error) {
            console.error("Submission failed:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSuggestionSubmit = async (e) => {
        e.preventDefault();
        const formErrors = validateSuggestionForm();
        if (Object.keys(formErrors).length > 0) {
            setErrors(formErrors);
            return;
        }

        setLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1500));
            setShowSuccess(true);
            setSuggestionForm({ category: "", description: "", isAnonymous: false });
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (error) {
            console.error("Submission failed:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-100">
            <Header />
            <div className="flex-grow p-6 font-inter">
                <div className="max-w-6xl mx-auto space-y-8">

                    <div className="grid gap-8 md:grid-cols-2">
                        {/* Báo Hỏng  */}
                        <div className="p-6 bg-white rounded-lg shadow-lg">
                            <h2 className="flex items-center mb-6 text-xl font-semibold text-card-foreground">
                                <MdWarning className="mr-2 text-destructive" />
                                Báo Hỏng
                            </h2>

                            <form onSubmit={handleDamageSubmit} className="space-y-4">
                                <div>
                                    <label className="block mb-1 text-sm font-medium text-card-foreground">
                                        Vị Trí *
                                    </label>
                                    <select
                                        value={damageForm.location}
                                        onChange={(e) => setDamageForm({ ...damageForm, location: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-md border-input focus:ring-2 focus:ring-ring"
                                    >
                                        <option value="">Chọn Vị Trí</option>
                                        {locations.map(loc => (
                                            <option key={loc} value={loc}>{loc}</option>
                                        ))}
                                    </select>
                                    {errors.location && (
                                        <p className="mt-1 text-sm text-destructive">{errors.location}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block mb-1 text-sm font-medium text-card-foreground">
                                        Loại Thiệt Hại *
                                    </label>
                                    <select
                                        value={damageForm.damageType}
                                        onChange={(e) => setDamageForm({ ...damageForm, damageType: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-md border-input focus:ring-2 focus:ring-ring"
                                    >
                                        <option value="">Chọn Loại</option>
                                        {damageTypes.map(type => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block mb-1 text-sm font-medium text-card-foreground">
                                        Mức Độ Hỏng Hóc *
                                    </label>
                                    <div className="flex space-x-4">
                                        {["Nhẹ", "Vừa", "Nặng"].map((level) => (
                                            <label key={level} className="flex items-center">
                                                <input
                                                    type="radio"
                                                    name="severity"
                                                    value={level}
                                                    checked={damageForm.severity === level}
                                                    onChange={(e) => setDamageForm({ ...damageForm, severity: e.target.value })}
                                                    className="mr-2"
                                                />
                                                <span className="text-sm text-card-foreground">{level}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block mb-1 text-sm font-medium text-card-foreground">
                                        Mô Tả *
                                    </label>
                                    <textarea
                                        value={damageForm.description}
                                        onChange={(e) => setDamageForm({ ...damageForm, description: e.target.value })}
                                        className="w-full px-3 py-2 border border-input rounded-md focus:ring-2 focus:ring-ring min-h-[100px]"
                                        placeholder="Mô Tả Chi Tiết Về Hỏng Hóc"
                                    />
                                    {errors.description && (
                                        <p className="mt-1 text-sm text-destructive">{errors.description}</p>
                                    )}
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {damageForm.description.length}/500 Ký Tự
                                    </p>
                                </div>

                                <div>
                                    <label className="block mb-1 text-sm font-medium text-card-foreground">
                                        Thêm Hình Ảnh (Tùy Chọn)
                                    </label>
                                    <div className="flex justify-center px-6 pt-5 pb-6 mt-1 border-2 border-dashed rounded-md border-input">
                                        <div className="space-y-1 text-center">
                                            <FaUpload className="w-12 h-12 mx-auto text-muted-foreground" />
                                            <div className="flex text-sm text-muted-foreground">
                                                <label className="relative font-medium rounded-md cursor-pointer text-primary hover:text-accent focus-within:outline-none focus-within:ring-2 focus-within:ring-ring">
                                                    <span>Upload a file</span>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="sr-only"
                                                        onChange={(e) => setDamageForm({ ...damageForm, image: e.target.files[0] })}
                                                    />
                                                </label>
                                            </div>
                                            <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
                                        </div>
                                    </div>
                                    {errors.image && (
                                        <p className="mt-1 text-sm text-destructive">{errors.image}</p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full px-4 py-2 text-white transition-colors bg-gray-900 rounded-md bg-primary hover:bg-accent disabled:opacity-50"
                                >
                                    {loading ? "Đang Gửi..." : "Báo Hỏng"}
                                </button>
                            </form>
                        </div>

                        {/* Gợi Ý */}
                        <div className="p-6 bg-white rounded-lg shadow-lg">
                            <h2 className="flex items-center mb-6 text-xl font-semibold text-card-foreground">
                                <MdDescription className="mr-2 text-accent" />
                                Gợi Ý Đánh Giá
                            </h2>

                            <form onSubmit={handleSuggestionSubmit} className="space-y-4">
                                <div>
                                    <label className="block mb-1 text-sm font-medium text-card-foreground">
                                        Danh Mục *
                                    </label>
                                    <select
                                        value={suggestionForm.category}
                                        onChange={(e) => setSuggestionForm({ ...suggestionForm, category: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-md border-input focus:ring-2 focus:ring-ring"
                                    >
                                        <option value="">Chọn Danh Mục</option>
                                        {suggestionCategories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                    {errors.category && (
                                        <p className="mt-1 text-sm text-destructive">{errors.category}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block mb-1 text-sm font-medium text-card-foreground">
                                        Mô Tả *
                                    </label>
                                    <textarea
                                        value={suggestionForm.description}
                                        onChange={(e) => setSuggestionForm({ ...suggestionForm, description: e.target.value })}
                                        className="w-full px-3 py-2 border border-input rounded-md focus:ring-2 focus:ring-ring min-h-[100px]"
                                        placeholder="Mô Tả Chi Tiết Góp Ý Của Bạn..."
                                    />
                                    {errors.description && (
                                        <p className="mt-1 text-sm text-destructive">{errors.description}</p>
                                    )}
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {suggestionForm.description.length}/500 Ký Tự
                                    </p>
                                </div>

                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="anonymous"
                                        checked={suggestionForm.isAnonymous}
                                        onChange={(e) => setSuggestionForm({ ...suggestionForm, isAnonymous: e.target.checked })}
                                        className="w-4 h-4 rounded text-primary border-input focus:ring-ring"
                                    />
                                    <label htmlFor="anonymous" className="block ml-2 text-sm text-card-foreground">
                                        Gửi Góp Ý Ẩn Danh
                                    </label>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full px-4 py-2 text-white transition-colors bg-gray-900 rounded-md bg-primary hover:bg-accent disabled:opacity-50"
                                >
                                    {loading ? "Đang Gửi" : "Gửi Góp Ý"}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Success Toast */}
                    {showSuccess && (
                        <div className="fixed flex items-center px-6 py-3 rounded-md shadow-lg bottom-4 right-4 bg-accent text-accent-foreground">
                            <FaCheckCircle className="mr-2" />
                            Thành Công!
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default BaoHongGoiY