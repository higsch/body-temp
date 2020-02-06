import { cubicInOut } from 'svelte/easing';

export function makeOpaqueFill(node, { duration = 1000, maxOpacity = 0.4 }) {
  return {
    duration,
    delay: Math.random() * 1000,
    easing: cubicInOut,
    css: t => `fill-opacity: ${t * maxOpacity};` 
  };
}
