/** Resolve composable local CSS Module classes, including conditional variants. */
export function classNames(styles: Record<string, string>, names: string): string {
  return names.split(/\s+/).filter(Boolean).map(name => styles[name]).filter(Boolean).join(" ");
}
