// Shared UI building blocks. Owned by the coordinator; feature agents use but do not edit these.
import { useContext, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { SafeAreaInsetsContext, SafeAreaView } from "react-native-safe-area-context";

import { useOptionalI18n } from "../i18n";
import { colors, radius, spacing, typography, TOUCH } from "./theme";

type ScreenProps = { children: ReactNode; scroll?: boolean; padded?: boolean; edges?: ("top" | "bottom")[] };

/**
 * Full-screen container with safe areas. Stack headers already handle the top edge and the tab bar the
 * bottom one, so tab screens pass `edges={[]}`. The bottom inset is applied as padding inside the scroll
 * content (not as a SafeAreaView edge) so the last button can scroll clear of the Android gesture bar and
 * the iOS home indicator, and is never counted twice.
 */
export function Screen({ children, scroll = true, padded = true, edges = ["bottom"] }: ScreenProps) {
  // Context read (not useSafeAreaInsets) so a missing provider means 0 instead of throwing.
  const insets = useContext(SafeAreaInsetsContext);
  const bottomInset = edges.includes("bottom") ? (insets?.bottom ?? 0) : 0;
  const content = padded ? <View style={styles.padded}>{children}</View> : children;
  return (
    <SafeAreaView style={styles.screen} edges={edges.filter((e) => e === "top")}>
      {scroll ? (
        <ScrollView
          testID="screen-scroll"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset }]}
        >
          {content}
        </ScrollView>
      ) : (
        <View style={[styles.screen, { paddingBottom: bottomInset }]}>{content}</View>
      )}
    </SafeAreaView>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <Text accessibilityRole="header" style={typography.heading}>
      {children}
    </Text>
  );
}

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  accessibilityHint,
  testID,
}: {
  label: string;
  onPress: () => void;
  testID?: string;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  accessibilityHint?: string;
}) {
  const inactive = disabled || loading;
  const v = buttonVariants[variant];
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [styles.button, v.container, { opacity: inactive ? 0.45 : pressed ? 0.75 : 1 }]}
    >
      {loading ? <ActivityIndicator color={v.text.color} /> : <Text style={[styles.buttonText, v.text]}>{label}</Text>}
    </Pressable>
  );
}

const buttonVariants: Record<ButtonVariant, { container: ViewStyle; text: { color: string } }> = {
  primary: { container: { backgroundColor: colors.primary }, text: { color: "#ffffff" } },
  secondary: {
    container: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.primary },
    text: { color: colors.primary },
  },
  danger: { container: { backgroundColor: colors.danger }, text: { color: "#ffffff" } },
  ghost: { container: { backgroundColor: "transparent" }, text: { color: colors.primary } },
};

type FieldProps = Omit<TextInputProps, "style"> & { label: string; error?: string | null; hint?: string; suffix?: string };

const NUMERIC_KEYBOARDS = new Set(["number-pad", "decimal-pad", "numeric", "phone-pad"]);

export function TextField({ label, error, hint, suffix, ...input }: FieldProps) {
  const i18n = useOptionalI18n();
  const [focused, setFocused] = useState(false);
  // Number pads have no return key on iOS, so numeric fields show a "Done" button while focused.
  const showDone = focused && NUMERIC_KEYBOARDS.has(input.keyboardType ?? "");
  const doneLabel = i18n?.t("common.done") ?? "Done";
  return (
    <View style={styles.field}>
      <Text style={typography.label}>{label}</Text>
      <View style={[styles.inputRow, error ? { borderColor: colors.danger } : null]}>
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          {...input}
          onFocus={(e) => {
            setFocused(true);
            input.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            input.onBlur?.(e);
          }}
        />
        {suffix ? <Text style={typography.muted}>{suffix}</Text> : null}
        {showDone ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={doneLabel}
            onPress={() => Keyboard.dismiss()}
            hitSlop={8}
            style={styles.doneButton}
          >
            <Text style={[typography.label, { color: colors.primary }]}>{doneLabel}</Text>
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text accessibilityRole="alert" style={[typography.small, { color: colors.danger }]}>
          {error}
        </Text>
      ) : hint ? (
        <Text style={typography.small}>{hint}</Text>
      ) : null}
    </View>
  );
}

/** Horizontal set of selectable chips (single choice). */
export function ChoiceChips<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (value: T) => void;
  label?: string;
}) {
  return (
    <View style={styles.field}>
      {label ? <Text style={typography.label}>{label}</Text> : null}
      <View style={styles.chips} accessibilityRole="radiogroup" accessibilityLabel={label}>
        {options.map((o) => {
          const selected = o.value === value;
          return (
            <Pressable
              key={o.value}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={o.label}
              onPress={() => onChange(o.value)}
              style={[styles.chip, selected ? styles.chipSelected : null]}
            >
              <Text style={[styles.chipText, selected ? styles.chipTextSelected : null]}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function ListRow({
  title,
  subtitle,
  right,
  onPress,
  accessibilityHint,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  onPress?: () => void;
  accessibilityHint?: string;
}) {
  const body = (
    <>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={typography.body} numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? <Text style={typography.muted}>{subtitle}</Text> : null}
      </View>
      {typeof right === "string" ? <Text style={typography.label}>{right}</Text> : right}
    </>
  );
  if (!onPress) return <View style={styles.row}>{body}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[title, subtitle, typeof right === "string" && /[\p{L}\p{N}]/u.test(right) ? right.replace(/\n/g, " ") : null]
        .filter(Boolean)
        .join(", ")}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed ? { backgroundColor: colors.primarySoft } : null]}
    >
      {body}
    </Pressable>
  );
}

export function Divider() {
  return <View style={styles.divider} />;
}

export function EmptyState({ message, action }: { message: string; action?: ReactNode }) {
  return (
    <View style={styles.centered}>
      <Text style={[typography.muted, { textAlign: "center" }]}>{message}</Text>
      {action}
    </View>
  );
}

export function ErrorState({ message, retryLabel, onRetry }: { message: string; retryLabel?: string; onRetry?: () => void }) {
  return (
    <View style={styles.centered}>
      <Text accessibilityRole="alert" style={[typography.body, { color: colors.danger, textAlign: "center" }]}>
        {message}
      </Text>
      {onRetry && retryLabel ? <Button label={retryLabel} onPress={onRetry} variant="secondary" /> : null}
    </View>
  );
}

export function Loading({ label }: { label: string }) {
  return (
    <View style={styles.centered} accessible accessibilityRole="progressbar" accessibilityLabel={label}>
      <ActivityIndicator color={colors.primary} />
      <Text style={typography.muted}>{label}</Text>
    </View>
  );
}

/** Thin horizontal progress bar; value is clamped to 0..1. */
export function ProgressBar({ value, color = colors.primary, label }: { value: number; color?: string; label?: string }) {
  const clamped = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
  return (
    <View
      style={styles.progressTrack}
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
    >
      <View style={[styles.progressFill, { width: `${clamped * 100}%`, backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  doneButton: { minHeight: 40, minWidth: TOUCH, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.sm },
  screen: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flexGrow: 1 },
  padded: { padding: spacing.lg, gap: spacing.md },
  card: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  button: {
    minHeight: TOUCH,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { fontSize: 16, fontWeight: "600", textAlign: "center" },
  field: { gap: spacing.xs },
  inputRow: {
    minHeight: TOUCH,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  input: { flex: 1, fontSize: 16, color: colors.text, paddingVertical: spacing.sm },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    minHeight: 40,
    paddingHorizontal: spacing.md,
    justifyContent: "center",
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 14, color: colors.text },
  chipTextSelected: { color: "#ffffff", fontWeight: "600" },
  row: {
    minHeight: TOUCH,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.sm,
  },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  centered: { flexGrow: 1, alignItems: "center", justifyContent: "center", gap: spacing.md, padding: spacing.xl },
  progressTrack: { height: 8, borderRadius: radius.pill, backgroundColor: colors.border, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: radius.pill },
});
