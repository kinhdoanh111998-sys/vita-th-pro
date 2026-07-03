import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Skeleton } from "@/components/ui/skeleton";

type ContactRow = {
  id: string;
  created_at: string | null;
  full_name: string | null;
  name: string | null;
  phone: string | null;
  email: string | null;
  message: string | null;
  content: string | null;
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

export function ContactsConsultTable() {
  const qc = useQueryClient();

  const contactsQ = useQuery({
    queryKey: ["admin", "contacts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ContactRow[];
    },
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("admin-contacts-rt")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "contacts" },
        () => {
          qc.invalidateQueries({ queryKey: ["admin", "contacts"] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  const markProcessed = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("contacts")
        .update({ status: "processed" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Đã cập nhật trạng thái sang 'Đã liên hệ'.");
      qc.invalidateQueries({ queryKey: ["admin", "contacts"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reopen = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("contacts")
        .update({ status: "pending" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Đã đưa về trạng thái 'Chờ xử lý'.");
      qc.invalidateQueries({ queryKey: ["admin", "contacts"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = contactsQ.data ?? [];

  return (
    <section className="mt-8">
      <div className="bg-brand-surface rounded-card border border-brand-border shadow-sm p-6">
        <div className="mb-5 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-brand-text">
              Toàn bộ lịch tư vấn
            </h2>
            <p className="font-body text-brand-muted text-sm mt-1">
              {contactsQ.isLoading
                ? "Đang tải danh sách..."
                : `${rows.length} yêu cầu tư vấn từ form liên hệ · cập nhật thời gian thực`}
            </p>
          </div>
        </div>

        {contactsQ.error && (
          <div className="text-sm text-status-error bg-status-error/10 border border-status-error/20 rounded-card p-3 mb-4">
            {(contactsQ.error as Error).message}
          </div>
        )}

        <div className="overflow-auto">
          <table className="w-full min-w-[1040px] border-collapse">
            <thead>
              <tr className="border-b border-brand-border">
                {[
                  "STT",
                  "Họ và Tên",
                  "Số điện thoại",
                  "Email",
                  "Nội dung yêu cầu / Ghi chú",
                  "Ngày gửi",
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
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-brand-border/60">
                    {Array.from({ length: 8 }).map((__, j) => (
                      <td key={j} className="px-3 py-3">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-3 py-12 text-center text-brand-muted font-medium"
                  >
                    Chưa có yêu cầu tư vấn nào từ website.
                  </td>
                </tr>
              ) : (
                rows.map((c, idx) => {
                  const isProcessed = c.status === "processed";
                  const displayName = c.full_name ?? c.name ?? "—";
                  const displayMessage = c.message ?? c.content ?? "—";
                  return (
                    <tr
                      key={c.id}
                      className="border-b border-brand-border/60 hover:bg-brand-bg/40 align-top"
                    >
                      <td className="px-3 py-3 text-sm text-brand-muted font-medium">
                        {idx + 1}
                      </td>
                      <td className="px-3 py-3 text-sm font-semibold text-brand-text">
                        {displayName}
                        {c.affiliate_ref && (
                          <div className="mt-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-brand-primary-light text-brand-primary font-bold text-[11px]">
                              REF: {c.affiliate_ref}
                            </span>
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
                      <td className="px-3 py-3 text-sm text-brand-text">
                        {c.email ? (
                          <a
                            href={`mailto:${c.email}`}
                            className="hover:text-brand-primary break-all"
                          >
                            {c.email}
                          </a>
                        ) : (
                          <span className="text-brand-muted">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-sm text-brand-text max-w-[320px]">
                        <div className="line-clamp-3 whitespace-pre-line">
                          {displayMessage}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-sm text-brand-text whitespace-nowrap">
                        {fmtDate(c.created_at)}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-md text-xs font-semibold ${
                            isProcessed
                              ? "bg-status-success text-white"
                              : "bg-status-warning text-white"
                          }`}
                        >
                          {isProcessed ? "Đã liên hệ" : "Chờ xử lý"}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        {isProcessed ? (
                          <button
                            onClick={() => reopen.mutate(c.id)}
                            disabled={reopen.isPending}
                            className="inline-flex items-center gap-1.5 h-[36px] px-3 rounded-[8px] border border-brand-border bg-white hover:bg-brand-bg/60 disabled:opacity-60 text-brand-text text-xs font-semibold transition-colors"
                          >
                            Đổi trạng thái
                          </button>
                        ) : (
                          <button
                            onClick={() => markProcessed.mutate(c.id)}
                            disabled={markProcessed.isPending}
                            className="inline-flex items-center gap-1.5 h-[36px] px-3 rounded-[8px] bg-brand-primary hover:bg-brand-primary-dark disabled:opacity-60 text-white text-xs font-semibold transition-colors shadow-sm"
                          >
                            <CheckCircle2 size={14} /> Xử lý
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
    </section>
  );
}
