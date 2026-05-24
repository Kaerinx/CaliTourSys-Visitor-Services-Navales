import { useState } from 'react';
import { Calendar, Plus, ChevronLeft, ChevronRight, MapPin, Users, Download, Package, Edit, Trash2, MoreVertical, Eye } from 'lucide-react';

type DevelopmentView = 'calendar' | 'event-detail' | 'create-event' | 'packages' | 'resources' | 'create-package' | 'preview-package';
type EventStatus = 'Published' | 'Draft' | 'Cancelled';

const mockEvents = [
  { id: 1, title: 'Calabanga Festival', date: '2025-01-15', type: 'Festival', participants: 45, color: 'bg-purple-500', status: 'Published' as EventStatus },
  { id: 2, title: 'Food Tourism Workshop', date: '2025-01-22', type: 'Workshop', participants: 20, color: 'bg-blue-500', status: 'Published' as EventStatus },
  { id: 3, title: 'Heritage Walk', date: '2025-02-05', type: 'Tour', participants: 15, color: 'bg-green-500', status: 'Draft' as EventStatus },
  { id: 4, title: 'OTOP Showcase', date: '2025-02-12', type: 'Exhibition', participants: 35, color: 'bg-orange-500', status: 'Published' as EventStatus },
];

export function ProductDevelopmentModule() {
  const [view, setView] = useState<DevelopmentView>('calendar');
  const [currentDate, setCurrentDate] = useState(new Date(2025, 0, 1)); // January 2025
  const [selectedEvent, setSelectedEvent] = useState(mockEvents[0]);
  const [showActionMenu, setShowActionMenu] = useState<number | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState<{ action: string; eventId: number } | null>(null);
  const [selectedPackageIndex, setSelectedPackageIndex] = useState<number | null>(null);

  const handleEventAction = (eventId: number, action: string) => {
    setShowConfirmDialog({ action, eventId });
  };

  const confirmAction = () => {
    if (showConfirmDialog) {
      console.log(`Performing ${showConfirmDialog.action} on event ${showConfirmDialog.eventId}`);
      setShowConfirmDialog(null);
      setShowActionMenu(null);
    }
  };

  if (view === 'event-detail') {
    return <EventDetail event={selectedEvent} setView={setView} />;
  }

  if (view === 'create-event') {
    return <CreateEvent setView={setView} />;
  }

  if (view === 'packages') {
    return <TourismPackages setView={setView} setSelectedPackageIndex={setSelectedPackageIndex} />;
  }

  if (view === 'resources') {
    return <ResourceLibrary setView={setView} />;
  }

  if (view === 'create-package') {
    return <CreatePackage setView={setView} packageIndex={selectedPackageIndex} />;
  }

  if (view === 'preview-package') {
    return <PreviewPackage setView={setView} packageIndex={selectedPackageIndex} />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl">Product Development</h2>
          <p className="text-sm text-slate-600">Manage events and tourism products</p>
        </div>
        <button 
          onClick={() => setView('create-event')}
          className="bg-blue-600 text-white px-4 py-3 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={20} />
          <span className="hidden md:inline">Create Event</span>
        </button>
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => setView('calendar')}
          className="bg-white border-2 border-blue-600 rounded-lg p-4 hover:bg-blue-50 transition-colors text-left"
        >
          <Calendar className="text-blue-600 mb-2" size={24} />
          <p className="text-sm">Event Calendar</p>
        </button>
        <button
          onClick={() => setView('packages')}
          className="bg-white border-2 border-slate-200 rounded-lg p-4 hover:border-blue-400 transition-colors text-left"
        >
          <Package className="text-slate-600 mb-2" size={24} />
          <p className="text-sm">Tourism Packages</p>
        </button>
        <button
          onClick={() => setView('resources')}
          className="bg-white border-2 border-slate-200 rounded-lg p-4 hover:border-blue-400 transition-colors text-left"
        >
          <Download className="text-slate-600 mb-2" size={24} />
          <p className="text-sm">Resources</p>
        </button>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <Users className="text-green-600 mb-2" size={24} />
          <p className="text-sm">115 Total</p>
          <p className="text-xs text-slate-600">Participants</p>
        </div>
      </div>

      {/* Calendar Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
              className="p-2 hover:bg-slate-100 rounded-lg"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
              className="p-2 hover:bg-slate-100 rounded-lg"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <CalendarGrid currentDate={currentDate} events={mockEvents} setView={setView} setSelectedEvent={setSelectedEvent} />
      </div>

      {/* Upcoming Events List */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h3 className="text-lg mb-4">Upcoming Events</h3>
        <div className="space-y-3">
          {mockEvents.map((event) => (
            <div key={event.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors relative">
              <div className={`w-3 h-12 ${event.color} rounded-full`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="truncate">{event.title}</p>
                  {getEventStatusBadge(event.status)}
                </div>
                <p className="text-sm text-slate-600">{new Date(event.date).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right hidden md:block">
                  <div className="flex items-center gap-1 text-sm text-slate-600">
                    <Users size={14} />
                    <span>{event.participants}</span>
                  </div>
                  <span className="text-xs text-slate-500">{event.type}</span>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setShowActionMenu(showActionMenu === event.id ? null : event.id)}
                    className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                    aria-label="Actions"
                  >
                    <MoreVertical size={18} />
                  </button>
                  {showActionMenu === event.id && (
                    <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 min-w-[160px]">
                      <button
                        onClick={() => {
                          setSelectedEvent(event);
                          setView('event-detail');
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-blue-50 text-blue-700 flex items-center gap-2 text-sm"
                      >
                        <Calendar size={16} />
                        View Details
                      </button>
                      <button
                        onClick={() => {
                          setSelectedEvent(event);
                          setView('create-event');
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-slate-50 text-slate-700 flex items-center gap-2 text-sm"
                      >
                        <Edit size={16} />
                        Edit Event
                      </button>
                      <button
                        onClick={() => handleEventAction(event.id, 'Delete')}
                        className="w-full px-4 py-2 text-left hover:bg-red-50 text-red-700 flex items-center gap-2 text-sm border-t border-slate-200"
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg">Confirm {showConfirmDialog.action}</h3>
            <p className="text-slate-600">
              Are you sure you want to {showConfirmDialog.action.toLowerCase()} this event?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmDialog(null)}
                className="flex-1 border border-slate-300 py-3 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                className={`flex-1 ${showConfirmDialog.action === 'Delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'} text-white py-3 rounded-lg`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getEventStatusBadge(status: EventStatus) {
  const badges = {
    'Published': <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">Published</span>,
    'Draft': <span className="bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded-full">Draft</span>,
    'Cancelled': <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full">Cancelled</span>,
  };
  return badges[status];
}

function CalendarGrid({ currentDate, events, setView, setSelectedEvent }: { 
  currentDate: Date, 
  events: typeof mockEvents,
  setView: (view: DevelopmentView) => void,
  setSelectedEvent: (event: typeof mockEvents[0]) => void
}) {
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const calendarDays = [];

  // Add empty cells for days before month starts
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  return (
    <div className="grid grid-cols-7 gap-1 md:gap-2">
      {/* Day headers */}
      {days.map(day => (
        <div key={day} className="text-center p-2 text-sm text-slate-600 hidden md:block">
          {day}
        </div>
      ))}
      {days.map((day, i) => (
        <div key={`mobile-${i}`} className="text-center p-2 text-xs text-slate-600 md:hidden">
          {day.charAt(0)}
        </div>
      ))}

      {/* Calendar days */}
      {calendarDays.map((day, index) => {
        if (day === null) {
          return <div key={`empty-${index}`} className="aspect-square" />;
        }

        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayEvents = events.filter(e => e.date === dateStr);
        const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();

        return (
          <button
            key={day}
            onClick={() => {
              if (dayEvents.length > 0) {
                setSelectedEvent(dayEvents[0]);
                setView('event-detail');
              }
            }}
            className={`aspect-square p-1 md:p-2 rounded-lg border transition-colors ${
              isToday ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'
            } ${dayEvents.length > 0 ? 'cursor-pointer' : ''}`}
          >
            <div className="text-xs md:text-sm mb-1">{day}</div>
            <div className="flex flex-wrap gap-0.5">
              {dayEvents.slice(0, 2).map((event) => (
                <div key={event.id} className={`w-1.5 h-1.5 md:w-2 md:h-2 ${event.color} rounded-full`} />
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function EventDetail({ event, setView }: { event: typeof mockEvents[0], setView: (view: DevelopmentView) => void }) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <button
        onClick={() => setView('calendar')}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
      >
        <ChevronLeft size={20} />
        Back to Calendar
      </button>

      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-4 h-4 bg-purple-500 rounded-full" />
            <span className="text-sm text-slate-600">Festival</span>
          </div>
          <h2 className="text-2xl md:text-3xl mb-2">Calabanga Festival 2025</h2>
          <div className="flex flex-wrap gap-4 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <Calendar size={16} />
              <span>January 15, 2025</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={16} />
              <span>Calabanga Town Plaza</span>
            </div>
            <div className="flex items-center gap-2">
              <Users size={16} />
              <span>45 Participants Registered</span>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-6">
          <h3 className="mb-3">Event Description</h3>
          <p className="text-slate-600 leading-relaxed">
            Annual celebration showcasing Calabanga's rich culture, local products, and tourism destinations. 
            Features OTOP product exhibits, cultural performances, food bazaar, and tourism information booths. 
            This year's festival aims to promote sustainable tourism and support local producers.
          </p>
        </div>

        <div className="border-t border-slate-200 pt-6">
          <h3 className="mb-3">Activities Schedule</h3>
          <div className="space-y-3">
            {[
              { time: '8:00 AM', activity: 'Opening Ceremony & Ribbon Cutting' },
              { time: '9:00 AM', activity: 'OTOP Product Exhibition Opens' },
              { time: '11:00 AM', activity: 'Cultural Dance Performance' },
              { time: '1:00 PM', activity: 'Food Tasting & Cooking Demo' },
              { time: '3:00 PM', activity: 'Local Music Performances' },
              { time: '5:00 PM', activity: 'Closing Ceremony' },
            ].map((item, index) => (
              <div key={index} className="flex gap-4 p-3 bg-slate-50 rounded-lg">
                <span className="text-sm text-blue-600 font-medium whitespace-nowrap">{item.time}</span>
                <span className="text-sm text-slate-700">{item.activity}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-200 pt-6">
          <h3 className="mb-3">Participating Stakeholders</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              'OTOP Producers Association',
              'Local Business Owners',
              'Cultural Groups',
              'Tourism Office Staff',
            ].map((stakeholder, index) => (
              <div key={index} className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                <Users size={16} className="text-slate-400" />
                <span className="text-sm">{stakeholder}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700">
            Edit Event
          </button>
          <button className="flex-1 border border-slate-300 py-3 rounded-lg hover:bg-slate-50">
            Notify Participants
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateEvent({ setView }: { setView: (view: DevelopmentView) => void }) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <button
        onClick={() => setView('calendar')}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
      >
        <ChevronLeft size={20} />
        Cancel
      </button>

      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-6">
        <h2 className="text-2xl">Create New Event</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-2 text-slate-700">Event Title</label>
            <input
              type="text"
              placeholder="e.g., Heritage Walk 2025"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-2 text-slate-700">Event Date</label>
              <input
                type="date"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm mb-2 text-slate-700">Event Type</label>
              <select className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Select type</option>
                <option>Festival</option>
                <option>Workshop</option>
                <option>Tour</option>
                <option>Exhibition</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm mb-2 text-slate-700">Venue</label>
            <input
              type="text"
              placeholder="Event location"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm mb-2 text-slate-700">Description</label>
            <textarea
              rows={4}
              placeholder="Describe the event..."
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm mb-2 text-slate-700">Expected Participants</label>
            <input
              type="number"
              placeholder="Number of participants"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t border-slate-200">
          <button
            onClick={() => setView('calendar')}
            className="flex-1 border border-slate-300 py-3 rounded-lg hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={() => setView('calendar')}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
          >
            Create Event
          </button>
        </div>
      </div>
    </div>
  );
}

function TourismPackages({ setView, setSelectedPackageIndex }: { setView: (view: DevelopmentView) => void, setSelectedPackageIndex: (index: number | null) => void }) {
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <button
        onClick={() => setView('calendar')}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
      >
        <ChevronLeft size={20} />
        Back
      </button>

      <div className="flex items-center justify-between">
        <h2 className="text-xl md:text-2xl">Tourism Packages</h2>
        <button 
          onClick={() => {
            setSelectedPackageIndex(null);
            setView('create-package');
          }}
          className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={20} />
          <span className="hidden md:inline">Build Package</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { 
            name: 'Heritage & Culture Tour', 
            spots: 'Church, Museum, Town Plaza', 
            products: '3 OTOP products', 
            businesses: '2 restaurants',
            price: '₱1,500/pax'
          },
          { 
            name: 'Nature Adventure Package', 
            spots: 'Waterfalls, Eco Park, Beach', 
            products: '2 OTOP products', 
            businesses: '1 resort',
            price: '₱2,200/pax'
          },
        ].map((pkg, index) => (
          <div key={index} className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
            <div>
              <h3 className="text-lg mb-2">{pkg.name}</h3>
              <p className="text-2xl text-green-700 mb-3">{pkg.price}</p>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <MapPin size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
                <span className="text-slate-600">{pkg.spots}</span>
              </div>
              <div className="flex items-start gap-2">
                <Package size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
                <span className="text-slate-600">{pkg.products}</span>
              </div>
              <div className="flex items-start gap-2">
                <Users size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
                <span className="text-slate-600">{pkg.businesses}</span>
              </div>
            </div>
            <div className="flex gap-2 pt-4 border-t border-slate-200">
              <button 
                onClick={() => {
                  setSelectedPackageIndex(index);
                  setView('create-package');
                }}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 text-sm flex items-center justify-center gap-2"
              >
                <Edit size={16} />
                Edit
              </button>
              <button 
                onClick={() => {
                  setSelectedPackageIndex(index);
                  setView('preview-package');
                }}
                className="flex-1 border border-slate-300 py-2 rounded-lg hover:bg-slate-50 text-sm flex items-center justify-center gap-2"
              >
                <Eye size={16} />
                Preview
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResourceLibrary({ setView }: { setView: (view: DevelopmentView) => void }) {
  const resources = [
    { category: 'Packaging Guidelines', files: 3, icon: '📦' },
    { category: 'Labeling Standards', files: 2, icon: '🏷️' },
    { category: 'Quality Standards', files: 4, icon: '✅' },
    { category: 'Marketing Materials', files: 5, icon: '📊' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <button
        onClick={() => setView('calendar')}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
      >
        <ChevronLeft size={20} />
        Back
      </button>

      <div>
        <h2 className="text-xl md:text-2xl mb-2">Resource Library</h2>
        <p className="text-slate-600">Downloadable guidelines and resources</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {resources.map((resource, index) => (
          <div key={index} className="bg-white border border-slate-200 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="text-4xl">{resource.icon}</div>
              <div className="flex-1">
                <h3 className="mb-2">{resource.category}</h3>
                <p className="text-sm text-slate-600 mb-4">{resource.files} files available</p>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm">
                  <Download size={16} />
                  Download All
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CreatePackage({ setView, packageIndex }: { setView: (view: DevelopmentView) => void, packageIndex: number | null }) {
  // Mock package data
  const packages = [
    { 
      name: 'Heritage & Culture Tour', 
      spots: 'Church, Museum, Town Plaza', 
      products: '3 OTOP products', 
      businesses: '2 restaurants',
      price: '₱1,500/pax'
    },
    { 
      name: 'Nature Adventure Package', 
      spots: 'Waterfalls, Eco Park, Beach', 
      products: '2 OTOP products', 
      businesses: '1 resort',
      price: '₱2,200/pax'
    },
  ];

  // Check if editing existing package
  const isEditMode = packageIndex !== null;
  const existingPackage = isEditMode ? packages[packageIndex] : null;

  // Form state with pre-populated values if editing
  const [formData, setFormData] = useState({
    name: existingPackage?.name || '',
    spots: existingPackage?.spots || '',
    products: existingPackage?.products || '',
    businesses: existingPackage?.businesses || '',
    price: existingPackage?.price || ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <button
        onClick={() => setView('packages')}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
      >
        <ChevronLeft size={20} />
        Cancel
      </button>

      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-6">
        {/* Dynamic title based on mode */}
        <div>
          <h2 className="text-2xl">{isEditMode ? 'Edit Package' : 'Create New Package'}</h2>
          {isEditMode && (
            <p className="text-sm text-slate-600 mt-1">Update the package information below</p>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-2 text-slate-700">Package Name</label>
            <input
              type="text"
              placeholder="e.g., Heritage & Culture Tour"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-2 text-slate-700">Tourist Spots</label>
              <input
                type="text"
                placeholder="Church, Museum, Town Plaza"
                value={formData.spots}
                onChange={(e) => handleInputChange('spots', e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm mb-2 text-slate-700">OTOP Products</label>
              <input
                type="text"
                placeholder="3 OTOP products"
                value={formData.products}
                onChange={(e) => handleInputChange('products', e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-2 text-slate-700">Accredited Businesses</label>
            <input
              type="text"
              placeholder="2 restaurants"
              value={formData.businesses}
              onChange={(e) => handleInputChange('businesses', e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm mb-2 text-slate-700">Price per Person</label>
            <input
              type="text"
              placeholder="₱1,500/pax"
              value={formData.price}
              onChange={(e) => handleInputChange('price', e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Info banner for edit mode */}
        {isEditMode && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <div className="text-blue-600 mt-0.5">ℹ️</div>
            <div className="flex-1 text-sm text-blue-800">
              <p className="mb-1">You are editing an existing package.</p>
              <p className="text-xs text-blue-600">All changes will be saved when you click "Update Package".</p>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-4 border-t border-slate-200">
          <button
            onClick={() => setView('packages')}
            className="flex-1 border border-slate-300 py-3 rounded-lg hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              console.log(isEditMode ? 'Updating package...' : 'Creating package...', formData);
              setView('packages');
            }}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
          >
            {isEditMode ? 'Update Package' : 'Create Package'}
          </button>
        </div>
      </div>
    </div>
  );
}

function PreviewPackage({ setView, packageIndex }: { setView: (view: DevelopmentView) => void, packageIndex: number | null }) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <button
        onClick={() => setView('packages')}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
      >
        <ChevronLeft size={20} />
        Back
      </button>

      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-4 h-4 bg-purple-500 rounded-full" />
            <span className="text-sm text-slate-600">Festival</span>
          </div>
          <h2 className="text-2xl md:text-3xl mb-2">Calabanga Festival 2025</h2>
          <div className="flex flex-wrap gap-4 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <Calendar size={16} />
              <span>January 15, 2025</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={16} />
              <span>Calabanga Town Plaza</span>
            </div>
            <div className="flex items-center gap-2">
              <Users size={16} />
              <span>45 Participants Registered</span>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-6">
          <h3 className="mb-3">Event Description</h3>
          <p className="text-slate-600 leading-relaxed">
            Annual celebration showcasing Calabanga's rich culture, local products, and tourism destinations. 
            Features OTOP product exhibits, cultural performances, food bazaar, and tourism information booths. 
            This year's festival aims to promote sustainable tourism and support local producers.
          </p>
        </div>

        <div className="border-t border-slate-200 pt-6">
          <h3 className="mb-3">Activities Schedule</h3>
          <div className="space-y-3">
            {[
              { time: '8:00 AM', activity: 'Opening Ceremony & Ribbon Cutting' },
              { time: '9:00 AM', activity: 'OTOP Product Exhibition Opens' },
              { time: '11:00 AM', activity: 'Cultural Dance Performance' },
              { time: '1:00 PM', activity: 'Food Tasting & Cooking Demo' },
              { time: '3:00 PM', activity: 'Local Music Performances' },
              { time: '5:00 PM', activity: 'Closing Ceremony' },
            ].map((item, index) => (
              <div key={index} className="flex gap-4 p-3 bg-slate-50 rounded-lg">
                <span className="text-sm text-blue-600 font-medium whitespace-nowrap">{item.time}</span>
                <span className="text-sm text-slate-700">{item.activity}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-200 pt-6">
          <h3 className="mb-3">Participating Stakeholders</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              'OTOP Producers Association',
              'Local Business Owners',
              'Cultural Groups',
              'Tourism Office Staff',
            ].map((stakeholder, index) => (
              <div key={index} className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                <Users size={16} className="text-slate-400" />
                <span className="text-sm">{stakeholder}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700">
            Edit Event
          </button>
          <button className="flex-1 border border-slate-300 py-3 rounded-lg hover:bg-slate-50">
            Notify Participants
          </button>
        </div>
      </div>
    </div>
  );
}