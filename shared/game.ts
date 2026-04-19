export const AVATARS = [
  { key: "pineapple", name: "PINEAPPLE", emoji: "🍍" },
  { key: "apple", name: "APPLE", emoji: "🍎" },
  { key: "turtle", name: "TURTLE", emoji: "🐢" },
  { key: "grape", name: "GRAPE", emoji: "🍇" },
  { key: "watermelon", name: "WATERMELON", emoji: "🍉" },
  { key: "cherry", name: "CHERRY", emoji: "🍒" },
  { key: "lemon", name: "LEMON", emoji: "🍋" },
  { key: "mango", name: "MANGO", emoji: "🥭" },
] as const;

export type AvatarKey = (typeof AVATARS)[number]["key"];

export const QUESTION_BANK = [
  "You meet your 18-year-old self for 5 seconds — what do you say?",
  "If you could relive one day of your life, which would it be and why?",
  "What's a belief you held strongly 5 years ago that you no longer hold?",
  "Describe a moment when you felt completely out of place.",
  "What's something you've never told anyone about yourself?",
  "If you could swap lives with someone for a week, who would it be and why?",
  "What's the most spontaneous thing you've ever done?",
  "What's a small thing that makes your day noticeably better?",
  "If you could only eat one meal for the rest of your life, what would it be?",
  "What's the best advice you've ever received, and did you take it?",
  "Describe your perfect Saturday morning in detail.",
  "What's something you're irrationally afraid of?",
  "If you could instantly master one skill, what would it be?",
  "What's the most embarrassing song you genuinely love?",
  "What would you do differently if you knew no one was watching?",
  "What's a movie or book that genuinely changed how you see the world?",
  "What's the weirdest dream you can remember?",
  "If you had to live in a different era, which would you choose?",
  "What's something you do that you know is irrational but can't stop?",
  "What's the most important lesson you learned the hard way?",
] as const;

export const MAX_WORDS = 250;
export const TOTAL_ROUNDS = 3;
export const PLAYERS_PER_ROOM = 2; // human players
