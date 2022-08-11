export default function lerp (a, b, x) {
  return x * b + (1.0 - x) * a;
}
