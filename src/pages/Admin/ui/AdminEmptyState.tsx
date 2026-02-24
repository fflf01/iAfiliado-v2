import { Card } from "@/components/ui/card";

export function AdminEmptyState(props: { title: string; description?: string }) {
  return (
    <Card className="bg-card/50 border-border/50 p-6 text-center">
      <p className="font-display font-bold text-foreground">{props.title}</p>
      {props.description ? (
        <p className="text-sm text-muted-foreground mt-2">{props.description}</p>
      ) : null}
    </Card>
  );
}

