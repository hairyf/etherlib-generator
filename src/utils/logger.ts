/* eslint-disable no-console */
import type { Spinner } from 'nanospinner'
import { format as _format } from 'node:util'
import { createSpinner } from 'nanospinner'
import { blue, green, red, white, yellow } from './colors'

function format(args: any[]): string {
  return _format(...args).split('\n').join('\n')
}

export function success(...args: any[]): void {
  // biome-ignore lint/suspicious/noConsoleLog: console.log is used for logging
  console.log(green(format(args)))
}

export function info(...args: any[]): void {
  console.info(blue(format(args)))
}

export function log(...args: any[]): void {
  // biome-ignore lint/suspicious/noConsoleLog: console.log is used for logging
  console.log(white(format(args)))
}

export function warn(...args: any[]): void {
  console.warn(yellow(format(args)))
}

export function error(...args: any[]): void {
  console.error(red(format(args)))
}

export function spinner(text: string): Spinner {
  return createSpinner(text, { color: 'yellow' })
}
