import {
  FileText,
  Files,
  GraduationCap,
  Home,
  LayoutDashboard,
  UserRound,
} from "lucide-react";
import { Link, Outlet, useLocation } from "react-router-dom";

const navItems = [
  {
    to: "/",
    label: "หน้าหลัก",
    icon: Home,
    activeOn: (pathname: string) => pathname === "/",
  },
  {
    to: "/assessments",
    label: "การประเมิน",
    icon: FileText,
    activeOn: (pathname: string) =>
      pathname === "/assessments" ||
      pathname.startsWith("/assessments/") ||
      pathname === "/quiz",
  },
  {
    to: "/dashboard",
    label: "ห้องเรียน",
    icon: LayoutDashboard,
    activeOn: (pathname: string) =>
      pathname === "/dashboard" ||
      pathname.startsWith("/dashboard/") ||
      pathname.startsWith("/students/"),
  },
  {
    to: "/documents",
    label: "เอกสาร",
    icon: Files,
    activeOn: (pathname: string) =>
      pathname === "/documents" ||
      pathname.startsWith("/documents/") ||
      pathname === "/exports",
  },
];

export function AppShell() {
  const location = useLocation();
  return (
    <div className="shell">
      <aside className="sidebar">
        <Link className="brand" to="/">
          <GraduationCap aria-hidden="true" />
          <span className="brand-label">TeacherOS</span>
        </Link>
        <nav aria-label="เมนูหลัก">
          {navItems.map((item) => {
            const Icon = item.icon;
            const groupActive = item.activeOn(location.pathname);
            return (
              <Link
                aria-current={groupActive ? "page" : undefined}
                className={groupActive ? "active" : undefined}
                to={item.to}
                key={item.to}
              >
                <Icon aria-hidden="true" />
                <span className="nav-label">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="profile">
          <UserRound aria-hidden="true" />
          <span>
            <b>ครูสมชาย ใจดี</b>
            <br />
            <small>โรงเรียนวัดปัญญา</small>
          </span>
        </div>
      </aside>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
