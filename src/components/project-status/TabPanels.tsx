import { StatusBadge } from "./DashboardHeader";
import {
  MODULES,
  BRD_STAKEHOLDERS,
  BRD_USER_STORIES,
  BRD_KPIS,
  BRD_RISKS,
  SRS_ARCH,
  SRS_MODULES,
  SRS_RBAC,
  UI_TOKENS,
  UI_COMPONENTS,
  UI_RESPONSIVE,
  UI_STATES,
  API_ARCH,
  API_ENDPOINTS,
  API_ERRORS,
  DB_ERD,
  DB_TABLES,
  DB_INDEXES,
  BR_TIERS,
  BR_COMMISSION_MATRIX,
  BR_POOLS,
  BR_MGMT_POSITIONS,
  BR_APPLICATION,
  BR_ROADMAP,
  TIMELINE_MILESTONES,
} from "@/lib/project-status/data";

// -------- shared building blocks ----------
function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[#E3E3E3] bg-white p-5 md:p-6">
      <div className="mb-4">
        <h3 className="text-base md:text-lg font-black text-[#1a1a1a]">{title}</h3>
        {subtitle && <p className="mt-1 text-xs md:text-sm text-[#7a5b1d]">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function Table({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[#E3E3E3]">
      <table className="w-full text-sm">
        <thead className="bg-[#D9F0D6]/60">
          <tr>
            {head.map((h) => (
              <th key={h} className="px-3 py-2.5 text-left font-bold text-[#1a1a1a] whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-[#E3E3E3] hover:bg-[#FAFAFA]">
              {r.map((c, j) => (
                <td key={j} className="px-3 py-2.5 align-top text-[#484848]">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-[#FAF3E0] px-1.5 py-0.5 text-[11px] font-mono text-[#7a5b1d]">{children}</code>
  );
}

// ============ TIMELINE ============
export function TimelinePanel() {
  return (
    <div className="space-y-6">
      <SectionCard title="Roadmap 10 milestones" subtitle="Từ kick-off 12/05/2026 → go-live 20/09/2026">
        <ol className="relative border-l-2 border-[#c9a24b]/30 ml-3 space-y-4">
          {TIMELINE_MILESTONES.map((m) => (
            <li key={m.code} className="pl-5 relative">
              <span className="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-[#1B9606] ring-4 ring-white shadow" />
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono font-bold text-[#7a5b1d]">{m.code}</span>
                <span className="text-xs text-[#484848]/70">{m.date}</span>
                <StatusBadge status={m.status} />
              </div>
              <div className="mt-1 text-sm md:text-base font-bold text-[#1a1a1a]">{m.title}</div>
              <div className="text-xs md:text-sm text-[#484848] mt-0.5">{m.note}</div>
            </li>
          ))}
        </ol>
      </SectionCard>

      <SectionCard title="Scope 8 module × tiến độ">
        <Table
          head={["Module", "Mô tả", "Tiến độ", "Trạng thái", "Căn cứ"]}
          rows={MODULES.map((m) => [
            <b className="text-[#1a1a1a]">{m.name}</b>,
            m.desc,
            <div className="min-w-[100px]">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-[#E3E3E3] rounded-full overflow-hidden">
                  <div className="h-full bg-[#1B9606]" style={{ width: `${m.percent}%` }} />
                </div>
                <span className="text-xs font-bold text-[#1B9606]">{m.percent}%</span>
              </div>
            </div>,
            <StatusBadge status={m.status} />,
            <span className="text-xs text-[#484848]/80">{m.evidence}</span>,
          ])}
        />
      </SectionCard>
    </div>
  );
}

// ============ BRD ============
export function BrdPanel() {
  return (
    <div className="space-y-6">
      <SectionCard title="1. Bối cảnh & mục tiêu">
        <p className="text-sm text-[#484848] leading-relaxed">
          VitaTH Pro là nâng cấp toàn diện từ nền tảng Spa legacy sang hệ sinh thái mới gồm{" "}
          <b>Website bán hàng vitath.pro</b>, <b>App khách hàng</b> (đăng nhập Zalo 1 chạm),{" "}
          <b>CMS Admin</b> (18 danh mục có versioning), <b>Portal nhân viên</b> (ca, chấm công, hoa hồng) và{" "}
          <b>Policy Engine cộng đồng</b> chuẩn hóa từ tài liệu chính sách v1.0. Mục tiêu go-live{" "}
          <b>20/09/2026</b> với đủ 5 vai trò (Admin, Manager, KTV, Partner, Customer) và luồng thanh toán ZaloPay/VietQR đối soát idempotent.
        </p>
      </SectionCard>

      <SectionCard title="2. Stakeholders & vai trò">
        <Table
          head={["Vai trò", "Nhu cầu chính", "Kênh sử dụng"]}
          rows={BRD_STAKEHOLDERS.map((s) => [<Kbd>{s.role}</Kbd>, s.needs, <span className="text-xs">{s.channel}</span>])}
        />
      </SectionCard>

      <SectionCard title="3. Phạm vi sản phẩm (Scope)">
        <Table
          head={["Module", "Trạng thái", "% hoàn thành"]}
          rows={MODULES.map((m) => [
            <b>{m.name}</b>,
            <StatusBadge status={m.status} />,
            <span className="font-bold text-[#1B9606]">{m.percent}%</span>,
          ])}
        />
      </SectionCard>

      <SectionCard title="4. User stories cốt lõi">
        <div className="grid md:grid-cols-2 gap-4">
          {BRD_USER_STORIES.map((g) => (
            <div key={g.group} className="rounded-xl bg-[#FAFAFA] border border-[#E3E3E3] p-4">
              <div className="text-xs font-black uppercase tracking-wider text-[#7a5b1d] mb-2">{g.group}</div>
              <ul className="space-y-1.5 text-sm text-[#484848]">
                {g.items.map((i, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="text-[#1B9606] font-bold">•</span>
                    <span>{i}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="5. Success metrics (KPI go-live)">
        <Table
          head={["Chỉ số", "Mục tiêu", "Ghi chú đo lường"]}
          rows={BRD_KPIS.map((k) => [<b>{k.metric}</b>, <span className="font-bold text-[#1B9606]">{k.target}</span>, <span className="text-xs">{k.note}</span>])}
        />
      </SectionCard>

      <SectionCard title="6. Rủi ro & giảm thiểu">
        <Table
          head={["Rủi ro", "Tác động", "Phương án giảm thiểu"]}
          rows={BRD_RISKS.map((r) => [
            <b>{r.name}</b>,
            <span className={`font-bold ${r.impact === "High" ? "text-rose-600" : r.impact === "Med" ? "text-amber-600" : "text-emerald-600"}`}>{r.impact}</span>,
            <span className="text-xs">{r.mitigation}</span>,
          ])}
        />
      </SectionCard>
    </div>
  );
}

// ============ SRS ============
export function SrsPanel() {
  return (
    <div className="space-y-6">
      <SectionCard title="1. Kiến trúc tổng quan">
        <div className="grid md:grid-cols-2 gap-3 text-sm">
          {Object.entries(SRS_ARCH).map(([k, v]) => (
            <div key={k} className="rounded-xl bg-[#FAFAFA] border border-[#E3E3E3] p-3">
              <div className="text-[10px] font-black uppercase tracking-wider text-[#7a5b1d]">{k}</div>
              <div className="text-sm text-[#484848] mt-1">{v}</div>
            </div>
          ))}
        </div>
        <pre className="mt-4 rounded-xl border border-[#c9a24b]/30 bg-[#FAF3E0]/40 p-4 text-[11px] font-mono text-[#484848] overflow-x-auto">
{`  [Browser / App khách hàng]
        │
        ▼
  [TanStack Start SSR — Cloudflare Workers]
        │      ├──► createServerFn (RPC, requireSupabaseAuth)
        │      └──► /api/public/* (Zalo, ZaloPay, VietQR, ref.click)
        ▼
  [Supabase Postgres 15 + RLS + Storage]
        │
        ▼
  [Lovable AI Gateway]  ←── soi da, tư vấn
`}
        </pre>
      </SectionCard>

      <SectionCard title="2. Module system">
        <Table
          head={["Module", "Trách nhiệm", "Đầu ra chính", "Trạng thái"]}
          rows={SRS_MODULES.map((m) => [
            <Kbd>{m.name}</Kbd>,
            m.responsibility,
            <span className="text-xs">{m.output}</span>,
            <StatusBadge status={m.status} />,
          ])}
        />
      </SectionCard>

      <SectionCard title="3. Phân quyền RBAC">
        <Table
          head={["Role", "Phạm vi", "Hạn chế"]}
          rows={SRS_RBAC.map((r) => [<Kbd>{r.role}</Kbd>, r.scope, <span className="text-xs">{r.limit}</span>])}
        />
        <p className="mt-3 text-xs text-[#7a5b1d]">
          Roles lưu ở bảng riêng <Kbd>user_roles</Kbd>; check quyền qua function security-definer{" "}
          <Kbd>has_role(uid, role)</Kbd> để tránh privilege escalation.
        </p>
      </SectionCard>
    </div>
  );
}

// ============ UI/UX ============
export function UiPanel() {
  return (
    <div className="space-y-6">
      <SectionCard title="1. Design tokens (nguồn: src/styles.css + Tailwind theme)">
        <Table
          head={["Token", "Giá trị", "Dùng cho"]}
          rows={UI_TOKENS.map((t) => [
            <Kbd>{t.token}</Kbd>,
            <div className="flex items-center gap-2">
              {t.value.startsWith("#") && (
                <span className="w-4 h-4 rounded border border-[#E3E3E3]" style={{ background: t.value }} />
              )}
              <code className="text-xs">{t.value}</code>
            </div>,
            <span className="text-xs">{t.use}</span>,
          ])}
        />
      </SectionCard>

      <SectionCard title="2. Component standards">
        <Table
          head={["Loại", "Quy tắc", "File tham chiếu"]}
          rows={UI_COMPONENTS.map((c) => [<b>{c.type}</b>, c.rule, <Kbd>{c.ref}</Kbd>])}
        />
      </SectionCard>

      <SectionCard title="3. Responsive & mobile">
        <ul className="space-y-2 text-sm text-[#484848]">
          {UI_RESPONSIVE.map((r, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-[#c9a24b] font-bold">◆</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard title="4. Trạng thái UI">
        <Table
          head={["Trạng thái", "Pattern", "Ví dụ trong app"]}
          rows={UI_STATES.map((s) => [<b>{s.state}</b>, s.pattern, <span className="text-xs">{s.example}</span>])}
        />
      </SectionCard>
    </div>
  );
}

// ============ API ============
export function ApiPanel() {
  return (
    <div className="space-y-6">
      <SectionCard title="1. Kiến trúc API">
        <div className="grid md:grid-cols-2 gap-3 text-sm">
          {Object.entries(API_ARCH).map(([k, v]) => (
            <div key={k} className="rounded-xl bg-[#FAFAFA] border border-[#E3E3E3] p-3">
              <div className="text-[10px] font-black uppercase tracking-wider text-[#7a5b1d]">{k}</div>
              <div className="text-sm text-[#484848] mt-1 break-all">{v}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="2. Endpoint cốt lõi">
        <Table
          head={["Method", "Endpoint", "Mục đích", "Trạng thái"]}
          rows={API_ENDPOINTS.map((e) => [
            <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-black ${
              e.method === "POST" ? "bg-emerald-100 text-emerald-700" :
              e.method === "GET" ? "bg-blue-100 text-blue-700" :
              "bg-purple-100 text-purple-700"
            }`}>{e.method}</span>,
            <Kbd>{e.path}</Kbd>,
            <span className="text-xs">{e.purpose}</span>,
            <StatusBadge status={e.status} />,
          ])}
        />
      </SectionCard>

      <SectionCard title="3. Quản lý lỗi & response format">
        <ul className="space-y-2 text-sm text-[#484848]">
          {API_ERRORS.map((e, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-[#1B9606] font-bold">✓</span>
              <span>{e}</span>
            </li>
          ))}
        </ul>
      </SectionCard>
    </div>
  );
}

// ============ DATABASE ============
export function DbPanel() {
  return (
    <div className="space-y-6">
      <SectionCard title="1. ERD tổng quan (text tree)">
        <pre className="rounded-xl border border-[#c9a24b]/30 bg-[#FAF3E0]/40 p-4 text-[11px] md:text-xs font-mono text-[#484848] overflow-x-auto whitespace-pre">
{DB_ERD}
        </pre>
      </SectionCard>

      {DB_TABLES.map((group) => (
        <SectionCard key={group.group} title={`2. ${group.group}`}>
          <Table
            head={["Bảng", "Khóa / quan hệ", "Ghi chú"]}
            rows={group.rows.map((r) => [<Kbd>{r.table}</Kbd>, <span className="text-xs">{r.keys}</span>, <span className="text-xs">{r.note}</span>])}
          />
        </SectionCard>
      ))}

      <SectionCard title="3. Indexes & ràng buộc toàn vẹn dữ liệu">
        <Table
          head={["Field", "Constraint", "Mục đích"]}
          rows={DB_INDEXES.map((i) => [<Kbd>{i.field}</Kbd>, <span className="text-xs font-semibold">{i.constraint}</span>, <span className="text-xs">{i.purpose}</span>])}
        />
      </SectionCard>
    </div>
  );
}

// ============ BUSINESS RULES ============
export function BrPanel() {
  return (
    <div className="space-y-6">
      <SectionCard
        title="Áp dụng chinhsachcongdong_vita.docx v1.0"
        subtitle="Tài liệu chính sách cộng đồng VITA (Ban điều hành, 28/06/2026) — ánh xạ từng chương → hiện trạng codebase"
      >
        <div className="rounded-xl bg-[#FAF3E0]/60 border border-[#c9a24b]/40 p-4 text-sm text-[#484848]">
          <b className="text-[#7a5b1d]">Nguồn:</b> file Excel gốc "logic chính sách (2).xlsx", sheet "Chính sách" —
          chuẩn hóa bởi Ban điều hành cộng đồng VITA. Chính sách là <b>configurable</b> qua CMS: phí thẻ, tỷ lệ hoa hồng,
          KPI, số hạng thẻ đều điều chỉnh được theo giai đoạn/khu vực. Bản Word không được render trực tiếp — mọi số liệu
          bên dưới trích từ tài liệu và đối chiếu code hiện tại.
        </div>
      </SectionCard>

      <SectionCard title="1. Hạng thành viên L1–L5">
        <Table
          head={["Hạng", "Tên", "Hoàn điểm tiêu dùng", "Gói phí (VND/tháng)", "Trạng thái code", "Ghi chú triển khai"]}
          rows={BR_TIERS.map((t) => [
            <b className="text-[#c9a24b]">{t.tier}</b>,
            <b>{t.name}</b>,
            <span className="font-bold text-[#1B9606]">{t.cashback}</span>,
            <span className="font-semibold">{t.fee}</span>,
            <StatusBadge status={t.status} />,
            <span className="text-xs">{t.impl}</span>,
          ])}
        />
      </SectionCard>

      <SectionCard title="2. Ma trận hoa hồng affiliate đa vai trò">
        <Table
          head={["Khoản", "L1", "L2", "L3", "L4", "L5"]}
          rows={BR_COMMISSION_MATRIX.map((r) => [
            <b>{r.role}</b>,
            r.l1, r.l2, r.l3, r.l4, <b className="text-[#1B9606]">{r.l5}</b>,
          ])}
        />
        <p className="mt-3 text-xs text-[#7a5b1d]">
          Ví dụ chính sách: tổng ưu đãi tối đa ~55% giá trị đơn (580.000đ → 319.000đ pool phân bổ). Validation CMS cảnh
          báo khi tổng &gt; 100%. <b>Hiện tại</b> hệ thống chỉ có 1 tỷ lệ đơn qua <Kbd>affiliate_configs</Kbd> +
          trigger <Kbd>affiliate_generate_commission</Kbd> — cần bổ sung <Kbd>commission_matrix</Kbd> có versioning.
        </p>
      </SectionCard>

      <SectionCard title="3. Quỹ phát triển thành viên (Pool 1/2/3)">
        <Table
          head={["Quỹ", "Tỷ lệ", "Đối tượng áp dụng", "Trạng thái"]}
          rows={BR_POOLS.map((p) => [<b>{p.pool}</b>, <span className="font-bold text-[#1B9606]">{p.percent}</span>, p.audience, <StatusBadge status={p.status} />])}
        />
      </SectionCard>

      <SectionCard title="4. Vai trò địa phương & quỹ lãnh đạo">
        <Table
          head={["Vai trò", "Phạm vi", "Tỷ lệ (mẫu)"]}
          rows={BR_MGMT_POSITIONS.map((p) => [<b>{p.title}</b>, p.scope, <span className="font-bold text-[#c9a24b]">{p.ratio}</span>])}
        />
        <p className="mt-3 text-xs text-[#7a5b1d]">
          KPI theo <Kbd>failConsecutivePeriods</Kbd> năm 2 → hạ hạng / miễn nhiệm. Tổng 3.265 vị trí toàn quốc.
        </p>
      </SectionCard>

      <SectionCard
        title="5. Điều kiện ràng buộc nghiệp vụ (mapping code hiện tại)"
        subtitle="Bảng đối chiếu 10 khu vực chính sách × trạng thái triển khai"
      >
        <Table
          head={["Khu vực chính sách", "Nội dung policy", "Hiện trạng code", "Trạng thái"]}
          rows={BR_APPLICATION.map((a) => [
            <b className="text-[#1a1a1a]">{a.area}</b>,
            <span className="text-xs">{a.policy}</span>,
            <span className="text-xs">{a.impl}</span>,
            <StatusBadge status={a.status} />,
          ])}
        />
      </SectionCard>

      <SectionCard title="6. Roadmap ưu tiên — đưa Policy Engine 100% trước go-live">
        <ol className="space-y-3">
          {BR_ROADMAP.map((r, i) => (
            <li key={i} className="rounded-xl border border-[#E3E3E3] bg-[#FAFAFA] p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#1B9606] text-white text-xs font-black px-2.5 py-0.5">
                  {r.sprint}
                </span>
              </div>
              <div className="mt-2 text-sm text-[#484848]">
                <b className="text-[#1a1a1a]">Scope:</b> {r.scope}
              </div>
              <div className="mt-1 text-sm text-[#484848]">
                <b className="text-[#7a5b1d]">Mục tiêu:</b> {r.goal}
              </div>
            </li>
          ))}
        </ol>
      </SectionCard>
    </div>
  );
}
