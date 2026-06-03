import { useState } from 'react';
import { ChevronLeft, Edit, Eye, FileText, CheckCircle, Clock, XCircle, AlertCircle, Upload, Download, MessageSquare } from 'lucide-react';

type UserRole = 'officer' | 'business-owner' | 'public';
type BusinessView = 'directory' | 'dashboard' | 'application' | 'manage-types';
type DocumentStatus = 'Submitted' | 'Approved' | 'Needs Update';

interface Business {
  id: number;
  name: string;
  type: string;
  status: string;
  expiry: string;
  views: number;
  owner: string;
}

interface DocumentItem {
  name: string;
  fileName: string;
  fileType: string;
  uploadDate: string;
  status: DocumentStatus;
  expires?: string;
  comment?: string;
}

export function BusinessOwnerDashboardEnhanced({ 
  setView, 
  userRole, 
  business,
  onStatusChange 
}: { 
  setView: (view: BusinessView) => void;
  userRole: UserRole;
  business: Business;
  onStatusChange: (businessId: number, newStatus: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(business.name);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showStatusInfo, setShowStatusInfo] = useState(false);
  const [showStatusHistory, setShowStatusHistory] = useState(true);
  const [showOfficerActions, setShowOfficerActions] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentItem | null>(null);
  const [documentComment, setDocumentComment] = useState('');
  const [showDocumentDialog, setShowDocumentDialog] = useState(false);
  const [selectedStatusAction, setSelectedStatusAction] = useState('');
  const [showDocumentPreview, setShowDocumentPreview] = useState(false);
  const [showStatusConfirmDialog, setShowStatusConfirmDialog] = useState(false);

  // Mock documents data - prioritized at the top
  const [documents, setDocuments] = useState<DocumentItem[]>([
    { 
      name: 'Business Permit', 
      fileName: 'business-permit-2025.pdf',
      fileType: 'PDF',
      uploadDate: '2024-11-10',
      status: 'Approved',
      expires: '2026-03-15'
    },
    { 
      name: 'Sanitary Permit', 
      fileName: 'sanitary-clearance.pdf',
      fileType: 'PDF',
      uploadDate: '2024-11-12',
      status: 'Needs Update',
      expires: '2026-02-20',
      comment: 'Please upload the latest version with updated seal'
    },
    { 
      name: 'Fire Safety Certificate', 
      fileName: 'fire-safety-cert.jpg',
      fileType: 'Image',
      uploadDate: '2024-11-08',
      status: 'Submitted'
    },
    { 
      name: 'Tourism Accreditation Form', 
      fileName: 'accreditation-form.pdf',
      fileType: 'PDF',
      uploadDate: '2024-11-15',
      status: 'Approved',
      expires: '2026-03-15'
    },
  ]);

  const daysUntilExpiry = business.expiry !== '-' 
    ? Math.floor((new Date(business.expiry).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const handleSaveChanges = () => {
    console.log('Saving changes:', editedName);
    setIsEditing(false);
    setShowSaveConfirm(false);
  };

  const handleDocumentAction = (doc: DocumentItem, action: string) => {
    setSelectedDocument(doc);
    if (action === 'needs-update') {
      setShowDocumentDialog(true);
    } else if (action === 'approve') {
      // Update document status
      setDocuments(prev => prev.map(d => 
        d.name === doc.name ? { ...d, status: 'Approved' } : d
      ));
    } else if (action === 'view') {
      console.log('Viewing document:', doc.fileName);
      setShowDocumentPreview(true);
    }
  };

  const handleDocumentCommentSubmit = () => {
    if (selectedDocument) {
      setDocuments(prev => prev.map(d => 
        d.name === selectedDocument.name 
          ? { ...d, status: 'Needs Update', comment: documentComment } 
          : d
      ));
      setShowDocumentDialog(false);
      setDocumentComment('');
      setSelectedDocument(null);
    }
  };

  const handleStatusChangeWithConfirm = (newStatus: string) => {
    setSelectedStatusAction(newStatus);
    // This would trigger a confirmation dialog
    onStatusChange(business.id, newStatus);
    setShowOfficerActions(false);
    setShowStatusConfirmDialog(true);
  };

  // Mock status history data
  const statusHistory = [
    { status: 'Submitted', date: '2024-11-15', actor: 'Juan Santos (Owner)', description: 'Application submitted for review' },
    { status: 'Under Review', date: '2024-11-18', actor: 'Maria Torres (Tourism Officer)', description: 'Documents being verified' },
    { status: 'Approved', date: '2024-11-25', actor: 'Maria Torres (Tourism Officer)', description: 'All requirements met, accreditation granted' },
    ...(business.status === 'Expired' ? [{ status: 'Expired', date: '2024-11-30', actor: 'System', description: 'Accreditation validity period ended' }] : []),
  ];

  const getStatusDefinition = (status: string) => {
    const definitions: Record<string, string> = {
      'Accredited': 'Business has met all requirements and is officially recognized by the Tourism Office.',
      'Pending': 'Application submitted and awaiting initial review by Tourism Officer.',
      'Under Review': 'Documents and requirements are currently being verified by Tourism Officer.',
      'Expired': 'Accreditation validity period has ended. Renewal required to restore active status.',
      'Non-Compliant': 'Business has failed to meet regulatory requirements or standards. Immediate action required.',
    };
    return definitions[status] || 'Status description unavailable.';
  };

  const getLastUpdated = () => {
    if (statusHistory.length > 0) {
      const latest = statusHistory[statusHistory.length - 1];
      return `${new Date(latest.date).toLocaleDateString()} by ${latest.actor}`;
    }
    return 'N/A';
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, JSX.Element> = {
      'Accredited': <div className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs flex items-center gap-1">
        <CheckCircle size={14} />
        <span>Accredited</span>
      </div>,
      'Pending': <div className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs flex items-center gap-1">
        <Clock size={14} />
        <span>Pending</span>
      </div>,
      'Under Review': <div className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs flex items-center gap-1">
        <FileText size={14} />
        <span>Review</span>
      </div>,
      'Expired': <div className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs flex items-center gap-1">
        <XCircle size={14} />
        <span>Expired</span>
      </div>,
      'Non-Compliant': <div className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs flex items-center gap-1">
        <AlertCircle size={14} />
        <span>Non-Compliant</span>
      </div>,
    };
    return badges[status] || null;
  };

  const getDocumentStatusBadge = (status: DocumentStatus) => {
    const badges: Record<DocumentStatus, JSX.Element> = {
      'Submitted': <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">Submitted</span>,
      'Approved': <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full flex items-center gap-1">
        <CheckCircle size={12} /> Approved
      </span>,
      'Needs Update': <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full flex items-center gap-1">
        <AlertCircle size={12} /> Needs Update
      </span>,
    };
    return badges[status];
  };

  const getStatusGradient = (status: string) => {
    const gradients: Record<string, string> = {
      'Accredited': 'bg-gradient-to-r from-green-600 to-green-700',
      'Pending': 'bg-gradient-to-r from-yellow-600 to-yellow-700',
      'Under Review': 'bg-gradient-to-r from-blue-600 to-blue-700',
      'Expired': 'bg-gradient-to-r from-red-600 to-red-700',
      'Non-Compliant': 'bg-gradient-to-r from-red-700 to-red-800',
    };
    return gradients[status] || 'bg-gradient-to-r from-slate-600 to-slate-700';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <button
        onClick={() => setView('directory')}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
      >
        <ChevronLeft size={20} />
        Back to Directory
      </button>

      {/* Business Header Card */}
      <div className={`${getStatusGradient(business.status)} text-white rounded-lg p-6`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            {isEditing ? (
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="text-2xl bg-white/20 border-2 border-white/40 rounded-lg px-3 py-2 mb-2 w-full text-white placeholder-white/60"
              />
            ) : (
              <h2 className="text-2xl mb-2">{business.name}</h2>
            )}
            <p className="text-sm opacity-90">{business.type} • Owner: {business.owner}</p>
          </div>
          {(userRole === 'officer' || userRole === 'business-owner') && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Edit size={18} />
              <span className="hidden md:inline">{isEditing ? 'Cancel' : 'Edit'}</span>
            </button>
          )}
        </div>
        
        {business.status === 'Accredited' && daysUntilExpiry !== null && (
          <div className="bg-white/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90 mb-1">Accreditation Expiry</p>
                <p className="text-lg">{new Date(business.expiry).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl">{daysUntilExpiry}</p>
                <p className="text-sm opacity-90">days remaining</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {isEditing && (
        <div className="flex gap-3">
          <button
            onClick={() => setShowSaveConfirm(true)}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
          >
            Save Changes
          </button>
          <button
            onClick={() => {
              setIsEditing(false);
              setEditedName(business.name);
            }}
            className="flex-1 border border-slate-300 py-3 rounded-lg hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      )}

      {/* 1️⃣ UPLOADED DOCUMENTS - PRIORITIZED AT TOP */}
      <div className="bg-white border-2 border-sky-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg flex items-center gap-2">
              <FileText className="text-sky-600" size={20} />
              Uploaded Documents
            </h3>
            <p className="text-sm text-slate-600 mt-1">Review and validate submitted documents</p>
          </div>
          {userRole === 'officer' && (
            <span className="bg-sky-100 text-sky-700 text-xs px-3 py-1 rounded-full">
              {documents.filter(d => d.status === 'Submitted').length} pending review
            </span>
          )}
        </div>

        <div className="space-y-3">
          {documents.map((doc, index) => {
            const daysUntilDocExpiry = doc.expires 
              ? Math.floor((new Date(doc.expires).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
              : null;
            const isExpiringSoon = daysUntilDocExpiry !== null && daysUntilDocExpiry < 60;
            
            return (
              <div 
                key={index} 
                className={`border rounded-lg p-4 ${
                  doc.status === 'Needs Update' ? 'bg-orange-50 border-orange-200' :
                  doc.status === 'Submitted' ? 'bg-blue-50 border-blue-200' :
                  'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{doc.name}</h4>
                      {getDocumentStatusBadge(doc.status)}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm text-slate-600 mb-2">
                      <div className="flex items-center gap-1">
                        <FileText size={14} className="text-slate-400" />
                        <span>{doc.fileName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs bg-slate-200 px-2 py-0.5 rounded">{doc.fileType}</span>
                        <span className="text-xs">• Uploaded {new Date(doc.uploadDate).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {doc.expires && (
                      <div className={`text-xs ${isExpiringSoon ? 'text-orange-700' : 'text-slate-600'}`}>
                        📅 Expires: {new Date(doc.expires).toLocaleDateString()}
                        {isExpiringSoon && ` (${daysUntilDocExpiry} days)`}
                      </div>
                    )}

                    {doc.comment && (
                      <div className="mt-2 bg-white border border-orange-200 rounded p-2 text-sm">
                        <div className="flex items-start gap-2">
                          <MessageSquare size={14} className="text-orange-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-orange-700 font-medium mb-1">Officer Comment:</p>
                            <p className="text-orange-900">{doc.comment}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Document Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDocumentAction(doc, 'view')}
                      className="p-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                      title="View Document"
                    >
                      <Eye size={16} className="text-slate-600" />
                    </button>
                    
                    {userRole === 'officer' && (
                      <>
                        {doc.status !== 'Approved' && (
                          <button
                            onClick={() => handleDocumentAction(doc, 'approve')}
                            className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            title="Approve Document"
                          >
                            <CheckCircle size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDocumentAction(doc, 'needs-update')}
                          className="p-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                          title="Request Update"
                        >
                          <AlertCircle size={16} />
                        </button>
                      </>
                    )}
                    
                    {userRole === 'business-owner' && (
                      <button
                        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        title="Re-upload Document"
                      >
                        <Upload size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
          ℹ️ <strong>Validation Priority:</strong> All documents must be approved before accreditation can be granted. Documents marked "Needs Update" require immediate attention.
        </div>
      </div>

      {/* ACCREDITATION STATUS SECTION */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg">Accreditation Status</h3>
          <button
            onClick={() => setShowStatusInfo(!showStatusInfo)}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            {showStatusInfo ? '▼' : '▶'} {showStatusInfo ? 'Hide' : 'Show'} Details
          </button>
        </div>

        {/* Current Status Display */}
        <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm text-slate-600">Current Status:</span>
              {getStatusBadge(business.status)}
            </div>
            <p className="text-sm text-slate-700 mb-3">{getStatusDefinition(business.status)}</p>
            <div className="text-xs text-slate-500 space-y-1">
              <p>📅 Last Updated: {getLastUpdated()}</p>
              <p>👤 Responsible: Tourism Officer</p>
            </div>
          </div>
        </div>

        {/* Status Information Expandable */}
        {showStatusInfo && (
          <div className="space-y-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900">Understanding Status Meanings:</h4>
            <div className="space-y-2 text-sm text-blue-800">
              <div className="flex items-start gap-2">
                <div className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs mt-0.5">Accredited</div>
                <p>Your business meets all requirements and is approved for operations.</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-xs mt-0.5">Pending</div>
                <p>Application received, awaiting officer review (typically 3-5 business days).</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs mt-0.5">Under Review</div>
                <p>Officer is actively checking documents and verifying compliance.</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs mt-0.5">Expired</div>
                <p>Accreditation period ended. Submit renewal to restore active status.</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs mt-0.5">Non-Compliant</div>
                <p>Business failed inspection or regulations. Contact office immediately.</p>
              </div>
            </div>
          </div>
        )}

        {/* 4️⃣ OFFICER ACTIONS - Collapsible & Functional */}
        {userRole === 'officer' && (
          <div className="border-t border-slate-200 pt-4">
            <button
              onClick={() => setShowOfficerActions(!showOfficerActions)}
              className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <span className="font-medium text-slate-700">Officer Actions</span>
              <span className="text-slate-500">{showOfficerActions ? '▼' : '▶'}</span>
            </button>

            {showOfficerActions && (
              <div className="mt-3 space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <button
                    onClick={() => handleStatusChangeWithConfirm('Accredited')}
                    className="bg-green-600 text-white px-3 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm transition-all hover:shadow-md"
                    disabled={business.status === 'Accredited'}
                  >
                    <CheckCircle size={16} />
                    Approve
                  </button>
                  <button
                    onClick={() => handleStatusChangeWithConfirm('Under Review')}
                    className="bg-blue-600 text-white px-3 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm transition-all hover:shadow-md"
                    disabled={business.status === 'Under Review'}
                  >
                    <Clock size={16} />
                    Review
                  </button>
                  <button
                    onClick={() => handleStatusChangeWithConfirm('Non-Compliant')}
                    className="bg-red-600 text-white px-3 py-3 rounded-lg hover:bg-red-700 flex items-center justify-center gap-2 text-sm transition-all hover:shadow-md"
                  >
                    <XCircle size={16} />
                    Non-Compliant
                  </button>
                  <button
                    onClick={() => handleStatusChangeWithConfirm('Accredited')}
                    className="bg-purple-600 text-white px-3 py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm transition-all hover:shadow-md"
                    disabled={business.status !== 'Expired'}
                  >
                    <FileText size={16} />
                    Renew
                  </button>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <p className="text-xs text-orange-800">
                    ⚠️ <strong>Important:</strong> Status changes will:
                  </p>
                  <ul className="text-xs text-orange-700 mt-2 ml-4 space-y-1">
                    <li>• Send immediate notification to business owner</li>
                    <li>• Update the public directory listing</li>
                    <li>• Be recorded in the status timeline</li>
                    <li>• Require confirmation before executing</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* STATUS TIMELINE / HISTORY */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg">Status Timeline</h3>
          <button
            onClick={() => setShowStatusHistory(!showStatusHistory)}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            {showStatusHistory ? 'Hide' : 'Show'}
          </button>
        </div>

        {showStatusHistory && (
          <div className="relative">
            {/* Vertical timeline line */}
            <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-200" />
            
            <div className="space-y-4">
              {statusHistory.map((entry, index) => (
                <div key={index} className="relative flex gap-4">
                  {/* Timeline dot */}
                  <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                    entry.status === 'Approved' || entry.status === 'Submitted' ? 'bg-green-500' :
                    entry.status === 'Under Review' ? 'bg-blue-500' :
                    entry.status === 'Expired' ? 'bg-red-500' :
                    'bg-slate-400'
                  }`}>
                    {entry.status === 'Approved' && <CheckCircle size={14} className="text-white" />}
                    {entry.status === 'Under Review' && <Clock size={14} className="text-white" />}
                    {entry.status === 'Expired' && <XCircle size={14} className="text-white" />}
                    {entry.status === 'Submitted' && <FileText size={14} className="text-white" />}
                  </div>
                  
                  {/* Timeline content */}
                  <div className="flex-1 pb-4">
                    <div className="bg-slate-50 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-slate-900">{entry.status}</h4>
                        <span className="text-xs text-slate-500">{new Date(entry.date).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-slate-700 mb-2">{entry.description}</p>
                      <p className="text-xs text-slate-500">👤 {entry.actor}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Analytics */}
      {business.status === 'Accredited' && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <Eye className="text-blue-600 mb-2" size={24} />
            <p className="text-2xl mb-1">{business.views}</p>
            <p className="text-sm text-slate-600">Profile Views</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <FileText className="text-green-600 mb-2" size={24} />
            <p className="text-2xl mb-1">12</p>
            <p className="text-sm text-slate-600">Inquiries</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-4 col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">⭐</span>
            </div>
            <p className="text-2xl mb-1">4.7</p>
            <p className="text-sm text-slate-600">Average Rating</p>
          </div>
        </div>
      )}

      {/* Document Request Dialog */}
      {showDocumentDialog && selectedDocument && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg">Request Document Update</h3>
            <p className="text-sm text-slate-600">
              Request update for: <strong>{selectedDocument.name}</strong>
            </p>
            <div>
              <label className="block text-sm mb-2 text-slate-700">Reason / Comment</label>
              <textarea
                value={documentComment}
                onChange={(e) => setDocumentComment(e.target.value)}
                placeholder="Explain what needs to be updated..."
                rows={4}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-800">
              ⚠️ The business owner will be notified and asked to re-upload this document.
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDocumentDialog(false);
                  setDocumentComment('');
                  setSelectedDocument(null);
                }}
                className="flex-1 border border-slate-300 py-3 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDocumentCommentSubmit}
                className="flex-1 bg-orange-600 text-white py-3 rounded-lg hover:bg-orange-700"
                disabled={!documentComment.trim()}
              >
                Request Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Confirmation Dialog */}
      {showSaveConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg">Confirm Changes</h3>
            <p className="text-slate-600">
              Are you sure you want to save these changes to the business profile?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSaveConfirm(false)}
                className="flex-1 border border-slate-300 py-3 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveChanges}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Preview Dialog */}
      {showDocumentPreview && selectedDocument && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg">Document Preview</h3>
              <button
                onClick={() => {
                  setShowDocumentPreview(false);
                  setSelectedDocument(null);
                }}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <XCircle size={20} />
              </button>
            </div>

            {/* Document Info */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-slate-500 mb-1">Document Name</p>
                  <p className="font-medium">{selectedDocument.name}</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-1">File Name</p>
                  <p className="font-medium">{selectedDocument.fileName}</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-1">File Type</p>
                  <p className="font-medium">{selectedDocument.fileType}</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-1">Upload Date</p>
                  <p className="font-medium">{new Date(selectedDocument.uploadDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-1">Status</p>
                  <div>{getDocumentStatusBadge(selectedDocument.status)}</div>
                </div>
                {selectedDocument.expires && (
                  <div>
                    <p className="text-slate-500 mb-1">Expiry Date</p>
                    <p className="font-medium">{new Date(selectedDocument.expires).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Mock Document Preview */}
            <div className="bg-slate-100 border-2 border-slate-300 rounded-lg p-8 min-h-[400px] flex items-center justify-center">
              <div className="text-center space-y-4">
                <FileText size={64} className="text-slate-400 mx-auto" />
                <div>
                  <p className="text-lg text-slate-700 mb-2">{selectedDocument.fileName}</p>
                  <p className="text-sm text-slate-500">
                    {selectedDocument.fileType === 'PDF' ? '📄 PDF Document' : '🖼️ Image File'}
                  </p>
                  <p className="text-xs text-slate-400 mt-2">Preview functionality available in production</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDocumentPreview(false);
                  setSelectedDocument(null);
                }}
                className="flex-1 border border-slate-300 py-3 rounded-lg hover:bg-slate-50"
              >
                Close
              </button>
              <button
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <Download size={18} />
                Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Confirmation Dialog */}
      {showStatusConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg">Confirm Status Change</h3>
            <p className="text-slate-600">
              Are you sure you want to change the status to <strong>{selectedStatusAction}</strong>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowStatusConfirmDialog(false)}
                className="flex-1 border border-slate-300 py-3 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowStatusConfirmDialog(false)}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
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