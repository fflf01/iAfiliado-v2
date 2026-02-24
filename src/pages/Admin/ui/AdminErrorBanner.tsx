import { Card } from "@/components/ui/card";

export function AdminErrorBanner(props: { message: string }) {
  return (
    <Card className="bg-destructive/10 border-destructive/30 p-4 mb-4">
      <p className="text-sm text-destructive">{props.message}</p>
    </Card>
  );
}

