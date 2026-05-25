/**
 * Web Vitals reporting — Client Component
 *
 * Logs Core Web Vitals in production. Can be extended to send to an analytics
 * endpoint when NEXT_PUBLIC_ANALYTICS is configured.
 */
"use client";

import { useReportWebVitals } from "next/web-vitals";

export function WebVitals() {
  useReportWebVitals((metric) => {
    if (process.env.NODE_ENV === "production") {
      console.log(metric.name, metric.value, metric.rating);
    }
  });
  return null;
}
