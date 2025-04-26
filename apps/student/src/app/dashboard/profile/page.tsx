"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { formatDistanceToNow } from "date-fns";
import { Building, GraduationCap, Laptop, Loader2, Mail, Monitor, Phone, Smartphone, Tablet, UserCircle } from "lucide-react";

export default function ProfilePage() {
  const { user, isLoadingUser, isError } = useAuth();

  if (isLoadingUser) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    if (typeof window !== "undefined") {
      window.location.replace("/login");
    }
    return null;
  }

  // Helper function to determine device type and icon
  const getDeviceInfo = (userAgent: string) => {
    const ua = userAgent.toLowerCase();

    if (ua.includes("postmanruntime")) {
      return { type: "API Client", icon: <UserCircle className="h-5 w-5" /> };
    } else if (ua.includes("iphone") || ua.includes("mobile")) {
      return { type: "Mobile Phone", icon: <Smartphone className="h-5 w-5" /> };
    } else if (ua.includes("ipad") || ua.includes("tablet")) {
      return { type: "Tablet", icon: <Tablet className="h-5 w-5" /> };
    } else if (ua.includes("chrome") || ua.includes("firefox") || ua.includes("safari")) {
      return { type: "Computer", icon: <Laptop className="h-5 w-5" /> };
    } else {
      return { type: "Unknown Device", icon: <Monitor className="h-5 w-5" /> };
    }
  };

  // Helper to get device location (mock since we're not showing IP)
  const getDeviceLocation = () => {
    return "New Delhi, India";
  };

  // Get unique devices by type (simplified for display)
  const getUniqueDevices = () => {
    if (!user?.devices || user.devices.length === 0) return [];

    // Group devices by type
    const devicesByType = user.devices.reduce((acc, device) => {
      const { type } = getDeviceInfo(device.userAgent);

      if (!acc[type]) {
        acc[type] = [];
      }

      acc[type].push({
        ...device,
        formattedTime: formatDistanceToNow(new Date(device.loggedInAt), { addSuffix: true }),
        location: getDeviceLocation()
      });

      return acc;
    }, {} as Record<string, any[]>);

    // Take the most recent login for each device type
    return Object.entries(devicesByType).map(([type, devices]) => {
      devices.sort((a, b) => new Date(b.loggedInAt).getTime() - new Date(a.loggedInAt).getTime());
      return devices[0];
    });
  };

  const uniqueDevices = getUniqueDevices();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Profile</h1>

      <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
        {/* Profile Card */}
        <Card className="h-fit">
          <CardHeader className="text-center">
            <div className="flex justify-center">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="text-3xl">
                  {user?.name?.[0] || "S"}
                </AvatarFallback>
              </Avatar>
            </div>
            <CardTitle className="mt-4">{user?.name || "Student Name"}</CardTitle>
            <CardDescription>{user?.rollNo || "Roll Number"}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Building className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">College</p>
                  <p className="text-sm text-muted-foreground">{user?.clg || "MRU"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <GraduationCap className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Branch</p>
                  <p className="text-sm text-muted-foreground">{user?.branch?.replace('_', ' ') || "School of Engineering"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{user?.email || "student@example.com"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-sm text-muted-foreground">{user?.phone || "+91 XXXXXXXXXX"}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Login Devices */}
        <Card>
          <CardHeader>
            <CardTitle>Active Devices</CardTitle>
            <CardDescription>
              Devices where you have signed in
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {uniqueDevices.map((device, idx) => {
                const { type, icon } = getDeviceInfo(device.userAgent);
                const isRecent = new Date(device.loggedInAt).getTime() > Date.now() - (24 * 60 * 60 * 1000);

                return (
                  <div key={idx} className="flex items-start gap-4 rounded-lg border p-4">
                    <div className="mt-1 text-primary">
                      {icon}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{type}</p>
                        {isRecent && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Active Now
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {device.location}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Last active {device.formattedTime}
                      </p>
                    </div>
                  </div>
                );
              })}

              {(!user?.devices || user.devices.length === 0) && (
                <p className="text-center text-muted-foreground">
                  No active devices found
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
