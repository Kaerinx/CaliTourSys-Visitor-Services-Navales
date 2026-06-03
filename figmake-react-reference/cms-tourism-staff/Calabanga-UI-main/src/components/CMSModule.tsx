import { useState } from 'react';
import { ChevronLeft, Plus, Edit, Trash2, Eye, EyeOff, Save, X, FileText, Image as ImageIcon, Calendar, Globe, Landmark, MapPin, Bell } from 'lucide-react';

type CMSView = 'dashboard' | 'cultural-list' | 'cultural-edit' | 'museum-list' | 'museum-edit' | 'spot-list' | 'spot-edit' | 'announcement-list' | 'announcement-edit';
type ContentStatus = 'Published' | 'Draft';

interface CulturalContent {
  id: number;
  title: string;
  category: 'Tradition' | 'History' | 'Narrative';
  excerpt: string;
  content: string;
  status: ContentStatus;
  lastUpdated: string;
  image?: string;
}

interface Museum {
  id: number;
  name: string;
  description: string;
  exhibits: string;
  hours: string;
  entrance: string;
  location: string;
  status: ContentStatus;
  lastUpdated: string;
  image?: string;
}

interface TouristSpot {
  id: number;
  name: string;
  description: string;
  category: string;
  hours: string;
  entrance: string;
  location: string;
  status: ContentStatus;
  lastUpdated: string;
  image?: string;
}

interface Announcement {
  id: number;
  title: string;
  content: string;
  type: 'News' | 'Event' | 'Featured';
  status: ContentStatus;
  publishDate: string;
  lastUpdated: string;
  image?: string;
}

const mockCulturalContent: CulturalContent[] = [
  { id: 1, title: 'Calabanga Church History', category: 'History', excerpt: 'Historical significance of San Nicolas de Tolentino Parish', content: 'Full content...', status: 'Published', lastUpdated: '2024-12-01' },
  { id: 2, title: 'Traditional Festivals', category: 'Tradition', excerpt: 'Annual celebrations and cultural events', content: 'Full content...', status: 'Published', lastUpdated: '2024-11-28' },
  { id: 3, title: 'Founding Story', category: 'Narrative', excerpt: 'The origin of Calabanga municipality', content: 'Full content...', status: 'Draft', lastUpdated: '2024-11-25' },
];

const mockMuseums: Museum[] = [
  { id: 1, name: 'Calabanga Heritage Museum', description: 'Local history and artifacts', exhibits: 'Colonial era items, traditional tools', hours: '9:00 AM - 5:00 PM', entrance: 'Free', location: 'Town Plaza', status: 'Published', lastUpdated: '2024-12-01' },
  { id: 2, name: 'Cultural Center', description: 'Arts and cultural exhibits', exhibits: 'Local artwork, textiles', hours: '8:00 AM - 6:00 PM', entrance: '₱50', location: 'Municipal Hall', status: 'Published', lastUpdated: '2024-11-30' },
];

const mockTouristSpots: TouristSpot[] = [
  { id: 1, name: 'San Nicolas de Tolentino Church', description: 'Historic Spanish-era church', category: 'Historical', hours: '6:00 AM - 7:00 PM', entrance: 'Free', location: 'Town Center', status: 'Published', lastUpdated: '2024-12-01' },
  { id: 2, name: 'Malabog Falls', description: 'Natural waterfall and swimming area', category: 'Nature', hours: '7:00 AM - 5:00 PM', entrance: '₱20', location: 'Brgy. Malabog', status: 'Published', lastUpdated: '2024-11-29' },
  { id: 3, name: 'Heritage House', description: 'Preserved ancestral home', category: 'Historical', hours: 'By appointment', entrance: '₱100', location: 'Poblacion', status: 'Draft', lastUpdated: '2024-11-27' },
];

const mockAnnouncements: Announcement[] = [
  { id: 1, title: 'Calabanga Festival 2025', content: 'Annual festival schedule announced', type: 'Event', status: 'Published', publishDate: '2024-12-15', lastUpdated: '2024-12-01' },
  { id: 2, title: 'New Tourist Information Center', content: 'Opening of new visitor center', type: 'News', status: 'Published', publishDate: '2024-12-10', lastUpdated: '2024-12-01' },
  { id: 3, title: 'Featured: OTOP Products', content: 'Spotlight on local crafts', type: 'Featured', status: 'Draft', publishDate: '2024-12-20', lastUpdated: '2024-11-30' },
];

export function CMSModule() {
  const [view, setView] = useState<CMSView>('dashboard');
  const [selectedCultural, setSelectedCultural] = useState<CulturalContent | null>(null);
  const [selectedMuseum, setSelectedMuseum] = useState<Museum | null>(null);
  const [selectedSpot, setSelectedSpot] = useState<TouristSpot | null>(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  if (view === 'cultural-list') {
    return <CulturalContentList setView={setView} setSelected={setSelectedCultural} />;
  }

  if (view === 'cultural-edit') {
    return <CulturalContentEditor content={selectedCultural} setView={setView} />;
  }

  if (view === 'museum-list') {
    return <MuseumList setView={setView} setSelected={setSelectedMuseum} />;
  }

  if (view === 'museum-edit') {
    return <MuseumEditor museum={selectedMuseum} setView={setView} />;
  }

  if (view === 'spot-list') {
    return <TouristSpotList setView={setView} setSelected={setSelectedSpot} />;
  }

  if (view === 'spot-edit') {
    return <TouristSpotEditor spot={selectedSpot} setView={setView} />;
  }

  if (view === 'announcement-list') {
    return <AnnouncementList setView={setView} setSelected={setSelectedAnnouncement} />;
  }

  if (view === 'announcement-edit') {
    return <AnnouncementEditor announcement={selectedAnnouncement} setView={setView} />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl md:text-2xl">Content Management System</h2>
        <p className="text-sm text-slate-600">Manage all public-facing website content</p>
      </div>

      {/* CMS Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Cultural & Heritage Content */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText size={24} className="text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg mb-2">Cultural & Heritage Content</h3>
              <p className="text-sm text-slate-600 mb-4">
                Manage local traditions, history, and cultural narratives
              </p>
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-slate-600">
                  <span className="font-medium text-slate-900">{mockCulturalContent.length}</span> articles
                </div>
                <div className="flex gap-2 text-xs">
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full">
                    {mockCulturalContent.filter(c => c.status === 'Published').length} Published
                  </span>
                  <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-full">
                    {mockCulturalContent.filter(c => c.status === 'Draft').length} Draft
                  </span>
                </div>
              </div>
              <button
                onClick={() => setView('cultural-list')}
                className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Manage Content
              </button>
            </div>
          </div>
        </div>

        {/* Museums & Landmarks */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Landmark size={24} className="text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg mb-2">Museums & Landmarks</h3>
              <p className="text-sm text-slate-600 mb-4">
                Museum details, exhibits, and visiting information
              </p>
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-slate-600">
                  <span className="font-medium text-slate-900">{mockMuseums.length}</span> museums
                </div>
                <div className="flex gap-2 text-xs">
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full">
                    {mockMuseums.filter(m => m.status === 'Published').length} Published
                  </span>
                </div>
              </div>
              <button
                onClick={() => setView('museum-list')}
                className="w-full bg-amber-600 text-white py-2 rounded-lg hover:bg-amber-700 transition-colors"
              >
                Manage Museums
              </button>
            </div>
          </div>
        </div>

        {/* Tourist Spots Information */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <MapPin size={24} className="text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg mb-2">Tourist Spots Information</h3>
              <p className="text-sm text-slate-600 mb-4">
                Descriptions, fees, and opening hours for tourist destinations
              </p>
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-slate-600">
                  <span className="font-medium text-slate-900">{mockTouristSpots.length}</span> spots
                </div>
                <div className="flex gap-2 text-xs">
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full">
                    {mockTouristSpots.filter(s => s.status === 'Published').length} Published
                  </span>
                  <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-full">
                    {mockTouristSpots.filter(s => s.status === 'Draft').length} Draft
                  </span>
                </div>
              </div>
              <button
                onClick={() => setView('spot-list')}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Manage Tourist Spots
              </button>
            </div>
          </div>
        </div>

        {/* Announcements & Highlights */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Bell size={24} className="text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg mb-2">Announcements & Highlights</h3>
              <p className="text-sm text-slate-600 mb-4">
                News, featured content, and important announcements
              </p>
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-slate-600">
                  <span className="font-medium text-slate-900">{mockAnnouncements.length}</span> posts
                </div>
                <div className="flex gap-2 text-xs">
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full">
                    {mockAnnouncements.filter(a => a.status === 'Published').length} Published
                  </span>
                  <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-full">
                    {mockAnnouncements.filter(a => a.status === 'Draft').length} Draft
                  </span>
                </div>
              </div>
              <button
                onClick={() => setView('announcement-list')}
                className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Manage Announcements
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200 rounded-lg p-6">
        <h3 className="text-lg mb-4">Content Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl text-sky-700 mb-1">
              {mockCulturalContent.length + mockMuseums.length + mockTouristSpots.length + mockAnnouncements.length}
            </p>
            <p className="text-sm text-slate-600">Total Content Items</p>
          </div>
          <div className="text-center">
            <p className="text-2xl text-green-700 mb-1">
              {mockCulturalContent.filter(c => c.status === 'Published').length +
               mockMuseums.filter(m => m.status === 'Published').length +
               mockTouristSpots.filter(s => s.status === 'Published').length +
               mockAnnouncements.filter(a => a.status === 'Published').length}
            </p>
            <p className="text-sm text-slate-600">Published</p>
          </div>
          <div className="text-center">
            <p className="text-2xl text-slate-700 mb-1">
              {mockCulturalContent.filter(c => c.status === 'Draft').length +
               mockTouristSpots.filter(s => s.status === 'Draft').length +
               mockAnnouncements.filter(a => a.status === 'Draft').length}
            </p>
            <p className="text-sm text-slate-600">Drafts</p>
          </div>
          <div className="text-center">
            <p className="text-2xl text-purple-700 mb-1">
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </p>
            <p className="text-sm text-slate-600">Last Update</p>
          </div>
        </div>
      </div>

      {/* Info Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Globe size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Officer Content Management</p>
            <p>All changes made here will be reflected on the public-facing tourism website. Ensure accuracy before publishing content.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Cultural Content List Component
function CulturalContentList({ setView, setSelected }: { setView: (view: CMSView) => void, setSelected: (content: CulturalContent | null) => void }) {
  const [contents] = useState(mockCulturalContent);
  const [filter, setFilter] = useState<string>('All');

  const filteredContents = contents.filter(c => filter === 'All' || c.category === filter);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <button
        onClick={() => setView('dashboard')}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
      >
        <ChevronLeft size={20} />
        Back to CMS Dashboard
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl">Cultural & Heritage Content</h2>
          <p className="text-sm text-slate-600">Manage traditions, history, and cultural narratives</p>
        </div>
        <button
          onClick={() => {
            setSelected(null);
            setView('cultural-edit');
          }}
          className="bg-purple-600 text-white px-4 py-3 rounded-lg flex items-center gap-2 hover:bg-purple-700 transition-colors"
        >
          <Plus size={20} />
          <span className="hidden md:inline">Add Content</span>
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {['All', 'Tradition', 'History', 'Narrative'].map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === cat 
                ? 'bg-purple-600 text-white' 
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-purple-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Content Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Title</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Category</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Last Updated</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredContents.map(content => (
                <tr key={content.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium">{content.title}</p>
                    <p className="text-sm text-slate-600">{content.excerpt}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full">
                      {content.category}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {content.status === 'Published' ? (
                      <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full flex items-center gap-1 w-fit">
                        <Eye size={12} /> Published
                      </span>
                    ) : (
                      <span className="bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded-full flex items-center gap-1 w-fit">
                        <EyeOff size={12} /> Draft
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {new Date(content.lastUpdated).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelected(content);
                          setView('cultural-edit');
                        }}
                        className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit size={18} className="text-blue-600" />
                      </button>
                      <button
                        onClick={() => console.log('Delete', content.id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={18} className="text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Cultural Content Editor Component
function CulturalContentEditor({ content, setView }: { content: CulturalContent | null, setView: (view: CMSView) => void }) {
  const [formData, setFormData] = useState({
    title: content?.title || '',
    category: content?.category || 'Tradition',
    excerpt: content?.excerpt || '',
    content: content?.content || '',
    status: content?.status || 'Draft' as ContentStatus,
  });

  const handleSave = () => {
    console.log('Officer Action: Saving cultural content', formData);
    setView('cultural-list');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <button
        onClick={() => setView('cultural-list')}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
      >
        <ChevronLeft size={20} />
        Back to Content List
      </button>

      <div className="flex items-center justify-between">
        <h2 className="text-2xl">{content ? 'Edit' : 'Add'} Cultural Content</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setView('cultural-list')}
            className="border border-slate-300 px-4 py-2 rounded-lg hover:bg-slate-50 flex items-center gap-2"
          >
            <X size={18} />
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2"
          >
            <Save size={18} />
            Save Content
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-6">
        <div>
          <label className="block text-sm mb-2 text-slate-700">Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., Calabanga Church History"
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-2 text-slate-700">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="Tradition">Tradition</option>
              <option value="History">History</option>
              <option value="Narrative">Narrative</option>
            </select>
          </div>

          <div>
            <label className="block text-sm mb-2 text-slate-700">Publication Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as ContentStatus })}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="Draft">Draft</option>
              <option value="Published">Published</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm mb-2 text-slate-700">Excerpt (Short Description)</label>
          <textarea
            value={formData.excerpt}
            onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
            placeholder="Brief summary (2-3 sentences)"
            rows={3}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div>
          <label className="block text-sm mb-2 text-slate-700">Full Content</label>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            placeholder="Write the full article content here..."
            rows={12}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div>
          <label className="block text-sm mb-2 text-slate-700">Featured Image</label>
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors cursor-pointer">
            <ImageIcon size={48} className="mx-auto text-slate-400 mb-2" />
            <p className="text-sm text-slate-600 mb-1">Click to upload image</p>
            <p className="text-xs text-slate-500">PNG, JPG up to 5MB</p>
          </div>
        </div>

        <div className="bg-sky-50 border border-sky-200 rounded-lg p-4 text-sm text-sky-800">
          <p>💡 <strong>Tip:</strong> Content marked as "Published" will immediately appear on the public tourism website.</p>
        </div>
      </div>
    </div>
  );
}

// Similar components for Museums, Tourist Spots, and Announcements
function MuseumList({ setView, setSelected }: { setView: (view: CMSView) => void, setSelected: (museum: Museum | null) => void }) {
  const [museums] = useState(mockMuseums);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <button
        onClick={() => setView('dashboard')}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
      >
        <ChevronLeft size={20} />
        Back to CMS Dashboard
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl">Museums & Landmarks</h2>
          <p className="text-sm text-slate-600">Manage museum details and visiting information</p>
        </div>
        <button
          onClick={() => {
            setSelected(null);
            setView('museum-edit');
          }}
          className="bg-amber-600 text-white px-4 py-3 rounded-lg flex items-center gap-2 hover:bg-amber-700 transition-colors"
        >
          <Plus size={20} />
          <span className="hidden md:inline">Add Museum</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {museums.map(museum => (
          <div key={museum.id} className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-lg font-medium">{museum.name}</h3>
              {museum.status === 'Published' ? (
                <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                  Published
                </span>
              ) : (
                <span className="bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded-full">
                  Draft
                </span>
              )}
            </div>
            <p className="text-sm text-slate-600 mb-4">{museum.description}</p>
            <div className="space-y-2 text-sm text-slate-600 mb-4">
              <p><strong>Hours:</strong> {museum.hours}</p>
              <p><strong>Entrance:</strong> {museum.entrance}</p>
              <p><strong>Location:</strong> {museum.location}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelected(museum);
                  setView('museum-edit');
                }}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Edit size={16} />
                Edit
              </button>
              <button
                onClick={() => console.log('Delete', museum.id)}
                className="p-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MuseumEditor({ museum, setView }: { museum: Museum | null, setView: (view: CMSView) => void }) {
  const [formData, setFormData] = useState({
    name: museum?.name || '',
    description: museum?.description || '',
    exhibits: museum?.exhibits || '',
    hours: museum?.hours || '',
    entrance: museum?.entrance || '',
    location: museum?.location || '',
    status: museum?.status || 'Draft' as ContentStatus,
  });

  const handleSave = () => {
    console.log('Officer Action: Saving museum', formData);
    setView('museum-list');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <button
        onClick={() => setView('museum-list')}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
      >
        <ChevronLeft size={20} />
        Back to Museums
      </button>

      <div className="flex items-center justify-between">
        <h2 className="text-2xl">{museum ? 'Edit' : 'Add'} Museum</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setView('museum-list')}
            className="border border-slate-300 px-4 py-2 rounded-lg hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 flex items-center gap-2"
          >
            <Save size={18} />
            Save Museum
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
        <div>
          <label className="block text-sm mb-2 text-slate-700">Museum Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div>
          <label className="block text-sm mb-2 text-slate-700">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div>
          <label className="block text-sm mb-2 text-slate-700">Exhibits</label>
          <textarea
            value={formData.exhibits}
            onChange={(e) => setFormData({ ...formData, exhibits: e.target.value })}
            rows={3}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm mb-2 text-slate-700">Opening Hours</label>
            <input
              type="text"
              value={formData.hours}
              onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
              placeholder="9:00 AM - 5:00 PM"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-sm mb-2 text-slate-700">Entrance Fee</label>
            <input
              type="text"
              value={formData.entrance}
              onChange={(e) => setFormData({ ...formData, entrance: e.target.value })}
              placeholder="Free or ₱50"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-sm mb-2 text-slate-700">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as ContentStatus })}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="Draft">Draft</option>
              <option value="Published">Published</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm mb-2 text-slate-700">Location</label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div>
          <label className="block text-sm mb-2 text-slate-700">Images</label>
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-amber-400 transition-colors cursor-pointer">
            <ImageIcon size={48} className="mx-auto text-slate-400 mb-2" />
            <p className="text-sm text-slate-600">Upload museum photos</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function TouristSpotList({ setView, setSelected }: { setView: (view: CMSView) => void, setSelected: (spot: TouristSpot | null) => void }) {
  const [spots] = useState(mockTouristSpots);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <button
        onClick={() => setView('dashboard')}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
      >
        <ChevronLeft size={20} />
        Back to CMS Dashboard
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl">Tourist Spots Information</h2>
          <p className="text-sm text-slate-600">Manage tourist destinations and visiting details</p>
        </div>
        <button
          onClick={() => {
            setSelected(null);
            setView('spot-edit');
          }}
          className="bg-blue-600 text-white px-4 py-3 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          <span className="hidden md:inline">Add Tourist Spot</span>
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Category</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Entrance Fee</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {spots.map(spot => (
                <tr key={spot.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium">{spot.name}</p>
                    <p className="text-sm text-slate-600">{spot.location}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                      {spot.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{spot.entrance}</td>
                  <td className="px-4 py-3">
                    {spot.status === 'Published' ? (
                      <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">Published</span>
                    ) : (
                      <span className="bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded-full">Draft</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelected(spot);
                          setView('spot-edit');
                        }}
                        className="p-2 hover:bg-blue-50 rounded-lg"
                      >
                        <Edit size={18} className="text-blue-600" />
                      </button>
                      <button
                        onClick={() => console.log('Delete', spot.id)}
                        className="p-2 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={18} className="text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function TouristSpotEditor({ spot, setView }: { spot: TouristSpot | null, setView: (view: CMSView) => void }) {
  const [formData, setFormData] = useState({
    name: spot?.name || '',
    description: spot?.description || '',
    category: spot?.category || '',
    hours: spot?.hours || '',
    entrance: spot?.entrance || '',
    location: spot?.location || '',
    status: spot?.status || 'Draft' as ContentStatus,
  });

  const handleSave = () => {
    console.log('Officer Action: Saving tourist spot', formData);
    setView('spot-list');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <button
        onClick={() => setView('spot-list')}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
      >
        <ChevronLeft size={20} />
        Back to Tourist Spots
      </button>

      <div className="flex items-center justify-between">
        <h2 className="text-2xl">{spot ? 'Edit' : 'Add'} Tourist Spot</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setView('spot-list')}
            className="border border-slate-300 px-4 py-2 rounded-lg hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Save size={18} />
            Save Spot
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
        <div>
          <label className="block text-sm mb-2 text-slate-700">Spot Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm mb-2 text-slate-700">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-2 text-slate-700">Category</label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="e.g., Historical, Nature"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm mb-2 text-slate-700">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as ContentStatus })}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Draft">Draft</option>
              <option value="Published">Published</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-2 text-slate-700">Opening Hours</label>
            <input
              type="text"
              value={formData.hours}
              onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
              placeholder="7:00 AM - 5:00 PM"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm mb-2 text-slate-700">Entrance Fee</label>
            <input
              type="text"
              value={formData.entrance}
              onChange={(e) => setFormData({ ...formData, entrance: e.target.value })}
              placeholder="Free or ₱20"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm mb-2 text-slate-700">Location</label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="e.g., Brgy. Malabog"
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm mb-2 text-slate-700">Images</label>
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer">
            <ImageIcon size={48} className="mx-auto text-slate-400 mb-2" />
            <p className="text-sm text-slate-600">Upload spot photos</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AnnouncementList({ setView, setSelected }: { setView: (view: CMSView) => void, setSelected: (announcement: Announcement | null) => void }) {
  const [announcements] = useState(mockAnnouncements);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <button
        onClick={() => setView('dashboard')}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
      >
        <ChevronLeft size={20} />
        Back to CMS Dashboard
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl">Announcements & Highlights</h2>
          <p className="text-sm text-slate-600">Manage news and featured content</p>
        </div>
        <button
          onClick={() => {
            setSelected(null);
            setView('announcement-edit');
          }}
          className="bg-green-600 text-white px-4 py-3 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors"
        >
          <Plus size={20} />
          <span className="hidden md:inline">Add Announcement</span>
        </button>
      </div>

      <div className="space-y-4">
        {announcements.map(announcement => (
          <div key={announcement.id} className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-medium">{announcement.title}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    announcement.type === 'News' ? 'bg-blue-100 text-blue-700' :
                    announcement.type === 'Event' ? 'bg-purple-100 text-purple-700' :
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {announcement.type}
                  </span>
                  {announcement.status === 'Published' ? (
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">Published</span>
                  ) : (
                    <span className="bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded-full">Draft</span>
                  )}
                </div>
                <p className="text-sm text-slate-600 mb-2">{announcement.content}</p>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar size={14} />
                    Publish: {new Date(announcement.publishDate).toLocaleDateString()}
                  </span>
                  <span>Updated: {new Date(announcement.lastUpdated).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => {
                    setSelected(announcement);
                    setView('announcement-edit');
                  }}
                  className="p-2 hover:bg-blue-50 rounded-lg"
                >
                  <Edit size={18} className="text-blue-600" />
                </button>
                <button
                  onClick={() => console.log('Delete', announcement.id)}
                  className="p-2 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 size={18} className="text-red-600" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnnouncementEditor({ announcement, setView }: { announcement: Announcement | null, setView: (view: CMSView) => void }) {
  const [formData, setFormData] = useState({
    title: announcement?.title || '',
    content: announcement?.content || '',
    type: announcement?.type || 'News',
    status: announcement?.status || 'Draft' as ContentStatus,
    publishDate: announcement?.publishDate || new Date().toISOString().split('T')[0],
  });

  const handleSave = () => {
    console.log('Officer Action: Saving announcement', formData);
    setView('announcement-list');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <button
        onClick={() => setView('announcement-list')}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
      >
        <ChevronLeft size={20} />
        Back to Announcements
      </button>

      <div className="flex items-center justify-between">
        <h2 className="text-2xl">{announcement ? 'Edit' : 'Add'} Announcement</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setView('announcement-list')}
            className="border border-slate-300 px-4 py-2 rounded-lg hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <Save size={18} />
            Save Announcement
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
        <div>
          <label className="block text-sm mb-2 text-slate-700">Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm mb-2 text-slate-700">Content</label>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            rows={6}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm mb-2 text-slate-700">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="News">News</option>
              <option value="Event">Event</option>
              <option value="Featured">Featured</option>
            </select>
          </div>

          <div>
            <label className="block text-sm mb-2 text-slate-700">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as ContentStatus })}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="Draft">Draft</option>
              <option value="Published">Published</option>
            </select>
          </div>

          <div>
            <label className="block text-sm mb-2 text-slate-700">Publish Date</label>
            <input
              type="date"
              value={formData.publishDate}
              onChange={(e) => setFormData({ ...formData, publishDate: e.target.value })}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm mb-2 text-slate-700">Featured Image</label>
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-green-400 transition-colors cursor-pointer">
            <ImageIcon size={48} className="mx-auto text-slate-400 mb-2" />
            <p className="text-sm text-slate-600">Upload announcement image</p>
          </div>
        </div>
      </div>
    </div>
  );
}
