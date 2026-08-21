import { auth } from '@/auth';
import { getGoalsForVodic, getGuideOptionsByGoal } from '@/lib/domain/guide-data';
import { bs } from '@/lib/i18n/bs';
import { VodicWizard } from './_components/VodicWizard';

export default async function VodicPage() {
  const [ciljevi, opcijePoCilju, session] = await Promise.all([
    getGoalsForVodic(),
    getGuideOptionsByGoal(),
    auth(),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:py-16">
      <h1 className="font-bodoni text-2xl font-semibold text-ritual-charcoal sm:text-3xl">{bs.vodic.naslov}</h1>
      <VodicWizard ciljevi={ciljevi} opcijePoCilju={opcijePoCilju} ulogovan={!!session?.user} />
    </div>
  );
}
