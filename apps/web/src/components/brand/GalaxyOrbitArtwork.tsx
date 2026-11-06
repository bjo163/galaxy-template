const GalaxyOrbitArtwork = () => (
  <div className='galaxy-orbit-art' aria-hidden='true'>
    <svg viewBox='0 0 320 220' fill='none' xmlns='http://www.w3.org/2000/svg'>
      <defs>
        <linearGradient id='galaxy-orbit-line' x1='36' y1='176' x2='274' y2='34' gradientUnits='userSpaceOnUse'>
          <stop stopColor='currentColor' stopOpacity='.12' />
          <stop offset='.55' stopColor='currentColor' stopOpacity='.72' />
          <stop offset='1' stopColor='currentColor' stopOpacity='.18' />
        </linearGradient>
        <radialGradient id='galaxy-orbit-core'>
          <stop stopColor='currentColor' stopOpacity='.24' />
          <stop offset='1' stopColor='currentColor' stopOpacity='0' />
        </radialGradient>
      </defs>
      <circle cx='174' cy='105' r='82' fill='url(#galaxy-orbit-core)' />
      <ellipse cx='174' cy='105' rx='126' ry='48' transform='rotate(-29 174 105)' stroke='url(#galaxy-orbit-line)' strokeWidth='1.5' />
      <ellipse cx='174' cy='105' rx='91' ry='73' transform='rotate(38 174 105)' stroke='currentColor' strokeOpacity='.16' strokeWidth='1' />
      <path d='M58 160 111 131l48-13 54-45 50-14' stroke='currentColor' strokeOpacity='.28' strokeWidth='1' strokeDasharray='3 5' />
      <circle cx='111' cy='131' r='5' fill='currentColor' fillOpacity='.7' />
      <circle cx='159' cy='118' r='8' fill='currentColor' fillOpacity='.18' />
      <circle cx='159' cy='118' r='3' fill='currentColor' />
      <circle cx='213' cy='73' r='6' fill='currentColor' fillOpacity='.8' />
      <circle cx='263' cy='59' r='4' fill='currentColor' fillOpacity='.45' />
      <circle cx='58' cy='160' r='3' fill='currentColor' fillOpacity='.5' />
    </svg>
  </div>
)

export default GalaxyOrbitArtwork
