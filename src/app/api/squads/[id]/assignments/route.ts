import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
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
    const body = await request.json();

    // Check if user is lead in squad
    const { data: userMember } = await supabase
      .from('squad_members')
      .select('role')
      .eq('squad_id', squadId)
      .eq('user_id', user.id)
      .single();

    if (!userMember || !['lead', 'instructor'].includes(userMember.role)) {
      return NextResponse.json(
        { error: 'Only leads can create assignments' },
        { status: 403 }
      );
    }

    const { title, description, due_date } = body;

    if (!title || title.length < 1) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Create assignment
    const { data: assignment, error: createError } = await supabase
      .from('assignments')
      .insert({
        squad_id: squadId,
        title,
        description: description || null,
        due_date: due_date || null,
      })
      .select()
      .single();

    if (createError) {
      return NextResponse.json(
        { error: 'Failed to create assignment' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: assignment }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
