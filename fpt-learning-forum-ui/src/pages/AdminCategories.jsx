import React, { useEffect, useState } from "react";
import axios from "axios";

const BASE_URL = "http://localhost:5000";

export default function AdminCategories() {
    const [categories, setCategories] = useState([]);

    const [form, setForm] = useState({
        name: "",
    });

    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);

    // ✅ lấy token
    const token = JSON.parse(localStorage.getItem("lf_auth_v1"))?.token;

    const authHeader = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    // ================= FETCH =================
    const fetchCategories = async () => {
        const res = await axios.get(`${BASE_URL}/api/admin/categories`);
        setCategories(res.data);
    };

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                await fetchCategories();
            } catch (err) {
                console.error("Load error:", err);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, []);

    // ================= CREATE / UPDATE =================
    const handleSubmit = async () => {
        if (!form.name.trim()) {
            return alert("Nhập tên category");
        }

        try {
            if (editingId) {
                await axios.patch(
                    `${BASE_URL}/api/admin/categories/${editingId}`,
                    form,
                    authHeader // ✅ thêm auth
                );
                alert("Cập nhật thành công");
            } else {
                await axios.post(
                    `${BASE_URL}/api/admin/categories`,
                    form,
                    authHeader // ✅ thêm auth
                );
                alert("Tạo thành công");
            }

            setForm({ name: "" });
            setEditingId(null);
            fetchCategories();

        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || "Lỗi server");
        }
    };

    // ================= EDIT =================
    const handleEdit = (c) => {
        setForm({
            name: c.name,
        });
        setEditingId(c._id);
    };

    // ================= DELETE =================
    const handleDelete = async (id) => {
        if (!window.confirm("Xóa category?")) return;

        try {
            await axios.delete(
                `${BASE_URL}/api/admin/categories/${id}`,
                authHeader // ✅ thêm auth
            );

            alert("Đã xóa");
            fetchCategories();

        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || "Lỗi xóa");
        }
    };

    if (loading) return <div className="p-4">Đang tải...</div>;

    return (
        <div className="p-6 space-y-6">
            <h2 className="text-xl font-bold">Quản lý Category</h2>

            {/* FORM */}
            <div className="border p-4 rounded">
                <h3 className="mb-2 font-semibold">
                    {editingId ? "Update Category" : "Create Category"}
                </h3>

                <input
                    className="border p-2 mr-2"
                    placeholder="Category name"
                    value={form.name}
                    onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                    }
                />

                <button
                    className="bg-blue-600 text-white px-3 py-1"
                    onClick={handleSubmit}
                >
                    {editingId ? "Update" : "Create"}
                </button>

                {editingId && (
                    <button
                        className="ml-2 px-3 py-1 bg-gray-400 text-white"
                        onClick={() => {
                            setEditingId(null);
                            setForm({ name: "" });
                        }}
                    >
                        Cancel
                    </button>
                )}
            </div>

            {/* TABLE */}
            <table className="w-full border">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="border p-2">#</th>
                        <th className="border p-2">Name</th>
                        <th className="border p-2">Slug</th>
                        <th className="border p-2">Action</th>
                    </tr>
                </thead>

                <tbody>
                    {categories.length === 0 && (
                        <tr>
                            <td colSpan={4} className="text-center p-2">
                                Không có category
                            </td>
                        </tr>
                    )}

                    {categories.map((c, index) => (
                        <tr key={c._id}>
                            <td className="border p-2 text-center">
                                {index + 1}
                            </td>

                            <td className="border p-2">{c.name}</td>

                            <td className="border p-2">{c.slug}</td>

                            <td className="border p-2">
                                <button
                                    className="bg-yellow-500 text-white px-2 mr-2"
                                    onClick={() => handleEdit(c)}
                                >
                                    Edit
                                </button>

                                <button
                                    className="bg-red-600 text-white px-2"
                                    onClick={() => handleDelete(c._id)}
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
