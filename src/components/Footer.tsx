import logo from "@/assets/vita-th-pro-logo.png";
import { useSettings } from "@/lib/useSettings";
import { useSystemSettings } from "@/lib/useSystemSettings";

export function Footer() {
  const { data } = useSettings();
  const { data: sys } = useSystemSettings();
  const brand = data?.brand ?? "Vita TH Pro";
  const hotline = sys?.hotline ?? data?.hotline ?? "0988 000 888";
  const zaloLink = sys?.zalo_link ?? (data?.zalo ? `https://zalo.me/${data.zalo}` : "#");
  const facebookLink = sys?.facebook_link ?? "#";
  const email = data?.email ?? "contact@vitath.pro";
  const address = data?.address ?? "Hà Nội, Việt Nam";
  const tagline =
    data?.tagline ??
    "Website demo hoàn chỉnh: giới thiệu, sản phẩm/dịch vụ, tin tức, đặt lịch và quản trị vận hành.";


  return (
    <footer className="bg-[#112218] text-white pt-12 pb-6 mt-12">
      <div className="mx-auto max-w-[1180px] px-5">
        <div className="grid gap-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <img
              src={logo}
              alt={brand}
              className="h-[54px] w-auto bg-white rounded-xl p-1.5"
            />
            <p className="mt-3 text-sm text-[#d7f4d8]">{tagline}</p>
          </div>
          <FooterCol
            title="Giới thiệu"
            items={["Về chúng tôi", "Lịch sử phát triển", "Đội ngũ", "Chứng nhận"]}
          />
          <FooterCol
            title="Sản phẩm"
            items={["Máy công nghệ", "Phụ kiện", "Dịch vụ", "Chuyển giao công nghệ"]}
          />
          <div>
            <h4 className="font-bold mb-2">Liên hệ</h4>
            <p className="text-sm text-[#d7f4d8]">Hotline: {hotline}</p>
            <p className="text-sm text-[#d7f4d8]">Zalo: {zalo}</p>
            <p className="text-sm text-[#d7f4d8]">Email: {email}</p>
            <p className="text-sm text-[#d7f4d8] mt-1">{address}</p>
          </div>
        </div>
        <div className="border-t border-white/10 mt-6 pt-4 text-[13px] text-[#bdd7c2]">
          © {new Date().getFullYear()} {brand}. Mọi quyền được bảo lưu.
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="font-bold mb-2">{title}</h4>
      {items.map((i) => (
        <p key={i} className="text-sm text-[#d7f4d8] py-0.5">
          <a href="#" className="hover:underline">{i}</a>
        </p>
      ))}
    </div>
  );
}
