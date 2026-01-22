const XLSX = require('xlsx');

const data = [
    {
        question_name: "What is the capital of France?",
        option1: "London",
        option2: "Berlin",
        option3: "Paris",
        option4: "Madrid",
        correct_answer: "Paris"
    },
    {
        question_name: "Which planet is known as the Red Planet?",
        option1: "Venus",
        option2: "Mars",
        option3: "Jupiter",
        option4: "Saturn",
        correct_answer: "Mars"
    }
];

const ws = XLSX.utils.json_to_sheet(data);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Questions");

XLSX.writeFile(wb, "sample_questions.xlsx");
console.log("sample_questions.xlsx created successfully");
