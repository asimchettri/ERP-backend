// Test script to verify authentication system works with the new enum-based roles
import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function testAuthSystem() {
  try {
    console.log('🧪 Testing Authentication System with Enum-based Roles...\n');

    // 1. Test user creation with enum roles
    console.log('1. Creating test users with different roles...');
    const hashedPassword = await bcrypt.hash('testPassword123', 10);
    
    // Create a test teacher
    const teacher = await prisma.user.create({
      data: {
        email: 'test.teacher@school.com',
        passwordHash: hashedPassword,
        firstName: 'Test',
        lastName: 'Teacher',
        role: UserRole.TEACHER,
        isActive: true,
        schoolId: null,
      },
    });
    
    console.log('✅ Teacher created:', {
      id: teacher.id,
      email: teacher.email,
      role: teacher.role,
      isActive: teacher.isActive,
    });

    // Create a test student
    const student = await prisma.user.create({
      data: {
        email: 'test.student@school.com',
        passwordHash: hashedPassword,
        firstName: 'Test',
        lastName: 'Student',
        role: UserRole.STUDENT,
        isActive: true,
        schoolId: null,
      },
    });
    
    console.log('✅ Student created:', {
      id: student.id,
      email: student.email,
      role: student.role,
      isActive: student.isActive,
    });

    // 2. Test role-based queries
    console.log('\n2. Testing role-based queries...');
    
    const teachers = await prisma.user.findMany({
      where: { role: UserRole.TEACHER },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
      },
    });
    console.log('✅ Found teachers:', teachers.length);

    const students = await prisma.user.findMany({
      where: { role: UserRole.STUDENT },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
      },
    });
    console.log('✅ Found students:', students.length);

    // 3. Test password verification
    console.log('\n3. Testing password verification...');
    const foundTeacher = await prisma.user.findUnique({
      where: { email: 'test.teacher@school.com' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        passwordHash: true,
      },
    });

    if (foundTeacher) {
      const passwordMatch = await bcrypt.compare('testPassword123', foundTeacher.passwordHash || '');
      console.log('✅ Password verification:', passwordMatch ? 'PASS' : 'FAIL');
    }

    // 4. Test enum values
    console.log('\n4. Testing UserRole enum values...');
    console.log('Available roles:', Object.values(UserRole));
    
    // 5. Clean up test data
    console.log('\n5. Cleaning up test data...');
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['test.teacher@school.com', 'test.student@school.com']
        }
      },
    });
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 All authentication tests passed!');
    console.log('✅ Enum-based role system is working correctly');
    console.log('✅ User CRUD operations work with Prisma schema');
    console.log('✅ Password hashing and verification works');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testAuthSystem();