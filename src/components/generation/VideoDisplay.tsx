import { Video } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function VideoDisplay() {
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center space-x-2">
          <Video className="w-6 h-6 text-primary" />
          <span>Video Generation</span>
        </CardTitle>
        <CardDescription>
          Coming Soon
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center py-16">
        <div className="space-y-4">
          <Video className="w-16 h-16 mx-auto text-muted-foreground" />
          <h3 className="text-lg font-medium">Video Generation</h3>
          <p className="text-muted-foreground">
            Text-to-video and image-to-video generation will be available soon.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}