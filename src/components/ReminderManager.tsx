import { useState, useEffect } from "react";
import { Bell, BellOff, Clock, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StorageService } from "@/lib/storage";
import { NotificationService } from "@/lib/notifications";
import { useToast } from "@/hooks/use-toast";

export function ReminderManager() {
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [intervalMinutes, setIntervalMinutes] = useState(120);
  const [nextReminderTime, setNextReminderTime] = useState<Date | null>(null);
  const [hasNotificationPermission, setHasNotificationPermission] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
    checkNotificationPermission();
    
    const interval = setInterval(() => {
      setNextReminderTime(NotificationService.getNextReminderTime());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const loadSettings = () => {
    const settings = StorageService.getSettings();
    setRemindersEnabled(settings.remindersEnabled);
    setIntervalMinutes(settings.intervalMinutes);
    setNextReminderTime(NotificationService.getNextReminderTime());
  };

  const checkNotificationPermission = () => {
    setHasNotificationPermission(NotificationService.hasPermission());
  };

  const requestNotificationPermission = async () => {
    const granted = await NotificationService.requestPermission();
    setHasNotificationPermission(granted);
    
    if (!granted) {
      toast({
        title: "Notifications blocked",
        description: "Please enable notifications in your browser settings to receive reminders.",
        variant: "destructive"
      });
    }
    
    return granted;
  };

  const toggleReminders = async (enabled: boolean) => {
    if (enabled && !hasNotificationPermission) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        return;
      }
    }

    setRemindersEnabled(enabled);
    StorageService.saveSettings({ remindersEnabled: enabled });

    if (enabled) {
      NotificationService.scheduleReminders();
      toast({
        title: "Reminders enabled",
        description: `You'll be reminded every ${formatInterval(intervalMinutes)}`,
      });
    } else {
      NotificationService.clearScheduledReminders();
      setNextReminderTime(null);
      toast({
        title: "Reminders disabled",
        description: "You won't receive any more reminders until you turn them back on.",
      });
    }
  };

  const updateInterval = (newInterval: number) => {
    setIntervalMinutes(newInterval);
    StorageService.saveSettings({ intervalMinutes: newInterval });
    
    if (remindersEnabled) {
      NotificationService.scheduleReminders();
      toast({
        title: "Reminder interval updated",
        description: `You'll now be reminded every ${formatInterval(newInterval)}`,
      });
    }
    
    setIsSettingsOpen(false);
  };

  const formatInterval = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) {
      return `${mins} minutes`;
    } else if (mins === 0) {
      return hours === 1 ? "1 hour" : `${hours} hours`;
    } else {
      return `${hours}h ${mins}m`;
    }
  };

  const formatNextReminder = (date: Date) => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    
    if (diff <= 0) {
      // If time has passed, reschedule reminders to fix stuck timer
      if (remindersEnabled) {
        console.log('Timer expired, rescheduling...');
        setTimeout(() => {
          NotificationService.scheduleReminders();
          loadSettings(); // Refresh the next reminder time
        }, 1000);
      }
      return "Triggering...";
    }
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours === 0) {
      return `${minutes}m`;
    } else if (remainingMinutes === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${remainingMinutes}m`;
    }
  };

  const intervalOptions = [
    { value: 15, label: "15 minutes" },
    { value: 30, label: "30 minutes" },
    { value: 60, label: "1 hour" },
    { value: 90, label: "1.5 hours" },
    { value: 120, label: "2 hours" },
    { value: 180, label: "3 hours" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {remindersEnabled ? (
            <Bell className="h-5 w-5 text-primary" />
          ) : (
            <BellOff className="h-5 w-5 text-muted-foreground" />
          )}
          Reminders
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Switch
              id="reminders-toggle"
              checked={remindersEnabled}
              onCheckedChange={toggleReminders}
            />
            <Label htmlFor="reminders-toggle">
              {remindersEnabled ? "Enabled" : "Disabled"}
            </Label>
          </div>
          
          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reminder Settings</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Reminder Interval</Label>
                  <Select
                    value={intervalMinutes.toString()}
                    onValueChange={(value) => updateInterval(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {intervalOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value.toString()}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="p-4 bg-accent rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4" />
                    <span>Current interval: {formatInterval(intervalMinutes)}</span>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {!hasNotificationPermission && (
          <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
            <p className="text-sm text-warning-foreground">
              Notifications are blocked. Enable them in your browser to receive reminders.
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={requestNotificationPermission}
            >
              Enable Notifications
            </Button>
          </div>
        )}

        {remindersEnabled && nextReminderTime && (
          <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-primary" />
              <span>Next reminder in: {formatNextReminder(nextReminderTime)}</span>
            </div>
          </div>
        )}

        <div className="text-sm text-muted-foreground">
          <p>Interval: {formatInterval(intervalMinutes)}</p>
        </div>
      </CardContent>
    </Card>
  );
}