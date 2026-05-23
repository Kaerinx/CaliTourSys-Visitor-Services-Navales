import aboutCoverCalabanga from '../assets/images/tourism/about-cover-calabanga.jpg.png'
import busayFalls from '../assets/images/tourism/destination-busay-falls.jpg.png'
import haciendaCalabangaResort from '../assets/images/tourism/destination-hacienda-calabanga-resort.jpg.png'
import leCoolaResort from '../assets/images/tourism/destination-le-coola-resort.jpg.png'
import destinationsCoverCalabanga from '../assets/images/tourism/destinations-cover-calabanga.jpg.png'
import eventsCoverCalabanga from '../assets/images/tourism/events-cover-calabanga.jpg.jpg'
import homeHeroCalabanga from '../assets/images/tourism/home-hero-calabanga.jpg.png'

export const tourismImages = {
  aboutCover: aboutCoverCalabanga,
  destinationsCover: destinationsCoverCalabanga,
  eventsCover: eventsCoverCalabanga,
  homeHero: homeHeroCalabanga,
  destinations: {
    'le-coola-resort': leCoolaResort,
    'hacienda-calabanga-resort': haciendaCalabangaResort,
    'busay-falls': busayFalls,
  },
}

export function getDestinationImage(slug) {
  return tourismImages.destinations[slug] || tourismImages.destinationsCover
}
