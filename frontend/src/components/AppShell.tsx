import {
  Download,
  FileText,
  GraduationCap,
  LayoutDashboard,
  UserRound,
} from "lucide-react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";

const navItems = [
  { to: "/", label: "สร้างข้อสอบ", icon: FileText, end: true },
  { to: "/dashboard", label: "ภาพรวมห้อง", icon: LayoutDashboard },
  {
    to: "/students/STU001",
    label: "รายงานรายบุคคล",
    icon: UserRound,
    report: true,
  },
  { to: "/exports", label: "ส่งออกเอกสาร", icon: Download },
];

export function AppShell() {
  const location = useLocation();
  return (
    <div className="shell">
      <aside className="sidebar">
        <Link className="brand" to="/">
          <GraduationCap aria-hidden="true" />
          TeacherOS
        </Link>
        <nav aria-label="เมนูหลัก">
          {navItems.map((item) => {
            const Icon = item.icon;
            const reportActive =
              item.report && location.pathname.startsWith("/students/");
            return (
              <NavLink
                end={item.end}
                className={({ isActive }) =>
                  isActive || reportActive ? "active" : undefined
                }
                to={item.to}
                key={item.to}
              >
                <Icon aria-hidden="true" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="profile">
          <UserRound aria-hidden="true" />
          ครูสมชาย ใจดี
          <br />
          <small>โรงเรียนวัดปัญญา</small>
        </div>
      </aside>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
