import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, MapPin, Filter, AlertCircle, ExternalLink, Bookmark, BookmarkCheck } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export interface Program {
  id: string | number;
  name: string;
  details: string;
  overview?: string;
  format: string;
  location: string;
  price: string;
  subject: string;
  url?: string;
}

const SUBJECT_FILTERS = [
  "All",
  "Mixed",
  "STEM",
  "Medicine",
  "Humanities",
  "Engineering",
  "Business",
  "Art",
  "Mathematics",
  "Computer Science",
  "Biology",
  "Astronomy",
  "Logic",
];

const FORMAT_FILTERS = ["All", "Remote", "In-Person", "Both"];
const PRICE_FILTERS = ["All", "Free", "Paid"];

async function fetchPrograms(): Promise<Program[]> {
  const { data, error } = await supabase
    .from("programs")
    .select("id, name, details, format, location, price, subject, url, overview")
    .order("name");

  if (error) {
    throw new Error(error.message || "Failed to fetch programs");
  }

  return data ?? [];
}

export default function Programs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [selectedFormat, setSelectedFormat] = useState("All");
  const [selectedPrice, setSelectedPrice] = useState("All");
  const [savedPrograms, setSavedPrograms] = useState<Set<string>>(new Set());

  const { user } = useAuth();

  const { data: programs = [], isLoading, error } = useQuery<Program[], Error>({
    queryKey: ["programs"],
    queryFn: fetchPrograms,
    retry: 1,
  });

  // Fetch saved programs when user is logged in
  useQuery({
    queryKey: ["saved-programs", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("saved_programs")
        .select("program_name")
        .eq("user_id", user.id);
      
      if (error) throw error;
      const programNames = new Set(data?.map(p => p.program_name) || []);
      setSavedPrograms(programNames);
      return data;
    },
    enabled: !!user,
  });

  const toggleBookmark = async (program: Program) => {
    if (!user) return;

    const isSaved = savedPrograms.has(program.name);
    
    try {
      if (isSaved) {
        // Remove from saved programs
        await supabase
          .from("saved_programs")
          .delete()
          .eq("user_id", user.id)
          .eq("program_name", program.name);
        
        setSavedPrograms(prev => {
          const newSet = new Set(prev);
          newSet.delete(program.name);
          return newSet;
        });
      } else {
        // Add to saved programs
        await supabase
          .from("saved_programs")
          .insert({
            user_id: user.id,
            program_name: program.name,
            program_url: program.url || ""
          });
        
        setSavedPrograms(prev => new Set(prev).add(program.name));
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  const filteredPrograms = useMemo(() => {
    return programs.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.subject || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSubject = selectedSubject === "All" || p.subject === selectedSubject;
      const matchesFormat = selectedFormat === "All" || p.format === selectedFormat;
      const matchesPrice = selectedPrice === "All" || p.price === selectedPrice;
      return matchesSearch && matchesSubject && matchesFormat && matchesPrice;
    });
  }, [searchQuery, selectedSubject, selectedFormat, selectedPrice, programs]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedSubject("All");
    setSelectedFormat("All");
    setSelectedPrice("All");
  };

  const hasFilters = selectedSubject !== "All" || selectedFormat !== "All" || selectedPrice !== "All" || searchQuery;

  return (
    <Layout>
      <div className="bg-secondary/30 py-12 md:py-16 border-b border-border">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">Programs & Camps</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Discover life-changing educational opportunities, summer schools, and research internships around the world to strengthen your university application.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Filters Sidebar - Desktop */}
          <div className="hidden lg:block w-64 shrink-0 space-y-8">
            <div>
              <h3 className="font-semibold text-lg mb-4 text-foreground">Search</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Find a program..."
                  className="pl-9 bg-background"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-program-search"
                />
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-4 text-foreground">Subject Area</h3>
              <div className="flex flex-wrap gap-2">
                {SUBJECT_FILTERS.map((subject) => (
                  <Badge
                    key={subject}
                    variant={selectedSubject === subject ? "default" : "outline"}
                    className={`cursor-pointer px-3 py-1 ${selectedSubject === subject ? "bg-primary" : "bg-background hover:bg-muted"}`}
                    onClick={() => setSelectedSubject(subject)}
                  >
                    {subject}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-4 text-foreground">Format</h3>
              <div className="flex flex-wrap gap-2">
                {FORMAT_FILTERS.map((format) => (
                  <Badge
                    key={format}
                    variant={selectedFormat === format ? "default" : "outline"}
                    className={`cursor-pointer px-3 py-1 ${selectedFormat === format ? "bg-primary" : "bg-background hover:bg-muted"}`}
                    onClick={() => setSelectedFormat(format)}
                  >
                    {format}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-4 text-foreground">Cost</h3>
              <div className="flex flex-wrap gap-2">
                {PRICE_FILTERS.map((price) => (
                  <Badge
                    key={price}
                    variant={selectedPrice === price ? "default" : "outline"}
                    className={`cursor-pointer px-3 py-1 ${selectedPrice === price ? "bg-primary" : "bg-background hover:bg-muted"}`}
                    onClick={() => setSelectedPrice(price)}
                  >
                    {price}
                  </Badge>
                ))}
              </div>
            </div>

            {hasFilters && (
              <Button variant="ghost" className="w-full text-muted-foreground hover:text-foreground" onClick={clearFilters}>
                Clear all filters
              </Button>
            )}
          </div>

          {/* Mobile Filters */}
          <div className="lg:hidden flex items-center gap-4 w-full">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Find a program..."
                className="pl-9 bg-background"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-program-search-mobile"
              />
            </div>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" data-testid="btn-mobile-filter">
                  <Filter className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                  <SheetDescription>Narrow down program options.</SheetDescription>
                </SheetHeader>
                <ScrollArea className="h-[80vh] pr-4">
                  <div className="py-6 space-y-6">
                    <div>
                      <h3 className="font-medium mb-3 text-sm">Subject</h3>
                      <div className="flex flex-wrap gap-2">
                        {SUBJECT_FILTERS.map((subject) => (
                          <Badge
                            key={subject}
                            variant={selectedSubject === subject ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => setSelectedSubject(subject)}
                          >
                            {subject}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium mb-3 text-sm">Format</h3>
                      <div className="flex flex-wrap gap-2">
                        {FORMAT_FILTERS.map((format) => (
                          <Badge
                            key={format}
                            variant={selectedFormat === format ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => setSelectedFormat(format)}
                          >
                            {format}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium mb-3 text-sm">Price</h3>
                      <div className="flex flex-wrap gap-2">
                        {PRICE_FILTERS.map((price) => (
                          <Badge
                            key={price}
                            variant={selectedPrice === price ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => setSelectedPrice(price)}
                          >
                            {price}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button className="w-full mt-4" variant="outline" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>
          </div>

          {/* Results */}
          <div className="flex-1">

            {/* Error */}
            {error && (
              <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border bg-card">
                <AlertCircle className="h-10 w-10 text-destructive mb-4" />
                <h3 className="font-semibold text-foreground mb-2">Could not load programs</h3>
                <p className="text-sm text-muted-foreground max-w-sm">{error.message}</p>
              </div>
            )}

            {/* Loading skeletons */}
            {isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex flex-col rounded-xl border bg-card p-6">
                    <Skeleton className="h-6 w-3/4 mb-3" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-5/6 mb-4" />
                    <div className="flex gap-2 mb-4">
                      <Skeleton className="h-5 w-16 rounded-full" />
                      <Skeleton className="h-5 w-14 rounded-full" />
                    </div>
                    <Skeleton className="h-9 w-full rounded-md" />
                  </div>
                ))}
              </div>
            )}

            {/* Programs grid */}
            {!isLoading && !error && (
              <>
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-lg font-medium text-foreground">
                    Showing {filteredPrograms.length} {filteredPrograms.length === 1 ? "result" : "results"}
                  </h2>
                </div>

                {filteredPrograms.length === 0 ? (
                  <div className="text-center py-20 bg-card rounded-xl border border-border/50">
                    <p className="text-lg text-muted-foreground font-medium">No programs found matching your criteria.</p>
                    <Button variant="link" onClick={clearFilters} className="mt-2">
                      Clear filters to see all programs
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredPrograms.map((program) => (
                      <Card key={program.id} className="flex flex-col h-full hover:shadow-md transition-shadow border-border/60 bg-card">
                        <CardHeader className="pb-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex flex-wrap gap-2 flex-1">
                              <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 border-transparent">
                                {program.subject}
                              </Badge>
                              <Badge variant="outline" className={program.price === "Free" ? "text-emerald-600 border-emerald-200 bg-emerald-50" : "text-amber-600 border-amber-200 bg-amber-50"}>
                                {program.price}
                              </Badge>
                              {program.format && (
                                <Badge variant="outline" className="text-muted-foreground">
                                  {program.format}
                                </Badge>
                              )}
                            </div>
                            {user && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleBookmark(program)}
                                className="ml-2 h-8 w-8 p-0 hover:bg-muted"
                                title={savedPrograms.has(program.name) ? "Remove bookmark" : "Bookmark program"}
                              >
                                {savedPrograms.has(program.name) ? (
                                  <BookmarkCheck className="h-4 w-4 text-primary" />
                                ) : (
                                  <Bookmark className="h-4 w-4 text-muted-foreground" />
                                )}
                              </Button>
                            )}
                          </div>
                          <CardTitle className="text-xl leading-tight text-foreground">{program.name}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{program.details}</p>
                        </CardHeader>
                        <CardContent className="flex-1 pb-4">
                          <div className="space-y-2.5 text-sm">
                            {program.location && (
                              <div className="flex items-center text-muted-foreground">
                                <MapPin className="h-4 w-4 mr-2 shrink-0" />
                                <span className="truncate">{program.location}</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                        <CardFooter className="pt-0 border-t border-border/50 mt-4">
                          <Sheet>
                            <SheetTrigger asChild>
                              <Button variant="ghost" className="w-full mt-4 text-primary hover:text-primary hover:bg-primary/5" data-testid={`btn-program-details-${program.id}`}>
                                View Details
                              </Button>
                            </SheetTrigger>
                            <SheetContent className="sm:max-w-md w-[90vw] p-0 flex flex-col">
                              <SheetHeader className="p-6 pb-2 text-left">
                                <div className="flex flex-wrap gap-2 mb-3">
                                  <Badge className="bg-primary/10 text-primary hover:bg-primary/20">{program.subject}</Badge>
                                  {program.format && <Badge variant="outline">{program.format}</Badge>}
                                  <Badge variant="outline" className={program.price === "Free" ? "text-emerald-600 border-emerald-200" : "text-amber-600 border-amber-200"}>
                                    {program.price}
                                  </Badge>
                                </div>
                                <SheetTitle className="text-2xl">{program.name}</SheetTitle>
                                <SheetDescription className="text-base mt-2">{program.details}</SheetDescription>
                              </SheetHeader>
                              <ScrollArea className="flex-1 p-6 pt-2">
                                <div className="space-y-6">
                                  {program.overview && (
                                    <div>
                                      <h4 className="font-semibold text-foreground mb-2">Overview</h4>
                                      <p className="text-sm text-muted-foreground leading-relaxed">{program.overview}</p>
                                    </div>
                                  )}
                                  {program.location && (
                                    <div className="bg-secondary/50 rounded-lg p-4">
                                      <h4 className="font-semibold text-foreground mb-3 text-sm uppercase tracking-wider">Location</h4>
                                      <div className="flex items-center text-sm text-muted-foreground">
                                        <MapPin className="h-4 w-4 mr-2 shrink-0" />
                                        <span>{program.location}</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </ScrollArea>
                              <div className="p-6 border-t border-border mt-auto">
                                {program.url ? (
                                  <a href={program.url} target="_blank" rel="noopener noreferrer">
                                    <Button className="w-full bg-primary">Visit Program Website</Button>
                                  </a>
                                ) : (
                                  <Button className="w-full bg-primary" disabled>Website Not Available</Button>
                                )}
                              </div>
                            </SheetContent>
                          </Sheet>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
