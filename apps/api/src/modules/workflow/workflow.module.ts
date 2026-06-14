import { Module } from '@nestjs/common';
import { WorkflowController } from './workflow.controller';
import { WorkflowService } from './workflow.service';
import { ChecklistService } from './checklist.service';
import { ChecklistRulesController } from './checklist-rules.controller';

@Module({
  controllers: [WorkflowController, ChecklistRulesController],
  providers: [WorkflowService, ChecklistService],
})
export class WorkflowModule {}
