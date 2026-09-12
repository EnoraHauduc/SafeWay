import Animated from 'react-native-reanimated';
import { withUniwind } from 'uniwind';

// Use this when an animated view needs Uniwind className styling in Expo Go.
export const AnimatedView = withUniwind(Animated.View);
