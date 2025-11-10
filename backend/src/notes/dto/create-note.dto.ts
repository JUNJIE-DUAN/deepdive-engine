import { IsString, IsUUID, IsOptional, IsArray, IsBoolean } from 'class-validator';

/**
 * 创建笔记DTO
 */
export class CreateNoteDto {
  @IsUUID()
  resourceId!: string;

  @IsString()
  content!: string;

  @IsOptional()
  @IsArray()
  highlights?: any[];

  @IsOptional()
  @IsArray()
  tags?: string[];

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
