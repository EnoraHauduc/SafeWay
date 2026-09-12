import { Stack } from 'expo-router';
import { Text } from 'heroui-native';
import { View } from 'react-native';

export default function Home() {
  return <ScreenContent />;
}

function ScreenContent() {
  return (
    <View className="bg-background p-safe flex basis-full flex-col">
      <Stack.Screen
        options={{
          title: 'Home',
        }}
      />
      <View className="flex-1 items-center justify-center">
        <Text.Heading type="h2" align="center" className="mb-4">
          Welcome to Your App
        </Text.Heading>
        <Text.Paragraph align="center" color="muted">
          This is your starting point. Start building something amazing!
        </Text.Paragraph>
      </View>
    </View>
  );
}
