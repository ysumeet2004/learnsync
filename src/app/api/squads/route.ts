import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { squadSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate body
    const body = await request.json();
    const validatedData = squadSchema.parse(body);

    // Create squad
    const { data: squad, error: squadError } = await supabase
      .from('squads')
      .insert({
        name: validatedData.name,
        description: validatedData.description ?? null,
        owner_id: user.id,
        plan: 'free', // Default to free plan
      })
      .select()
      .single();

    if (squadError) {
      return NextResponse.json(
        { error: squadError.message || 'Failed to create squad' },
        { status: 400 }
      );
    }

    // Add owner as lead member
    const { error: memberError } = await supabase
      .from('squad_members')
      .insert({
        squad_id: squad.id,
        user_id: user.id,
        role: 'lead',
      });

    if (memberError) {
      // Clean up squad if member insertion fails
      await supabase.from('squads').delete().eq('id', squad.id);
      return NextResponse.json(
        { error: 'Failed to add owner to squad' },
        { status: 400 }
      );
    }

    return NextResponse.json({ data: squad }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/squads error:', error);

    if (error.errors) {
      return NextResponse.json(
        {
          error: error.errors[0]?.message || 'Validation failed',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get squads user is a member of
    const { data: memberships } = await supabase
      .from('squad_members')
      .select('squad_id')
      .eq('user_id', user.id);

    const squadIds = (memberships ?? []).map((m) => m.squad_id);

    if (squadIds.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const { data: squads, error: squadError } = await supabase
      .from('squads')
      .select('*')
      .in('id', squadIds);

    if (squadError) {
      return NextResponse.json(
        { error: squadError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ data: squads });
  } catch (error) {
    console.error('GET /api/squads error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
