export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string | null;
          avatar_url: string | null;
          plan: 'free' | 'pro' | 'squad' | 'teams';
          created_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name?: string | null;
          avatar_url?: string | null;
          plan?: 'free' | 'pro' | 'squad' | 'teams';
          created_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          plan?: 'free' | 'pro' | 'squad' | 'teams';
          created_at?: string;
        };
      };
      squads: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          invite_code: string;
          owner_id: string;
          plan: 'free' | 'pro' | 'squad' | 'teams';
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          invite_code?: string;
          owner_id: string;
          plan?: 'free' | 'pro' | 'squad' | 'teams';
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          invite_code?: string;
          owner_id?: string;
          plan?: 'free' | 'pro' | 'squad' | 'teams';
          created_at?: string;
        };
      };
      squad_members: {
        Row: {
          squad_id: string;
          user_id: string;
          role: 'learner' | 'lead' | 'instructor';
          joined_at: string;
        };
        Insert: {
          squad_id: string;
          user_id: string;
          role?: 'learner' | 'lead' | 'instructor';
          joined_at?: string;
        };
        Update: {
          squad_id?: string;
          user_id?: string;
          role?: 'learner' | 'lead' | 'instructor';
          joined_at?: string;
        };
      };
      courses: {
        Row: {
          id: string;
          squad_id: string;
          title: string;
          source: 'youtube' | 'udemy' | 'custom';
          source_url: string;
          playlist_id: string | null;
          thumbnail_url: string | null;
          total_items: number;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          squad_id: string;
          title: string;
          source: 'youtube' | 'udemy' | 'custom';
          source_url: string;
          playlist_id?: string | null;
          thumbnail_url?: string | null;
          total_items?: number;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          squad_id?: string;
          title?: string;
          source?: 'youtube' | 'udemy' | 'custom';
          source_url?: string;
          playlist_id?: string | null;
          thumbnail_url?: string | null;
          total_items?: number;
          created_by?: string | null;
          created_at?: string;
        };
      };
      course_items: {
        Row: {
          id: string;
          course_id: string;
          title: string;
          source_id: string;
          duration_seconds: number | null;
          position: number;
          thumbnail_url: string | null;
          transcript: string | null;
        };
        Insert: {
          id?: string;
          course_id: string;
          title: string;
          source_id: string;
          duration_seconds?: number | null;
          position: number;
          thumbnail_url?: string | null;
          transcript?: string | null;
        };
        Update: {
          id?: string;
          course_id?: string;
          title?: string;
          source_id?: string;
          duration_seconds?: number | null;
          position?: number;
          thumbnail_url?: string | null;
          transcript?: string | null;
        };
      };
      watch_events: {
        Row: {
          id: string;
          user_id: string | null;
          item_id: string | null;
          event_type: 'play' | 'pause' | 'seek' | 'complete' | 'heartbeat';
          position_seconds: number | null;
          percent_watched: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          item_id?: string | null;
          event_type: 'play' | 'pause' | 'seek' | 'complete' | 'heartbeat';
          position_seconds?: number | null;
          percent_watched?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          item_id?: string | null;
          event_type?: 'play' | 'pause' | 'seek' | 'complete' | 'heartbeat';
          position_seconds?: number | null;
          percent_watched?: number | null;
          created_at?: string;
        };
      };
      progress: {
        Row: {
          user_id: string;
          item_id: string;
          percent_watched: number;
          is_complete: boolean;
          watch_time_seconds: number;
          last_watched_at: string | null;
        };
        Insert: {
          user_id: string;
          item_id: string;
          percent_watched?: number;
          is_complete?: boolean;
          watch_time_seconds?: number;
          last_watched_at?: string | null;
        };
        Update: {
          user_id?: string;
          item_id?: string;
          percent_watched?: number;
          is_complete?: boolean;
          watch_time_seconds?: number;
          last_watched_at?: string | null;
        };
      };
      notes: {
        Row: {
          id: string;
          user_id: string | null;
          item_id: string | null;
          content: string;
          video_timestamp_seconds: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          item_id?: string | null;
          content: string;
          video_timestamp_seconds?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          item_id?: string | null;
          content?: string;
          video_timestamp_seconds?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      assignments: {
        Row: {
          id: string;
          squad_id: string;
          course_id: string | null;
          title: string;
          description: string | null;
          due_date: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          squad_id: string;
          course_id?: string | null;
          title: string;
          description?: string | null;
          due_date?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          squad_id?: string;
          course_id?: string | null;
          title?: string;
          description?: string | null;
          due_date?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
      };
      submissions: {
        Row: {
          id: string;
          assignment_id: string;
          user_id: string | null;
          content: string | null;
          file_url: string | null;
          submitted_at: string;
        };
        Insert: {
          id?: string;
          assignment_id: string;
          user_id?: string | null;
          content?: string | null;
          file_url?: string | null;
          submitted_at?: string;
        };
        Update: {
          id?: string;
          assignment_id?: string;
          user_id?: string | null;
          content?: string | null;
          file_url?: string | null;
          submitted_at?: string;
        };
      };
      quizzes: {
        Row: {
          id: string;
          item_id: string | null;
          title: string;
          description: string | null;
          generated_by_ai: boolean;
          is_required: boolean;
          total_questions: number;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          item_id?: string | null;
          title: string;
          description?: string | null;
          generated_by_ai?: boolean;
          is_required?: boolean;
          total_questions?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          item_id?: string | null;
          title?: string;
          description?: string | null;
          generated_by_ai?: boolean;
          is_required?: boolean;
          total_questions?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      quiz_questions: {
        Row: {
          id: string;
          quiz_id: string;
          question_text: string;
          options: string[];
          correct_answer_index: number;
          explanation: string | null;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          quiz_id: string;
          question_text: string;
          options: string[];
          correct_answer_index: number;
          explanation?: string | null;
          position: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          quiz_id?: string;
          question_text?: string;
          options?: string[];
          correct_answer_index?: number;
          explanation?: string | null;
          position?: number;
          created_at?: string;
        };
      };
      quiz_attempts: {
        Row: {
          id: string;
          quiz_id: string | null;
          user_id: string | null;
          score: number;
          total_questions: number;
          answers: Array<{
            question_id: string;
            user_answer: number;
            correct_answer: number;
            is_correct: boolean;
          }> | null;
          completed_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          quiz_id?: string | null;
          user_id?: string | null;
          score?: number;
          total_questions?: number;
          answers?: Array<{
            question_id: string;
            user_answer: number;
            correct_answer: number;
            is_correct: boolean;
          }> | null;
          completed_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          quiz_id?: string | null;
          user_id?: string | null;
          score?: number;
          total_questions?: number;
          answers?: Array<{
            question_id: string;
            user_answer: number;
            correct_answer: number;
            is_correct: boolean;
          }> | null;
          completed_at?: string;
          created_at?: string;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {
      plan_type: 'free' | 'pro' | 'squad' | 'teams';
      role_type: 'learner' | 'lead' | 'instructor';
      source_type: 'youtube' | 'udemy' | 'custom';
      event_type: 'play' | 'pause' | 'seek' | 'complete' | 'heartbeat';
    };
  };
};
