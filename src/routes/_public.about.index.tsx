import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_public/about/")({
  component: AboutPage,
  head: () => ({
    meta: [
      { title: "Về chúng tôi | Vita TH Pro" },
      {
        name: "description",
        content:
          "Vita TH Pro - Hệ sinh thái chăm sóc sức khỏe & sắc đẹp toàn diện với công nghệ trị liệu tiên tiến và giải pháp chuyển giao toàn quốc.",
      },
    ],
  }),
});

function AboutPage() {
  return (
    <div className="min-h-screen bg-brand-bg">
      {/* BƯỚC 1: BANNER ẢNH PHÍA TRÊN (HERO SECTION) */}
      <div className="relative h-[350px] w-full overflow-hidden bg-brand-text md:h-[450px]">
        <img
          src="/vita_slider_03.jpg"
          alt="Vita TH Pro Banner"
          className="h-full w-full object-cover opacity-90"
        />
        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-black/30 to-transparent p-8 md:p-16">
          <div className="mx-auto w-full max-w-4xl">
            <span className="text-sm font-semibold uppercase tracking-wider text-brand-primary md:text-base">
              Về Chúng Tôi
            </span>
            <h1 className="mt-2 text-3xl font-bold leading-tight text-white md:text-5xl">
              Hệ Sinh Thái Chăm Sóc Sức Khỏe <br />& Sắc Đẹp Toàn Diện
            </h1>
          </div>
        </div>
      </div>

      {/* TỔNG THỂ CONTENT NỘI DUNG */}
      <div className="mx-auto max-w-4xl space-y-12 px-6 py-12 md:space-y-16 md:py-16">
        {/* BƯỚC 2: KHỐI GIỚI THIỆU CHÍNH */}
        <section className="space-y-4">
          <h2 className="border-l-4 border-brand-primary pl-4 text-2xl font-bold text-brand-text md:text-3xl">
            Giới thiệu về Vita TH Pro
          </h2>
          <p className="text-base leading-relaxed text-brand-muted md:text-lg">
            Thương hiệu{" "}
            <strong className="font-semibold text-brand-text">Vita TH Pro</strong>{" "}
            là biểu tượng của sự kết hợp hoàn hảo giữa công nghệ chăm sóc da trị liệu tiên tiến và triết lý chữa lành, nuôi dưỡng cơ thể từ sâu bên trong. Với khát vọng định hình lại chuẩn mực của ngành làm đẹp hiện đại, chúng tôi không chỉ mang đến các dịch vụ spa/clinic chất lượng cao mà còn tiên phong trong việc chuyển giao giải pháp công nghệ toàn diện cho các đối tác trên khắp cả nước.
          </p>
          <p className="text-base leading-relaxed text-brand-muted md:text-lg">
            Tại{" "}
            <strong className="font-semibold text-brand-text">Vita TH Pro</strong>,
            mỗi khách hàng là một hành trình chuyên biệt. Chúng tôi cam kết cá nhân hóa mọi liệu trình thông qua hệ thống quản trị mã QR thông minh, giúp theo dõi tiến độ chính xác và đảm bảo sự an tâm tuyệt đối sau từng buổi trị liệu.
          </p>
        </section>

        {/* BƯỚC 3: KHỐI TẦM NHÌN - SỨ MỆNH (CHIA GRID ĐẸP CHUẨN FIGMA) */}
        <section className="grid gap-6 md:grid-cols-2 md:gap-8">
          <div className="rounded-2xl border border-brand-border bg-brand-surface p-6 transition-shadow hover:shadow-sm md:p-8">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-primary-light text-brand-primary">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-xl font-bold text-brand-text">
              Tầm Nhìn Chiến Lược
            </h3>
            <p className="text-sm leading-relaxed text-brand-muted md:text-base">
              Trở thành chuỗi hệ sinh thái chăm sóc sức khỏe, thẩm mỹ công nghệ cao và cung cấp các dòng sản phẩm thực dưỡng, máy móc cốt lõi dẫn đầu thị trường. Kiến tạo một cộng đồng sống khỏe, sống đẹp vững bền cùng mạng lưới đối tác nhượng quyền trải dài trên toàn quốc.
            </p>
          </div>

          <div className="rounded-2xl border border-brand-border bg-brand-surface p-6 transition-shadow hover:shadow-sm md:p-8">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-primary-light text-brand-primary">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-xl font-bold text-brand-text">
              Sứ Mệnh Khởi Tạo
            </h3>
            <p className="text-sm leading-relaxed text-brand-muted md:text-base">
              Khai mở nguồn năng lượng tự chữa lành và khôi phục vẻ đẹp nguyên bản của làn da, vóc dáng bằng các giải pháp khoa học, minh bạch. Đồng thời, đồng hành đắc lực cùng cộng đồng đại lý, nhân viên và đối tác kinh doanh thông qua chính sách đãi ngộ và hoa hồng vượt trội.
            </p>
          </div>
        </section>

        {/* BƯỚC 4: GIÁ TRỊ CỐT LÕI (DANH SÁCH ICON TINH TẾ) */}
        <section className="space-y-6">
          <h2 className="border-l-4 border-brand-primary pl-4 text-2xl font-bold text-brand-text md:text-3xl">
            Giá Trị Cốt Lõi
          </h2>
          <div className="grid gap-6 text-center sm:grid-cols-3">
            <div className="space-y-2">
              <div className="text-3xl font-bold text-brand-primary">01</div>
              <h4 className="text-lg font-bold text-brand-text">Chuyên Nghiệp</h4>
              <p className="text-sm leading-relaxed text-brand-muted">
                Quy trình chuẩn y khoa, minh bạch bằng công nghệ mã hóa QR theo dõi thời gian thực.
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-brand-primary">02</div>
              <h4 className="text-lg font-bold text-brand-text">Tận Tâm</h4>
              <p className="text-sm leading-relaxed text-brand-muted">
                Thấu hiểu từng vấn đề nhỏ của làn da và sức khỏe để thiết lập phác đồ trị liệu tối ưu nhất.
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-brand-primary">03</div>
              <h4 className="text-lg font-bold text-brand-text">Vững Bền</h4>
              <p className="text-sm leading-relaxed text-brand-muted">
                Đồng hành phát triển thịnh vượng cùng đội ngũ nhân sự và các đối tác nhượng quyền thương hiệu.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
