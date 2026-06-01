import { Image, ImageStyle, StyleProp } from 'react-native';

interface Props {
  /** Hauteur en px (le logo est carré). */
  height?: number;
  style?: StyleProp<ImageStyle>;
}

/** Logo officiel LMK (pin + wordmark brush). Asset carré. */
export function Logo({ height = 40, style }: Props) {
  return (
    <Image
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      source={require('../../../assets/LMK_logo.png')}
      style={[{ height, width: height, resizeMode: 'contain' }, style]}
    />
  );
}
