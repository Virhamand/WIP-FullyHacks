CREATE TABLE `game_answers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roundId` int NOT NULL,
	`roomId` int NOT NULL,
	`authorId` varchar(64) NOT NULL,
	`isAi` boolean NOT NULL DEFAULT false,
	`answerText` text NOT NULL,
	`submittedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `game_answers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `game_players` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomId` int NOT NULL,
	`sessionId` varchar(64) NOT NULL,
	`playerName` varchar(64) NOT NULL,
	`avatarKey` varchar(32) NOT NULL,
	`isReady` boolean NOT NULL DEFAULT false,
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `game_players_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `game_pointings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roundId` int NOT NULL,
	`roomId` int NOT NULL,
	`pointerId` varchar(64) NOT NULL,
	`suspectId` varchar(64) NOT NULL,
	`explanation` text,
	`submittedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `game_pointings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `game_rooms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomCode` varchar(8) NOT NULL,
	`status` enum('lobby','question','pointing','voting','results') NOT NULL DEFAULT 'lobby',
	`currentRound` tinyint NOT NULL DEFAULT 0,
	`aiPlayerId` varchar(16) NOT NULL,
	`aiAvatarKey` varchar(32) NOT NULL,
	`aiName` varchar(64) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `game_rooms_id` PRIMARY KEY(`id`),
	CONSTRAINT `game_rooms_roomCode_unique` UNIQUE(`roomCode`)
);
--> statement-breakpoint
CREATE TABLE `game_rounds` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomId` int NOT NULL,
	`roundNumber` tinyint NOT NULL,
	`question` text NOT NULL,
	`status` enum('answering','pointing','done') NOT NULL DEFAULT 'answering',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `game_rounds_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `game_votes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomId` int NOT NULL,
	`voterId` varchar(64) NOT NULL,
	`suspectId` varchar(64) NOT NULL,
	`explanation` text,
	`submittedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `game_votes_id` PRIMARY KEY(`id`)
);
