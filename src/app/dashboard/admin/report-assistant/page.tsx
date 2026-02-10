import { ReportAssistantForm } from './report-assistant-form';
import { pettyCashRecords, scanningProgressRecords } from '@/lib/placeholder-data';

export default function ReportAssistantPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Report Generation Assistant</h1>
        <p className="text-muted-foreground mt-2">
          Use our AI assistant to analyze records and get recommendations for your reports.
        </p>
      </div>
      <ReportAssistantForm
        pettyCashRecords={pettyCashRecords}
        scanningProgressRecords={scanningProgressRecords}
        initialRecommendations={null}
      />
    </div>
  );
}
