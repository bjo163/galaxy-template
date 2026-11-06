// Type Imports
import type {
  HelpCenterArticleCategory,
  HelpCenterGraphicArticle,
  LandingCustomerReview,
  LandingFeature,
  LandingFaq,
  LandingPricingPlan,
  LandingProductStat,
  LandingTeamMember,
  PaymentMethodOption,
  PricingPageFaq,
  PricingPageFeature,
  PricingPagePlanButton
} from '@galaxy/types/pages/frontPagesTypes'

export const db: {
  helpCenter: {
    articleCategories: HelpCenterArticleCategory[]
    popularArticles: HelpCenterGraphicArticle[]
    keepLearning: HelpCenterGraphicArticle[]
    relatedArticles: string[]
  }
  landing: {
    team: LandingTeamMember[]
    features: LandingFeature[]
    productStats: LandingProductStat[]
    customerReviews: LandingCustomerReview[]
    faqs: LandingFaq[]
    pricingPlans: LandingPricingPlan[]
  }
  pricing: {
    features: PricingPageFeature[]
    plans: PricingPagePlanButton[]
    faqs: PricingPageFaq[]
  }
  payment: {
    methods: PaymentMethodOption[]
    countries: string[]
  }
} = {
  helpCenter: {
    // Categories shown on the Help Center landing page
    articleCategories: [
      {
        title: 'Buying',
        icon: 'tabler-shopping-cart',
        articles: [
          { title: 'What are Favourites?' },
          { title: 'How do I purchase an item?' },
          { title: 'How do i add or change my details?' },
          { title: 'How do refunds work?' },
          { title: 'Can I Get A Refund?' },
          { title: "I'm trying to find a specific item" }
        ]
      },
      {
        title: 'Item Support',
        icon: 'tabler-help',
        articles: [
          { title: 'What is Item Support?' },
          { title: 'How to contact an author?' },
          { title: 'Where Is My Purchase Code?' },
          { title: 'Extend or renew Item Support' },
          { title: 'Item Support FAQ' },
          { title: 'Why has my item been removed?' }
        ]
      },
      {
        title: 'Licenses',
        icon: 'tabler-currency-dollar',
        articles: [
          { title: 'Can I use the same license for the...' },
          { title: 'How to contact an author?' },
          { title: "I'm making a test site - it's not for ..." },
          { title: 'which license do I need?' },
          { title: 'I want to make multiple end prod ...' },
          { title: 'For logo what license do I need?' }
        ]
      },
      {
        title: 'Template Kits',
        icon: 'tabler-color-swatch',
        articles: [
          { title: 'Template Kits' },
          { title: 'Elementor Template Kits: PHP Zip ...' },
          { title: 'Template Kits - Imported template ...' },
          { title: 'Troubleshooting Import Problems' },
          { title: 'How to use the WordPress Plugin ...' },
          { title: 'How to use the Template Kit Import ...' }
        ]
      },
      {
        title: 'Account & Password',
        icon: 'tabler-lock-open',
        articles: [
          { title: 'Signing in with a social account' },
          { title: 'Locked Out of Account' },
          { title: "I'm not receiving the verification email" },
          { title: 'Forgotten Username Or Password' },
          { title: 'New password not accepted' },
          { title: 'What is Sign In Verification?' }
        ]
      },
      {
        title: 'Account Settings',
        icon: 'tabler-user',
        articles: [
          { title: 'How do I change my password?' },
          { title: 'How do I change my username?' },
          { title: 'How do I close my account?' },
          { title: 'How do I change my email address?' },
          { title: 'How can I regain access to my a ...' },
          { title: 'Are RSS feeds available on Market?' }
        ]
      }
    ],
    popularArticles: [
      {
        slug: 'getting-started',
        title: 'Getting Started',
        icon: 'rocket',
        subtitle: "Whether you're new or you're a power user, this article will"
      },
      {
        slug: 'first-steps',
        title: 'First Steps',
        icon: 'gift',
        subtitle: "Are you a new customer and wondering how to get started?"
      },
      {
        slug: 'external-content',
        title: 'Add External Content',
        icon: 'file',
        subtitle: 'Article will show you how to expand the functionality of App'
      }
    ],
    keepLearning: [
      {
        slug: 'blogging',
        title: 'Blogging',
        icon: 'laptop',
        subtitle: 'Expert tips & tools to improve your website or online store using blog.'
      },
      {
        slug: 'inspiration-center',
        title: 'Inspiration Center',
        icon: 'bulb',
        subtitle: 'Inspiration from experts to help you start and grow your big ideas.'
      },
      {
        slug: 'community',
        title: 'Community',
        icon: 'discord',
        subtitle: 'A group of people living in the same place or having a particular.'
      }
    ],
    relatedArticles: [
      'Template Kits',
      'Elementor Template Kits: PHP Zip Extends',
      'Envato Elements Template Kits',
      'Envato Elements Template Kits',
      'How to use the template in WordPress',
      'How to use the Template Kit Import'
    ]
  },
  landing: {
    team: [
      {
        name: 'Sophie Gilbert',
        position: 'Project Manager',
        image: '/images/front-pages/landing-page/sophie.png',
        color: 'var(--mui-palette-primary-mainOpacity)'
      },
      {
        name: 'Paul Miles',
        position: 'UI Designer',
        image: '/images/front-pages/landing-page/paul.png',
        color: 'var(--mui-palette-info-mainOpacity)'
      },
      {
        name: 'Nannie Ford',
        position: 'Development Lead',
        image: '/images/front-pages/landing-page/nannie.png',
        color: 'var(--mui-palette-error-mainOpacity)'
      },
      {
        name: 'Chris Watkins',
        position: 'Marketing Manager',
        image: '/images/front-pages/landing-page/chris.png',
        color: 'var(--mui-palette-success-mainOpacity)'
      }
    ],
    features: [
      {
        icon: 'laptop-charging',
        title: 'Quality Code',
        description: 'Code structure that all developers will easily understand and fall in love with.'
      },
      {
        icon: 'rocket',
        title: 'Continuous Updates',
        description: 'Free updates for the next 12 months, including new demos and features.'
      },
      {
        icon: 'paper',
        title: 'Stater-Kit',
        description: 'Start your project quickly without having to remove unnecessary features.'
      },
      {
        icon: 'check',
        title: 'API Ready',
        description: 'Just change the endpoint and see your own data loaded within seconds.'
      },
      {
        icon: 'user',
        title: 'Excellent Support',
        description: 'An easy-to-follow doc with lots of references and code examples.'
      },
      {
        icon: 'document',
        title: 'Well Documented',
        description: 'An easy-to-follow doc with lots of references and code examples.'
      }
    ],
    productStats: [
      {
        title: 'Support Tickets Resolved',
        value: '7.1k+',
        icon: 'laptop-charging',
        color: 'var(--mui-palette-primary-darkerOpacity)',
        isHover: false
      },
      {
        title: 'Join creatives community',
        value: '50k+',
        icon: 'user',
        color: 'var(--mui-palette-success-darkerOpacity)',
        isHover: false
      },
      {
        title: 'Highly Rated Products',
        value: '4.8/5',
        icon: 'diamond',
        color: 'var(--mui-palette-info-darkerOpacity)',
        isHover: false
      },
      {
        title: 'Money Back Guarantee',
        value: '100%',
        icon: 'check',
        color: 'var(--mui-palette-warning-darkerOpacity)',
        isHover: false
      }
    ],
    customerReviews: [
      {
        desc: "I've never used a theme as versatile and flexible as Vuexy. It's my go to for building dashboard sites on almost any project.",
        logo: 'pinterest',
        logoColor: '#ee7676',
        rating: 5,
        name: 'Eugenia Moore',
        position: 'Founder of Pinterest',
        avatarSrc: '/images/avatars/1.png'
      },
      {
        desc: 'Materio is awesome, and I particularly enjoy knowing that if I get stuck on something.',
        logo: 'netflix',
        logoColor: '#d34c4d',
        rating: 5,
        name: 'Tommy haffman',
        position: 'Founder of Netflix',
        avatarSrc: '/images/avatars/2.png'
      },
      {
        desc: "This template is superior in so many ways. The code, the design, the regular updates, the support.. It's the whole package. Excellent Work.",
        logo: 'airbnb',
        logoColor: '#FF5A60',
        rating: 4,
        name: 'Eugenia Moore',
        position: 'CTO of Airbnb',
        avatarSrc: '/images/avatars/3.png'
      },
      {
        desc: "All the requirements for developers have been taken into consideration, so I'm able to build any interface I want.",
        logo: 'coinbase',
        logoColor: '#0199ff',
        rating: 5,
        name: 'Sara Smith',
        position: 'Founder of Coinbase',
        avatarSrc: '/images/avatars/4.png'
      },
      {
        desc: "I've never used a theme as versatile and flexible as Vuexy. It's my go to for building dashboard sites on almost any project.",
        logo: 'dribbble',
        logoColor: '#ea4c89',
        rating: 5,
        name: 'Tommy haffman',
        position: 'Founder of Dribble',
        avatarSrc: '/images/avatars/5.png'
      },
      {
        desc: "I've never used a theme as versatile and flexible as Vuexy. It's my go to for building dashboard sites on almost any project.",
        logo: 'pinterest',
        logoColor: '#ee7676',
        rating: 5,
        name: 'Eugenia Moore',
        position: 'Founder of Pinterest',
        avatarSrc: '/images/avatars/6.png'
      },
      {
        desc: 'Materio is awesome, and I particularly enjoy knowing that if I get stuck on something.',
        logo: 'hubspot',
        logoColor: '#FF5C35',
        rating: 5,
        name: 'Tommy haffman',
        position: 'Founder of HubSpot',
        avatarSrc: '/images/avatars/7.png'
      },
      {
        desc: "This template is superior in so many ways. The code, the design, the regular updates, the support.. It's the whole package. Excellent Work.",
        logo: 'airbnb',
        logoColor: '#FF5A60',
        rating: 4,
        name: 'Eugenia Moore',
        position: 'CTO of Airbnb',
        avatarSrc: '/images/avatars/8.png'
      },
      {
        desc: "All the requirements for developers have been taken into consideration, so I'm able to build any interface I want.",
        logo: 'coinbase',
        logoColor: '#0199ff',
        rating: 5,
        name: 'Sara Smith',
        position: 'Founder of Coinbase',
        avatarSrc: '/images/avatars/9.png'
      },
      {
        desc: 'Materio is awesome, and I particularly enjoy knowing that if I get stuck on something.',
        logo: 'dribbble',
        logoColor: '#ea4c89',
        rating: 5,
        name: 'Tommy haffman',
        position: 'Founder of Dribbble',
        avatarSrc: '/images/avatars/10.png'
      }
    ],
    faqs: [
      {
        id: 'panel1',
        question: 'Do you charge for each upgrade?',
        answer:
          'Lemon drops chocolate cake gummies carrot cake chupa chups muffin topping. Sesame snaps icing marzipan gummi bears macaroon dragée danish caramels powder. Bear claw dragée pastry topping soufflé. Wafer gummi bears marshmallow pastry pie.'
      },
      {
        id: 'panel2',
        question: 'What is regular license?',
        active: true,
        answer:
          'Regular license can be used for end products that do not charge users for access or service(access is free and there will be no monthly subscription fee). Single regular license can be used for single end product and end product can be used by you or your client. If you want to sell end product to multiple clients then you will need to purchase separate license for each client. The same rule applies if you want to use the same end product on multiple domains(unique setup). For more info on regular license you can check official description.'
      },
      {
        id: 'panel3',
        question: 'What is extended license?',
        answer:
          'Lorem ipsum dolor sit amet consectetur adipisicing elit. Nobis et aliquid quaerat possimus maxime! Mollitia reprehenderit neque repellat deleniti delectus architecto dolorum maxime, blanditiis earum ea, incidunt quam possimus cumque.'
      },
      {
        id: 'panel4',
        question: 'Which license is applicable for SASS application?',
        answer:
          'Lorem ipsum dolor sit amet consectetur adipisicing elit. Nobis et aliquid quaerat possimus maxime! Mollitia reprehenderit neque repellat deleniti delectus architecto dolorum maxime, blanditiis earum ea, incidunt quam possimus cumque.'
      }
    ],
    pricingPlans: [
      {
        title: 'Basic',
        img: '/images/front-pages/landing-page/pricing-basic.png',
        monthlyPay: 19,
        annualPay: 14,
        perYearPay: 168,
        features: ['Timeline', 'Basic search', 'Live chat widget', 'Email marketing', 'Custom Forms', 'Traffic analytics'],
        current: false
      },
      {
        title: 'Team',
        img: '/images/front-pages/landing-page/pricing-team.png',
        monthlyPay: 29,
        annualPay: 22,
        perYearPay: 264,
        features: [
          'Everything in basic',
          'Timeline with database',
          'Advanced search',
          'Marketing automation',
          'Advanced chatbot',
          'Campaign management'
        ],
        current: true
      },
      {
        title: 'Enterprise',
        img: '/images/front-pages/landing-page/pricing-enterprise.png',
        monthlyPay: 49,
        annualPay: 37,
        perYearPay: 444,
        features: [
          'Campaign management',
          'Timeline with database',
          'Fuzzy search',
          'A/B testing sanbox',
          'Custom permissions',
          'Social media automation'
        ],
        current: false
      }
    ]
  },
  pricing: {
    features: [
      {
        feature: '14-days free trial',
        starter: true,
        pro: true,
        enterprise: true,
        addOnAvailable: {
          starter: false,
          pro: false,
          enterprise: false
        }
      },
      {
        feature: 'No user limit',
        starter: false,
        pro: false,
        enterprise: true,
        addOnAvailable: {
          starter: false,
          pro: false,
          enterprise: false
        }
      },
      {
        feature: 'Product Support',
        starter: false,
        pro: true,
        enterprise: true,
        addOnAvailable: {
          starter: false,
          pro: false,
          enterprise: false
        }
      },
      {
        feature: 'Email Support',
        starter: false,
        pro: false,
        enterprise: true,
        addOnAvailable: {
          starter: false,
          pro: true,
          enterprise: false
        }
      },
      {
        feature: 'Integrations',
        starter: false,
        pro: true,
        enterprise: true,
        addOnAvailable: {
          starter: false,
          pro: false,
          enterprise: false
        }
      },
      {
        feature: 'Removal of Front branding',
        starter: false,
        pro: false,
        enterprise: true,
        addOnAvailable: {
          starter: false,
          pro: true,
          enterprise: false
        }
      },
      {
        feature: 'Active maintenance & support',
        starter: false,
        pro: false,
        enterprise: true,
        addOnAvailable: {
          starter: false,
          pro: false,
          enterprise: false
        }
      },
      {
        feature: 'Data storage for 365 days',
        starter: false,
        pro: false,
        enterprise: true,
        addOnAvailable: {
          starter: false,
          pro: false,
          enterprise: false
        }
      }
    ],
    plans: [
      { variant: 'tonal', label: 'Choose Plan', plan: 'starter' },
      { variant: 'contained', label: 'Choose Plan', plan: 'pro' },
      { variant: 'tonal', label: 'Choose Plan', plan: 'enterprise' }
    ],
    faqs: [
      {
        id: 'panel1',
        question: 'What counts towards the 100 responses limit?',
        answer:
          'We count all responses submitted through all your forms in a month. If you already received 100 responses this month, you won’t be able to receive any more of them until next month when the counter resets.'
      },
      {
        id: 'panel2',
        question: 'How do you process payments?',
        answer:
          'We accept Visa®, MasterCard®, American Express®, and PayPal®. So you can be confident that your credit card information will be kept safe and secure.',
        defaultExpanded: true
      },
      {
        id: 'panel3',
        question: 'What payment methods do you accept?',
        answer: '2Checkout accepts all types of credit and debit cards.'
      },
      {
        id: 'panel4',
        question: 'Do you have a money-back guarantee?',
        answer: 'Yes. You may request a refund within 30 days of your purchase without any additional explanations.'
      },
      {
        id: 'panel5',
        question: 'I have more questions. Where can I get help?',
        answer: 'Please contact us if you have any other questions or concerns. We’re here to help!'
      }
    ]
  },
  payment: {
    methods: [
      { value: 'credit-card', label: 'Credit Card', img: '/images/logos/visa.png', imgHeightClass: 'bs-3', isSelected: true },
      { value: 'paypal', label: 'Paypal', img: '/images/logos/paypal.png', imgHeightClass: 'bs-5' }
    ],
    countries: ['Australia', 'Brazil', 'Canada', 'India', 'United Arab Emirates', 'United Kingdom', 'United States']
  }
}
