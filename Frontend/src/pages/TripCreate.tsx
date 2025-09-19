import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarIcon, MapPin, Users, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const TripCreate = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const onPlan = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: "Your trip has been planned!", description: "We created your basic itinerary." });
    navigate("/itinerary");
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navigation />
      <main className="container mx-auto px-6 pt-24 pb-12 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-bold mb-6 gradient-hero bg-clip-text text-transparent">Create a new trip</h1>
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Trip details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={onPlan} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Destination</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input className="pl-9" placeholder="City, Country" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Travel dates</Label>
                    <div className="relative">
                      <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input className="pl-9" placeholder="Aug 10 — Aug 18, 2025" required />
                    </div>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Travelers</Label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input className="pl-9" placeholder="2 adults" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Budget (optional)</Label>
                    <Input placeholder="$2500" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea rows={4} placeholder="Anything special for this trip?" />
                </div>
                <div className="flex justify-end">
                  <Button type="submit" className="gradient-hero btn-neumorph"><Plus className="mr-2 h-4 w-4" /> Plan a new trip</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default TripCreate;
