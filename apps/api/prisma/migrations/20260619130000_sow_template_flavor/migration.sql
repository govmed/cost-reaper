-- SOW template flavor (BR-7): the boilerplate style chosen at creation.
ALTER TABLE "statements_of_work" ADD COLUMN "template_flavor" TEXT NOT NULL DEFAULT 'ENTERPRISE';
