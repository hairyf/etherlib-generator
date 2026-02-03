/**
 * Terminal colors using Node.js native util.styleText (no external dependency).
 * Respects NO_COLOR, NODE_DISABLE_COLORS, FORCE_COLOR and TTY.
 */
import { styleText } from 'node:util'

export function green(text: string): string {
  return styleText('green', text)
}

export function blue(text: string): string {
  return styleText('blue', text)
}

export function white(text: string): string {
  return styleText('white', text)
}

export function yellow(text: string): string {
  return styleText('yellow', text)
}

export function red(text: string): string {
  return styleText('red', text)
}

export function gray(text: string): string {
  return styleText('gray', text)
}
