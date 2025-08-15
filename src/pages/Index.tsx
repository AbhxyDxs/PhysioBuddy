import { useState, useEffect } from "react";
import { Activity, Heart } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ExerciseManager } from "@/components/ExerciseManager";
import { ReminderManager } from "@/components/ReminderManager";
import { StatsCard } from "@/components/StatsCard";
import { CompletionButton } from "@/components/CompletionButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Exercise } from "@/lib/storage";

const Index = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Heart className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Physio Buddy</h1>
          </div>
          <ThemeToggle />
        </div>

        {/* Welcome Card */}
        <Card className="bg-gradient-to-r from-primary/5 to-primary-glow/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Activity className="h-5 w-5" />
              Stay Consistent with Your Recovery
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Build healthy habits with gentle reminders for your physiotherapy routine.<br></br>
              Your body will thank you for the consistency.
            </p>
          </CardContent>
        </Card>

        {/* Reminder Manager */}
        <ReminderManager />

        {/* Exercise Manager */}
        <ExerciseManager onExercisesChange={setExercises} />

        {/* Completion Button */}
        <CompletionButton exercises={exercises} />

        {/* Stats */}
        <StatsCard />

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground py-4">
          <p>Consistency beats intensity.<br></br> 
          <br></br>
          Made with 💚 By Abhay!</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
