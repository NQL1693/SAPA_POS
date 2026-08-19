"use client";

import { useEffect, useState } from "react";

export type PaymentResult = {
  discountType: "percent" | "amount";
  discountValue: number;
  discountAmount: number;
  total: number;
};

type PaymentDialogProps = {
  subtotal: number;
  saving: boolean;
  onClose: () => void;
  onConfirm: (result: PaymentResult) => void;
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("vi-VN").format(price) + "đ";
}

export function PaymentDialog({
  subtotal,
  saving,
  onClose,
  onConfirm,
}: PaymentDialogProps) {
  const [discountType, setDiscountType] =
    useState<"percent" | "amount">("percent");

  const [discountInput, setDiscountInput] = useState("");

  useEffect(() => {
    setDiscountInput("");
  }, [discountType]);

  const rawValue = Number(discountInput) || 0;

  const discountValue = Math.max(0, rawValue);

  const safePercent = Math.min(discountValue, 100);

  const discountAmount =
    discountType === "percent"
      ? Math.min(
          subtotal,
          Math.round((subtotal * safePercent) / 100)
        )
      : Math.min(discountValue, subtotal);

  const finalTotal = Math.max(
    0,
    subtotal - discountAmount
  );

  function handleConfirm() {
    onConfirm({
      discountType,
      discountValue:
        discountType === "percent"
          ? safePercent
          : discountValue,
      discountAmount,
      total: finalTotal,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#4b2734]/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-[30px] bg-white shadow-2xl">

        {/* HEADER */}
        <div className="border-b border-[#f5dfe6] bg-[#fff6f9] px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[#d96f94]">
                Pink Coffee
              </p>

              <h2 className="mt-1 text-xl font-bold text-[#633c49]">
                💗 Thanh toán
              </h2>

              <p className="mt-1 text-sm text-[#a47b87]">
                Kiểm tra hóa đơn trước khi xác nhận
              </p>
            </div>

            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl text-[#8d5968] shadow-sm transition hover:bg-[#ffeaf0] disabled:opacity-40"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6">

          {/* SUBTOTAL */}
          <div className="mb-6 flex items-center justify-between">
            <span className="text-[#98717d]">
              Tạm tính
            </span>

            <span className="text-lg font-bold text-[#633c49]">
              {formatPrice(subtotal)}
            </span>
          </div>

          {/* DISCOUNT */}
          <div className="mb-6">
            <label className="mb-3 block text-sm font-bold text-[#633c49]">
              Giảm giá
            </label>

            <div className="mb-3 grid grid-cols-2 gap-2 rounded-2xl bg-[#fff0f4] p-1">
              <button
                type="button"
                disabled={saving}
                onClick={() => setDiscountType("percent")}
                className={`rounded-xl py-3 text-sm font-bold transition ${
                  discountType === "percent"
                    ? "bg-white text-[#d96f94] shadow-sm"
                    : "text-[#98717d]"
                }`}
              >
                % Phần trăm
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={() => setDiscountType("amount")}
                className={`rounded-xl py-3 text-sm font-bold transition ${
                  discountType === "amount"
                    ? "bg-white text-[#d96f94] shadow-sm"
                    : "text-[#98717d]"
                }`}
              >
                VNĐ
              </button>
            </div>

            <div className="relative">
              <input
                type="number"
                min="0"
                max={
                  discountType === "percent"
                    ? 100
                    : undefined
                }
                disabled={saving}
                value={discountInput}
                onChange={(event) =>
                  setDiscountInput(event.target.value)
                }
                placeholder={
                  discountType === "percent"
                    ? "Ví dụ: 10"
                    : "Ví dụ: 20000"
                }
                className="w-full rounded-2xl border border-[#efd5df] bg-white px-4 py-3.5 pr-14 text-lg font-semibold text-[#633c49] outline-none transition focus:border-[#e996b2] focus:ring-4 focus:ring-[#f8dce5]"
              />

              <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-[#d96f94]">
                {discountType === "percent" ? "%" : "đ"}
              </span>
            </div>
          </div>

          {/* DISCOUNT MONEY */}
          <div className="mb-4 rounded-2xl bg-[#fff7f9] p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#98717d]">
                Tiền giảm
              </span>

              <span className="font-bold text-[#d96f94]">
                -{formatPrice(discountAmount)}
              </span>
            </div>
          </div>

          {/* TOTAL */}
          <div className="mb-6 rounded-[26px] bg-gradient-to-br from-[#fff0f4] to-[#ffe2eb] p-5">
            <p className="text-sm font-semibold text-[#98717d]">
              Khách cần thanh toán
            </p>

            <p className="mt-1 text-3xl font-bold text-[#c85e82]">
              {formatPrice(finalTotal)}
            </p>

            {discountAmount > 0 && (
              <p className="mt-2 text-xs text-[#a47b87]">
                Đã giảm {formatPrice(discountAmount)}
              </p>
            )}
          </div>

          {/* BUTTONS */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="rounded-2xl border border-[#efd5df] py-3.5 font-bold text-[#805965] transition hover:bg-[#fff5f8] disabled:opacity-40"
            >
              Quay lại
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={handleConfirm}
              className="rounded-2xl bg-gradient-to-r from-[#e88eab] to-[#d96f94] py-3.5 font-bold text-white shadow-lg shadow-[#e6a1b8]/30 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Đang lưu..."
                : "💗 Xác nhận"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
