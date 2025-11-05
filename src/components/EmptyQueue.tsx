import { Music } from 'lucide-react';
import { Card, CardContent } from './ui/card';

export function EmptyQueue({ isAdmin = false }: { isAdmin?: boolean }) {
  return (
    <Card className="border-dashed">
      <CardContent className="p-8 text-center">
        <div className="mx-auto w-fit bg-secondary p-3 rounded-full mb-4">
          <Music className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-bold text-xl">The queue is empty</h3>
        {isAdmin ? (
          <p className="text-muted-foreground">Waiting for the first request of the night!</p>
        ) : (
          <p className="text-muted-foreground">Be the first to sing! Submit a song to get the party started.</p>
        )}
      </CardContent>
    </Card>
  );
}
