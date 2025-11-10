import { IsString, IsArray, IsOptional, ArrayMinSize, ArrayMaxSize, IsIn } from 'class-validator';

export class GenerateReportDto {
  @IsArray()
  @ArrayMinSize(2, { message: 'At least 2 resources are required' })
  @ArrayMaxSize(10, { message: 'Maximum 10 resources allowed' })
  @IsString({ each: true })
  resourceIds!: string[];

  @IsString()
  @IsIn(['comparison', 'trend', 'learning-path', 'literature-review'])
  template!: string;

  @IsString()
  @IsOptional()
  model?: string;

  @IsString()
  userId!: string;
}
