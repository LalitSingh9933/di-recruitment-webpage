import Link from "next/link";
import {
  BriefcaseBusiness,
  FileUser,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  LockKeyhole,
} from "lucide-react";
import { getSession } from "@/lib/auth";
import { logoutAction } from "./actions";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) return <>{children}</>;
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link href="/" className="brand brand-light">
          <span className="brand-mark">DI</span>
          <span>
            <b>D.I. Recruitment</b>
            <small>Admin console</small>
          </span>
        </Link>
        <nav>
          <Link href="/admin/featured-opportunity">
            <BriefcaseBusiness /> Featured opportunity
          </Link>
          <Link href="/admin/carousel">
            <FolderOpen /> Homepage carousel
          </Link>
          <Link href="/admin/testimonials">
            <FileUser /> Testimonials
          </Link>
          <Link href="/admin/contacts">
            <FileUser /> Contact submissions
          </Link>
          <Link href="/admin">
            <LayoutDashboard /> Overview
          </Link>
          <Link href="/admin/jobs">
            <BriefcaseBusiness /> Jobs
          </Link>
          <Link href="/admin/pages">
            <FileUser /> About pages
          </Link>
          <Link href="/admin/documents">
            <FileUser /> Legal documents
          </Link>
          <Link href="/admin/blog">
            <FileUser /> Blog
          </Link>
          <Link href="/admin/gallery">
            <FolderOpen /> Event gallery
          </Link>
          <Link href="/admin/team">
            <FileUser /> Team
          </Link>
          <Link href="/admin/applications">
            <FileUser /> Applications
          </Link>
          <Link href="/admin/settings">
            <LockKeyhole /> Change password
          </Link>
        </nav>
        <form action={logoutAction}>
          <button>
            <LogOut /> Sign out
          </button>
        </form>
      </aside>
      <div className="admin-main">
        <div className="admin-top">
          <span>Secure administration</span>
          <span>{session.email}</span>
        </div>
        {children}
      </div>
    </div>
  );
}
