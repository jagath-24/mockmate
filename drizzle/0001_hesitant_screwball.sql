CREATE TABLE `answers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`questionId` int NOT NULL,
	`answerText` text NOT NULL,
	`timeSpentSeconds` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `answers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `evaluations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`answerId` int NOT NULL,
	`correctness` int NOT NULL,
	`clarity` int NOT NULL,
	`depth` int NOT NULL,
	`communication` int NOT NULL,
	`rationale` text NOT NULL,
	`isShallow` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `evaluations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `interview_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`role` varchar(120) NOT NULL,
	`difficulty` varchar(40) NOT NULL,
	`interviewType` varchar(60) NOT NULL,
	`questionCount` int NOT NULL,
	`status` enum('in_progress','completed') NOT NULL DEFAULT 'in_progress',
	`currentQuestionIndex` int NOT NULL DEFAULT 0,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `interview_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `questions_asked` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`sequence` int NOT NULL,
	`questionText` text NOT NULL,
	`category` varchar(80) NOT NULL,
	`isFollowup` boolean NOT NULL DEFAULT false,
	`answeredAt` timestamp,
	CONSTRAINT `questions_asked_id` PRIMARY KEY(`id`)
);
