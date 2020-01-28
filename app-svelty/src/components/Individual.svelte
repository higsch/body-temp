<script>
  import * as d3 from 'd3';

  import human from '../human.js';
  import { width, height, numExpandedIndividuals } from '../stores.js';

  import { expandable } from './expandable.js';
  import { fillable } from './fillable.js';
  import { toggledisease } from './toggledisease.js';

  export let x;
  export let y;
  export let data;
  export let sexScale;
  export let ageScale;
  export let tempScale;
  export let diagnosesToShow = [];
  
  const color = sexScale(data[0].sex);

  let expanded = false;
  let rectElement;

  $: line = d3.line()
    .x((d) => ageScale(d.age))
    .y((d) => tempScale(d.temp))
    .curve(d3.curveMonotoneX);

  $: maxAge = d3.max(data.map((d) => d.age));
  $: minAge = d3.min(data.map((d) => d.age));
  $: maxTemp = d3.max(data.map((d) => d.temp));
  $: minTemp = d3.min(data.map((d) => d.temp));

  $: diseaseRadius = Math.min($width, $height) / 100;

  $: if (expanded) window.scrollTo(0, $height);
  $: numExpandedIndividuals.update(n => Math.max(0, n + (expanded ? 1 : -1)));
</script>

<g class="individual">
  <g class="human-icon" transform="translate({x} {y}) scale(0.6)">
    <path class="human"
          use:fillable={{duration: 1000}}
          use:expandable={{expanded: expanded, direction: true, duration: 1000}}
          d={human}
          fill={color}
          on:click={() => expanded = !expanded} />
  </g>
  <g class="diagnoses">
    {#each data.filter((d) => diagnosesToShow.includes(d.diagnosis)) as { age, temp }}
      <circle class="diagnosis-circle"
              cx={ageScale(age)}
              cy={tempScale(temp)}
              r=0
              use:toggledisease={{expanded, radius: diseaseRadius, duration: 1000}} />
    {/each}
  </g>
  <g class="temperature-line">
    <path class="line-blur to-blur"
          use:expandable={{expanded, direction: false}}
          d={line(data)}
          stroke={color}/>
    <path class="line to-blur"
          use:expandable={{expanded, direction: false}}
          d={line(data)} />
  </g>
  <g class="hover-rect">
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
  path:hover, rect:hover {
    cursor: pointer;
  }

  path.human {
    stroke: var(--purple);
    stroke-width: calc(1.6 * 0.2vmin);
    filter: url(#point-light);
  }

  path.line, path.line-blur {
    fill: none;
    fill-opacity: 0;
  }

  path.line {
    stroke: var(--purple);
    stroke-width: 0.2vmin;
  }

  path.line-blur {
    stroke-width: 0.3vmin;
    filter: url(#filter-blur);
  }

  circle.diagnosis-circle {
    stroke: none;
    fill: #5BC0EB;
    fill-opacity: 0.6;
  }

  rect {
    stroke: none;
    fill: transparent;
  }
</style>
