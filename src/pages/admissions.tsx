import { Layout } from "@/components/layout";
import { Clock } from "lucide-react";

export default function Admissions() {
  return (
    <Layout>
      <div className="container py-24 flex flex-col items-center justify-center text-center min-h-[60vh]">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-6">
          <Clock className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground md:text-4xl">University Admissions Guide</h1>
        <p className="mt-4 max-w-lg text-muted-foreground">
          A comprehensive admissions guide is on its way. Stay tuned!
        </p>
      </div>
    </Layout>
  );
}
