import { Controller, Post, Body } from '@nestjs/common';
import { QuickGenerateService } from './quick-generate.service';

@Controller('ai-office')
export class QuickGenerateController {
    constructor(private readonly quickGenerateService: QuickGenerateService) { }

    @Post('quick-generate')
    async quickGenerate(
        @Body()
        body: {
            prompt: string;
            autoResearch?: boolean;
            autoMedia?: boolean;
        },
    ) {
        return this.quickGenerateService.generate(body);
    }
}
