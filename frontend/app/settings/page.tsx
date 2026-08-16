import { AppShell } from "@/components/layout/app-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  return (
    <AppShell>
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Settings
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your timetable planner preferences.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>General</CardTitle>
            <CardDescription>
              Configure general timetable settings.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">Working Days</p>
                <p className="text-sm text-muted-foreground">
                  Monday to Friday
                </p>
              </div>

              <Button variant="outline">Configure</Button>
            </div>

            <Separator />

            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">Working Hours</p>
                <p className="text-sm text-muted-foreground">
                  09:00 AM to 04:00 PM
                </p>
              </div>

              <Button variant="outline">Configure</Button>
            </div>

            <Separator />

            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">Generation Preferences</p>
                <p className="text-sm text-muted-foreground">
                  Configure timetable generation behavior.
                </p>
              </div>

              <Button variant="outline">Configure</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}