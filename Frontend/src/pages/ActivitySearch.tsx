import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectValue, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { MagnifyingGlass } from "phosphor-react";

const mock = Array.from({ length: 8 }).map((_, i) => ({
  id: i + 1,
  title: ["City Walking Tour", "Museum Pass", "Food Tasting", "Boat Cruise"][i % 4],
  location: "Barcelona, Spain",
  image: `https://picsum.photos/seed/act${i}/600/360`,
  price: 35 + i * 10,
  rating: (4 + (i % 2) * 0.5).toFixed(1),
}));

const ActivitySearch = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navigation />
      <main className="container mx-auto px-6 pt-24 pb-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-4xl font-bold gradient-hero bg-clip-text text-transparent">Search activities</h1>
              <p className="text-muted-foreground">Discover things to do and book ahead</p>
            </div>
            <div className="flex gap-2">
              <Select>
                <SelectTrigger className="w-40"><SelectValue placeholder="Sort by" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">Most popular</SelectItem>
                  <SelectItem value="rating">Highest rated</SelectItem>
                  <SelectItem value="price">Price</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">Filters</Button>
            </div>
          </div>

          <div className="mb-6 flex items-center gap-3">
            <div className="flex-1 glass rounded-full p-2 pl-4 pr-2 flex items-center gap-3">
              <MagnifyingGlass size={20} className="text-muted-foreground" />
              <Input className="bg-transparent border-none focus-visible:ring-0" placeholder="Search activities, tours, or places" />
              <Button className="rounded-full gradient-hero">Search</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mock.map((a, idx) => (
              <motion.div key={a.id} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                <Card className="glass-card overflow-hidden hover:scale-[1.02] transition-transform">
                  <div className="h-44 overflow-hidden">
                    <img src={a.image} alt={a.title} className="w-full h-full object-cover" />
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{a.title}</CardTitle>
                    <div className="text-sm text-muted-foreground">{a.location}</div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">⭐ {a.rating}</Badge>
                        <Badge>${a.price}</Badge>
                      </div>
                      <Button size="sm" variant="outline">View</Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default ActivitySearch;
