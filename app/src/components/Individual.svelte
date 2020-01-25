<script>
  import { onMount } from 'svelte';
  import * as d3 from 'd3';

  import human from '../human.js';
  import { width, height } from '../stores.js';

  export let x;
  export let y;
  export let data;
  export let ageScale;
  export let tempScale;
  
  let expanded = false;
  let humanElement, lineElement;
  let humanLength, lineLength, rectElement;

  function animate(expand) {
    d3.select(humanElement)
      .attr('fill', expand ? 'none' : 'transparent')
      .transition().duration(1000)
        .attr('stroke-dashoffset', expand ? humanLength : 0);

    d3.select(lineElement)
      .transition().duration(1000)
        .attr('stroke-dashoffset', expand ? 0 : -lineLength);

    expanded = expand;
  }

  onMount(() => {
    humanLength = d3.select(humanElement).node().getTotalLength();
    lineLength = d3.select(lineElement).node().getTotalLength();

    d3.select(humanElement)
      .attr('fill', 'transparent')
      .attr('stroke-dashoffset', Math.random() > 0.5 ? humanLength : -humanLength)
      .transition().duration(1000).delay(Math.random() * 700)
        .attr('stroke-dashoffset', 0);

    d3.select(lineElement)
      .attr('stroke-dashoffset', -lineLength);
  });

  $: line = d3.line()
    .x((d) => ageScale(d.age))
    .y((d) => tempScale(d.temp))
    .curve(d3.curveBundle.beta(1));

  $: maxAge = d3.max(data.map((d) => d.age));
  $: minAge = d3.min(data.map((d) => d.age));
  $: maxTemp = d3.max(data.map((d) => d.temp));
  $: minTemp = d3.min(data.map((d) => d.temp));
</script>

<g class="individual">
  <g transform="translate({x} {y})">
    <path class="human"
        bind:this={humanElement}
        d={human}
        stroke-dasharray="{humanLength} {humanLength}"
        on:click={() => animate(true)} />
  </g>
  <g>
    <path class="line"
          bind:this={lineElement}
          d={line(data)}
          stroke-dasharray="{lineLength} {lineLength}" />
    {#if expanded}
      <rect class:hide={expanded}
            bind:this={rectElement}
            x={ageScale(minAge)}
            y={tempScale(maxTemp)}
            width={ageScale(maxAge) - ageScale(minAge)}
            height={tempScale(minTemp) - tempScale(maxTemp)}
            on:click={() => animate(false)} />
    {/if}
  </g>
</g>

<style>
  path {
    stroke-width: 2;
  }

  path:hover, rect:hover {
    cursor: pointer;
  }

  path.human {
    stroke: var(--purple);
  }

  path.line {
    stroke: var(--purple);
    fill: none;
    fill-opacity: 0;
  }

  rect {
    stroke: none;
    fill: transparent;
  }
</style>
