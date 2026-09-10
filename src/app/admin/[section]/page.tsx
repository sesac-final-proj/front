import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import AdminSectionPage from "@/components/admin/AdminSectionPage";
const sections = ["trades","quality","insights","sources","price-model","donations","notices","system"];
export function generateStaticParams() { return sections.map(section => ({ section })); }
export default async function SectionPage({ params }: { params: Promise<{ section: string }> }) {
 const { section } = await params;
 if (section === "price-model") redirect("/admin/insights");
 if (!sections.includes(section)) notFound();
 return <AdminSectionPage section={section} key={section} />;
}
