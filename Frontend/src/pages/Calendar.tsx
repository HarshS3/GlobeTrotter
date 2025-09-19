import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarPrimitive } from "@/components/ui/calendar";
import { motion } from "framer-motion";
import { useState } from "react";

const Calendar = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navigation />
      <main className="container mx-auto px-6 pt-24 pb-12 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-bold mb-6 gradient-hero bg-clip-text text-transparent">Calendar</h1>
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Plan overview</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
              <CalendarPrimitive mode="single" selected={date} onSelect={setDate} className="rounded-md border" />
              <div>
                <h3 className="font-semibold mb-2">Upcoming</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>Mar 15 — Tokyo Adventure</li>
                  <li>Apr 10 — European Grand Tour</li>
                  <li>Aug 02 — Bali Retreat</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default Calendar;
