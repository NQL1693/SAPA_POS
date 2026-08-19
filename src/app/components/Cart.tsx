import type { Product } from "./ProductCard";

export type CartItem = Product & {
  quantity: number;
};

type CartProps = {
  cart: CartItem[];
  subtotal: number;
  totalItems: number;
  onIncrease: (id: number) => void;
  onDecrease: (id: number) => void;
  onClear: () => void;
  onPayment: () => void;
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("vi-VN").format(price) + "đ";
}

export default function Cart({
  cart,
  subtotal,
  totalItems,
  onIncrease,
  onDecrease,
  onClear,
  onPayment,
}: CartProps) {
  return (
    <aside className="w-full lg:max-w-[410px]">
      <div className="sticky top-5 flex max-h-[calc(100vh-40px)] flex-col overflow-hidden rounded-[28px] border border-[#f2d6df] bg-white shadow-xl shadow-[#d88ca5]/10">
        <div className="border-b border-[#f5e0e6] bg-[#fff8fa] px-5 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#633c49]">
                🧾 Đơn hàng
              </h2>

              <p className="mt-1 text-xs text-[#a47b87]">
                {totalItems} món trong đơn
              </p>
            </div>

            {cart.length > 0 && (
              <button
                type="button"
                onClick={onClear}
                className="rounded-xl px-3 py-2 text-xs font-semibold text-[#c96988] hover:bg-[#ffeaf0]"
              >
                Xóa tất cả
              </button>
            )}
          </div>
        </div>

        <div className="min-h-[180px] flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="flex min-h-[240px] flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#fff0f4] text-4xl">
                🛍️
              </div>

              <p className="font-semibold text-[#633c49]">
                Chưa có món nào
              </p>

              <p className="mt-1 max-w-[220px] text-sm text-[#a47b87]">
                Chạm vào món bên trái để thêm vào đơn hàng.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl bg-[#fff5f8] p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-xl">
                      {item.emoji}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-[#633c49]">
                        {item.name}
                      </p>

                      <p className="text-sm font-medium text-[#d96f94]">
                        {formatPrice(item.price)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 rounded-xl bg-white p-1">
                      <button
                        type="button"
                        onClick={() => onDecrease(item.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-[#a95a75] hover:bg-[#ffe5ed]"
                      >
                        −
                      </button>

                      <span className="w-6 text-center text-sm font-bold">
                        {item.quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() => onIncrease(item.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#f8c8d8] text-[#8d4962] hover:bg-[#f2b4c9]"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="mt-2 text-right text-sm font-bold text-[#633c49]">
                    {formatPrice(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-[#f5e0e6] bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm text-[#98717d]">
              Tạm tính
            </span>

            <span className="font-semibold text-[#633c49]">
              {formatPrice(subtotal)}
            </span>
          </div>

          <div className="mb-5 flex items-end justify-between">
            <span className="font-semibold text-[#633c49]">
              Tổng cộng
            </span>

            <span className="text-2xl font-bold text-[#d96f94]">
              {formatPrice(subtotal)}
            </span>
          </div>

          <button
            type="button"
            disabled={cart.length === 0}
            onClick={onPayment}
            className="w-full rounded-2xl bg-gradient-to-r from-[#e88eab] to-[#d96f94] py-4 text-base font-bold text-white shadow-lg shadow-[#e6a1b8]/30 transition hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
          >
            💗 Thanh toán
          </button>
        </div>
      </div>
    </aside>
  );
}