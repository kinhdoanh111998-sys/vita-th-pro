import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/portal/contacts")({
  component: PortalContacts,
});

type Contact = {
  id: string;
  created_at: string | null;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  message: string | null;
  affiliate_ref: string | null;
  status: string | null;
};

const fmtDate = (s: string | null) => {
  if (!s) return "—";
  const d = new Date(s);
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

function PortalContacts() {
  const qc = useQueryClient();

  const contactsQ = useQuery({
    queryKey: ["portal", "contacts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Contact[];
    },
  });

  const markProcessed = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("contacts")
        .update({ status: "processed" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Đã cập nhật trạng thái sang 'Đã xử lý'.");
      qc.invalidateQueries({ queryKey: ["portal", "contacts"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = contactsQ.data ?? [];

  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      <div>
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-brand-text">
          Danh sách Khách hàng Liên hệ
        </h1>
        <p className="font-body text-brand-muted text-sm mt-2">
          {contactsQ.isLoading
            ? "Đang tải danh sách..."
            : `${rows.length} liên hệ từ website`}
        </p>
      </div>

      {contactsQ.error && (
        <div className="text-sm text-status-error bg-status-error/10 border border-status-error/20 rounded-card p-3">
          {(contactsQ.error as Error).message}
        </div>
      )}

      <div className="bg-brand-surface rounded-card border border-brand-border shadow-sm p-6">
        <div className="overflow-auto">
          <table className="w-full min-w-[960px] border-collapse">
            <thead>
              <tr className="border-b border-brand-border">
                {[
                  "Ngày gửi",
                  "Họ tên",
                  "Số điện thoại",
                  "Nội dung tư vấn",
                  "Nguồn giới thiệu",
                  "Trạng thái",
                  "Thao tác",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left px-3 py-3 text-xs font-bold uppercase tracking-wider text-brand-muted"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {contactsQ.isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-brand-border/60">
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-3 py-3">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-3 py-12 text-center text-brand-muted font-medium"
                  >
                    Chưa có liên hệ nào từ website.
                  </td>
                </tr>
              ) : (
                rows.map((c) => {
                  const isProcessed = c.status === "processed";
                  return (
                    <tr
                      key={c.id}
                      className="border-b border-brand-border/60 hover:bg-brand-bg/40 align-top"
                    >
                      <td className="px-3 py-3 text-sm text-brand-text whitespace-nowrap">
                        {fmtDate(c.created_at)}
                      </td>
                      <td className="px-3 py-3 text-sm font-semibold text-brand-text">
                        {c.full_name ?? "—"}
                        {c.email && (
                          <div className="text-xs text-brand-muted font-normal mt-0.5">
                            {c.email}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 text-sm text-brand-text whitespace-nowrap">
                        {c.phone ? (
                          <a
                            href={`tel:${c.phone}`}
                            className="hover:text-brand-primary"
                          >
                            {c.phone}
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-3 py-3 text-sm text-brand-text max-w-[320px]">
                        <div className="line-clamp-3 whitespace-pre-line">
                          {c.message ?? "—"}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-sm">
                        {c.affiliate_ref ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-brand-primary-light text-brand-primary font-bold text-xs">
                            {c.affiliate_ref}
                          </span>
                        ) : (
                          <span className="text-brand-muted text-xs">
                            Trực tiếp
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-md text-xs font-semibold ${
                            isProcessed
                              ? "bg-status-success text-white"
                              : "bg-status-warning text-white"
                          }`}
                        >
                          {isProcessed ? "Đã xử lý" : "Chờ xử lý"}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        {isProcessed ? (
                          <span className="text-xs text-brand-muted">—</span>
                        ) : (
                          <button
                            onClick={() => markProcessed.mutate(c.id)}
                            disabled={markProcessed.isPending}
                            className="inline-flex items-center gap-1.5 h-[36px] px-3 rounded-[8px] bg-brand-primary hover:bg-brand-primary-dark disabled:opacity-60 text-white text-xs font-semibold transition-colors"
                          >
                            <CheckCircle2 size={14} /> Đã xử lý
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
