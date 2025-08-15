import { useState, useEffect } from "react";
import { TrendingUp, Calendar, Award, History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { StorageService, CompletionEvent } from "@/lib/storage";

export function StatsCard() {
  const [stats, setStats] = useState({ today: 0, sevenDays: 0, allTime: 0 });
  const [completions, setCompletions] = useState<CompletionEvent[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  useEffect(() => {
    loadStats();
    
    // Listen for completion events (in a real app, you'd use a proper event system)
    const interval = setInterval(loadStats, 1000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = () => {
    setStats(StorageService.getStats());
    setCompletions(StorageService.getCompletions().reverse()); // Most recent first
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const groupCompletionsByDate = (completions: CompletionEvent[]) => {
    const groups: { [key: string]: CompletionEvent[] } = {};
    
    completions.forEach(completion => {
      const dateKey = completion.timestamp.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(completion);
    });
    
    return groups;
  };

  const completionsByDate = groupCompletionsByDate(completions);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{stats.today}</div>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Calendar className="h-3 w-3" />
              Today
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-glow">{stats.sevenDays}</div>
            <div className="text-xs text-muted-foreground">7 Days</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-success">{stats.allTime}</div>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Award className="h-3 w-3" />
              Total
            </div>
          </div>
        </div>

        <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full" size="sm">
              <History className="h-4 w-4 mr-2" />
              View History
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-96 overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Completion History</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {Object.keys(completionsByDate).length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <p>No completions yet.</p>
                  <p className="text-sm mt-1">Complete your first routine to see it here!</p>
                </div>
              ) : (
                Object.entries(completionsByDate).map(([date, dayCompletions]) => (
                  <div key={date} className="border-b border-border pb-3 last:border-b-0">
                    <h4 className="font-medium text-sm mb-2">{date}</h4>
                    <div className="space-y-1">
                      {dayCompletions.map((completion) => (
                        <div key={completion.id} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {completion.timestamp.toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            completion.source === 'notification' 
                              ? 'bg-primary/10 text-primary' 
                              : 'bg-success/10 text-success'
                          }`}>
                            {completion.source === 'notification' ? 'Reminder' : 'Manual'}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {dayCompletions.length} completion{dayCompletions.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}