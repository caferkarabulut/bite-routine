// Shared UI building blocks. Owned by the coordinator; feature agents use but do not edit these.
import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, radius, spacing, typography, TOUCH } from "./theme";

type ScreenProps = { children: ReactNode; scroll?: boolean; padded?: boolean; edges?: ("top" | "bottom")[] };

/** Full-screen container with safe areas. Tabs and stack headers already handle the top edge. */
export function Screen({ children, scroll = true, padded = true, edges = [] }: ScreenProps) {
  const content = padded ? <View style={styles.padded}>{children}</View> : children;
  return (
    <SafeAreaView style={styles.screen} edges={edges}>
      {scroll ? (
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>
          {content}
        </ScrollView>
      ) : (
        content
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

export function TextField({ label, error, hint, suffix, ...input }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={typography.label}>{label}</Text>
      <View style={[styles.inputRow, error ? { borderColor: colors.danger } : null]}>
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          {...input}
        />
        {suffix ? <Text style={typography.muted}>{suffix}</Text> : null}
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
      accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}
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
