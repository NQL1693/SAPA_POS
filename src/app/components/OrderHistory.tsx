"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Order = {
  id: number;
  subtotal: number;
  discount_amount: number;
  total: number;
  status: "completed" | "cancelled";
  created_at: string;
};

type OrderItem = {
  id: number;
  order_id: number;
  product_id: number | null;
  product_name: string;
  quantity: number;
  price: number;
  cost: number;
};

function formatPrice(value: number) {
  return (
    new Intl.NumberFormat("vi-VN").format(
      Math.round(Number(value) || 0)
    ) + "đ"
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getLocalDateString(date: Date) {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function OrderHistory() {
  const today = getLocalDateString(new Date());

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedDate, setSelectedDate] =
    useState(today);

  const [searchId, setSearchId] =
    useState("");

  const [selectedOrder, setSelectedOrder] =
    useState<Order | null>(null);

  const [orderItems, setOrderItems] =
    useState<OrderItem[]>([]);

  const [detailLoading, setDetailLoading] =
    useState(false);

  const [cancelling, setCancelling] =
    useState(false);

  /*
    ============================
    TẢI DANH SÁCH HÓA ĐƠN
    ============================
  */

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError("");

    const startDate = new Date(
      `${selectedDate}T00:00:00`
    );

    const endDate = new Date(
      `${selectedDate}T23:59:59.999`
    );

    const { data, error: loadError } =
      await supabase
        .from("orders")
        .select(
          "id, subtotal, discount_amount, total, status, created_at"
        )
        .gte(
          "created_at",
          startDate.toISOString()
        )
        .lte(
          "created_at",
          endDate.toISOString()
        )
        .order("created_at", {
          ascending: false,
        });

    if (loadError) {
      console.error(loadError);

      setError(
        "Không tải được hóa đơn: " +
          loadError.message
      );

      setOrders([]);
      setLoading(false);
      return;
    }

    setOrders(
      (data as Order[]) ?? []
    );

    setLoading(false);
  }, [selectedDate]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  /*
    ============================
    MỞ CHI TIẾT HÓA ĐƠN
    ============================
  */

  async function openOrder(order: Order) {
    setSelectedOrder(order);
    setOrderItems([]);
    setDetailLoading(true);
    setError("");

    const { data, error: itemError } =
      await supabase
        .from("order_items")
        .select(
          "id, order_id, product_id, product_name, quantity, price, cost"
        )
        .eq(
          "order_id",
          order.id
        )
        .order("id", {
          ascending: true,
        });

    if (itemError) {
      console.error(itemError);

      setError(
        "Không tải được chi tiết hóa đơn: " +
          itemError.message
      );

      setDetailLoading(false);
      return;
    }

    setOrderItems(
      (data as OrderItem[]) ?? []
    );

    setDetailLoading(false);
  }

  /*
    ============================
    ĐÓNG POPUP
    ============================
  */

  function closeOrder() {
    if (cancelling) {
      return;
    }

    setSelectedOrder(null);
    setOrderItems([]);
    setDetailLoading(false);
  }

  /*
    ============================
    HỦY HÓA ĐƠN
    ============================
  */

  async function cancelOrder() {
    if (!selectedOrder) {
      return;
    }

    if (
      selectedOrder.status === "cancelled"
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        `Bạn có chắc muốn hủy hóa đơn #${selectedOrder.id}?\n\nHóa đơn vẫn được giữ trong lịch sử nhưng sẽ được đánh dấu là đã hủy.`
      );

    if (!confirmed) {
      return;
    }

    setCancelling(true);
    setError("");

    const { error: updateError } =
      await supabase
        .from("orders")
        .update({
          status: "cancelled",
        })
        .eq(
          "id",
          selectedOrder.id
        );

    if (updateError) {
      console.error(updateError);

      setError(
        "Không hủy được hóa đơn: " +
          updateError.message
      );

      setCancelling(false);
      return;
    }

    setOrders(
      (currentOrders) =>
        currentOrders.map(
          (order) =>
            order.id ===
            selectedOrder.id
              ? {
                  ...order,
                  status:
                    "cancelled",
                }
              : order
        )
    );

    setSelectedOrder(
      (currentOrder) =>
        currentOrder
          ? {
              ...currentOrder,
              status:
                "cancelled",
            }
          : null
    );

    setCancelling(false);
  }

  /*
    ============================
    TÌM KIẾM THEO MÃ BILL
    ============================
  */

  const filteredOrders =
    useMemo(() => {
      const keyword =
        searchId.trim();

      if (!keyword) {
        return orders;
      }

      return orders.filter(
        (order) =>
          String(
            order.id
          ).includes(keyword)
      );
    }, [orders, searchId]);

  /*
    ============================
    HÓA ĐƠN HỢP LỆ
    ============================
  */

  const validOrders =
    useMemo(() => {
      return filteredOrders.filter(
        (order) =>
          order.status !==
          "cancelled"
      );
    }, [filteredOrders]);

  /*
    ============================
    DOANH THU HỢP LỆ
    ============================
  */

  const validRevenue =
    useMemo(() => {
      return validOrders.reduce(
        (sum, order) =>
          sum +
          Number(
            order.total || 0
          ),
        0
      );
    }, [validOrders]);

  /*
    ============================
    SỐ BILL ĐÃ HỦY
    ============================
  */

  const cancelledCount =
    useMemo(() => {
      return filteredOrders.filter(
        (order) =>
          order.status ===
          "cancelled"
      ).length;
    }, [filteredOrders]);

  return (
    <div className="space-y-5">

      {/* =====================
          HEADER
      ====================== */}

      <section className="rounded-[28px] border border-[#f2d6df] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <p className="text-sm font-bold text-[#d96f94]">
              📋 Pink Coffee
            </p>

            <h1 className="mt-1 text-2xl font-bold text-[#633c49]">
              Lịch sử hóa đơn
            </h1>

            <p className="mt-1 text-sm text-[#a47b87]">
              Xem lại, tìm kiếm và quản lý
              các hóa đơn đã thanh toán.
            </p>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={loadOrders}
            className="rounded-2xl bg-[#fff0f4] px-4 py-2.5 text-sm font-bold text-[#d96f94] transition hover:bg-[#ffe5ed] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Đang tải..."
              : "🔄 Làm mới"}
          </button>

        </div>
      </section>

      {/* =====================
          BỘ LỌC
      ====================== */}

      <section className="rounded-[28px] border border-[#f2d6df] bg-white p-5 shadow-sm">

        <div className="mb-4">
          <h2 className="font-bold text-[#633c49]">
            🔎 Bộ lọc hóa đơn
          </h2>

          <p className="mt-1 text-xs text-[#a47b87]">
            Chọn ngày và tìm nhanh theo mã hóa đơn.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">

          {/* NGÀY */}

          <div>
            <label className="mb-2 block text-sm font-bold text-[#633c49]">
              📅 Ngày bán
            </label>

            <input
              type="date"
              value={
                selectedDate
              }
              onChange={(
                event
              ) => {
                setSelectedDate(
                  event.target
                    .value
                );

                setSearchId(
                  ""
                );
              }}
              className="w-full rounded-2xl border border-[#efd5df] bg-white px-4 py-3 text-[#633c49] outline-none transition focus:border-[#e996b2] focus:ring-4 focus:ring-[#f8dce5]"
            />
          </div>

          {/* TÌM BILL */}

          <div>
            <label className="mb-2 block text-sm font-bold text-[#633c49]">
              🧾 Mã hóa đơn
            </label>

            <div className="flex gap-2">

              <input
                type="text"
                inputMode="numeric"
                value={
                  searchId
                }
                onChange={(
                  event
                ) =>
                  setSearchId(
                    event.target.value.replace(
                      /\D/g,
                      ""
                    )
                  )
                }
                placeholder="Ví dụ: 12"
                className="min-w-0 flex-1 rounded-2xl border border-[#efd5df] bg-white px-4 py-3 text-[#633c49] outline-none transition placeholder:text-[#c8a9b2] focus:border-[#e996b2] focus:ring-4 focus:ring-[#f8dce5]"
              />

              {searchId && (
                <button
                  type="button"
                  onClick={() =>
                    setSearchId(
                      ""
                    )
                  }
                  className="rounded-2xl bg-[#fff0f4] px-4 font-bold text-[#d96f94] transition hover:bg-[#ffe5ed]"
                >
                  ×
                </button>
              )}

            </div>
          </div>

        </div>

        {/* QUICK TODAY */}

        {selectedDate !==
          today && (
          <button
            type="button"
            onClick={() => {
              setSelectedDate(
                today
              );

              setSearchId(
                ""
              );
            }}
            className="mt-4 rounded-xl bg-[#fff0f4] px-4 py-2 text-xs font-bold text-[#d96f94] transition hover:bg-[#ffe5ed]"
          >
            📅 Quay về hôm nay
          </button>
        )}

      </section>

      {/* =====================
          ERROR
      ====================== */}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-600">
          ⚠️ {error}
        </div>
      )}

      {/* =====================
          SUMMARY
      ====================== */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <div className="rounded-[26px] border border-[#f2d6df] bg-white p-5 shadow-sm">

          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff0f4]">
            🧾
          </div>

          <p className="text-sm text-[#a47b87]">
            Tổng hóa đơn
          </p>

          <p className="mt-1 text-3xl font-bold text-[#633c49]">
            {
              filteredOrders.length
            }
          </p>

        </div>

        <div className="rounded-[26px] border border-[#f2d6df] bg-white p-5 shadow-sm">

          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff0f4]">
            ✅
          </div>

          <p className="text-sm text-[#a47b87]">
            Hóa đơn hợp lệ
          </p>

          <p className="mt-1 text-3xl font-bold text-[#633c49]">
            {
              validOrders.length
            }
          </p>

        </div>

        <div className="rounded-[26px] border border-[#f2d6df] bg-white p-5 shadow-sm">

          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
            🚫
          </div>

          <p className="text-sm text-[#a47b87]">
            Đã hủy
          </p>

          <p className="mt-1 text-3xl font-bold text-red-500">
            {
              cancelledCount
            }
          </p>

        </div>

        <div className="rounded-[26px] border border-[#f2d6df] bg-white p-5 shadow-sm">

          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff0f4]">
            💰
          </div>

          <p className="text-sm text-[#a47b87]">
            Doanh thu hợp lệ
          </p>

          <p className="mt-1 text-2xl font-bold text-[#d96f94]">
            {formatPrice(
              validRevenue
            )}
          </p>

        </div>

      </div>

      {/* =====================
          DANH SÁCH BILL
      ====================== */}

      <section className="overflow-hidden rounded-[28px] border border-[#f2d6df] bg-white shadow-sm">

        <div className="flex flex-col gap-2 border-b border-[#f5dfe6] p-5 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h2 className="font-bold text-[#633c49]">
              🧾 Danh sách hóa đơn
            </h2>

            <p className="mt-1 text-xs text-[#a47b87]">
              Bấm vào một hóa đơn để xem chi tiết.
            </p>
          </div>

          <div className="text-sm font-semibold text-[#a47b87]">
            {new Date(
              `${selectedDate}T12:00:00`
            ).toLocaleDateString(
              "vi-VN"
            )}
          </div>

        </div>

        {loading ? (
          <div className="p-12 text-center">

            <div className="text-4xl">
              ☕
            </div>

            <p className="mt-3 text-sm font-semibold text-[#a47b87]">
              Đang tải hóa đơn...
            </p>

          </div>
        ) : filteredOrders.length ===
          0 ? (
          <div className="p-12 text-center">

            <div className="text-5xl">
              🧾
            </div>

            <p className="mt-3 font-bold text-[#633c49]">
              Không tìm thấy hóa đơn
            </p>

            <p className="mt-1 text-sm text-[#a47b87]">
              {searchId
                ? `Không có hóa đơn phù hợp với mã "${searchId}".`
                : "Ngày này chưa có giao dịch nào."}
            </p>

            {searchId && (
              <button
                type="button"
                onClick={() =>
                  setSearchId(
                    ""
                  )
                }
                className="mt-4 rounded-xl bg-[#fff0f4] px-4 py-2 text-sm font-bold text-[#d96f94]"
              >
                Xóa tìm kiếm
              </button>
            )}

          </div>
        ) : (
          <div className="divide-y divide-[#f8e8ed]">

            {filteredOrders.map(
              (order) => {
                const cancelled =
                  order.status ===
                  "cancelled";

                return (
                  <button
                    key={
                      order.id
                    }
                    type="button"
                    onClick={() =>
                      openOrder(
                        order
                      )
                    }
                    className={`flex w-full items-center gap-4 p-5 text-left transition hover:bg-[#fff8fa] ${
                      cancelled
                        ? "opacity-60"
                        : ""
                    }`}
                  >

                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#fff0f4] text-xl">
                      {cancelled
                        ? "🚫"
                        : "🧾"}
                    </div>

                    <div className="min-w-0 flex-1">

                      <div className="flex flex-wrap items-center gap-2">

                        <p
                          className={`font-bold text-[#633c49] ${
                            cancelled
                              ? "line-through"
                              : ""
                          }`}
                        >
                          Hóa đơn #
                          {
                            order.id
                          }
                        </p>

                        {cancelled && (
                          <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-600">
                            Đã hủy
                          </span>
                        )}

                      </div>

                      <p className="mt-1 text-sm text-[#a47b87]">
                        {formatDateTime(
                          order.created_at
                        )}
                      </p>

                    </div>

                    <div className="text-right">

                      <p
                        className={`font-bold ${
                          cancelled
                            ? "text-[#a47b87] line-through"
                            : "text-[#d96f94]"
                        }`}
                      >
                        {formatPrice(
                          order.total
                        )}
                      </p>

                      <p className="mt-1 text-xs text-[#b18b96]">
                        Xem chi tiết
                      </p>

                    </div>

                    <span className="text-xl text-[#c596a5]">
                      ›
                    </span>

                  </button>
                );
              }
            )}

          </div>
        )}

      </section>

      {/* =====================
          POPUP CHI TIẾT
      ====================== */}

      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#4b2734]/40 p-4 backdrop-blur-sm"
          onMouseDown={(
            event
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeOrder();
            }
          }}
        >

          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[30px] bg-white shadow-2xl">

            {/* POPUP HEADER */}

            <div className="sticky top-0 z-10 border-b border-[#f5dfe6] bg-[#fff6f9] p-5">

              <div className="flex items-start justify-between gap-4">

                <div>

                  <p className="text-sm font-bold text-[#d96f94]">
                    Pink Coffee
                  </p>

                  <div className="mt-1 flex flex-wrap items-center gap-2">

                    <h2 className="text-xl font-bold text-[#633c49]">
                      🧾 Hóa đơn #
                      {
                        selectedOrder.id
                      }
                    </h2>

                    {selectedOrder.status ===
                      "cancelled" && (
                      <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-600">
                        Đã hủy
                      </span>
                    )}

                  </div>

                  <p className="mt-1 text-xs text-[#a47b87]">
                    {formatDateTime(
                      selectedOrder.created_at
                    )}
                  </p>

                </div>

                <button
                  type="button"
                  disabled={
                    cancelling
                  }
                  onClick={
                    closeOrder
                  }
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-xl font-bold text-[#805965] shadow-sm transition hover:bg-[#fff0f4] disabled:opacity-50"
                  aria-label="Đóng"
                >
                  ×
                </button>

              </div>

            </div>

            {/* POPUP BODY */}

            <div className="p-5">

              {selectedOrder.status ===
                "cancelled" && (
                <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4">

                  <p className="font-bold text-red-600">
                    🚫 Hóa đơn đã hủy
                  </p>

                  <p className="mt-1 text-sm text-red-500">
                    Hóa đơn này vẫn được giữ
                    trong lịch sử nhưng không
                    được tính vào doanh thu.
                  </p>

                </div>
              )}

              {/* ITEMS */}

              <div>

                <h3 className="mb-3 font-bold text-[#633c49]">
                  Chi tiết món
                </h3>

                {detailLoading ? (
                  <div className="rounded-2xl bg-[#fff8fa] py-10 text-center">

                    <div className="text-3xl">
                      ☕
                    </div>

                    <p className="mt-2 text-sm font-semibold text-[#a47b87]">
                      Đang tải chi tiết...
                    </p>

                  </div>
                ) : orderItems.length ===
                  0 ? (
                  <div className="rounded-2xl bg-[#fff8fa] p-6 text-center text-sm text-[#a47b87]">
                    Không tìm thấy món trong hóa đơn này.
                  </div>
                ) : (
                  <div className="space-y-3">

                    {orderItems.map(
                      (item) => {
                        const lineTotal =
                          Number(
                            item.price ||
                              0
                          ) *
                          Number(
                            item.quantity ||
                              0
                          );

                        return (
                          <div
                            key={
                              item.id
                            }
                            className="flex items-center gap-3 rounded-2xl border border-[#f8e8ed] bg-[#fffafb] p-4"
                          >

                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fff0f4]">
                              ☕
                            </div>

                            <div className="min-w-0 flex-1">

                              <p className="font-bold text-[#633c49]">
                                {
                                  item.product_name
                                }
                              </p>

                              <p className="mt-1 text-sm text-[#a47b87]">
                                {formatPrice(
                                  item.price
                                )}{" "}
                                ×{" "}
                                {
                                  item.quantity
                                }
                              </p>

                            </div>

                            <p className="font-bold text-[#633c49]">
                              {formatPrice(
                                lineTotal
                              )}
                            </p>

                          </div>
                        );
                      }
                    )}

                  </div>
                )}

              </div>

              {/* TOTAL */}

              <div className="mt-5 space-y-3 border-t border-[#f5dfe6] pt-5">

                <div className="flex items-center justify-between text-sm">

                  <span className="text-[#98717d]">
                    Tạm tính
                  </span>

                  <span className="font-semibold text-[#633c49]">
                    {formatPrice(
                      selectedOrder.subtotal
                    )}
                  </span>

                </div>

                <div className="flex items-center justify-between text-sm">

                  <span className="text-[#98717d]">
                    Giảm giá
                  </span>

                  <span className="font-semibold text-[#d96f94]">
                    -
                    {formatPrice(
                      selectedOrder.discount_amount
                    )}
                  </span>

                </div>

                <div className="flex items-center justify-between rounded-2xl bg-[#fff0f4] p-4">

                  <div>

                    <p className="text-xs font-semibold text-[#a47b87]">
                      Tổng thanh toán
                    </p>

                    <p className="mt-1 font-bold text-[#633c49]">
                      Thành tiền
                    </p>

                  </div>

                  <p className="text-2xl font-bold text-[#d96f94]">
                    {formatPrice(
                      selectedOrder.total
                    )}
                  </p>

                </div>

              </div>

              {/* CANCEL */}

              {selectedOrder.status !==
                "cancelled" && (
                <div className="mt-5 border-t border-[#f5dfe6] pt-5">

                  <button
                    type="button"
                    disabled={
                      cancelling
                    }
                    onClick={
                      cancelOrder
                    }
                    className="w-full rounded-2xl border border-red-200 bg-red-50 py-3.5 font-bold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {cancelling
                      ? "Đang hủy hóa đơn..."
                      : "🚫 Hủy hóa đơn"}
                  </button>

                  <p className="mt-2 text-center text-xs text-[#a47b87]">
                    Hóa đơn hủy vẫn được giữ lại trong lịch sử.
                  </p>

                </div>
              )}

              {selectedOrder.status ===
                "cancelled" && (
                <div className="mt-5 rounded-2xl bg-[#f7f2f4] p-4 text-center text-sm font-semibold text-[#98717d]">
                  🚫 Hóa đơn này đã được hủy.
                </div>
              )}

            </div>

          </div>

        </div>
      )}

    </div>
  );
}