import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is lead in squad
    const { data: membership, error: memberError } = await supabase
      .from('squad_members')
      .select('role')
      .eq('squad_id', params.id)
      .eq('user_id', user.id)
      .single();

    if (memberError || !membership || !['lead', 'instructor'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Unauthorized - must be squad lead' },
        { status: 403 }
      );
    }

    // Get current invite code
    const { data: squad, error: squadError } = await supabase
      .from('squads')
      .select('invite_code')
      .eq('id', params.id)
      .single();

    if (squadError || !squad) {
      return NextResponse.json(
        { error: 'Squad not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: { invite_code: squad.invite_code } });
  } catch (error) {
    console.error('GET /api/squads/[id]/invite error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is lead in squad
    const { data: membership, error: memberError } = await supabase
      .from('squad_members')
      .select('role')
      .eq('squad_id', params.id)
      .eq('user_id', user.id)
      .single();

    if (memberError || !membership || !['lead', 'instructor'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Unauthorized - must be squad lead' },
        { status: 403 }
      );
    }

    // Generate new invite code
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const { data: squad, error: updateError } = await supabase
      .from('squads')
      .update({ invite_code: newCode })
      .eq('id', params.id)
      .select('invite_code')
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ data: { invite_code: squad.invite_code } });
  } catch (error) {
    console.error('POST /api/squads/[id]/invite error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
