import { useState, useEffect } from 'react';
import { Search, CheckCircle, Clock, AlertCircle, ChevronLeft, Eye, Edit, MoreVertical, XCircle, Settings, Plus, Trash2, Check, Loader2, CheckCircle2, FileText, Upload, Download, File, Image, X, RefreshCw } from 'lucide-react';
import { businessAPI } from '../utils/api';
import { logActivity, updateDashboardStats } from '../utils/activityLogger';

type BusinessView = 'directory' | 'application' | 'manage-types' | 'view-detail' | 'edit-business';
type BusinessStatus = 'Approved' | 'Pending Review' | 'Under Review' | 'Rejected' | 'Expired';
type DocumentStatus = 'Not Uploaded' | 'Uploaded' | 'Needs Update' | 'Approved';

interface DocumentItem {
  id: string;
  name: string;
  fileName: string;
  fileType: 'pdf' | 'jpg' | 'png';
  fileSize: string;
  uploadDate: string;
  status: DocumentStatus;
  fileData?: string; // Base64 or URL
}

interface Business {
  id: string;
  name: string;
  type: string;
  owner: string;
  location: string;
  contact: string;
  email: string;
  status: BusinessStatus;
  applicationDate: string;
  accreditationNumber: string | null;
  expiryDate: string | null;
  permitNumber: string;
  notes: string;
  documents: DocumentItem[];
  createdAt: string;
  updatedAt: string;
}

interface BusinessType {
  id: string;
  name: string;
  active: boolean;
  count?: number;
  createdAt: string;
}

const REQUIRED_DOCUMENTS = [
  { id: 'business_permit', name: 'Business Permit', required: true },
  { id: 'barangay_clearance', name: 'Barangay Clearance', required: true },
  { id: 'sanitary_permit', name: 'Sanitary Permit', required: false },
  { id: 'fire_safety', name: 'Fire Safety Certificate', required: false },
];

export function BusinessAccreditationModule() {
  const [view, setView] = useState<BusinessView>('directory');
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [selectedType, setSelectedType] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState<{ action: string; businessId: string; businessName: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const businessesData = await businessAPI.getBusinesses();
      
      setBusinesses(Array.isArray(businessesData) ? businessesData : []);
      
      const storedTypes = localStorage.getItem('businessTypes');
      if (storedTypes) {
        setBusinessTypes(JSON.parse(storedTypes));
      } else {
        const defaultTypes = [
          'Hotel', 'Resort', 'Restaurant', 'Café', 'Souvenir Shop',
          'Transport Service', 'Tour Operator', 'Event Venue', 'Homestay'
        ];
        const initialTypes = defaultTypes.map((name, idx) => ({
          id: `type_${idx}`,
          name,
          active: true,
          count: 0,
          createdAt: new Date().toISOString()
        }));
        setBusinessTypes(initialTypes);
        localStorage.setItem('businessTypes', JSON.stringify(initialTypes));
      }
      
      if (!businessesData || businessesData.length === 0) {
        await initializeSampleData();
      }
    } catch (error) {
      console.error('Failed to load business data:', error);
      setBusinesses([]);
    } finally {
      setLoading(false);
    }
  };

  const initializeSampleData = async () => {
    try {
      const sampleBusinesses = [
        {
          name: 'Seaside Paradise Resort',
          type: 'Resort',
          owner: 'Juan Santos',
          location: 'Barangay Seaside, Calabanga',
          contact: '0917-123-4567',
          email: 'info@seasideparadise.com',
          status: 'Approved',
          accreditationNumber: 'ACC-2024-001',
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          permitNumber: 'PER-2024-001',
          notes: 'Full compliance with tourism standards',
          documents: [
            {
              id: 'doc_1',
              name: 'Business Permit',
              fileName: 'business_permit_2024.pdf',
              fileType: 'pdf',
              fileSize: '245 KB',
              uploadDate: new Date().toISOString(),
              status: 'Approved'
            },
            {
              id: 'doc_2',
              name: 'Barangay Clearance',
              fileName: 'barangay_clearance.pdf',
              fileType: 'pdf',
              fileSize: '180 KB',
              uploadDate: new Date().toISOString(),
              status: 'Approved'
            }
          ]
        },
        {
          name: 'Calabanga Heritage Hotel',
          type: 'Hotel',
          owner: 'Maria Cruz',
          location: 'Downtown Calabanga',
          contact: '0918-234-5678',
          email: 'contact@heritagehotel.com',
          status: 'Approved',
          accreditationNumber: 'ACC-2024-002',
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          permitNumber: 'PER-2024-002',
          notes: 'Historic building, well-maintained',
          documents: [
            {
              id: 'doc_3',
              name: 'Business Permit',
              fileName: 'permit_heritage_hotel.pdf',
              fileType: 'pdf',
              fileSize: '320 KB',
              uploadDate: new Date().toISOString(),
              status: 'Approved'
            },
            {
              id: 'doc_4',
              name: 'Barangay Clearance',
              fileName: 'clearance_2024.jpg',
              fileType: 'jpg',
              fileSize: '1.2 MB',
              uploadDate: new Date().toISOString(),
              status: 'Approved'
            }
          ]
        },
        {
          name: "Lola's Carinderia",
          type: 'Restaurant',
          owner: 'Rosa Garcia',
          location: 'Public Market Area',
          contact: '0919-345-6789',
          email: 'lolascarinderia@gmail.com',
          status: 'Pending Review',
          accreditationNumber: null,
          expiryDate: null,
          permitNumber: '',
          notes: 'Application submitted, awaiting inspection',
          documents: [
            {
              id: 'doc_5',
              name: 'Business Permit',
              fileName: 'business_permit_lolas.pdf',
              fileType: 'pdf',
              fileSize: '156 KB',
              uploadDate: new Date().toISOString(),
              status: 'Uploaded'
            }
          ]
        }
      ];

      for (const business of sampleBusinesses) {
        await businessAPI.createBusiness(business);
      }

      await loadData();
    } catch (error) {
      console.error('Failed to initialize sample data:', error);
    }
  };

  const filteredBusinesses = businesses.filter(business => {
    const matchesType = selectedType === 'All' || business.type === selectedType;
    const matchesStatus = selectedStatus === 'All' || business.status === selectedStatus;
    const matchesSearch = business.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         business.owner.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesStatus && matchesSearch;
  });

  const handleStatusChange = async (businessId: string, newStatus: string, businessName: string) => {
    setShowConfirmDialog({ action: newStatus, businessId, businessName });
  };

  const confirmStatusChange = async () => {
    if (!showConfirmDialog) return;

    try {
      setActionLoading(true);
      const { action, businessId, businessName } = showConfirmDialog;

      if (action === 'Approve') {
        const accreditationNumber = `ACC-${Date.now()}`;
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        
        await businessAPI.approveBusiness(businessId, {
          accreditationNumber,
          expiryDate: expiryDate.toISOString()
        });

        await logActivity({
          action: 'Business approved',
          detail: `${businessName} - Accreditation ${accreditationNumber}`,
          status: 'success',
          module: 'Business Accreditation'
        });
        showSuccess(`Business approved! Accreditation: ${accreditationNumber}`);
      } else if (action === 'Reject') {
        await businessAPI.rejectBusiness(businessId, {
          reason: 'Did not meet accreditation requirements'
        });

        await logActivity({
          action: 'Business rejected',
          detail: `${businessName} - Application denied`,
          status: 'warning',
          module: 'Business Accreditation'
        });
        showSuccess('Business application rejected');
      } else if (action === 'Delete') {
        await businessAPI.deleteBusiness(businessId);

        await logActivity({
          action: 'Business deleted',
          detail: `${businessName} removed from directory`,
          status: 'warning',
          module: 'Business Accreditation'
        });
        showSuccess('Business deleted successfully');
      } else {
        await businessAPI.updateBusiness(businessId, { status: action });

        await logActivity({
          action: 'Business status updated',
          detail: `${businessName} - Status: ${action}`,
          status: 'info',
          module: 'Business Accreditation'
        });
        showSuccess(`Business status updated to ${action}`);
      }

      await loadData();
      const updatedBusinesses = await businessAPI.getBusinesses();
      const approvedCount = updatedBusinesses.filter((b: any) => b.status === 'Approved').length;
      await updateDashboardStats({
        activeBusinesses: approvedCount,
        businessTrend: `+${approvedCount}`
      });

      setShowConfirmDialog(null);
      setShowActionMenu(null);
    } catch (error) {
      console.error('Failed to change status:', error);
      alert('Error updating business status');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-sky-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading business directory...</p>
        </div>
      </div>
    );
  }

  if (view === 'manage-types') {
    return <ManageBusinessTypes setView={setView} types={businessTypes} onUpdate={(newTypes) => {
      setBusinessTypes(newTypes);
      localStorage.setItem('businessTypes', JSON.stringify(newTypes));
      showSuccess('Business types updated');
    }} />;
  }

  if (view === 'application') {
    return <AccreditationApplication setView={setView} types={businessTypes} onUpdate={loadData} onSuccess={showSuccess} />;
  }

  if (view === 'view-detail' && selectedBusiness) {
    return <BusinessDetail business={selectedBusiness} setView={setView} onEdit={() => setView('edit-business')} onUpdate={loadData} onSuccess={showSuccess} />;
  }

  if (view === 'edit-business' && selectedBusiness) {
    return <EditBusiness business={selectedBusiness} setView={setView} types={businessTypes} onUpdate={loadData} onSuccess={showSuccess} />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle2 className="text-green-600" size={20} />
          <p className="text-green-800">{successMessage}</p>
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl">Business Directory</h2>
          <p className="text-sm text-slate-600">Manage accredited tourism establishments ({businesses.length} total)</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setView('manage-types')}
            className="bg-slate-600 text-white px-4 py-3 rounded-lg hover:bg-slate-700 transition-colors shadow-sm flex items-center gap-2"
          >
            <Settings size={20} />
            <span className="hidden md:inline">Manage Types</span>
          </button>
          <button 
            onClick={() => setView('application')}
            className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors shadow-sm flex items-center gap-2"
          >
            <Plus size={20} />
            <span className="hidden md:inline">New Application</span>
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input
          type="text"
          placeholder="Search businesses by name or owner..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm mb-2 text-slate-700">Business Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Types</option>
              {businessTypes.filter(t => t.active).map(t => (
                <option key={t.id} value={t.name}>{t.name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm mb-2 text-slate-700">Accreditation Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Statuses</option>
              <option value="Approved">Approved</option>
              <option value="Pending Review">Pending Review</option>
              <option value="Under Review">Under Review</option>
              <option value="Rejected">Rejected</option>
              <option value="Expired">Expired</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-slate-600">
        <span>Showing {filteredBusinesses.length} of {businesses.length} businesses</span>
        <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs">
          {businesses.filter(b => b.status === 'Pending Review').length} pending review
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBusinesses.map((business) => (
          <div key={business.id} className="bg-white rounded-lg border border-slate-200 p-5 hover:shadow-md transition-shadow relative flex flex-col">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex-1">
                <h3 className="leading-tight mb-1">{business.name}</h3>
                <p className="text-sm text-slate-600">{business.type}</p>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(business.status)}
                <div className="relative">
                  <button
                    onClick={() => setShowActionMenu(showActionMenu === business.id ? null : business.id)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    aria-label="Officer Actions"
                  >
                    <MoreVertical size={18} />
                  </button>
                  {showActionMenu === business.id && (
                    <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 min-w-[200px]">
                      <button
                        onClick={() => handleStatusChange(business.id, 'Approve', business.name)}
                        className="w-full px-4 py-2 text-left hover:bg-green-50 text-green-700 flex items-center gap-2 text-sm"
                        disabled={business.status === 'Approved'}
                      >
                        <CheckCircle size={16} />
                        Approve & Accredit
                      </button>
                      <button
                        onClick={() => handleStatusChange(business.id, 'Under Review', business.name)}
                        className="w-full px-4 py-2 text-left hover:bg-blue-50 text-blue-700 flex items-center gap-2 text-sm"
                      >
                        <Clock size={16} />
                        Mark Under Review
                      </button>
                      <button
                        onClick={() => handleStatusChange(business.id, 'Reject', business.name)}
                        className="w-full px-4 py-2 text-left hover:bg-red-50 text-red-700 flex items-center gap-2 text-sm"
                      >
                        <XCircle size={16} />
                        Reject Application
                      </button>
                      <button
                        onClick={() => handleStatusChange(business.id, 'Delete', business.name)}
                        className="w-full px-4 py-2 text-left hover:bg-red-50 text-red-700 flex items-center gap-2 text-sm border-t border-slate-200"
                      >
                        <Trash2 size={16} />
                        Delete Permanently
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm py-2 border-t border-slate-100 mb-3">
              <div>
                <span className="text-slate-500">Owner: </span>
                <span className="text-slate-700">{business.owner}</span>
              </div>
            </div>

            {/* Document Status Indicator */}
            <div className="mb-3">
              <div className="flex items-center gap-2 text-xs">
                <FileText size={14} className="text-slate-400" />
                <span className="text-slate-600">
                  {business.documents?.length || 0} / {REQUIRED_DOCUMENTS.filter(d => d.required).length} required docs
                </span>
              </div>
            </div>

            <div className="mb-3 min-h-[40px] flex items-center">
              {business.status === 'Approved' && business.expiryDate && (
                <div className="flex items-center justify-between text-sm w-full">
                  <div className="text-slate-600">
                    <span className="text-xs">Expires: </span>
                    <span className="text-xs">{new Date(business.expiryDate).toLocaleDateString()}</span>
                  </div>
                  <div className="text-green-600 text-xs">
                    {business.accreditationNumber}
                  </div>
                </div>
              )}

              {business.status === 'Pending Review' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-xs text-yellow-800 w-full">
                  ⏳ Application submitted on {new Date(business.applicationDate || business.createdAt).toLocaleDateString()}
                </div>
              )}

              {business.status === 'Under Review' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-xs text-blue-800 w-full">
                  🔍 Currently under review by tourism office
                </div>
              )}

              {business.status === 'Rejected' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-xs text-red-800 w-full">
                  ❌ Application rejected - Review requirements
                </div>
              )}

              {business.status === 'Expired' && business.expiryDate && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 text-xs text-orange-800 w-full">
                  ⚠️ Accreditation expired on {new Date(business.expiryDate).toLocaleDateString()}
                </div>
              )}
            </div>

            <div className="mt-auto flex gap-2">
              <button
                onClick={() => {
                  setSelectedBusiness(business);
                  setView('view-detail');
                }}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Eye size={16} />
                View Details
              </button>
              <button
                onClick={() => {
                  setSelectedBusiness(business);
                  setView('edit-business');
                }}
                className="flex-1 border border-slate-300 py-2 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Edit size={16} />
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredBusinesses.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <p>No businesses found matching your criteria.</p>
          {businesses.length === 0 && (
            <button
              onClick={() => setView('application')}
              className="mt-4 text-blue-600 hover:text-blue-700 underline"
            >
              Submit your first application
            </button>
          )}
        </div>
      )}

      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg">Confirm Officer Action</h3>
            <p className="text-slate-600">
              {showConfirmDialog.action === 'Delete' 
                ? 'Are you sure you want to permanently delete this business?'
                : showConfirmDialog.action === 'Approve'
                ? 'Approve this business and issue accreditation?'
                : showConfirmDialog.action === 'Reject'
                ? 'Reject this business application?'
                : `Change status to ${showConfirmDialog.action}?`
              }
            </p>
            <p className="text-sm text-slate-600">
              Business: <strong>{showConfirmDialog.businessName}</strong>
            </p>
            {showConfirmDialog.action === 'Approve' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
                ✅ This will generate an accreditation number and set expiry date to 1 year from today.
              </div>
            )}
            {showConfirmDialog.action === 'Delete' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                ⚠️ This action cannot be undone.
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmDialog(null)}
                className="flex-1 border border-slate-300 py-3 rounded-lg hover:bg-slate-50"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={confirmStatusChange}
                disabled={actionLoading}
                className={`flex-1 ${
                  showConfirmDialog.action === 'Delete' || showConfirmDialog.action === 'Reject'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50`}
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getStatusBadge(status: BusinessStatus) {
  const badges = {
    'Approved': <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full flex items-center gap-1 w-fit">
      <CheckCircle size={12} /> Approved
    </span>,
    'Pending Review': <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full flex items-center gap-1 w-fit">
      <Clock size={12} /> Pending
    </span>,
    'Under Review': <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full flex items-center gap-1 w-fit">
      <Eye size={12} /> Under Review
    </span>,
    'Rejected': <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full flex items-center gap-1 w-fit">
      <XCircle size={12} /> Rejected
    </span>,
    'Expired': <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full flex items-center gap-1 w-fit">
      <AlertCircle size={12} /> Expired
    </span>,
  };
  return badges[status] || <span className="bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded-full w-fit">Unknown</span>;
}

function getDocumentStatusBadge(status: DocumentStatus) {
  const badges = {
    'Not Uploaded': <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-full">Not Uploaded</span>,
    'Uploaded': <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full flex items-center gap-1">
      <Clock size={12} /> Uploaded
    </span>,
    'Needs Update': <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full flex items-center gap-1">
      <AlertCircle size={12} /> Needs Update
    </span>,
    'Approved': <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full flex items-center gap-1">
      <CheckCircle size={12} /> Approved
    </span>,
  };
  return badges[status];
}

function getFileIcon(fileType: string) {
  if (fileType === 'pdf') {
    return <File size={20} className="text-red-500" />;
  } else if (fileType === 'jpg' || fileType === 'png') {
    return <Image size={20} className="text-blue-500" />;
  }
  return <FileText size={20} className="text-slate-500" />;
}

// Document Upload Repository Component
interface DocumentRepositoryProps {
  documents: DocumentItem[];
  onUpload: (docId: string, file: File) => void;
  onDelete: (docId: string) => void;
  onApprove?: (docId: string) => void;
  onRequestUpdate?: (docId: string) => void;
  readOnly?: boolean;
  showOfficerActions?: boolean;
}

function DocumentRepository({ documents, onUpload, onDelete, onApprove, onRequestUpdate, readOnly = false, showOfficerActions = false }: DocumentRepositoryProps) {
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);

  const handleFileUpload = (docName: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      alert('Invalid file type. Please upload PDF, JPG, or PNG files only.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit.');
      return;
    }

    onUpload(docName, file);
  };

  const getDocumentByName = (name: string) => {
    return documents.find(d => d.name === name);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg mb-1">Document Upload Repository</h3>
          <p className="text-sm text-slate-600">
            Upload required accreditation documents (PDF, JPG, PNG • Max 5MB each)
          </p>
        </div>
      </div>

      {/* Document Checklist Table */}
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left px-4 py-3 text-sm">Document Name</th>
              <th className="text-left px-4 py-3 text-sm">File</th>
              <th className="text-left px-4 py-3 text-sm">Upload Date</th>
              <th className="text-left px-4 py-3 text-sm">Status</th>
              <th className="text-right px-4 py-3 text-sm">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {REQUIRED_DOCUMENTS.map((reqDoc) => {
              const uploadedDoc = getDocumentByName(reqDoc.name);
              
              return (
                <tr key={reqDoc.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{reqDoc.name}</span>
                      {reqDoc.required && (
                        <span className="text-xs text-red-600">*Required</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {uploadedDoc ? (
                      <div className="flex items-center gap-2">
                        {getFileIcon(uploadedDoc.fileType)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{uploadedDoc.fileName}</p>
                          <p className="text-xs text-slate-500">{uploadedDoc.fileSize}</p>
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400">No file uploaded</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {uploadedDoc ? (
                      <span className="text-sm text-slate-600">
                        {new Date(uploadedDoc.uploadDate).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-sm text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {uploadedDoc 
                      ? getDocumentStatusBadge(uploadedDoc.status)
                      : getDocumentStatusBadge('Not Uploaded')
                    }
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {!readOnly && (
                        <>
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => handleFileUpload(reqDoc.name, e)}
                              className="hidden"
                            />
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                              {uploadedDoc ? <RefreshCw size={14} /> : <Upload size={14} />}
                              {uploadedDoc ? 'Replace' : 'Upload'}
                            </span>
                          </label>
                          {uploadedDoc && (
                            <button
                              onClick={() => onDelete(uploadedDoc.id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Delete document"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </>
                      )}
                      {uploadedDoc && (
                        <button
                          onClick={() => setSelectedDoc(uploadedDoc)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="View document"
                        >
                          <Eye size={16} />
                        </button>
                      )}
                      {showOfficerActions && uploadedDoc && uploadedDoc.status !== 'Approved' && onApprove && (
                        <button
                          onClick={() => onApprove(uploadedDoc.id)}
                          className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                        >
                          Approve
                        </button>
                      )}
                      {showOfficerActions && uploadedDoc && uploadedDoc.status !== 'Needs Update' && onRequestUpdate && (
                        <button
                          onClick={() => onRequestUpdate(uploadedDoc.id)}
                          className="px-3 py-1 border border-orange-500 text-orange-700 rounded-lg hover:bg-orange-50 transition-colors text-sm"
                        >
                          Request Update
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Document Preview Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg">{selectedDoc.name}</h3>
                <p className="text-sm text-slate-600">{selectedDoc.fileName} • {selectedDoc.fileSize}</p>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="bg-slate-100 rounded-lg p-8 flex items-center justify-center min-h-[400px]">
              {getFileIcon(selectedDoc.fileType)}
              <div className="ml-4">
                <p className="text-slate-600">Document preview not available</p>
                <p className="text-sm text-slate-500">File: {selectedDoc.fileName}</p>
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => alert('Download functionality: ' + selectedDoc.fileName)}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <Download size={16} />
                Download
              </button>
              <button
                onClick={() => setSelectedDoc(null)}
                className="flex-1 border border-slate-300 py-2 rounded-lg hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Progress Indicator */}
      {documents.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-green-800 text-sm">
            <CheckCircle size={16} />
            <span className="font-medium">
              {documents.length} document{documents.length > 1 ? 's' : ''} uploaded
            </span>
            <span className="text-green-600">
              ({documents.filter(d => REQUIRED_DOCUMENTS.find(r => r.name === d.name && r.required)).length} / {REQUIRED_DOCUMENTS.filter(d => d.required).length} required)
            </span>
          </div>
        </div>
      )}

      {/* Validation Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="text-blue-700 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Document Requirements</p>
            <ul className="space-y-1 text-blue-700">
              <li>• Business Permit and Barangay Clearance are required for accreditation</li>
              <li>• Accepted formats: PDF, JPG, PNG (max 5MB per file)</li>
              <li>• All documents must be clear and readable</li>
              <li>• You can upload documents for each category by clicking the Upload button in each row</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ManageBusinessTypesProps {
  setView: (view: BusinessView) => void;
  types: BusinessType[];
  onUpdate: (types: BusinessType[]) => void;
}

function ManageBusinessTypes({ setView, types, onUpdate }: ManageBusinessTypesProps) {
  const [localTypes, setLocalTypes] = useState(types);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const saveTypes = (updatedTypes: BusinessType[]) => {
    setLocalTypes(updatedTypes);
    onUpdate(updatedTypes);
  };

  const handleAddType = () => {
    if (!newTypeName.trim()) {
      alert('Please enter a type name');
      return;
    }

    const newType: BusinessType = {
      id: `type_${Date.now()}`,
      name: newTypeName.trim(),
      active: true,
      count: 0,
      createdAt: new Date().toISOString()
    };

    const updatedTypes = [...localTypes, newType];
    saveTypes(updatedTypes);
    setNewTypeName('');
    setShowAddForm(false);
    showSuccess(`Business type "${newTypeName}" added successfully!`);
  };

  const handleToggleActive = (id: string) => {
    const updatedTypes = localTypes.map(t => 
      t.id === id ? { ...t, active: !t.active } : t
    );
    saveTypes(updatedTypes);
    showSuccess('Business type status updated!');
  };

  const handleSaveEdit = () => {
    if (!editingId || !editingName.trim()) {
      alert('Please enter a valid type name');
      return;
    }

    const updatedTypes = localTypes.map(t => 
      t.id === editingId ? { ...t, name: editingName.trim() } : t
    );
    saveTypes(updatedTypes);
    setEditingId(null);
    setEditingName('');
    showSuccess('Business type updated successfully!');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <button
        onClick={() => setView('directory')}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
      >
        <ChevronLeft size={20} />
        Back to Business Directory
      </button>

      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle2 className="text-green-600" size={20} />
          <p className="text-green-800">{successMessage}</p>
        </div>
      )}

      <div className="bg-sky-50 border border-sky-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-sky-800 mb-2">
          <Settings size={20} />
          <p className="font-medium">Officer Business Type Management</p>
        </div>
        <p className="text-sm text-sky-700">
          Add, edit, or deactivate business types. Changes will affect dropdowns across the system.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl mb-2">Manage Business Types</h2>
            <p className="text-slate-600">Organize accreditation categories ({localTypes.length} total)</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <Plus size={20} />
            Add Type
          </button>
        </div>

        {showAddForm && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <label className="block text-sm mb-2 text-slate-700">New Business Type Name</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                placeholder="e.g., Bed & Breakfast"
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                autoFocus
                onKeyPress={(e) => e.key === 'Enter' && handleAddType()}
              />
              <button
                onClick={handleAddType}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewTypeName('');
                }}
                className="border border-slate-300 px-4 py-2 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {localTypes.map((type) => (
            <div key={type.id} className={`flex items-center justify-between p-4 rounded-lg border ${
              type.active ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-200 opacity-60'
            }`}>
              <div className="flex-1">
                {editingId === type.id ? (
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="px-3 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                    onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit()}
                  />
                ) : (
                  <div>
                    <p className="font-medium">{type.name}</p>
                    <p className="text-sm text-slate-600">{type.count || 0} businesses</p>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {editingId === type.id ? (
                  <>
                    <button
                      onClick={handleSaveEdit}
                      className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setEditingName('');
                      }}
                      className="border border-slate-300 px-3 py-2 rounded-lg hover:bg-slate-50 text-sm"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setEditingId(type.id);
                        setEditingName(type.name);
                      }}
                      className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Edit Type"
                    >
                      <Edit size={18} className="text-blue-600" />
                    </button>
                    <button
                      onClick={() => handleToggleActive(type.id)}
                      className={`px-3 py-1 rounded-full text-sm ${
                        type.active 
                          ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                          : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      }`}
                    >
                      {type.active ? 'Active' : 'Inactive'}
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {localTypes.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <p>No business types yet. Add your first type above.</p>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          <p>ℹ️ <strong>Note:</strong> Business types added here will appear in all dropdowns (application form, edit form, filters).</p>
        </div>
      </div>
    </div>
  );
}

interface AccreditationApplicationProps {
  setView: (view: BusinessView) => void;
  types: BusinessType[];
  onUpdate: () => void;
  onSuccess: (message: string) => void;
}

function AccreditationApplication({ setView, types, onUpdate, onSuccess }: AccreditationApplicationProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: types.find(t => t.active)?.name || '',
    owner: '',
    location: '',
    contact: '',
    email: '',
    permitNumber: '',
    notes: ''
  });
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(false);

  const handleDocumentUpload = (docName: string, file: File) => {
    const fileType = file.type.includes('pdf') ? 'pdf' : file.type.includes('jpeg') || file.type.includes('jpg') ? 'jpg' : 'png';
    const newDoc: DocumentItem = {
      id: `doc_${Date.now()}`,
      name: docName,
      fileName: file.name,
      fileType: fileType as 'pdf' | 'jpg' | 'png',
      fileSize: `${(file.size / 1024).toFixed(0)} KB`,
      uploadDate: new Date().toISOString(),
      status: 'Uploaded'
    };

    setDocuments([...documents.filter(d => d.name !== docName), newDoc]);
  };

  const handleDocumentDelete = (docId: string) => {
    setDocuments(documents.filter(d => d.id !== docId));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.owner.trim() || !formData.location.trim()) {
      alert('Please fill in required fields: Business Name, Owner, and Location');
      return;
    }

    const hasBusinessPermit = documents.some(d => d.name === 'Business Permit');
    const hasBarangayClearance = documents.some(d => d.name === 'Barangay Clearance');

    if (!hasBusinessPermit || !hasBarangayClearance) {
      alert('Please upload required documents: Business Permit and Barangay Clearance');
      return;
    }

    try {
      setLoading(true);
      await businessAPI.createBusiness({
        ...formData,
        status: 'Pending Review',
        applicationDate: new Date().toISOString(),
        documents
      });

      await logActivity({
        action: 'Business application submitted',
        detail: `${formData.name} - Awaiting review (${documents.length} documents uploaded)`,
        status: 'pending',
        module: 'Business Accreditation'
      });

      await onUpdate();
      const businesses = await businessAPI.getBusinesses();
      await updateDashboardStats({
        activeBusinesses: businesses.filter((b: any) => b.status === 'Approved').length,
        businessTrend: `+${businesses.length}`
      });

      onSuccess('Business application submitted successfully with documents!');
      setView('directory');
    } catch (error) {
      console.error('Failed to submit application:', error);
      alert('Error submitting application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <button
        onClick={() => setView('directory')}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
      >
        <ChevronLeft size={20} />
        Back to Business Directory
      </button>

      <div className="bg-sky-50 border border-sky-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-sky-800 mb-2">
          <FileText size={20} />
          <p className="font-medium">Business Accreditation Application</p>
        </div>
        <p className="text-sm text-sky-700">
          Submit your business for tourism accreditation review with required documents.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl">New Accreditation Application</h2>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg border-b pb-2">Business Information</h3>
          
          <div>
            <label className="block text-sm mb-2 text-slate-700">Business Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Seaside Paradise Resort"
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-2 text-slate-700">Business Type *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                {types.filter(t => t.active).map(t => (
                  <option key={t.id} value={t.name}>{t.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm mb-2 text-slate-700">Owner Name *</label>
              <input
                type="text"
                value={formData.owner}
                onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Juan Santos"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-2 text-slate-700">Business Location *</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Barangay Seaside, Calabanga"
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-2 text-slate-700">Contact Number</label>
              <input
                type="text"
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 0917-123-4567"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm mb-2 text-slate-700">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., info@business.com"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-2 text-slate-700">Business Permit Number</label>
            <input
              type="text"
              value={formData.permitNumber}
              onChange={(e) => setFormData({ ...formData, permitNumber: e.target.value })}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter the permit number as shown on the uploaded Business Permit"
              disabled={loading}
            />
            <p className="text-xs text-slate-500 mt-1">💡 Match this with your uploaded Business Permit document</p>
          </div>

          <div>
            <label className="block text-sm mb-2 text-slate-700">Additional Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="Any additional information about your business..."
              disabled={loading}
            />
          </div>
        </div>

        <div className="border-t pt-6">
          <DocumentRepository
            documents={documents}
            onUpload={handleDocumentUpload}
            onDelete={handleDocumentDelete}
            readOnly={loading}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            onClick={() => setView('directory')}
            disabled={loading}
            className="border border-slate-300 px-6 py-3 rounded-lg hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check size={20} />}
            {loading ? 'Submitting Application...' : 'Submit Application'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface BusinessDetailProps {
  business: Business;
  setView: (view: BusinessView) => void;
  onEdit: () => void;
  onUpdate: () => void;
  onSuccess: (message: string) => void;
}

function BusinessDetail({ business, setView, onEdit, onUpdate, onSuccess }: BusinessDetailProps) {
  const [documents, setDocuments] = useState<DocumentItem[]>(business.documents || []);

  const handleApproveDocument = async (docId: string) => {
    const updatedDocs = documents.map(d => 
      d.id === docId ? { ...d, status: 'Approved' as DocumentStatus } : d
    );
    setDocuments(updatedDocs);
    
    await businessAPI.updateBusiness(business.id, { documents: updatedDocs });
    await logActivity({
      action: 'Document approved',
      detail: `${business.name} - Document approved by officer`,
      status: 'success',
      module: 'Business Accreditation'
    });
    onSuccess('Document approved successfully!');
    onUpdate();
  };

  const handleRequestUpdate = async (docId: string) => {
    const updatedDocs = documents.map(d => 
      d.id === docId ? { ...d, status: 'Needs Update' as DocumentStatus } : d
    );
    setDocuments(updatedDocs);
    
    await businessAPI.updateBusiness(business.id, { documents: updatedDocs });
    await logActivity({
      action: 'Document update requested',
      detail: `${business.name} - Officer requested document update`,
      status: 'info',
      module: 'Business Accreditation'
    });
    onSuccess('Document update requested');
    onUpdate();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <button
        onClick={() => setView('directory')}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
      >
        <ChevronLeft size={20} />
        Back to Business Directory
      </button>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="bg-slate-100 p-8 text-center">
          <div className="text-6xl mb-4">🏢</div>
          <div className="inline-block">{getStatusBadge(business.status)}</div>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl">{business.name}</h2>
            <button
              onClick={onEdit}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Edit size={18} />
              Edit Business
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-slate-600 mb-1">Business Type</p>
              <p className="font-medium">{business.type}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">Owner</p>
              <p className="font-medium">{business.owner}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">Location</p>
              <p className="font-medium">{business.location}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">Contact</p>
              <p className="font-medium">{business.contact || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">Email</p>
              <p className="font-medium">{business.email || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">Application Date</p>
              <p className="font-medium">{new Date(business.applicationDate || business.createdAt).toLocaleDateString()}</p>
            </div>
            {business.accreditationNumber && (
              <>
                <div>
                  <p className="text-sm text-slate-600 mb-1">Accreditation Number</p>
                  <p className="font-medium text-green-700">{business.accreditationNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">Expiry Date</p>
                  <p className="font-medium">{business.expiryDate ? new Date(business.expiryDate).toLocaleDateString() : 'N/A'}</p>
                </div>
              </>
            )}
            {business.permitNumber && (
              <div>
                <p className="text-sm text-slate-600 mb-1">Permit Number</p>
                <p className="font-medium">{business.permitNumber}</p>
              </div>
            )}
          </div>

          {business.notes && (
            <div>
              <p className="text-sm text-slate-600 mb-1">Notes</p>
              <p className="text-slate-800">{business.notes}</p>
            </div>
          )}

          <div className="border-t pt-6">
            <DocumentRepository
              documents={documents}
              onUpload={() => {}}
              onDelete={() => {}}
              onApprove={handleApproveDocument}
              onRequestUpdate={handleRequestUpdate}
              readOnly={true}
              showOfficerActions={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

interface EditBusinessProps {
  business: Business;
  setView: (view: BusinessView) => void;
  types: BusinessType[];
  onUpdate: () => void;
  onSuccess: (message: string) => void;
}

function EditBusiness({ business, setView, types, onUpdate, onSuccess }: EditBusinessProps) {
  const [formData, setFormData] = useState({
    name: business.name || '',
    type: business.type || '',
    owner: business.owner || '',
    location: business.location || '',
    contact: business.contact || '',
    email: business.email || '',
    permitNumber: business.permitNumber || '',
    notes: business.notes || ''
  });
  const [documents, setDocuments] = useState<DocumentItem[]>(business.documents || []);
  const [loading, setLoading] = useState(false);

  const handleDocumentUpload = (docName: string, file: File) => {
    const fileType = file.type.includes('pdf') ? 'pdf' : file.type.includes('jpeg') || file.type.includes('jpg') ? 'jpg' : 'png';
    const newDoc: DocumentItem = {
      id: `doc_${Date.now()}`,
      name: docName,
      fileName: file.name,
      fileType: fileType as 'pdf' | 'jpg' | 'png',
      fileSize: `${(file.size / 1024).toFixed(0)} KB`,
      uploadDate: new Date().toISOString(),
      status: 'Uploaded'
    };

    setDocuments([...documents.filter(d => d.name !== docName), newDoc]);
  };

  const handleDocumentDelete = (docId: string) => {
    setDocuments(documents.filter(d => d.id !== docId));
  };

  const handleUpdate = async () => {
    if (!formData.name.trim() || !formData.owner.trim() || !formData.location.trim()) {
      alert('Please fill in required fields');
      return;
    }

    try {
      setLoading(true);
      await businessAPI.updateBusiness(business.id, { ...formData, documents });

      await logActivity({
        action: 'Business updated',
        detail: `${formData.name} information and documents modified`,
        status: 'success',
        module: 'Business Accreditation'
      });

      await onUpdate();
      onSuccess('Business information updated successfully!');
      setView('directory');
    } catch (error) {
      console.error('Failed to update business:', error);
      alert('Error updating business');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <button
        onClick={() => setView('directory')}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
      >
        <ChevronLeft size={20} />
        Back to Business Directory
      </button>

      <div className="bg-sky-50 border border-sky-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-sky-800 mb-2">
          <Edit size={20} />
          <p className="font-medium">Edit Business Information & Documents</p>
        </div>
        <p className="text-sm text-sky-700">
          Update business details, contact information, and upload/replace documents.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl">Edit Business</h2>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg border-b pb-2">Business Information</h3>

          <div>
            <label className="block text-sm mb-2 text-slate-700">Business Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-2 text-slate-700">Business Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                {types.filter(t => t.active).map(t => (
                  <option key={t.id} value={t.name}>{t.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm mb-2 text-slate-700">Owner Name *</label>
              <input
                type="text"
                value={formData.owner}
                onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-2 text-slate-700">Business Location *</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-2 text-slate-700">Contact Number</label>
              <input
                type="text"
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm mb-2 text-slate-700">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-2 text-slate-700">Business Permit Number</label>
            <input
              type="text"
              value={formData.permitNumber}
              onChange={(e) => setFormData({ ...formData, permitNumber: e.target.value })}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter the permit number as shown on the uploaded Business Permit"
              disabled={loading}
            />
            <p className="text-xs text-slate-500 mt-1">💡 Match this with your uploaded Business Permit document</p>
          </div>

          <div>
            <label className="block text-sm mb-2 text-slate-700">Additional Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              disabled={loading}
            />
          </div>
        </div>

        <div className="border-t pt-6">
          <DocumentRepository
            documents={documents}
            onUpload={handleDocumentUpload}
            onDelete={handleDocumentDelete}
            readOnly={loading}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            onClick={() => setView('directory')}
            disabled={loading}
            className="border border-slate-300 px-6 py-3 rounded-lg hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check size={20} />}
            {loading ? 'Updating...' : 'Update Business'}
          </button>
        </div>
      </div>
    </div>
  );
}
