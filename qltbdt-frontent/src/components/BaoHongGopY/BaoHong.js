import { useState } from "react";
import { FaUpload } from "react-icons/fa";
import { MdWarning } from "react-icons/md";

const BaoHong = () => {
    const [damageForm, setDamageForm] = useState({
        description: "",
        image: null
    });
    const damageTypes = ["Kết Cấu", "Hệ Thống Điện", "Hệ Thống Nước", "Các Loại Thiết Bị", "Khác"];

    const [errors] = useState({});
    return (
        < div className="p-6 bg-white rounded-lg shadow-lg" >
            <h2 className="flex items-center border-b mb-6 text-xl font-semibold text-card-foreground">
                <MdWarning className="mr-2 text-destructive" />
                Báo Hỏng
            </h2>

            <form className="space-y-4">
                {/* Vị Trí */}
                <label className="block text-sm font-medium text-card-foreground">
                    Vị Trí  <span className="text-red-500">*</span>
                </label>
                <div className="grid gap-4 md:grid-cols-4">
                    {/* Cơ Sở */}
                    <div>
                        <select
                            value=""
                            className="w-full px-3 py-2 border rounded-md border-input focus:ring-2 focus:ring-ring"
                        >
                            <option value="">Cơ Sở</option>
                            <option>
                                Chính
                            </option>
                        </select>
                    </div>
                    {/* Tòa */}
                    <div>
                        <select
                            className="w-full px-3 py-2 border rounded-md border-input focus:ring-2 focus:ring-ring"
                        >
                            <option value="">Tòa</option>
                            <option>
                                A
                            </option>
                        </select>
                    </div>

                    {/* Tầng */}
                    <div>
                        <select
                            className="w-full px-3 py-2 border rounded-md border-input focus:ring-2 focus:ring-ring"
                        >
                            <option value="">Tầng</option>
                            <option>
                                1
                            </option>
                        </select>
                    </div>

                    {/* Danh Mục */}
                    <div>
                        <select
                            className="w-full px-3 py-2 border rounded-md border-input focus:ring-2 focus:ring-ring"
                        >
                            <option value="">Phòng</option>
                            <option>
                                1
                            </option>
                        </select>
                    </div>
                </div>


                <div>
                    <label className="block mb-1 text-sm font-medium text-card-foreground">
                        Loại Thiệt Hại <span className="text-red-500">*</span>
                    </label>
                    <select
                        value=""
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
                        Mức Độ Hỏng Hóc  <span className="text-red-500">*</span>
                    </label>
                    <div className="flex space-x-4">
                        {["Nhẹ", "Vừa", "Nặng"].map((level) => (
                            <label key={level} className="flex items-center">
                                <input
                                    type="radio"
                                    value=""

                                    className="mr-2"
                                />
                                <span className="text-sm text-card-foreground">{level}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block mb-1 text-sm font-medium text-card-foreground">
                        Mô Tả
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
                                    <span>Tải File Lên</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="sr-only"
                                    />
                                </label>
                            </div>
                            <p className="text-xs text-muted-foreground">PNG, JPG nặng 10MB</p>
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    className="w-full px-4 py-2 text-white transition-colors bg-gray-900 rounded-md bg-primary hover:bg-accent disabled:opacity-50"
                >
                    {"Báo Hỏng"}
                </button>
            </form>
        </div >
    );
};

export default BaoHong