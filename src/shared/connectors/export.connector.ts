import { exportReportsPackage, type ReportPackageInput } from "@/features/reports";

export function runExportConnector(input: ReportPackageInput) {
  return exportReportsPackage(input);
}
