"use client";

import { LogoutButton } from "./LogoutButton";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-[#f2d6df] bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-3 px-3 py-2.5 sm:px-4 sm:py-3 md:px-6">

        {/* LOGO + NAME */}
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#fff0f4] to-[#ffdce7] text-xl shadow-sm">
            ☕
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-base font-extrabold tracking-tight text-[#633c49] sm:text-lg">
              Sapa Coffee POS
            </h1>

            <p className="hidden text-xs font-medium text-[#a47b87] sm:block">
              Quản lý bán hàng
            </p>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex shrink-0 items-center gap-2">
          <LogoutButton />
        </div>

      </div>
    </header>
  );
}