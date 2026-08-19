export default function Header() {
  return (
    <header className="flex items-center justify-between border-b border-[#f4d8e1] bg-white px-5 py-4 shadow-sm md:px-8">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f8c8d8] text-2xl shadow-sm">
          🌸
        </div>

        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#633c49]">
            Pink Coffee
          </h1>

          <p className="text-xs text-[#a47b87]">
            Thu ngân
          </p>
        </div>
      </div>

      <div className="hidden rounded-2xl bg-[#fff0f4] px-4 py-2 text-right sm:block">
        <p className="text-xs text-[#a47b87]">
          Hôm nay
        </p>

        <p className="font-semibold text-[#633c49]">
          17 tháng 8, 2026
        </p>
      </div>
    </header>
  );
}