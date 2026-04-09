import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { BookOpen, GraduationCap, Globe } from "lucide-react";

export default function Home() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative w-full py-20 md:py-32 lg:py-40 hero-gradient text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2070&auto=format&fit=crop')] opacity-10 bg-cover bg-center mix-blend-overlay"></div>
        <div className="container mx-auto px-4 relative z-10 flex flex-col items-center text-center">
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold tracking-tight max-w-4xl mb-6">
            Your path to the world's best universities
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl text-primary-foreground/90 max-w-2xl mb-10 font-medium leading-relaxed">
            Expert guidance, test preparation, and exclusive programs for ambitious students aiming for global excellence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link to="/programs">
              <Button size="lg" className="w-full sm:w-auto gold-gradient text-accent-foreground font-bold hover:opacity-90 shadow-lg hover:shadow-xl transition-all border-none" data-testid="btn-hero-explore">
                Explore Programs
              </Button>
            </Link>
            <Link to="/admissions">
              <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" data-testid="btn-hero-guide">
                Admissions Guide
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 md:py-24 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Everything you need to succeed</h2>
            <p className="text-lg text-muted-foreground">Comprehensive resources tailored for international applicants worldwide.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30 group bg-card">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <BookOpen className="h-6 w-6 text-primary group-hover:text-primary-foreground" />
                </div>
                <CardTitle className="text-xl">IELTS & SAT Prep</CardTitle>
                <CardDescription className="text-base mt-2">Targeted strategies to maximize your scores on essential standardized tests.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3">
                  <Link to="/ielts" className="text-sm font-medium text-primary hover:underline flex items-center gap-1" data-testid="link-feature-ielts">
                    Explore IELTS resources <span aria-hidden="true">→</span>
                  </Link>
                  <Link to="/sat" className="text-sm font-medium text-primary hover:underline flex items-center gap-1" data-testid="link-feature-sat">
                    Explore SAT resources <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30 group bg-card">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Globe className="h-6 w-6 text-primary group-hover:text-primary-foreground" />
                </div>
                <CardTitle className="text-xl">Programs & Camps</CardTitle>
                <CardDescription className="text-base mt-2">Discover summer programs, internships, and courses to boost your profile.</CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/programs" className="text-sm font-medium text-primary hover:underline flex items-center gap-1" data-testid="link-feature-programs">
                  Browse opportunities <span aria-hidden="true">→</span>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30 group bg-card">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <GraduationCap className="h-6 w-6 text-primary group-hover:text-primary-foreground" />
                </div>
                <CardTitle className="text-xl">University Admissions</CardTitle>
                <CardDescription className="text-base mt-2">Step-by-step guidance through the complex international application process.</CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/admissions" className="text-sm font-medium text-primary hover:underline flex items-center gap-1" data-testid="link-feature-admissions">
                  Read the guide <span aria-hidden="true">→</span>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-24 gold-gradient">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-accent-foreground mb-6">Ready to start your journey?</h2>
          <p className="text-lg text-accent-foreground/80 max-w-2xl mx-auto mb-10">
            Join Saubol today and get access to world-class educational resources and mentorship.
          </p>
          <Link to="/programs">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-8 shadow-lg" data-testid="btn-bottom-cta">
              Find Your Program
            </Button>
          </Link>
        </div>
      </section>
    </Layout>
  );
}
