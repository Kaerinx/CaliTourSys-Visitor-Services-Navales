import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { RefreshCw, AlertCircle, CheckCircle, Calendar, Building2 } from "lucide-react";
import { formatDate } from "../../../lib/utils";
import { businessOwnerApplications } from "../../data/businessOwnerApplications";

interface RenewalPageProps {
  onRenewNow: () => void;
}

export function RenewalPage({ onRenewNow }: RenewalPageProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parseLocalDate = (date: string) => new Date(`${date}T00:00:00`);
  const getDaysRemaining = (expiryDate: string) =>
    Math.ceil(
      (parseLocalDate(expiryDate).getTime() - today.getTime()) /
        (1000 * 60 * 60 * 24)
    );

  const accreditations = businessOwnerApplications
    .filter((application) => application.validUntil)
    .map((application) => {
      const expiryDate = application.validUntil || "";
      const daysRemaining = getDaysRemaining(expiryDate);
      const status =
        daysRemaining < 0
          ? "expired"
          : daysRemaining <= 60
          ? "expiring_soon"
          : "active";

      return {
        id: application.id.replace("APP", "ACC"),
        businessName: application.businessName,
        issueDate: application.lastUpdate,
        expiryDate,
        status,
        daysRemaining,
      };
    })
    .sort((first, second) => first.daysRemaining - second.daysRemaining);

  const urgentAccreditation =
    accreditations.find((accreditation) => accreditation.status === "expired") ||
    accreditations.find(
      (accreditation) => accreditation.status === "expiring_soon"
    );

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1>Accreditation Renewal</h1>
        <p className="text-muted-foreground mt-1">
          Manage and renew your business accreditations
        </p>
      </div>

      {urgentAccreditation ? (
        <Card
          className={
            urgentAccreditation.status === "expired"
              ? "bg-red-50 border-red-200"
              : "bg-orange-50 border-orange-200"
          }
        >
          <CardContent className="p-6 flex items-start gap-4">
            <div
              className={
                urgentAccreditation.status === "expired"
                  ? "flex items-center justify-center size-12 rounded-lg bg-red-100 text-red-600 shrink-0"
                  : "flex items-center justify-center size-12 rounded-lg bg-orange-100 text-orange-600 shrink-0"
              }
            >
              <AlertCircle className="size-6" />
            </div>
            <div className="flex-1">
              <h3
                className={
                  urgentAccreditation.status === "expired"
                    ? "text-red-900 mb-2"
                    : "text-orange-900 mb-2"
                }
              >
                {urgentAccreditation.status === "expired"
                  ? "Action Required: Accreditation Expired"
                  : "Action Required: Renewal Due Soon"}
              </h3>
              <p
                className={
                  urgentAccreditation.status === "expired"
                    ? "text-sm text-red-800 mb-4"
                    : "text-sm text-orange-800 mb-4"
                }
              >
                {urgentAccreditation.status === "expired"
                  ? `Your accreditation for ${
                      urgentAccreditation.businessName
                    } expired on ${formatDate(
                      urgentAccreditation.expiryDate
                    )}. Submit a renewal application to restore active status.`
                  : `Your accreditation for ${
                      urgentAccreditation.businessName
                    } expires in ${
                      urgentAccreditation.daysRemaining
                    } days on ${formatDate(
                      urgentAccreditation.expiryDate
                    )}. Start your renewal process now to avoid service interruption.`}
              </p>
              <Button variant="outline" onClick={onRenewNow}>
                <RefreshCw className="size-4 mr-2" />
                Renew Now
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-6 flex items-start gap-4">
            <div className="flex items-center justify-center size-12 rounded-lg bg-green-100 text-green-600 shrink-0">
              <CheckCircle className="size-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-green-900 mb-2">Accreditations Up to Date</h3>
              <p className="text-sm text-green-800">
                No accreditation is due for renewal within the next 60 days.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {accreditations.map((acc) => (
          <Card key={acc.id}>
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-start gap-4 flex-1">
                  <div className="flex items-center justify-center size-12 rounded-lg bg-blue-50 text-[var(--color-gov-blue)] shrink-0">
                    <Building2 className="size-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-1">{acc.businessName}</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Accreditation ID: {acc.id}
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Issue Date</p>
                        <p className="text-sm font-medium flex items-center gap-1">
                          <Calendar className="size-3" />
                          {formatDate(acc.issueDate)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Expiry Date</p>
                        <p className="text-sm font-medium flex items-center gap-1">
                          <Calendar className="size-3" />
                          {formatDate(acc.expiryDate)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Days Remaining</p>
                        <p className="text-sm font-medium">
                          {acc.daysRemaining < 0
                            ? `${Math.abs(acc.daysRemaining)} days overdue`
                            : `${acc.daysRemaining} days`}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Validity Period</span>
                        <span className="font-medium">
                          {Math.max(
                            0,
                            Math.min(100, Math.round((acc.daysRemaining / 365) * 100))
                          )}
                          % remaining
                        </span>
                      </div>
                      <Progress
                        value={Math.max(0, Math.min(365, acc.daysRemaining))}
                        max={365}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3 shrink-0">
                  {acc.status === "expired" ? (
                    <Badge variant="expired" className="whitespace-nowrap">
                      <AlertCircle className="size-3 mr-1" />
                      Expired
                    </Badge>
                  ) : acc.status === "expiring_soon" ? (
                    <Badge variant="revision" className="whitespace-nowrap">
                      <AlertCircle className="size-3 mr-1" />
                      Expiring Soon
                    </Badge>
                  ) : (
                    <Badge variant="approved" className="whitespace-nowrap">
                      <CheckCircle className="size-3 mr-1" />
                      Active
                    </Badge>
                  )}
                  <Button
                    variant={acc.status === "active" ? "outline" : "primary"}
                    onClick={onRenewNow}
                  >
                    <RefreshCw className="size-4 mr-2" />
                    {acc.status === "active" ? "Renew Early" : "Renew Now"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Renewal Process</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center size-6 rounded-full bg-[var(--color-gov-blue)] text-white shrink-0 mt-0.5">
              <span className="text-xs">1</span>
            </div>
            <div>
              <p className="font-medium mb-1">Start Renewal Application</p>
              <p className="text-sm text-muted-foreground">
                Click "Renew Now" to begin your renewal application
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center size-6 rounded-full bg-[var(--color-gov-blue)] text-white shrink-0 mt-0.5">
              <span className="text-xs">2</span>
            </div>
            <div>
              <p className="font-medium mb-1">Update Business Information</p>
              <p className="text-sm text-muted-foreground">
                Review and update your business details if needed
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center size-6 rounded-full bg-[var(--color-gov-blue)] text-white shrink-0 mt-0.5">
              <span className="text-xs">3</span>
            </div>
            <div>
              <p className="font-medium mb-1">Upload Updated Documents</p>
              <p className="text-sm text-muted-foreground">
                Submit current versions of all required documents
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center size-6 rounded-full bg-[var(--color-gov-blue)] text-white shrink-0 mt-0.5">
              <span className="text-xs">4</span>
            </div>
            <div>
              <p className="font-medium mb-1">Wait for Approval</p>
              <p className="text-sm text-muted-foreground">
                Tourism staff will review your renewal within 5-7 business days
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
