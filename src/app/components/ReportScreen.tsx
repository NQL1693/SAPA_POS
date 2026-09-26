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



type FilterType = "today" | "month" | "custom";



type ProductReport = {

  key: string;

  name: string;

  quantity: number;

  grossRevenue: number;

  discount: number;

  netRevenue: number;

  cost: number;

  profit: number;

};



function formatPrice(value: number) {

  return (

    new Intl.NumberFormat("vi-VN").format(Math.round(value)) + "đ"

  );

}



function getLocalDateString(date: Date) {

  const year = date.getFullYear();



  const month = String(date.getMonth() + 1).padStart(2, "0");



  const day = String(date.getDate()).padStart(2, "0");



  return `${year}-${month}-${day}`;

}



function startOfLocalDay(dateString: string) {

  return new Date(`${dateString}T00:00:00`);

}



function endOfLocalDay(dateString: string) {

  return new Date(`${dateString}T23:59:59.999`);

}



function ReportCard({

  icon,

  label,

  value,

}: {

  icon: string;

  label: string;

  value: string;

}) {

  return (

    <div className="rounded-[26px] border border-[#f2d6df] bg-white p-5 shadow-sm">

      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff0f4] text-xl">

        {icon}

      </div>



      <p className="text-sm text-[#a47b87]">{label}</p>



      <p className="mt-1 text-2xl font-bold text-[#633c49]">

        {value}

      </p>

    </div>

  );

}



function SmallCard({

  label,

  value,

}: {

  label: string;

  value: string;

}) {

  return (

    <div className="rounded-2xl border border-[#f2d6df] bg-[#fffafb] p-4">

      <p className="text-xs font-semibold text-[#a47b87]">

        {label}

      </p>



      <p className="mt-1 text-lg font-bold text-[#633c49]">

        {value}

      </p>

    </div>

  );

}



export default function ReportScreen() {

  const today = getLocalDateString(new Date());



  const [orders, setOrders] = useState<Order[]>([]);

  const [items, setItems] = useState<OrderItem[]>([]);



  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");



  const [filterType, setFilterType] =

    useState<FilterType>("today");



  const [fromDate, setFromDate] = useState(today);

  const [toDate, setToDate] = useState(today);



  const loadReport = useCallback(async () => {

    setLoading(true);

    setError("");



    let startDate: Date;

    let finishDate: Date;



    if (filterType === "today") {

      startDate = startOfLocalDay(today);

      finishDate = endOfLocalDay(today);

    } else if (filterType === "month") {

      const now = new Date();



      startDate = new Date(

        now.getFullYear(),

        now.getMonth(),

        1,

        0,

        0,

        0,

        0

      );



      finishDate = new Date(

        now.getFullYear(),

        now.getMonth() + 1,

        0,

        23,

        59,

        59,

        999

      );

    } else {

      startDate = startOfLocalDay(fromDate);

      finishDate = endOfLocalDay(toDate);

    }



    if (startDate.getTime() > finishDate.getTime()) {

      setError(

        "Ngày bắt đầu không thể lớn hơn ngày kết thúc."

      );



      setOrders([]);

      setItems([]);

      setLoading(false);

      return;

    }



    // Tải toàn bộ hóa đơn theo từng trang để không bị giới hạn 1.000 dòng.
    const PAGE_SIZE = 1000;
    const loadedOrders: Order[] = [];
    let orderFrom = 0;

    while (true) {
      const { data: orderPage, error: orderError } = await supabase
        .from("orders")
        .select(
          "id, subtotal, discount_amount, total, status, created_at"
        )
        .eq("status", "completed")
        .gte("created_at", startDate.toISOString())
        .lte("created_at", finishDate.toISOString())
        .order("created_at", { ascending: false })
        .range(orderFrom, orderFrom + PAGE_SIZE - 1);

      if (orderError) {
        console.error("Lỗi tải orders:", orderError);
        setError("Không tải được hóa đơn: " + orderError.message);
        setOrders([]);
        setItems([]);
        setLoading(false);
        return;
      }

      const page = (orderPage as Order[]) ?? [];
      loadedOrders.push(...page);

      if (page.length < PAGE_SIZE) break;
      orderFrom += PAGE_SIZE;
    }

    setOrders(loadedOrders);

    if (loadedOrders.length === 0) {
      setItems([]);
      setLoading(false);
      return;
    }

    // Tải toàn bộ chi tiết hóa đơn. Chia order id thành nhóm nhỏ và
    // tiếp tục phân trang để order_items cũng không bị giới hạn 1.000 dòng.
    const orderIds = loadedOrders.map((order) => order.id);
    const loadedItems: OrderItem[] = [];
    const ID_CHUNK_SIZE = 200;

    for (let i = 0; i < orderIds.length; i += ID_CHUNK_SIZE) {
      const idChunk = orderIds.slice(i, i + ID_CHUNK_SIZE);
      let itemFrom = 0;

      while (true) {
        const { data: itemPage, error: itemError } = await supabase
          .from("order_items")
          .select(
            "id, order_id, product_id, product_name, quantity, price, cost"
          )
          .in("order_id", idChunk)
          .order("id", { ascending: true })
          .range(itemFrom, itemFrom + PAGE_SIZE - 1);

        if (itemError) {
          console.error("Lỗi tải order_items:", itemError);
          setError(
            "Không tải được chi tiết hóa đơn: " + itemError.message
          );
          setItems([]);
          setLoading(false);
          return;
        }

        const page = (itemPage as OrderItem[]) ?? [];
        loadedItems.push(...page);

        if (page.length < PAGE_SIZE) break;
        itemFrom += PAGE_SIZE;
      }
    }

    setItems(loadedItems);
    setLoading(false);

  }, [filterType, fromDate, toDate, today]);



  useEffect(() => {

    loadReport();

  }, [loadReport]);



  const totalRevenue = useMemo(() => {

    return orders.reduce(

      (sum, order) => sum + Number(order.total || 0),

      0

    );

  }, [orders]);



  const totalBeforeDiscount = useMemo(() => {

    return orders.reduce(

      (sum, order) => sum + Number(order.subtotal || 0),

      0

    );

  }, [orders]);



  const totalDiscount = useMemo(() => {

    return orders.reduce(

      (sum, order) =>

        sum + Number(order.discount_amount || 0),

      0

    );

  }, [orders]);



  const totalCost = useMemo(() => {

    return items.reduce(

      (sum, item) =>

        sum +

        Number(item.cost || 0) *

          Number(item.quantity || 0),

      0

    );

  }, [items]);



  const totalProfit = totalRevenue - totalCost;



  const totalQuantity = useMemo(() => {

    return items.reduce(

      (sum, item) => sum + Number(item.quantity || 0),

      0

    );

  }, [items]);



  const productReports = useMemo(() => {

    const result = new Map<string, ProductReport>();



    const ordersById = new Map<number, Order>();



    orders.forEach((order) => {

      ordersById.set(order.id, order);

    });



    items.forEach((item) => {

      const order = ordersById.get(item.order_id);



      if (!order) {

        return;

      }



      const quantity = Number(item.quantity || 0);

      const price = Number(item.price || 0);

      const unitCost = Number(item.cost || 0);



      const grossRevenue = price * quantity;

      const itemCost = unitCost * quantity;



      const orderSubtotal = Number(order.subtotal || 0);

      const orderTotal = Number(order.total || 0);



      /*

        Tính tỷ lệ số tiền thực thu sau giảm giá.



        Ví dụ:

        subtotal = 100.000

        total    = 90.000



        tỷ lệ thực thu = 90%

      */

      const revenueRatio =

        orderSubtotal > 0

          ? Math.max(

              0,

              Math.min(1, orderTotal / orderSubtotal)

            )

          : 0;



      /*

        Phân bổ giảm giá cho món theo tỷ lệ giá trị của món

        trong hóa đơn.

      */

      const netRevenue = grossRevenue * revenueRatio;



      const allocatedDiscount =

        grossRevenue - netRevenue;



      const profit = netRevenue - itemCost;



      /*

        Dùng product_id nếu có.



        Như vậy hai món trùng tên vẫn không bị gộp nhầm.

      */

      const key =

        item.product_id !== null

          ? `product-${item.product_id}`

          : `name-${item.product_name}`;



      const existing = result.get(key);



      if (existing) {

        existing.quantity += quantity;

        existing.grossRevenue += grossRevenue;

        existing.discount += allocatedDiscount;

        existing.netRevenue += netRevenue;

        existing.cost += itemCost;

        existing.profit += profit;

      } else {

        result.set(key, {

          key,

          name: item.product_name || "Không rõ món",

          quantity,

          grossRevenue,

          discount: allocatedDiscount,

          netRevenue,

          cost: itemCost,

          profit,

        });

      }

    });



    return Array.from(result.values()).sort(

      (a, b) => b.quantity - a.quantity

    );

  }, [orders, items]);



  return (

    <div className="space-y-5">



      {/* HEADER */}

      <section className="rounded-[28px] border border-[#f2d6df] bg-white p-5 shadow-sm">

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <p className="text-sm font-bold text-[#d96f94]">

              📊 Sapa Coffee

            </p>



            <h1 className="mt-1 text-2xl font-bold text-[#633c49]">

              Báo cáo bán hàng

            </h1>



            <p className="mt-1 text-sm text-[#a47b87]">

              Theo dõi doanh thu, giá vốn và lợi nhuận.

            </p>

          </div>



          <button

            type="button"

            disabled={loading}

            onClick={loadReport}

            className="rounded-2xl bg-[#fff0f4] px-4 py-2.5 text-sm font-bold text-[#d96f94] transition hover:bg-[#ffe5ed] disabled:opacity-50"

          >

            {loading ? "Đang tải..." : "🔄 Làm mới"}

          </button>

        </div>

      </section>



      {/* FILTER */}

      <section className="rounded-[28px] border border-[#f2d6df] bg-white p-5 shadow-sm">

        <p className="mb-3 text-sm font-bold text-[#633c49]">

          Thời gian báo cáo

        </p>



        <div className="flex flex-wrap gap-2">

          <button

            type="button"

            onClick={() => setFilterType("today")}

            className={`rounded-2xl px-4 py-2.5 text-sm font-bold ${

              filterType === "today"

                ? "bg-[#e88eab] text-white"

                : "bg-[#fff0f4] text-[#805965]"

            }`}

          >

            Hôm nay

          </button>



          <button

            type="button"

            onClick={() => setFilterType("month")}

            className={`rounded-2xl px-4 py-2.5 text-sm font-bold ${

              filterType === "month"

                ? "bg-[#e88eab] text-white"

                : "bg-[#fff0f4] text-[#805965]"

            }`}

          >

            Tháng này

          </button>



          <button

            type="button"

            onClick={() => setFilterType("custom")}

            className={`rounded-2xl px-4 py-2.5 text-sm font-bold ${

              filterType === "custom"

                ? "bg-[#e88eab] text-white"

                : "bg-[#fff0f4] text-[#805965]"

            }`}

          >

            Tùy chọn

          </button>

        </div>



        {filterType === "custom" && (

          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">

            <div>

              <label className="mb-1 block text-xs font-bold text-[#98717d]">

                Từ ngày

              </label>



              <input

                type="date"

                value={fromDate}

                onChange={(event) =>

                  setFromDate(event.target.value)

                }

                className="w-full rounded-2xl border border-[#efd5df] px-4 py-3 outline-none focus:border-[#e996b2]"

              />

            </div>



            <div>

              <label className="mb-1 block text-xs font-bold text-[#98717d]">

                Đến ngày

              </label>



              <input

                type="date"

                value={toDate}

                onChange={(event) =>

                  setToDate(event.target.value)

                }

                className="w-full rounded-2xl border border-[#efd5df] px-4 py-3 outline-none focus:border-[#e996b2]"

              />

            </div>



            <button

              type="button"

              disabled={loading}

              onClick={loadReport}

              className="self-end rounded-2xl bg-[#633c49] px-5 py-3 font-bold text-white disabled:opacity-50"

            >

              Xem báo cáo

            </button>

          </div>

        )}

      </section>



      {error && (

        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 font-semibold text-red-700">

          ⚠️ {error}

        </div>

      )}



      {loading ? (

        <div className="flex min-h-[350px] items-center justify-center rounded-[28px] bg-white">

          <div className="text-center">

            <div className="text-5xl">📊</div>



            <p className="mt-3 font-semibold text-[#a47b87]">

              Đang tính báo cáo...

            </p>

          </div>

        </div>

      ) : (

        <>

          {/* TỔNG QUAN */}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

            <ReportCard

              icon="💰"

              label="Doanh thu thực thu"

              value={formatPrice(totalRevenue)}

            />



            <ReportCard

              icon="📈"

              label="Lợi nhuận"

              value={formatPrice(totalProfit)}

            />



            <ReportCard

              icon="🧾"

              label="Số hóa đơn"

              value={String(orders.length)}

            />



            <ReportCard

              icon="🥤"

              label="Tổng món đã bán"

              value={String(totalQuantity)}

            />

          </div>



          <div className="grid gap-3 sm:grid-cols-3">

            <SmallCard

              label="Doanh thu trước giảm"

              value={formatPrice(totalBeforeDiscount)}

            />



            <SmallCard

              label="Tổng tiền giảm giá"

              value={formatPrice(totalDiscount)}

            />



            <SmallCard

              label="Tổng giá vốn"

              value={formatPrice(totalCost)}

            />

          </div>



          {/* CHI TIẾT MÓN */}

          <section className="overflow-hidden rounded-[28px] border border-[#f2d6df] bg-white shadow-sm">

            <div className="border-b border-[#f5dfe6] p-5">

              <h2 className="text-lg font-bold text-[#633c49]">

                🏆 Chi tiết từng món

              </h2>



              <p className="mt-1 text-sm text-[#a47b87]">

                Giảm giá của hóa đơn đã được phân bổ vào từng món.

              </p>

            </div>



            {productReports.length === 0 ? (

              <div className="p-12 text-center">

                <div className="text-5xl">🧋</div>



                <p className="mt-3 font-bold text-[#633c49]">

                  Chưa có món nào được bán

                </p>



                <p className="mt-1 text-sm text-[#a47b87]">

                  Hãy tạo một hóa đơn ở trang Thu ngân.

                </p>

              </div>

            ) : (

              <>

              <div className="space-y-3 p-4 md:hidden">

                {productReports.map((product) => (

                  <article

                    key={product.key}

                    className="rounded-2xl border border-[#f4dce4] bg-[#fffafb] p-4"

                  >

                    <div className="flex items-start justify-between gap-3">

                      <div className="min-w-0">

                        <p className="break-words font-bold text-[#633c49]">

                          {product.name}

                        </p>

                        <p className="mt-1 text-sm font-bold text-[#d96f94]">

                          Đã bán: {product.quantity}

                        </p>

                      </div>



                      <div className="text-right">

                        <p className="text-xs text-[#a47b87]">

                          Lợi nhuận

                        </p>

                        <p className="font-bold text-[#633c49]">

                          {formatPrice(product.profit)}

                        </p>

                      </div>

                    </div>



                    <div className="mt-4 grid grid-cols-2 gap-2">

                      <div className="rounded-xl bg-white p-3">

                        <p className="text-[11px] font-semibold uppercase text-[#b18793]">

                          Trước giảm

                        </p>

                        <p className="mt-1 text-sm font-semibold text-[#633c49]">

                          {formatPrice(product.grossRevenue)}

                        </p>

                      </div>



                      <div className="rounded-xl bg-white p-3">

                        <p className="text-[11px] font-semibold uppercase text-[#b18793]">

                          Giảm giá

                        </p>

                        <p className="mt-1 text-sm font-semibold text-[#d96f94]">

                          -{formatPrice(product.discount)}

                        </p>

                      </div>



                      <div className="rounded-xl bg-white p-3">

                        <p className="text-[11px] font-semibold uppercase text-[#b18793]">

                          Thực thu

                        </p>

                        <p className="mt-1 text-sm font-semibold text-[#633c49]">

                          {formatPrice(product.netRevenue)}

                        </p>

                      </div>



                      <div className="rounded-xl bg-white p-3">

                        <p className="text-[11px] font-semibold uppercase text-[#b18793]">

                          Giá vốn

                        </p>

                        <p className="mt-1 text-sm font-semibold text-[#805965]">

                          {formatPrice(product.cost)}

                        </p>

                      </div>

                    </div>

                  </article>

                ))}

              </div>



              <div className="hidden overflow-x-auto md:block">

                <table className="w-full min-w-[900px]">

                  <thead className="bg-[#fff7f9] text-left text-sm text-[#98717d]">

                    <tr>

                      <th className="px-5 py-4">

                        Món

                      </th>



                      <th className="px-5 py-4 text-center">

                        Đã bán

                      </th>



                      <th className="px-5 py-4 text-right">

                        Trước giảm

                      </th>



                      <th className="px-5 py-4 text-right">

                        Giảm giá

                      </th>



                      <th className="px-5 py-4 text-right">

                        Thực thu

                      </th>



                      <th className="px-5 py-4 text-right">

                        Giá vốn

                      </th>



                      <th className="px-5 py-4 text-right">

                        Lợi nhuận

                      </th>

                    </tr>

                  </thead>



                  <tbody>

                    {productReports.map((product) => (

                      <tr

                        key={product.key}

                        className="border-t border-[#f8e8ed]"

                      >

                        <td className="px-5 py-4 font-bold text-[#633c49]">

                          {product.name}

                        </td>



                        <td className="px-5 py-4 text-center font-bold text-[#d96f94]">

                          {product.quantity}

                        </td>



                        <td className="px-5 py-4 text-right">

                          {formatPrice(product.grossRevenue)}

                        </td>



                        <td className="px-5 py-4 text-right text-[#d96f94]">

                          -{formatPrice(product.discount)}

                        </td>



                        <td className="px-5 py-4 text-right font-semibold">

                          {formatPrice(product.netRevenue)}

                        </td>



                        <td className="px-5 py-4 text-right text-[#98717d]">

                          {formatPrice(product.cost)}

                        </td>



                        <td className="px-5 py-4 text-right font-bold text-[#633c49]">

                          {formatPrice(product.profit)}

                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>

              </>

            )}

          </section>

        </>

      )}

    </div>

  );

}
