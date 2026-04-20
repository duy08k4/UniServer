import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { FormsPaginationDTO, GetFormDetailDTO, NewFormDTO } from "./forms.dto";
import { isDate, isUUID } from "class-validator";
import { InjectRepository } from "@nestjs/typeorm";
import { Forms } from "src/entities/forms.en";
import { Brackets, DataSource, DeepPartial, In, Repository } from "typeorm";
import { Fields } from "src/entities/fields.en";
import { Checkbox_fields } from "src/entities/checkbox_fields.en";
import { CheckboxFieldChoices } from "src/entities/checkbox_field_choices.en";
import { ClassMembers } from "src/entities/class_members.en";
import { Classes } from "src/entities/classes.en";
import { Milestones } from "src/entities/milestones.en";
import { Notifications } from "src/entities/notifications.en";
import { Role, RoomRole, SubmissionStatus } from "src/enums/enums";
import { Users } from "src/entities/user.en";
import { Submissions } from "src/entities/submissions.en";
import { privateDecrypt } from "crypto";

@Injectable()
export class FormsService {
    constructor(
        private readonly dataSource: DataSource,
        @InjectRepository(Submissions)
        private readonly submissionRepo: Repository<Submissions>,
        @InjectRepository(Forms)
        private readonly formRepo: Repository<Forms>,
        @InjectRepository(Fields)
        private readonly fieldRepo: Repository<Fields>,
        @InjectRepository(Checkbox_fields)
        private readonly checkboxFieldRepo: Repository<Checkbox_fields>,
        @InjectRepository(CheckboxFieldChoices)
        private readonly choiceRepo: Repository<CheckboxFieldChoices>,
        @InjectRepository(ClassMembers)
        private readonly classMemberRepo: Repository<ClassMembers>,
        @InjectRepository(Classes)
        private readonly classRepo: Repository<Classes>,
        @InjectRepository(Milestones)
        private readonly milestoneRepo: Repository<Milestones>,
        @InjectRepository(Notifications)
        private readonly notificationRepo: Repository<Notifications>
    ) { }

    // Get forms (pagination) (Only system admin - uniadmin)
    async formsPagination(query: FormsPaginationDTO, req: Request | any) {
        const { classId, page, size, search, is_deleted, is_stopped } = query

        if (!page || !size) throw new BadRequestException("Invalid data")

        // Check client's role
        const client = req.userData
        if (client.role !== Role.UNIADMIN) {
            if (!classId) throw new ForbiddenException("Class not found")

            const isRoomadmin = await this.classMemberRepo.findOne({
                where: {
                    role: RoomRole.ROOMADMIN,
                    user: {
                        id: client.id
                    },
                    class: {
                        id: classId
                    }
                }
            })

            if (!isRoomadmin) throw new ForbiddenException("Access denied")
        }

        const pageNum = parseInt(page);
        const sizeNum = parseInt(size);
        const skip = (pageNum - 1) * sizeNum;

        const queryBuilder = this.formRepo.createQueryBuilder('form')
            .leftJoin('form.createdBy', 'createdBy')
            .leftJoin('form.class', 'class')
            .select([
                'form',
                'createdBy.id', 'createdBy.full_name', 'createdBy.email',
                'class.id', 'class.label'
            ])
            .skip(skip)
            .take(sizeNum)
            .orderBy('form.label', 'ASC');

        if (classId) {
            queryBuilder.andWhere('class.id = :classId', { classId });
        }

        // Filter by deleted/stopped status
        if (is_deleted !== undefined) {
            queryBuilder.andWhere('form.is_deleted = :is_deleted', { is_deleted });
        }
        if (is_stopped !== undefined) {
            queryBuilder.andWhere('form.is_stopped = :is_stopped', { is_stopped });
        }

        // General search (label or description)
        if (search) {
            queryBuilder.andWhere(
                new Brackets((qb) => {
                    qb.where('form.label ILIKE :search', { search: `%${search}%` })
                        .orWhere('form.description ILIKE :search', { search: `%${search}%` })
                        .orWhere('class.label ILIKE :search', { search: `%${search}%` })
                        .orWhere('class.subject ILIKE :search', { search: `%${search}%` })
                }),
            );
        }

        const [data, total] = await queryBuilder.getManyAndCount();

        return {
            data,
            pagination: {
                total,
                page: pageNum,
                size: sizeNum,
                totalPages: Math.ceil(total / sizeNum)
            }
        };
    }

    // Get form detail
    async getFormDetail(query: GetFormDetailDTO, req: Request | any) {
        const { classId, formId } = query

        if (!classId || !formId) throw new BadRequestException("Invalid data")

        const client = req.userData

        /*
            Check 3 conditions:
            - The class's existance
            - The client is a member
            - There is the form's existance in the class
        */
        const isMember = await this.classRepo.findOne({
            where: {
                id: classId,
                forms: {
                    id: formId
                },
                members: {
                    user: { id: client.id }
                }
            }
        })

        if (!isMember) throw new ForbiddenException("Access denied")

        // Get data
        const formData = await this.formRepo.findOne({
            select: {
                class: {
                    id: true,
                    join_code: true,
                    label: true,
                    description: true,
                    subject: true
                },
                createdBy: {
                    id: true,
                    full_name: true,
                    email: true
                },
                milestone: {
                    id: true,
                    label: true
                },
                notification: {
                    id: true
                }
            },
            relations: {
                milestone: true,
                notification: true,
                class: true,
                createdBy: true,
                fields: true,
                checkboxFields: {
                    checkbox_field_choices: true
                }
            },
            where: {
                id: formId,
                class: {
                    id: classId
                }
            }
        })

        if (!formData) throw new NotFoundException("The form does not exist")

        return formData
    }

    // Get submission
    async getSubmission(query: GetFormDetailDTO, req: Request | any) {
        const { classId, formId } = query

        if (!classId || !formId) throw new BadRequestException("Invalid data")

        // Check client's role
        const client = req.userData

        if (client.role !== Role.UNIADMIN) {
            /*
                Check 3 conditions:
                - The class's existance
                - The client's role in the class
                - The form's existance
            */
            const isRoomadmin = await this.classRepo.findOne({
                where: {
                    id: classId,
                    members: {
                        user: { id: client.id },
                        role: RoomRole.ROOMADMIN
                    },
                    forms: {
                        id: formId
                    }
                }
            })

            if (!isRoomadmin) throw new ForbiddenException("Access denied")
        }

        // Get data
        const submission = await this.submissionRepo.find({
            select: {
                form: {
                    id: true,
                    label: true,
                    field_count: true,
                    update_at: true,
                    created_at: true,
                    createdBy: {
                        id: true,
                        full_name: true,
                        email: true
                    }
                },
                user: {
                    id: true,
                    full_name: true,
                    email: true,
                    role: true
                },
                checkboxes: {
                    id: true,
                    fieldChoices: { id: true }
                }
            },
            relations: {
                form: {
                    createdBy: true
                },
                user: true,
                answers: true,
                checkboxes: {
                    fieldChoices: true
                }
            },
            where: {
                form: {
                    id: formId,
                    class: {
                        id: classId
                    }
                }
            }
        })

        if (submission.length === 0) throw new NotFoundException("No submissions have been received yet")

        return submission
    }

    // Create new form
    async updateNewForm(body: NewFormDTO, req: Request | any) {
        const {
            classId, milestoneId, notificationId, formId,
            label, description,
            is_auto_close, is_auto_open, is_join_form,
            close_at, open_at,
            field_count,
            fields,
            checkboxFields
        } = body

        // --- Authorization ---
        const userRole = req.role
        const userId = req.userData.id

        if (userRole !== Role.UNIADMIN) {
            const member = await this.classMemberRepo.findOne({
                where: {
                    user: { id: userId },
                    class: { id: classId }
                }
            })

            if (!member || member.role !== RoomRole.ROOMADMIN) {
                throw new ForbiddenException("Only UniAdmin or RoomAdmin can create/update forms")
            }
        }

        // --- Validation & UUID Check ---
        const idToCheck = [classId, milestoneId, notificationId, formId].filter(id => id) as string[];
        for (const id of idToCheck) {
            if (!isUUID(id)) throw new BadRequestException(`Invalid ID format: ${id}`)
        }

        for (const f of fields) {
            if (f.fieldId && !isUUID(f.fieldId)) throw new BadRequestException(`Invalid field ID format: ${f.fieldId}`)
        }

        for (const cf of checkboxFields) {
            if (cf.checkboxFieldId && !isUUID(cf.checkboxFieldId)) throw new BadRequestException(`Invalid checkboxField ID format: ${cf.checkboxFieldId}`)
            for (const c of cf.checkbox_field_choices) {
                if (c.choiceId && !isUUID(c.choiceId)) throw new BadRequestException(`Invalid choice ID format: ${c.choiceId}`)
            }
        }

        if (typeof is_join_form === "boolean" && is_join_form) {
            const anyJoinForm = await this.formRepo.findOne({
                where: {
                    is_join_form: true,
                    class: {
                        id: classId
                    }
                }
            })

            if (anyJoinForm) throw new ConflictException("Only one start form in one class")
        }

        if (!label || typeof is_auto_open !== "boolean" || typeof is_auto_close !== "boolean" ||
            Number(field_count) !== (fields.length + checkboxFields.length)) {
            throw new BadRequestException("Invalid basic data")
        }

        if (open_at && close_at && new Date(open_at) >= new Date(close_at)) {
            throw new BadRequestException("Open time must be before close time")
        }

        // Check index consistency
        const allIndices = [...fields.map(f => Number(f.index)), ...checkboxFields.map(cf => Number(cf.index))].sort((a, b) => a - b);
        if (allIndices.length > 0) {
            if (allIndices[0] !== 1) throw new BadRequestException("Field index must start from 1");
            for (let i = 0; i < allIndices.length; i++) {
                if (allIndices[i] !== i + 1) throw new BadRequestException("Field indices must be continuous and unique");
            }
        }

        // --- Transaction ---
        return await this.dataSource.transaction(async (manager) => {
            let form: Forms;

            if (formId) {
                const existingForm = await manager.findOne(Forms, {
                    where: { id: formId },
                    relations: ['fields', 'checkboxFields', 'checkboxFields.checkbox_field_choices']
                });
                if (!existingForm) throw new NotFoundException("Form not found");
                form = existingForm;

                form.label = label;
                form.description = description ?? null;
                form.is_auto_open = is_auto_open;
                form.is_join_form = is_join_form;
                form.is_auto_close = is_auto_close;
                form.open_at = open_at ? new Date(open_at) : null as any;
                form.close_at = close_at ? new Date(close_at) : null as any;
                form.field_count = Number(field_count);
                form.milestone = milestoneId ? { id: milestoneId } as Milestones : null;
                form.notification = notificationId ? { id: notificationId } as Notifications : null;
            } else {
                const formData: DeepPartial<Forms> = {
                    label,
                    description: description ?? null,
                    is_auto_open,
                    is_auto_close,
                    is_join_form,
                    open_at: open_at ? new Date(open_at) : null,
                    close_at: close_at ? new Date(close_at) : null,
                    field_count: Number(field_count),
                    class: { id: classId } as Classes,
                    milestone: milestoneId ? { id: milestoneId } as Milestones : null,
                    notification: notificationId ? { id: notificationId } as Notifications : null,
                    createdBy: { id: userId } as Users
                };
                form = manager.create(Forms, formData);
            }

            const savedForm = await manager.save(Forms, form);

            // --- Sync Fields & CheckboxFields ---

            // Handle Fields
            const existingFieldIds = form.fields?.map(f => f.id) || [];
            const incomingFieldIds = fields.map(f => f.fieldId).filter(id => id) as string[];
            const fieldsToDelete = existingFieldIds.filter(id => !incomingFieldIds.includes(id));
            if (fieldsToDelete.length > 0) await manager.delete(Fields, fieldsToDelete);

            for (const f of fields) {
                const fieldData: DeepPartial<Fields> = {
                    index: Number(f.index),
                    label: f.label,
                    title: f.title,
                    description: f.description ?? null,
                    input_type: f.input_type,
                    is_required: f.is_required,
                    unit: f.unit,
                    max_attempts: Number(f.max_attempts),
                    min_attempts: Number(f.min_attempts),
                    form: savedForm
                };
                if (f.fieldId) {
                    await manager.update(Fields, f.fieldId, fieldData as any);
                } else {
                    await manager.save(Fields, manager.create(Fields, fieldData));
                }
            }

            // Handle Checkbox Fields
            const existingCFIds = form.checkboxFields?.map(cf => cf.id) || [];
            const incomingCFIds = checkboxFields.map(cf => cf.checkboxFieldId).filter(id => id) as string[];
            const cfToDelete = existingCFIds.filter(id => !incomingCFIds.includes(id));
            if (cfToDelete.length > 0) await manager.delete(Checkbox_fields, cfToDelete);

            for (const cf of checkboxFields) {
                const cfData: DeepPartial<Checkbox_fields> = {
                    index: Number(cf.index),
                    label: cf.label,
                    description: cf.description ?? null,
                    choice_count: Number(cf.choice_count),
                    is_required: cf.is_required,
                    is_multiple: cf.is_multiple,
                    form: savedForm
                };

                let currentCF: Checkbox_fields;
                if (cf.checkboxFieldId) {
                    await manager.update(Checkbox_fields, cf.checkboxFieldId, cfData as any);
                    const updatedCF = await manager.findOne(Checkbox_fields, {
                        where: { id: cf.checkboxFieldId },
                        relations: ['checkbox_field_choices']
                    });
                    if (!updatedCF) throw new NotFoundException(`Checkbox field ${cf.checkboxFieldId} not found`);
                    currentCF = updatedCF;
                } else {
                    currentCF = await manager.save(Checkbox_fields, manager.create(Checkbox_fields, cfData));
                }

                // Sync Choices
                const existingChoiceIds = currentCF.checkbox_field_choices?.map(c => c.id) || [];
                const incomingChoiceIds = cf.checkbox_field_choices.map(c => c.choiceId).filter(id => id) as string[];
                const choicesToDelete = existingChoiceIds.filter(id => !incomingChoiceIds.includes(id));
                if (choicesToDelete.length > 0) await manager.delete(CheckboxFieldChoices, choicesToDelete);

                for (const choice of cf.checkbox_field_choices) {
                    const choiceData: DeepPartial<CheckboxFieldChoices> = {
                        index: Number(choice.index),
                        body: choice.body,
                        checkbox_field: currentCF
                    };
                    if (choice.choiceId) {
                        await manager.update(CheckboxFieldChoices, choice.choiceId, {
                            index: choiceData.index,
                            body: choiceData.body
                        } as any);
                    } else {
                        await manager.save(CheckboxFieldChoices, manager.create(CheckboxFieldChoices, choiceData));
                    }
                }
            }

            return await manager.findOne(Forms, {
                where: { id: savedForm.id },
                relations: ['fields', 'checkboxFields', 'checkboxFields.checkbox_field_choices', 'milestone', 'notification']
            });
        });
    }

    // Remove form (single or multi)
    async removeForms(ids: string[], req: Request | any) {
        const client = req.userData;
        const clientRole = req.role;
        const filterFormIds = ids.filter(id => id.trim() !== "");

        if (filterFormIds.length === 0) throw new BadRequestException("Data is invalid");

        // 1. Authorization check
        if (clientRole !== Role.UNIADMIN) {
            const formsCount = await this.formRepo.count({
                where: {
                    id: In(filterFormIds),
                    class: {
                        members: {
                            user: { id: client.id },
                            role: RoomRole.ROOMADMIN
                        }
                    }
                }
            });

            if (formsCount !== filterFormIds.length) {
                throw new ForbiddenException("Access denied or you don't own some of these forms");
            }
        }

        // 2. Classify forms: Soft Delete or Hard Delete
        const softDeleteQuery = this.formRepo.createQueryBuilder("f")
            .select("f.id")
            .where("f.id IN (:...ids)", { ids: filterFormIds })
            .andWhere(new Brackets(qb => {
                // Check Submission status 'accept'
                qb.where(sub_qb => {
                    const subQuery = sub_qb.subQuery()
                        .select("1")
                        .from("submissions", "s")
                        .where("s.form_id = f.id")
                        .andWhere("s.status::text = :status")
                        .getQuery();
                    return `EXISTS (${subQuery})`;
                })
                    // Check ScoreForm status 'accept'
                    .orWhere(sub_qb => {
                        const subQuery = sub_qb.subQuery()
                            .select("1")
                            .from("score_forms", "sf")
                            .where("sf.milestone = f.milestone")
                            .andWhere("sf.status::text = :status")
                            .getQuery();
                        return `EXISTS (${subQuery})`;
                    });
            }))
            .setParameter("status", SubmissionStatus.ACCEPT);

        const softDeleteForms = await softDeleteQuery.getMany();
        const softDeleteIds = softDeleteForms.map(f => f.id);
        const hardDeleteIds = filterFormIds.filter(id => !softDeleteIds.includes(id));

        // 3. Perform Deletion in Transaction
        return await this.dataSource.transaction(async (manager) => {
            if (softDeleteIds.length > 0) {
                await manager.update(Forms, { id: In(softDeleteIds) }, { is_deleted: true });
            }

            if (hardDeleteIds.length > 0) {
                await manager.delete(Forms, { id: In(hardDeleteIds) });
            }

            return {
                deleted_ids: filterFormIds,
                soft_deleted: softDeleteIds,
                hard_deleted: hardDeleteIds
            };
        });
    }

    // Remove fields (field and checkbox_field)
    async removeFields(ids: string[], req: Request | any) {
        const client = req.userData;
        const clientRole = req.role;
        const filterFieldIds = ids.filter(id => id.trim() !== "");

        if (filterFieldIds.length === 0) throw new BadRequestException("Data is invalid");

        // 1. Authorization check
        if (clientRole !== Role.UNIADMIN) {
            // Check Fields
            const fieldCount = await this.fieldRepo.count({
                where: {
                    id: In(filterFieldIds),
                    form: {
                        class: {
                            members: {
                                user: { id: client.id },
                                role: RoomRole.ROOMADMIN
                            }
                        }
                    }
                }
            });

            // Check Checkbox Fields
            const checkboxFieldCount = await this.checkboxFieldRepo.count({
                where: {
                    id: In(filterFieldIds),
                    form: {
                        class: {
                            members: {
                                user: { id: client.id },
                                role: RoomRole.ROOMADMIN
                            }
                        }
                    }
                }
            });

            if ((fieldCount + checkboxFieldCount) !== filterFieldIds.length) {
                throw new ForbiddenException("Access denied or you don't own some of these fields");
            }
        }

        // 2. Classify: Soft Delete or Hard Delete
        // Logic: Soft delete if parent form has any 'accept' submission
        const softDeleteFieldsQuery = this.fieldRepo.createQueryBuilder("f")
            .select("f.id")
            .where("f.id IN (:...ids)", { ids: filterFieldIds })
            .andWhere(qb => {
                const subQuery = qb.subQuery()
                    .select("1")
                    .from("submissions", "s")
                    .where("s.form_id = f.form")
                    .andWhere("s.status::text = :status")
                    .getQuery();
                return `EXISTS (${subQuery})`;
            })
            .setParameter("status", SubmissionStatus.ACCEPT);

        const softDeleteCheckboxFieldsQuery = this.checkboxFieldRepo.createQueryBuilder("cf")
            .select("cf.id")
            .where("cf.id IN (:...ids)", { ids: filterFieldIds })
            .andWhere(qb => {
                const subQuery = qb.subQuery()
                    .select("1")
                    .from("submissions", "s")
                    .where("s.form_id = cf.form")
                    .andWhere("s.status::text = :status")
                    .getQuery();
                return `EXISTS (${subQuery})`;
            })
            .setParameter("status", SubmissionStatus.ACCEPT);

        const softDeleteFields = await softDeleteFieldsQuery.getMany();
        const softDeleteCheckboxFields = await softDeleteCheckboxFieldsQuery.getMany();

        const softDeleteIds = [...softDeleteFields.map(f => f.id), ...softDeleteCheckboxFields.map(cf => cf.id)];
        const hardDeleteIds = filterFieldIds.filter(id => !softDeleteIds.includes(id));

        // Get actual types for hard delete to use correct repository
        const hardDeleteFields = await this.fieldRepo.find({ where: { id: In(hardDeleteIds) }, select: ['id'] });
        const hardDeleteFieldIds = hardDeleteFields.map(f => f.id);
        const hardDeleteCheckboxFieldIds = hardDeleteIds.filter(id => !hardDeleteFieldIds.includes(id));

        // 3. Perform Deletion in Transaction
        return await this.dataSource.transaction(async (manager) => {
            if (softDeleteIds.length > 0) {
                // Determine which are fields and which are checkbox fields for update
                const softFields = softDeleteFields.map(f => f.id);
                const softCheckboxFields = softDeleteCheckboxFields.map(cf => cf.id);

                if (softFields.length > 0) await manager.update(Fields, { id: In(softFields) }, { is_deleted: true });
                if (softCheckboxFields.length > 0) await manager.update(Checkbox_fields, { id: In(softCheckboxFields) }, { is_deleted: true });
            }

            if (hardDeleteFieldIds.length > 0) {
                await manager.delete(Fields, { id: In(hardDeleteFieldIds) });
            }

            if (hardDeleteCheckboxFieldIds.length > 0) {
                await manager.delete(Checkbox_fields, { id: In(hardDeleteCheckboxFieldIds) });
            }

            return {
                deleted_ids: filterFieldIds,
                soft_deleted: softDeleteIds,
                hard_deleted: hardDeleteIds
            };
        });
    }
}
