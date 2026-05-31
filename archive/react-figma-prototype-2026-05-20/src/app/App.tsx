import { useEffect, useRef, useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { TopNav } from "./components/TopNav";
import { LandingPage } from "./components/views/LandingPage";
import { BusinessOwnerDashboard } from "./components/views/BusinessOwnerDashboard";
import { BusinessProfile } from "./components/views/BusinessProfile";
import { MyApplications } from "./components/views/MyApplications";
import { ApplicationStatusDetails } from "./components/views/ApplicationStatusDetails";
import { NotificationsPage } from "./components/views/NotificationsPage";
import { RenewalPage } from "./components/views/RenewalPage";
import { AccountSettings } from "./components/views/AccountSettings";
import { TourismStaffDashboard } from "./components/views/TourismStaffDashboard";
import { ApplicationReview } from "./components/views/ApplicationReview";
import { AccreditationRecords } from "./components/views/AccreditationRecords";
import { ReportsPage } from "./components/views/ReportsPage";
import { UserManagement } from "./components/views/UserManagement";
import { AdminDashboard } from "./components/views/AdminDashboard";
import { ApplicationForm } from "./components/views/ApplicationForm";
import { RoleManagement } from "./components/views/RoleManagement";
import { AuditLogs } from "./components/views/AuditLogs";
import { Button } from "./components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./components/ui/dialog";
import { Toaster, toast } from "sonner";
import { CheckCircle, X } from "lucide-react";

type UserRole = "business_owner" | "tourism_staff" | "admin";
type AppState = "landing" | "authenticated";
type AccreditationType = "New Accreditation" | "Renewal";

export default function App() {
  const [appState, setAppState] = useState<AppState>("landing");
  const [userRole, setUserRole] = useState<UserRole>("business_owner");
  const [currentView, setCurrentView] = useState("dashboard");
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [applicationFormType, setApplicationFormType] =
    useState<AccreditationType>("New Accreditation");
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [submittedApplicationNumber, setSubmittedApplicationNumber] =
    useState("BAC-2026-0001");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const submitRedirectTimer = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const userName =
    userRole === "business_owner"
      ? "John Martinez"
      : userRole === "tourism_staff"
      ? "Maria Santos"
      : "Admin User";

  const roleLabel =
    userRole === "business_owner"
      ? "Business Owner"
      : userRole === "tourism_staff"
      ? "Tourism Staff"
      : "System Administrator";

  const notificationCount =
    userRole === "business_owner" ? 3 : userRole === "tourism_staff" ? 2 : 2;

  const handleLogin = (role: UserRole) => {
    setUserRole(role);
    setCurrentView("dashboard");
    setAppState("authenticated");
    toast.success(`Welcome back!`);
  };

  const handleRegister = () => {
    setUserRole("business_owner");
    setCurrentView("dashboard");
    setAppState("authenticated");
    toast.success("Account created successfully!");
  };

  const handleNavigate = (view: string) => {
    if (view === "apply") {
      setApplicationFormType("New Accreditation");
    }
    setCurrentView(view);
    setSelectedApplicationId(null);
    setIsMobileMenuOpen(false);
  };

  const handleRenewNow = () => {
    setApplicationFormType("Renewal");
    setCurrentView("apply");
    setSelectedApplicationId(null);
    setIsMobileMenuOpen(false);
  };

  const handleViewApplicationDetails = (id: string) => {
    setSelectedApplicationId(id);
    setCurrentView("application-details");
  };

  const handleViewApplicationReview = (id: string) => {
    setSelectedApplicationId(id);
    setCurrentView("review-application");
  };

  const clearSubmitRedirectTimer = () => {
    if (submitRedirectTimer.current) {
      clearTimeout(submitRedirectTimer.current);
      submitRedirectTimer.current = null;
    }
  };

  const handleApplicationSubmit = (applicationNumber: string) => {
    clearSubmitRedirectTimer();
    setSubmittedApplicationNumber(applicationNumber);
    setShowSuccessDialog(true);
    submitRedirectTimer.current = setTimeout(() => {
      setShowSuccessDialog(false);
      setCurrentView("dashboard");
      toast.success("Application submitted successfully!");
      submitRedirectTimer.current = null;
    }, 3000);
  };

  const handleLogout = () => {
    setAppState("landing");
    setCurrentView("dashboard");
    toast.info("Logged out successfully");
  };

  useEffect(() => clearSubmitRedirectTimer, []);

  const renderView = () => {
    if (userRole === "business_owner") {
      switch (currentView) {
        case "dashboard":
          return (
            <BusinessOwnerDashboard
              onNavigate={handleNavigate}
              onViewDetails={handleViewApplicationDetails}
            />
          );
        case "business-profile":
          return <BusinessProfile />;
        case "apply":
          return (
            <ApplicationForm
              key={applicationFormType}
              onBack={() => setCurrentView("dashboard")}
              onSubmit={handleApplicationSubmit}
              initialAccreditationType={applicationFormType}
            />
          );
        case "applications":
          return (
            <MyApplications
              onViewDetails={handleViewApplicationDetails}
              onNewApplication={() => handleNavigate("apply")}
            />
          );
        case "application-details":
          return (
            <ApplicationStatusDetails
              applicationId={selectedApplicationId || "APP-2026-001"}
              onBack={() => setCurrentView("applications")}
              onResubmit={() => setCurrentView("apply")}
            />
          );
        case "notifications":
          return <NotificationsPage userRole={userRole} />;
        case "renewal":
          return <RenewalPage onRenewNow={handleRenewNow} />;
        case "settings":
          return <AccountSettings />;
        default:
          return (
            <BusinessOwnerDashboard
              onNavigate={handleNavigate}
              onViewDetails={handleViewApplicationDetails}
            />
          );
      }
    }

    if (userRole === "tourism_staff") {
      switch (currentView) {
        case "dashboard":
          return (
            <TourismStaffDashboard
              onNavigate={handleNavigate}
              onViewReview={handleViewApplicationReview}
            />
          );
        case "applications":
          return (
            <TourismStaffDashboard
              onNavigate={handleNavigate}
              onViewReview={handleViewApplicationReview}
            />
          );
        case "review-application":
          return (
            <ApplicationReview
              applicationId={selectedApplicationId || "APP-2026-001"}
              onBack={() => setCurrentView("applications")}
            />
          );
        case "records":
          return <AccreditationRecords />;
        case "reports":
          return <ReportsPage />;
        case "notifications":
          return <NotificationsPage userRole={userRole} />;
        case "settings":
          return <AccountSettings />;
        default:
          return <TourismStaffDashboard onNavigate={handleNavigate} />;
      }
    }

    if (userRole === "admin") {
      switch (currentView) {
        case "dashboard":
          return <AdminDashboard onNavigate={handleNavigate} />;
        case "users":
          return <UserManagement />;
        case "roles":
          return <RoleManagement />;
        case "audit":
          return <AuditLogs />;
        case "notifications":
          return <NotificationsPage userRole={userRole} />;
        case "settings":
          return <AccountSettings />;
        default:
          return <AdminDashboard onNavigate={handleNavigate} />;
      }
    }

    return (
      <BusinessOwnerDashboard
        onNavigate={handleNavigate}
        onViewDetails={handleViewApplicationDetails}
      />
    );
  };

  if (appState === "landing") {
    return (
      <>
        <Toaster position="top-right" richColors />
        <LandingPage
          onLogin={handleLogin}
          onRegister={handleRegister}
        />
      </>
    );
  }

  return (
    <>
      <Toaster position="top-right" richColors />
      <div className="size-full flex bg-background">
        <aside className="w-64 shrink-0 hidden lg:block">
          <Sidebar
            userRole={userRole}
            currentView={currentView}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
          />
        </aside>

        <div className="flex-1 flex flex-col overflow-hidden">
          <TopNav
            userName={userName}
            userRole={roleLabel}
            notificationCount={notificationCount}
            onMenuClick={() => setIsMobileMenuOpen(true)}
            onNotificationsClick={() => handleNavigate("notifications")}
          />

          <main className="flex-1 overflow-y-auto bg-gray-50">
            {renderView()}
          </main>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-xl">
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-3 top-3 z-10"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label="Close navigation menu"
            >
              <X className="size-5" />
            </Button>
            <Sidebar
              userRole={userRole}
              currentView={currentView}
              onNavigate={handleNavigate}
              onLogout={handleLogout}
            />
          </div>
        </div>
      )}

      <Dialog
        open={showSuccessDialog}
        onOpenChange={(open) => {
          setShowSuccessDialog(open);
          if (!open) {
            clearSubmitRedirectTimer();
          }
        }}
      >
        <DialogContent
          className="max-w-md mx-auto"
          onClose={() => setShowSuccessDialog(false)}
        >
          <DialogHeader className="text-center">
            <div className="flex items-center justify-center size-16 rounded-full bg-[var(--status-approved-bg)] mx-auto mb-4">
              <CheckCircle className="size-8 text-[var(--status-approved)]" />
            </div>
            <DialogTitle>Application Submitted Successfully!</DialogTitle>
            <DialogDescription className="text-center">
              Your accreditation application {submittedApplicationNumber} has
              been received. We'll review your documents and notify you of any
              updates.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                clearSubmitRedirectTimer();
                setShowSuccessDialog(false);
                setCurrentView("applications");
              }}
              className="w-full sm:w-auto"
            >
              View Applications
            </Button>
            <Button
              onClick={() => {
                clearSubmitRedirectTimer();
                setShowSuccessDialog(false);
                setCurrentView("dashboard");
              }}
              className="w-full sm:w-auto"
            >
              Go to Dashboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
