import { IsString, IsBoolean, IsOptional, MaxLength } from "class-validator";

export class CreateCollectionDto {
  @IsString()
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
