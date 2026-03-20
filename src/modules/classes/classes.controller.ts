import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

// Decorator
import { Roles } from "src/decorators/roles.decorator";

// DTO
import { ApproveClassDTO } from "./classes.dto";
import { Role } from "src/enums/enums";

// Guard
import { AuthGuard } from "../auth/auth.guard";
import { RoleGuard } from "../auth/role.guard";

@ApiTags("Class")
@Controller("classes")
export class ClassesController {
    // Approve class creation
    @Get('approve')
    @ApiOperation({summary:''})
    @Roles(Role.UNIADMIN)
    @UseGuards(AuthGuard, RoleGuard)
    async approveNewClass (classId: ApproveClassDTO) {
        return true
    }

    // Create a new class
    async createNewClass () {

    }

    // Remove a class
    async removeClass () {

    }

    // Join to a class
    async joinClass () {

    }

    // Update some information in class
    async updateClass () {

    }
}