import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser } from "@/context/UserContext";
import { useToast } from "@/hooks/use-toast";
import * as React from "react";
import { api, logout as apiLogout } from "@/lib/api";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const { user, updateUser, setUser } = useUser();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const [firstName, setFirst] = React.useState(user?.firstName ?? "");
  const [lastName, setLast] = React.useState(user?.lastName ?? "");
  const [phone, setPhone] = React.useState("");
  const [city, setCity] = React.useState("");
  const [country, setCountry] = React.useState("");
  const [info, setInfo] = React.useState("");
  const [avatar, setAvatar] = React.useState<string | undefined>(user?.avatarDataUrl);
  const [email, setEmail] = React.useState("");

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const status = await api.get('/auth/status');
        if (!status.data.authenticated) return;
  const id = status.data.user.id;
  const userRes = await api.get(`/user/${id}`);
        if (cancelled) return;
        const u = userRes.data;
        setEmail(u.email);
        setFirst(u.firstName || "");
        setLast(u.lastName || "");
        setPhone(u.phone || "");
        setCity(u.city || "");
        setCountry(u.country || "");
        setInfo(u.additionalInfo || "");
        if (u.photoUrl) setAvatar(u.photoUrl);
        updateUser({ firstName: u.firstName, lastName: u.lastName, avatarDataUrl: u.photoUrl });
      } catch (e) {
        // ignore
      } finally { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // If context user changes (e.g. after bootstrap), ensure email shown
  React.useEffect(() => {
    if (user?.email && !email) setEmail(user.email);
  }, [user, email]);

  const onPickAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setAvatar(reader.result as string);
    reader.readAsDataURL(f);
  };

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const status = await api.get('/auth/status');
      if (!status.data.authenticated) throw new Error('Not authenticated');
      await api.put(`/user/${status.data.user.id}`, {
        first_name: firstName,
        last_name: lastName,
        phone,
        city,
        country,
        additional_info: info,
        photo_url: avatar
      });
      updateUser({ firstName, lastName, avatarDataUrl: avatar });
      toast({ title: 'Profile updated', description: 'Saved successfully.' });
    } catch (err:any) {
      toast({ title: 'Save failed', description: err?.response?.data?.message || 'Error saving profile', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const onLogout = async () => {
    try {
      await apiLogout();
      setUser(null);
      navigate('/');
    } catch {}
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navigation />
      <main className="container mx-auto px-6 pt-24 pb-12 max-w-2xl">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSave} className="space-y-6">
              <div className="flex flex-col items-center gap-3">
                <label htmlFor="avatar" className="cursor-pointer">
                  <input id="avatar" type="file" accept="image/*" className="hidden" onChange={onPickAvatar} />
                  <Avatar className="h-28 w-28 ring-2 ring-primary/40">
                    {avatar ? <AvatarImage src={avatar} alt="me" /> : <AvatarFallback>Photo</AvatarFallback>}
                  </Avatar>
                </label>
                <div className="text-xs text-muted-foreground">Tap to update photo</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={email} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>First name</Label>
                  <Input value={firstName} onChange={(e) => setFirst(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Last name</Label>
                  <Input value={lastName} onChange={(e) => setLast(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input value={city} onChange={(e) => setCity(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Input value={country} onChange={(e) => setCountry(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Additional Info</Label>
                <Textarea value={info} onChange={(e) => setInfo(e.target.value)} rows={4} />
              </div>
              <div className="flex justify-end">
                <Button type="button" variant="outline" className="mr-3" onClick={onLogout}>Logout</Button>
                <Button disabled={loading} type="submit" className="gradient-hero btn-neumorph">{loading ? 'Saving...' : 'Save changes'}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Profile;
