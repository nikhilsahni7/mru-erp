import { prisma } from "db";

async function main() {
  const componentId = "b66d7997-3a77-4c0c-afbd-4b5b5e9e8baf";

  console.log(`Checking component: ${componentId}`);

  const component = await prisma.courseComponent.findUnique({
    where: { id: componentId },
    include: {
      sectionCourse: {
        include: {
          course: true,
          section: true
        }
      },
      group: true,
      teacher: true,
      schedules: true
    }
  });

  if (!component) {
    console.log("Component not found!");
    return;
  }

  console.log(`Component: ${component.componentType} for ${component.sectionCourse.course.name}`);
  console.log(`Group: ${component.group?.name || 'No specific group'}`);
  console.log(`Section: ${component.sectionCourse.section.name}`);
  console.log(`Teacher: ${component.teacher?.name || 'No specific teacher'}`);

  console.log("\nClass Schedules:");
  component.schedules.forEach(schedule => {
    console.log(`- Day: ${schedule.dayOfWeek}, Time: ${new Date(schedule.startTime).toLocaleTimeString()} - ${new Date(schedule.endTime).toLocaleTimeString()}, Room: ${schedule.roomNumber}`);
  });

  // Check if there are any other components for the same course with different groups
  const otherComponents = await prisma.courseComponent.findMany({
    where: {
      sectionCourseId: component.sectionCourseId,
      id: { not: componentId }
    },
    include: {
      group: true,
      schedules: true
    }
  });

  if (otherComponents.length > 0) {
    console.log("\nOther components for the same course:");
    for (const comp of otherComponents) {
      console.log(`- Component ID: ${comp.id}`);
      console.log(`  Type: ${comp.componentType}`);
      console.log(`  Group: ${comp.group?.name || 'No specific group'}`);

      console.log("  Schedules:");
      comp.schedules.forEach(schedule => {
        console.log(`  - Day: ${schedule.dayOfWeek}, Time: ${new Date(schedule.startTime).toLocaleTimeString()} - ${new Date(schedule.endTime).toLocaleTimeString()}, Room: ${schedule.roomNumber}`);
      });
    }
  }

  // Exit the process
  process.exit(0);
}

main().catch(e => {
  console.error("Error:", e);
  process.exit(1);
});
