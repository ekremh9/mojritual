import {
  Activity,
  Apple,
  Baby,
  Bath,
  Bone,
  Brain,
  Carrot,
  Droplets,
  Dumbbell,
  Eye,
  FlaskConical,
  Flower,
  Gem,
  HandHeart,
  Heart,
  HeartPulse,
  Leaf,
  Milk,
  Moon,
  Package,
  Pill,
  Salad,
  Scissors,
  Shield,
  ShieldCheck,
  Sparkles,
  SprayCan,
  Stethoscope,
  Sun,
  Wheat,
  Wind,
  Zap,
  type LucideIcon,
} from 'lucide-react';

/**
 * `categories.ikona` čuva ime lucide ikone kao string. Mapa je namjerno
 * eksplicitna, a ne dinamički import cijele biblioteke — bundle ostaje mali i
 * nepoznato ime iz baze ne može srušiti render.
 */
const IKONE: Record<string, LucideIcon> = {
  Activity,
  Apple,
  Baby,
  Bath,
  Bone,
  Brain,
  Carrot,
  Droplets,
  Dumbbell,
  Eye,
  FlaskConical,
  Flower,
  Gem,
  HandHeart,
  Heart,
  HeartPulse,
  Leaf,
  Milk,
  Moon,
  Package,
  Pill,
  Salad,
  Scissors,
  Shield,
  ShieldCheck,
  Sparkles,
  SprayCan,
  Stethoscope,
  Sun,
  Wheat,
  Wind,
  Zap,
};

const REZERVNA_IKONA = Package;

type CategoryIconProps = {
  /** Ime lucide ikone iz `categories.ikona`, npr. `Pill` ili `Dumbbell`. */
  ime: string | null;
  className?: string;
};

export function CategoryIcon({ ime, className }: CategoryIconProps) {
  const Ikona = (ime !== null ? IKONE[ime] : undefined) ?? REZERVNA_IKONA;

  return <Ikona aria-hidden="true" className={className} />;
}
