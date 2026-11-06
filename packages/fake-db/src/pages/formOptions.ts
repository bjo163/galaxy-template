// Type Imports
import type {
  CheckoutAddressOption,
  CheckoutCartProduct,
  CheckoutDeliveryOption,
  PropertyListingOption,
  ShippingRateOption,
  WizardCustomOption
} from '@galaxy/types/pages/formOptionsTypes'

export const db: {
  checkout: {
    addresses: CheckoutAddressOption[]
    deliveryOptions: CheckoutDeliveryOption[]
    cartProducts: CheckoutCartProduct[]
    confirmationProducts: CheckoutCartProduct[]
  }
  createDeal: {
    dealTypes: WizardCustomOption[]
  }
  propertyListing: {
    ownerTypes: WizardCustomOption[]
    sellOptions: PropertyListingOption[]
    furnishingOptions: string[]
  }
  formLayouts: {
    shippingOptions: ShippingRateOption[]
  }
} = {
  checkout: {
    addresses: [
      {
        title: 'John Doe (Default)',
        metaLabel: 'Home',
        metaColor: 'primary',
        value: 'home',
        isSelected: true,
        streetAddress: '4135 Parkway Street, Los Angeles, CA, 90017.',
        contactInfo: 'Mobile : 1234567890 Cash / Card on delivery available',
        editLabel: 'Edit',
        removeLabel: 'Remove'
      },
      {
        title: 'ACME Inc.',
        metaLabel: 'Office',
        metaColor: 'success',
        value: 'office',
        streetAddress: '87 Hoffman Avenue, New York, NY, 10016.',
        contactInfo: 'Mobile : 1234567890 Cash / Card on delivery available',
        editLabel: 'Edit',
        removeLabel: 'Remove'
      }
    ],
    deliveryOptions: [
      {
        isSelected: true,
        value: 'standard',
        title: 'Standard',
        asset: 'tabler-user',
        badgeLabel: 'Free',
        badgeColor: 'success',
        description: 'Get your product in 1 Week.'
      },
      {
        value: 'express',
        title: 'Express',
        asset: 'tabler-star',
        badgeLabel: '$10',
        badgeColor: 'secondary',
        description: 'Get your product in 3-4 days.'
      },
      {
        value: 'overnight',
        title: 'Overnight',
        asset: 'tabler-crown',
        badgeLabel: '$15',
        badgeColor: 'secondary',
        description: 'Get your product in 1 day.'
      }
    ],
    cartProducts: [
      {
        imgSrc: '/images/pages/google-home.png',
        imgAlt: 'Google Home',
        productName: 'Google - Google Home - White',
        soldBy: 'Google',
        inStock: true,
        rating: 4,
        count: 1,
        price: 299,
        originalPrice: 359
      },
      {
        imgSrc: '/images/pages/iPhone-11.png',
        imgAlt: 'Apple iPhone',
        productName: 'Apple iPhone 11 (64GB, Black)',
        soldBy: 'Apple',
        inStock: true,
        rating: 4,
        count: 1,
        price: 899,
        originalPrice: 999
      }
    ],
    confirmationProducts: [
      {
        imgSrc: '/images/pages/google-home.png',
        imgAlt: 'Google Home',
        productName: 'Google - Google Home - White',
        soldBy: 'Google',
        inStock: true,
        price: 299,
        originalPrice: 359
      },
      {
        imgSrc: '/images/pages/iPhone-11.png',
        imgAlt: 'Apple iPhone',
        productName: 'Apple iPhone 11 (64GB, Black)',
        soldBy: 'Apple',
        inStock: false,
        price: 899,
        originalPrice: 999
      }
    ]
  },
  createDeal: {
    dealTypes: [
      {
        title: 'Percentage',
        value: 'percentage',
        content: 'Create a deal which offer uses some % off (i.e 5% OFF) on total.',
        asset: 'tabler-discount-check-filled',
        isSelected: true
      },
      {
        title: 'Flat Amount',
        value: 'flat-amount',
        content: 'Create a deal which offer uses flat $ off (i.e $5 OFF) on the total.',
        asset: 'tabler-credit-card-filled'
      },
      {
        title: 'Prime Member',
        value: 'prime member',
        content: 'Create prime member only deal to encourage the prime members.',
        asset: 'tabler-diamond-filled'
      }
    ]
  },
  propertyListing: {
    ownerTypes: [
      {
        title: 'I am the Builder',
        value: 'builder',
        content: 'List property as Builder, list your project and get highest reach very fast.',
        asset: 'tabler-building',
        isSelected: true
      },
      {
        title: 'I am the Owner',
        value: 'owner',
        content: 'Submit property as an Individual. Lease, Rent or Sell at the best price.',
        asset: 'tabler-diamond'
      },
      {
        title: 'I am the broker',
        value: 'broker',
        content: 'Earn highest commission by listing your clients properties at the best price.',
        asset: 'tabler-briefcase'
      }
    ],
    sellOptions: [
      {
        value: 'sale',
        title: 'Sell the property',
        contentLines: ['Post your property for sale.', 'Unlimited free listing.'],
        asset: 'tabler-home',
        isSelected: true
      },
      {
        value: 'rent',
        title: 'Rent the property',
        contentLines: ['Post your property for sale.', 'Unlimited free listing.'],
        asset: 'tabler-wallet'
      }
    ],
    furnishingOptions: [
      'AC',
      'TV',
      'RO',
      'Bed',
      'WiFi',
      'Sofa',
      'Fridge',
      'Cupboard',
      'Microwave',
      'Dining Table',
      'Washing Machine'
    ]
  },
  formLayouts: {
    shippingOptions: [
      {
        title: 'Standard 3-5 Days',
        meta: 'Free',
        content: 'Friday, 15 Nov - Monday, 18 Nov',
        isSelected: true,
        value: 'standard'
      },
      {
        title: 'Express',
        meta: '$5.00',
        content: 'Friday, 15 Nov - Sunday, 17 Nov',
        value: 'express'
      },
      {
        title: 'Overnight',
        meta: '$10.00',
        content: 'Friday, 15 Nov - Saturday, 16 Nov',
        value: 'overnight'
      }
    ]
  }
}
