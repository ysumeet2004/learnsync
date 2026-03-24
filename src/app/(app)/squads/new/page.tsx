import { SquadCreationForm } from '@/components/forms/SquadCreationForm';

export const metadata = {
  title: 'Create Squad - LearnSync',
  description: 'Create a new learning squad',
};

export default function CreateSquadPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-heading font-bold text-text-primary mb-2">
          Create a Squad
        </h1>
        <p className="text-text-secondary">
          Start a new learning group and invite your friends or colleagues
        </p>
      </div>

      <SquadCreationForm />

      <div className="mt-12 grid md:grid-cols-3 gap-6">
        <div className="p-6 bg-bg-surface border border-border rounded-xl">
          <div className="text-2xl font-bold text-brand mb-2">👥</div>
          <h3 className="font-semibold text-text-primary mb-2">Invite Members</h3>
          <p className="text-sm text-text-secondary">
            Share an invite code with friends to add them to the squad
          </p>
        </div>

        <div className="p-6 bg-bg-surface border border-border rounded-xl">
          <div className="text-2xl font-bold text-brand mb-2">🎥</div>
          <h3 className="font-semibold text-text-primary mb-2">Add Courses</h3>
          <p className="text-sm text-text-secondary">
            Import YouTube playlists, Udemy courses, or custom videos
          </p>
        </div>

        <div className="p-6 bg-bg-surface border border-border rounded-xl">
          <div className="text-2xl font-bold text-brand mb-2">📊</div>
          <h3 className="font-semibold text-text-primary mb-2">Track Progress</h3>
          <p className="text-sm text-text-secondary">
            Watch progress auto-syncs and appears on the squad dashboard
          </p>
        </div>
      </div>
    </div>
  );
}
