import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { useUser } from "@/context/UserContext";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const navigate = useNavigate();
  const { user, setUser } = useUser();
  const { toast } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const email = (form.elements.namedItem("email") as HTMLInputElement)?.value;
    // Simulate: if we have a stored name, keep it; else derive a simple name from email prefix
    let firstName = user?.firstName;
    if (!firstName) firstName = (email || "traveler").split("@")[0];
    setUser({ firstName, lastName: user?.lastName || "", avatarDataUrl: user?.avatarDataUrl });
    toast({ title: `Hey, ${firstName}!`, description: "Welcome back." });
    navigate("/trips");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navigation />

      <main className="container mx-auto px-6 pt-28 pb-12 max-w-xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-3xl text-center">Welcome back</CardTitle>
              <p className="text-center text-muted-foreground">Sign in to continue planning</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="you@example.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" placeholder="••••••••" required />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <label className="inline-flex items-center gap-2 select-none">
                    <input type="checkbox" className="accent-primary" />
                    Remember me
                  </label>
                  <Link to="#" className="text-primary hover:underline">Forgot password?</Link>
                </div>
                <Button type="submit" className="w-full gradient-hero btn-neumorph">Sign In</Button>
              </form>
              <p className="mt-6 text-center text-sm text-muted-foreground">
                New here? <Link to="/register" className="text-primary hover:underline">Create an account</Link>
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default Login;
