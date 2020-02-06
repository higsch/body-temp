import { cubicInOut } from 'svelte/easing';

export function move(node, { duration = 1000, delay = 0 }) {
  const length = node.getTotalLength();

  node.style.strokeDasharray = `${length}, ${length}`;

	return {
    duration,
    delay,
    easing: cubicInOut,
    css: (t, u) => `stroke-dashoffset: ${u * -length}`
  };
}
