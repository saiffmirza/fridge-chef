import React, { useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { login, register } from '../services/api';
import { colors, FONT, MAX_CONTENT, type as type_, webOnly } from '../theme';
import PaperButton from '../components/PaperButton';

interface Props {
  onAuth: () => void;
}

export default function AuthScreen({ onAuth }: Props) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailFocus, setEmailFocus] = useState(false);
  const [passFocus, setPassFocus] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(12)).current;
  const { width } = useWindowDimensions();
  const isWide = width >= 720;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 480, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [fade, slide]);

  const handleSubmit = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError('a kitchen needs both a name and a key.');
      return;
    }
    setLoading(true);
    try {
      if (isLogin) {
        await login(email.trim(), password);
      } else {
        await register(email.trim(), password);
      }
      onAuth();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'something went wrong';
      setError(msg.toLowerCase());
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[s.frame, isWide && s.frameWide]}>
        <Animated.View style={[s.markWrap, { opacity: fade, transform: [{ translateY: slide }] }]}>
          <Image
            source={require('../../assets/icon.png')}
            style={s.mark}
            resizeMode="contain"
            accessibilityLabel="fridge chef mark"
          />
        </Animated.View>

        <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>
          <Text style={s.wordmark}>fridge,</Text>
          <Text style={s.wordmarkSecond}>chef.</Text>
          <Text style={s.tag}>
            tell us what's in your kitchen.{'\n'}
            <Text style={s.tagAccent}>we'll tell you what to cook.</Text>
          </Text>
        </Animated.View>

        <Animated.View style={[s.form, { opacity: fade, transform: [{ translateY: slide }] }]}>
          <View style={s.field}>
            <Text style={s.label}>email address</Text>
            <TextInput
              style={[s.input, webOnly({ outlineStyle: 'none' })]}
              value={email}
              onChangeText={setEmail}
              onFocus={() => setEmailFocus(true)}
              onBlur={() => setEmailFocus(false)}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="name@kitchen.co"
              placeholderTextColor={colors.inkFaint}
            />
            <View style={[s.underline, emailFocus && s.underlineFocus]} />
          </View>

          <View style={s.field}>
            <Text style={s.label}>password</Text>
            <TextInput
              style={[s.input, webOnly({ outlineStyle: 'none' })]}
              value={password}
              onChangeText={setPassword}
              onFocus={() => setPassFocus(true)}
              onBlur={() => setPassFocus(false)}
              secureTextEntry
              placeholder="••••••••"
              placeholderTextColor={colors.inkFaint}
            />
            <View style={[s.underline, passFocus && s.underlineFocus]} />
          </View>

          {error && <Text style={s.error}>{error}</Text>}

          <View style={s.actions}>
            <PaperButton
              label={isLogin ? 'step inside' : 'open a kitchen'}
              trailing="→"
              onPress={handleSubmit}
              loading={loading}
              full
            />
            <TouchableOpacity
              onPress={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
              hitSlop={10}
              style={[s.switch, webOnly({ cursor: 'pointer' })]}
            >
              <Text style={s.switchTxt}>
                {isLogin ? 'no account yet? ' : 'have an account? '}
                <Text style={s.switchTxtAccent}>
                  {isLogin ? 'open one' : 'step inside'}
                </Text>
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.paper,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  frame: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: MAX_CONTENT,
    paddingVertical: 32,
  },
  frameWide: { paddingVertical: 56 },
  markWrap: { alignItems: 'flex-start', marginBottom: 12, marginLeft: -10 },
  mark: { width: 116, height: 116 },
  wordmark: {
    fontFamily: FONT.serifBoldItalic,
    fontSize: 64,
    lineHeight: 64,
    letterSpacing: -2,
    color: colors.ink,
  },
  wordmarkSecond: {
    fontFamily: FONT.serifBold,
    fontSize: 64,
    lineHeight: 64,
    letterSpacing: -2,
    color: colors.terracotta,
    marginTop: -6,
  },
  tag: {
    ...type_.subtitle,
    marginTop: 18,
    color: colors.inkSoft,
    maxWidth: 380,
  },
  tagAccent: { color: colors.terracotta },
  form: { marginTop: 40 },
  field: { marginBottom: 22 },
  label: {
    ...type_.eyebrow,
    color: colors.inkFaint,
    marginBottom: 8,
  },
  input: {
    fontFamily: FONT.serif,
    fontSize: 22,
    color: colors.ink,
    paddingVertical: 8,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  underline: {
    height: 1,
    backgroundColor: colors.hairline,
  },
  underlineFocus: {
    height: 2,
    backgroundColor: colors.terracotta,
    marginTop: -1,
  },
  error: {
    fontFamily: FONT.serifItalic,
    fontSize: 14,
    color: colors.expired,
    marginTop: 4,
    marginBottom: 12,
  },
  actions: { marginTop: 14 },
  switch: { alignSelf: 'center', marginTop: 22 },
  switchTxt: {
    fontFamily: FONT.sans,
    fontSize: 14,
    color: colors.inkFaint,
  },
  switchTxtAccent: {
    fontFamily: FONT.serifItalic,
    color: colors.terracotta,
    textDecorationLine: 'underline',
  },
});
