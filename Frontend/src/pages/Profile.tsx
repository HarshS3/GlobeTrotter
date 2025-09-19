import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser } from "@/context/UserContext";
import { useToast } from "@/hooks/use-toast";
import * as React from "react";

const Profile = () => {
  const { user, updateUser } = useUser();
  const { toast } = useToast();
  const [firstName, setFirst] = React.useState(user?.firstName ?? "");
  const [lastName, setLast] = React.useState(user?.lastName ?? "");
  const [avatar, setAvatar] = React.useState<string | undefined>(user?.avatarDataUrl);

  const onPickAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setAvatar(reader.result as string);
    reader.readAsDataURL(f);
  };

  const onSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({ firstName, lastName, avatarDataUrl: avatar });
    toast({ title: "Profile updated", description: "Your changes have been saved." });
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
                  <Label>First name</Label>
                  <Input value={firstName} onChange={(e) => setFirst(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Last name</Label>
                  <Input value={lastName} onChange={(e) => setLast(e.target.value)} />
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" className="gradient-hero btn-neumorph">Save changes</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Profile;
