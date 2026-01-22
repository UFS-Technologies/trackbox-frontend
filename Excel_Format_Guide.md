# Excel Upload Guide for Questions

This guide explains how to format your Excel file for the "Bulk Question Upload" feature.

## 1. Required File Format
*   **File Type**: `.xlsx` or `.xls` (Standard Excel Workbook)
*   **Sheet**: The system reads the **first sheet** of the workbook.

## 2. Column Headers (Case-Sensitive)
The first row of your Excel file **MUST** contain exactly these headers:

| Header Name | Description | Example |
| :--- | :--- | :--- |
| `question_name` | The text of the question. | What is 2 + 2? |
| `option1` | First answer choice. | 3 |
| `option2` | Second answer choice. | 4 |
| `option3` | Third answer choice. | 5 |
| `option4` | Fourth answer choice. | 6 |
| `correct_answer`| The text of the correct option. | 4 |

## 3. Important Rules
1.  **Strict Headers**: The column names `question_name`, `option1`, `option2`, `option3`, `option4`, `correct_answer` must check strictly. No spaces or different capitalization.
2.  **No IDs**: Do **NOT** include columns like `exam_id` or `course_id`. The system automatically assigns these based on the Course and Exam you select in the dropdown menu on the website.
3.  **Data Type**: Ensure your data is plain text or numbers. Avoid complex formulas or formatting.

## 4. Example Row

| question_name | option1 | option2 | option3 | option4 | correct_answer |
| :--- | :--- | :--- | :--- | :--- | :--- |
| What is the capital of France? | London | Berlin | Paris | Madrid | Paris |
