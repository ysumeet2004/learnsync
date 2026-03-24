import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { noteSchema } from '@/lib/validations';

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
      noteSchema.parse(body);
    } catch (err) {
      return NextResponse.json(
        { error: 'Invalid note data' },
        { status: 400 }
      );
    }

    const { item_id, content, video_timestamp_seconds } = body;

    // Insert note
    const { data: note, error: noteError } = await supabase
      .from('notes')
      .insert({
        user_id: user.id,
        item_id,
        content,
        video_timestamp_seconds: video_timestamp_seconds || null,
      })
      .select()
      .single();

    if (noteError) {
      return NextResponse.json(
        { error: 'Failed to create note' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: note }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
