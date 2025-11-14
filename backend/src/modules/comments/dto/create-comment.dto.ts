import { IsString, IsUUID, IsOptional } from "class-validator";

/**
 * 创建评论DTO
 */
export class CreateCommentDto {
  @IsUUID()
  resourceId!: string;

  @IsString()
  content!: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;
}
