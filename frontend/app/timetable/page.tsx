import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TimetablePage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Timetable
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View and manage your generated timetables.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Current Timetable</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No timetable generated yet.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}