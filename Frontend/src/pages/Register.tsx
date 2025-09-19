import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import * as React from "react";
import { useUser } from "@/context/UserContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

const Register = () => {
  const navigate = useNavigate();
  const { setUser } = useUser();
  const { toast } = useToast();
  const [avatar, setAvatar] = React.useState<string | undefined>();

  const onPickAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatar(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const firstName = (form.elements.namedItem("firstName") as HTMLInputElement)?.value || "Traveler";
    const lastName = (form.elements.namedItem("lastName") as HTMLInputElement)?.value || "";
    setUser({ firstName, lastName, avatarDataUrl: avatar });
    toast({ title: `Hey, ${firstName}!`, description: "Welcome to Globetrotter." });
    navigate("/trips");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navigation />

      <main className="container mx-auto px-6 pt-28 pb-12 max-w-xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-3xl text-center">Create your account</CardTitle>
              <p className="text-center text-muted-foreground">Join and start planning</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="flex flex-col items-center gap-3">
                  <label htmlFor="avatar" className="cursor-pointer">
                    <input id="avatar" type="file" accept="image/*" className="hidden" onChange={onPickAvatar} />
                    <div className="relative">
                      <Avatar className="h-24 w-24 ring-2 ring-primary/40">
                        {avatar ? (
                          <AvatarImage src={avatar} alt="avatar" />
                        ) : (
                          <AvatarFallback>Photo</AvatarFallback>
                        )}
                      </Avatar>
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-xs text-muted-foreground">Tap to upload</div>
                    </div>
                  </label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First name</Label>
                    <Input id="firstName" name="firstName" placeholder="Ava" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last name</Label>
                    <Input id="lastName" name="lastName" placeholder="Lopez" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="you@example.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" placeholder="Create a strong password" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirm password</Label>
                  <Input id="confirm" type="password" placeholder="Re-enter password" required />
                </div>
                <div className="text-sm text-muted-foreground">
                  By continuing you agree to our <Link to="#" className="text-primary hover:underline">Terms</Link> and <Link to="#" className="text-primary hover:underline">Privacy Policy</Link>.
                </div>
                <Button type="submit" className="w-full gradient-hero btn-neumorph">Register</Button>
              </form>
              <p className="mt-6 text-center text-sm text-muted-foreground">
                Already have an account? <Link to="/login" className="text-primary hover:underline">Sign in</Link>
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default Register;
