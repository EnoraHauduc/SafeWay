import { useState } from 'react';
import { Users, X } from 'lucide-react-native';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { CtaButton } from '@/components/ui/CtaButton';
import { BRAND } from '@/lib/brand';
import { goBackOrReplace } from '@/lib/navigation';
import { usePreferences } from '@/lib/stores/preferences';

export default function TrustedContactScreen() {
  const { t } = useTranslation();
  const trustedContact = usePreferences((state) => state.trustedContact);
  const setTrustedContact = usePreferences((state) => state.setTrustedContact);

  const [name, setName] = useState(trustedContact?.name ?? '');
  const [contact, setContact] = useState(trustedContact?.contact ?? '');

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="bg-mist flex-1"
    >
      <View className="flex-row items-center gap-3 px-4 pt-4">
        <View className="bg-lilac-tint h-10 w-10 items-center justify-center rounded-full">
          <Users color={BRAND.amethyst} size={18} />
        </View>
        <View className="flex-1">
          <Text className="text-ink text-xl" style={{ fontWeight: '800' }}>
            {t('trusted.title')}
          </Text>
        </View>
        <Pressable
          accessibilityLabel={t('common.close')}
          accessibilityRole="button"
          hitSlop={10}
          onPress={() => goBackOrReplace('/(tabs)')}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <X color={BRAND.ink} size={22} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerClassName="gap-4 px-4 pb-6 pt-4"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-ink-soft text-sm leading-5">{t('trusted.subtitle')}</Text>

        <View className="gap-2">
          <Text className="text-ink text-xs uppercase" style={{ letterSpacing: 1 }}>
            {t('trusted.name')}
          </Text>
          <View className="border-border bg-surface rounded-2xl border px-4 py-3">
            <TextInput
              className="text-ink text-sm"
              onChangeText={setName}
              placeholder={t('trusted.namePlaceholder')}
              placeholderTextColor={BRAND.muted}
              style={{ paddingVertical: 2 }}
              value={name}
            />
          </View>
        </View>

        <View className="gap-2">
          <Text className="text-ink text-xs uppercase" style={{ letterSpacing: 1 }}>
            {t('trusted.phone')}
          </Text>
          <View className="border-border bg-surface rounded-2xl border px-4 py-3">
            <TextInput
              autoCapitalize="none"
              className="text-ink text-sm"
              onChangeText={setContact}
              placeholder={t('trusted.phonePlaceholder')}
              placeholderTextColor={BRAND.muted}
              style={{ paddingVertical: 2 }}
              value={contact}
            />
          </View>
        </View>

        {trustedContact ? (
          <Pressable
            accessibilityRole="button"
            className="items-center py-2"
            onPress={() => {
              setTrustedContact(null);
              goBackOrReplace('/(tabs)');
            }}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Text className="text-amethyst text-sm" style={{ fontWeight: '700' }}>
              {t('trusted.remove')}
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>

      <View className="border-border bg-mist pb-safe-offset-3 border-t px-4 pt-3">
        <CtaButton
          isDisabled={name.trim().length === 0}
          label={t('trusted.save')}
          onPress={() => {
            setTrustedContact({ name: name.trim(), contact: contact.trim() });
            goBackOrReplace('/(tabs)');
          }}
          tone="lime"
        />
      </View>
    </KeyboardAvoidingView>
  );
}
