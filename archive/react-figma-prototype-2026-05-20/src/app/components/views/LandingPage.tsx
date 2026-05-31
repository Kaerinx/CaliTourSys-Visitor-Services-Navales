import { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Building2, CheckCircle, FileText, Clock, Shield } from "lucide-react";
import { LoginModal } from "../modals/LoginModal";
import { RegistrationModal } from "../modals/RegistrationModal";

interface LandingPageProps {
  onLogin: (role: "business_owner" | "tourism_staff" | "admin") => void;
  onRegister: () => void;
}

export function LandingPage({ onLogin, onRegister }: LandingPageProps) {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  const handleLoginClick = () => {
    setShowLoginModal(true);
  };

  const handleRegisterClick = () => {
    setShowRegisterModal(true);
  };

  const handleSwitchToRegister = () => {
    setShowLoginModal(false);
    setShowRegisterModal(true);
  };

  const handleSwitchToLogin = () => {
    setShowRegisterModal(false);
    setShowLoginModal(true);
  };

  const handleLoginSuccess = (role: "business_owner" | "tourism_staff" | "admin") => {
    setShowLoginModal(false);
    onLogin(role);
  };

  const handleRegisterSuccess = () => {
    setShowRegisterModal(false);
    onRegister();
  };

  const features = [
    {
      icon: FileText,
      title: "Easy Application",
      description: "Submit your accreditation application online with a simple step-by-step process",
    },
    {
      icon: Clock,
      title: "Track Status",
      description: "Monitor your application progress in real-time with notifications",
    },
    {
      icon: CheckCircle,
      title: "Fast Approval",
      description: "Get quick feedback and approval from tourism office staff",
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      description: "Your business information is protected with enterprise-grade security",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <nav className="border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-10 rounded-lg bg-[var(--color-gov-blue)]">
              <Building2 className="size-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg leading-none">LGU Tourism</h2>
              <p className="text-xs text-muted-foreground">Accreditation System</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={handleLoginClick}>
              Login
            </Button>
            <Button onClick={handleRegisterClick}>Get Started</Button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-semibold mb-4">
            Business Accreditation Made Simple
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Get your tourism business officially accredited by the LGU Tourism Office.
            Fast, secure, and fully online.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button size="lg" onClick={handleRegisterClick}>
              Apply for Accreditation
            </Button>
            <Button variant="outline" size="lg" onClick={handleLoginClick}>
              Already have an account?
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index}>
                <CardContent className="p-6 text-center">
                  <div className="flex items-center justify-center size-12 rounded-lg bg-blue-50 text-[var(--color-gov-blue)] mx-auto mb-4">
                    <Icon className="size-6" />
                  </div>
                  <h3 className="mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="bg-gradient-to-br from-[var(--color-gov-blue)] to-[var(--color-gov-blue-dark)] text-white border-0">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl text-white mb-4">Ready to get accredited?</h2>
            <p className="text-white/90 text-lg mb-6 max-w-2xl mx-auto">
              Join hundreds of tourism businesses already accredited with our LGU Tourism Office
            </p>
            <Button variant="secondary" size="lg" onClick={handleRegisterClick}>
              Start Your Application Now
            </Button>
          </CardContent>
        </Card>
      </div>

      <footer className="border-t border-border bg-white mt-16">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center text-sm text-muted-foreground">
          <p>© 2026 LGU Tourism Office. All rights reserved.</p>
        </div>
      </footer>

      {/* Modals */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={handleLoginSuccess}
        onRegisterClick={handleSwitchToRegister}
      />
      <RegistrationModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onRegister={handleRegisterSuccess}
        onLoginClick={handleSwitchToLogin}
      />
    </div>
  );
}
