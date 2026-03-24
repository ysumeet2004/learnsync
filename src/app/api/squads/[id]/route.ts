import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { cookies } from 'next/headers';
import { squadSchema } from '@/lib/validations';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(cookies());
    const { data: user } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const squadId = params.id;
    const body = await request.json();

    // Validate input
    try {
      squadSchema.parse(body);
    } catch (err) {
      return NextResponse.json(
        { error: 'Invalid squad data' },
        { status: 400 }
      );
    }

    // Check if current user is lead or instructor
    const { data: currentUserMember } = await supabase
      .from('squad_members')
      .select('role')
      .eq('squad_id', squadId)
      .eq('user_id', user.user.id)
      .single();

    if (!currentUserMember || !['lead', 'instructor'].includes(currentUserMember.role)) {
      return NextResponse.json(
        { error: 'Only leads can modify squad settings' },
        { status: 403 }
      );
    }

    // Update squad
    const { data, error: updateError } = await supabase
      .from('squads')
      .update({
        name: body.name,
        description: body.description,
      })
      .eq('id', squadId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update squad' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { data },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(cookies());
    const { data: user } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const squadId = params.id;

    // Check if current user is lead (only leads can delete squads)
    const { data: currentUserMember } = await supabase
      .from('squad_members')
      .select('role')
      .eq('squad_id', squadId)
      .eq('user_id', user.user.id)
      .single();

    if (!currentUserMember || currentUserMember.role !== 'lead') {
      return NextResponse.json(
        { error: 'Only squad leads can delete squads' },
        { status: 403 }
      );
    }

    // Delete all squad members
    const { error: membersError } = await supabase
      .from('squad_members')
      .delete()
      .eq('squad_id', squadId);

    if (membersError) {
      return NextResponse.json(
        { error: 'Failed to delete squad' },
        { status: 500 }
      );
    }

    // Delete squad
    const { error: squadError } = await supabase
      .from('squads')
      .delete()
      .eq('id', squadId);

    if (squadError) {
      return NextResponse.json(
        { error: 'Failed to delete squad' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { data: { message: 'Squad deleted' } },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
