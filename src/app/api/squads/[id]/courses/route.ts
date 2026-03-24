import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { cookies } from 'next/headers';
import { courseSchema } from '@/lib/validations';

function extractPlaylistId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.get('list');
  } catch {
    return null;
  }
}

async function fetchYouTubePlaylistItems(
  playlistId: string
): Promise<Array<{ videoId: string; title: string; duration: number }>> {
  const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

  if (!apiKey) {
    throw new Error('YouTube API key not configured');
  }

  try {
    const items: Array<{
      videoId: string;
      title: string;
      duration: number;
    }> = [];
    let pageToken: string | null = null;
    let videoIds: string[] = [];

    // Fetch playlist items (in batches due to pagination)
    do {
      const playlistUrl = new URL(
        'https://www.googleapis.com/youtube/v3/playlistItems'
      );
      playlistUrl.searchParams.set('playlistId', playlistId);
      playlistUrl.searchParams.set('key', apiKey);
      playlistUrl.searchParams.set('part', 'contentDetails,snippet');
      playlistUrl.searchParams.set('maxResults', '50');
      if (pageToken) {
        playlistUrl.searchParams.set('pageToken', pageToken);
      }

      const playlistResponse = await fetch(playlistUrl.toString());

      if (!playlistResponse.ok) {
        throw new Error(`YouTube API error: ${playlistResponse.statusText}`);
      }

      const playlistData = await playlistResponse.json();

      // Collect video IDs and titles
      playlistData.items?.forEach((item: any) => {
        if (item.contentDetails?.videoId) {
          videoIds.push(item.contentDetails.videoId);
          items.push({
            videoId: item.contentDetails.videoId,
            title: item.snippet?.title || 'Untitled',
            duration: 0, // Will fetch separately
          });
        }
      });

      pageToken = playlistData.nextPageToken || null;
    } while (pageToken);

    // Fetch video details (duration) - YouTube API requires batch queries
    if (videoIds.length > 0) {
      const videoUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
      videoUrl.searchParams.set('key', apiKey);
      videoUrl.searchParams.set('part', 'contentDetails');
      videoUrl.searchParams.set('id', videoIds.slice(0, 50).join(','));

      const videoResponse = await fetch(videoUrl.toString());

      if (videoResponse.ok) {
        const videoData = await videoResponse.json();
        const durationMap: Record<string, number> = {};

        videoData.items?.forEach((video: any) => {
          const duration = video.contentDetails?.duration;
          if (duration) {
            // Parse ISO 8601 duration (PT1H23M45S)
            const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
            let seconds = 0;
            if (match) {
              if (match[1]) {
                seconds += parseInt(match[1]) * 3600;
              }
              if (match[2]) {
                seconds += parseInt(match[2]) * 60;
              }
              if (match[3]) {
                seconds += parseInt(match[3]);
              }
            }
            durationMap[video.id] = seconds;
          }
        });

        // Update durations in items
        items.forEach((item) => {
          item.duration = durationMap[item.videoId] || 0;
        });
      }
    }

    return items;
  } catch (error) {
    console.error('YouTube API error:', error);
    throw error;
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(cookies());
    const { data: user } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const squadId = params.id;
    const body = await request.json();

    // Validate input
    try {
      courseSchema.parse(body);
    } catch (err) {
      return NextResponse.json(
        { error: 'Invalid course data' },
        { status: 400 }
      );
    }

    // Check if user is lead in squad
    const { data: userMember } = await supabase
      .from('squad_members')
      .select('role')
      .eq('squad_id', squadId)
      .eq('user_id', user.user.id)
      .single();

    if (!userMember || !['lead', 'instructor'].includes(userMember.role)) {
      return NextResponse.json(
        { error: 'Only leads can add courses' },
        { status: 403 }
      );
    }

    // Create course
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .insert({
        squad_id: squadId,
        title: body.title,
        description: body.description || null,
        source: body.source,
        source_url: body.source_url,
      })
      .select()
      .single();

    if (courseError) {
      return NextResponse.json(
        { error: 'Failed to create course' },
        { status: 500 }
      );
    }

    // Import items if YouTube source
    if (body.source === 'youtube') {
      try {
        const playlistId = extractPlaylistId(body.source_url);

        if (!playlistId) {
          return NextResponse.json(
            { error: 'Invalid YouTube playlist URL' },
            { status: 400 }
          );
        }

        const items = await fetchYouTubePlaylistItems(playlistId);

        // Insert course items
        if (items.length > 0) {
          const courseItems = items.map((item, index) => ({
            course_id: course.id,
            title: item.title,
            type: 'video' as const,
            source: 'youtube' as const,
            source_id: item.videoId,
            duration_seconds: item.duration || 0,
            position: index + 1,
          }));

          const { error: itemsError } = await supabase
            .from('course_items')
            .insert(courseItems);

          if (itemsError) {
            console.error('Failed to insert course items:', itemsError);
            // Don't fail - course created, just items didn't import
          }
        }
      } catch (err) {
        console.error('YouTube import error:', err);
        // Return course anyway - user can try again
      }
    }

    return NextResponse.json(
      { data: { ...course, items_count: body.source === 'youtube' ? 'importing...' : 0 } },
      { status: 201 }
    );
  } catch (error) {
    console.error('Course creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
