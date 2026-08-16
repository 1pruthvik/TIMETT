import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const constraints = [
  {
    name: "Faculty Availability",
    description: "Prevent scheduling faculty outside their available hours.",
    type: "Faculty",
  },
  {
    name: "Room Capacity",
    description: "Ensure class size does not exceed room capacity.",
    type: "Room",
  },
  {
    name: "No Overlap",
    description: "Prevent faculty, sections, and rooms from overlapping.",
    type: "Scheduling",
  },
];

export default function ConstraintsPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Constraints
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Configure rules used when generating timetables.
            </p>
          </div>

          <Button>Add Constraint</Button>
        </div>

        <div className="grid gap-4">
          {constraints.map((constraint) => (
            <Card key={constraint.name}>
              <CardHeader>
                <div className="flex items-center justify-between gap-4">
                  <CardTitle className="text-base">
                    {constraint.name}
                  </CardTitle>

                  <Badge variant="secondary">{constraint.type}</Badge>
                </div>
              </CardHeader>

              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {constraint.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}