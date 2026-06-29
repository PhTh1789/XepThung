import { useAppStore } from "@/store/useAppStore";
import { useAuthStore } from "@/store/useAuthStore";
import { ArrowRight, Box, Cuboid, MonitorSmartphone } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function HomePage() {
  const userRole       = useAuthStore((s) => s.userRole);
  const setCurrentStep = useAppStore((s) => s.setCurrentStep);
  const openModal      = useAppStore((s) => s.openModal);

  const handleStart = () => {
    if (userRole) {
      setCurrentStep("step1");
    } else {
      openModal("roles");
    }
  };

  return (
    <div className="w-full flex flex-col items-center overflow-x-hidden bg-background">
      {/* Hero Section */}
      <div className="w-full max-w-[1280px] px-6 sm:px-10 min-h-[calc(100vh-80px)] py-12 flex flex-col md:grid md:grid-cols-2 gap-12 items-center justify-center">
        {/* Left: Text & CTA */}
        <div className="flex flex-col gap-6 order-2 md:order-1 items-start">
          <h1 className="font-bold text-4xl sm:text-[40px] text-foreground tracking-tight leading-[1.3] sm:leading-[56px]">
            Tối ưu không gian, <br className="hidden xl:block" /> vững vàng tay lái
          </h1>
          <p className="font-normal text-lg sm:text-[18px] text-muted-foreground leading-relaxed sm:leading-[28px]">
            Giải pháp hỗ trợ tài xế Việt sắp xếp hàng lên xe nhanh chóng, cân
            bằng tải trọng và tiết kiệm chi phí chỉ với 3 bước đơn giản.
          </p>
          <div className="pt-4 w-full sm:w-auto hidden sm:flex">
            <Button
              variant="action"
              size="md"
              onClick={handleStart}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="w-full sm:w-auto shadow-sm"
            >
              Bắt đầu sắp xếp ngay
            </Button>
          </div>
          
          {/* Mobile Sticky CTA: fixed bottom, chỉ hiện trên < sm */}
          <div className="fixed bottom-4 left-4 right-4 z-50 sm:hidden">
            <Button
              variant="action"
              size="md"
              onClick={handleStart}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="w-full h-14 shadow-lg active:scale-[0.98]"
            >
              Bắt đầu sắp xếp ngay
            </Button>
          </div>
        </div>
        
        {/* Right: 3D Simulation Placeholder */}
        <div className="relative w-full aspect-video md:aspect-square bg-muted/50 rounded-[24px] border border-border shadow-md flex items-center justify-center overflow-hidden order-1 md:order-2">
          {/* Box Placeholder for 3D simulation image */}
          <div className="flex flex-col items-center gap-4 opacity-40">
            <Cuboid className="w-20 h-20 text-muted-foreground" />
            <span className="text-muted-foreground font-medium text-lg px-4 text-center">
              3D Simulation Image Placeholder
            </span>
          </div>
        </div>
      </div>

      {/* Workflow Section */}
      <div className="w-full bg-muted py-16 md:py-24 flex justify-center border-t border-border/50">
        <div className="w-full max-w-[1280px] px-6 sm:px-10 flex flex-col gap-12 md:gap-16 items-center">
          <div className="flex flex-col gap-4 items-center max-w-2xl text-center">
            <h2 className="font-bold text-2xl sm:text-[24px] text-foreground leading-[32px]">
              Quy trình 3 bước đơn giản
            </h2>
            <p className="font-normal text-base text-muted-foreground leading-[24px]">
              Hệ thống thông minh giúp bạn lên kế hoạch xếp hàng chỉ trong vài phút.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
            {/* Step 1 */}
            <div className="bg-background border border-border/50 rounded-[24px] p-8 flex flex-col gap-4 shadow-md relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
              <div className="w-16 h-16 rounded-[16px] bg-primary flex items-center justify-center text-white z-10">
                <Cuboid className="w-8 h-8" />
              </div>
              <div className="flex items-center gap-3 z-10 pt-2">
                <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center text-sm font-bold text-foreground">1</div>
                <h3 className="font-bold text-xl text-foreground">Chọn xe tải</h3>
              </div>
              <p className="text-base text-muted-foreground z-10 leading-relaxed">
                Chọn mẫu xe tải phổ biến hoặc tùy chỉnh kích thước lọt lòng phù hợp với xe của bạn.
              </p>
              <div className="absolute -top-8 -right-8 w-24 h-24 bg-primary/5 rounded-bl-3xl transition-transform duration-500 group-hover:scale-[2.5]" />
            </div>

            {/* Step 2 */}
            <div className="bg-background border border-border/50 rounded-[24px] p-8 flex flex-col gap-4 shadow-md relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
              <div className="w-16 h-16 rounded-[16px] bg-secondary flex items-center justify-center text-secondary-foreground z-10">
                <Box className="w-8 h-8" />
              </div>
              <div className="flex items-center gap-3 z-10 pt-2">
                <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center text-sm font-bold text-foreground">2</div>
                <h3 className="font-bold text-xl text-foreground">Nhập hàng hóa</h3>
              </div>
              <p className="text-base text-muted-foreground z-10 leading-relaxed">
                Nhập danh sách kiện hàng với đầy đủ thông số kích thước (dài, rộng, cao) và khối lượng.
              </p>
              <div className="absolute -top-8 -right-8 w-24 h-24 bg-secondary/10 rounded-bl-3xl transition-transform duration-500 group-hover:scale-[2.5]" />
            </div>

            {/* Step 3 */}
            <div className="bg-background border border-border/50 rounded-[24px] p-8 flex flex-col gap-4 shadow-md relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
              <div className="w-16 h-16 rounded-[16px] bg-accent flex items-center justify-center text-accent-foreground z-10">
                <MonitorSmartphone className="w-8 h-8" />
              </div>
              <div className="flex items-center gap-3 z-10 pt-2">
                <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center text-sm font-bold text-foreground">3</div>
                <h3 className="font-bold text-xl text-foreground">Xem kết quả</h3>
              </div>
              <p className="text-base text-muted-foreground z-10 leading-relaxed">
                Xem kết quả 2D/3D trực quan, theo dõi hướng dẫn sắp xếp từng bước và xuất PDF/Excel.
              </p>
              <div className="absolute -top-8 -right-8 w-24 h-24 bg-accent/10 rounded-bl-3xl transition-transform duration-500 group-hover:scale-[2.5]" />
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="w-full bg-background py-16 md:py-24 flex justify-center">
        <div className="w-full max-w-[1280px] px-6 sm:px-10 flex flex-col gap-12 md:gap-16 items-center">
          <h2 className="font-bold text-2xl sm:text-[24px] text-foreground text-center">
            Lợi ích vượt trội
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
            {/* Feature 1 */}
            <div className="flex flex-col items-center text-center p-6 gap-3">
              <div className="w-20 h-20 rounded-[24px] bg-primary/10 flex items-center justify-center mb-4 text-primary">
                <Cuboid className="w-10 h-10" />
              </div>
              <h4 className="font-bold text-xl text-foreground">Cân bằng tải trọng</h4>
              <p className="text-base text-muted-foreground leading-relaxed">
                Thuật toán thông minh phân bổ trọng lượng đều trên xe, đảm bảo an toàn vận hành tối đa.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="flex flex-col items-center text-center p-6 gap-3">
              <div className="w-20 h-20 rounded-[24px] bg-primary/10 flex items-center justify-center mb-4 text-primary">
                <Box className="w-10 h-10" />
              </div>
              <h4 className="font-bold text-xl text-foreground">Mô phỏng 3D trực quan</h4>
              <p className="text-base text-muted-foreground leading-relaxed">
                Dễ dàng hình dung vị trí từng thùng hàng với mô hình 3D xoay lật linh hoạt, tránh sai sót khi thực xếp.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="flex flex-col items-center text-center p-6 gap-3">
              <div className="w-20 h-20 rounded-[24px] bg-primary/10 flex items-center justify-center mb-4 text-primary">
                <MonitorSmartphone className="w-10 h-10" />
              </div>
              <h4 className="font-bold text-xl text-foreground">Dành cho người Việt</h4>
              <p className="text-base text-muted-foreground leading-relaxed">
                Giao diện tiếng Việt 100%, thiết kế tối ưu, dễ dàng sử dụng trực tiếp trên điện thoại di động.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="w-full bg-muted border-t border-border py-6 flex justify-center">
        <div className="w-full max-w-[1280px] px-6 sm:px-10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <span className="font-black text-sm text-foreground tracking-[0.7px]">
            © 2026 Xếp Thùng - NLU - KLTN 2026
          </span>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Điều khoản</a>
            <a href="#" className="hover:text-foreground transition-colors">Bảo mật</a>
            <a href="#" className="hover:text-foreground transition-colors">Liên hệ</a>
          </div>
        </div>
      </div>
    </div>
  );
}
