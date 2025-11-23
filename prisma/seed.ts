// prisma/seed.ts
import { PrismaClient, UserRole, SubjectType, ProficiencyLevel, InstallmentType, PaymentMode, FeeStatus, DiscountType, ReminderType, WeekDay, AttendanceStatus, Gender, BloodGroup, StudentStatus, RoomType, HolidayType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = 'Password123!';
const PASSWORD_CACHE: Record<string, string> = {};

async function hashPassword(password: string): Promise<string> {
  if (PASSWORD_CACHE[password]) return PASSWORD_CACHE[password];
  const hashed = await bcrypt.hash(password, 12);
  PASSWORD_CACHE[password] = hashed;
  return hashed;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

async function createTeacher(
  email: string, 
  teacherId: string, 
  firstName: string, 
  lastName: string, 
  schoolId: string,
  departmentId: string | null,
  qualification: string, 
  experience: number
) {
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash: await hashPassword(DEFAULT_PASSWORD),
      role: UserRole.TEACHER,
      firstName,
      lastName,
      isActive: true,
      schoolId: schoolId,
      lastLoginAt: new Date(),
    },
  });

  return prisma.teacher.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      teacherId,
      schoolId: schoolId,
      departmentId,
      qualification,
      experience,
      dateOfJoining: new Date(Date.now() - experience * 365 * 24 * 60 * 60 * 1000),
      salary: 50000 + (experience * 2000),
      isActive: true,
    },
  });
}

async function createStudent(
  email: string,
  studentId: string,
  firstName: string,
  lastName: string,
  classId: string,
  schoolId: string,
  gender: Gender,
  guardianName: string,
  guardianPhone: string
) {
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash: await hashPassword(DEFAULT_PASSWORD),
      role: UserRole.STUDENT,
      firstName,
      lastName,
      isActive: true,
      schoolId: schoolId,
      lastLoginAt: new Date(),
    },
  });

  return prisma.student.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      studentId,
      classId,
      schoolId: schoolId,
      gender,
      dateOfBirth: new Date(2007, 0, 1 + Math.floor(Math.random() * 365)),
      bloodGroup: Object.values(BloodGroup)[Math.floor(Math.random() * Object.values(BloodGroup).length)],
      guardianName,
      guardianPhone,
      guardianRelation: 'Parent',
      admissionDate: new Date(2023, 7, 1),
      admissionNumber: `ADM-${studentId}`,
      rollNumber: studentId.split('-')[2],
      status: StudentStatus.ACTIVE,
    },
  });
}

async function createParent(
  email: string,
  parentId: string,
  firstName: string,
  lastName: string,
  schoolId: string,
  occupation: string,
  phone: string
) {
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash: await hashPassword(DEFAULT_PASSWORD),
      role: UserRole.PARENT,
      firstName,
      lastName,
      isActive: true,
      schoolId: schoolId,
      lastLoginAt: new Date(),
    },
  });

  return prisma.parent.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      parentId,
      schoolId: schoolId,
      occupation,
      phone,
      address: '123 Main Street, City, State 12345',
    },
  });
}

async function main() {
  console.log('🌱 Starting database seeding...');

  const hashedPassword = await hashPassword(DEFAULT_PASSWORD);

  // ============================================
  // 1. SUPER ADMIN
  // ============================================
  console.log('Creating Super Admin...');
  
  const superAdminUser = await prisma.user.upsert({
    where: { email: 'superadmin@schoolerp.com' },
    update: {},
    create: {
      email: 'superadmin@schoolerp.com',
      passwordHash: hashedPassword,
      role: UserRole.SUPER_ADMIN,
      firstName: 'System',
      lastName: 'Administrator',
      isActive: true,
      lastLoginAt: new Date(),
    },
  });

  await prisma.superAdmin.upsert({
    where: { userId: superAdminUser.id },
    update: {},
    create: {
      userId: superAdminUser.id,
      adminId: 'SUPER-001',
      permissions: {
        canManageUsers: true,
        canManageSchools: true,
        canViewReports: true,
      },
      canCreateGlobalHolidays: true,
      canManageAllSchools: true,
      canCreateSchoolAdmins: true,
    },
  });

  // ============================================
  // 2. SCHOOL & SCHOOL ADMIN
  // ============================================
  console.log('Creating School and Admin...');

  const school = await prisma.school.upsert({
    where: { code: 'GHS001' },
    update: {},
    create: {
      name: 'Greenwood High School',
      code: 'GHS001',
      address: '123 Education Lane, Learning City, 12345',
      phone: '+1-555-0123',
      email: 'info@greenwood.edu',
      website: 'https://greenwood.edu',
      logo: 'https://greenwood.edu/logo.png',
      isActive: true,
    },
  });

  const schoolAdminUser = await prisma.user.upsert({
    where: { email: 'admin@greenwood.edu' },
    update: {},
    create: {
      email: 'admin@greenwood.edu',
      passwordHash: hashedPassword,
      role: UserRole.SCHOOL_ADMIN,
      firstName: 'Sarah',
      lastName: 'Johnson',
      isActive: true,
      schoolId: school.id,
      lastLoginAt: new Date(),
    },
  });

  // Update school with admin
  await prisma.school.update({
    where: { id: school.id },
    data: { adminId: schoolAdminUser.id },
  });

  // ============================================
  // 3. ACADEMIC YEAR & TERMS
  // ============================================
  console.log('Creating Academic Year and Terms...');

  const currentYear = new Date().getFullYear();
  const academicYear = await prisma.academicYear.upsert({
    where: { 
      year_schoolId: { 
        year: `${currentYear}-${currentYear + 1}`, 
        schoolId: school.id 
      } 
    },
    update: {},
    create: {
      year: `${currentYear}-${currentYear + 1}`,
      startDate: new Date(currentYear, 7, 1), // August 1st
      endDate: new Date(currentYear + 1, 5, 30), // June 30th
      schoolId: school.id,
      isCurrent: true,
      isActive: true,
    },
  });

  const terms = await Promise.all([
    prisma.term.upsert({
      where: { 
        name_academicYearId: { 
          name: 'First Term', 
          academicYearId: academicYear.id 
        } 
      },
      update: {},
      create: {
        name: 'First Term',
        startDate: new Date(currentYear, 7, 1),
        endDate: new Date(currentYear, 10, 30),
        academicYearId: academicYear.id,
        schoolId: school.id,
        isActive: true,
      },
    }),
    prisma.term.upsert({
      where: { 
        name_academicYearId: { 
          name: 'Second Term', 
          academicYearId: academicYear.id 
        } 
      },
      update: {},
      create: {
        name: 'Second Term',
        startDate: new Date(currentYear, 11, 1),
        endDate: new Date(currentYear + 1, 2, 31),
        academicYearId: academicYear.id,
        schoolId: school.id,
        isActive: true,
      },
    }),
  ]);

  // ============================================
  // 4. DEPARTMENTS
  // ============================================
  console.log('Creating Departments...');

  const departments = await Promise.all([
    prisma.department.upsert({
      where: { name_schoolId: { name: 'Science', schoolId: school.id } },
      update: {},
      create: {
        name: 'Science',
        code: 'SCI',
        description: 'Science and Technology Department',
        schoolId: school.id,
        isActive: true,
      },
    }),
    prisma.department.upsert({
      where: { name_schoolId: { name: 'Mathematics', schoolId: school.id } },
      update: {},
      create: {
        name: 'Mathematics',
        code: 'MATH',
        description: 'Mathematics Department',
        schoolId: school.id,
        isActive: true,
      },
    }),
  ]);

  // ============================================
  // 5. SUBJECTS
  // ============================================
  console.log('Creating Subjects...');

  const subjects = await Promise.all([
    prisma.subject.upsert({
      where: { code_schoolId: { code: 'PHY101', schoolId: school.id } },
      update: {},
      create: {
        name: 'Physics',
        code: 'PHY101',
        description: 'Introduction to Physics',
        schoolId: school.id,
        departmentId: departments[0].id,
        subjectType: SubjectType.THEORY,
        creditHours: 4,
        passMarks: 35,
        totalMarks: 100,
        gradeLevel: '9-12',
        isElective: false,
        displayOrder: 1,
        isActive: true,
      },
    }),
    prisma.subject.upsert({
      where: { code_schoolId: { code: 'MATH101', schoolId: school.id } },
      update: {},
      create: {
        name: 'Mathematics',
        code: 'MATH101',
        description: 'Advanced Mathematics',
        schoolId: school.id,
        departmentId: departments[1].id,
        subjectType: SubjectType.THEORY,
        creditHours: 5,
        passMarks: 35,
        totalMarks: 100,
        gradeLevel: '9-12',
        isElective: false,
        displayOrder: 2,
        isActive: true,
      },
    }),
  ]);

  // ============================================
  // 6. TEACHERS
  // ============================================
  console.log('Creating Teachers...');

  const teachers = await Promise.all([
    createTeacher('dr.smith@greenwood.edu', 'T-SCI-001', 'Dr. Robert', 'Smith', school.id, departments[0].id, 'PhD in Physics', 15),
    createTeacher('mr.wilson@greenwood.edu', 'T-MATH-001', 'Mr. James', 'Wilson', school.id, departments[1].id, 'MSc in Mathematics', 12),
  ]);

  // Update department heads
  await prisma.department.update({
    where: { id: departments[0].id },
    data: { headId: teachers[0].id },
  });
  await prisma.department.update({
    where: { id: departments[1].id },
    data: { headId: teachers[1].id },
  });

  // ============================================
  // 7. TEACHER-SUBJECT EXPERTISE
  // ============================================
  console.log('Assigning Teacher Subjects...');

  await Promise.all([
    prisma.teacherSubject.upsert({
      where: { teacherId_subjectId: { teacherId: teachers[0].id, subjectId: subjects[0].id } },
      update: {},
      create: {
        teacherId: teachers[0].id,
        subjectId: subjects[0].id,
        proficiencyLevel: ProficiencyLevel.EXPERT,
        yearsOfExperience: 15,
        certifications: 'PhD Physics, Certified Physics Teacher',
        isPrimary: true,
      },
    }),
    prisma.teacherSubject.upsert({
      where: { teacherId_subjectId: { teacherId: teachers[1].id, subjectId: subjects[1].id } },
      update: {},
      create: {
        teacherId: teachers[1].id,
        subjectId: subjects[1].id,
        proficiencyLevel: ProficiencyLevel.EXPERT,
        yearsOfExperience: 12,
        certifications: 'MSc Mathematics, Teaching Certificate',
        isPrimary: true,
      },
    }),
  ]);

  // ============================================
  // 8. ROOMS
  // ============================================
  console.log('Creating Rooms...');

  const rooms = await Promise.all([
    prisma.room.upsert({
      where: { name_schoolId: { name: 'Room 101', schoolId: school.id } },
      update: {},
      create: {
        name: 'Room 101',
        roomType: RoomType.CLASSROOM,
        capacity: 40,
        floor: 1,
        building: 'Main Building',
        schoolId: school.id,
        isActive: true,
      },
    }),
    prisma.room.upsert({
      where: { name_schoolId: { name: 'Room 102', schoolId: school.id } },
      update: {},
      create: {
        name: 'Room 102',
        roomType: RoomType.CLASSROOM,
        capacity: 35,
        floor: 1,
        building: 'Main Building',
        schoolId: school.id,
        isActive: true,
      },
    }),
  ]);

  // ============================================
  // 9. CLASSES
  // ============================================
  console.log('Creating Classes...');

  const classes = await Promise.all([
    prisma.class.upsert({
      where: { 
        grade_section_schoolId_academicYearId: { 
          grade: 10, 
          section: 'A', 
          schoolId: school.id,
          academicYearId: academicYear.id
        } 
      },
      update: {},
      create: {
        name: 'Class 10-A',
        grade: 10,
        section: 'A',
        classTeacherId: teachers[0].id,
        academicYearId: academicYear.id,
        schoolId: school.id,
        roomId: rooms[0].id,
        capacity: 40,
        currentStrength: 0,
        displayOrder: 1,
        isActive: true,
      },
    }),
    prisma.class.upsert({
      where: { 
        grade_section_schoolId_academicYearId: { 
          grade: 10, 
          section: 'B', 
          schoolId: school.id,
          academicYearId: academicYear.id
        } 
      },
      update: {},
      create: {
        name: 'Class 10-B',
        grade: 10,
        section: 'B',
        classTeacherId: teachers[1].id,
        academicYearId: academicYear.id,
        schoolId: school.id,
        roomId: rooms[1].id,
        capacity: 35,
        currentStrength: 0,
        displayOrder: 2,
        isActive: true,
      },
    }),
  ]);

  // ============================================
  // 10. CLASS-SUBJECT MAPPINGS
  // ============================================
  console.log('Assigning Subjects to Classes...');

  await Promise.all([
    prisma.classSubject.upsert({
      where: { classId_subjectId: { classId: classes[0].id, subjectId: subjects[0].id } },
      update: {},
      create: {
        classId: classes[0].id,
        subjectId: subjects[0].id,
        teacherId: teachers[0].id,
        periodsPerWeek: 5,
        maxMarks: 100,
        weightage: 20,
        isOptional: false,
        displayOrder: 1,
      },
    }),
    prisma.classSubject.upsert({
      where: { classId_subjectId: { classId: classes[0].id, subjectId: subjects[1].id } },
      update: {},
      create: {
        classId: classes[0].id,
        subjectId: subjects[1].id,
        teacherId: teachers[1].id,
        periodsPerWeek: 6,
        maxMarks: 100,
        weightage: 25,
        isOptional: false,
        displayOrder: 2,
      },
    }),
  ]);

  // ============================================
  // 11. STUDENTS
  // ============================================
  console.log('Creating Students...');

  const students = await Promise.all([
    createStudent('alice.johnson@student.greenwood.edu', 'STU-10A-001', 'Alice', 'Johnson', classes[0].id, school.id, Gender.FEMALE, 'Mrs. Johnson', '+1-555-0001'),
    createStudent('bob.williams@student.greenwood.edu', 'STU-10A-002', 'Bob', 'Williams', classes[0].id, school.id, Gender.MALE, 'Mr. Williams', '+1-555-0002'),
    createStudent('eve.miller@student.greenwood.edu', 'STU-10B-001', 'Eve', 'Miller', classes[1].id, school.id, Gender.FEMALE, 'Mrs. Miller', '+1-555-0003'),
  ]);

  // Update class strengths
  await Promise.all([
    prisma.class.update({
      where: { id: classes[0].id },
      data: { currentStrength: 2 },
    }),
    prisma.class.update({
      where: { id: classes[1].id },
      data: { currentStrength: 1 },
    }),
  ]);

  // ============================================
  // 12. EXAM TYPES & EXAMS
  // ============================================
  console.log('Creating Exams...');

  const examTypes = await Promise.all([
    prisma.examType.upsert({
      where: { name_schoolId: { name: 'Midterm', schoolId: school.id } },
      update: {},
      create: {
        name: 'Midterm',
        description: 'Mid-term Examination',
        schoolId: school.id,
        weightage: 30,
        isActive: true,
      },
    }),
  ]);

  const exams = await Promise.all([
    prisma.exam.upsert({
      where: { id: 'exam-physics-10a' },
      update: {},
      create: {
        id: 'exam-physics-10a',
        title: 'Physics Midterm - Class 10-A',
        description: 'Midterm Examination for Physics',
        examTypeId: examTypes[0].id,
        subjectId: subjects[0].id,
        classId: classes[0].id,
        teacherId: teachers[0].id,
        schoolId: school.id,
        examDate: new Date(currentYear, 9, 15), // October 15th
        duration: 120,
        totalMarks: 100,
        passingMarks: 35,
        instructions: 'Bring calculator and formula sheet',
        isActive: true,
      },
    }),
  ]);

  // ============================================
  // 13. GRADES
  // ============================================
  console.log('Creating Grades...');

  await Promise.all([
    prisma.grade.upsert({
      where: { examId_studentId: { examId: exams[0].id, studentId: students[0].id } },
      update: {},
      create: {
        examId: exams[0].id,
        studentId: students[0].id,
        subjectId: subjects[0].id,
        marksObtained: 85,
        totalMarks: 100,
        percentage: 85,
        grade: 'A',
        remarks: 'Excellent performance',
        gradedById: teachers[0].id,
        gradedAt: new Date(),
        isPublished: true,
      },
    }),
  ]);

  // ============================================
  // 14. FEE MANAGEMENT
  // ============================================
  console.log('Setting up Fee Management...');

  // Fee Types
  const feeTypes = await Promise.all([
    prisma.feeType.upsert({
      where: { name_schoolId: { name: 'Tuition Fee', schoolId: school.id } },
      update: {},
      create: {
        name: 'Tuition Fee',
        code: 'TUIT',
        description: 'Academic tuition fee',
        schoolId: school.id,
        isActive: true,
      },
    }),
  ]);

  // Fee Structures
  const feeStructures = await Promise.all([
    prisma.feeStructure.upsert({
      where: { id: 'fee-structure-class10-2024' },
      update: {},
      create: {
        id: 'fee-structure-class10-2024',
        name: 'Class 10 Fee Structure 2024-25',
        description: 'Annual fee structure for Class 10',
        classId: classes[0].id,
        academicYearId: academicYear.id,
        installmentType: InstallmentType.QUARTERLY,
        isActive: true,
        schoolId: school.id,
      },
    }),
  ]);

  // Fee Structure Items
  await Promise.all([
    prisma.feeStructureItem.upsert({
      where: { feeStructureId_feeTypeId: { feeStructureId: feeStructures[0].id, feeTypeId: feeTypes[0].id } },
      update: {},
      create: {
        feeStructureId: feeStructures[0].id,
        feeTypeId: feeTypes[0].id,
        amount: 40000,
        isOptional: false,
      },
    }),
  ]);

  // ============================================
  // 15. TIMETABLE
  // ============================================
  console.log('Creating Timetable...');

  const timetable = await prisma.timetable.upsert({
    where: { id: 'temp-id' }, // Use a temporary ID since name_schoolId doesn't exist
    update: {},
    create: {
      id: 'temp-id', // Temporary ID for upsert
      name: 'Class 10-A Timetable 2024-25',
      schoolId: school.id,
      academicYearId: academicYear.id,
      termId: terms[0].id,
      classId: classes[0].id,
      effectiveFrom: new Date(currentYear, 7, 1),
      effectiveTo: new Date(currentYear, 10, 30),
      isActive: true,
      createdById: schoolAdminUser.id,
    },
  });

  // Delete and recreate with proper ID
  await prisma.timetable.delete({ where: { id: timetable.id } });
  
  const finalTimetable = await prisma.timetable.create({
    data: {
      name: 'Class 10-A Timetable 2024-25',
      schoolId: school.id,
      academicYearId: academicYear.id,
      termId: terms[0].id,
      classId: classes[0].id,
      effectiveFrom: new Date(currentYear, 7, 1),
      effectiveTo: new Date(currentYear, 10, 30),
      isActive: true,
      createdById: schoolAdminUser.id,
    },
  });

  // ============================================
  // 16. HOLIDAYS
  // ============================================
  console.log('Creating Holidays...');

  await Promise.all([
    prisma.holiday.upsert({
      where: { id: 'holiday-1' }, // Use ID since title_startDate doesn't exist
      update: {},
      create: {
        id: 'holiday-1',
        title: 'Summer Vacation',
        startDate: new Date(currentYear, 5, 1), // June 1
        endDate: new Date(currentYear, 6, 31), // July 31
        holidayType: HolidayType.GENERAL,
        isRecurring: true,
        schoolId: school.id,
        createdBy: schoolAdminUser.id,
      },
    }),
  ]);

  console.log('✅ Database seeding completed successfully!');
  console.log('\n📋 Test Credentials:');
  console.log('===================');
  console.log('Super Admin:');
  console.log('  Email: superadmin@schoolerp.com');
  console.log('  Password: Password123!');
  console.log('\nSchool Admin:');
  console.log('  Email: admin@greenwood.edu');
  console.log('  Password: Password123!');
  console.log('\nTeachers:');
  console.log('  Physics: dr.smith@greenwood.edu');
  console.log('  Math: mr.wilson@greenwood.edu');
  console.log('  Password for all: Password123!');
  console.log('\nStudents:');
  console.log('  Alice: alice.johnson@student.greenwood.edu');
  console.log('  Bob: bob.williams@student.greenwood.edu');
  console.log('  Password for all: Password123!');
}

// ============================================
// EXECUTE SEED
// ============================================

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });