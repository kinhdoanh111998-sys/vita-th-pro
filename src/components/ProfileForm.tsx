import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Camera, KeyRound, Loader2, Lock, Save, User } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const AVATAR_BUCKET = "avatars";
const AVATAR_TTL = 60 * 60 * 24 * 365 * 10;

type StaffRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string | null;
  avatar_url: string | null;
  phone: string | null;
  department: string | null;
};

type CustomerRow = {
  id: string;
  name: string | null;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  dob: string | null;
  address: string | null;
  avatar_url: string | null;
  zalo_id: string | null;
};

export function ProfileForm() {
  const { session, role, email } = useAuth();
  const userId = session?.user?.id ?? null;
  const isStaff = role && ["staff", "employee", "sale", "technician", "manager", "admin"].includes(role);
  const isAdmin = role === "admin";

  if (isStaff) {
    return <StaffProfileForm userId={userId} isAdmin={!!isAdmin} email={email} />;
  }
  return <CustomerProfileForm email={email} />;
}

/* -------------------- Staff -------------------- */
function StaffProfileForm({
  userId,
  isAdmin,
  email,
}: {
  userId: string | null;
  isAdmin: boolean;
  email: string | null;
}) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["profile", "staff", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id, email, full_name, role, avatar_url, phone, department")
        .eq("id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data as StaffRow | null;
    },
  });

  const [form, setForm] = useState({ full_name: "", phone: "", department: "", avatar_url: "" });
  useEffect(() => {
    if (data) {
      setForm({
        full_name: data.full_name ?? "",
        phone: data.phone ?? "",
        department: data.department ?? "",
        avatar_url: data.avatar_url ?? "",
      });
    }
  }, [data]);

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("Chưa đăng nhập");
      const payload: Partial<StaffRow> = {
        full_name: form.full_name.trim() || null,
        phone: form.phone.trim() || null,
        avatar_url: form.avatar_url || null,
      };
      if (isAdmin) payload.department = form.department.trim() || null;
      const { error } = await supabase.from("users").update(payload).eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Đã cập nhật hồ sơ");
      qc.invalidateQueries({ queryKey: ["profile", "staff", userId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading || !data) {
    return (
      <div className="rounded-2xl border border-hairline bg-white p-8 text-center text-sm text-ink-muted">
        <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Đang tải hồ sơ…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <SectionCard title="Thông tin cá nhân" icon={<User className="w-5 h-5" />}>
        <AvatarUploader
          userId={userId!}
          avatarUrl={form.avatar_url}
          fallback={form.full_name || email || "?"}
          onChange={(url) => setForm((f) => ({ ...f, avatar_url: url }))}
        />
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Họ và tên">
            <Input
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              placeholder="Nguyễn Văn A"
            />
          </Field>
          <Field label="Email">
            <Input value={data.email ?? ""} disabled />
          </Field>
          <Field label="SỐ ĐIỆN THOẠI">
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="09xx xxx xxx"
            />
          </Field>
          <Field
            label={
              <span className="flex items-center gap-1.5">
                Bộ phận làm việc
                {!isAdmin && <Lock className="w-3 h-3 text-ink-muted" />}
              </span>
            }
          >
            <Input
              value={form.department}
              disabled={!isAdmin}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              placeholder={isAdmin ? "VD: Kỹ thuật viên" : "Chỉ Admin cấp cao mới sửa được"}
            />
          </Field>
          <Field label="Vai trò">
            <Input value={data.role ?? ""} disabled />
          </Field>
        </div>
        <div className="flex justify-end">
          <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
            {saveMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Lưu thay đổi
          </Button>
        </div>
      </SectionCard>

      <PasswordCard />
    </div>
  );
}

/* -------------------- Customer -------------------- */
function CustomerProfileForm({ email }: { email: string | null }) {
  const qc = useQueryClient();
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;

  const { data, isLoading } = useQuery({
    queryKey: ["profile", "customer", email],
    enabled: !!email,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id, name, full_name, phone, email, dob, address, avatar_url, zalo_id")
        .eq("email", email!)
        .maybeSingle();
      if (error) throw error;
      return data as CustomerRow | null;
    },
  });

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    dob: "",
    address: "",
    avatar_url: "",
  });
  useEffect(() => {
    if (data) {
      setForm({
        full_name: data.full_name ?? data.name ?? "",
        phone: data.phone ?? "",
        dob: data.dob ?? "",
        address: data.address ?? "",
        avatar_url: data.avatar_url ?? "",
      });
    }
  }, [data]);

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!data?.id) throw new Error("Không tìm thấy hồ sơ khách hàng");
      const { error } = await supabase
        .from("customers")
        .update({
          full_name: form.full_name.trim() || null,
          name: form.full_name.trim() || null,
          phone: form.phone.trim() || null,
          dob: form.dob || null,
          address: form.address.trim() || null,
          avatar_url: form.avatar_url || null,
        })
        .eq("id", data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Đã cập nhật hồ sơ");
      qc.invalidateQueries({ queryKey: ["profile", "customer", email] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-hairline bg-white p-8 text-center text-sm text-ink-muted">
        <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Đang tải hồ sơ…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <SectionCard
        title="Hồ sơ của tôi"
        icon={<User className="w-5 h-5" />}
        note={
          data?.zalo_id
            ? "Bạn đăng nhập bằng Zalo. Có thể đặt lại mật khẩu bên dưới để đăng nhập trực tiếp bằng email."
            : undefined
        }
      >
        <AvatarUploader
          userId={userId ?? data?.id ?? "anon"}
          avatarUrl={form.avatar_url}
          fallback={form.full_name || email || "?"}
          onChange={(url) => setForm((f) => ({ ...f, avatar_url: url }))}
        />
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Họ và tên">
            <Input
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              placeholder="Nguyễn Thị B"
            />
          </Field>
          <Field label="Email">
            <Input value={data?.email ?? ""} disabled />
          </Field>
          <Field label="Số điện thoại">
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="09xx xxx xxx"
            />
          </Field>
          <Field label="Ngày sinh">
            <Input
              type="date"
              value={form.dob}
              onChange={(e) => setForm({ ...form, dob: e.target.value })}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Địa chỉ">
              <Textarea
                rows={2}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"
              />
            </Field>
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
            {saveMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Lưu thay đổi
          </Button>
        </div>
      </SectionCard>

      <PasswordCard />
    </div>
  );
}

/* -------------------- Shared -------------------- */
function SectionCard({
  title,
  icon,
  children,
  note,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  note?: string;
}) {
  return (
    <section className="rounded-2xl border border-hairline bg-white p-5 md:p-6 shadow-sm space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-emerald-50 text-emerald-700 grid place-items-center">
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="font-black text-brand-dark text-lg">{title}</h3>
          {note && <p className="text-xs text-ink-muted mt-0.5">{note}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] uppercase tracking-widest text-ink-muted font-bold">
        {label}
      </Label>
      {children}
    </div>
  );
}

function AvatarUploader({
  userId,
  avatarUrl,
  fallback,
  onChange,
}: {
  userId: string;
  avatarUrl: string;
  fallback: string;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const ref = useRef<HTMLInputElement | null>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn tệp ảnh");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      toast.error("Ảnh vượt quá 3MB");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (upErr) throw upErr;
      const { data: signed, error: sErr } = await supabase.storage
        .from(AVATAR_BUCKET)
        .createSignedUrl(path, AVATAR_TTL);
      if (sErr) throw sErr;
      onChange(signed.signedUrl);
      toast.success("Đã tải ảnh đại diện");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
      if (ref.current) ref.current.value = "";
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="relative w-20 h-20 shrink-0">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="w-full h-full rounded-2xl object-cover border-2 border-amber-200 shadow-sm"
          />
        ) : (
          <div className="w-full h-full rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 grid place-items-center text-white text-2xl font-black">
            {fallback.slice(0, 1).toUpperCase()}
          </div>
        )}
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white border border-hairline shadow grid place-items-center hover:bg-brand-soft"
          aria-label="Đổi ảnh đại diện"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
        </button>
        <input
          ref={ref}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
      </div>
      <div>
        <div className="text-sm font-bold text-brand-dark">Ảnh đại diện</div>
        <div className="text-xs text-ink-muted">PNG/JPG, tối đa 3MB</div>
      </div>
    </div>
  );
}

function PasswordCard() {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [saving, setSaving] = useState(false);

  const handle = async () => {
    if (pw.length < 6) {
      toast.error("Mật khẩu tối thiểu 6 ký tự");
      return;
    }
    if (pw !== pw2) {
      toast.error("Mật khẩu nhập lại không khớp");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pw });
      if (error) throw error;
      toast.success("Đã đổi mật khẩu thành công");
      setPw("");
      setPw2("");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SectionCard
      title="Đổi mật khẩu"
      icon={<KeyRound className="w-5 h-5" />}
      note="Đặt mật khẩu mới để đăng nhập trực tiếp bằng email."
    >
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Mật khẩu mới">
          <Input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            autoComplete="new-password"
            placeholder="Tối thiểu 6 ký tự"
          />
        </Field>
        <Field label="Nhập lại mật khẩu">
          <Input
            type="password"
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            autoComplete="new-password"
          />
        </Field>
      </div>
      <div className="flex justify-end">
        <Button onClick={handle} disabled={saving || !pw}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
          Đổi mật khẩu
        </Button>
      </div>
    </SectionCard>
  );
}
