import type { SVGAttributes } from 'react'

const Logo = (props: SVGAttributes<SVGSVGElement>) => (
  <svg
    width='1em'
    height='1em'
    viewBox='0 0 40 40'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    aria-hidden='true'
    focusable='false'
    {...props}
  >
    <circle cx='20' cy='20' r='15' stroke='currentColor' strokeWidth='2.4' opacity='.35' />
    <ellipse cx='20' cy='20' rx='18' ry='7.5' transform='rotate(-35 20 20)' stroke='currentColor' strokeWidth='2.4' />
    <path d='M12 25.5 19.8 11l8.1 14.5H12Z' fill='currentColor' />
    <circle cx='29.5' cy='9.5' r='3.5' fill='currentColor' />
  </svg>
)

export default Logo
