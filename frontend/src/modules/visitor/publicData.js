import { getDestinationImage } from '../../data/tourismImages'

export const destinations = [
  {
    slug: 'le-coola-resort',
    name: 'Le Coola Resort',
    type: 'Resort',
    tag: 'Featured',
    address: 'Calabanga, Camarines Sur',
    fee: 'Contact resort for rates',
    hours: '7:00 AM - 6:00 PM',
    contact: 'Contact Tourism Office',
    email: 'tourism@calabanga.gov.ph',
    image: getDestinationImage('le-coola-resort'),
    imageAlt: 'Le Coola Resort in Calabanga',
    description:
      'A relaxing local resort destination for family outings, group visits, and quick Calabanga getaways.',
    longDescription:
      'Le Coola Resort offers a welcoming leisure stop for visitors looking for a calm resort setting in Calabanga. It is suitable for families, small groups, and travelers who want a refreshing local destination close to town services.',
    amenities: ['Swimming area', 'Cottages', 'Family spaces', 'Group visit support', 'Parking'],
    reminder: 'Coordinate with the resort or Tourism Office for current rates, availability, and visitor guidelines.',
  },
  {
    slug: 'hacienda-calabanga-resort',
    name: 'Hacienda Calabanga Resort',
    type: 'Resort',
    tag: 'Family Resort',
    address: 'Calabanga, Camarines Sur',
    fee: 'Contact resort for rates',
    hours: '7:00 AM - 6:00 PM',
    contact: 'Contact Tourism Office',
    email: 'tourism@calabanga.gov.ph',
    image: getDestinationImage('hacienda-calabanga-resort'),
    imageAlt: 'Hacienda Calabanga Resort in Camarines Sur',
    description:
      'A resort destination with a spacious setting for family gatherings, leisure visits, and local celebrations.',
    longDescription:
      'Hacienda Calabanga Resort gives visitors a pleasant resort experience with room for recreation, group activities, and casual relaxation. It supports Calabanga tourism by offering another accessible accommodation and leisure option for guests.',
    amenities: ['Resort facilities', 'Event-friendly areas', 'Family spaces', 'Cottages', 'Parking'],
    reminder: 'Confirm operating hours, entrance arrangements, and reservation requirements before visiting.',
  },
  {
    slug: 'busay-falls',
    name: 'Busay Falls',
    type: 'Nature Destination',
    tag: 'Nature',
    address: 'Calabanga, Camarines Sur',
    fee: 'Contact Tourism Office',
    hours: 'Day visits recommended',
    contact: 'Contact Tourism Office',
    email: 'tourism@calabanga.gov.ph',
    image: getDestinationImage('busay-falls'),
    imageAlt: 'Busay Falls natural destination in Calabanga',
    description:
      'A natural attraction with cool scenery and a refreshing outdoor experience for nature-oriented visitors.',
    longDescription:
      'Busay Falls highlights Calabanga natural beauty through its waterfall setting and peaceful outdoor atmosphere. It is best suited for visitors who enjoy simple nature trips, scenic views, and responsible local exploration.',
    amenities: ['Waterfall scenery', 'Nature viewing', 'Outdoor recreation', 'Photo opportunities'],
    reminder: 'Wear appropriate footwear, observe safety guidance, and help keep the area clean.',
  },
]

export const events = [
  {
    name: 'Calabanga Town Fiesta',
    category: 'Cultural Festival',
    date: 'June 24, 2026',
    time: '08:00 - 22:00',
    location: 'Calabanga Town Plaza',
    organizer: 'Calabanga LGU',
    description:
      'Annual town celebration featuring cultural shows, trade fair activities, community performances, and religious traditions.',
  },
  {
    name: 'Mangrove Planting Activity',
    category: 'Environmental',
    date: 'June 08, 2026',
    time: '07:00 - 11:00',
    location: 'Mangrove Eco-Tourism Park, Sabang',
    organizer: 'Calabanga Tourism Office and DENR',
    description:
      'Community-based environmental activity promoting coastal protection, climate action, and responsible tourism.',
  },
  {
    name: 'Farm Tourism Caravan',
    category: 'Agri-Tourism',
    date: 'May 20, 2026',
    time: '09:00 - 15:00',
    location: 'Various Farm Destinations',
    organizer: 'Calabanga Agriculture Office',
    description:
      'Guided local farm tour highlighting agricultural products, rural livelihood, and agri-tourism opportunities.',
  },
]
