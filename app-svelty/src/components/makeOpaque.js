import { cubicIn } from 'svelte/easing';

export function makeOpaque(node, { duration = 1000, maxOpacity = 0.4 }) {
  return {
    duration: duration,
    delay: Math.random() * 1000,
    easing: cubicIn,
    css: t => `fill-opacity: ${t * maxOpacity}` 
  };
}
