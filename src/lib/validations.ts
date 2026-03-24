import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and dashes'),
  displayName: z.string().min(1).max(100).optional(),
});

export const squadSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(500).optional(),
});

export const courseSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  source: z.enum(['youtube', 'udemy', 'custom']),
  source_url: z.string().url(),
});

export const courseItemSchema = z.object({
  course_id: z.string().uuid(),
  title: z.string().min(1).max(255),
  source_id: z.string(),
  duration_seconds: z.number().positive().optional(),
  position: z.number().nonnegative(),
  thumbnail_url: z.string().url().optional(),
});

export const trackEventSchema = z.object({
  item_id: z.string().uuid(),
  event_type: z.enum(['play', 'pause', 'seek', 'complete', 'heartbeat']),
  position_seconds: z.number().nonnegative().optional(),
  percent_watched: z.number().min(0).max(100).optional(),
});

export const noteSchema = z.object({
  item_id: z.string().uuid(),
  content: z.string().min(1).max(5000),
  video_timestamp_seconds: z.number().nonnegative().optional(),
});

export const assignmentSchema = z.object({
  squad_id: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  course_id: z.string().uuid().optional(),
  due_date: z.string().datetime().optional(),
});

export const quizGenerationSchema = z.object({
  item_id: z.string().uuid(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type SquadInput = z.infer<typeof squadSchema>;
export type CourseInput = z.infer<typeof courseSchema>;
export type CourseItemInput = z.infer<typeof courseItemSchema>;
export type TrackEventInput = z.infer<typeof trackEventSchema>;
export type NoteInput = z.infer<typeof noteSchema>;
export type AssignmentInput = z.infer<typeof assignmentSchema>;
export type QuizGenerationInput = z.infer<typeof quizGenerationSchema>;
