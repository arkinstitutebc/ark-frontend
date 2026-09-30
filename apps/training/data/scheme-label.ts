export const HISTORICAL_SCHEME_LABEL = "Scheme not recorded (older batch)"

export function displayTrainingScheme(label?: string | null) {
  if (label === "Legacy / Unspecified") return HISTORICAL_SCHEME_LABEL
  return label || "Scheme not recorded"
}
