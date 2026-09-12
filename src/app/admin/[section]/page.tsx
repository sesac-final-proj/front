import { notFound } from "next/navigation";
import AdminSectionPage from "@/components/admin/AdminSectionPage";
const sections = ["trade-dashboard","trades","quality","insights","market-trends","sources","price-model","price-comparison","environment","risks","donations","notices","system"];
export function generateStaticParams() { return sections.map(section => ({ section })); }
export default async function SectionPage({ params }: { params: Promise<{ section: string }> }) {
 const { section } = await params;
 if (!sections.includes(section)) notFound();
 return <AdminSectionPage section={section} key={section} />;
}
