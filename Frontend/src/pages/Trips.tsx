import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Calendar, MapPin, Clock } from "phosphor-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import { useUser } from "@/context/UserContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";

const Trips = () => {
  const [activeTab, setActiveTab] = useState("upcoming");
  const navigate = useNavigate();
  const { user } = useUser();

  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const { data } = await api.get('/trips');
        if (!cancelled) setTrips(data.map((t: any) => {
          const start = t.start_date ? new Date(t.start_date) : null;
          const end = t.end_date ? new Date(t.end_date) : null;
          const days = (start && end) ? Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000*60*60*24)) + 1) : 1;
          return {
            ...t,
            title: t.name,
            location: `${t.start_location || ''} -> ${t.end_location || ''}`,
            status: 'upcoming',
            image: t.cover_photo_url || t.image_url || 'https://placehold.co/600x400?text=Trip',
            activities: t.activities_count ?? 0,
            days,
            date: (t.start_date && t.end_date) ? `${t.start_date} → ${t.end_date}` : (t.start_date || '')
          };
        }));
      } catch (e:any) {
        if (!cancelled) {
          setError('Could not load trips');
          if (import.meta.env.VITE_ENABLE_MOCKS === 'true') setTrips([]);
        }
      } finally { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const filteredTrips = trips.filter(trip => {
    if (activeTab === "upcoming") return trip.status === "upcoming";
    if (activeTab === "planning") return trip.status === "planning";
    if (activeTab === "completed") return trip.status === "completed";
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navigation />
      
      <main className="container mx-auto px-6 pt-24 pb-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-3">
            <Avatar className="h-10 w-10">
              {user?.avatarDataUrl ? <AvatarImage src={user.avatarDataUrl} alt="me" /> : <AvatarFallback>ME</AvatarFallback>}
            </Avatar>
            <div className="text-left">
              <div className="text-sm text-muted-foreground">Hey{user?.firstName ? "," : ""}</div>
              <div className="text-lg font-semibold">{user?.firstName ? `${user.firstName} ${user.lastName ?? ""}` : "Traveler"}</div>
            </div>
          </div>
          <h1 className="text-5xl font-bold mb-4 gradient-hero bg-clip-text text-transparent">My Trips</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Manage and explore your travel adventures
          </p>
          
          <Button size="lg" className="gradient-hero btn-neumorph">
            <Plus size={20} className="mr-2" />
            Plan New Trip
          </Button>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex justify-center mb-8"
        >
          <div className="glass-card p-2 rounded-xl">
            {["upcoming", "planning", "completed"].map((tab) => (
              <Button
                key={tab}
                variant={activeTab === tab ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab(tab)}
                className={activeTab === tab ? "gradient-hero" : ""}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Trips Grid */}
        {loading && <div className="text-center text-muted-foreground">Loading trips...</div>}
        {error && !loading && <div className="text-center text-red-500 text-sm mb-4">{error}</div>}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredTrips.map((trip, index) => (
            <motion.div
              key={trip.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <Card className="glass-card hover:scale-105 transition-all duration-300 overflow-hidden">
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={trip.image}
                    alt={trip.title}
                    className="w-full h-full object-cover"
                  />
                  <Badge
                    className="absolute top-3 right-3"
                    variant={trip.status === "completed" ? "secondary" : "default"}
                  >
                    {trip.status}
                  </Badge>
                </div>
                
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl">{trip.title}</CardTitle>
                  <div className="flex items-center text-muted-foreground">
                    <MapPin size={16} className="mr-1" />
                    {trip.location}
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <div className="flex items-center">
                      <Calendar size={16} className="mr-1" />
                      {trip.date}
                    </div>
                    <div className="flex items-center">
                      <Clock size={16} className="mr-1" />
                      {trip.days} days
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      {trip.activities} activities
                    </span>
                    <Button variant="outline" size="sm" onClick={() => navigate(`/trips/${trip.id}`)}>
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {filteredTrips.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="text-6xl mb-4">✈️</div>
            <h3 className="text-xl font-semibold mb-2">No trips found</h3>
            <p className="text-muted-foreground mb-6">
              Start planning your next adventure!
            </p>
            <Button className="gradient-hero">
              <Plus size={20} className="mr-2" />
              Plan Your First Trip
            </Button>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default Trips;