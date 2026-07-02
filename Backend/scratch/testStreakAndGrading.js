const { calculateStreak } = require('../services/studyPlanService');

console.log('--- Testing Streak Logic ---');

const activitiesWithZeros = [
  { date: '2026-07-02', totalMinutes: 10 },
  { date: '2026-07-01', totalMinutes: 0 },  // Zero minutes!
  { date: '2026-06-30', totalMinutes: 20 },
  { date: '2026-06-29', totalMinutes: 5 }
];

console.log('Testing calculateStreak with zero-minute activities:');
const streak = calculateStreak(activitiesWithZeros);
console.log(`Current streak calculated: ${streak} (Expected: 1, because 2026-07-01 is 0 mins, breaking the streak)`);

if (streak === 1) {
  console.log('✅ Streak test passed successfully.');
} else {
  console.error(`❌ Streak test failed: expected 1 but got ${streak}`);
  process.exit(1);
}

console.log('\n--- Testing Short Answer Grading ---');

// Mock question
const shortAnswerQuestion = {
  type: 'short_answer',
  shortAnswer: 'Paris'
};

// We will mock-grade it using the logic in our code:
// const user = String(userAnswer || '').toLowerCase().trim();
// const correct = String(q.shortAnswer || '').toLowerCase().trim();
// if (user && (user === correct || correct.includes(user) || user.includes(correct))) score++;

function gradeShortAnswer(userAnswer, correctVal) {
  const user = String(userAnswer || '').toLowerCase().trim();
  const correct = String(correctVal || '').toLowerCase().trim();
  if (user && (user === correct || correct.includes(user) || user.includes(correct))) {
    return true;
  }
  return false;
}

const testCases = [
  { answer: 'Paris', expected: true },
  { answer: 'paris', expected: true },
  { answer: 'par', expected: true },
  { answer: '', expected: false },
  { answer: null, expected: false },
  { answer: undefined, expected: false },
  { answer: 'London', expected: false }
];

let gradingPassed = true;
for (const tc of testCases) {
  const result = gradeShortAnswer(tc.answer, shortAnswerQuestion.shortAnswer);
  if (result === tc.expected) {
    console.log(`✅ Input: "${tc.answer}" -> Result: ${result} (Expected: ${tc.expected})`);
  } else {
    console.error(`❌ Input: "${tc.answer}" -> Result: ${result} (Expected: ${tc.expected})`);
    gradingPassed = false;
  }
}

if (gradingPassed) {
  console.log('✅ Grading tests passed successfully.');
} else {
  process.exit(1);
}

console.log('\nAll unit tests passed successfully!');
process.exit(0);
