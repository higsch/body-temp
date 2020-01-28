import { tweened } from 'svelte/motion';
import { cubicInOut } from 'svelte/easing';

export function fillable(node, { duration }) {
  const opacity = tweened(0, {
    duration: duration || 1000,
    delay: Math.random() * 700,
    easing: cubicInOut
  });

  const unsubOpacity = opacity.subscribe(o => node.style.fillOpacity = `${o}`);

  opacity.update(_ => 0.4);

  return {
    destroy() {
      unsubOpacity();
    }
  };
}
