export interface ClassDetails {
  componentId: string;
  courseName: string;
  courseCode: string;
  startTime: string;
  endTime: string;
  section: {
    name: string;
  };
  group?: {
    name: string;
  } | null;
  roomNumber: string;
  componentType: string;
}

export interface WeeklySchedule {
  [key: string]: ClassDetails[];
}

export interface CurrentClassData {
  currentClass: ClassDetails | null;
  upcomingClasses: ClassDetails[];
}
