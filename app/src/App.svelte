<script>
	import * as d3 from 'd3';

	import { width, height } from './stores.js';
	import Individual from './components/Individual.svelte';

	let data = [];

	// Load the data
	const load = () => {
		d3.csv('data.csv', (d) => {
			return {
				individual: +d.ANON_ID,
				age: +d.age_years,
				temp: +d.temp_C,
				diagnosis: d.primary_dx
			};
		}).then((res) => {
			let tmp = d3.nest()
								.key((d) => d.individual)
								.entries(res);
			data = tmp.sort((a, b) => a.values[0].age > b.values[0].age);
		});
	}

	load();

	// Adjust scales to dimensions
	$: individualRowScale = d3.scaleLinear()
			.domain([0, data.length])
			.range([-$width / data.length / 2, $width + $width / data.length / 2]);

  $: ageScale = d3.scaleLinear()
    .domain(d3.extent([].concat(...data.map((d) => d.values.map((d) => d.age)))))
    .range([0, $width]);

	$: tempScale = d3.scaleLinear()
    .domain(d3.extent([].concat(...data.map((d) => d.values.map((d) => d.temp)))))
    .range([$height * 0.9, $height / 2]);
</script>

<div class="wrapper">
	<h1>Human body temperatures</h1>
	<div class="explanations">
		It was the German physician Carl Reinhold August Wunderlich, who measured the temperatures of 25,000 patients leading to the gold standard 37 degrees. The average human body temperature. Until today we believe that this is true.
		In early 2020 a comprehensive study with temperature data points spanning the last 150 years appeared in the scientific journal <a href="https://elifesciences.org/articles/49555">eLife</a>. Surprisingly, average body temperatures are falling over past decades. The authors speculate that one reason might be less infections.<br />
		Apart from that each individual might have her/his own base temperature. Explore it yourself by clicking on the bodies.
	</div>
	<div class="svg-wrapper" bind:clientWidth={$width} bind:clientHeight={$height}>
		<svg xmlns="http://www.w3.org/2000/svg"
				 width={$width}
				 height={$height}>
			{#each data as individual, i}
				<Individual x={individualRowScale(i)}
										y={Math.random() * $width / 10}
										data={individual.values}
										ageScale={ageScale}
										tempScale={tempScale} />
			{/each}
		</svg>
	</div>
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

	.svg-wrapper {
		flex: 1;
		min-height: 600px;
		width: 100%;
	}

	svg {
		width: 100%;
		height: 100%;
	}
</style>
