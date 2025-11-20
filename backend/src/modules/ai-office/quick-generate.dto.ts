import { IsString, IsBoolean, IsOptional, MinLength } from 'class-validator';

export class QuickGenerateDto {
    @IsString()
    @MinLength(10)
    prompt: string;

    @IsBoolean()
    @IsOptional()
    autoResearch?: boolean;

    @IsBoolean()
    @IsOptional()
    autoMedia?: boolean;
}
