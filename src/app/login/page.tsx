"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!pin) {
      setError("Hãy nhập mã PIN.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pin,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message ??
            "Mã PIN không đúng."
        );

        setPin("");
        setLoading(false);
        return;
      }

      router.replace("/");
      router.refresh();
    } catch {
      setError(
        "Không thể kết nối tới hệ thống."
      );

      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fff5f8] p-5 text-[#4a3038]">
      <div className="w-full max-w-sm">
        <div className="rounded-[32px] border border-[#f2d6df] bg-white p-7 shadow-xl">

          <div className="text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[26px] bg-[#fff0f4] text-4xl shadow-sm">
              ☕
            </div>

            <p className="mt-5 text-sm font-bold text-[#d96f94]">
              PINK COFFEE
            </p>

            <h1 className="mt-1 text-2xl font-bold text-[#633c49]">
              Pink Coffee POS
            </h1>

            <p className="mt-2 text-sm text-[#a47b87]">
              Nhập mã PIN để mở hệ thống
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-7"
          >
            <label className="mb-2 block text-sm font-bold text-[#633c49]">
              🔐 Mã PIN
            </label>

            <input
              type="password"
              inputMode="numeric"
              autoComplete="off"
              autoFocus
              maxLength={6}
              value={pin}
              onChange={(event) =>
                setPin(
                  event.target.value.replace(
                    /\D/g,
                    ""
                  )
                )
              }
              placeholder="••••••"
              className="w-full rounded-2xl border border-[#efd5df] bg-[#fffafb] px-4 py-4 text-center text-2xl font-bold tracking-[0.5em] text-[#633c49] outline-none transition focus:border-[#e996b2] focus:ring-4 focus:ring-[#f8dce5]"
            />

            {error && (
              <div className="mt-3 rounded-2xl border border-red-100 bg-red-50 p-3 text-center text-sm font-semibold text-red-600">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={
                loading ||
                pin.length === 0
              }
              className="mt-5 w-full rounded-2xl bg-gradient-to-r from-[#e989a9] to-[#d96f94] py-4 font-bold text-white shadow-md transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Đang mở POS..."
                : "Mở Pink Coffee POS"}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-[#b48e99]">
            🔒 Phiên đăng nhập được lưu trên thiết bị này.
          </p>

        </div>
      </div>
    </main>
  );
}