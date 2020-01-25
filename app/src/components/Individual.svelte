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
  let humanElement, lineElement, lineBlurElement;
  let humanLength, lineLength, rectElement;
  let color = 'white';

  function animate(expanded) {
    d3.select(humanElement)
      .transition().duration(1000)
        .attr('stroke-dashoffset', expanded ? humanLength : 0);

    d3.select(lineBlurElement)
      .transition().duration(1000)
        .attr('stroke-dashoffset', expanded ? 0 : -lineLength);

    d3.select(lineElement)
      .transition().duration(1000)
        .attr('stroke-dashoffset', expanded ? 0 : -lineLength);
  }

  onMount(() => {
    // Create a random color
    color = `hsl(${Math.random() * 360}, 100%, 60%)`;

    // Get the path lengths
    humanLength = d3.select(humanElement).node().getTotalLength();
    lineLength = d3.select(lineElement).node().getTotalLength();

    // INitialise the paths
    d3.select(humanElement)
      .attr('stroke-dashoffset', Math.random() > 0.5 ? humanLength : -humanLength)
      .transition().duration(1000).delay(Math.random() * 700)
        .attr('stroke-dashoffset', 0)
        .transition().duration(500)
          .attr('fill-opacity', 0.4);

    d3.select(lineBlurElement)
      .attr('stroke-dashoffset', -lineLength);

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

  $: animate(expanded);
</script>

<g class="individual">
  <g transform="translate({x} {y})">
    <path class="human"
          bind:this={humanElement}
          d={human}
          fill={color}
          fill-opacity=0
          stroke-dasharray="{humanLength} {humanLength}"
          on:click={() => expanded = !expanded} />
  </g>
  <g>
    <path class="line-blur"
          bind:this={lineBlurElement}
          d={line(data)}
          stroke={color}
          stroke-dasharray="{lineLength} {lineLength}" />
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
            on:click={() => expanded = false} />
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
    filter: url(#point-light);
  }

  path.line, path.line-blur {
    fill: none;
    fill-opacity: 0;
  }

  path.line {
    stroke: var(--purple);
  }

  path.line-blur {
    stroke-width: 3;
    stroke-opacity: 0.6;
    filter: url(#filter-blur);
  }

  rect {
    stroke: none;
    fill: transparent;
  }
</style>
