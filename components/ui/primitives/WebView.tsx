import { WebView as RNWebView } from 'react-native-webview';
import { withUniwind } from 'uniwind';

// WebView needs className translated to style for dimensions and borders.
export const WebView = withUniwind(RNWebView);
