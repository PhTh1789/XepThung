/**
 * src/features/home/ContactSection.tsx
 *
 * Presentational-only section — zero state, zero side effects.
 * Hiển thị thông tin liên hệ cơ bản của dự án KLTN NLU 2026.
 *
 * Design: nhất quán 100% với design system (bg-muted, alternating pattern).
 * Anchor id="contact" để footer link scroll đến đây.
 */
import {
  Mail,
  School,
  BookOpen,
  FolderGit2,
  Calendar,
  User,
} from "lucide-react";

interface ContactItem {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
}

const CONTACT_ITEMS: ContactItem[] = [
  {
    icon: <User className="w-4 h-4" />,
    label: "Sinh viên thực hiện",
    value: "Nguyễn Phát Thịnh",
  },
  {
    icon: <Mail className="w-4 h-4" />,
    label: "Email",
    value: "nguyenphatthinh89@gmail.com",
    href: "mailto:nguyenphatthinh89@gmail.com",
  },
  {
    icon: <School className="w-4 h-4" />,
    label: "Trường",
    value: "Đại học Nông Lâm TP.HCM (NLU)",
  },
  {
    icon: <BookOpen className="w-4 h-4" />,
    label: "Khoa",
    value: "Môi trường và Tài nguyên",
  },
  {
    icon: <FolderGit2 className="w-4 h-4" />,
    label: "GitHub",
    value: "PhTh1789/XepThung",
    href: "https://github.com/PhTh1789/XepThung",
  },
  {
    icon: <Calendar className="w-4 h-4" />,
    label: "Năm thực hiện",
    value: "2026",
  },
];

export function ContactSection() {
  return (
    <section
      id="contact"
      className="w-full bg-muted border-t border-border/50 py-16 md:py-24 flex justify-center"
      aria-label="Thông tin liên hệ"
    >
      <div className="w-full max-w-[1280px] px-6 sm:px-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-start">
          {/* Left: Context */}
          <div className="flex flex-col gap-4">
            <h2 className="font-bold text-2xl sm:text-[24px] text-foreground leading-[32px]">
              Liên hệ & Thông tin dự án
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed">
              Đây là hệ thống Xếp Thùng — Đồ án Tốt nghiệp (KLTN) năm 2026, được
              xây dựng để hỗ trợ tài xế Việt Nam tối ưu hóa không gian xếp hàng
              trên xe tải.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Mọi góp ý, phản hồi hoặc hợp tác vui lòng liên hệ qua email hoặc
              GitHub bên dưới.
            </p>

            {/* Disclaimer badge */}
            <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 rounded-lg bg-background border border-border/80 w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              <span className="text-xs text-muted-foreground font-medium">
                Dự án phi thương mại — Mục đích học thuật
              </span>
            </div>
          </div>

          {/* Right: Contact items */}
          <div className="flex flex-col gap-0 divide-y divide-border/60">
            {CONTACT_ITEMS.map((item) => (
              <div key={item.label} className="flex items-center gap-4 py-3.5">
                {/* Icon */}
                <span className="w-8 h-8 rounded-lg bg-background border border-border/80 flex items-center justify-center text-muted-foreground shrink-0">
                  {item.icon}
                </span>

                {/* Label + Value */}
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide leading-none">
                    {item.label}
                  </span>
                  {item.href ? (
                    <a
                      href={item.href}
                      target={
                        item.href.startsWith("http") ? "_blank" : undefined
                      }
                      rel={
                        item.href.startsWith("http")
                          ? "noopener noreferrer"
                          : undefined
                      }
                      className="text-[14px] font-medium text-primary hover:underline transition-colors truncate"
                    >
                      {item.value}
                    </a>
                  ) : (
                    <span className="text-[14px] font-medium text-foreground truncate">
                      {item.value}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
