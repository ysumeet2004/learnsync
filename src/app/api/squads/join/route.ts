import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { invite_code } = await request.json();

    if (!invite_code || typeof invite_code !== 'string') {
      return NextResponse.json(
        { error: 'Invalid invite code' },
        { status: 400 }
      );
    }

    // Find squad by invite code
    const { data: squad, error: squadError } = await supabase
      .from('squads')
      .select('id, name, plan')
      .eq('invite_code', invite_code)
      .single();

    if (squadError || !squad) {
      return NextResponse.json(
        { error: 'Invalid invite code' },
        { status: 404 }
      );
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('squad_members')
      .select('id')
      .eq('squad_id', squad.id)
      .eq('user_id', user.id)
      .single();

    if (existingMember) {
      return NextResponse.json(
        { error: 'You are already a member of this squad' },
        { status: 400 }
      );
    }

    // Check plan limits for free tier
    if (squad.plan === 'free') {
      const { count: memberCount, error: countError } = await supabase
        .from('squad_members')
        .select('*', { count: 'exact', head: true })
        .eq('squad_id', squad.id);

      if (countError) {
        return NextResponse.json(
          { error: 'Failed to check squad limits' },
          { status: 400 }
        );
      }

      if (memberCount && memberCount >= 3) {
        return NextResponse.json(
          { error: 'This squad has reached its member limit (3 members for free plan)' },
          { status: 400 }
        );
      }
    }

    // Add user as member
    const { error: joinError } = await supabase
      .from('squad_members')
      .insert({
        squad_id: squad.id,
        user_id: user.id,
        role: 'learner',
      });

    if (joinError) {
      return NextResponse.json(
        { error: joinError.message || 'Failed to join squad' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { data: { squad_id: squad.id, squad_name: squad.name } },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/squads/join error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
