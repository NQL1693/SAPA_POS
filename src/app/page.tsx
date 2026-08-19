"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { LogoutButton } from "./components/LogoutButton";
import { supabase } from "@/lib/supabase";

import Header from "./components/Header";
import CategoryTabs from "./components/CategoryTabs";

import ProductCard, {
  type Product,
} from "./components/ProductCard";

import Cart, {
  type CartItem,
} from "./components/Cart";

import {
  PaymentDialog,
  type PaymentResult,
} from "./components/PaymentDialog";

import MenuManager from "./components/MenuManager";
import ReportScreen from "./components/ReportScreen";

import { OrderHistory } from "./components/OrderHistory";

type Screen =
  | "cashier"
  | "menu"
  | "report"
  | "history";

type DbCategory = {
  id: number;
  name: string;
  emoji: string | null;
};

type DbProduct = {
  id: number;
  category_id: number | null;
  name: string;
  price: number;
  cost: number;
  emoji: string | null;
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("vi-VN").format(price) + "đ";
}

function Sidebar({
  activeScreen,
  onChange,
}: {
  activeScreen: Screen;
  onChange: (screen: Screen) => void;
}) {
const menu = [
  {
    id: "cashier" as Screen,
    label: "Thu ngân",
    icon: "🧾",
  },
  {
    id: "menu" as Screen,
    label: "Danh sách món",
    icon: "☕",
  },
  {
    id: "report" as Screen,
    label: "Báo cáo",
    icon: "📊",
  },
  {
    id: "history" as Screen,
    label: "Lịch sử",
    icon: "📋",
  },
];

  return (
    <aside className="fixed inset-x-3 bottom-3 z-40 rounded-[24px] border border-[#f2d6df] bg-white/95 p-2 shadow-xl backdrop-blur lg:static lg:inset-auto lg:z-auto lg:w-[220px] lg:shrink-0 lg:rounded-[28px] lg:p-3 lg:shadow-sm">
      <div className="mb-4 hidden px-3 pt-2 lg:block">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#b18793]">
          Quản lý
        </p>
      </div>

      <div className="grid grid-cols-4 gap-1.5 lg:grid-cols-1 lg:gap-2">
        {menu.map((item) => {
          const active = activeScreen === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-[11px] font-bold transition lg:flex-row lg:justify-start lg:gap-2 lg:px-3 lg:py-3 lg:text-sm ${
                active
                  ? "bg-[#f8c8d8] text-[#633c49] shadow-sm"
                  : "text-[#805965] hover:bg-[#fff0f4]"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="max-w-full truncate">{item.label}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}


export default function Home() {
  const [activeScreen, setActiveScreen] =
    useState<Screen>("cashier");

  const [activeCategory, setActiveCategory] =
    useState("Tất cả");

  const [cart, setCart] =
    useState<CartItem[]>([]);

  const [showPayment, setShowPayment] =
    useState(false);

  const [paymentSaving, setPaymentSaving] =
    useState(false);

  const [paymentMessage, setPaymentMessage] =
    useState("");

  const [dbCategories, setDbCategories] =
    useState<DbCategory[]>([]);

  const [dbProducts, setDbProducts] =
    useState<DbProduct[]>([]);

  const [menuLoading, setMenuLoading] =
    useState(true);

  const [menuError, setMenuError] =
    useState("");

  async function loadMenu() {
    setMenuLoading(true);
    setMenuError("");

    const [categoryResult, productResult] =
      await Promise.all([
        supabase
          .from("categories")
          .select("*")
          .order("id", {
            ascending: true,
          }),

        supabase
          .from("products")
          .select("*")
          .order("id", {
            ascending: true,
          }),
      ]);

    if (categoryResult.error) {
      console.error(
        "Lỗi tải categories:",
        categoryResult.error
      );

      setMenuError(
        "Không tải được danh mục: " +
          categoryResult.error.message
      );
    }

    if (productResult.error) {
      console.error(
        "Lỗi tải products:",
        productResult.error
      );

      setMenuError(
        "Không tải được món: " +
          productResult.error.message
      );
    }

    setDbCategories(
      (categoryResult.data as DbCategory[]) ?? []
    );

    setDbProducts(
      (productResult.data as DbProduct[]) ?? []
    );

    setMenuLoading(false);
  }

  useEffect(() => {
    loadMenu();
  }, []);

  const categories = useMemo(() => {
    return [
      {
        name: "Tất cả",
        emoji: "✨",
      },

      ...dbCategories.map((category) => ({
        name: category.name,
        emoji: category.emoji || "☕",
      })),
    ];
  }, [dbCategories]);

  const products: Product[] = useMemo(() => {
    return dbProducts.map((product) => {
      const category = dbCategories.find(
        (item) =>
          item.id === product.category_id
      );

      return {
        id: product.id,
        name: product.name,
        category: category?.name ?? "Khác",
        price: product.price,
        cost: product.cost,
        emoji: product.emoji || "☕",
      };
    });
  }, [dbProducts, dbCategories]);

  const filteredProducts = useMemo(() => {
    if (activeCategory === "Tất cả") {
      return products;
    }

    return products.filter(
      (product) =>
        product.category === activeCategory
    );
  }, [products, activeCategory]);

  const subtotal = useMemo(() => {
    return cart.reduce(
      (total, item) =>
        total +
        item.price * item.quantity,
      0
    );
  }, [cart]);

  const totalItems = useMemo(() => {
    return cart.reduce(
      (total, item) =>
        total + item.quantity,
      0
    );
  }, [cart]);

  function addToCart(product: Product) {
    setPaymentMessage("");

    setCart((current) => {
      const existing = current.find(
        (item) => item.id === product.id
      );

      if (existing) {
        return current.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity:
                  item.quantity + 1,
              }
            : item
        );
      }

      return [
        ...current,
        {
          ...product,
          quantity: 1,
        },
      ];
    });
  }

  function increaseQuantity(id: number) {
    setCart((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity:
                item.quantity + 1,
            }
          : item
      )
    );
  }

  function decreaseQuantity(id: number) {
    setCart((current) =>
      current
        .map((item) =>
          item.id === id
            ? {
                ...item,
                quantity:
                  item.quantity - 1,
              }
            : item
        )
        .filter(
          (item) =>
            item.quantity > 0
        )
    );
  }

  function clearCart() {
    setCart([]);
    setPaymentMessage("");
  }

  async function confirmPayment(
    payment: PaymentResult
  ) {
    if (cart.length === 0) {
      return;
    }

    setPaymentSaving(true);
    setPaymentMessage("");

    const {
      data: order,
      error: orderError,
    } = await supabase
      .from("orders")
      .insert({
        subtotal,
        discount_type:
          payment.discountType,
        discount_value:
          payment.discountValue,
        discount_amount:
          payment.discountAmount,
        total: payment.total,
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error(
        "Lỗi tạo hóa đơn:",
        orderError
      );

      setPaymentMessage(
        "❌ Không lưu được hóa đơn: " +
          (orderError?.message ??
            "Không rõ lỗi")
      );

      setPaymentSaving(false);
      return;
    }

    const orderItems = cart.map(
      (item) => ({
        order_id: order.id,
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        price: item.price,
        cost: item.cost,
      })
    );

    const { error: itemsError } =
      await supabase
        .from("order_items")
        .insert(orderItems);

    if (itemsError) {
      console.error(
        "Lỗi lưu món trong hóa đơn:",
        itemsError
      );

      setPaymentMessage(
        "❌ Hóa đơn đã tạo nhưng không lưu được chi tiết món: " +
          itemsError.message
      );

      setPaymentSaving(false);
      return;
    }

    setPaymentSaving(false);
    setShowPayment(false);
    setCart([]);

    setPaymentMessage(
      `✅ Thanh toán thành công. Đã lưu hóa đơn #${order.id} vào Supabase.`
    );
  }

  async function changeScreen(
    screen: Screen
  ) {
    setActiveScreen(screen);

    if (screen === "cashier") {
      await loadMenu();
    }
  }

  return (
    <main className="min-h-screen bg-[#fff5f8] text-[#4a3038]">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col">
        <Header />

        <div className="flex flex-1 flex-col gap-5 p-3 pb-28 sm:p-4 sm:pb-28 md:p-6 md:pb-28 lg:flex-row lg:pb-6">
          <Sidebar
            activeScreen={activeScreen}
            onChange={changeScreen}
          />

          <div className="min-w-0 flex-1">

            {activeScreen ===
              "cashier" && (
              <div>
                {paymentMessage && (
                  <div className="mb-4 rounded-2xl border border-[#f2d6df] bg-white px-4 py-3 text-sm font-bold text-[#633c49] shadow-sm">
                    {paymentMessage}
                  </div>
                )}

                <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_410px] xl:gap-5">
                  <section className="min-w-0 overflow-hidden rounded-[24px] border border-[#f2d6df] bg-white p-3 shadow-sm sm:p-4 md:rounded-[28px] md:p-5">
                    <div className="mb-5">
                      <h2 className="text-2xl font-bold text-[#633c49]">
                        Chọn món
                      </h2>

                      <p className="mt-1 text-sm text-[#a47b87]">
                        Chạm vào món để
                        thêm vào đơn hàng
                      </p>
                    </div>

                    {menuError && (
                      <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                        ⚠️ {menuError}
                      </div>
                    )}

                    <CategoryTabs
                      categories={
                        categories
                      }
                      activeCategory={
                        activeCategory
                      }
                      onCategoryChange={
                        setActiveCategory
                      }
                    />

                    {menuLoading ? (
                      <div className="flex min-h-[300px] items-center justify-center">
                        <div className="text-center">
                          <div className="text-4xl">
                            ☕
                          </div>

                          <p className="mt-3 font-semibold text-[#a47b87]">
                            Đang tải menu...
                          </p>
                        </div>
                      </div>
                    ) : filteredProducts.length ===
                      0 ? (
                      <div className="flex min-h-[300px] items-center justify-center rounded-3xl bg-[#fff8fa]">
                        <div className="text-center">
                          <div className="text-5xl">
                            🥤
                          </div>

                          <p className="mt-3 font-bold text-[#633c49]">
                            Chưa có món
                          </p>

                          <p className="mt-1 text-sm text-[#a47b87]">
                            Hãy thêm món
                            trong Danh sách
                            món.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 xl:grid-cols-4">
                        {filteredProducts.map(
                          (product) => (
                            <ProductCard
                              key={
                                product.id
                              }
                              product={
                                product
                              }
                              onAdd={
                                addToCart
                              }
                            />
                          )
                        )}
                      </div>
                    )}
                  </section>

                  <Cart
                    cart={cart}
                    subtotal={subtotal}
                    totalItems={
                      totalItems
                    }
                    onIncrease={
                      increaseQuantity
                    }
                    onDecrease={
                      decreaseQuantity
                    }
                    onClear={
                      clearCart
                    }
                    onPayment={() =>
                      setShowPayment(
                        true
                      )
                    }
                  />
                </div>
              </div>
            )}

            {activeScreen ===
              "menu" && (
              <MenuManager />
            )}

            {activeScreen ===
              "report" && (
              <ReportScreen />
            )}

            {activeScreen === "history" && (
              <OrderHistory />
            )}
          </div>
        </div>
      </div>

      {showPayment && (
        <PaymentDialog
          subtotal={subtotal}
          saving={paymentSaving}
          onClose={() =>
            setShowPayment(false)
          }
          onConfirm={
            confirmPayment
          }
        />
      )}
    </main>
  );
}