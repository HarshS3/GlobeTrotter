import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type ActivityRecord = {
  id: number;
  title: string;
  category?: string;
  cost?: number;
  start_time?: string;
  duration_minutes?: number;
  day_offset?: number;
  notes?: string;
  creator_email?: string;
  stop_id: number;
  stop_position: number;
  stop_city: string;
  stop_country?: string;
  stop_start_date: string;
  stop_end_date: string;
  trip_id: number;
  trip_name: string;
  trip_start_location?: string;
  trip_end_location?: string;
  trip_start_date?: string;
  trip_end_date?: string;
  cover_photo_url?: string;
  image_url?: string;
};

const ActivitySearch = () => {
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
  const { data } = await api.get('/activities');
  if (!cancelled) setActivities(data);
      } catch (e:any) {
        if (!cancelled) setError('Failed to load trips');
      } finally { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navigation />
      <main className="container mx-auto px-6 pt-24 pb-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-8">
            <h1 className="text-4xl font-bold gradient-hero bg-clip-text text-transparent">All Activities</h1>
            <p className="text-muted-foreground">Collaborative activities across every trip stop (latest first).</p>
          </div>

          {loading && <div className="text-muted-foreground">Loading...</div>}
          {error && !loading && <div className="text-red-500 text-sm mb-4">{error}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {!loading && activities.map((a, idx) => {
                const img = a.cover_photo_url || a.image_url || 'https://placehold.co/600x360?text=Activity';
                return (
                  <motion.div key={a.id} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.02 }}>
                    <Card className="glass-card overflow-hidden hover:scale-[1.02] transition-transform">
                      <div className="h-44 overflow-hidden">
                        <img src={img} alt={a.title} className="w-full h-full object-cover" />
                      </div>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex flex-wrap gap-2 items-center">
                          <span>{a.title}</span>
                          {typeof a.cost === 'number' && a.cost > 0 && <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">${a.cost.toFixed(2)}</span>}
                        </CardTitle>
                        <div className="text-xs text-muted-foreground flex flex-col gap-1">
                          <span>Trip: {a.trip_name}</span>
                          <span>Stop #{a.stop_position}: {a.stop_city}{a.stop_country ? `, ${a.stop_country}` : ''}</span>
                          {a.start_time && <span>Starts {a.start_time}</span>}
                          {a.duration_minutes && <span>Duration {a.duration_minutes}m</span>}
                          {a.creator_email && <span className="opacity-70">by {a.creator_email}</span>}
                        </div>
                      </CardHeader>
                      <CardContent>
                        {a.notes && <div className="text-xs text-muted-foreground line-clamp-3 mb-2">{a.notes}</div>}
                        <Button size="sm" variant="outline" className="w-full">View Trip</Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {!loading && !activities.length && (
              <div className="text-sm text-muted-foreground">No activities found yet. Add one via a trip stop.</div>
            )}
        </motion.div>
      </main>
    </div>
  );
};

export default ActivitySearch;
