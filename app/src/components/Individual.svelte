<script>
  import { onMount } from 'svelte';
  import * as d3 from 'd3';

  import human from '../human.js';
  import { width, height, numExpandedIndividuals } from '../stores.js';

  export let x;
  export let y;
  export let data;
  export let sexScale;
  export let ageScale;
  export let tempScale;
  export let diseaseColorScale;
  export let diseaseGroupScale;
  
  let expanded = false;
  let humanElement, lineElement, lineBlurElement, rectElement, diseasesElement;
  let humanLength, lineLength;
  let color = 'white';

  function animate(expanded) {
    if (expanded) window.scrollTo(0, $height);

    numExpandedIndividuals.update(n => Math.max(0, n + (expanded ? 1 : -1)));

    d3.select(humanElement)
      .transition().duration(1000)
        .attr('stroke-dashoffset', expanded ? humanLength : 0);

    d3.select(lineBlurElement)
      .transition().duration(1000)
        .attr('stroke-dashoffset', expanded ? 0 : -lineLength);

    d3.select(lineElement)
      .transition().duration(1000)
        .attr('stroke-dashoffset', expanded ? 0 : -lineLength)
        .on(expanded ? 'end' : 'start', expanded ? showDiseases : hideDiseases);
  }

  function showDiseases() {
    d3.select(diseasesElement).selectAll('circle')
      .transition().duration(500)
        .attr('r', diseaseRadius)
        .transition().duration(500)
          .attr('cy', (d) => diseaseGroupScale(d.diagnosis));
  }

  function hideDiseases() {
    d3.select(diseasesElement).selectAll('circle')
      .transition().duration(500)
        .attr('r', 0)
        .attr('cy', (d) => tempScale(d.temp));
  }

  onMount(() => {
    // Create a random color
    color = sexScale(data[0].sex);

    // Get the path lengths
    humanLength = d3.select(humanElement).node().getTotalLength();
    lineLength = d3.select(lineElement).node().getTotalLength();

    // Initialise the paths
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

    // Load the disease circles
    d3.select(diseasesElement).selectAll('circle')
      .data(data.filter((d) => diseaseColorScale.domain().includes(d.diagnosis)))
      .join('circle')
        .attr('cx', (d) => ageScale(d.age))
        .attr('cy', (d) => tempScale(d.temp))
        .attr('r', 0)
        .attr('fill', (d) => diseaseColorScale(d.diagnosis))
        .attr('fill-opacity', 0.4);
  });

  $: line = d3.line()
    .x((d) => ageScale(d.age))
    .y((d) => tempScale(d.temp))
    .curve(d3.curveMonotoneX);

  $: maxAge = d3.max(data.map((d) => d.age));
  $: minAge = d3.min(data.map((d) => d.age));
  $: maxTemp = d3.max(data.map((d) => d.temp));
  $: minTemp = d3.min(data.map((d) => d.temp));

  $: diseaseRadius = (d3.max(diseaseGroupScale.range()) - d3.min(diseaseGroupScale.range())) / 4 / 2;

  $: animate(expanded);
</script>

<g class="individual">
  <g class="human-icon" transform="translate({x} {y}) scale(0.6)">
    <path class="human"
          bind:this={humanElement}
          d={human}
          fill={color}
          fill-opacity=0
          stroke-dasharray="{humanLength} {humanLength}"
          on:click={() => expanded = !expanded} />
  </g>
  <g class="temperature-line">
    <path class="line-blur"
          bind:this={lineBlurElement}
          d={line(data)}
          stroke={color}
          stroke-dasharray="{lineLength} {lineLength}" />
    <path class="line"
          bind:this={lineElement}
          d={line(data)}
          stroke-dasharray="{lineLength} {lineLength}" />
  </g>
  <g class="diseases"
     bind:this={diseasesElement}>
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
    stroke-opacity: 0.6;
    filter: url(#filter-blur);
  }

  rect {
    stroke: none;
    fill: transparent;
  }
</style>
