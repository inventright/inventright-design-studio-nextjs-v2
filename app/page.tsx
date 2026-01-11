import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center space-y-6 p-8">
        <h1 className="text-6xl font-bold text-gray-900">
          inventRight Design Studio
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Professional design services for inventors and entrepreneurs. Bring
          your ideas to life with our expert team.
        </p>
        <div className="flex gap-4 justify-center mt-8">
          <Link href="/admin/email-templates">
            <Button size="lg">Email Templates</Button>
          </Link>
          <Link href="/admin/vouchers">
            <Button size="lg" variant="outline">
              Vouchers
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
