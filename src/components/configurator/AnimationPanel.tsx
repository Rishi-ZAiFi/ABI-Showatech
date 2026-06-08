/**
 * Animation Panel Component
 * Displays and controls animation clips for the loaded model
 */

import { useConfiguratorStore } from '../../store/configurator.store';
import { Play, Pause } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

export function AnimationPanel() {
  const {
    animations,
    currentAnimationId,
    animationSpeed,
    animationTime,
    isAnimationPlaying,
    setCurrentAnimation,
    setAnimationSpeed,
    setAnimationTime,
    toggleAnimationPlayPause
  } = useConfiguratorStore();

  if (animations.length === 0) {
    return (
      <div className="p-4 border rounded-lg bg-muted/30">
        <p className="text-sm text-muted-foreground">No animations found</p>
      </div>
    );
  }

  const currentAnimation = animations.find((a) => a.id === currentAnimationId);

  const handleAnimationChange = (animationId: string) => {
    setCurrentAnimation(animationId);
    setAnimationTime(0);
  };

  const handleSpeedChange = (speed: string) => {
    setAnimationSpeed(parseFloat(speed));
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setAnimationTime(time);
  };

  const handlePlayPause = () => {
    // Ensure an animation is selected before playing
    if (!currentAnimationId && animations.length > 0) {
      setCurrentAnimation(animations[0].id);
      setAnimationTime(0);
    }

    toggleAnimationPlayPause();
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const milliseconds = Math.floor((time % 1) * 100);
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  };

  const speedOptions = [
    { value: '0.25', label: '0.25x' },
    { value: '0.5', label: '0.5x' },
    { value: '0.75', label: '0.75x' },
    { value: '1', label: '1x' },
    { value: '1.25', label: '1.25x' },
    { value: '1.5', label: '1.5x' },
    { value: '2', label: '2x' },
    { value: '3', label: '3x' },
  ];

  return (
    <Card>
      <CardContent className="space-y-3">
        {/* Row 1: Animation Selector + Speed */}
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Select value={currentAnimationId || ''} onValueChange={handleAnimationChange}>
              <SelectTrigger className="w-full h-8">
                <SelectValue placeholder="Choose animation..." />
              </SelectTrigger>
              <SelectContent>
                {animations.map((animation) => (
                  <SelectItem key={animation.id} value={animation.id}>
                    <div className="flex items-center justify-between gap-2">
                      <span>{animation.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end gap-1">
            <Select value={animationSpeed.toString()} onValueChange={handleSpeedChange}>
              <SelectTrigger className="w-16 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {speedOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Row 2: Play/Pause + Timeline */}
        {currentAnimation && (
          <div className="flex items-center gap-2">
            <Button
              onClick={handlePlayPause}
              disabled={!currentAnimationId}
              size="sm"
              variant="outline"
              className="w-8 h-8 p-0 flex-shrink-0"
            >
              {isAnimationPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </Button>

            <div className="flex-1 space-y-1">
              <input
                type="range"
                min="0"
                max={currentAnimation.duration}
                step="0.01"
                value={animationTime}
                onChange={handleTimeChange}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-muted accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground px-0.5">
                <span>{formatTime(animationTime)}</span>
                <span>{formatTime(currentAnimation.duration)}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
