'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { useRequireAuth } from '@/utils/hooks';
import { Card, CardLg, Badge } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Database } from '@/types/database';
import {
  ChevronLeft,
  Send,
  Clock,
  Loader,
  Check,
  Volume2,
  Maximize,
} from 'lucide-react';
import { useAppStore } from '@/utils/store';

type CourseItem = Database['public']['Tables']['course_items']['Row'];
type Note = Database['public']['Tables']['notes']['Row'];

interface NoteWithUser extends Note {
  user_email?: string;
}

function formatDuration(seconds: number): string {
  if (!seconds) return '0:00';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export default function WatchPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useRequireAuth();
  const squadId = params.id as string;
  const courseId = params.courseId as string;
  const itemId = params.itemId as string;

  const supabase = createClient();
  const addNotification = useAppStore((s) => s.addNotification);

  const [item, setItem] = useState<CourseItem | null>(null);
  const [notes, setNotes] = useState<NoteWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteInput, setNoteInput] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  // Player state
  const playerRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [percentWatched, setPercentWatched] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [progressData, setProgressData] = useState<any>(null);

  // YouTube API state
  const [player, setPlayer] = useState<any>(null);

  // Track event throttling
  const lastTrackTimeRef = useRef(0);

  useEffect(() => {
    if (!user || !itemId) return;

    async function loadItem() {
      try {
        const { data: itemData } = await supabase
          .from('course_items')
          .select('*')
          .eq('id', itemId)
          .single();

        if (itemData) {
          setItem(itemData);
          setDuration(itemData.duration_seconds || 0);
        }

        // Load notes
        const { data: notesData } = await supabase
          .from('notes')
          .select('*')
          .eq('item_id', itemId)
          .order('video_timestamp_seconds', { ascending: true });

        if (notesData) {
          setNotes(notesData);
        }

        // Load user progress
        const { data: progress } = await supabase
          .from('progress')
          .select('*')
          .eq('item_id', itemId)
          .eq('user_id', user.id)
          .single();

        if (progress) {
          setProgressData(progress);
          setPercentWatched(progress.percent_watched || 0);
          setCompleted(progress.completed || false);
          setCurrentTime(progress.last_position || 0);
        }
      } catch (err) {
        console.error('Failed to load item:', err);
      } finally {
        setLoading(false);
      }
    }

    loadItem();
  }, [user, itemId, supabase]);

  // Initialize YouTube player
  useEffect(() => {
    if (!item || item.source !== 'youtube' || !playerRef.current) return;

    const initPlayer = () => {
      const ytPlayer = new (window as any).YT.Player(playerRef.current, {
        height: '390',
        width: '100%',
        videoId: item.source_id,
        events: {
          onReady: (event: any) => {
            // Seek to saved position
            if (progressData?.last_position) {
              event.target.seekTo(progressData.last_position);
            }
            setPlayer(event.target);
          },
          onStateChange: (event: any) => {
            const YT = (window as any).YT;
            setIsPlaying(event.data === YT.PlayerState.PLAYING);
          },
        },
      });
    };

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    tag.async = true;

    (window as any).onYouTubeIframeAPIReady = initPlayer;

    // Only add script if not already present
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      document.body.appendChild(tag);
    } else {
      // Script already loaded, initialize directly
      initPlayer();
    }
  }, [item, progressData]);

  // Track watch events every 5 seconds
  useEffect(() => {
    if (!player || !item || !user) return;

    const interval = setInterval(async () => {
      try {
        const currentSeconds = player.getCurrentTime?.() || 0;
        const totalSeconds = player.getDuration?.() || duration;

        if (!totalSeconds) return;

        const newPercent = Math.round((currentSeconds / totalSeconds) * 100);
        setCurrentTime(currentSeconds);
        setPercentWatched(newPercent);

        // Only track if minimum 1 second has passed since last track
        if (Date.now() - lastTrackTimeRef.current < 5000) return;

        lastTrackTimeRef.current = Date.now();

        // Send track event
        await fetch('/api/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            item_id: itemId,
            event_type: isPlaying ? 'heartbeat' : 'pause',
            position_seconds: Math.floor(currentSeconds),
            percent_watched: newPercent,
          }),
        });

        // Mark complete at 80%
        if (newPercent >= 80 && !completed) {
          setCompleted(true);
          addNotification('Video completed! 🎉', 'success');
        }
      } catch (err) {
        console.error('Failed to track event:', err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [player, item, user, itemId, isPlaying, duration, completed, addNotification]);

  async function handleAddNote() {
    if (!noteInput.trim() || !user) return;

    setAddingNote(true);

    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_id: itemId,
          content: noteInput,
          video_timestamp_seconds: Math.floor(currentTime),
        }),
      });

      const { data, error } = await response.json();

      if (error) {
        addNotification(error, 'error');
        return;
      }

      setNotes([...notes, data]);
      setNoteInput('');
      addNotification('Note added', 'success');
    } catch (err) {
      addNotification('Failed to add note', 'error');
    } finally {
      setAddingNote(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2 text-text-secondary">
          <Loader className="w-5 h-5 animate-spin" />
          <span>Loading video...</span>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <p className="text-text-secondary mb-4">Video not found</p>
          <Button variant="primary" onClick={() => router.back()}>
            Go Back
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => router.back()}
          className="gap-2 mb-6"
        >
          <ChevronLeft size={18} />
          Back
        </Button>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Player */}
          <div className="lg:col-span-2 space-y-4">
            {/* YouTube Player */}
            <div
              ref={playerRef}
              className="w-full aspect-video bg-black rounded-lg overflow-hidden"
            />

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="h-2 bg-bg-surface rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    completed ? 'bg-success' : 'bg-brand'
                  }`}
                  style={{ width: `${percentWatched}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-sm text-text-secondary">
                <span>{formatDuration(currentTime)}</span>
                <span>{formatDuration(duration)}</span>
              </div>
            </div>

            {/* Completion Badge */}
            {completed && (
              <div className="flex items-center gap-2 p-3 bg-success/10 rounded-lg border border-success/20">
                <Check size={18} className="text-success" />
                <span className="text-success font-medium">Video completed!</span>
              </div>
            )}

            {/* Video Info */}
            <CardLg>
              <h1 className="text-2xl font-bold text-text-primary mb-2">{item.title}</h1>
              <div className="flex items-center gap-4 text-text-secondary">
                <span className="flex items-center gap-1">
                  <Clock size={16} />
                  {formatDuration(item.duration_seconds || 0)}
                </span>
              </div>
            </CardLg>

            {/* Notes Section */}
            <CardLg>
              <h2 className="text-lg font-bold text-text-primary mb-4">Notes</h2>

              <div className="mb-6 space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') handleAddNote();
                    }}
                    placeholder={`Add note at ${formatDuration(currentTime)}...`}
                  />
                  <Button
                    variant="primary"
                    onClick={handleAddNote}
                    isLoading={addingNote}
                    className="gap-2"
                  >
                    <Send size={16} />
                  </Button>
                </div>
              </div>

              {notes.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-text-secondary">No notes yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notes.map((note) => (
                    <Card key={note.id} className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-sm text-text-tertiary flex items-center gap-1">
                          <Clock size={14} />
                          {formatDuration(note.video_timestamp_seconds || 0)}
                        </p>
                      </div>
                      <p className="text-text-primary">{note.content}</p>
                    </Card>
                  ))}
                </div>
              )}
            </CardLg>
          </div>

          {/* Sidebar */}
          <aside className="space-y-4">
            {/* Player Controls */}
            <CardLg>
              <h3 className="font-bold text-text-primary mb-3">Controls</h3>
              <div className="space-y-2">
                <Button
                  variant="secondary"
                  className="w-full justify-start gap-2"
                  onClick={() => player?.playVideo?.()}
                >
                  ▶ Play
                </Button>
                <Button
                  variant="secondary"
                  className="w-full justify-start gap-2"
                  onClick={() => player?.pauseVideo?.()}
                >
                  ⏸ Pause
                </Button>
              </div>
            </CardLg>

            {/* Info */}
            <Card className="p-4 bg-bg-surface">
              <p className="text-xs text-text-tertiary font-medium mb-2">PROGRESS</p>
              <p className="text-2xl font-bold text-text-primary">{percentWatched}%</p>
              {completed && (
                <p className="text-sm text-success mt-2 flex items-center gap-1">
                  <Check size={14} />
                  Completed
                </p>
              )}
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
