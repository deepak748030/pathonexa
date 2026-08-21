// Tiny event bus: reports the on-screen rect of the focused input so
// ScrollPage can keep it visible above the keyboard (iOS).
import { UIManager, findNodeHandle } from 'react-native';

export type FieldRect = { y: number; h: number };
type Listener = (r: FieldRect) => void;

let listener: Listener | null = null;
let last: FieldRect | null = null;

export function onFieldFocus(fn: Listener | null) {
  listener = fn;
}
export function lastFieldRect() {
  return last;
}

/** Spread onto any TextInput: onFocus={...} measures the field in window coords. */
export function fieldFocusProps() {
  return {
    onFocus: (e: any) => {
      const node = e?.nativeEvent?.target;
      if (node == null) return;
      try {
        UIManager.measureInWindow(node, (_x: number, y: number, _w: number, h: number) => {
          last = { y, h };
          listener?.({ y, h });
        });
      } catch {
        /* noop */
      }
    },
  };
}

export { findNodeHandle };
