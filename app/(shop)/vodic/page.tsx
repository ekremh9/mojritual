import { auth } from '@/auth';
import { getGoalsForVodic } from '@/lib/domain/guide-data';
import { bs } from '@/lib/i18n/bs';
import { VodicWizard } from './_components/VodicWizard';

export default async function VodicPage() {
  const [ciljevi, session] = await Promise.all([getGoalsForVodic(), auth()]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:py-16">
      <h1 className="text-2xl font-semibold text-[#1C2B22] sm:text-3xl">{bs.vodic.naslov}</h1>
      <VodicWizard ciljevi={ciljevi} ulogovan={!!session?.user} />
    </div>
  );
}
