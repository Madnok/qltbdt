import { useState } from "react";
import {MdDescription } from "react-icons/md";

const GopY = () => {
    const [suggestionForm, setSuggestionForm] = useState({
        category: "",
        description: "",
        isAnonymous: false
    });
    const suggestionCategories = ["Cải Thiện CSVC", "Nâng Cao Quy Trình", "Tối Ưu Hóa Chi Phí", "Khác"];
    return (
        <div className="p-4 bg-white rounded-lg shadow-lg">
            <h2 className="flex items-center mb-6 text-xl font-semibold border-b text-card-foreground">
                <MdDescription className="mr-2 text-blue-700" />
                Gợi Ý Đánh Giá
            </h2>

            <form className="space-y-4">
                <div>
                    <label className="block mb-1 text-sm font-medium text-card-foreground">
                        Danh Mục  <span className="text-red-500">*</span>
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
                </div>

                <div>
                    <label className="block mb-1 text-sm font-medium text-card-foreground">
                        Mô Tả 
                    </label>
                    <textarea
                        value={suggestionForm.description}
                        onChange={(e) => setSuggestionForm({ ...suggestionForm, description: e.target.value })}
                        className="w-full px-3 py-2 border border-input rounded-md focus:ring-2 focus:ring-ring min-h-[100px]"
                        placeholder="Mô Tả Chi Tiết Góp Ý Của Bạn..."
                    />
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
                    className="w-full px-4 py-2 text-white transition-colors bg-gray-900 rounded-md hover:bg-accent disabled:opacity-50"
                >
                    {"Gửi Góp Ý"}
                </button>
            </form>
        </div>
    );
}

export default GopY