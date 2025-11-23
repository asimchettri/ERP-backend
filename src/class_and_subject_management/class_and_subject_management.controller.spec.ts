import {
  ClassesController,
  SubjectsController,
  ClassSubjectsController,
  TeacherSubjectsController,
  DepartmentsController,
} from './class_and_subject_management.controller';

describe('ClassAndSubjectManagement Controllers', () => {
  it('ClassesController should exist', () => {
    expect(ClassesController).toBeDefined();
  });

  it('SubjectsController should exist', () => {
    expect(SubjectsController).toBeDefined();
  });

  it('ClassSubjectsController should exist', () => {
    expect(ClassSubjectsController).toBeDefined();
  });

  it('TeacherSubjectsController should exist', () => {
    expect(TeacherSubjectsController).toBeDefined();
  });

  it('DepartmentsController should exist', () => {
    expect(DepartmentsController).toBeDefined();
  });
});

