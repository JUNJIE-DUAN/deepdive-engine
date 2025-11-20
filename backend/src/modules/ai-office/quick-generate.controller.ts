import { Controller, Post, Body } from '@nestjs/common';
import { QuickGenerateService } from './quick-generate.service';
import { QuickGenerateDto } from './quick-generate.dto';

@Controller('ai-office')
export class QuickGenerateController {
    constructor(private readonly quickGenerateService: QuickGenerateService) { }

    @Post('quick-generate')
    async quickGenerate(
        @Body()
        body: QuickGenerateDto,
    ) {
        return this.quickGenerateService.generate(body);
    }
}
