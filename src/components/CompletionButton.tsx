import { CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StorageService } from "@/lib/storage";
import { NotificationService } from "@/lib/notifications";
import { useToast } from "@/hooks/use-toast";

interface CompletionButtonProps {
  exercises: any[];
}

export function CompletionButton({ exercises }: CompletionButtonProps) {
  const { toast } = useToast();

  const handleComplete = () => {
    StorageService.addCompletion('manual');
    toast({
      title: "Great job!",
      description: "Routine completed successfully. Keep up the good work!",
      className: "bg-success text-success-foreground"
    });
  };

  const handleSnooze = () => {
    NotificationService.scheduleSnooze();
    toast({
      title: "Snoozed for 10 minutes",
      description: "We'll remind you again in a little bit.",
    });
  };

  if (exercises.length === 0) {
    return null;
  }

  return (
    <div className="flex gap-3">
      <Button 
        onClick={handleComplete}
        className="flex-1 bg-success hover:bg-success/90 text-success-foreground"
        size="lg"
      >
        <CheckCircle className="h-5 w-5 mr-2" />
        Mark Complete
      </Button>
      
      <Button 
        variant="outline" 
        onClick={handleSnooze}
        size="lg"
      >
        <Clock className="h-4 w-4 mr-2" />
        Snooze 10m
      </Button>
    </div>
  );
}