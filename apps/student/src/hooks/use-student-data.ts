import { ClassScheduleEntry, CourseInfo, CurrentAndUpcomingClasses, studentApi, StudentDetails, WeeklyTimetable } from '@/lib/student-api';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from './use-auth';

// Hook for fetching student details
export function useStudentDetails() {
  const [data, setData] = useState<StudentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { isLoggedIn } = useAuth();

  const fetchData = useCallback(async () => {
    if (!isLoggedIn) return;

    setIsLoading(true);
    try {
      const result = await studentApi.getStudentDetails();
      setData(result);
      setError(null);
    } catch (err) {
      console.error('Error fetching student details:', err);
      setError(err as Error);
      toast.error('Failed to load your student details');
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}

// Hook for fetching today's classes
export function useTodayClasses() {
  const [data, setData] = useState<ClassScheduleEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { isLoggedIn } = useAuth();

  const fetchData = useCallback(async () => {
    if (!isLoggedIn) return;

    setIsLoading(true);
    try {
      const result = await studentApi.getTodayClasses();
      setData(result);
      setError(null);
    } catch (err) {
      console.error('Error fetching today\'s classes:', err);
      setError(err as Error);
      toast.error('Failed to load today\'s classes');
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    fetchData();

    // Refresh data every 15 minutes to keep it updated
    const intervalId = setInterval(fetchData, 15 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}

// Hook for current and upcoming classes
export function useCurrentClasses() {
  const [data, setData] = useState<CurrentAndUpcomingClasses | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { isLoggedIn } = useAuth();

  const fetchData = useCallback(async () => {
    if (!isLoggedIn) return;

    setIsLoading(true);
    try {
      const result = await studentApi.getCurrentAndUpcomingClasses();
      setData(result);
      setError(null);
    } catch (err) {
      console.error('Error fetching current classes:', err);
      setError(err as Error);
      toast.error('Failed to load current classes');
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    fetchData();

    // Refresh current class data every minute for more accurate updates
    const intervalId = setInterval(fetchData, 60 * 1000);
    return () => clearInterval(intervalId);
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}

// Hook for fetching weekly timetable
export function useWeeklyTimetable() {
  const [data, setData] = useState<WeeklyTimetable | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [loadingProgress, setLoadingProgress] = useState<string>("Starting..."); // Track loading progress
  const { isLoggedIn } = useAuth();

  const fetchData = useCallback(async () => {
    if (!isLoggedIn) return;

    setIsLoading(true);
    setLoadingProgress("Requesting timetable data...");

    // For long-running queries, show progressive loading states
    const loadingInterval = setInterval(() => {
      setLoadingProgress(current => {
        switch(current) {
          case "Requesting timetable data...":
            return "Processing timetable data...";
          case "Processing timetable data...":
            return "Organizing schedule...";
          case "Organizing schedule...":
            return "Almost there...";
          case "Almost there...":
            return "Finalizing your schedule...";
          default:
            return "Still loading, this might take a moment...";
        }
      });
    }, 3000); // Update message every 3 seconds

    try {
      console.log('Fetching weekly timetable data...');
      const result = await studentApi.getWeeklyTimetable();
      console.log('Weekly timetable data received');
      setData(result);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching weekly timetable:', err);

      // Provide more detailed error information
      let errorMessage = "Failed to load your weekly timetable";

      // Extract and format error details
      if (err.message?.includes('timeout')) {
        errorMessage = "Request timed out while loading your timetable. The server is taking longer than expected to respond.";
      } else if (err?.response?.data?.message) {
        errorMessage = `${errorMessage}: ${err.response.data.message}`;
      } else if (err?.message) {
        errorMessage = `${errorMessage}: ${err.message}`;
      }

      setError(err as Error);
      toast.error(errorMessage, {
        description: "Please try again later or contact support if the problem persists.",
        duration: 5000
      });
    } finally {
      clearInterval(loadingInterval);
      setIsLoading(false);
      setLoadingProgress("Complete");
    }
  }, [isLoggedIn]);

  useEffect(() => {
    // Fetch once on load, but don't set up an interval
    // Weekly timetable changes very rarely so no need for auto-refresh
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, loadingProgress, refetch: fetchData };
}

// Hook for fetching day-specific timetable
export function useDayTimetable(day: string) {
  const [data, setData] = useState<ClassScheduleEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { isLoggedIn } = useAuth();

  const fetchData = useCallback(async () => {
    if (!isLoggedIn) return;

    setIsLoading(true);
    try {
      const result = await studentApi.getDayTimetable(day);
      setData(result);
      setError(null);
    } catch (err) {
      console.error(`Error fetching timetable for ${day}:`, err);
      setError(err as Error);
      toast.error(`Failed to load timetable for ${day}`);
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn, day]);

  useEffect(() => {
    fetchData();
    // No auto-refresh for day timetable since it changes rarely
  }, [fetchData, day]);

  return { data, isLoading, error, refetch: fetchData };
}

// Hook for fetching all student courses
export function useStudentCourses() {
  const [data, setData] = useState<CourseInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { isLoggedIn } = useAuth();

  const fetchData = useCallback(async () => {
    if (!isLoggedIn) return;

    setIsLoading(true);
    try {
      const result = await studentApi.getAllCourses();
      setData(result);
      setError(null);
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError(err as Error);
      toast.error('Failed to load your courses');
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    // Fetch once on load, but don't set up an interval
    // Course data changes very rarely so no need for auto-refresh
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}
