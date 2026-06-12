import { Module } from '@nestjs/common';
import { WorkflowController } from './workflow.controller';
import { WorkflowService } from './workflow.service';
import { ChecklistService } from './checklist.service';

@Module({
  controllers: [WorkflowController],
  providers: [WorkflowService, ChecklistService],
})
export class WorkflowModule {}
