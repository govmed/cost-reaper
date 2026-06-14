import { Module } from '@nestjs/common';
import { WorkflowController } from './workflow.controller';
import { WorkflowService } from './workflow.service';
import { ChecklistService } from './checklist.service';
import { ChecklistRulesController } from './checklist-rules.controller';
import { ChecklistRuleSetsController } from './checklist-rule-sets.controller';

@Module({
  controllers: [WorkflowController, ChecklistRulesController, ChecklistRuleSetsController],
  providers: [WorkflowService, ChecklistService],
})
export class WorkflowModule {}
