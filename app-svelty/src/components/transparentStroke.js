import { tweened } from 'svelte/motion';
import { cubicInOut } from 'svelte/easing';

export function transparentStroke(node, { duration = 1000, delay = 1000 }) {
  const currOpacity = +getComputedStyle(node).strokeOpacity;
  let opacity = tweened(currOpacity, {
    duration,
    delay: 0,
    easing: cubicInOut
  });

  let unsubOpacity = opacity.subscribe(o => node.style.strokeOpacity = `${o}`);

  opacity.update(_ => 0.3, {duration, delay});

	return {
    destroy() {
      unsubOpacity();
    }
  };
}
