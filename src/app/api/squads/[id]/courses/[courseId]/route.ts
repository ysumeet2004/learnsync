import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string; courseId: string } }
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
    const courseId = params.courseId;

    // Check if user is lead in squad
    const { data: userMember } = await supabase
      .from('squad_members')
      .select('role')
      .eq('squad_id', squadId)
      .eq('user_id', user.id)
      .single();

    if (!userMember || !['lead', 'instructor'].includes(userMember.role)) {
      return NextResponse.json(
        { error: 'Only leads can delete courses' },
        { status: 403 }
      );
    }

    // Verify course belongs to squad
    const { data: course } = await supabase
      .from('courses')
      .select('id')
      .eq('id', courseId)
      .eq('squad_id', squadId)
      .single();

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Delete course (cascade will handle items and progress)
    const { error: deleteError } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId)
      .eq('squad_id', squadId);

    if (deleteError) {
      return NextResponse.json(
        { error: 'Failed to delete course' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { data: { message: 'Course deleted' } },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
