"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function TestSupabasePage() {
  const [message, setMessage] = useState("⏳ Đang kiểm tra...");
  const [data, setData] = useState<unknown>(null);

  useEffect(() => {
    async function testConnection() {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .limit(5);

      if (error) {
        console.error(error);
        setMessage("❌ Kết nối hoặc truy vấn Supabase bị lỗi");
        setData(error);
        return;
      }

      setMessage("✅ POS ĐÃ KẾT NỐI VỚI SUPABASE!");
      setData(data);
    }

    testConnection();
  }, []);

  return (
    <main className="min-h-screen bg-[#fff5f8] p-8 text-[#4a3038]">
      <div className="mx-auto max-w-2xl rounded-3xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">
          🩷 Test Supabase
        </h1>

        <p className="mt-5 text-lg font-bold">
          {message}
        </p>

        <pre className="mt-6 overflow-auto rounded-2xl bg-[#fff0f4] p-4 text-sm">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </main>
  );
}