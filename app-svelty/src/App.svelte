<script>
  import * as d3 from 'd3';

  import { width, height, numExpandedIndividuals } from './stores.js';

  import CookieBanner from './CookieBanner.svelte';
  import Defs from './components/Defs.svelte';
  import Axes from './components/Axes.svelte';
  import Individual from './components/Individual.svelte';

  let data = [];

  // Load the data
  const load = () => {
    d3.csv('data.csv', (d) => {
      return {
        individual: +d.ANON_ID,
        age: +d.age_years,
        temp: +d.temp_C,
        diagnosis: d.primary_dx,
        sex: d.GENDER
      };
    }).then((res) => {
      let tmp = d3.nest()
                .key((d) => d.individual)
                .entries(res);
      data = tmp.sort((a, b) => a.values[0].age > b.values[0].age ? 1 : -1);
    });
  }

  load();

  const sexScale = d3.scaleOrdinal()
                    .domain(['Female', 'Male'])
                    .range(['#D84797', '#39A9DB']);

  const diagnosesToShow = ['J01', 'J06', 'R05'];

  // Adjust scales to dimensions
  $: individualRowScale = d3.scaleLinear()
      .domain([0, data.length])
      .range([$width / 100, $width]);

  $: ageScale = d3.scaleLinear()
      .domain(d3.extent([].concat(...data.map((d) => d.values.map((d) => d.age)))))
      .range([0.03 * $width, 0.97 * $width]);

  $: tempScale = d3.scaleLinear()
      .domain(d3.extent([].concat(...data.map((d) => d.values.map((d) => d.temp)))))
      .range([$height * 0.95, $height * 0.35]);

  // $: console.log($width)s
</script>

<div class="wrapper">
  <CookieBanner />
  <h1>Human signatures</h1>
  <div class="explanations">
    We are different – and our body temperature is as well.<br />It was the German physician Carl Reinhold August Wunderlich, who measured the temperatures of 25,000 patients leading to the accepted standard 37 degrees. The average human body temperature. Until today we believe that this is true.
    In early 2020 a comprehensive study with temperature data points spanning the last 150 years appeared in the scientific journal <a href="https://elifesciences.org/articles/49555">eLife</a>. Surprisingly, average body temperatures are constantly decreasing over past decades. Apart from that each individual has her and his own temperature profile over time.<br /><br />Explore them yourself by clicking on <span style="color: {sexScale('Female')};">female</span> or <span style="color: {sexScale('Male')};">male</span> bodies from the eLife study. A blue stamp <div class="dot"></div> denotes a cold.
  </div>
  <div class="svg-wrapper" bind:clientWidth={$width} bind:clientHeight={$height}>
    {#if ($width > 0 && $height > 0 && data.length > 0)}
      <svg xmlns="http://www.w3.org/2000/svg"
          width={$width}
          height={$height}>
        <Defs />
        <Axes ageScale={ageScale}
              tempScale={tempScale}
              show={$numExpandedIndividuals > 0} />
        {#each data as individual, i}
          {#if ($width > 600 || i % 2 === 0)}
            <Individual x={individualRowScale(i)}
                        y={Math.random() * $height / 10}
                        data={individual.values}
                        sexScale={sexScale}
                        ageScale={ageScale}
                        tempScale={tempScale}
                        diagnosesToShow={diagnosesToShow} />
          {/if}
        {/each}
      </svg>
    {/if}
  </div>
  <div class="disclaimer">Higsch Data Visuals  |  <a href="https://www.linkedin.com/in/matthias-stahl/">Matthias Stahl</a>  |  2020</div>
</div>

<style>
  .wrapper {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
  }

  h1 {
    width: 95%;
    margin: 1rem auto 0 auto;
    font-family: 'Source Sans Pro', sans-serif;
    font-size: 3rem;
    font-weight: 200;
    color: var(--purple);
  }

  .explanations {
    width: 95%;
    margin: 0.7rem auto;
    font-family: 'Source Sans Pro', sans-serif;
    font-size: 1rem;
    text-align: justify;
    line-height: 1.4;
    column-count: 2;
    column-gap: 2rem;
  }

  @media (max-width: 700px) {
    .explanations {
      column-count: 1;
    }
  }

  .dot {
    display: inline-block;
    width: 0.7rem;
    height: 0.7rem;
    background: #5BC0EB;
    border-radius: 50%;
  }

  .svg-wrapper {
    flex: 1;
    min-height: 600px;
    width: 100%;
  }

  svg {
    width: 100%;
    height: 100%;
  }

  .disclaimer {
    width: 100%;
    padding: 1rem 0;
    text-align: center;
    font-family: 'Source Sans Pro', sans-serif;
    font-size: 0.7rem;
    font-weight: 200;
  }
</style>
