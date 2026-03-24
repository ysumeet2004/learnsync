import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string; assignmentId: string } }
) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const squadId = params.id;
    const assignmentId = params.assignmentId;

    // Check if user is lead in squad
    const { data: userMember } = await supabase
      .from('squad_members')
      .select('role')
      .eq('squad_id', squadId)
      .eq('user_id', user.id)
      .single();

    if (!userMember || !['lead', 'instructor'].includes(userMember.role)) {
      return NextResponse.json(
        { error: 'Only leads can delete assignments' },
        { status: 403 }
      );
    }

    // Verify assignment belongs to squad
    const { data: assignment } = await supabase
      .from('assignments')
      .select('id')
      .eq('id', assignmentId)
      .eq('squad_id', squadId)
      .single();

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    // Delete submissions first (cascade handled in DB but be explicit)
    await supabase
      .from('submissions')
      .delete()
      .eq('assignment_id', assignmentId);

    // Delete assignment
    const { error: deleteError } = await supabase
      .from('assignments')
      .delete()
      .eq('id', assignmentId);

    if (deleteError) {
      return NextResponse.json(
        { error: 'Failed to delete assignment' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { data: { message: 'Assignment deleted' } },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
