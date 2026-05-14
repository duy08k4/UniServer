import { SetMetadata } from "@nestjs/common";

// permissions.decorator.ts
export const PERMISSION_KEY = 'uni-permissions'

export type PermissionAction = 'can_view' | 'can_create' | 'can_edit' | 'can_delete' | 'can_approve';

export const RequiredPermission = (ucKey: string, action: PermissionAction) => SetMetadata(PERMISSION_KEY, { ucKey, action });