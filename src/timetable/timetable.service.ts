// ============================================
// src/timetable/timetable.service.ts
// ============================================
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WeekDay } from '@prisma/client';
import {
  CreateRoomDto,
  UpdateRoomDto,
  QueryRoomDto,
  CreateTimetableDto,
  UpdateTimetableDto,
  QueryTimetableDto,
  CreateTimetableSlotDto,
  UpdateTimetableSlotDto,
  QueryTimetableSlotDto,
  BulkCreateSlotsDto,
  BulkUpdateSlotsDto,
  BulkDeleteSlotsDto,
  CloneTimetableDto,
  CheckConflictDto,
  GetTeacherScheduleDto,
  GetClassScheduleDto,
  CheckRoomAvailabilityDto,
  SwapSlotsDto,
  GetTimetableStatisticsDto,
  GetTeacherWorkloadDto,
  GetFreePeriodsDto,
} from './dto/create-timetable.dto';

@Injectable()
export class TimetableService {
  constructor(private prisma: PrismaService) {}

  // ============================================
  // ROOM MANAGEMENT
  // ============================================

  async createRoom(dto: CreateRoomDto) {
    // Check if room name already exists in school
    const existing = await this.prisma.room.findFirst({
      where: {
        name: dto.name,
        schoolId: dto.schoolId,
      },
    });

    if (existing) {
      throw new ConflictException(
        'Room with this name already exists in the school'
      );
    }

    return this.prisma.room.create({
      data: dto,
      include: {
        school: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });
  }

  async getRooms(query: QueryRoomDto) {
    const where: any = {};

    if (query.schoolId) where.schoolId = query.schoolId;
    if (query.roomType) where.roomType = query.roomType;
    if (query.building) where.building = { contains: query.building, mode: 'insensitive' };
    if (query.floor !== undefined) where.floor = query.floor;
    if (query.isActive !== undefined) where.isActive = query.isActive;

    return this.prisma.room.findMany({
      where,
      include: {
        school: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            classes: true,
            timetableSlots: true,
          },
        },
      },
      orderBy: [
        { building: 'asc' },
        { floor: 'asc' },
        { name: 'asc' },
      ],
    });
  }

  async getRoomById(id: string) {
    const room = await this.prisma.room.findUnique({
      where: { id },
      include: {
        school: true,
        classes: {
          include: {
            classTeacher: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
        timetableSlots: {
          include: {
            timetable: {
              select: {
                id: true,
                name: true,
                class: {
                  select: {
                    name: true,
                    grade: true,
                    section: true,
                  },
                },
              },
            },
            subject: true,
            teacher: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
          orderBy: [
            { day: 'asc' },
            { periodNumber: 'asc' },
          ],
        },
        _count: {
          select: {
            classes: true,
            timetableSlots: true,
          },
        },
      },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    return room;
  }

  async updateRoom(id: string, dto: UpdateRoomDto) {
    await this.getRoomById(id);

    // Check name uniqueness if name is being updated
    if (dto.name && dto.schoolId) {
      const existing = await this.prisma.room.findFirst({
        where: {
          name: dto.name,
          schoolId: dto.schoolId,
          id: { not: id },
        },
      });

      if (existing) {
        throw new ConflictException(
          'Room with this name already exists in the school'
        );
      }
    }

    return this.prisma.room.update({
      where: { id },
      data: dto,
      include: {
        school: true,
      },
    });
  }

  async deleteRoom(id: string) {
    const room = await this.getRoomById(id);

    // Check if room is being used
    const hasClasses = await this.prisma.class.count({
      where: { roomId: id },
    });

    const hasSlots = await this.prisma.timetableSlot.count({
      where: { roomId: id },
    });

    if (hasClasses > 0 || hasSlots > 0) {
      throw new BadRequestException(
        `Cannot delete room. It is being used by ${hasClasses} class(es) and ${hasSlots} timetable slot(s). Please deactivate instead or reassign.`
      );
    }

    return this.prisma.room.delete({
      where: { id },
    });
  }

  async checkRoomAvailability(dto: CheckRoomAvailabilityDto) {
    const conflicts = await this.prisma.timetableSlot.findMany({
      where: {
        roomId: dto.roomId,
        day: dto.day,
        timetable: {
          isActive: true,
          effectiveFrom: { lte: dto.date ? new Date(dto.date) : new Date() },
          OR: [
            { effectiveTo: null },
            { effectiveTo: { gte: dto.date ? new Date(dto.date) : new Date() } },
          ],
        },
      },
      include: {
        timetable: {
          include: {
            class: true,
          },
        },
        subject: true,
        teacher: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    const hasConflict = conflicts.some((slot) =>
      this.timesOverlap(dto.startTime, dto.endTime, slot.startTime, slot.endTime)
    );

    return {
      isAvailable: !hasConflict,
      conflicts: hasConflict
        ? conflicts.filter((slot) =>
            this.timesOverlap(dto.startTime, dto.endTime, slot.startTime, slot.endTime)
          )
        : [],
    };
  }

  // ============================================
  // TIMETABLE MANAGEMENT
  // ============================================

  async createTimetable(dto: CreateTimetableDto, createdById: string) {
    // Validate academic year exists
    const academicYear = await this.prisma.academicYear.findUnique({
      where: { id: dto.academicYearId },
    });

    if (!academicYear) {
      throw new NotFoundException('Academic year not found');
    }

    // Validate term if provided
    if (dto.termId) {
      const term = await this.prisma.term.findUnique({
        where: { id: dto.termId },
      });

      if (!term) {
        throw new NotFoundException('Term not found');
      }

      // Ensure term belongs to the academic year
      if (term.academicYearId !== dto.academicYearId) {
        throw new BadRequestException(
          'Term does not belong to the specified academic year'
        );
      }
    }

    // Validate class if provided
    if (dto.classId) {
      const classEntity = await this.prisma.class.findUnique({
        where: { id: dto.classId },
      });

      if (!classEntity) {
        throw new NotFoundException('Class not found');
      }

      // Ensure class belongs to the school
      if (classEntity.schoolId !== dto.schoolId) {
        throw new BadRequestException(
          'Class does not belong to the specified school'
        );
      }
    }

    // Validate date range
    const effectiveFrom = new Date(dto.effectiveFrom);
    const effectiveTo = dto.effectiveTo ? new Date(dto.effectiveTo) : null;

    if (effectiveTo && effectiveFrom >= effectiveTo) {
      throw new BadRequestException(
        'Effective from date must be before effective to date'
      );
    }

    return this.prisma.timetable.create({
      data: {
        ...dto,
        createdById,
      },
      include: {
        school: true,
        academicYear: true,
        term: true,
        class: {
          include: {
            classTeacher: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async getTimetables(query: QueryTimetableDto) {
    const where: any = {};

    if (query.schoolId) where.schoolId = query.schoolId;
    if (query.classId) where.classId = query.classId;
    if (query.termId) where.termId = query.termId;
    if (query.academicYearId) where.academicYearId = query.academicYearId;
    if (query.isActive !== undefined) where.isActive = query.isActive;

    // Filter by date if provided
    if (query.date) {
      const date = new Date(query.date);
      where.effectiveFrom = { lte: date };
      where.OR = [
        { effectiveTo: null },
        { effectiveTo: { gte: date } },
      ];
    }

    // Filter by teacher
    if (query.teacherId) {
      where.slots = {
        some: {
          teacherId: query.teacherId,
        },
      };
    }

    return this.prisma.timetable.findMany({
      where,
      include: {
        school: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        academicYear: {
          select: {
            id: true,
            year: true,
          },
        },
        term: {
          select: {
            id: true,
            name: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
            grade: true,
            section: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            slots: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTimetableById(id: string) {
    const timetable = await this.prisma.timetable.findUnique({
      where: { id },
      include: {
        school: true,
        academicYear: true,
        term: true,
        class: {
          include: {
            classTeacher: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        slots: {
          include: {
            subject: true,
            teacher: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
            room: true,
          },
          orderBy: [
            { day: 'asc' },
            { periodNumber: 'asc' },
          ],
        },
      },
    });

    if (!timetable) {
      throw new NotFoundException('Timetable not found');
    }

    return timetable;
  }

  async updateTimetable(id: string, dto: UpdateTimetableDto) {
    await this.getTimetableById(id);

    // Validate term if being updated
    if (dto.termId && dto.academicYearId) {
      const term = await this.prisma.term.findUnique({
        where: { id: dto.termId },
      });

      if (term && term.academicYearId !== dto.academicYearId) {
        throw new BadRequestException(
          'Term does not belong to the specified academic year'
        );
      }
    }

    // Validate date range if being updated
    if (dto.effectiveFrom && dto.effectiveTo) {
      const effectiveFrom = new Date(dto.effectiveFrom);
      const effectiveTo = new Date(dto.effectiveTo);

      if (effectiveFrom >= effectiveTo) {
        throw new BadRequestException(
          'Effective from date must be before effective to date'
        );
      }
    }

    return this.prisma.timetable.update({
      where: { id },
      data: dto,
      include: {
        school: true,
        academicYear: true,
        term: true,
        class: true,
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async deleteTimetable(id: string) {
    await this.getTimetableById(id);

    // Use transaction to delete timetable and all slots
    return this.prisma.$transaction(async (tx) => {
      // Delete all slots first
      await tx.timetableSlot.deleteMany({
        where: { timetableId: id },
      });

      // Delete timetable
      return tx.timetable.delete({
        where: { id },
      });
    });
  }

  async cloneTimetable(dto: CloneTimetableDto, createdById: string) {
    const sourceTimetable = await this.getTimetableById(dto.sourceTimetableId);

    return this.prisma.$transaction(async (tx) => {
      // Create new timetable
      const newTimetable = await tx.timetable.create({
        data: {
          name: dto.newName,
          schoolId: sourceTimetable.schoolId,
          academicYearId: sourceTimetable.academicYearId,
          termId: dto.newTermId || sourceTimetable.termId,
          classId: dto.newClassId || sourceTimetable.classId,
          effectiveFrom: dto.effectiveFrom,
          effectiveTo: dto.effectiveTo,
          isActive: true,
          createdById,
        },
      });

      // Clone slots if requested (default: true)
      if (dto.cloneSlots !== false) {
        const sourceSlots = await tx.timetableSlot.findMany({
          where: { timetableId: dto.sourceTimetableId },
        });

        if (sourceSlots.length > 0) {
          await tx.timetableSlot.createMany({
            data: sourceSlots.map((slot) => ({
              timetableId: newTimetable.id,
              day: slot.day,
              periodNumber: slot.periodNumber,
              startTime: slot.startTime,
              endTime: slot.endTime,
              subjectId: slot.subjectId,
              teacherId: slot.teacherId,
              roomId: slot.roomId,
              isBreak: slot.isBreak,
              breakType: slot.breakType,
              note: slot.note,
            })),
          });
        }
      }

      // Return complete timetable with slots
      return tx.timetable.findUnique({
        where: { id: newTimetable.id },
        include: {
          school: true,
          academicYear: true,
          term: true,
          class: true,
          slots: {
            include: {
              subject: true,
              teacher: {
                include: {
                  user: {
                    select: {
                      firstName: true,
                      lastName: true,
                    },
                  },
                },
              },
              room: true,
            },
          },
        },
      });
    });
  }

  // ============================================
  // TIMETABLE SLOT MANAGEMENT
  // ============================================

  async createSlot(dto: CreateTimetableSlotDto) {
    // Validate timetable exists
    const timetable = await this.getTimetableById(dto.timetableId);

    // Validate time logic
    if (dto.startTime >= dto.endTime) {
      throw new BadRequestException('End time must be after start time');
    }

    // Check for conflicts
    await this.validateSlot(dto, timetable.schoolId);

    return this.prisma.timetableSlot.create({
      data: dto,
      include: {
        timetable: {
          select: {
            id: true,
            name: true,
            class: true,
          },
        },
        subject: true,
        teacher: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        room: true,
      },
    });
  }

  async createBulkSlots(dto: BulkCreateSlotsDto) {
    // Get timetable and school
    const firstSlot = dto.slots[0];
    const timetable = await this.getTimetableById(firstSlot.timetableId);

    // Validate all slots
    for (const slot of dto.slots) {
      if (slot.startTime >= slot.endTime) {
        throw new BadRequestException(
          `Invalid time range for slot on ${slot.day} period ${slot.periodNumber}`
        );
      }
      await this.validateSlot(slot, timetable.schoolId);
    }

    return this.prisma.$transaction(
      dto.slots.map((slot) =>
        this.prisma.timetableSlot.create({
          data: slot,
          include: {
            subject: true,
            teacher: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
            room: true,
          },
        })
      )
    );
  }

  async getSlots(query: QueryTimetableSlotDto) {
    const where: any = {};

    if (query.timetableId) where.timetableId = query.timetableId;
    if (query.day) where.day = query.day;
    if (query.teacherId) where.teacherId = query.teacherId;
    if (query.roomId) where.roomId = query.roomId;
    if (query.subjectId) where.subjectId = query.subjectId;
    if (query.periodNumber) where.periodNumber = query.periodNumber;
    if (query.isBreak !== undefined) where.isBreak = query.isBreak;

    return this.prisma.timetableSlot.findMany({
      where,
      include: {
        timetable: {
          include: {
            class: {
              select: {
                id: true,
                name: true,
                grade: true,
                section: true,
              },
            },
            school: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        subject: true,
        teacher: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        room: true,
      },
      orderBy: [
        { day: 'asc' },
        { periodNumber: 'asc' },
      ],
    });
  }

  async getSlotById(id: string) {
    const slot = await this.prisma.timetableSlot.findUnique({
      where: { id },
      include: {
        timetable: {
          include: {
            class: true,
            school: true,
          },
        },
        subject: true,
        teacher: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            department: true,
          },
        },
        room: true,
      },
    });

    if (!slot) {
      throw new NotFoundException('Timetable slot not found');
    }

    return slot;
  }

  async updateSlot(id: string, dto: UpdateTimetableSlotDto) {
    const existingSlot = await this.getSlotById(id);

    // Validate time logic if times are being updated
    const newStartTime = dto.startTime || existingSlot.startTime;
    const newEndTime = dto.endTime || existingSlot.endTime;

    if (newStartTime >= newEndTime) {
      throw new BadRequestException('End time must be after start time');
    }

    // Validate updated slot
   const validateDto = {
  timetableId: dto.timetableId ?? existingSlot.timetableId,
  day: dto.day ?? existingSlot.day,
  periodNumber: dto.periodNumber ?? existingSlot.periodNumber,
  startTime: newStartTime,
  endTime: newEndTime,
  teacherId:
    dto.teacherId !== undefined
      ? dto.teacherId ?? undefined
      : existingSlot.teacherId ?? undefined,
  roomId:
    dto.roomId !== undefined
      ? dto.roomId ?? undefined
      : existingSlot.roomId ?? undefined,
  isBreak: dto.isBreak ?? existingSlot.isBreak,
};


    await this.validateSlot(validateDto, existingSlot.timetable.schoolId, id);

    return this.prisma.timetableSlot.update({
      where: { id },
      data: dto,
      include: {
        timetable: {
          include: {
            class: true,
          },
        },
        subject: true,
        teacher: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        room: true,
      },
    });
  }

  async bulkUpdateSlots(dto: BulkUpdateSlotsDto) {
    // Validate all slots exist
    const slotIds = dto.slots.map((s) => s.id);
    const existingSlots = await this.prisma.timetableSlot.findMany({
      where: { id: { in: slotIds } },
    });

    if (existingSlots.length !== slotIds.length) {
      throw new NotFoundException('One or more slots not found');
    }

    return this.prisma.$transaction(
      dto.slots.map((item) =>
        this.prisma.timetableSlot.update({
          where: { id: item.id },
          data: item.data,
          include: {
            subject: true,
            teacher: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
            room: true,
          },
        })
      )
    );
  }

  async deleteSlot(id: string) {
    await this.getSlotById(id);

    return this.prisma.timetableSlot.delete({
      where: { id },
    });
  }

  async bulkDeleteSlots(dto: BulkDeleteSlotsDto) {
    // Validate all slots exist
    const existingSlots = await this.prisma.timetableSlot.findMany({
      where: { id: { in: dto.slotIds } },
    });

    if (existingSlots.length !== dto.slotIds.length) {
      throw new NotFoundException('One or more slots not found');
    }

    return this.prisma.timetableSlot.deleteMany({
      where: { id: { in: dto.slotIds } },
    });
  }

  async swapSlots(dto: SwapSlotsDto) {
    const slot1 = await this.getSlotById(dto.slot1Id);
    const slot2 = await this.getSlotById(dto.slot2Id);

    // Ensure both slots belong to the same timetable
    if (slot1.timetableId !== slot2.timetableId) {
      throw new BadRequestException(
        'Both slots must belong to the same timetable'
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // Swap day and period
      const tempDay = slot1.day;
      const tempPeriod = slot1.periodNumber;
      const tempStart = slot1.startTime;
      const tempEnd = slot1.endTime;

      await tx.timetableSlot.update({
        where: { id: slot1.id },
        data: {
          day: slot2.day,
          periodNumber: slot2.periodNumber,
          startTime: slot2.startTime,
          endTime: slot2.endTime,
          ...(dto.swapTeachers !== false && { teacherId: slot2.teacherId }),
          ...(dto.swapRooms !== false && { roomId: slot2.roomId }),
          ...(dto.swapSubjects !== false && { subjectId: slot2.subjectId }),
        },
      });

      await tx.timetableSlot.update({
        where: { id: slot2.id },
        data: {
          day: tempDay,
          periodNumber: tempPeriod,
          startTime: tempStart,
          endTime: tempEnd,
          ...(dto.swapTeachers !== false && { teacherId: slot1.teacherId }),
          ...(dto.swapRooms !== false && { roomId: slot1.roomId }),
          ...(dto.swapSubjects !== false && { subjectId: slot1.subjectId }),
        },
      });

      return {
        message: 'Slots swapped successfully',
        slot1: await tx.timetableSlot.findUnique({
          where: { id: slot1.id },
          include: { subject: true, teacher: true, room: true },
        }),
        slot2: await tx.timetableSlot.findUnique({
          where: { id: slot2.id },
          include: { subject: true, teacher: true, room: true },
        }),
      };
    });
  }

  // ============================================
  // SCHEDULE QUERIES
  // ============================================

  async getTeacherSchedule(dto: GetTeacherScheduleDto) {
    const where: any = {
      teacherId: dto.teacherId,
      timetable: {
        isActive: true,
      },
    };

    if (dto.day) where.day = dto.day;

    if (dto.schoolId) {
      where.timetable = {
        ...where.timetable,
        schoolId: dto.schoolId,
      };
    }

    // Filter by date range if provided
    if (dto.startDate && dto.endDate) {
      where.timetable = {
        ...where.timetable,
        effectiveFrom: { lte: new Date(dto.endDate) },
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: new Date(dto.startDate) } },
        ],
      };
    }

    const slots = await this.prisma.timetableSlot.findMany({
      where,
      include: {
        timetable: {
          include: {
            class: true,
            term: true,
          },
        },
        subject: true,
        room: true,
      },
      orderBy: [
        { day: 'asc' },
        { startTime: 'asc' },
      ],
    });

    // Group by day
    const groupedByDay = slots.reduce((acc, slot) => {
      if (!acc[slot.day]) {
        acc[slot.day] = [];
      }
      acc[slot.day].push(slot);
      return acc;
    }, {} as Record<string, any[]>);

    return {
      teacherId: dto.teacherId,
      schedule: groupedByDay,
      totalPeriods: slots.filter((s) => !s.isBreak).length,
    };
  }

  async getClassSchedule(dto: GetClassScheduleDto) {
    const classEntity = await this.prisma.class.findUnique({
      where: { id: dto.classId },
      include: {
        classTeacher: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!classEntity) {
      throw new NotFoundException('Class not found');
    }

    const where: any = {
      timetable: {
        classId: dto.classId,
        isActive: true,
      },
    };

    if (dto.day) where.day = dto.day;

    // Filter by specific date if provided
    if (dto.date) {
      const date = new Date(dto.date);
      where.timetable = {
        ...where.timetable,
        effectiveFrom: { lte: date },
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: date } },
        ],
      };
    }

    const slots = await this.prisma.timetableSlot.findMany({
      where,
      include: {
        timetable: {
          include: {
            term: true,
            academicYear: true,
          },
        },
        subject: true,
        teacher: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        room: true,
      },
      orderBy: [
        { day: 'asc' },
        { periodNumber: 'asc' },
      ],
    });

    // Group by day
    const groupedByDay = slots.reduce((acc, slot) => {
      if (!acc[slot.day]) {
        acc[slot.day] = [];
      }
      acc[slot.day].push(slot);
      return acc;
    }, {} as Record<string, any[]>);

    return {
      class: classEntity,
      schedule: groupedByDay,
      totalPeriods: slots.filter((s) => !s.isBreak).length,
    };
  }

  async getFreePeriods(dto: GetFreePeriodsDto) {
    const where: any = {
      day: dto.day,
      timetable: {
        isActive: true,
      },
    };

    if (dto.schoolId) {
      where.timetable.schoolId = dto.schoolId;
    }

    // Filter by date if provided
    if (dto.date) {
      const date = new Date(dto.date);
      where.timetable = {
        ...where.timetable,
        effectiveFrom: { lte: date },
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: date } },
        ],
      };
    }

    // Get all slots for the day
    const allSlots = await this.prisma.timetableSlot.findMany({
      where,
      select: {
        startTime: true,
        endTime: true,
        teacherId: true,
        roomId: true,
      },
    });

    // Find free periods for teacher
    if (dto.teacherId) {
      const teacherSlots = allSlots.filter((s) => s.teacherId === dto.teacherId);
      const occupiedTimes = teacherSlots.map((s) => ({
        start: s.startTime,
        end: s.endTime,
      }));

      return {
        teacherId: dto.teacherId,
        day: dto.day,
        occupiedPeriods: occupiedTimes,
        message: 'Teacher occupied periods listed',
      };
    }

    // Find free periods for room
    if (dto.roomId) {
      const roomSlots = allSlots.filter((s) => s.roomId === dto.roomId);
      const occupiedTimes = roomSlots.map((s) => ({
        start: s.startTime,
        end: s.endTime,
      }));

      return {
        roomId: dto.roomId,
        day: dto.day,
        occupiedPeriods: occupiedTimes,
        message: 'Room occupied periods listed',
      };
    }

    throw new BadRequestException('Either teacherId or roomId must be provided');
  }

  // ============================================
  // STATISTICS & ANALYTICS
  // ============================================

  async getTimetableStatistics(dto: GetTimetableStatisticsDto) {
    const where: any = {};

    if (dto.timetableId) {
      where.id = dto.timetableId;
    }

    if (dto.schoolId) {
      where.schoolId = dto.schoolId;
    }

    if (dto.academicYearId) {
      where.academicYearId = dto.academicYearId;
    }

    const timetables = await this.prisma.timetable.findMany({
      where,
      include: {
        slots: {
          include: {
            subject: true,
            teacher: true,
          },
        },
      },
    });

    const statistics = timetables.map((timetable) => {
      const totalSlots = timetable.slots.length;
      const breakSlots = timetable.slots.filter((s) => s.isBreak).length;
      const classSlots = totalSlots - breakSlots;
      
      const uniqueSubjects = new Set(
        timetable.slots
          .filter((s) => s.subjectId)
          .map((s) => s.subjectId)
      ).size;

      const uniqueTeachers = new Set(
        timetable.slots
          .filter((s) => s.teacherId)
          .map((s) => s.teacherId)
      ).size;

      const slotsByDay = timetable.slots.reduce((acc, slot) => {
        acc[slot.day] = (acc[slot.day] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        timetableId: timetable.id,
        timetableName: timetable.name,
        totalSlots,
        classSlots,
        breakSlots,
        uniqueSubjects,
        uniqueTeachers,
        slotsByDay,
      };
    });

    return {
      statistics,
      totalTimetables: timetables.length,
    };
  }

  async getTeacherWorkload(dto: GetTeacherWorkloadDto) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: dto.teacherId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        department: true,
      },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    const where: any = {
      teacherId: dto.teacherId,
      isBreak: false,
      timetable: {
        isActive: true,
      },
    };

    if (dto.academicYearId) {
      where.timetable.academicYearId = dto.academicYearId;
    }

    if (dto.termId) {
      where.timetable.termId = dto.termId;
    }

    const slots = await this.prisma.timetableSlot.findMany({
      where,
      include: {
        timetable: {
          include: {
            class: true,
            term: true,
          },
        },
        subject: true,
      },
    });

    // Calculate workload
    const totalPeriods = slots.length;
    const periodsByDay = slots.reduce((acc, slot) => {
      acc[slot.day] = (acc[slot.day] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const periodsBySubject = slots.reduce((acc, slot) => {
      const subjectName = slot.subject?.name || 'Unknown';
      acc[subjectName] = (acc[subjectName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const periodsByClass = slots.reduce((acc, slot) => {
      const className = slot.timetable.class?.name || 'Unknown';
      acc[className] = (acc[className] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const uniqueClasses = new Set(
      slots.map((s) => s.timetable.classId).filter(Boolean)
    ).size;

    const uniqueSubjects = new Set(
      slots.map((s) => s.subjectId).filter(Boolean)
    ).size;

    return {
      teacher: {
        id: teacher.id,
        name: `${teacher.user.firstName} ${teacher.user.lastName}`,
        email: teacher.user.email,
        department: teacher.department?.name,
      },
      workload: {
        totalPeriods,
        averagePeriodsPerDay: (totalPeriods / 5).toFixed(2), // Assuming 5 working days
        uniqueClasses,
        uniqueSubjects,
        periodsByDay,
        periodsBySubject,
        periodsByClass,
      },
    };
  }

  // ============================================
  // CONFLICT CHECKING
  // ============================================

  async checkConflicts(dto: CheckConflictDto) {
    const conflicts: any[] = [];

    // Get timetable to check school context
    const timetable = await this.prisma.timetable.findUnique({
      where: { id: dto.timetableId },
    });

    if (!timetable) {
      throw new NotFoundException('Timetable not found');
    }

    // Check for duplicate period
    const duplicatePeriod = await this.prisma.timetableSlot.findFirst({
      where: {
        timetableId: dto.timetableId,
        day: dto.day,
        id: dto.excludeSlotId ? { not: dto.excludeSlotId } : undefined,
      },
    });

    if (duplicatePeriod) {
      const hasTimeOverlap = this.timesOverlap(
        dto.startTime,
        dto.endTime,
        duplicatePeriod.startTime,
        duplicatePeriod.endTime
      );

      if (hasTimeOverlap) {
        conflicts.push({
          type: 'period',
          message: `Time slot overlaps with existing period ${duplicatePeriod.periodNumber}`,
          conflictingSlot: duplicatePeriod,
        });
      }
    }

    // Check teacher conflict
    if (dto.teacherId) {
      const teacherConflict = await this.checkTeacherConflict(
        dto.teacherId,
        dto.day,
        dto.startTime,
        dto.endTime,
        dto.timetableId,
        dto.excludeSlotId
      );

      if (teacherConflict) {
        conflicts.push({
          type: 'teacher',
          message: 'Teacher is already assigned to another class during this time',
        });
      }
    }

    // Check room conflict
    if (dto.roomId) {
      const roomConflict = await this.checkRoomConflict(
        dto.roomId,
        dto.day,
        dto.startTime,
        dto.endTime,
        dto.timetableId,
        dto.excludeSlotId
      );

      if (roomConflict) {
        conflicts.push({
          type: 'room',
          message: 'Room is already booked for another class during this time',
        });
      }
    }

    return {
      hasConflicts: conflicts.length > 0,
      conflicts,
    };
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  private async validateSlot(
    dto: Partial<CreateTimetableSlotDto>,
    schoolId: string,
    excludeId?: string
  ) {
    if (!dto.timetableId || !dto.day || !dto.periodNumber) return;

    // Check for duplicate period in same timetable
    const duplicatePeriod = await this.prisma.timetableSlot.findFirst({
      where: {
        timetableId: dto.timetableId,
        day: dto.day,
        periodNumber: dto.periodNumber,
        id: excludeId ? { not: excludeId } : undefined,
      },
    });

    if (duplicatePeriod) {
      throw new ConflictException(
        `Period ${dto.periodNumber} on ${dto.day} is already scheduled in this timetable`
      );
    }

    // Check teacher conflict (if not a break)
    if (dto.teacherId && !dto.isBreak && dto.startTime && dto.endTime) {
      const teacherConflict = await this.checkTeacherConflict(
        dto.teacherId,
        dto.day,
        dto.startTime,
        dto.endTime,
        dto.timetableId,
        excludeId
      );

      if (teacherConflict) {
        throw new ConflictException(
          'Teacher is already assigned to another class during this time'
        );
      }
    }

    // Check room conflict
    if (dto.roomId && dto.startTime && dto.endTime) {
      const roomConflict = await this.checkRoomConflict(
        dto.roomId,
        dto.day,
        dto.startTime,
        dto.endTime,
        dto.timetableId,
        excludeId
      );

      if (roomConflict) {
        throw new ConflictException(
          'Room is already booked for another class during this time'
        );
      }
    }
  }

  private async checkTeacherConflict(
    teacherId: string,
    day: WeekDay,
    startTime: string,
    endTime: string,
    currentTimetableId: string,
    excludeSlotId?: string
  ): Promise<boolean> {
    // Get all active timetables in the same school
    const currentTimetable = await this.prisma.timetable.findUnique({
      where: { id: currentTimetableId },
      select: { schoolId: true, effectiveFrom: true, effectiveTo: true },
    });

    if (!currentTimetable) return false;

    const conflicts = await this.prisma.timetableSlot.findMany({
      where: {
        teacherId,
        day,
        id: excludeSlotId ? { not: excludeSlotId } : undefined,
        timetable: {
          schoolId: currentTimetable.schoolId,
          isActive: true,
          // Check for date range overlap
          effectiveFrom: { 
            lte: currentTimetable.effectiveTo || new Date('2099-12-31') 
          },
          OR: [
            { effectiveTo: null },
            { 
              effectiveTo: { 
                gte: currentTimetable.effectiveFrom 
              } 
            },
          ],
        },
      },
    });

    return conflicts.some((slot) =>
      this.timesOverlap(startTime, endTime, slot.startTime, slot.endTime)
    );
  }

  private async checkRoomConflict(
    roomId: string,
    day: WeekDay,
    startTime: string,
    endTime: string,
    currentTimetableId: string,
    excludeSlotId?: string
  ): Promise<boolean> {
    // Get current timetable details
    const currentTimetable = await this.prisma.timetable.findUnique({
      where: { id: currentTimetableId },
      select: { schoolId: true, effectiveFrom: true, effectiveTo: true },
    });

    if (!currentTimetable) return false;

    const conflicts = await this.prisma.timetableSlot.findMany({
      where: {
        roomId,
        day,
        id: excludeSlotId ? { not: excludeSlotId } : undefined,
        timetable: {
          schoolId: currentTimetable.schoolId,
          isActive: true,
          // Check for date range overlap
          effectiveFrom: { 
            lte: currentTimetable.effectiveTo || new Date('2099-12-31') 
          },
          OR: [
            { effectiveTo: null },
            { 
              effectiveTo: { 
                gte: currentTimetable.effectiveFrom 
              } 
            },
          ],
        },
      },
    });

    return conflicts.some((slot) =>
      this.timesOverlap(startTime, endTime, slot.startTime, slot.endTime)
    );
  }

  private timesOverlap(
    start1: string,
    end1: string,
    start2: string,
    end2: string
  ): boolean {
    // Convert time strings to minutes for comparison
    const toMinutes = (time: string) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const start1Min = toMinutes(start1);
    const end1Min = toMinutes(end1);
    const start2Min = toMinutes(start2);
    const end2Min = toMinutes(end2);

    return start1Min < end2Min && end1Min > start2Min;
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  async getTimetablesBySchool(schoolId: string, isActive?: boolean) {
    return this.prisma.timetable.findMany({
      where: {
        schoolId,
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        academicYear: true,
        term: true,
        class: true,
        _count: {
          select: {
            slots: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTimetablesByClass(classId: string, isActive?: boolean) {
    return this.prisma.timetable.findMany({
      where: {
        classId,
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        academicYear: true,
        term: true,
        school: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            slots: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getActiveTimetableForClass(classId: string, date?: Date) {
    const queryDate = date || new Date();

    return this.prisma.timetable.findFirst({
      where: {
        classId,
        isActive: true,
        effectiveFrom: { lte: queryDate },
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: queryDate } },
        ],
      },
      include: {
        academicYear: true,
        term: true,
        class: true,
        slots: {
          include: {
            subject: true,
            teacher: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
            room: true,
          },
          orderBy: [
            { day: 'asc' },
            { periodNumber: 'asc' },
          ],
        },
      },
    });
  }

  async getRoomUtilization(roomId: string, startDate?: Date, endDate?: Date) {
    const slots = await this.prisma.timetableSlot.findMany({
      where: {
        roomId,
        timetable: {
          isActive: true,
          ...(startDate && {
            effectiveFrom: { lte: endDate || new Date() },
            OR: [
              { effectiveTo: null },
              { effectiveTo: { gte: startDate } },
            ],
          }),
        },
      },
      include: {
        timetable: {
          include: {
            class: true,
          },
        },
        subject: true,
      },
    });

    const utilizationByDay = slots.reduce((acc, slot) => {
      acc[slot.day] = (acc[slot.day] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      roomId,
      totalSlots: slots.length,
      utilizationByDay,
      slots,
    };
  }

  async deactivateTimetable(id: string) {
    await this.getTimetableById(id);

    return this.prisma.timetable.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async activateTimetable(id: string) {
    await this.getTimetableById(id);

    return this.prisma.timetable.update({
      where: { id },
      data: { isActive: true },
    });
  }
}