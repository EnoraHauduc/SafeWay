import { LinearGradient as RNLinearGradient } from 'expo-linear-gradient';
import { withUniwind } from 'uniwind';

// Expo LinearGradient needs a Uniwind-aware wrapper for className layout styles.
export const LinearGradient = withUniwind(RNLinearGradient);
