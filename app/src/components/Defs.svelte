<script>
</script>

<defs>
  <filter id="filter-blur">
    <feGaussianBlur in="SourceGraphic" stdDeviation="4"></feGaussianBlur>
  </filter>

  <filter id="point-light">
    <feDiffuseLighting result="diffOut" in="SourceGraphic" diffuseConstant="1.2" lighting-color="white">
        <fePointLight x="80" y="80" z="90" pointsAtX="0" pointsAtY="0" pointsAtZ="0" />
    </feDiffuseLighting>
    <feComposite in="SourceGraphic" in2="diffOut" operator="arithmetic" k1="1" k2="0" k3="0" k4="0"/>
  </filter>
</defs>

<style>
</style>
