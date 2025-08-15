import { useState, useEffect } from "react";
import { Plus, GripVertical, Trash2, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { StorageService, Exercise } from "@/lib/storage";

interface ExerciseManagerProps {
  onExercisesChange?: (exercises: Exercise[]) => void;
}

export function ExerciseManager({ onExercisesChange }: ExerciseManagerProps) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [newExerciseName, setNewExerciseName] = useState("");
  const [newExerciseNote, setNewExerciseNote] = useState("");

  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = () => {
    const loadedExercises = StorageService.getExercises();
    setExercises(loadedExercises);
    onExercisesChange?.(loadedExercises);
  };

  const saveExercises = (updatedExercises: Exercise[]) => {
    StorageService.saveExercises(updatedExercises);
    setExercises(updatedExercises);
    onExercisesChange?.(updatedExercises);
  };

  const addExercise = () => {
    if (!newExerciseName.trim()) return;

    const newExercise: Exercise = {
      id: `exercise_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: newExerciseName.trim(),
      note: newExerciseNote.trim() || undefined,
      position: exercises.length
    };

    const updatedExercises = [...exercises, newExercise];
    saveExercises(updatedExercises);
    
    setNewExerciseName("");
    setNewExerciseNote("");
    setIsAddDialogOpen(false);
  };

  const updateExercise = () => {
    if (!editingExercise || !newExerciseName.trim()) return;

    const updatedExercises = exercises.map(ex => 
      ex.id === editingExercise.id 
        ? { ...ex, name: newExerciseName.trim(), note: newExerciseNote.trim() || undefined }
        : ex
    );

    saveExercises(updatedExercises);
    setEditingExercise(null);
    setNewExerciseName("");
    setNewExerciseNote("");
  };

  const deleteExercise = (id: string) => {
    const updatedExercises = exercises.filter(ex => ex.id !== id);
    saveExercises(updatedExercises);
  };

  const startEdit = (exercise: Exercise) => {
    setEditingExercise(exercise);
    setNewExerciseName(exercise.name);
    setNewExerciseNote(exercise.note || "");
  };

  const cancelEdit = () => {
    setEditingExercise(null);
    setNewExerciseName("");
    setNewExerciseNote("");
  };

  const moveExercise = (fromIndex: number, toIndex: number) => {
    const updatedExercises = [...exercises];
    const [movedExercise] = updatedExercises.splice(fromIndex, 1);
    updatedExercises.splice(toIndex, 0, movedExercise);
    
    // Update positions
    const reorderedExercises = updatedExercises.map((ex, index) => ({
      ...ex,
      position: index
    }));
    
    saveExercises(reorderedExercises);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Your Routine</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Exercise
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Exercise</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="exercise-name">Exercise Name</Label>
                <Input
                  id="exercise-name"
                  value={newExerciseName}
                  onChange={(e) => setNewExerciseName(e.target.value)}
                  placeholder="eg: Shoulder Rolls"
                  onKeyDown={(e) => e.key === 'Enter' && addExercise()}
                />
              </div>
              <div>
                <Label htmlFor="exercise-note">Notes (optional)</Label>
                <Textarea
                  id="exercise-note"
                  value={newExerciseNote}
                  onChange={(e) => setNewExerciseNote(e.target.value)}
                  placeholder="eg: 10 Reps, Slow and controlled"
                  rows={3}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={addExercise} disabled={!newExerciseName.trim()}>
                  Add Exercise
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {exercises.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            <p>No exercises added yet.</p>
            <p className="text-sm mt-1">Add your first exercise to get started!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {exercises.map((exercise, index) => (
            <Card key={exercise.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                  <div className="flex-1">
                    <div className="font-medium">{exercise.name}</div>
                    {exercise.note && (
                      <div className="text-sm text-muted-foreground mt-1">{exercise.note}</div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEdit(exercise)}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteExercise(exercise.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingExercise} onOpenChange={() => editingExercise && cancelEdit()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Exercise</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-exercise-name">Exercise Name</Label>
              <Input
                id="edit-exercise-name"
                value={newExerciseName}
                onChange={(e) => setNewExerciseName(e.target.value)}
                placeholder="eg: Shoulder Rolls"
              />
            </div>
            <div>
              <Label htmlFor="edit-exercise-note">Notes (optional)</Label>
              <Textarea
                id="edit-exercise-note"
                value={newExerciseNote}
                onChange={(e) => setNewExerciseNote(e.target.value)}
                placeholder="eg: 10 Reps, Slow and controlled"
                rows={3}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={cancelEdit}>
                Cancel
              </Button>
              <Button onClick={updateExercise} disabled={!newExerciseName.trim()}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}