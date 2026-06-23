export type ISODate = string;
export type ISODateTime = string;
export type LessonCategory = "agent" | "engineering" | "product" | "mixed";
export type LessonStatus = "generated" | "draft" | "submitted" | "graded";
export type Difficulty = "basic" | "intermediate" | "advanced";

export type LessonSection = {
  id: string;
  title: string;
  kind: "core" | "scenario" | "pitfall" | "workflow" | "summary";
  markdown: string;
};

export type SourceNote = {
  title: string;
  url?: string;
  note: string;
  fetchedAt?: ISODateTime;
};

export type ChoiceOption = {
  id: string;
  text: string;
};

export type QuestionBase = {
  id: string;
  prompt: string;
  testsAbility: string[];
  difficulty: Difficulty;
  explanationHidden: true;
};

export type SingleChoiceQuestion = QuestionBase & {
  type: "single_choice";
  options: ChoiceOption[];
};

export type MultipleChoiceQuestion = QuestionBase & {
  type: "multiple_choice";
  options: ChoiceOption[];
};

export type JudgeQuestion = QuestionBase & {
  type: "judge";
};

export type TextQuestion = QuestionBase & {
  type: "short_answer" | "scenario" | "architecture" | "product" | "open";
  expectedAnswerShape?: string;
};

export type Question =
  | SingleChoiceQuestion
  | MultipleChoiceQuestion
  | JudgeQuestion
  | TextQuestion;

export type Lesson = {
  id: string;
  date: ISODate;
  title: string;
  category: LessonCategory;
  difficulty: Difficulty;
  estimatedMinutes: number;
  reason: string;
  objectives: string[];
  sections: LessonSection[];
  questions: Question[];
  sourceNotes: SourceNote[];
  status: LessonStatus;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
};

export type AnswerItem = {
  questionId: string;
  value: string | string[] | boolean;
};

export type UserAnswer = {
  lessonId: string;
  status: "draft" | "submitted";
  answers: AnswerItem[];
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  submittedAt?: ISODateTime;
};

export type AbilitySignal = {
  ability: string;
  delta: number;
  reason: string;
};

export type QuestionFeedback = {
  questionId: string;
  verdict: "correct" | "partially_correct" | "incorrect" | "open_ended";
  feedback: string;
  improvedAnswer?: string;
  abilitySignals: AbilitySignal[];
};

export type UserProfilePatch = {
  addKnownTopics?: any[];
  addWeakTopics?: any[];
  avoidRepeating?: string[];
  topicScoreDeltas?: Record<string, number>;
  nextRecommendedTopic?: string;
};

export type GradingResult = {
  lessonId: string;
  overall: string;
  score?: number;
  questionFeedback: QuestionFeedback[];
  strengths: string[];
  weaknesses: string[];
  improvedExpressions: string[];
  interviewReadyNotes: string[];
  followUpQuestions: string[];
  profilePatch: UserProfilePatch;
  nextRecommendedTopic: string;
  createdAt: ISODateTime;
};

export type TopicMemory = {
  topic: string;
  confidence: number;
  evidence: string;
  updatedAt: ISODateTime;
};

export type UserProfile = {
  id: string;
  role: string;
  goals: string[];
  knownTopics: TopicMemory[];
  weakTopics: TopicMemory[];
  avoidedTopics: string[];
  preferredStyle: "workbook" | "teacher" | "brief" | "case_based";
  preferredDifficulty: "light" | "standard" | "deep";
  topicScores: Record<string, number>;
  behavior: {
    lastOpenedAt?: ISODateTime;
    lastDraftUpdatedAt?: ISODateTime;
    lastAnsweredAt?: ISODateTime;
    lastSubmittedAt?: ISODateTime;
    streakDays: number;
    missedAnswerDays: number;
    averageAnswerDepth?: number;
    recentOpenDates?: ISODate[];
    recentSubmitDates?: ISODate[];
    lastLessonStatus?: LessonStatus;
  };
  nextRecommendedTopic?: string;
  updatedAt: ISODateTime;
};

export type Settings = {
  timezone: "Asia/Shanghai";
  dailyTime: string;
  topicWeights: {
    agent: number;
    engineering: number;
    product: number;
  };
  allowFreshSearch: boolean;
  aiProvider: "mock" | "openai";
  model?: string;
  updatedAt: ISODateTime;
};

export type TodayResponse = {
  lesson: Lesson | null;
  answer: UserAnswer | null;
  grading: GradingResult | null;
};

export type HistoryItem = {
  items: Lesson[];
};
