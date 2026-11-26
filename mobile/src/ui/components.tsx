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
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { SafeAreaInsetsContext, SafeAreaView } from "react-native-safe-area-context";

import { useOptionalI18n } from "../i18n";
import { Icon, type IconName } from "./Icon";
import { colors, fonts, palette, radius, shadow, spacing, typography, TOUCH } from "./theme";

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  edges?: ("top" | "bottom")[];
  /** Large in-content title (iOS "large title" pattern) for screens without a navigation header. */
  largeTitle?: string;
  /** Line under the large title, e.g. the date. */
  subtitle?: ReactNode;
  /** Actions next to the subtitle (or the title when there is no subtitle). */
  headerRight?: ReactNode;
};

/**
 * Full-screen container with safe areas. Stack headers already handle the top edge and the tab bar the
 * bottom one, so tab screens pass `edges={[]}`. The bottom inset is applied as padding inside the scroll
 * content (not as a SafeAreaView edge) so the last button can scroll clear of the Android gesture bar and
 * the iOS home indicator, and is never counted twice. Left and right insets (landscape notch, the camera
 * island of a foldable's cover screen) always pad the content.
 */
export function Screen({
  children,
  scroll = true,
  padded = true,
  edges = ["bottom"],
  largeTitle,
  subtitle,
  headerRight,
}: ScreenProps) {
  // Context read (not useSafeAreaInsets) so a missing provider means 0 instead of throwing.
  const insets = useContext(SafeAreaInsetsContext);
  const inset = {
    paddingBottom: edges.includes("bottom") ? (insets?.bottom ?? 0) : 0,
    paddingLeft: insets?.left ?? 0,
    paddingRight: insets?.right ?? 0,
  };
  const header = largeTitle ? (
    <LargeTitleHeader title={largeTitle} subtitle={subtitle} headerRight={headerRight} />
  ) : null;
  const content = padded ? (
    <View style={styles.padded}>
      {header}
      {children}
    </View>
  ) : (
    <>
      {header}
      {children}
    </>
  );
  return (
    <SafeAreaView style={styles.screen} edges={edges.filter((e) => e === "top")}>
      {scroll ? (
        <ScrollView
          testID="screen-scroll"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={[styles.scrollContent, inset]}
        >
          {content}
        </ScrollView>
      ) : (
        <View testID="screen-view" style={[styles.screen, inset]}>
          {content}
        </View>
      )}
    </SafeAreaView>
  );
}

function LargeTitleHeader({ title, subtitle, headerRight }: { title: string; subtitle?: ReactNode; headerRight?: ReactNode }) {
  const sub = typeof subtitle === "string" ? <Text style={styles.largeSubtitle}>{subtitle}</Text> : subtitle;
  return (
    <View style={styles.largeHeader}>
      <View style={styles.largeHeaderRow}>
        <Text accessibilityRole="header" style={[typography.largeTitle, { flex: 1 }]}>
          {title}
        </Text>
        {!subtitle ? headerRight : null}
      </View>
      {subtitle ? (
        <View style={styles.largeHeaderRow}>
          <View style={{ flex: 1 }}>{sub}</View>
          {headerRight}
        </View>
      ) : null}
    </View>
  );
}

/**
 * Left/right safe-area padding for screens that render their own list instead of <Screen>.
 * `base` is the content padding to add the insets to.
 */
export function useSideInsets(base = 0): { paddingLeft: number; paddingRight: number } {
  const insets = useContext(SafeAreaInsetsContext);
  return { paddingLeft: base + (insets?.left ?? 0), paddingRight: base + (insets?.right ?? 0) };
}

/** Borderless surface with a soft shadow. `padded={false}` for list cards whose rows bring their own padding. */
export function Card({ children, style, padded = true }: { children: ReactNode; style?: StyleProp<ViewStyle>; padded?: boolean }) {
  return <View style={[styles.card, padded ? styles.cardPadded : null, style]}>{children}</View>;
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <Text accessibilityRole="header" style={typography.heading}>
      {children}
    </Text>
  );
}

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

const BUTTON_HEIGHT: Record<ButtonSize, number> = { sm: 36, md: 48, lg: 56 };
const BUTTON_FONT: Record<ButtonSize, number> = { sm: 14, md: 16, lg: 17 };

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "lg",
  icon,
  disabled = false,
  loading = false,
  accessibilityHint,
  testID,
}: {
  label: string;
  onPress: () => void;
  testID?: string;
  variant?: ButtonVariant;
  /** sm 36 (touch area extended to the minimum with hitSlop), md 48, lg 56. */
  size?: ButtonSize;
  /** Leading icon. */
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  accessibilityHint?: string;
}) {
  const inactive = disabled || loading;
  const v = buttonVariants[variant];
  const height = BUTTON_HEIGHT[size];
  const slop = Math.max(0, Math.ceil((TOUCH - height) / 2));
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      hitSlop={slop || undefined}
      style={({ pressed }) => [
        styles.button,
        { minHeight: height, paddingHorizontal: size === "sm" ? spacing.md : spacing.lg },
        v.container,
        pressed && v.pressed ? v.pressed : null,
        { opacity: inactive ? 0.45 : pressed && !v.pressed ? 0.7 : 1 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.text} />
      ) : (
        <View style={styles.buttonInner}>
          {icon ? <Icon name={icon} size={BUTTON_FONT[size] + 3} color={v.text} /> : null}
          <Text style={[styles.buttonText, { color: v.text, fontSize: BUTTON_FONT[size] }]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

const buttonVariants: Record<ButtonVariant, { container: ViewStyle; pressed?: ViewStyle; text: string }> = {
  primary: {
    container: { backgroundColor: colors.primary },
    pressed: { backgroundColor: colors.primaryPressed },
    text: colors.onPrimary,
  },
  secondary: {
    container: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.primary },
    pressed: { backgroundColor: colors.primarySoft },
    text: colors.primary,
  },
  danger: { container: { backgroundColor: colors.danger }, text: colors.onPrimary },
  ghost: { container: { backgroundColor: "transparent" }, pressed: { backgroundColor: colors.primarySoft }, text: colors.primary },
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
  leading,
  trailing,
  testID,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  onPress?: () => void;
  accessibilityHint?: string;
  /** Icon name or any element before the text. */
  leading?: IconName | ReactNode;
  /** Separate action after the row (e.g. an IconButton); it is its own touch target, outside the row button. */
  trailing?: ReactNode;
  testID?: string;
}) {
  const lead = typeof leading === "string" ? <Icon name={leading as IconName} size={22} color={colors.primary} /> : leading;
  const body = (
    <>
      {lead}
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={typography.body} numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? <Text style={typography.muted}>{subtitle}</Text> : null}
      </View>
      {typeof right === "string" ? <Text style={[typography.label, typography.number]}>{right}</Text> : right}
    </>
  );
  const row = !onPress ? (
    <View testID={testID} style={[styles.row, trailing ? { flex: 1 } : null]}>
      {body}
    </View>
  ) : (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={[title, subtitle, typeof right === "string" && /[\p{L}\p{N}]/u.test(right) ? right.replace(/\n/g, " ") : null]
        .filter(Boolean)
        .join(", ")}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      style={({ pressed }) => [styles.row, trailing ? { flex: 1 } : null, pressed ? { backgroundColor: colors.primarySoft } : null]}
    >
      {body}
    </Pressable>
  );
  if (!trailing) return row;
  return (
    <View style={styles.rowWithTrailing}>
      {row}
      {trailing}
    </View>
  );
}

export function Divider({ inset = 0 }: { inset?: number }) {
  return <View style={[styles.divider, inset ? { marginHorizontal: inset } : null]} />;
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
  largeHeader: { paddingTop: spacing.xs },
  largeHeaderRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  largeSubtitle: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 20, color: colors.textMuted },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    gap: spacing.sm,
    ...shadow.card,
  },
  cardPadded: { padding: spacing.lg },
  button: {
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm },
  buttonText: { fontFamily: fonts.bold, textAlign: "center" },
  field: { gap: spacing.xs },
  inputRow: {
    minHeight: TOUCH + 4,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.inputBg,
    borderWidth: palette.inputBorderWidth,
    borderColor: colors.inputBorder,
    borderRadius: radius.md,
  },
  input: { flex: 1, fontFamily: fonts.regular, fontSize: 16, color: colors.text, paddingVertical: spacing.sm },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    minHeight: TOUCH,
    paddingHorizontal: spacing.lg,
    justifyContent: "center",
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    ...shadow.raised,
  },
  chipSelected: { backgroundColor: colors.primary },
  chipText: { fontFamily: fonts.regular, fontSize: 15, color: colors.text },
  chipTextSelected: { fontFamily: fonts.bold, color: colors.onPrimary },
  row: {
    minHeight: TOUCH,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.sm,
  },
  rowWithTrailing: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.divider },
  centered: { flexGrow: 1, alignItems: "center", justifyContent: "center", gap: spacing.md, padding: spacing.xl },
  progressTrack: { height: 8, borderRadius: radius.pill, backgroundColor: colors.track, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: radius.pill },
});
