import type {
  DeliveryPerformanceItem,
  logisticsType,
  OrderTimeline,
  VehicleTrackingDataType
} from '@galaxy/types/apps/logisticsTypes'

export const db = {
  vehicleOverview: [
    {
      icon: 'tabler-car',
      heading: 'On the way',
      time: '2hr 10min',
      progressColor: 'action',
      progressColorVariant: 'hover',
      progressData: '38.7%',
      widthClass: 'is-[38.7%]'
    },
    {
      icon: 'tabler-circle-arrow-down',
      heading: 'Unloading',
      time: '3hr 15min',
      progressColor: 'primary',
      progressColorVariant: 'main',
      progressData: '27.3%',
      widthClass: 'is-[27.3%]'
    },
    {
      icon: 'tabler-circle-arrow-up',
      heading: 'Loading',
      time: '1hr 24min',
      progressColor: 'info',
      progressColorVariant: 'main',
      progressData: '17.4%',
      widthClass: 'is-[17.4%]'
    },
    {
      icon: 'tabler-clock',
      heading: 'Waiting',
      time: '5hr 19min',
      progressColor: 'SnackbarContent',
      progressColorVariant: 'bg',
      progressData: '16.6%',
      widthClass: 'is-[16.6%]'
    }
  ],
  vehicles: [
    {
      id: 1,
      location: 468031,
      startCity: 'Cagnes-sur-Mer',
      startCountry: 'France',
      endCity: 'Catania',
      endCountry: 'Italy',
      warnings: 'No Warnings',
      progress: 49
    },
    {
      id: 2,
      location: 302781,
      startCity: 'Köln',
      startCountry: 'Germany',
      endCity: 'Laspezia',
      endCountry: 'Italy',
      warnings: 'Ecu Not Responding',
      progress: 24
    },
    {
      id: 3,
      location: 715822,
      startCity: 'Chambray-lès-Tours',
      startCountry: 'France',
      endCity: 'Hamm',
      endCountry: 'Germany',
      warnings: 'Oil Leakage',
      progress: 7
    },
    {
      id: 4,
      location: 451430,
      startCity: 'Berlin',
      startCountry: 'Germany',
      endCity: 'Gelsenkirchen',
      endCountry: 'Germany',
      warnings: 'No Warnings',
      progress: 95
    },
    {
      id: 5,
      location: 921577,
      startCity: 'Cergy-Pontoise',
      startCountry: 'France',
      endCity: 'Berlin',
      endCountry: 'Germany',
      warnings: 'No Warnings',
      progress: 65
    },
    {
      id: 6,
      location: 480957,
      startCity: 'Villefranche-sur-Saône',
      startCountry: 'France',
      endCity: 'Halle',
      endCountry: 'Germany',
      warnings: 'Ecu Not Responding',
      progress: 55
    },
    {
      id: 7,
      location: 330178,
      startCity: 'Mâcon',
      startCountry: 'France',
      endCity: 'Bochum',
      endCountry: 'Germany',
      warnings: 'Fuel Problems',
      progress: 74
    },
    {
      id: 8,
      location: 595525,
      startCity: 'Fullerton',
      startCountry: 'USA',
      endCity: 'Lübeck',
      endCountry: 'Germany',
      warnings: 'No Warnings',
      progress: 100
    },
    {
      id: 9,
      location: 182964,
      startCity: 'Saintes',
      startCountry: 'France',
      endCity: 'Roma',
      endCountry: 'Italy',
      warnings: 'Oil Leakage',
      progress: 82
    },
    {
      id: 10,
      location: 706085,
      startCity: 'Fort Wayne',
      startCountry: 'USA',
      endCity: 'Mülheim an der Ruhr',
      endCountry: 'Germany',
      warnings: 'Oil Leakage',
      progress: 49
    },
    {
      id: 11,
      location: 523708,
      startCity: 'Albany',
      startCountry: 'USA',
      endCity: 'Wuppertal',
      endCountry: 'Germany',
      warnings: 'Temperature Not Optimal',
      progress: 66
    },
    {
      id: 12,
      location: 676485,
      startCity: 'Toledo',
      startCountry: 'USA',
      endCity: 'Magdeburg',
      endCountry: 'Germany',
      warnings: 'Temperature Not Optimal',
      progress: 7
    },
    {
      id: 13,
      location: 514437,
      startCity: 'Houston',
      startCountry: 'USA',
      endCity: 'Wiesbaden',
      endCountry: 'Germany',
      warnings: 'Fuel Problems',
      progress: 27
    },
    {
      id: 14,
      location: 300198,
      startCity: 'West Palm Beach',
      startCountry: 'USA',
      endCity: 'Dresden',
      endCountry: 'Germany',
      warnings: 'Temperature Not Optimal',
      progress: 90
    },
    {
      id: 15,
      location: 960090,
      startCity: 'Fort Lauderdale',
      startCountry: 'USA',
      endCity: 'Kiel',
      endCountry: 'Germany',
      warnings: 'No Warnings',
      progress: 81
    },
    {
      id: 16,
      location: 878423,
      startCity: 'Schaumburg',
      startCountry: 'USA',
      endCity: 'Berlin',
      endCountry: 'Germany',
      warnings: 'Fuel Problems',
      progress: 21
    },
    {
      id: 17,
      location: 318119,
      startCity: 'Mundolsheim',
      startCountry: 'France',
      endCity: 'München',
      endCountry: 'Germany',
      warnings: 'No Warnings',
      progress: 26
    },
    {
      id: 18,
      location: 742500,
      startCity: 'Fargo',
      startCountry: 'USA',
      endCity: 'Salerno',
      endCountry: 'Italy',
      warnings: 'Temperature Not Optimal',
      progress: 80
    },
    {
      id: 19,
      location: 469399,
      startCity: 'München',
      startCountry: 'Germany',
      endCity: 'Ath',
      endCountry: 'Belgium',
      warnings: 'Ecu Not Responding',
      progress: 50
    },
    {
      id: 20,
      location: 411175,
      startCity: 'Chicago',
      startCountry: 'USA',
      endCity: 'Neuss',
      endCountry: 'Germany',
      warnings: 'Oil Leakage',
      progress: 44
    },
    {
      id: 21,
      location: 753525,
      startCity: 'Limoges',
      startCountry: 'France',
      endCity: 'Messina',
      endCountry: 'Italy',
      warnings: 'Temperature Not Optimal',
      progress: 55
    },
    {
      id: 22,
      location: 882341,
      startCity: 'Cesson-Sévigné',
      startCountry: 'France',
      endCity: 'Napoli',
      endCountry: 'Italy',
      warnings: 'No Warnings',
      progress: 48
    },
    {
      id: 23,
      location: 408270,
      startCity: 'Leipzig',
      startCountry: 'Germany',
      endCity: 'Tournai',
      endCountry: 'Belgium',
      warnings: 'Ecu Not Responding',
      progress: 73
    },
    {
      id: 24,
      location: 276904,
      startCity: 'Aulnay-sous-Bois',
      startCountry: 'France',
      endCity: 'Torino',
      endCountry: 'Italy',
      warnings: 'Fuel Problems',
      progress: 30
    },
    {
      id: 25,
      location: 159145,
      startCity: 'Paris 19',
      startCountry: 'France',
      endCity: 'Dresden',
      endCountry: 'Germany',
      warnings: 'No Warnings',
      progress: 60
    }
  ],
  deliveryPerformance: [
    {
      title: 'Packages in transit',
      value: '10k',
      change: 25.8,
      icon: 'tabler-box',
      color: 'primary'
    },
    {
      title: 'Packages out for delivery',
      value: '5k',
      change: 4.3,
      icon: 'tabler-truck',
      color: 'info'
    },
    {
      title: 'Packages delivered',
      value: '15k',
      change: -12.5,
      icon: 'tabler-circle-check',
      color: 'success'
    },
    {
      title: 'Delivery success rate',
      value: '95%',
      change: 35.6,
      icon: 'tabler-percentage',
      color: 'warning'
    },
    {
      title: 'Average delivery time',
      value: '2.5 Days',
      change: -2.15,
      icon: 'tabler-clock',
      color: 'secondary'
    },
    {
      title: 'Customer satisfaction',
      value: '4.5/5',
      change: 5.7,
      icon: 'tabler-users',
      color: 'error'
    }
  ],
  ordersByCountries: {
    new: [
      {
        sender: {
          name: 'Micheal Hughes',
          address: '101 Boulder, California (CA), 933130'
        },
        receiver: {
          name: 'Daisy Coleman',
          address: '939 Orange, California (CA), 910614'
        }
      },
      {
        sender: {
          name: 'Glenn Todd',
          address: '1713 Garnet, California (CA), 939573'
        },
        receiver: {
          name: 'Arthur West',
          address: '156 Blaze, California (CA), 925878'
        }
      }
    ],
    preparing: [
      {
        sender: {
          name: 'Rose Cole',
          address: '61 Unions, California (CA), 922523'
        },
        receiver: {
          name: 'Polly Spencer',
          address: '865 Delta, California (CA), 932830'
        }
      },
      {
        sender: {
          name: 'Jerry Wood',
          address: '37 Marjory, California (CA), 951958'
        },
        receiver: {
          name: 'Sam McCormick',
          address: '926 Reynolds, California (CA), 910279'
        }
      }
    ],
    shipping: [
      {
        sender: {
          name: 'Alex Walton',
          address: '78 Judson, California (CA), 956084'
        },
        receiver: {
          name: 'Eula Griffin',
          address: '56 Bernard, California (CA), 965084'
        }
      },
      {
        sender: {
          name: 'Lula Barton',
          address: '95 Gaylord, California (CA), 991955'
        },
        receiver: {
          name: 'Craig Jacobs',
          address: '73 Sandy, California (CA), 954566'
        }
      }
    ]
  },
  vehicleTracking: [
    {
      name: 'VOL-342808',
      location: 'Chelsea, NY, USA',
      progress: 88,
      driverName: 'Veronica Herman',
      passengerName: 'Helen Jacobs'
    },
    {
      name: 'VOL-954784',
      location: 'Lincoln Harbor, NY, USA',
      progress: 90,
      driverName: 'Myrtle Ullrich',
      passengerName: 'William Miller'
    },
    {
      name: 'VOL-342808',
      location: 'Midtown East, NY, USA',
      progress: 60,
      driverName: 'Barry Schowalter',
      passengerName: 'Charles Anderson'
    },
    {
      name: 'VOL-343908',
      location: 'Hoboken, NY, USA',
      progress: 28,
      driverName: 'Frank Jones',
      passengerName: 'Edward Smith'
    }
  ]
} satisfies logisticsType
