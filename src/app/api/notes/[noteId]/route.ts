import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { cookies } from 'next/headers';

export async function DELETE(
  request: Request,
  { params }: { params: { noteId: string } }
) {
  try {
    const supabase = createClient(cookies());
    const { data: user } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const noteId = params.noteId;

    // Get note to verify ownership
    const { data: note } = await supabase
      .from('notes')
      .select('user_id')
      .eq('id', noteId)
      .single();

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    if (note.user_id !== user.user.id) {
      return NextResponse.json(
        { error: 'Cannot delete other users notes' },
        { status: 403 }
      );
    }

    // Delete note
    const { error: deleteError } = await supabase
      .from('notes')
      .delete()
      .eq('id', noteId);

    if (deleteError) {
      return NextResponse.json(
        { error: 'Failed to delete note' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { data: { message: 'Note deleted' } },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
