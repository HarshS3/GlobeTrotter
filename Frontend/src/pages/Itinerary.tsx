import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Plus, Clock, MapPin, Ticket } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface Section { id: number; title: string; time?: string; location?: string; notes?: string; }

const Itinerary = () => {
  const [sections, setSections] = useState<Section[]>([
    { id: 1, title: "Flight to destination", time: "08:30", location: "JFK → CDG", notes: "Arrive 10:10 local" },
    { id: 2, title: "Hotel check-in", time: "12:00", location: "Le Marais, Paris" },
  ]);
  const { toast } = useToast();

  const addSection = () => {
    const id = sections.length ? sections[sections.length - 1].id + 1 : 1;
    setSections([...sections, { id, title: "New itinerary item" }]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navigation />
      <main className="container mx-auto px-6 pt-24 pb-12 max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-end justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold gradient-hero bg-clip-text text-transparent">Build itinerary</h1>
              <p className="text-muted-foreground">Add and organize your trip day by day</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => toast({ title: "Itinerary saved successfully!" })}>Save</Button>
              <Button onClick={addSection} className="gradient-hero btn-neumorph"><Plus className="mr-2 h-4 w-4" /> Add another Section</Button>
            </div>
          </div>

          <div className="space-y-4">
            {sections.map((s, idx) => (
              <motion.div key={s.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="text-lg">{s.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input className="pl-9" placeholder="Time" defaultValue={s.time} />
                      </div>
                      <div className="relative md:col-span-2">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input className="pl-9" placeholder="Location" defaultValue={s.location} />
                      </div>
                    </div>
                    <Textarea rows={3} placeholder="Notes" defaultValue={s.notes} />
                    <Separator />
                    <div className="grid md:grid-cols-2 gap-4">
                      <Input placeholder="Add ticket/reservation # (optional)" />
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm"><Ticket className="mr-2 h-4 w-4" /> Attach ticket</Button>
                        <Button variant="outline" size="sm">Add checklist</Button>
                      </div>
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

export default Itinerary;
