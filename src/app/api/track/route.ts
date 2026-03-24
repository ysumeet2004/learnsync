import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { trackEventSchema } from '@/lib/validations';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Rate limit: 1 request per 5 seconds per user/item
const RATE_LIMIT_INTERVAL = 5; // seconds

async function checkRateLimit(userId: string, itemId: string): Promise<boolean> {
  if (!process.env.UPSTASH_REDIS_REST_URL) {
    // Skip rate limiting if Redis not configured
    return true;
  }

  try {
    const key = `track:${userId}:${itemId}`;
    const current = await redis.get<number>(key);

    if (current !== null) {
      return false; // Rate limited
    }

    // Set expiry
    await redis.setex(key, RATE_LIMIT_INTERVAL, 1);
    return true;
  } catch (err) {
    // If Redis fails, allow the request
    return true;
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate
    try {
      trackEventSchema.parse(body);
    } catch (err) {
      return NextResponse.json(
        { error: 'Invalid track event data' },
        { status: 400 }
      );
    }

    const { item_id, event_type, position_seconds, percent_watched } = body;

    // Check rate limit
    const allowed = await checkRateLimit(user.id, item_id);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }

    // Insert track event
    const { error: eventError } = await supabase.from('watch_events').insert({
      user_id: user.id,
      item_id,
      event_type,
      position_seconds,
    });

    if (eventError) {
      return NextResponse.json(
        { error: 'Failed to track event' },
        { status: 500 }
      );
    }

    // Update or create progress
    const { data: existingProgress } = await supabase
      .from('progress')
      .select('*')
      .eq('item_id', item_id)
      .eq('user_id', user.id)
      .single();

    const isCompleted =
      event_type === 'complete' || (percent_watched ?? 0) >= 80;

    if (existingProgress) {
      // Update
      await supabase
        .from('progress')
        .update({
          percent_watched: percent_watched ?? existingProgress.percent_watched,
          completed: isCompleted || existingProgress.completed,
          last_position: position_seconds ?? existingProgress.last_position,
        })
        .eq('item_id', item_id)
        .eq('user_id', user.id);
    } else {
      // Create
      await supabase.from('progress').insert({
        user_id: user.id,
        item_id,
        percent_watched: percent_watched ?? 0,
        completed: isCompleted,
        last_position: position_seconds ?? 0,
      });
    }

    return NextResponse.json(
      { data: { tracked: true } },
      { status: 200 }
    );
  } catch (error) {
    console.error('Track error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Rate limit: 1 request per 5 seconds per user/item
const RATE_LIMIT_INTERVAL = 5; // seconds

async function checkRateLimit(userId: string, itemId: string): Promise<boolean> {
  if (!process.env.UPSTASH_REDIS_REST_URL) {
    // Skip rate limiting if Redis not configured
    return true;
  }

  try {
    const key = `track:${userId}:${itemId}`;
    const current = await redis.get<number>(key);

    if (current !== null) {
      return false; // Rate limited
    }

    // Set expiry
    await redis.setex(key, RATE_LIMIT_INTERVAL, 1);
    return true;
  } catch (err) {
    // If Redis fails, allow the request
    return true;
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient(cookies());
    const { data: user } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate
    try {
      trackEventSchema.parse(body);
    } catch (err) {
      return NextResponse.json(
        { error: 'Invalid track event data' },
        { status: 400 }
      );
    }

    const { item_id, event_type, position_seconds, percent_watched } = body;

    // Check rate limit
    const allowed = await checkRateLimit(user.user.id, item_id);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }

    // Insert track event
    const { error: eventError } = await supabase.from('watch_events').insert({
      user_id: user.user.id,
      item_id,
      event_type,
      position_seconds,
    });

    if (eventError) {
      return NextResponse.json(
        { error: 'Failed to track event' },
        { status: 500 }
      );
    }

    // Update or create progress
    const { data: existingProgress } = await supabase
      .from('progress')
      .select('*')
      .eq('item_id', item_id)
      .eq('user_id', user.user.id)
      .single();

    const isCompleted =
      event_type === 'complete' || percent_watched! >= 80;

    if (existingProgress) {
      // Update
      await supabase
        .from('progress')
        .update({
          percent_watched: percent_watched || existingProgress.percent_watched,
          completed: isCompleted || existingProgress.completed,
          last_position: position_seconds || existingProgress.last_position,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingProgress.id);
    } else {
      // Create
      await supabase.from('progress').insert({
        user_id: user.user.id,
        item_id,
        percent_watched: percent_watched || 0,
        completed: isCompleted,
        last_position: position_seconds || 0,
      });
    }

    return NextResponse.json(
      { data: { tracked: true } },
      { status: 200 }
    );
  } catch (error) {
    console.error('Track error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
