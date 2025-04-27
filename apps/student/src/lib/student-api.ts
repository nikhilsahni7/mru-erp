import { api } from './axios';

// Type definitions for API responses
export type StudentDetails = {
  id: string;
  name: string;
  rollNo: string;
  email: string | null;
  phone: string | null;
  clg: string;
  branch: string;
  section: {
    id: string;
    name: string;
    semester: number;
    batch: {
      year: number;
      program: {
        name: string;
        code: string;
        department: {
          name: string;
          code: string;
        };
      };
    };
  } | null;
  group: {
    id: string;
    name: string;
  } | null;
};

export type ClassScheduleEntry = {
  courseCode: string;
  courseName: string;
  componentType: string;
  startTime: string;
  endTime: string;
  roomNumber: string;
  teacher: {
    id: string;
    name: string;
  };
};

export type CurrentAndUpcomingClasses = {
  currentClass: ClassScheduleEntry | null;
  upcomingClasses: ClassScheduleEntry[];
};

export type WeeklyTimetable = {
  MONDAY: ClassScheduleEntry[];
  TUESDAY: ClassScheduleEntry[];
  WEDNESDAY: ClassScheduleEntry[];
  THURSDAY: ClassScheduleEntry[];
  FRIDAY: ClassScheduleEntry[];
  SATURDAY: ClassScheduleEntry[];
  SUNDAY: ClassScheduleEntry[];
};

export type CourseInfo = {
  id: string;
  code: string;
  name: string;
  credits: number;
  mainTeacher: {
    id: string;
    name: string;
  };
  componentTypes: {
    type: string;
    teacher: {
      id: string;
      name: string;
    };
  }[];
};

// Service class for student API calls
export const studentApi = {
  // Get student profile details
  async getStudentDetails(): Promise<StudentDetails> {
    const response = await api.get('/student/details');
    return response.data;
  },

  // Get today's class schedule
  async getTodayClasses(): Promise<ClassScheduleEntry[]> {
    const response = await api.get('/student/today');
    return response.data;
  },

  // Get current and upcoming classes
  async getCurrentAndUpcomingClasses(): Promise<CurrentAndUpcomingClasses> {
    const response = await api.get('/student/current');
    return response.data;
  },

  // Get timetable for a specific day
  async getDayTimetable(day: string): Promise<ClassScheduleEntry[]> {
    const response = await api.get(`/student/timetable/${day}`);
    return response.data;
  },

  // Get the complete weekly timetable
  async getWeeklyTimetable(): Promise<WeeklyTimetable> {
    try {
      // Log the full URL for debugging purposes
      const endpoint = '/student/timetable';
      console.log(`API call: Fetching weekly timetable from ${api.defaults.baseURL}${endpoint}`);

      // Create a custom request with longer timeout for this specific heavy query
      console.log('Using extended timeout (60s) for weekly timetable fetch');
      const response = await api.get(endpoint, {
        timeout: 60000 // 60 seconds timeout for this heavy query
      });

      console.log('API response status:', response.status);

      // Check if the response data has the expected structure
      const data = response.data;
      if (!data || typeof data !== 'object') {
        console.error('Invalid API response format:', data);
        // Create empty timetable structure as fallback
        const emptyTimetable: WeeklyTimetable = {
          MONDAY: [],
          TUESDAY: [],
          WEDNESDAY: [],
          THURSDAY: [],
          FRIDAY: [],
          SATURDAY: [],
          SUNDAY: []
        };

        // If we have partial data, use what we can
        if (data) {
          const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
          days.forEach(day => {
            if (data[day] && Array.isArray(data[day])) {
              emptyTimetable[day as keyof WeeklyTimetable] = data[day];
            }
          });
        }

        console.log('Created fallback timetable:', emptyTimetable);
        return emptyTimetable;
      }

      // Validate the response data structure
      const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
      let isFullyValid = true;

      // Create a complete timetable with defaults for missing days
      const completeTimetable: WeeklyTimetable = {
        MONDAY: [],
        TUESDAY: [],
        WEDNESDAY: [],
        THURSDAY: [],
        FRIDAY: [],
        SATURDAY: [],
        SUNDAY: []
      };

      // Fill in the data we have
      days.forEach(day => {
        if (data[day] && Array.isArray(data[day])) {
          completeTimetable[day as keyof WeeklyTimetable] = data[day];
        } else {
          console.warn(`Missing or invalid day data for ${day}, using empty array`);
          isFullyValid = false;
        }
      });

      if (!isFullyValid) {
        console.warn('API response missing some expected day data. Using partial data with fallbacks.');
      }

      return completeTimetable;
    } catch (error) {
      console.error('Error in getWeeklyTimetable API call:', error);
      // On complete failure, return empty timetable structure
      const emptyTimetable: WeeklyTimetable = {
        MONDAY: [],
        TUESDAY: [],
        WEDNESDAY: [],
        THURSDAY: [],
        FRIDAY: [],
        SATURDAY: [],
        SUNDAY: []
      };

      // Rethrow to allow calling code to handle the error
      throw error;
    }
  },

  // Get all courses
  async getAllCourses(): Promise<CourseInfo[]> {
    const response = await api.get('/student/courses');
    return response.data;
  }
};
