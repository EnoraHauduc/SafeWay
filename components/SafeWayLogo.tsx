import { Image } from 'react-native';

type LogoVariant = 'signature' | 'everyday' | 'monochrome';

interface SafeWayLogoProps {
  /** Cap height of the wordmark in px. */
  size?: number;
  variant?: LogoVariant;
  className?: string;
}

const WORDMARK_ASPECT_RATIO = 921 / 340;

export function SafeWayLogo({ size = 30, className }: SafeWayLogoProps) {
  return (
    <Image
      accessibilityLabel="SafeWay"
      className={className}
      resizeMode="contain"
      source={require('@/assets/images/safeway-wordmark.png')}
      style={{ width: size * WORDMARK_ASPECT_RATIO, height: size }}
    />
  );
}
