import { AppShell } from "@/components/layout/app-shell";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const periods = [
  "09:00 - 10:00",
  "10:00 - 11:00",
  "11:15 - 12:15",
  "12:15 - 01:15",
  "02:00 - 03:00",
  "03:00 - 04:00",
];

export default function TimetablePage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Timetable
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View the generated timetable for your classes.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Semester 1 · Version 1</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="overflow-x-auto rounded-lg border">
              <div
                className="grid min-w-[900px]"
                style={{
                  gridTemplateColumns: "140px repeat(5, minmax(150px, 1fr))",
                }}
              >
                <div className="border-b border-r bg-muted/50 p-3 text-sm font-medium">
                  Time
                </div>

                {days.map((day) => (
                  <div
                    key={day}
                    className="border-b border-r bg-muted/50 p-3 text-center text-sm font-medium last:border-r-0"
                  >
                    {day}
                  </div>
                ))}

                {periods.map((period) => (
                  <div key={period} className="contents">
                    <div className="border-b border-r p-3 text-sm text-muted-foreground">
                      {period}
                    </div>

                    {days.map((day) => (
                      <div
                        key={`${day}-${period}`}
                        className="min-h-20 border-b border-r p-2 last:border-r-0"
                      >
                        <div className="h-full rounded-md bg-muted/40 p-2">
                          <p className="text-sm font-medium">Free</p>
                          <p className="text-xs text-muted-foreground">
                            No class
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}