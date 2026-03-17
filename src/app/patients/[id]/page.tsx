import { PatientProfile } from "@/components/patients/PatientProfile";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Patient Profile | Nerve Center",
  description: "Patient 360 view, timeline, SOAP notes, and digital vault",
};

export default function PatientPage({ params }: { params: { id: string } }) {
  return <PatientProfile patientId={params.id} />;
}
