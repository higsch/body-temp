import { tweened } from 'svelte/motion';
import { cubicInOut } from 'svelte/easing';

export function expandable(node, { expanded, direction = true, duration = 1000}) {
  const initialOpacity = +getComputedStyle(node).strokeOpacity;

  let isBlurred = false;
  let unsubOffset, unsubOpacity;
  let offset, opacity;

  const length = node.getTotalLength();

  node.style.strokeDasharray = `${length}, ${length}`;
  const currOffset = direction ? 0 : -length;
  offset = tweened(currOffset, {
    duration,
    easing: cubicInOut
  });

  const currOpacity = +getComputedStyle(node).strokeOpacity;
  opacity = tweened(currOpacity, {
    duration,
    delay: 0,
    easing: cubicInOut
  });

  unsubOffset = offset.subscribe(o => node.style.strokeDashoffset = `${o}px`);
  unsubOpacity = opacity.subscribe(o => node.style.strokeOpacity = `${o}`);

	return {
    update (newConfig) {
      ({ expanded, direction} = newConfig);

      if ((expanded && direction) || (!expanded && !direction)) {
        offset.update(_ => -length);
      } else {
        offset.update(_ => 0);
      }
      
      if (expanded && !isBlurred) {
        opacity.update(_ => 0.3, {duration: duration * 3, delay: 5000});
        isBlurred = true;
      } else if (!expanded || expanded && isBlurred) {
        opacity.update(_ => initialOpacity, {duration, delay: 0});
        isBlurred = false;
      }
    },
    destroy() {
      unsubOffset();
      unsubOpacity();
    }
  };
}
