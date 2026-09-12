import { Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { BRAND } from '@/lib/brand';

type LogoVariant = 'signature' | 'everyday' | 'monochrome';

interface SafeWayLogoProps {
  /** Cap height of the wordmark in px. */
  size?: number;
  variant?: LogoVariant;
  className?: string;
}

function RouteGlyph({ height, dotColor }: { height: number; dotColor: string }) {
  const width = height * 1.45;

  return (
    <Svg width={width} height={height} viewBox="0 0 64 44">
      <Path
        d="M12 34 H40 C48 34 48 22 40 22 H24 C16 22 16 10 24 10 H52"
        stroke={BRAND.ink}
        strokeWidth={7}
        strokeLinecap="round"
        fill="none"
      />
      <Circle cx={12} cy={34} r={5.5} fill={dotColor} />
      <Circle cx={52} cy={10} r={5.5} fill={dotColor} />
    </Svg>
  );
}

export function SafeWayLogo({ size = 30, variant = 'signature', className }: SafeWayLogoProps) {
  const dotColor = variant === 'everyday' ? BRAND.lilac : BRAND.ink;
  const showHighlight = variant === 'signature';

  const textStyle = {
    fontSize: size,
    lineHeight: size * 1.2,
    fontWeight: '800' as const,
    letterSpacing: -size * 0.02,
    color: BRAND.ink,
  };

  return (
    <View className={className} style={{ flexDirection: 'row', alignItems: 'center' }}>
      <RouteGlyph height={size * 0.72} dotColor={dotColor} />
      <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: size * 0.12 }}>
        <View style={{ justifyContent: 'center' }}>
          {showHighlight ? (
            <View
              className="bg-lime"
              style={{
                position: 'absolute',
                left: -size * 0.06,
                right: -size * 0.06,
                top: size * 0.12,
                bottom: size * 0.12,
                borderRadius: size * 0.16,
              }}
            />
          ) : null}
          <Text style={textStyle}>Safe</Text>
        </View>
        <Text style={textStyle}>Way</Text>
      </View>
    </View>
  );
}
