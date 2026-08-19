"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Category = {
  id: number;
  name: string;
  emoji: string | null;
  created_at?: string;
};

type Product = {
  id: number;
  category_id: number | null;
  name: string;
  price: number;
  cost: number;
  emoji: string | null;
  created_at?: string;
};

function formatPrice(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value) + "đ";
}

export default function MenuManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [selectedCategoryId, setSelectedCategoryId] =
    useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [showCategoryForm, setShowCategoryForm] =
    useState(false);

  const [showProductForm, setShowProductForm] =
    useState(false);

  const [categoryName, setCategoryName] = useState("");
  const [categoryEmoji, setCategoryEmoji] = useState("☕");

  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productCost, setProductCost] = useState("");
  const [productEmoji, setProductEmoji] = useState("☕");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setErrorMessage("");

    const [categoryResult, productResult] = await Promise.all([
      supabase
        .from("categories")
        .select("*")
        .order("id", { ascending: true }),

      supabase
        .from("products")
        .select("*")
        .order("id", { ascending: true }),
    ]);

    if (categoryResult.error) {
      console.error(categoryResult.error);
      setErrorMessage(
        "Không tải được danh mục: " +
          categoryResult.error.message
      );
      setLoading(false);
      return;
    }

    if (productResult.error) {
      console.error(productResult.error);
      setErrorMessage(
        "Không tải được món: " +
          productResult.error.message
      );
      setLoading(false);
      return;
    }

    const loadedCategories =
      (categoryResult.data as Category[]) ?? [];

    const loadedProducts =
      (productResult.data as Product[]) ?? [];

    setCategories(loadedCategories);
    setProducts(loadedProducts);

    setSelectedCategoryId((current) => {
      if (
        current &&
        loadedCategories.some(
          (category) => category.id === current
        )
      ) {
        return current;
      }

      return loadedCategories[0]?.id ?? null;
    });

    setLoading(false);
  }

  async function addCategory() {
    const name = categoryName.trim();

    if (!name) {
      setErrorMessage("Hãy nhập tên mục.");
      return;
    }

    setSaving(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("categories")
      .insert({
        name,
        emoji: categoryEmoji.trim() || "☕",
      })
      .select()
      .single();

    setSaving(false);

    if (error) {
      console.error(error);
      setErrorMessage(
        "Không tạo được mục: " + error.message
      );
      return;
    }

    const newCategory = data as Category;

    setCategories((current) => [
      ...current,
      newCategory,
    ]);

    setSelectedCategoryId(newCategory.id);

    setCategoryName("");
    setCategoryEmoji("☕");
    setShowCategoryForm(false);
  }

  async function addProduct() {
    if (!selectedCategoryId) {
      setErrorMessage(
        "Hãy tạo hoặc chọn một mục trước."
      );
      return;
    }

    const name = productName.trim();
    const price = Number(productPrice);
    const cost = Number(productCost || 0);

    if (!name) {
      setErrorMessage("Hãy nhập tên món.");
      return;
    }

    if (
      !Number.isFinite(price) ||
      price <= 0
    ) {
      setErrorMessage("Giá bán phải lớn hơn 0.");
      return;
    }

    if (
      !Number.isFinite(cost) ||
      cost < 0
    ) {
      setErrorMessage(
        "Giá vốn không được nhỏ hơn 0."
      );
      return;
    }

    setSaving(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("products")
      .insert({
        category_id: selectedCategoryId,
        name,
        price,
        cost,
        emoji: productEmoji.trim() || "☕",
      })
      .select()
      .single();

    setSaving(false);

    if (error) {
      console.error(error);
      setErrorMessage(
        "Không thêm được món: " + error.message
      );
      return;
    }

    setProducts((current) => [
      ...current,
      data as Product,
    ]);

    setProductName("");
    setProductPrice("");
    setProductCost("");
    setProductEmoji("☕");
    setShowProductForm(false);
  }

  async function deleteProduct(product: Product) {
    const confirmed = window.confirm(
      `Xóa món "${product.name}"?`
    );

    if (!confirmed) return;

    setErrorMessage("");

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", product.id);

    if (error) {
      console.error(error);
      setErrorMessage(
        "Không xóa được món: " + error.message
      );
      return;
    }

    setProducts((current) =>
      current.filter(
        (item) => item.id !== product.id
      )
    );
  }

  async function deleteCategory(category: Category) {
    const categoryProducts = products.filter(
      (product) =>
        product.category_id === category.id
    );

    const text =
      categoryProducts.length > 0
        ? `Mục "${category.name}" đang có ${categoryProducts.length} món. Xóa mục này sẽ xóa luôn các món bên trong. Tiếp tục?`
        : `Xóa mục "${category.name}"?`;

    if (!window.confirm(text)) return;

    setErrorMessage("");

    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", category.id);

    if (error) {
      console.error(error);
      setErrorMessage(
        "Không xóa được mục: " + error.message
      );
      return;
    }

    const remainingCategories =
      categories.filter(
        (item) => item.id !== category.id
      );

    setCategories(remainingCategories);

    setProducts((current) =>
      current.filter(
        (product) =>
          product.category_id !== category.id
      )
    );

    if (selectedCategoryId === category.id) {
      setSelectedCategoryId(
        remainingCategories[0]?.id ?? null
      );
    }
  }

  const selectedCategory =
    categories.find(
      (category) =>
        category.id === selectedCategoryId
    ) ?? null;

  const visibleProducts = selectedCategoryId
    ? products.filter(
        (product) =>
          product.category_id === selectedCategoryId
      )
    : [];

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center rounded-[28px] border border-[#f2d6df] bg-white">
        <div className="text-center">
          <div className="text-4xl">☕</div>

          <p className="mt-3 font-semibold text-[#633c49]">
            Đang tải danh sách món...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 rounded-[24px] border border-[#f2d6df] bg-white p-4 sm:rounded-[28px] sm:p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#d96f94]">
              ☕ Sapa Coffee
            </p>

            <h1 className="mt-1 text-2xl font-bold text-[#633c49]">
              Danh sách món
            </h1>

            <p className="mt-1 text-sm text-[#a47b87]">
              Dữ liệu được lưu trực tiếp trên Supabase
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                setShowCategoryForm(true)
              }
              className="rounded-2xl border border-[#efcbd7] bg-white px-4 py-3 text-sm font-bold text-[#c85e82] transition hover:bg-[#fff5f8]"
            >
              ＋ Tạo mục
            </button>

            <button
              type="button"
              disabled={!selectedCategory}
              onClick={() =>
                setShowProductForm(true)
              }
              className="rounded-2xl bg-gradient-to-r from-[#e88eab] to-[#d96f94] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-[#e6a1b8]/30 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ＋ Thêm món
            </button>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          ⚠️ {errorMessage}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-[28px] border border-[#f2d6df] bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between px-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#b18793]">
              Danh mục
            </p>

            <span className="text-xs text-[#b18793]">
              {categories.length} mục
            </span>
          </div>

          {categories.length === 0 ? (
            <div className="rounded-2xl bg-[#fff8fa] p-5 text-center">
              <div className="text-3xl">🌸</div>

              <p className="mt-2 text-sm font-semibold text-[#633c49]">
                Chưa có mục nào
              </p>

              <button
                type="button"
                onClick={() =>
                  setShowCategoryForm(true)
                }
                className="mt-3 text-sm font-bold text-[#d96f94]"
              >
                ＋ Tạo mục đầu tiên
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {categories.map((category) => {
                const active =
                  category.id === selectedCategoryId;

                const itemCount = products.filter(
                  (product) =>
                    product.category_id ===
                    category.id
                ).length;

                return (
                  <div
                    key={category.id}
                    className={`group flex items-center rounded-2xl transition ${
                      active
                        ? "bg-[#f8c8d8]"
                        : "hover:bg-[#fff0f4]"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedCategoryId(
                          category.id
                        )
                      }
                      className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left"
                    >
                      <span className="text-xl">
                        {category.emoji || "☕"}
                      </span>

                      <span className="min-w-0 flex-1 truncate font-semibold text-[#633c49]">
                        {category.name}
                      </span>

                      <span className="rounded-full bg-white/70 px-2 py-1 text-xs font-bold text-[#805965]">
                        {itemCount}
                      </span>
                    </button>

                    <button
                      type="button"
                      title="Xóa mục"
                      onClick={() =>
                        deleteCategory(category)
                      }
                      className="mr-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm text-[#bd6c87] opacity-60 transition hover:bg-white hover:opacity-100"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </aside>

        <section className="rounded-[24px] border border-[#f2d6df] bg-white p-4 sm:rounded-[28px] sm:p-5 shadow-sm">
          {!selectedCategory ? (
            <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
              <div className="text-6xl">☕</div>

              <h2 className="mt-4 text-xl font-bold text-[#633c49]">
                Tạo danh mục đầu tiên
              </h2>

              <p className="mt-1 text-sm text-[#a47b87]">
                Ví dụ: Cà phê, Trà, Matcha, Bánh...
              </p>
            </div>
          ) : (
            <>
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-[#633c49]">
                    {selectedCategory.emoji || "☕"}{" "}
                    {selectedCategory.name}
                  </h2>

                  <p className="mt-1 text-sm text-[#a47b87]">
                    {visibleProducts.length} món
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowProductForm(true)
                  }
                  className="rounded-2xl bg-[#fff0f4] px-4 py-2.5 text-sm font-bold text-[#c85e82] transition hover:bg-[#ffe4ec]"
                >
                  ＋ Thêm món
                </button>
              </div>

              {visibleProducts.length === 0 ? (
                <div className="flex min-h-[350px] flex-col items-center justify-center rounded-3xl bg-[#fff8fa] text-center">
                  <div className="text-6xl">
                    🥤
                  </div>

                  <p className="mt-4 font-bold text-[#633c49]">
                    Chưa có món nào
                  </p>

                  <p className="mt-1 text-sm text-[#a47b87]">
                    Thêm món đầu tiên vào mục này.
                  </p>
                </div>
              ) : (
                <div className="-mx-2 overflow-x-auto px-2 sm:mx-0 sm:px-0">
                  <table className="w-full min-w-[720px]">
                    <thead>
                      <tr className="border-b border-[#f4e1e7] text-left text-xs uppercase tracking-wider text-[#ae8994]">
                        <th className="px-4 py-3">
                          Món
                        </th>

                        <th className="px-4 py-3">
                          Giá bán
                        </th>

                        <th className="px-4 py-3">
                          Giá vốn
                        </th>

                        <th className="px-4 py-3">
                          Lợi nhuận / ly
                        </th>

                        <th className="px-4 py-3 text-right">
                          Thao tác
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {visibleProducts.map(
                        (product) => {
                          const profit =
                            product.price -
                            product.cost;

                          return (
                            <tr
                              key={product.id}
                              className="border-b border-[#f8e9ee] last:border-0"
                            >
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#fff0f4] text-xl">
                                    {product.emoji ||
                                      "☕"}
                                  </div>

                                  <span className="font-semibold text-[#633c49]">
                                    {product.name}
                                  </span>
                                </div>
                              </td>

                              <td className="px-4 py-4 font-semibold text-[#633c49]">
                                {formatPrice(
                                  product.price
                                )}
                              </td>

                              <td className="px-4 py-4 text-[#8f6a76]">
                                {formatPrice(
                                  product.cost
                                )}
                              </td>

                              <td className="px-4 py-4 font-bold text-[#d96f94]">
                                {formatPrice(profit)}
                              </td>

                              <td className="px-4 py-4 text-right">
                                <button
                                  type="button"
                                  onClick={() =>
                                    deleteProduct(
                                      product
                                    )
                                  }
                                  className="rounded-xl bg-[#fff0f4] px-3 py-2 text-xs font-bold text-[#c85e82] transition hover:bg-[#ffe1ea]"
                                >
                                  Xóa
                                </button>
                              </td>
                            </tr>
                          );
                        }
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {showCategoryForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#4b2734]/40 p-4 backdrop-blur-sm">
          <div className="pos-modal max-h-[calc(100dvh-24px)] w-full max-w-md overflow-y-auto rounded-[26px] bg-white p-4 shadow-2xl sm:rounded-[30px] sm:p-6">
            <h2 className="text-xl font-bold text-[#633c49]">
              ＋ Tạo mục
            </h2>

            <p className="mt-1 text-sm text-[#a47b87]">
              Ví dụ: Cà phê, Trà, Matcha...
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#633c49]">
                  Tên mục
                </label>

                <input
                  value={categoryName}
                  onChange={(event) =>
                    setCategoryName(
                      event.target.value
                    )
                  }
                  placeholder="Cà phê"
                  className="w-full rounded-2xl border border-[#efd5df] px-4 py-3 outline-none focus:border-[#e996b2] focus:ring-4 focus:ring-[#f8dce5]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#633c49]">
                  Biểu tượng
                </label>

                <input
                  value={categoryEmoji}
                  onChange={(event) =>
                    setCategoryEmoji(
                      event.target.value
                    )
                  }
                  className="w-full rounded-2xl border border-[#efd5df] px-4 py-3 text-2xl outline-none focus:border-[#e996b2]"
                />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  setShowCategoryForm(false)
                }
                className="rounded-2xl border border-[#efd5df] py-3 font-semibold text-[#805965]"
              >
                Hủy
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={addCategory}
                className="rounded-2xl bg-[#e88eab] py-3 font-bold text-white disabled:opacity-50"
              >
                {saving
                  ? "Đang lưu..."
                  : "Tạo mục"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showProductForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#4b2734]/40 p-4 backdrop-blur-sm">
          <div className="pos-modal max-h-[calc(100dvh-24px)] w-full max-w-md overflow-y-auto rounded-[26px] bg-white p-4 shadow-2xl sm:rounded-[30px] sm:p-6">
            <h2 className="text-xl font-bold text-[#633c49]">
              ＋ Thêm món
            </h2>

            <p className="mt-1 text-sm text-[#a47b87]">
              Mục: {selectedCategory?.name}
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#633c49]">
                  Tên món
                </label>

                <input
                  value={productName}
                  onChange={(event) =>
                    setProductName(
                      event.target.value
                    )
                  }
                  placeholder="Cà phê sữa"
                  className="w-full rounded-2xl border border-[#efd5df] px-4 py-3 outline-none focus:border-[#e996b2] focus:ring-4 focus:ring-[#f8dce5]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#633c49]">
                    Giá bán
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={productPrice}
                    onChange={(event) =>
                      setProductPrice(
                        event.target.value
                      )
                    }
                    placeholder="30000"
                    className="w-full rounded-2xl border border-[#efd5df] px-4 py-3 outline-none focus:border-[#e996b2]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#633c49]">
                    Giá vốn
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={productCost}
                    onChange={(event) =>
                      setProductCost(
                        event.target.value
                      )
                    }
                    placeholder="10000"
                    className="w-full rounded-2xl border border-[#efd5df] px-4 py-3 outline-none focus:border-[#e996b2]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#633c49]">
                  Biểu tượng
                </label>

                <input
                  value={productEmoji}
                  onChange={(event) =>
                    setProductEmoji(
                      event.target.value
                    )
                  }
                  className="w-full rounded-2xl border border-[#efd5df] px-4 py-3 text-2xl outline-none focus:border-[#e996b2]"
                />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  setShowProductForm(false)
                }
                className="rounded-2xl border border-[#efd5df] py-3 font-semibold text-[#805965]"
              >
                Hủy
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={addProduct}
                className="rounded-2xl bg-gradient-to-r from-[#e88eab] to-[#d96f94] py-3 font-bold text-white disabled:opacity-50"
              >
                {saving
                  ? "Đang lưu..."
                  : "Thêm món"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}