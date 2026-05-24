import { useState } from 'react';
import { MapPin, Clock, DollarSign, Phone, Mail, Star, ChevronLeft, Send } from 'lucide-react';

type VisitorView = 'front-desk' | 'spots' | 'spot-detail' | 'inquiry';

const touristSpots = [
  { id: 1, name: 'Calabanga Church', category: 'Historical', fee: 'Free', hours: '6:00 AM - 6:00 PM', rating: 4.8 },
  { id: 2, name: 'Malabog Falls', category: 'Nature', fee: '₱50', hours: '7:00 AM - 5:00 PM', rating: 4.7 },
  { id: 3, name: 'Calabanga Museum', category: 'Historical', fee: '₱20', hours: '9:00 AM - 5:00 PM', rating: 4.5 },
  { id: 4, name: 'Eco Park', category: 'Nature', fee: '₱30', hours: '6:00 AM - 6:00 PM', rating: 4.6 },
  { id: 5, name: 'Public Beach', category: 'Beach', fee: 'Free', hours: 'Open 24/7', rating: 4.4 },
  { id: 6, name: 'Heritage House', category: 'Historical', fee: '₱25', hours: '10:00 AM - 4:00 PM', rating: 4.9 },
];

export function VisitorServicesModule() {
  const [view, setView] = useState<VisitorView>('front-desk');
  const [selectedSpot, setSelectedSpot] = useState(touristSpots[0]);

  if (view === 'spots') {
    return <TouristSpotsGuide setView={setView} setSelectedSpot={setSelectedSpot} />;
  }

  if (view === 'spot-detail') {
    return <SpotDetail spot={selectedSpot} setView={setView} />;
  }

  if (view === 'inquiry') {
    return <InquiryForm setView={setView} />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl md:text-2xl mb-2">Front Desk Dashboard</h2>
        <p className="text-sm text-slate-600">Quick access for visitor assistance</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => setView('spots')}
          className="bg-blue-600 text-white rounded-lg p-6 hover:bg-blue-700 transition-colors text-left"
        >
          <MapPin size={24} className="mb-2" />
          <p>Tourist Spots</p>
        </button>
        <button
          onClick={() => setView('inquiry')}
          className="bg-green-600 text-white rounded-lg p-6 hover:bg-green-700 transition-colors text-left"
        >
          <Mail size={24} className="mb-2" />
          <p>New Inquiry</p>
        </button>
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <Clock size={24} className="text-slate-600 mb-2" />
          <p className="text-sm">Office Hours</p>
          <p className="text-xs text-slate-600">8AM - 5PM</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <Phone size={24} className="text-slate-600 mb-2" />
          <p className="text-sm">Hotline</p>
          <p className="text-xs text-slate-600">(054) 123-4567</p>
        </div>
      </div>

      {/* Entrance Fees Quick Reference */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h3 className="text-lg mb-4">Entrance Fees Quick Reference</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {touristSpots.map((spot) => (
            <div key={spot.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{spot.name}</p>
                <p className="text-xs text-slate-600">{spot.category}</p>
              </div>
              <span className="text-sm font-medium text-green-700 whitespace-nowrap ml-2">{spot.fee}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Operating Hours */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h3 className="text-lg mb-4">Operating Hours</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {touristSpots.slice(0, 4).map((spot) => (
            <div key={spot.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
              <Clock size={16} className="text-slate-400 mt-1 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm mb-1">{spot.name}</p>
                <p className="text-xs text-slate-600">{spot.hours}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Quick Answers */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h3 className="text-lg mb-4">Frequently Asked Questions</h3>
        <div className="space-y-3">
          {[
            { q: 'What are the must-visit spots in Calabanga?', a: 'Calabanga Church, Malabog Falls, and Heritage House are our top recommendations.' },
            { q: 'Are there tour guides available?', a: 'Yes, local tour guides can be arranged. Please inquire at the Tourism Office.' },
            { q: 'Where can I buy OTOP products?', a: 'OTOP products are available at the Public Market and during special events.' },
            { q: 'What is the best time to visit?', a: 'December to February offers the best weather. Visit during festivals for cultural experiences.' },
          ].map((faq, index) => (
            <details key={index} className="group">
              <summary className="p-4 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors list-none flex items-center justify-between">
                <span className="text-sm">{faq.q}</span>
                <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="p-4 text-sm text-slate-600 border-l-2 border-blue-600 ml-4 mt-2">
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}

function TouristSpotsGuide({ setView, setSelectedSpot }: { 
  setView: (view: VisitorView) => void,
  setSelectedSpot: (spot: typeof touristSpots[0]) => void 
}) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const categories = ['All', 'Historical', 'Nature', 'Beach'];

  const filteredSpots = selectedCategory === 'All' 
    ? touristSpots 
    : touristSpots.filter(s => s.category === selectedCategory);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <button
        onClick={() => setView('front-desk')}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
      >
        <ChevronLeft size={20} />
        Back to Front Desk
      </button>

      <div>
        <h2 className="text-xl md:text-2xl mb-2">Tourist Spots Guide</h2>
        <p className="text-sm text-slate-600">Explore Calabanga's destinations</p>
      </div>

      {/* Category Filter */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
              selectedCategory === category
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-slate-300 text-slate-700 hover:border-blue-400'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Spots Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSpots.map((spot) => (
          <button
            key={spot.id}
            onClick={() => {
              setSelectedSpot(spot);
              setView('spot-detail');
            }}
            className="bg-white border border-slate-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow text-left"
          >
            <div className="aspect-video bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center text-5xl">
              {getCategoryEmoji(spot.category)}
            </div>
            <div className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h3 className="leading-tight">{spot.name}</h3>
                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full whitespace-nowrap">
                  {spot.category}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Star size={14} className="fill-yellow-400 text-yellow-400" />
                <span>{spot.rating}</span>
              </div>
              <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1 text-slate-600">
                  <DollarSign size={14} />
                  <span>{spot.fee}</span>
                </div>
                <div className="flex items-center gap-1 text-slate-600">
                  <Clock size={14} />
                  <span className="text-xs">{spot.hours.split(' ')[0]}</span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function SpotDetail({ spot, setView }: { spot: typeof touristSpots[0], setView: (view: VisitorView) => void }) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <button
        onClick={() => setView('spots')}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
      >
        <ChevronLeft size={20} />
        Back to Guide
      </button>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="aspect-video bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center text-9xl">
          {getCategoryEmoji(spot.category)}
        </div>

        <div className="p-6 space-y-6">
          <div>
            <div className="flex items-start justify-between gap-4 mb-3">
              <h2 className="text-2xl md:text-3xl">{spot.name}</h2>
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm whitespace-nowrap">
                {spot.category}
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Star size={16} className="fill-yellow-400 text-yellow-400" />
              <span>{spot.rating} rating</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-slate-600 mb-2">
                <DollarSign size={20} />
                <span className="text-sm">Entrance Fee</span>
              </div>
              <p className="text-xl text-green-700">{spot.fee}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-slate-600 mb-2">
                <Clock size={20} />
                <span className="text-sm">Operating Hours</span>
              </div>
              <p className="text-lg">{spot.hours}</p>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6">
            <h3 className="mb-3">About This Place</h3>
            <p className="text-slate-600 leading-relaxed mb-4">
              {spot.name} is one of Calabanga's premier {spot.category.toLowerCase()} attractions. 
              Known for its {spot.category === 'Historical' ? 'rich heritage and cultural significance' : 
                          spot.category === 'Nature' ? 'natural beauty and scenic views' : 
                          'pristine waters and relaxing atmosphere'}, this destination offers visitors 
              an authentic experience of local culture and hospitality.
            </p>
            <p className="text-slate-600 leading-relaxed">
              Perfect for families, solo travelers, and groups looking to explore the beauty and culture of Calabanga. 
              The site is well-maintained and accessible year-round.
            </p>
          </div>

          <div className="border-t border-slate-200 pt-6">
            <h3 className="mb-3">How to Get There</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <MapPin className="text-blue-600 flex-shrink-0 mt-1" size={20} />
                <div className="space-y-2 text-sm text-blue-900">
                  <p>📍 From Calabanga Town Center: 15-minute drive</p>
                  <p>🚌 Public transport available: Jeepney route via Barangay Road</p>
                  <p>🅿️ Parking available on-site</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6">
            <h3 className="mb-3">Visitor Tips</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>Best to visit early morning or late afternoon</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>Bring sun protection and comfortable walking shoes</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>Photography is allowed, please be respectful</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>Local guides available for hire at the entrance</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function InquiryForm({ setView }: { setView: (view: VisitorView) => void }) {
  const [rating, setRating] = useState(0);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <button
        onClick={() => setView('front-desk')}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
      >
        <ChevronLeft size={20} />
        Back
      </button>

      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-6">
        <div>
          <h2 className="text-2xl mb-2">Visitor Inquiry & Feedback</h2>
          <p className="text-slate-600">We'd love to hear from you</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-2 text-slate-700">Your Name</label>
            <input
              type="text"
              placeholder="Enter your name"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-2 text-slate-700">Email</label>
              <input
                type="email"
                placeholder="your@email.com"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm mb-2 text-slate-700">Visit Date</label>
              <input
                type="date"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-2 text-slate-700">Inquiry Type</label>
            <select className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>Select inquiry type</option>
              <option>Tourist Spot Information</option>
              <option>Event Schedule</option>
              <option>OTOP Products</option>
              <option>Accommodation</option>
              <option>General Feedback</option>
            </select>
          </div>

          <div>
            <label className="block text-sm mb-2 text-slate-700">Your Message</label>
            <textarea
              rows={5}
              placeholder="How can we help you?"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm mb-3 text-slate-700">Rate Your Experience (Optional)</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="focus:outline-none"
                >
                  <Star
                    size={32}
                    className={star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={() => setView('front-desk')}
          className="w-full bg-blue-600 text-white py-4 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
        >
          <Send size={20} />
          Submit Inquiry
        </button>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm text-slate-600">
          <p>📞 Need immediate assistance? Call our hotline: <span className="text-blue-600">(054) 123-4567</span></p>
          <p className="mt-2">⏰ Office Hours: Monday - Friday, 8:00 AM - 5:00 PM</p>
        </div>
      </div>
    </div>
  );
}

function getCategoryEmoji(category: string): string {
  const emojiMap: Record<string, string> = {
    Historical: '⛪',
    Nature: '🏞️',
    Beach: '🏖️',
  };
  return emojiMap[category] || '📍';
}
