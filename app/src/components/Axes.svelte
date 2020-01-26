<script>
  import { fade } from 'svelte/transition';

  import { width, height } from '../stores.js';

  export let ageScale;
  export let tempScale;
  export let diseaseGroupScale;
  export let show = false;

  const ageTicks = [20, 30, 40, 50, 60, 70];
  const tempTicks = [36.5, 37.0, 37.5];
</script>

{#if show}
  <g class="axes" transition:fade>
    <text class="label" transform="translate(15 {tempScale.range()[0]}) rotate(-90)">Age (years)</text>
    <g class="axis-age" transform="translate(0 {tempScale.range()[0]})">
      {#each ageTicks as tick}
        <g transform="translate({ageScale(tick)} 0)">
          <text x=0 y=0>{tick.toPrecision(2)}</text>
          <line x1=0 y1=-12 x2=0 y2=-21 />
        </g>
      {/each}
    </g>
    <g class="axis-temp">
      <text class="label" transform="translate(15 {tempScale(37)}) rotate(-90)">Temperature (°C)</text>
      {#each tempTicks as tick}
        <g transform="translate(0 {tempScale(tick)})">
          <line class:faint={tick !== 37} x1=55 y1=0 x2={$width} y2=0 />
          <text x=25 y=4>{tick.toPrecision(3)}</text>
        </g>
      {/each}
    </g>
    <g class="axis-diagnosis">
      <text class="label" transform="translate(15 {diseaseGroupScale('J01')}) rotate(-90)">Got a cold</text>
    </g>
  </g>
{/if}

<style>
  line {
    stroke: var(--purple);
    stroke-width: 0.2vmin;
    stroke-opacity: 0.1;
  }

  .axis-temp line.faint {
    stroke-opacity: 0.05;
  }

  text {
    font-family: 'Source Sans Pro', sans-serif;
    font-size: 0.8rem;
    fill: var(--purple);
    fill-opacity: 0.4;
  }

  .axis-age text {
    text-anchor: middle;
  }

  .axis-temp text {
    text-anchor: start;
  }

  text.label {
    text-anchor: middle;
  }
</style>
