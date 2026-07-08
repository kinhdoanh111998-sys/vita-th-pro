import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Megaphone, Save, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/marketing")({
  component: AdminMarketingPage,
});

function AdminMarketingPage() {
  const [campaignName, setCampaignName] = useState("");
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
        .select("id, free_trial_campaign")
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // Bỏ qua lỗi nếu bảng rỗng
      
      if (data && data.free_trial_campaign) {
        setCampaignName(data.free_trial_campaign);
      } else {
        setCampaignName("Trải nghiệm liệu trình miễn phí"); // Mặc định nếu chưa có
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
    if (!campaignName.trim()) {
      toast.error("Tên chiến dịch không được để trống!");
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

      let error;
      if (existingData) {
        // Nếu có rồi thì Cập nhật (Update)
        const { error: updateError } = await supabase
          .from("system_settings")
          .update({ free_trial_campaign: campaignName.trim() })
          .eq("id", existingData.id);
        error = updateError;
      } else {
        // Nếu bảng trống không thì Thêm mới (Insert)
        const { error: insertError } = await supabase
          .from("system_settings")
          .insert([{ free_trial_campaign: campaignName.trim() }]);
        error = insertError;
      }

      if (error) throw error;
      toast.success("Đã lưu tên chiến dịch thành công!");
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
          Quản lý nội dung các chương trình thu hút và chuyển đổi khách hàng.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-7 relative overflow-hidden">
        {/* Lớp viền trang trí */}
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <Sparkles className="w-32 h-32" />
        </div>

        <h2 className="text-lg font-bold text-gray-900 mb-5 border-b border-gray-100 pb-3">
          1. Phễu Trải nghiệm miễn phí
        </h2>
        
        <div className="space-y-4 max-w-xl relative z-10">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Tên chương trình hiện tại <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="Ví dụ: Trải nghiệm soi da AI miễn phí"
              className="w-full h-11 px-4 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none text-gray-800"
              disabled={isLoading || isSaving}
            />
            <p className="text-xs text-gray-500 mt-2 leading-relaxed bg-gray-50 p-2.5 rounded-lg border border-gray-100">
              💡 <span className="font-semibold">Lưu ý:</span> Tên chiến dịch này sẽ tự động thay đổi chữ trên Nút bấm ở Trang chủ App. Đồng thời, nó sẽ được gán tự động vào ô Ghi chú khi khách hàng điền form Đặt lịch.
            </p>
          </div>

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
            Lưu chiến dịch
          </button>
        </div>
      </div>
    </div>
  );
}
