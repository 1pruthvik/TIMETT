import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const generations = [
  {
    name: "Semester 1",
    version: "v1",
    status: "Draft",
    created: "Just now",
  },
];

export default function GenerationsPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Generations
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Generate and review timetable solutions.
            </p>
          </div>

          <Button>Generate Timetable</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Generation History</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="space-y-3">
              {generations.map((generation) => (
                <div
                  key={`${generation.name}-${generation.version}`}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <p className="font-medium">{generation.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {generation.version} · {generation.created}
                    </p>
                  </div>

                  <Badge variant="secondary">{generation.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}