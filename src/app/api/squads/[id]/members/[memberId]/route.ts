import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { role } = await request.json();

    if (!role || !['lead', 'instructor', 'learner'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    const squadId = params.id;
    const memberId = params.memberId;

    // Check if current user is lead or instructor
    const { data: currentUserMember } = await supabase
      .from('squad_members')
      .select('role')
      .eq('squad_id', squadId)
      .eq('user_id', user.id)
      .single();

    if (!currentUserMember || !['lead', 'instructor'].includes(currentUserMember.role)) {
      return NextResponse.json(
        { error: 'Only leads can manage members' },
        { status: 403 }
      );
    }

    // Update member role (memberId is the user_id of the target member)
    const { error: updateError } = await supabase
      .from('squad_members')
      .update({ role })
      .eq('user_id', memberId)
      .eq('squad_id', squadId);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update member' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { data: { message: 'Member role updated' } },
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
  _request: Request,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const squadId = params.id;
    const memberId = params.memberId;

    // Check if current user is lead or instructor
    const { data: currentUserMember } = await supabase
      .from('squad_members')
      .select('role')
      .eq('squad_id', squadId)
      .eq('user_id', user.id)
      .single();

    if (!currentUserMember || !['lead', 'instructor'].includes(currentUserMember.role)) {
      return NextResponse.json(
        { error: 'Only leads can remove members' },
        { status: 403 }
      );
    }

    // Don't allow removing yourself
    if (memberId === user.id) {
      return NextResponse.json(
        { error: 'Cannot remove yourself' },
        { status: 400 }
      );
    }

    // Delete member (memberId is the user_id of the target member)
    const { error: deleteError } = await supabase
      .from('squad_members')
      .delete()
      .eq('user_id', memberId)
      .eq('squad_id', squadId);

    if (deleteError) {
      return NextResponse.json(
        { error: 'Failed to remove member' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { data: { message: 'Member removed' } },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
