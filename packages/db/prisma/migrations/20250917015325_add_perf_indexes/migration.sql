-- CreateIndex
CREATE INDEX "AttendanceRecord_attendanceSessionId_idx" ON "AttendanceRecord"("attendanceSessionId");

-- CreateIndex
CREATE INDEX "AttendanceRecord_studentId_idx" ON "AttendanceRecord"("studentId");

-- CreateIndex
CREATE INDEX "AttendanceSession_componentId_idx" ON "AttendanceSession"("componentId");

-- CreateIndex
CREATE INDEX "AttendanceSession_date_idx" ON "AttendanceSession"("date");

-- CreateIndex
CREATE INDEX "AttendanceSession_startTime_idx" ON "AttendanceSession"("startTime");

-- CreateIndex
CREATE INDEX "ClassSchedule_componentId_idx" ON "ClassSchedule"("componentId");

-- CreateIndex
CREATE INDEX "ClassSchedule_dayOfWeek_idx" ON "ClassSchedule"("dayOfWeek");

-- CreateIndex
CREATE INDEX "ClassSchedule_startTime_idx" ON "ClassSchedule"("startTime");

-- CreateIndex
CREATE INDEX "CourseComponent_sectionCourseId_idx" ON "CourseComponent"("sectionCourseId");

-- CreateIndex
CREATE INDEX "CourseComponent_teacherId_idx" ON "CourseComponent"("teacherId");

-- CreateIndex
CREATE INDEX "CourseComponent_groupId_idx" ON "CourseComponent"("groupId");

-- CreateIndex
CREATE INDEX "Group_sectionId_idx" ON "Group"("sectionId");

-- CreateIndex
CREATE INDEX "Section_batchId_idx" ON "Section"("batchId");

-- CreateIndex
CREATE INDEX "SectionCourse_teacherId_academicTermId_idx" ON "SectionCourse"("teacherId", "academicTermId");

-- CreateIndex
CREATE INDEX "SectionCourse_sectionId_idx" ON "SectionCourse"("sectionId");

-- CreateIndex
CREATE INDEX "SectionCourse_courseId_idx" ON "SectionCourse"("courseId");

-- CreateIndex
CREATE INDEX "SectionCourse_academicTermId_idx" ON "SectionCourse"("academicTermId");

-- CreateIndex
CREATE INDEX "User_sectionId_idx" ON "User"("sectionId");

-- CreateIndex
CREATE INDEX "User_groupId_idx" ON "User"("groupId");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");
