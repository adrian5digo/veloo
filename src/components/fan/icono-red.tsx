import {
  FacebookLogoIcon,
  GlobeIcon,
  InstagramLogoIcon,
  SpotifyLogoIcon,
  TelegramLogoIcon,
  ThreadsLogoIcon,
  TiktokLogoIcon,
  TwitchLogoIcon,
  WhatsappLogoIcon,
  XLogoIcon,
  YoutubeLogoIcon,
} from "@phosphor-icons/react/dist/ssr";
import type { Red } from "@/lib/redes";

const ICONOS: Record<Red, typeof GlobeIcon> = {
  instagram: InstagramLogoIcon,
  tiktok: TiktokLogoIcon,
  x: XLogoIcon,
  youtube: YoutubeLogoIcon,
  twitch: TwitchLogoIcon,
  spotify: SpotifyLogoIcon,
  whatsapp: WhatsappLogoIcon,
  telegram: TelegramLogoIcon,
  facebook: FacebookLogoIcon,
  threads: ThreadsLogoIcon,
  web: GlobeIcon,
};

export function IconoRed({ red, size = 20, className }: { red: Red; size?: number; className?: string }) {
  const Icono = ICONOS[red];
  return <Icono weight="bold" size={size} className={className} aria-hidden />;
}
