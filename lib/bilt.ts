import { createClient, asyncStorage } from '@biltme/backend';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const bilt = createClient(
  process.env.EXPO_PUBLIC_BILT_URL!,
  process.env.EXPO_PUBLIC_BILT_ANON_KEY!,
  {
    auth: {
      storage: asyncStorage(AsyncStorage),
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  },
);
