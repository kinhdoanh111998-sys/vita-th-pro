import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { AdminTopbar } from "@/components/AdminTopbar";
import { DataTable } from "@/components/DataTable";

export const Route = createFileRoute("/admin/employees")({
  component: EmployeesAdmin,
});

function EmployeesAdmin() {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("users").select("*").order("created_at", {
        ascending: false,
      });
      if (error) {
        // Fallback without order (in case created_at missing)
        const retry = await supabase.from("users").select("*");
        if (retry.error) setError(retry.error.message);
        else setRows(retry.data ?? []);
      } else {
        setRows(data ?? []);
      }
      setLoading(false);
    })();
  }, []);

  return (
    <>
      <AdminTopbar title="Nhân viên" subtitle={loading ? "Đang tải..." : `${rows.length} bản ghi`} />
      {error && (
        <div className="mb-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl p-3">
          Lỗi tải dữ liệu: {error}
        </div>
      )}
      <DataTable
        columns={[
          { key: "id", label: "Mã" },
          { key: "full_name", label: "Họ tên" },
          { key: "phone", label: "SĐT" },
          { key: "role", label: "Vai trò" },
          { key: "status", label: "Trạng thái" },
        ]}
        rows={rows}
      />
    </>
  );
}
