"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/axios";
import { studentApi } from "@/lib/student-api";
import { Loader2 } from "lucide-react";
import { useState } from "react";

export default function DebugTimetablePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testTimetableAPI = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Log API base URL
      console.log("API Base URL:", api.defaults.baseURL);

      // First test a direct API call
      console.log("Testing direct API call...");
      const response = await api.get('/student/timetable');
      console.log("Direct API call result:", response);

      // Then test through the service function
      console.log("Testing through service function...");
      const data = await studentApi.getWeeklyTimetable();
      console.log("Service function result:", data);

      setResult(data);
      setError(null);
    } catch (err: any) {
      console.error("Error testing API:", err);
      setResult(null);
      setError(err?.message || "Unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">API Debug: Timetable Endpoint</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Test Timetable API</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            onClick={testTimetableAPI}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              "Test Timetable API"
            )}
          </Button>

          {error && (
            <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-md text-red-800 dark:text-red-300">
              <p className="font-medium">Error:</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {result && (
            <div className="mt-4">
              <p className="font-medium mb-2">API Result:</p>
              <pre className="bg-muted p-3 rounded-md text-xs overflow-auto max-h-96">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Debugging Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Check that your backend server is running at <code>{api.defaults.baseURL?.split('/api')[0]}</code></li>
            <li>Verify the API endpoint is correctly implemented and returns data in the expected format</li>
            <li>Check your authentication status - the API call might be failing due to expired tokens</li>
            <li>Examine the browser's network tab for detailed error information</li>
            <li>Check the browser console for any additional error logs</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
