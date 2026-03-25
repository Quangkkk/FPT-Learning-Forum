import React, { useEffect, useState } from "react";
import axios from "axios";

const BASE_URL = "http://localhost:5000";

export default function AdminTopics() {
    const [topics, setTopics] = useState([]);
    const [categories, setCategories] = useState([]);

    const [form, setForm] = useState({
        name: "",
        categoryId: "",
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
    const fetchTopics = async () => {
        const res = await axios.get(`${BASE_URL}/api/admin/topics`);
        setTopics(res.data);
    };

    const fetchCategories = async () => {
        try {
            const res = await axios.get(`${BASE_URL}/api/admin/categories`);

            const cats = Array.isArray(res.data)
                ? res.data
                : res.data.categories || [];

            setCategories(cats);

            if (cats.length > 0) {
                setForm((prev) => ({
                    ...prev,
                    categoryId: cats[0]._id,
                }));
            }
        } catch (err) {
            console.error("Fetch categories error:", err);
        }
    };

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                await Promise.all([fetchTopics(), fetchCategories()]);
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
        if (!form.name || !form.categoryId) {
            return alert("Điền đủ thông tin");
        }

        try {
            if (editingId) {
                await axios.patch(
                    `${BASE_URL}/api/admin/topics/${editingId}`,
                    form,
                    authHeader // ✅ thêm auth
                );
                alert("Cập nhật thành công");
            } else {
                await axios.post(
                    `${BASE_URL}/api/admin/topics`,
                    form,
                    authHeader // ✅ thêm auth
                );
                alert("Tạo thành công");
            }

            setForm({
                name: "",
                categoryId: categories[0]?._id || "",
            });

            setEditingId(null);
            fetchTopics();

        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || "Lỗi server");
        }
    };

    // ================= EDIT =================
    const handleEdit = (t) => {
        setForm({
            name: t.name,
            categoryId: t.categoryId?._id || "",
        });
        setEditingId(t._id);
    };

    // ================= DELETE =================
    const handleDelete = async (id) => {
        if (!window.confirm("Xóa chủ đề?")) return;

        try {
            await axios.delete(
                `${BASE_URL}/api/admin/topics/${id}`,
                authHeader // ✅ thêm auth
            );

            alert("Đã xóa");
            fetchTopics();

        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || "Lỗi xóa");
        }
    };

    if (loading) return <div className="p-4">Đang tải...</div>;

    return (
        <div className="p-6 space-y-6">
            <h2 className="text-xl font-bold">Quản lý chủ đề</h2>

            {/* FORM */}
            <div className="border p-4 rounded">
                <h3 className="mb-2 font-semibold">
                    {editingId ? "Cập nhật chủ đề" : "Tạo chủ đề"}
                </h3>

                <input
                    className="border p-2 mr-2"
                    placeholder="Name"
                    value={form.name}
                    onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                    }
                />

                <select
                    className="border p-2 mr-2"
                    value={form.categoryId}
                    onChange={(e) =>
                        setForm({ ...form, categoryId: e.target.value })
                    }
                >
                    {categories.map((c) => (
                        <option key={c._id} value={c._id}>
                            {c.name}
                        </option>
                    ))}
                </select>

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
                            setForm({
                                name: "",
                                categoryId: categories[0]?._id || "",
                            });
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
                        <th className="border p-2">Category</th>
                        <th className="border p-2">Hành động</th>
                    </tr>
                </thead>

                <tbody>
                    {topics.map((t, index) => (
                        <tr key={t._id}>
                            <td className="border p-2 text-center">
                                {index + 1}
                            </td>

                            <td className="border p-2">{t.name}</td>
                            <td className="border p-2">{t.slug}</td>
                            <td className="border p-2">
                                {t.categoryId?.name || "N/A"}
                            </td>

                            <td className="border p-2">
                                <button
                                    className="bg-yellow-500 text-white px-2 mr-2"
                                    onClick={() => handleEdit(t)}
                                >
                                    Sửa
                                </button>

                                <button
                                    className="bg-red-600 text-white px-2"
                                    onClick={() => handleDelete(t._id)}
                                >
                                    Xóa
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
