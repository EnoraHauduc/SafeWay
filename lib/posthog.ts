import { Platform } from 'react-native';

let initStarted = false;

export function initPostHog(): void {
  if (
    initStarted ||
    Platform.OS !== 'web' ||
    typeof window === 'undefined' ||
    window === window.parent
  ) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const key = params.get('__ph_key');
  const host = params.get('__ph_host');
  if (!key || !host) return;

  initStarted = true;

  void import('posthog-js')
    .then(({ posthog }) => {
      posthog.init(key, {
        api_host: host,
        autocapture: false,
        capture_pageview: false,
        capture_pageleave: false,
        disable_session_recording: false,
        session_recording: {},
      });
    })
    .catch(() => {
      initStarted = false;
    });
}
