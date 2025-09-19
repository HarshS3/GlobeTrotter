import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Heart, ChatCircle, Share, BookmarkSimple, MapPin, Calendar } from "phosphor-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";

const Community = () => {
  const [likedPosts, setLikedPosts] = useState<number[]>([]);
  const [savedPosts, setSavedPosts] = useState<number[]>([]);

  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`${import.meta.env.VITE_APP_API_BASE || import.meta.env.VITE_API_BASE || 'http://localhost:3000'}/public/trips`);
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        if (!cancelled) setTrips(data);
      } catch (e:any) {
        if (!cancelled) setError('Could not load public trips');
      } finally { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const toggleLike = (postId: number) => {
    setLikedPosts(prev =>
      prev.includes(postId)
        ? prev.filter(id => id !== postId)
        : [...prev, postId]
    );
  };

  const toggleSave = (postId: number) => {
    setSavedPosts(prev =>
      prev.includes(postId)
        ? prev.filter(id => id !== postId)
        : [...prev, postId]
    );
  };

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
          <h1 className="text-5xl font-bold mb-4 gradient-hero bg-clip-text text-transparent">
            Travel Community
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Share your adventures and get inspired by fellow travelers
          </p>
          
          <Button size="lg" className="gradient-hero btn-neumorph">
            Share Your Trip
          </Button>
        </motion.div>

        {/* Community Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        >
          <Card className="glass-card text-center">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-primary mb-2">24.5K</div>
              <div className="text-muted-foreground">Active Travelers</div>
            </CardContent>
          </Card>
          <Card className="glass-card text-center">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-primary mb-2">185K</div>
              <div className="text-muted-foreground">Shared Experiences</div>
            </CardContent>
          </Card>
          <Card className="glass-card text-center">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-primary mb-2">95+</div>
              <div className="text-muted-foreground">Countries Explored</div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Posts Feed */}
        <div className="max-w-2xl mx-auto space-y-6">
          {loading && <div className="text-center text-muted-foreground">Loading public trips...</div>}
          {error && !loading && <div className="text-center text-red-500 text-sm mb-4">{error}</div>}
          {!loading && trips.map((trip, index) => (
            <motion.div
              key={trip.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <Card className="glass-card">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Avatar>
                      <AvatarImage src={trip.photo_url || trip.cover_photo_url || trip.image_url} alt={trip.name} />
                      <AvatarFallback>{trip.name?.[0]?.toUpperCase() || "T"}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold">{trip.name}</div>
                      <div className="text-sm text-muted-foreground">{trip.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                    <MapPin size={14} />
                    {trip.start_location} → {trip.end_location}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {(trip.cover_photo_url || trip.image_url) && (
                    <div className="mb-4 rounded-lg overflow-hidden">
                      <img
                        src={trip.cover_photo_url || trip.image_url}
                        alt={trip.name}
                        className="w-full h-64 object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar size={14} className="text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{trip.start_date} → {trip.end_date}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
          {!loading && !trips.length && (
            <div className="text-center text-muted-foreground py-12">No public trips found.</div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Community;