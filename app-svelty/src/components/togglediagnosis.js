import { cubicInOut } from 'svelte/easing';

export function togglediagnosis(node, { radius, duration = 1000, delay = 1000 }) {
  return {
    duration,
    delay,
    easing: cubicInOut,
    tick: t => node.style.r = `${t * radius}px`
  };
}
