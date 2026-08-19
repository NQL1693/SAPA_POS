"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  const [loading, setLoading] =
    useState(false);

  async function logout() {
    const confirmed = window.confirm(
      "Đăng xuất khỏi Sapa Coffee POS?"
    );

    if (!confirmed) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "/api/auth/logout",
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error(
          "Không thể đăng xuất."
        );
      }

      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error(error);

      window.alert(
        "Đăng xuất thất bại."
      );

      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={loading}
      title="Đăng xuất"
      aria-label="Đăng xuất"
      className="flex h-10 sm:h-11 shrink-0 items-center justify-center rounded-2xl bg-[#fff0f4] px-3 font-bold text-[#d96f94] transition active:scale-95 hover:bg-[#ffe5ed] disabled:opacity-50 sm:px-4"
    >
      {loading ? (
        <span className="text-sm">
          ...
        </span>
      ) : (
        <>
          <span className="text-base">
            🔒
          </span>

          <span className="ml-2 hidden text-sm sm:inline">
            Đăng xuất
          </span>
        </>
      )}
    </button>
  );
}
