import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select } from "../ui/select";
import { Textarea } from "../ui/textarea";
import { Check, Edit, Globe, Mail, MapPin, Phone, X } from "lucide-react";
import { Badge } from "../ui/badge";
import { toast } from "sonner";

const businessTypeGroups = [
  {
    label: "Accommodation Establishments",
    options: [
      "Hotel",
      "Resort",
      "Apartment Hotel",
      "Mabuhay Accommodation",
      "Homestay",
    ],
  },
  {
    label: "Travel and Tour Services",
    options: [
      "Travel and Tour Agency",
      "Travel Agency",
      "Tour Operator",
      "Online Travel Agency",
    ],
  },
  {
    label: "Tourist Transport Operators",
    options: [
      "Tourist Land Transport Operator",
      "Tourist Water Transport Operator",
      "Tourist Air Transport Operator",
      "Motorized Banca",
    ],
  },
  {
    label: "Meetings, Incentives, Conventions and Exhibitions (MICE)",
    options: ["MICE Organizer", "MICE Facility/ Venue"],
  },
  {
    label: "Adventure/ Sports and Ecotourism Facilities",
    options: ["Adventure/ Sports and Ecotourism Facility"],
  },
  {
    label: "Tourism-related Enterprises",
    options: [
      "Restaurant",
      "Tourism Training Center",
      "Target Shooting Range",
      "Department Store/ Shopping Mall/ Tourist Shop/ Specialty Shop",
      "Farm Tourism Camp",
      "Gallery/ Museum",
      "Tourism Entertainment Complex",
      "Tourism Recreation Center",
      "Zoo",
      "Rest Area/ Restroom",
      "Surfing Camp",
    ],
  },
  {
    label: "Health and Wellness Services",
    options: ["Ambulatory Clinic", "Spa", "Tertiary Hospital"],
  },
];

const initialProfile = {
  businessName: "Sunset Beach Resort",
  businessType: "Resort",
  dtiRegistrationNumber: "123-456-789-012",
  businessPermitNumber: "BP-2026-004218",
  yearEstablished: "2020",
  businessDescription:
    "A beachfront resort offering luxury accommodations, water sports activities, and fine dining experiences.",
  ownerFullName: "John Martinez",
  contactNumber: "+63 912 345 6789",
  emailAddress: "john@sunsetresort.com",
  website: "https://sunsetresort.com",
  streetAddress: "123 Beach Road, Brgy. Coastal",
  cityMunicipality: "Tourism City",
  province: "Province Name",
  postalCode: "4000",
};

type BusinessProfileForm = typeof initialProfile;
type BusinessProfileField = keyof BusinessProfileForm;

export function BusinessProfile() {
  const [profile, setProfile] = useState<BusinessProfileForm>(initialProfile);
  const [draftProfile, setDraftProfile] = useState<BusinessProfileForm>(initialProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("May 10, 2026");

  const displayedProfile = isEditing ? draftProfile : profile;

  const handleEdit = () => {
    setDraftProfile(profile);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setDraftProfile(profile);
    setIsEditing(false);
  };

  const handleSave = () => {
    setProfile(draftProfile);
    setIsEditing(false);
    setLastUpdated(
      new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    );
    toast.success("Business profile updated");
  };

  const updateDraft = (field: BusinessProfileField, value: string) => {
    setDraftProfile((current) => ({
      ...current,
      [field]: value,
    }));
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Business Profile</h1>
          <p className="text-muted-foreground mt-1">
            Manage your business information and contact details
          </p>
        </div>
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleCancel}>
              <X className="size-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Check className="size-4 mr-2" />
              Save Changes
            </Button>
          </div>
        ) : (
          <Button onClick={handleEdit}>
            <Edit className="size-4 mr-2" />
            Edit Profile
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Business Name</Label>
                <Input
                  value={displayedProfile.businessName}
                  onChange={(event) => updateDraft("businessName", event.target.value)}
                  readOnly={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label>Business Type</Label>
                <Select
                  value={displayedProfile.businessType}
                  onChange={(event) => updateDraft("businessType", event.target.value)}
                  disabled={!isEditing}
                >
                  {businessTypeGroups.map((group) => (
                    <optgroup key={group.label} label={group.label}>
                      {group.options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>DTI Registration Number</Label>
                <Input
                  value={displayedProfile.dtiRegistrationNumber}
                  onChange={(event) =>
                    updateDraft("dtiRegistrationNumber", event.target.value)
                  }
                  readOnly={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label>Business Permit Number</Label>
                <Input
                  value={displayedProfile.businessPermitNumber}
                  onChange={(event) =>
                    updateDraft("businessPermitNumber", event.target.value)
                  }
                  readOnly={!isEditing}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Year Established</Label>
                <Input
                  value={displayedProfile.yearEstablished}
                  onChange={(event) => updateDraft("yearEstablished", event.target.value)}
                  readOnly={!isEditing}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Business Description</Label>
              <Textarea
                value={displayedProfile.businessDescription}
                onChange={(event) =>
                  updateDraft("businessDescription", event.target.value)
                }
                rows={4}
                readOnly={!isEditing}
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Completion</span>
                <Badge variant="approved">100%</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Verification</span>
                <Badge variant="approved">Verified</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Last Updated</span>
                <span className="text-sm">{lastUpdated}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <p className="text-sm text-blue-900">
                Keep your business profile up to date to ensure smooth processing of your accreditation applications.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Owner Full Name</Label>
              <Input
                value={displayedProfile.ownerFullName}
                onChange={(event) => updateDraft("ownerFullName", event.target.value)}
                readOnly={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label>Contact Number</Label>
              <div className="flex items-center gap-2">
                <Phone className="size-4 text-muted-foreground" />
                <Input
                  value={displayedProfile.contactNumber}
                  onChange={(event) => updateDraft("contactNumber", event.target.value)}
                  readOnly={!isEditing}
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email Address</Label>
              <div className="flex items-center gap-2">
                <Mail className="size-4 text-muted-foreground" />
                <Input
                  value={displayedProfile.emailAddress}
                  onChange={(event) => updateDraft("emailAddress", event.target.value)}
                  readOnly={!isEditing}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Website</Label>
              <div className="flex items-center gap-2">
                <Globe className="size-4 text-muted-foreground" />
                <Input
                  value={displayedProfile.website}
                  onChange={(event) => updateDraft("website", event.target.value)}
                  readOnly={!isEditing}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Business Address</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Street Address</Label>
            <div className="flex items-center gap-2">
              <MapPin className="size-4 text-muted-foreground" />
              <Input
                value={displayedProfile.streetAddress}
                onChange={(event) => updateDraft("streetAddress", event.target.value)}
                readOnly={!isEditing}
                className="flex-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>City/Municipality</Label>
              <Input
                value={displayedProfile.cityMunicipality}
                onChange={(event) => updateDraft("cityMunicipality", event.target.value)}
                readOnly={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label>Province</Label>
              <Input
                value={displayedProfile.province}
                onChange={(event) => updateDraft("province", event.target.value)}
                readOnly={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label>Postal Code</Label>
              <Input
                value={displayedProfile.postalCode}
                onChange={(event) => updateDraft("postalCode", event.target.value)}
                readOnly={!isEditing}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
