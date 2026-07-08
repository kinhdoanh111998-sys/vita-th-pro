import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Megaphone, Save, Loader2, Sparkles, LayoutTemplate, MousePointerClick } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/marketing")({
  component: AdminMarketingPage,
});

function AdminMarketingPage() {
  const [heroCampaign, setHeroCampaign] = useState("");
  const [shortcutCampaign, setShortcutCampaign] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Tải cấu hình khi vừa vào trang
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select("id, app_home_hero_campaign, homepage_shortcut_campaign")
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error; 
      
      if (data) {
        setHeroCampaign(data.app_home_hero_campaign || "Trải nghiệm liệu trình miễn phí");
        setShortcutCampaign(data.homepage_shortcut_campaign || "Soi da AI chuyên sâu");
      } else {
        setHeroCampaign("Trải nghiệm liệu trình miễn phí");
        setShortcutCampaign("Soi da AI chuyên sâu");
      }
    } catch (error: any) {
      console.error("Lỗi tải cấu hình:", error);
      toast.error("Không thể tải cấu hình chiến dịch");
    } finally {
      setIsLoading(false);
    }
  };

  // Lưu cấu hình vào DB
  const handleSave = async () => {
    if (!heroCampaign.trim() || !shortcutCampaign.trim()) {
      toast.error("Vui lòng nhập đầy đủ tên cho các chiến dịch!");
      return;
    }

    setIsSaving(true);
    try {
      // Tìm xem đã có dòng cấu hình nào chưa
      const { data: existingData } = await supabase
        .from("system_settings")
        .select("id")
        .limit(1)
        .single();

      const payload = {
        app_home_hero_campaign: heroCampaign.trim(),
        homepage_shortcut_campaign: shortcutCampaign.trim()
      };

      let error;
      if (existingData) {
        // Cập nhật (Update)
        const { error: updateError } = await supabase
          .from("system_settings")
          .update(payload)
          .eq("id", existingData.id);
        error = updateError;
      } else {
        // Thêm mới (Insert)
        const { error: insertError } = await supabase
          .from("system_settings")
          .insert([payload]);
        error = insertError;
      }

      if (error) throw error;
      toast.success("Đã lưu các chiến dịch thành công!");
    } catch (error: any) {
      console.error("Lỗi lưu cấu hình:", error);
      toast.error("Lỗi lưu trữ: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl w-full mx-auto animate-in fade-in duration-300">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2 font-heading">
          <Megaphone className="w-7 h-7 text-emerald-600" />
          Chiến dịch Marketing
        </h1>
        <p className="text-sm text-gray-500 mt-1.5">
          Quản lý tên gọi các chương trình thu hút và chuyển đổi khách hàng trên toàn hệ thống.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-7 relative overflow-hidden">
        {/* Lớp viền trang trí */}
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <Sparkles className="w-32 h-32" />
        </div>

        <div className="space-y-8 relative z-10">
          
          {/* Phễu 1: Banner chính */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2 flex items-center gap-2">
              <LayoutTemplate className="w-5 h-5 text-emerald-600" />
              1. Phễu Banner chính (App Home)
            </h2>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Tên chiến dịch trên Banner <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={heroCampaign}
              onChange={(e) => setHeroCampaign(e.target.value)}
              placeholder="Ví dụ: Trải nghiệm gội đầu dưỡng sinh miễn phí"
              className="w-full max-w-xl h-11 px-4 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none text-gray-800"
              disabled={isLoading || isSaving}
            />
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              💡 Thay đổi dòng chữ to trên khối Banner màu gradient.
            </p>
          </div>

          {/* Phễu 2: Nút Soi da AI */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2 flex items-center gap-2">
              <MousePointerClick className="w-5 h-5 text-amber-500" />
              2. Phễu Nút lối tắt (Homepage / App)
            </h2>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Tên chiến dịch cho Nút Soi da AI <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={shortcutCampaign}
              onChange={(e) => setShortcutCampaign(e.target.value)}
              placeholder="Ví dụ: Soi da AI công nghệ cao"
              className="w-full max-w-xl h-11 px-4 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none text-gray-800"
              disabled={isLoading || isSaving}
            />
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              💡 Mặc định tên chương trình cho các nút "Soi da AI" ngoài trang chủ.
            </p>
          </div>

          {/* Nút Submit chung */}
          <div className="pt-4 border-t border-gray-100">
            <button
              onClick={handleSave}
              disabled={isLoading || isSaving}
              className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-sm hover:shadow"
            >
              {isSaving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              Lưu các chiến dịch
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
