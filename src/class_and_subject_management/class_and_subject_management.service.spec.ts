import { ClassesService, SubjectsService, ClassSubjectsService, TeacherSubjectsService, DepartmentsService } from './class_and_subject_management.service';

describe('ClassAndSubjectManagement Services', () => {
  it('ClassesService should exist', () => {
    expect(ClassesService).toBeDefined();
  });

  it('SubjectsService should exist', () => {
    expect(SubjectsService).toBeDefined();
  });

  it('ClassSubjectsService should exist', () => {
    expect(ClassSubjectsService).toBeDefined();
  });

  it('TeacherSubjectsService should exist', () => {
    expect(TeacherSubjectsService).toBeDefined();
  });

  it('DepartmentsService should exist', () => {
    expect(DepartmentsService).toBeDefined();
  });
});

