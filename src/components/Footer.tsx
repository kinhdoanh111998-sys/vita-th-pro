import logo from "@/assets/vita-th-pro-logo.png";

export function Footer() {
  return (
    <footer className="bg-[#112218] text-white pt-12 pb-6 mt-12">
      <div className="mx-auto max-w-[1180px] px-5">
        <div className="grid gap-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <img
              src={logo}
              alt="Vita TH Pro"
              className="h-[54px] w-auto bg-white rounded-xl p-1.5"
            />
            <p className="mt-3 text-sm text-[#d7f4d8]">
              Website demo hoàn chỉnh cho Vita TH Pro: giới thiệu, sản phẩm/dịch
              vụ, tin tức, đặt lịch và quản trị vận hành.
            </p>
            <small className="text-[#bdd7c2]">
              Bản demo UI – chưa kết nối dữ liệu thật.
            </small>
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
            <p className="text-sm text-[#d7f4d8]">Hotline/Zalo: 0988 000 888</p>
            <p className="text-sm text-[#d7f4d8]">Email: contact@vitath.pro</p>
            <p className="text-sm text-[#d7f4d8] mt-1">Hà Nội, Việt Nam</p>
          </div>
        </div>
        <div className="border-t border-white/10 mt-6 pt-4 text-[13px] text-[#bdd7c2]">
          © {new Date().getFullYear()} Vita TH Pro. Demo bàn giao ý tưởng cho
          đội phát triển.
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
