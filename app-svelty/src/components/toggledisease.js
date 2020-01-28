import { tweened } from 'svelte/motion';
import { cubicInOut } from 'svelte/easing';

export function toggledisease(node, { radius, duration = 300, delay = 1000 }) {
  let unsub;
  let radiusTween;

  radiusTween = tweened(0, {
    duration,
    delay,
    easing: cubicInOut
  });

  unsub = radiusTween.subscribe(r => node.style.r = r);

  return {
    update({ expanded }) {
      console.log(expanded)
      radiusTween.update(_ => expanded ? radius : 0);
    },
    destroy() {
      unsub();
    }
  };
}
