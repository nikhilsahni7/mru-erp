"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  GroupUpdate,
  Student,
  useSectionsWithStudents,
  useUpdateStudentGroups,
} from "@/hooks/use-group-management";
import { ArrowLeft, Loader2, Save, Search, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function GroupManagementPage() {
  const { data: sections, isLoading } = useSectionsWithStudents();
  const updateGroupsMutation = useUpdateStudentGroups();

  const [selectedSection, setSelectedSection] = useState<string>("");
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(
    new Set()
  );
  const [pendingChanges, setPendingChanges] = useState<
    Map<string, string | null>
  >(new Map());
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [groupFilter, setGroupFilter] = useState<string>("all"); // "all", "g1", "g2", "no-group"

  // Set first section as default when data loads
  useEffect(() => {
    if (sections && sections.length > 0 && !selectedSection) {
      setSelectedSection(sections[0].id);
    }
  }, [sections, selectedSection]);

  // Reset filters and selections when changing sections
  useEffect(() => {
    setSearchQuery("");
    setGroupFilter("all");
    setSelectedStudents(new Set());
  }, [selectedSection]);

  const currentSection = sections?.find((s) => s.id === selectedSection);

  // Helper function to get effective group (with pending changes applied)
  const getEffectiveGroup = (student: Student) => {
    if (pendingChanges.has(student.id)) {
      const newGroupId = pendingChanges.get(student.id);
      if (newGroupId === null) return null;
      return (
        currentSection?.availableGroups.find((g) => g.id === newGroupId) || null
      );
    }
    return student.group;
  };

  // Filter students based on search query and group filter
  const getFilteredStudents = () => {
    if (!currentSection) return [];

    return currentSection.students.filter((student) => {
      // Search filter
      const matchesSearch =
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.rollNo.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Group filter
      const effectiveGroup = getEffectiveGroup(student);

      if (groupFilter === "all") return true;
      if (groupFilter === "no-group") return !effectiveGroup;
      if (groupFilter === "g1") return effectiveGroup?.name === "G1";
      if (groupFilter === "g2") return effectiveGroup?.name === "G2";

      return true;
    });
  };

  const filteredStudents = getFilteredStudents();

  const handleSelectAll = (checked: boolean) => {
    if (!currentSection) return;

    if (checked) {
      // Select all filtered students
      const filteredStudentIds = new Set(filteredStudents.map((s) => s.id));
      setSelectedStudents(filteredStudentIds);
    } else {
      setSelectedStudents(new Set());
    }
  };

  const handleSelectStudent = (studentId: string, checked: boolean) => {
    const newSelected = new Set(selectedStudents);
    if (checked) {
      newSelected.add(studentId);
    } else {
      newSelected.delete(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const handleGroupChange = (groupId: string | null) => {
    if (selectedStudents.size === 0) {
      toast.error("Please select at least one student");
      return;
    }

    const newChanges = new Map(pendingChanges);
    selectedStudents.forEach((studentId) => {
      newChanges.set(studentId, groupId);
    });
    setPendingChanges(newChanges);

    toast.success(
      `Prepared group change for ${selectedStudents.size} student(s)`
    );
  };

  const handleSaveChanges = async () => {
    if (pendingChanges.size === 0) {
      toast.error("No changes to save");
      return;
    }

    const updates: GroupUpdate[] = Array.from(pendingChanges.entries()).map(
      ([studentId, groupId]) => ({
        studentId,
        groupId,
      })
    );

    await updateGroupsMutation.mutateAsync(updates);

    // Clear selections and pending changes after successful save
    setPendingChanges(new Map());
    setSelectedStudents(new Set());
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        <p className="mt-4 text-muted-foreground">Loading sections...</p>
      </div>
    );
  }

  if (!sections || sections.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Student Group Management</h1>
            <p className="text-muted-foreground">
              Manage student group assignments
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>
                No sections found. You may not be teaching any classes this
                term.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Student Group Management</h1>
          <p className="text-muted-foreground">
            Manage student group assignments for your classes
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          {pendingChanges.size > 0 && (
            <Button
              onClick={handleSaveChanges}
              disabled={updateGroupsMutation.isPending}
            >
              {updateGroupsMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes ({pendingChanges.size})
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <Tabs value={selectedSection} onValueChange={setSelectedSection}>
        <TabsList
          className="grid w-full"
          style={{
            gridTemplateColumns: `repeat(${sections.length}, minmax(0, 1fr))`,
          }}
        >
          {sections.map((section) => (
            <TabsTrigger key={section.id} value={section.id}>
              {section.program.code} - {section.name} (Sem {section.semester})
            </TabsTrigger>
          ))}
        </TabsList>

        {sections.map((section) => (
          <TabsContent
            key={section.id}
            value={section.id}
            className="space-y-4"
          >
            <Card>
              <CardHeader>
                <CardTitle>
                  {section.program.code} - Section {section.name}
                </CardTitle>
                <CardDescription>
                  {section.program.name} - Batch {section.batch} - Semester{" "}
                  {section.semester}
                  <br />
                  Total Students: {section.totalStudents}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search and Filter Controls */}
                <div className="flex flex-col sm:flex-row gap-4 p-4 bg-secondary/30 rounded-lg border">
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-2 block">
                      Search Students
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by name or roll number..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-2 block">
                      Filter by Group
                    </label>
                    <div className="flex gap-2">
                      <Button
                        variant={groupFilter === "all" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setGroupFilter("all")}
                      >
                        All
                      </Button>
                      <Button
                        variant={groupFilter === "g1" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setGroupFilter("g1")}
                      >
                        G1
                      </Button>
                      <Button
                        variant={groupFilter === "g2" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setGroupFilter("g2")}
                      >
                        G2
                      </Button>
                      <Button
                        variant={
                          groupFilter === "no-group" ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setGroupFilter("no-group")}
                      >
                        No Group
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Group Assignment Controls */}
                <div className="flex flex-wrap gap-4 items-end p-4 bg-secondary/50 rounded-lg">
                  <div className="flex-1 min-w-[200px]">
                    <label className="text-sm font-medium mb-2 block">
                      Selected: {selectedStudents.size} of{" "}
                      {filteredStudents.length} student(s)
                    </label>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSelectAll(true)}
                      >
                        Select All{" "}
                        {groupFilter !== "all"
                          ? `(${groupFilter.toUpperCase()})`
                          : ""}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSelectAll(false)}
                      >
                        Clear Selection
                      </Button>
                    </div>
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <label className="text-sm font-medium mb-2 block">
                      Assign to Group
                    </label>
                    <div className="flex gap-2">
                      {section.availableGroups.map((group) => (
                        <Button
                          key={group.id}
                          variant="outline"
                          size="sm"
                          onClick={() => handleGroupChange(group.id)}
                          disabled={selectedStudents.size === 0}
                        >
                          {group.name}
                        </Button>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGroupChange(null)}
                        disabled={selectedStudents.size === 0}
                      >
                        No Group
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Student List */}
                <div className="border rounded-lg overflow-hidden">
                  {filteredStudents.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No students found matching your filters</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-secondary">
                          <tr>
                            <th className="text-left p-3 font-medium">
                              <Checkbox
                                checked={
                                  selectedStudents.size ===
                                    filteredStudents.length &&
                                  filteredStudents.length > 0
                                }
                                onCheckedChange={handleSelectAll}
                              />
                            </th>
                            <th className="text-left p-3 font-medium">
                              Roll No
                            </th>
                            <th className="text-left p-3 font-medium">Name</th>
                            <th className="text-left p-3 font-medium">Email</th>
                            <th className="text-left p-3 font-medium">
                              Current Group
                            </th>
                            <th className="text-left p-3 font-medium">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredStudents.map((student, index) => {
                            const effectiveGroup = getEffectiveGroup(student);
                            const hasChange = pendingChanges.has(student.id);

                            return (
                              <tr
                                key={student.id}
                                className={`border-t ${
                                  hasChange
                                    ? "bg-yellow-50 dark:bg-yellow-950/20"
                                    : ""
                                } ${
                                  index % 2 === 0
                                    ? "bg-background"
                                    : "bg-secondary/30"
                                }`}
                              >
                                <td className="p-3">
                                  <Checkbox
                                    checked={selectedStudents.has(student.id)}
                                    onCheckedChange={(checked) =>
                                      handleSelectStudent(
                                        student.id,
                                        checked as boolean
                                      )
                                    }
                                  />
                                </td>
                                <td className="p-3 font-mono text-sm">
                                  {student.rollNo}
                                </td>
                                <td className="p-3">{student.name}</td>
                                <td className="p-3 text-sm text-muted-foreground">
                                  {student.email || "N/A"}
                                </td>
                                <td className="p-3">
                                  <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                      effectiveGroup
                                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                        : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                                    }`}
                                  >
                                    {effectiveGroup?.name || "No Group"}
                                  </span>
                                </td>
                                <td className="p-3">
                                  {hasChange && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                      Pending
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
