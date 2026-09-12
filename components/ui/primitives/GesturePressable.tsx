import { Pressable as RNGesturePressable } from 'react-native-gesture-handler';
import { withUniwind } from 'uniwind';

// Gesture-handler Pressable needs a wrapper for className-driven touch targets.
export const GesturePressable = withUniwind(RNGesturePressable);
