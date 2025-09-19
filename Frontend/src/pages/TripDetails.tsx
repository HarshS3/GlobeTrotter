import Navigation from "@/components/Navigation";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, ArrowLeft, ArrowDown, Clock, DollarSign, Activity as ActivityIcon } from "lucide-react";

interface Trip {
  id: number;
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  start_location?: string;
  end_location?: string;
  cover_photo_url?: string;
}

interface ItineraryData {
  trip: {
    id: number; name: string; start_date: string; end_date: string; start_location: string; end_location: string;
    total_cost: number; stops_count: number; activities_count: number;
  };
  stops: Array<{
    id: number; position: number; city: string; country: string; start_date: string; end_date: string;
    activities_count: number; activities_cost: number; activities: Array<{
      id: number; title: string; category: string; cost: number; day_offset: number; start_time?: string; duration_minutes?: number; notes?: string; creator_email?: string;
    }>;
  }>;
}

const TripDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [itinerary, setItinerary] = useState<ItineraryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!id) return;
      setLoading(true);
      try {
        const tripRes = await api.get(`/trips/${id}`);
        if (cancelled) return;
        setTrip(tripRes.data);
        // fetch itinerary separately; don't block displaying basic trip on failure
        try {
          const itinRes = await api.get(`/trips/${id}/itinerary`);
          if (!cancelled) setItinerary(itinRes.data);
        } catch (ie:any) {
          if (!cancelled) setError(ie?.response?.data?.message || 'Itinerary unavailable');
        }
      } catch (e:any) {
        if (!cancelled) setError(e?.response?.data?.message || 'Failed to load trip');
      } finally { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navigation />
      <main className="container mx-auto px-6 pt-24 pb-12 max-w-4xl">
        <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        {loading && <div className="text-muted-foreground">Loading trip...</div>}
        {error && !loading && <div className="text-red-500 text-sm">{error}</div>}
        {trip && !loading && (
          <div className="space-y-6">
            <Card className="glass-card overflow-hidden">
              {(trip.cover_photo_url || (trip as any).image_url) && (
                <img src={trip.cover_photo_url || (trip as any).image_url} alt={trip.name} className="w-full h-64 object-cover" />
              )}
              <CardHeader>
                <CardTitle className="text-3xl">{trip.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {trip.description && <p className="text-muted-foreground">{trip.description}</p>}
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center"><MapPin className="h-4 w-4 mr-1" /> {trip.start_location} → {trip.end_location}</span>
                  <span className="flex items-center"><Calendar className="h-4 w-4 mr-1" /> {trip.start_date} – {trip.end_date}</span>
                </div>
              </CardContent>
            </Card>
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold flex items-center gap-3">Itinerary <span className="text-sm font-normal text-muted-foreground">({itinerary?.trip.activities_count} activities · {itinerary?.trip.stops_count} stops · total cost ${itinerary?.trip.total_cost?.toFixed(2)})</span></h2>
              {!itinerary?.stops?.length && <div className="text-sm text-muted-foreground">No stops yet – add some stops to build your itinerary.</div>}
              {itinerary?.stops?.length && (
                <div className="relative">
                  <div className="absolute left-5 top-0 bottom-0 w-px bg-gradient-to-b from-primary/60 via-primary/30 to-transparent" />
                  <ul className="space-y-10">
                    {/* Departure marker */}
                    <li className="relative pl-12">
                      <div className="absolute left-2 top-0 flex flex-col items-center">
                        <div className="h-6 w-6 rounded-full bg-gradient-to-br from-emerald-500 to-primary text-white flex items-center justify-center text-[10px] font-semibold shadow">D</div>
                        <div className="mt-1 flex flex-col items-center">
                          <ArrowDown className="h-4 w-4 text-primary/60 animate-pulse" />
                        </div>
                      </div>
                      <Card className="glass-card border-emerald-500/40">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <MapPin className="h-4 w-4" /> Depart: {itinerary.trip.start_location}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs text-muted-foreground -mt-2">Trip start {itinerary.trip.start_date}</CardContent>
                      </Card>
                    </li>
                    {itinerary.stops.map((s, idx) => {
                      const isLastStop = idx === itinerary.stops.length - 1;
                      return (
                        <li key={s.id} className="relative pl-12">
                          <div className="absolute left-2 top-0 flex flex-col items-center">
                            <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-semibold shadow">{s.position}</div>
                            {!isLastStop && <div className="flex-1 mt-1 mb-1 flex flex-col items-center"><ArrowDown className="h-4 w-4 text-primary/60 animate-pulse" /></div>}
                            {isLastStop && (
                              <div className="mt-1 flex flex-col items-center">
                                <ArrowDown className="h-4 w-4 text-primary/60 animate-pulse" />
                              </div>
                            )}
                          </div>
                          <Card className="glass-card">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-xl flex flex-wrap items-center gap-2">
                                <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {s.city}{s.country ? `, ${s.country}` : ''}</span>
                                <span className="text-sm font-normal text-muted-foreground flex items-center gap-1"><Calendar className="h-4 w-4" /> {s.start_date} → {s.end_date}</span>
                                {s.activities_count > 0 && <span className="text-xs rounded bg-primary/10 px-2 py-0.5 text-primary">{s.activities_count} activities</span>}
                                {s.activities_cost > 0 && <span className="text-xs flex items-center gap-1 text-emerald-600 dark:text-emerald-400"><DollarSign className="h-3 w-3" />{s.activities_cost.toFixed(2)}</span>}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              {!s.activities.length && <div className="text-xs italic text-muted-foreground">No activities added for this stop.</div>}
                              {s.activities.length > 0 && (
                                <div className="space-y-2">
                                  {s.activities.map(a => (
                                    <div key={a.id} className="p-3 rounded-lg border bg-background/40 backdrop-blur-sm flex flex-col gap-1">
                                      <div className="flex items-center justify-between">
                                        <div className="font-medium flex items-center gap-2"><ActivityIcon className="h-4 w-4 text-primary" /> {a.title}</div>
                                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                                          {a.start_time && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{a.start_time}</span>}
                                          {typeof a.cost === 'number' && a.cost > 0 && <span className="flex items-center gap-0.5"><DollarSign className="h-3 w-3" />{a.cost.toFixed(2)}</span>}
                                        </div>
                                      </div>
                                      {(a.category || a.notes || a.creator_email) && (
                                        <div className="text-xs text-muted-foreground flex flex-wrap gap-2">
                                          {a.category && <span className="px-2 py-0.5 rounded bg-primary/10 text-primary">{a.category}</span>}
                                          {a.creator_email && <span className="opacity-70">by {a.creator_email}</span>}
                                          {a.notes && <span className="w-full leading-snug">{a.notes}</span>}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </li>
                      );
                    })}
                    {/* Arrival marker */}
                    <li className="relative pl-12">
                      <div className="absolute left-2 top-0 flex flex-col items-center">
                        <div className="h-6 w-6 rounded-full bg-gradient-to-br from-primary to-fuchsia-500 text-white flex items-center justify-center text-[10px] font-semibold shadow">A</div>
                      </div>
                      <Card className="glass-card border-fuchsia-500/40">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <MapPin className="h-4 w-4" /> Arrive: {itinerary.trip.end_location}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs text-muted-foreground -mt-2">Trip end {itinerary.trip.end_date}</CardContent>
                      </Card>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default TripDetails;