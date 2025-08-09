import React from 'react';
import { Zap, FileText, AlertCircle } from 'lucide-react';

export default function Landing(): JSX.Element {
  return (
    <section className="bg-white rounded-lg shadow-sm p-8 text-center">
      <h2 className="text-3xl font-bold text-gray-900 mb-3">AI Cover Letter & Resume Optimizer</h2>
      <p className="text-gray-600 mb-6">
        Paste your job description and CV to get an instant match decision, a tailored cover letter, and ATS‑friendly resume improvements.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <a href="#get-started" className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">Get Started</a>
        <a href="/pricing" className="px-6 py-3 bg-gray-100 text-gray-900 font-semibold rounded-lg hover:bg-gray-200">View Pricing</a>
      </div>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
        <div className="flex items-start gap-3">
          <Zap className="w-5 h-5 text-blue-600 mt-1" />
          <div>
            <div className="font-semibold text-gray-900">Instant Job Match</div>
            <div className="text-sm text-gray-600">Quickly see if the role fits your background.</div>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-blue-600 mt-1" />
          <div>
            <div className="font-semibold text-gray-900">Tailored Cover Letters</div>
            <div className="text-sm text-gray-600">Personalized letters aligned to each job.</div>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-1" />
          <div>
            <div className="font-semibold text-gray-900">ATS‑Optimized Resume</div>
            <div className="text-sm text-gray-600">Improve bullets while preserving facts & order.</div>
          </div>
        </div>
      </div>
      <div className="mt-6 text-sm text-gray-500">No login required • 3 free runs/day • Privacy‑first</div>
    </section>
  );
}


