export type PrimaryColorConfig = {
  name?: string
  light?: string
  main: string
  dark?: string
}

// Primary color config object
const primaryColorConfig: PrimaryColorConfig[] = [
  {
    name: 'Fern',
    light: '#4B9270',
    main: '#286B4E',
    dark: '#1D503A'
  },
  {
    name: 'Lagoon',
    light: '#4B99A2',
    main: '#286B76',
    dark: '#1D5059'
  },
  {
    name: 'Ochre',
    light: '#B58A56',
    main: '#805A2D',
    dark: '#604221'
  },
  {
    name: 'Berry',
    light: '#A9657D',
    main: '#75445A',
    dark: '#563243'
  },
  {
    name: 'Slate',
    light: '#6685AE',
    main: '#405D83',
    dark: '#304563'
  }
]

export default primaryColorConfig
