import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';

// Keep safe-area screens from collapsing when className layout styles are used.
export const SafeAreaView = withUniwind(RNSafeAreaView);
